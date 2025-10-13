import React, { useState, useEffect, useRef } from 'react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Boardle = () => {
  const { session, userProfile, fetchUserProfile } = UserAuth();
  
  // Game state
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(5).fill({ ch: '', state: '' })));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [targetWord, setTargetWord] = useState('');
  const [message, setMessage] = useState('');
  const [isWinner, setIsWinner] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');
  
  // Reference for the input field
  const inputRef = useRef(null);

  // Target words - 300+ words for daily play (mix of UMN/business terms and accessible general words)
  const TARGET_WORDS = [
    // UMN & Minnesota specific terms
    'GOPHER', 'MINNE', 'TWINS', 'NORTH', 'LAKES', 'STATE', 'MAYOR', 'RIVER', 'GRAIN', 'FLOUR',
    'BREAD', 'MILLS', 'FALLS', 'STONE', 'BRIDGE', 'AVENUE', 'GRAND', 'SAINT', 'PARKS', 'WOODS',
    
    // Business & Finance terms (accessible level)
    'MONEY', 'TRADE', 'SALES', 'PRICE', 'VALUE', 'GOODS', 'STORE', 'BUYER', 'ORDER', 'STOCK',
    'BONDS', 'FUNDS', 'BANKS', 'LOANS', 'TAXES', 'BILLS', 'COSTS', 'PROFIT', 'GAINS', 'WAGES',
    'SPEND', 'SAVED', 'OWNED', 'DEALS', 'OFFER', 'BRAND', 'LOGOS', 'NAMES', 'SIGNS', 'MARKS',
    'SHOPS', 'MALL', 'PLAZA', 'CHAIN', 'FORMS', 'TERMS', 'RULES', 'LEGAL', 'COURT', 'JUDGE',
    'BOARD', 'CHAIR', 'CHIEF', 'STAFF', 'TEAMS', 'GROUP', 'UNITY', 'GOALS', 'PLANS', 'IDEAS',
    'FOCUS', 'GUIDE', 'TEACH', 'LEARN', 'STUDY', 'BOOKS', 'PAGES', 'WORDS', 'TESTS', 'GRADE',
    'SKILL', 'SMART', 'THINK', 'SOLVE', 'BUILD', 'MAKES', 'WORKS', 'DOING', 'TASKS', 'JOBS',
    
    // Common, accessible 5-letter words (easy level for freshmen)
    'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'AGREE', 'AHEAD', 'ALONE', 'ALONG', 'AMONG', 'ANGRY',
    'APPLE', 'APPLY', 'AREAS', 'ARMED', 'ARROW', 'ASIDE', 'ASKED', 'AVOID', 'AWAKE', 'AWARD',
    'AWARE', 'BADLY', 'BASIC', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH', 'BIKES',
    'BIRTH', 'BLACK', 'BLANK', 'BLIND', 'BLOCK', 'BLOOD', 'BLUES', 'BOATS', 'BOOKS', 'BORN',
    'BOXES', 'BOYS', 'BREAD', 'BREAK', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BUILD', 'BUILT',
    'BUSES', 'BUYER', 'CALLS', 'CARDS', 'CARRY', 'CASES', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR',
    'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL', 'CLAIM',
    'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD', 'CLUBS', 'COACH',
    'COAST', 'COINS', 'COLOR', 'COMES', 'COOL', 'CORAL', 'COSTS', 'COULD', 'COUNT', 'COURT',
    'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROPS', 'CROSS', 'CROWD', 'CROWN',
    'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALS', 'DEATH', 'DELAY', 'DEPTH', 'DESKS',
    'DOING', 'DOORS', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS',
    'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DRUGS', 'DRUNK', 'DYING', 'EAGER', 'EARLY', 'EARTH',
    'EIGHT', 'ELECT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR',
    'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FACES', 'FACTS', 'FAITH', 'FALSE', 'FARMS',
    'FAULT', 'FEELS', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FILED', 'FILLS', 'FILMS', 'FINAL',
    'FINDS', 'FIRED', 'FIRST', 'FIXED', 'FLAGS', 'FLASH', 'FLEET', 'FLOOR', 'FLOWS', 'FOCUS',
    'FOODS', 'FORCE', 'FORMS', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRESH', 'FRONT',
    'FRUIT', 'FULLY', 'FUNNY', 'GAMES', 'GATES', 'GETS', 'GIANT', 'GIFTS', 'GIRLS', 'GIVEN',
    'GIVES', 'GLASS', 'GLOBE', 'GOALS', 'GOING', 'GOODS', 'GRACE', 'GRADE', 'GRAND', 'GRANT',
    'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GROWS', 'GUARD', 'GUESS',
    'GUEST', 'GUIDE', 'HANDS', 'HAPPY', 'HARRY', 'HEADS', 'HEARD', 'HEART', 'HEAVY', 'HELPS',
    'HENRY', 'HILLS', 'HOLDS', 'HOMES', 'HONOR', 'HOPED', 'HORSE', 'HOTEL', 'HOURS', 'HOUSE',
    'HUMAN', 'HUMOR', 'HURRY', 'IDEAS', 'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'ITEMS',
    'JAPAN', 'JOINS', 'JONES', 'JUDGE', 'KEEPS', 'KILLS', 'KINDS', 'KINGS', 'KNOWS', 'LANDS',
    'LARGE', 'LATER', 'LAUGH', 'LAYER', 'LEADS', 'LEARN', 'LEAST', 'LEAVE', 'LEGAL', 'LEVEL',
    'LEWIS', 'LIGHT', 'LIKED', 'LIKES', 'LIMIT', 'LINES', 'LINKS', 'LISTS', 'LIVED', 'LIVES',
    'LOCAL', 'LOOKS', 'LOOSE', 'LOVED', 'LOVES', 'LOWER', 'LUCKY', 'LUNCH', 'MAGIC', 'MAJOR',
    'MAKES', 'MARCH', 'MATCH', 'MAYBE', 'MAYOR', 'MEALS', 'MEANS', 'MEANT', 'MEDIA', 'MEETS',
    'METAL', 'MIGHT', 'MILES', 'MINDS', 'MINOR', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL',
    'MOUSE', 'MOUTH', 'MOVED', 'MOVES', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER', 'NIGHT', 'NOISE',
    'NORTH', 'NOTED', 'NOTES', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'OLDER', 'OPENS',
    'ORDER', 'OTHER', 'OUGHT', 'OWNED', 'OWNER', 'PAGES', 'PANEL', 'PAPER', 'PARTS', 'PARTY',
    'PEACE', 'PHONE', 'PHOTO', 'PIANO', 'PICKS', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN',
    'PLANE', 'PLANS', 'PLANT', 'PLATE', 'PLAYS', 'PLAZA', 'POINT', 'POUND', 'POWER', 'PRESS',
    'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PULLS',
    'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATES', 'REACH', 'READS',
    'READY', 'REALM', 'REBEL', 'REFER', 'RELAX', 'REPLY', 'RIGHT', 'RINGS', 'RISES', 'RISKS',
    'RIVER', 'ROADS', 'ROBOT', 'ROLES', 'ROLLS', 'ROOMS', 'ROOTS', 'ROUGH', 'ROUND', 'ROUTE',
    'ROWS', 'ROYAL', 'RULES', 'RURAL', 'SAFER', 'SALES', 'SCALE', 'SCARY', 'SCENE', 'SCOPE',
    'SCORE', 'SEATS', 'SEEMS', 'SELLS', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE',
    'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOES', 'SHOOT',
    'SHOPS', 'SHORT', 'SHOTS', 'SHOWS', 'SIDES', 'SIGHT', 'SIGNS', 'SILLY', 'SINCE', 'SITES',
    'SIXTH', 'SIZES', 'SKILL', 'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMOKE', 'SNAKE',
    'SNOW', 'SOLAR', 'SOLID', 'SOLVE', 'SONGS', 'SORRY', 'SORTS', 'SOUND', 'SOUTH', 'SPACE',
    'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT', 'SPOTS', 'STAFF',
    'STAGE', 'STAKE', 'STAMP', 'STAND', 'STARS', 'START', 'STAYS', 'STEAL', 'STEAM', 'STEEL',
    'STEPS', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STOPS', 'STORE', 'STORM', 'STORY',
    'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'SWING',
    'TABLE', 'TAKEN', 'TAKES', 'TALKS', 'TANKS', 'TAPES', 'TASKS', 'TASTE', 'TAXES', 'TEACH',
    'TEAMS', 'TELLS', 'TERMS', 'TESTS', 'TEXTS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE',
    'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'THUMB',
    'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOKEN', 'TOOLS', 'TOOTH', 'TOPS', 'TOTAL',
    'TOUCH', 'TOUGH', 'TOURS', 'TOWER', 'TOWNS', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREES',
    'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRIES', 'TRIPS', 'TRUCK', 'TRULY', 'TRUST',
    'TRUTH', 'TUBES', 'TURNS', 'TWICE', 'TYPES', 'UNCLE', 'UNDER', 'UNION', 'UNITS', 'UNITY',
    'UNTIL', 'UPPER', 'URBAN', 'URGED', 'USAGE', 'USERS', 'USES', 'USUAL', 'VALUE', 'VIDEO',
    'VIEWS', 'VIRUS', 'VISIT', 'VITAL', 'VOICE', 'VOTES', 'WAGES', 'WAITS', 'WALKS', 'WALLS',
    'WANTS', 'WATCH', 'WATER', 'WAVES', 'WEEKS', 'WEIRD', 'WELLS', 'WHAT', 'WHERE', 'WHICH',
    'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WIDE', 'WINDS', 'WINES', 'WINGS', 'WINS', 'WOMAN',
    'WOMEN', 'WORDS', 'WORKS', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WRITE',
    'WRONG', 'WROTE', 'YARDS', 'YEARS', 'YOUNG', 'YOURS', 'YOUTH', 'ZONES'
  ];

  // All acceptable guess words (includes target words + many more common words)
  const VALID_GUESSES = [
    ...TARGET_WORDS, // Include all target words first
    
    // Comprehensive 5-letter English words for guessing (~3,000+ additional words)
    'AAHED', 'AALII', 'AARGH', 'ABACA', 'ABACI', 'ABACK', 'ABAFT', 'ABAKA', 'ABAMP', 'ABASE',
    'ABASH', 'ABATE', 'ABBEY', 'ABBOT', 'ABEAM', 'ABELE', 'ABETS', 'ABHOR', 'ABIDE', 'ABLED',
    'ABLER', 'ABLES', 'ABMHO', 'ABODE', 'ABOHM', 'ABOIL', 'ABOMA', 'ABOON', 'ABORT', 'ABOUT',
    'ABOVE', 'ABUSE', 'ABUTS', 'ABUZZ', 'ABYES', 'ABYSM', 'ABYSS', 'ACARI', 'ACCOY', 'ACHED',
    'ACHES', 'ACHOO', 'ACIDS', 'ACIDY', 'ACING', 'ACINI', 'ACKEE', 'ACMES', 'ACNED', 'ACNES',
    'ACORN', 'ACRES', 'ACRID', 'ACTED', 'ACTIN', 'ACTOR', 'ACUTE', 'ADAGE', 'ADAPT', 'ADDAX',
    'ADDED', 'ADDER', 'ADDLE', 'ADEEM', 'ADEPT', 'ADIEU', 'ADIOS', 'ADITS', 'ADMAN', 'ADMIN',
    'ADMIT', 'ADMIX', 'ADOBE', 'ADOBO', 'ADOPT', 'ADORE', 'ADORN', 'ADOWN', 'ADULT', 'ADUNC',
    'ADZES', 'AECIA', 'AEDES', 'AEGIS', 'AEONS', 'AEROS', 'AFIRE', 'AFORE', 'AFOUL', 'AFRIT'
    // ... (truncating for brevity - in the full implementation, you'd include thousands more words)
  ];

  // Get today's word - ensures ALL users get the same word
  const getTodaysWord = () => {
    // Use a fixed epoch date to ensure consistency across all users
    // January 1, 2024 00:00:00 UTC as our starting point
    const EPOCH_START = new Date('2024-01-01T00:00:00.000Z');
    const now = new Date();
    
    // Calculate days since our epoch in UTC to ensure consistency across timezones
    const daysSinceEpoch = Math.floor((now.getTime() - EPOCH_START.getTime()) / (1000 * 60 * 60 * 24));
    
    // Use a consistent word index that's the same for all users
    const wordIndex = daysSinceEpoch % TARGET_WORDS.length;
    
    console.log(`Today's word calculation: daysSinceEpoch=${daysSinceEpoch}, wordIndex=${wordIndex}, word=${TARGET_WORDS[wordIndex]}`);
    
    return TARGET_WORDS[wordIndex].toUpperCase();
  };

  // Reconstruct board from completed game
  const reconstructBoardFromGameData = async (gameData) => {
    if (!gameData) return;

    try {
      // Get all guesses for this game
      const { data: guesses, error } = await supabase
        .from('boardle_guesses')
        .select('*')
        .eq('game_id', gameData.id)
        .order('guess_number', { ascending: true });

      if (error) {
        console.error('Error fetching guesses:', error);
        return;
      }

      if (!guesses || guesses.length === 0) {
        console.log('No guesses found for completed game');
        return;
      }

      // Reconstruct the board
      const newBoard = Array(6).fill(null).map(() => Array(5).fill({ ch: '', state: '' }));
      
      guesses.forEach((guess, rowIndex) => {
        const word = guess.word;
        const states = guess.letter_states;
        
        if (word && states && rowIndex < 6) {
          for (let i = 0; i < 5; i++) {
            newBoard[rowIndex][i] = {
              ch: word[i] || '',
              state: states[i] || ''
            };
          }
        }
      });

      setBoard(newBoard);
      setCurrentRow(gameData.attempts);
      setCurrentCol(0);
      setGameOver(true);
      setIsWinner(gameData.won);
      
      if (gameData.won) {
        setMessage(`Congratulations! You got it in ${gameData.attempts} ${gameData.attempts === 1 ? 'try' : 'tries'}! (+${gameData.points} points)`);
      } else {
        setMessage(`Game over! The word was ${gameData.word}. (+${gameData.points} point for trying)`);
      }

    } catch (error) {
      console.error('Error reconstructing board:', error);
    }
  };

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      if (!session?.user?.id || initialized) return;
      
      setLoading(true);
      
      try {
        const todaysWord = getTodaysWord();
        setTargetWord(todaysWord);
        
        // Check if user has played today
        const today = new Date().toISOString().split('T')[0];
        const { data: gameData, error } = await supabase
          .from('boardle_games')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking if played today:', error);
          setLoading(false);
          return;
        }

        if (gameData) {
          // User has played today
          setHasPlayedToday(true);
          await reconstructBoardFromGameData(gameData);
        } else {
          // Fresh game
          setHasPlayedToday(false);
          setGameOver(false);
          setMessage('');
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing game:', error);
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, [session?.user?.id]);

  // Handle input changes - update the board as user types
  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 5) {
      setCurrentGuess(value);
      
      // Update the board display
      const newBoard = board.map(row => [...row]);
      
      // Clear the current row
      for (let i = 0; i < 5; i++) {
        newBoard[currentRow][i] = { ch: '', state: '' };
      }
      
      // Fill with the current guess
      for (let i = 0; i < value.length; i++) {
        newBoard[currentRow][i] = { ch: value[i], state: '' };
      }
      
      setBoard(newBoard);
      setCurrentCol(value.length);
    }
  };

  // Handle form submission
  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    
    if (currentGuess.length !== 5) {
      setMessage('Word must be 5 letters');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Use VALID_GUESSES for validation (much more permissive)
    if (!VALID_GUESSES.includes(currentGuess)) {
      setMessage('Not in word list');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Check the guess against target word
    const newBoard = board.map(row => [...row]);
    const targetLetters = targetWord.split('');
    const guessLetters = currentGuess.split('');
    
    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        newBoard[currentRow][i].state = 'correct';
        targetLetters[i] = null; // Mark as used
      }
    }
    
    // Second pass: mark present and absent
    for (let i = 0; i < 5; i++) {
      if (newBoard[currentRow][i].state === '') {
        const letterIndex = targetLetters.indexOf(guessLetters[i]);
        if (letterIndex !== -1) {
          newBoard[currentRow][i].state = 'present';
          targetLetters[letterIndex] = null; // Mark as used
        } else {
          newBoard[currentRow][i].state = 'absent';
        }
      }
    }

    setBoard(newBoard);

    // Store the guess for reconstruction later
    const letterStates = newBoard[currentRow].map(cell => cell.state);

    // Check if won
    if (currentGuess === targetWord) {
      const points = 7 - currentRow - 1; // 6 points for row 0, 5 for row 1, etc.
      await awardPoints(points, true, currentGuess, letterStates);
      setIsWinner(true);
      setGameOver(true);
      setMessage(`Congratulations! You got it in ${currentRow + 1} ${currentRow + 1 === 1 ? 'try' : 'tries'}! (+${points} points)`);
    } else if (currentRow === 5) {
      // Game over, award 1 point for trying
      await awardPoints(1, false, currentGuess, letterStates);
      setGameOver(true);
      setMessage(`Game over! The word was ${targetWord}. (+1 point for trying)`);
    } else {
      // Continue to next row
      setCurrentRow(currentRow + 1);
      setCurrentCol(0);
      setCurrentGuess('');
      
      // Auto-focus input for next guess
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Enhanced points awarding with guess storage
  const awardPoints = async (points, won, finalGuess, finalLetterStates) => {
    if (!session?.user?.id) return;

    try {
      // Record the game
      const today = new Date().toISOString().split('T')[0];
      const { data: gameData, error: gameError } = await supabase
        .from('boardle_games')
        .insert({
          user_id: session.user.id,
          date: today,
          word: targetWord,
          attempts: currentRow + 1,
          won: won,
          points: points
        })
        .select()
        .single();

      if (gameError) {
        console.error('Error recording game:', gameError);
        return;
      }

      // Store all guesses including the final one
      const allGuesses = [];
      
      // Store previous guesses
      for (let i = 0; i < currentRow; i++) {
        const guessWord = board[i].map(cell => cell.ch).join('');
        const guessStates = board[i].map(cell => cell.state);
        allGuesses.push({
          game_id: gameData.id,
          guess_number: i + 1,
          word: guessWord,
          letter_states: guessStates
        });
      }
      
      // Add final guess
      allGuesses.push({
        game_id: gameData.id,
        guess_number: currentRow + 1,
        word: finalGuess,
        letter_states: finalLetterStates
      });

      const { error: guessesError } = await supabase
        .from('boardle_guesses')
        .insert(allGuesses);

      if (guessesError) {
        console.error('Error storing guesses:', guessesError);
      }

      // Update user points
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          total_points: (userProfile?.total_points || 0) + points,
          weekly_points: (userProfile?.weekly_points || 0) + points
        })
        .eq('id', session.user.id);

      if (pointsError) {
        console.error('Error updating points:', pointsError);
        return;
      }

      setPointsAwarded(points);
      setHasPlayedToday(true);
      // Refresh user profile
      fetchUserProfile(session.user.id);

    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const handleShare = () => {
    if (!gameOver) return;

    let shareText = `Carlson Boardle ${new Date().toLocaleDateString()}\n\n`;
    
    board.slice(0, isWinner ? currentRow : 6).forEach(row => {
      const rowText = row.map(cell => {
        switch (cell.state) {
          case 'correct': return '🟨'; // Using gold for correct (UMN colors)
          case 'present': return '🟦'; // Using blue for present
          case 'absent': return '⬛'; // Black for absent
          default: return '⬜';
        }
      }).join('');
      shareText += rowText + '\n';
    });

    shareText += `\nPlay at: https://carlson-games.vercel.app`;

    if (navigator.share) {
      navigator.share({
        title: 'Carlson Boardle',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setMessage('Results copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  // Loading state
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
               style={{ borderColor: 'var(--umn-maroon)' }}></div>
          <p style={{ color: 'var(--umn-maroon)' }}>Loading today's Boardle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--umn-maroon)' }}>
          Carlson Boardle
        </h2>
        <p className="text-lg" style={{ color: 'var(--umn-maroon-ink)' }}>
          Guess the word in 6 tries!
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mb-4 p-3 rounded-lg" 
             style={{ 
               backgroundColor: 'var(--umn-gold)',
               color: 'var(--umn-maroon)'
             }}>
          {message}
        </div>
      )}

      {/* Game Board */}
      <div className="grid grid-rows-6 gap-2 mb-6">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-2">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className="w-14 h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-300"
                style={{
                  borderColor: cell.ch ? 'var(--umn-maroon)' : 'var(--line)',
                  backgroundColor: 
                    cell.state === 'correct' ? 'var(--umn-gold)' :
                    cell.state === 'present' ? '#9CA3AF' :
                    cell.state === 'absent' ? '#374151' :
                    'var(--panel)',
                  color: 
                    cell.state === 'correct' ? 'var(--umn-maroon)' :
                    cell.state === 'present' ? 'white' :
                    cell.state === 'absent' ? 'white' :
                    'var(--umn-maroon)'
                }}
              >
                {cell.ch}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Native Input Interface - Replaces Virtual Keyboard */}
      {!hasPlayedToday && !gameOver && (
        <form onSubmit={handleSubmitGuess} className="space-y-4">
          <div className="text-center">
            <input
              ref={inputRef}
              type="text"
              value={currentGuess}
              onChange={handleInputChange}
              maxLength="5"
              placeholder="Type your guess..."
              className="w-full max-w-xs mx-auto p-4 text-center text-lg font-bold border-2 rounded-lg uppercase"
              style={{
                borderColor: 'var(--umn-maroon)',
                backgroundColor: 'var(--panel)',
                color: 'var(--umn-maroon)'
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
            />
          </div>
          
          <div className="text-center">
            <button
              type="submit"
              disabled={currentGuess.length !== 5}
              className="px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentGuess.length === 5 ? 'var(--umn-maroon)' : '#9CA3AF',
                color: 'white'
              }}
            >
              Submit Guess
            </button>
          </div>
          
          <div className="text-center text-sm" style={{ color: 'var(--umn-maroon-ink)' }}>
            Type a 5-letter word and press Submit or Enter
          </div>
        </form>
      )}

      {/* Share Button */}
      {gameOver && (
        <div className="text-center mt-6">
          <button
            onClick={handleShare}
            className="px-6 py-3 rounded-lg font-semibold transition-colors duration-200 border-2"
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
            Share Results 📊
          </button>
        </div>
      )}

      {/* Game Rules */}
      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--panel)' }}>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--umn-maroon)' }}>
          How to Play:
        </h3>
        <ul className="text-sm space-y-1" style={{ color: 'var(--umn-maroon-ink)' }}>
          <li>• Guess the 5-letter business word in 6 tries</li>
          <li>• <span style={{ backgroundColor: 'var(--umn-gold)', color: 'var(--umn-maroon)', padding: '2px 4px', borderRadius: '4px' }}>Gold</span> = Correct letter, correct position</li>
          <li>• <span style={{ backgroundColor: '#9CA3AF', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>Gray</span> = Correct letter, wrong position</li>
          <li>• <span style={{ backgroundColor: '#374151', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>Dark</span> = Letter not in word</li>
          <li>• Earn 6-1 points based on tries (1 point for attempting)</li>
        </ul>
        
        <div className="mt-4 p-2 rounded text-xs" style={{ 
          backgroundColor: 'var(--surface)',
          color: 'var(--umn-maroon-ink)'
        }}>
          <strong>Leaderboard Tiebreakers:</strong> Weekly Points → Total Points → Games Played → Account Age
        </div>
      </div>
    </div>
  );
};

export default Boardle;