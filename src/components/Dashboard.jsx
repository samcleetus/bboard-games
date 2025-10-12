import React, { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Boardle from './Boardle';

const Dashboard = () => {
  const { session, userProfile, signOut, fetchUserProfile } = UserAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile(session.user.id);
      fetchLeaderboard();
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
      backgroundColor: 'var(--panel)', // Changed from 'var(--surface)' to 'var(--panel)'
      color: 'var(--umn-maroon)' // Explicitly set dark text color
      };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Header */}
      <header className="px-6 py-4 border-b-2" style={{ 
        backgroundColor: 'var(--panel)', 
        borderColor: 'var(--umn-gold)' 
      }}>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--umn-maroon)' }}>
            Carlson Games
          </h1>
          
          {/* Top-right buttons */}
          <div className="flex gap-3">
            <button
              onClick={openWebsite}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2"
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
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2"
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
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2"
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
      </header>

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <aside className="w-80 border-r-2 p-6" style={{ 
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--umn-gold)'
        }}>
          {/* Placeholder Image */}
          <div className="mb-6">
            <div className="w-full h-40 rounded-lg flex items-center justify-center text-white text-lg font-medium"
                 style={{ backgroundColor: 'var(--umn-maroon)' }}>
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
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-sm" style={{ color: 'var(--umn-maroon-ink)' }}>
                  🎉 Welcome to Carlson Games!
                </p>
              </div>
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
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="font-medium text-sm" style={{ color: 'var(--umn-maroon)' }}>
                  Check here for upcoming events!
                </p>
                <p className="text-xs text-gray-600">------</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
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
                onClick={() => setActiveTab('wordle')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
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
              {/* Points Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg border-2" style={{ 
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--umn-gold)'
                }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--umn-maroon)' }}>
                    Weekly Points
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--umn-gold-dark)' }}>
                    {userProfile?.weekly_points || 0}
                  </p>
                </div>
                
                <div className="p-6 rounded-lg border-2" style={{ 
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--umn-gold)'
                }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--umn-maroon)' }}>
                    Total Points
                  </h3>
                  <p className="text-3xl font-bold" style={{ color: 'var(--umn-maroon-600)' }}>
                    {userProfile?.total_points || 0}
                  </p>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="p-6 rounded-lg border-2" style={{ 
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--umn-gold)'
              }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--umn-maroon)' }}>
                  Weekly Leaderboard (Top 10)
                </h3>
                
                {/* Tiebreaker explanation */}
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
                          className="flex justify-between items-center p-3 rounded-lg transition-all duration-200"
                          style={rowStyling}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-lg">#{index + 1}</span>
                              {isTiedWithPrevious && (
                                <span className="text-xs opacity-75">tied</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.username || 'Unknown User'}
                                {isCurrentUser && <span className="ml-2 text-sm">(You)</span>}
                              </span>
                              <span className="text-xs opacity-75">
                                {user.games_played || 0} games played
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{user.weekly_points || 0} pts</span>
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

          {activeTab === 'wordle' && <Boardle />}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;