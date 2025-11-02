import React, { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Boardle from './Boardle';
// import MarketMover from './MarketMover';

const Dashboard = () => {
  const { session, userProfile, signOut, fetchUserProfile } = UserAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mobile responsiveness state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle Google Sheets Events Fetching + Setting
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false); // Close mobile menu on desktop
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced leaderboard fetch with comprehensive tiebreaker system and better error handling
  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching leaderboard..."); 
      
      // First, let's check the basic profiles table structure
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log("All profiles in database:", allProfiles);
      console.log("Profiles table error:", allError);
      
      if (allError) {
        console.error("Error fetching all profiles:", allError);
        setLeaderboard([]);
        return;
      }

      // Check if we have any profiles at all
      if (!allProfiles || allProfiles.length === 0) {
        console.log("No profiles found in database");
        setLeaderboard([]);
        return;
      }

      // Try the complex query with games_played
      let leaderboardData;
      try {
        const { data: complexData, error: complexError } = await supabase
          .from('profiles')
          .select(`
            id, 
            username, 
            weekly_points, 
            total_points, 
            created_at,
            (SELECT COUNT(*) FROM boardle_games WHERE boardle_games.user_id = profiles.id) as games_played
          `)
          .order('weekly_points', { ascending: false })
          .order('total_points', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10);
        
        if (complexError) {
          console.error("Complex query failed:", complexError);
          throw complexError;
        }
        
        leaderboardData = complexData;
        console.log("Complex query succeeded:", leaderboardData);
        
      } catch (complexQueryError) {
        console.log("Complex query failed, falling back to simple query");
        
        // Fallback to simple query without games_played subquery
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('id, username, weekly_points, total_points, created_at')
          .order('weekly_points', { ascending: false })
          .order('total_points', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10);
        
        if (simpleError) {
          console.error("Simple query also failed:", simpleError);
          setLeaderboard([]);
          return;
        }
        
        // Manually fetch games_played for each user
        leaderboardData = await Promise.all(
          simpleData.map(async (user) => {
            try {
              const { count, error: countError } = await supabase
                .from('boardle_games')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
              
              return {
                ...user,
                games_played: countError ? 0 : (count || 0)
              };
            } catch (err) {
              return {
                ...user,
                games_played: 0
              };
            }
          })
        );
        
        console.log("Fallback query with manual games_played:", leaderboardData);
      }
      
      setLeaderboard(leaderboardData || []);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Data for Events from Google Sheet
  const fetchEventsFromGoogleSheet = async () => {
    try {
      setEventsLoading(true);
      console.log('Starting to fetch events from Google Sheet...');
      
      const SHEET_ID = '1CQipIDKw9g7MqyU4ypklle6-XUlwrzYxQWDtbx8KBvo';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
      
      console.log('Fetching from URL:', csvUrl);
      
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('Raw CSV data:', csvText);
      
      // Parse CSV data
      const lines = csvText.split('\n');
      
      if (lines.length < 2) {
        console.log('No data rows found in CSV');
        setEvents([]);
        return;
      }
      
      const eventsData = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          console.log(`Processing line ${index + 1}:`, line);
          
          // Better CSV parsing to handle commas in quotes
          const values = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add the last value
          
          return {
            name: values[0]?.replace(/"/g, '') || '',
            date: values[1]?.replace(/"/g, '') || '',
            startTime: values[2]?.replace(/"/g, '') || '',
            endTime: values[3]?.replace(/"/g, '') || '',
            location: values[4]?.replace(/"/g, '') || '',
            additionalInfo: values[5]?.replace(/"/g, '') || ''
          };
        })
        .filter(event => {
          const isValid = event.name && event.date;
          console.log('Event validation:', event, 'Valid:', isValid);
          return isValid;
        });
      
      console.log('Parsed events data:', eventsData);
      
      // **FIXED DATE FILTERING** - Now properly handles today and past events
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const oneWeeksFromToday = new Date(today);
      oneWeeksFromToday.setDate(today.getDate() + 7); // 7 days from today

      console.log('Date filtering:', {
        today: today.toDateString(),
        oneWeeksFromToday: oneWeeksFromToday.toDateString()
      });
      
      const filteredEvents = eventsData.filter(event => {
        const eventDate = parseEventDate(event.date);
        
        // **KEY FIX**: Include today (>=) and exclude past events
        const isToday = eventDate.getTime() === today.getTime();
        const isFuture = eventDate > today;
        const isWithinOneWeek = eventDate <= oneWeeksFromToday;
        const shouldInclude = (isToday || isFuture) && isWithinOneWeek;

        console.log('Date check:', {
          eventName: event.name,
          eventDateStr: event.date,
          eventDate: eventDate.toDateString(),
          today: today.toDateString(),
          isToday,
          isFuture,
          isWithinOneWeek,
          shouldInclude
        });
        
        return shouldInclude;
      });
      
      // Sort events by date
      filteredEvents.sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
      
      console.log('Final filtered and sorted events:', filteredEvents);
      setEvents(filteredEvents);
      
    } catch (error) {
      console.error('Error fetching events from Google Sheet:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Helper function to parse event dates
  const parseEventDate = (dateStr) => {
    const currentYear = new Date().getFullYear();
    let eventDate;
    
    // Handle different date formats
    if (dateStr.includes('-')) {
      // Format: 2024-10-29
      eventDate = new Date(dateStr);
    } else {
      // Format: Oct 29
      eventDate = new Date(`${dateStr}, ${currentYear}`);
    }
    
    // Set to start of day for accurate comparison
    eventDate.setHours(0, 0, 0, 0);
    return eventDate;
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile(session.user.id);
      fetchLeaderboard();
      fetchEventsFromGoogleSheet();
    }
  }, [session]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.log(error);
    }
  };

  const openWebsite = () => {
    window.open('https://sites.google.com/umn.edu/carlsonug/student-life/business-board', '_blank');
  };

  const openInstagram = () => {
    window.open('https://instagram.com/carlsonbboard', '_blank');
  };

  // Helper function to add event to Google Calendar
  const addToGoogleCalendar = (eventTitle, eventDate, startTime, endTime, location) => {
    // Parse the date and time
    const year = new Date().getFullYear();
    const eventDateTime = new Date(`${eventDate}, ${year} ${startTime}`);
    const endDateTime = new Date(`${eventDate}, ${year} ${endTime}`);
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format)
    const formatDateForGoogle = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateFormatted = formatDateForGoogle(eventDateTime);
    const endDateFormatted = formatDateForGoogle(endDateTime);

    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateFormatted}/${endDateFormatted}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(`Carlson Business Board Event: ${eventTitle}`)}`;
    
    // Open Google Calendar in a new tab
    window.open(googleCalendarUrl, '_blank');
  };

  // Helper function to determine row styling
  const getRowStyling = (user, index, currentUserId) => {
    const isCurrentUser = user.id === currentUserId;
    const isTopThree = index < 3;
    
    if (isCurrentUser) {
      return {
        backgroundColor: 'var(--umn-maroon)',
        color: 'white'
      };
    } else if (isTopThree) {
      return {
        backgroundColor: 'var(--umn-gold)',
        color: 'var(--umn-maroon)'
      };
    } else {
      return {
        backgroundColor: 'var(--panel)',
        color: 'var(--umn-maroon)'
      };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b-2" style={{ 
        backgroundColor: 'var(--panel)', 
        borderColor: 'var(--umn-gold)' 
      }}>
        {/* Mobile Layout: Title above buttons */}
        {isMobile ? (
          <div className="space-y-3">
            {/* Title Row */}
            <div className="flex justify-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--umn-maroon)' }}>
                Carlson Games
              </h1>
            </div>
            
            {/* Buttons Row */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--umn-maroon)',
                  color: 'white'
                }}
                aria-label="Toggle menu"
              >
                <span className="text-xl">☰</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={openWebsite}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--umn-maroon)',
                    borderColor: 'var(--umn-maroon)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--umn-maroon)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--umn-maroon)';
                  }}
                >
                  Website
                </button>
                
                <button
                  onClick={openInstagram}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--umn-maroon)',
                    borderColor: 'var(--umn-maroon)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--umn-maroon)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--umn-maroon)';
                  }}
                >
                  IG
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                  style={{
                    backgroundColor: 'var(--umn-gold)',
                    color: 'var(--umn-maroon)',
                    borderColor: 'var(--umn-gold)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--umn-gold-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--umn-gold)';
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout: Original horizontal layout */
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--umn-maroon)' }}>
              Carlson Games
            </h1>
            
            <div className="flex gap-3">
              <button
                onClick={openWebsite}
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--umn-maroon)',
                  borderColor: 'var(--umn-maroon)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--umn-maroon)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--umn-maroon)';
                }}
              >
                Website
              </button>
              
              <button
                onClick={openInstagram}
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--umn-maroon)',
                  borderColor: 'var(--umn-maroon)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--umn-maroon)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--umn-maroon)';
                }}
              >
                Instagram
              </button>
              
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2 min-h-[44px]"
                style={{
                  backgroundColor: 'var(--umn-gold)',
                  color: 'var(--umn-maroon)',
                  borderColor: 'var(--umn-gold)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--umn-gold-dark)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--umn-gold)';
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} min-h-screen`}>
        {/* Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Left Sidebar - Responsive */}
        <aside className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 relative'
          } border-r-2 p-4 md:p-6 overflow-y-auto
        `} style={{ 
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--umn-gold)'
        }}>
          
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="mb-4 p-2 rounded-lg md:hidden w-full min-h-[44px]"
              style={{ 
                backgroundColor: 'var(--umn-maroon)', 
                color: 'white' 
              }}
            >
              ✕ Close Menu
            </button>
          )}

          {/* Image */}
          <div className="mb-6">
            <img 
              src="/image.webp" 
              alt="Carlson Business Board" 
              className="w-full rounded-lg"
            />
            {/* Fallback placeholder */}
            <div 
              className={`w-full ${isMobile ? 'h-32' : 'h-40'} rounded-lg flex items-center justify-center text-white font-medium text-center px-2`}
              style={{ backgroundColor: 'var(--umn-maroon)', display: 'none' }}
            >
              Carlson Business Board
            </div>
          </div>

          {/* Updates Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 border-b pb-2" 
                style={{ 
                  color: 'var(--umn-maroon)',
                  borderColor: 'var(--umn-gold)'
                }}>
              Updates
            </h3>
            <div className="space-y-3">
              {/* Block for an Update*/}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-sm" style={{ color: 'var(--umn-maroon-ink)' }}>
                  🎉 Welcome to Carlson Games!
                </p>
              </div>
              {/* Block for an Update*/}

              {/* Enter new updates here */}

            </div>
          </div>
          

          {/* Scheduled Events */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2" 
                style={{ 
                  color: 'var(--umn-maroon)',
                  borderColor: 'var(--umn-gold)'
                }}>
              Upcoming Events
            </h3>

            <div className="space-y-3">
              {eventsLoading ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--umn-maroon-ink)' }}>
                    Loading events...
                  </p>
                </div>
              ) : events.length === 0 ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--umn-maroon-ink)' }}>
                    No upcoming events in the next two weeks.
                  </p>
                </div>
              ) : (
                events.map((event, index) => (
                  <div 
                    key={`event-${index}`}
                    className="event-card p-3 rounded-lg cursor-pointer" 
                    style={{ backgroundColor: 'var(--surface)' }}
                    onClick={() => addToGoogleCalendar(
                      event.name,
                      event.date,
                      event.startTime,
                      event.endTime,
                      event.location
                    )}
                  >
                    <p className="font-medium text-sm" style={{ color: 'var(--umn-maroon)' }}>
                      {event.name} - {event.date}
                    </p>
                    <p className="text-xs text-gray-600">{event.location}</p>
                    <p className="text-xs text-gray-600">{event.startTime} - {event.endTime}</p>
                    {event.additionalInfo && (
                      <p className="text-xs text-gray-600">{event.additionalInfo}</p>
                    )}
                    <p className="text-xs mt-1 opacity-75" style={{ color: 'var(--umn-maroon)' }}>
                      📅 Click to add to Google Calendar
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area - Now responsive */}
        <main className={`flex-1 p-4 md:p-6 ${isMobile ? 'w-full' : ''}`}>
          {/* Tab Navigation - Responsive */}
          <div className="mb-6">
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => {
                  setActiveTab('home');
                  if (isMobile) setIsMobileMenuOpen(false);
                  // Scroll to top when switching tabs
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg font-medium transition-colors duration-200 min-h-[44px] ${
                  activeTab === 'home' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'home' ? 'var(--umn-maroon)' : 'transparent',
                  color: activeTab === 'home' ? 'white' : 'var(--umn-maroon)',
                  border: `2px solid var(--umn-maroon)`
                }}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setActiveTab('wordle');
                  if (isMobile) setIsMobileMenuOpen(false);
                  // Scroll to top when switching tabs
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg font-medium transition-colors duration-200 min-h-[44px] ${
                  activeTab === 'wordle' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'wordle' ? 'var(--umn-maroon)' : 'transparent',
                  color: activeTab === 'wordle' ? 'white' : 'var(--umn-maroon)',
                  border: `2px solid var(--umn-maroon)`
                }}
              >
                Boardle
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Points Cards - Responsive Grid */}
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                <div className="p-4 md:p-6 rounded-lg border-2" style={{ 
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--umn-gold)'
                }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--umn-maroon)' }}>
                    Weekly Points
                  </h3>
                  <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`} style={{ color: 'var(--umn-gold-dark)' }}>
                    {userProfile?.weekly_points || 0}
                  </p>
                </div>
                
                <div className="p-4 md:p-6 rounded-lg border-2" style={{ 
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--umn-gold)'
                }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--umn-maroon)' }}>
                    Total Points
                  </h3>
                  <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`} style={{ color: 'var(--umn-maroon-600)' }}>
                    {userProfile?.total_points || 0}
                  </p>
                </div>
              </div>

              {/* Leaderboard - Mobile optimized */}
              <div className="p-4 md:p-6 rounded-lg border-2" style={{ 
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--umn-gold)'
              }}>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4`} style={{ color: 'var(--umn-maroon)' }}>
                  Weekly Leaderboard
                </h3>
                
                {/* Tiebreaker explanation - Mobile responsive */}
                <div className="mb-4 p-2 rounded text-xs" style={{ 
                  backgroundColor: 'var(--surface)',
                  color: 'var(--umn-maroon-ink)'
                }}>
                  <strong>Tiebreaker Order:</strong> Weekly Points → Total Points → Games Played → Account Age
                </div>

                {loading ? (
                  <p>Loading leaderboard...</p>
                ) : leaderboard.length === 0 ? (
                  <div>
                    <p style={{ color: 'var(--umn-maroon-ink)' }}>No users found in leaderboard.</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--umn-maroon-ink)' }}>
                      Debug: Check browser console for detailed error information.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((user, index) => {
                      const rowStyling = getRowStyling(user, index, session?.user?.id);
                      const isCurrentUser = user.id === session?.user?.id;
                      
                      // Check if this user is tied with the previous user
                      const isTiedWithPrevious = index > 0 && 
                        leaderboard[index - 1].weekly_points === user.weekly_points;
                      
                      return (
                        <div 
                          key={`${user.username}-${index}`} 
                          className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${isMobile ? 'text-sm' : ''}`}
                          style={rowStyling}
                        >
                          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                            <div className="flex flex-col items-center">
                              <span className={`font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>#{index + 1}</span>
                              {isTiedWithPrevious && (
                                <span className="text-xs opacity-75">tied</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.username || 'Unknown User'}
                                {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                              </span>
                              <span className="text-xs opacity-75">
                                {user.games_played || 0} games played
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>{user.weekly_points || 0} pts</span>
                            <div className="text-xs opacity-75">
                              {user.total_points || 0} total
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/*Wordle Tab */}
          {activeTab === 'wordle' && <Boardle />}
        
        </main>
      </div>
    </div>
  );
};

export default Dashboard;