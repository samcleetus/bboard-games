import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import words from 'an-array-of-english-words';

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

  // Memoize word lists for optimal performance
  const { VALID_GUESSES, TARGET_WORDS, isValidWord } = useMemo(() => {
    console.log('🔄 Calculating word lists...');
    
    // Business & UMN specific words for target selection
    const BUSINESS_WORDS = [
      'FUNDS', 'GOPHER', 'DEALS', 'NORTH', 'CHAIR', 'MILLS', 'PROFIT', 'TEAMS', 'LAKES', 'SPEND',
      'BASIC', 'MONEY', 'BOARD', 'STONE', 'GOODS', 'STUDY', 'CHIEF', 'TWINS', 'TEACH', 'TRADE',
      'BONES', 'SKILL', 'RIVER', 'GRAND', 'AGENT', 'PAGES', 'SAINT', 'VALUE', 'PRICE', 'SAVED',
      'BREAD', 'UNITY', 'TASKS', 'GOALS', 'LOANS', 'GROUP', 'OWNER', 'MINNE', 'WORKS', 'OWNED',
      'FOCUS', 'SHOPS', 'SALES', 'LEGAL', 'STORE', 'STOCK', 'WORDS', 'BUILD', 'NAMES', 'FALLS',
      'SOLVE', 'MAKES', 'BILLS', 'GAINS', 'JOBS', 'FLOUR', 'COSTS', 'RULES', 'WOODS', 'BUYER',
      'MARKS', 'PARKS', 'CHAIN', 'TAXES', 'OFFER', 'STAFF', 'SMART', 'ORDER', 'COURT', 'MAYOR',
      'DOING', 'WAGES', 'TERMS', 'BOOKS', 'LEARN', 'THINK', 'LOGOS', 'BRAND', 'FORMS', 'JUDGE',
      'GRAIN', 'IDEAS', 'GUIDE', 'SIGNS', 'PLANS', 'TESTS', 'PLAZA', 'BRIDGE', 'GRADE', 'MALL',
      'AVENUE', 'STATE', 'BANKS', 'BONDS',
      
      // Additional common business terms - SHUFFLED ORDER
      'FIELD', 'AGENT', 'ADMIN', 'CRAFT', 'STEEL', 'FORUM', 'GRADE', 'FRAME', 'APPLY', 'ASSET',
      'AUDIT', 'AWARD', 'BONUS', 'BRIEF', 'CHART', 'CHECK', 'CLAIM', 'CLASS', 'CLICK', 'COACH',
      'COUNT', 'COVER', 'CYCLE', 'DAILY', 'DEALT', 'DEBUT', 'DEPTH', 'DRAFT', 'DREAM', 'DRIVE',
      'EMAIL', 'ENTRY', 'ERROR', 'EVENT', 'EXACT', 'EXCEL', 'FINAL', 'FIRST', 'FIXED', 'FLOOR',
      'FORCE', 'FOUND', 'FRONT', 'GIANT', 'GIVEN', 'GRACE', 'GRAND', 'GRANT', 'GROSS', 'GROWN',
      'GUARD', 'HAPPY', 'HEART', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT',
      'ISSUE', 'ITEMS', 'JOINT', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER', 'LAYER', 'LEASE',
      'LEAST', 'LEAVE', 'LEVEL', 'LIGHT', 'LIMIT', 'LINKS', 'LOCAL', 'LOGIC', 'LOWER', 'LUCKY',
      'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MATCH', 'MAYBE', 'MEANT', 'MEDAL', 'MEDIA', 'METAL',
      'MIGHT', 'MINOR', 'MIXED', 'MODEL', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOVED', 'MUSIC',
      'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE', 'NOTED', 'NOVEL', 'OCCUR', 'OCEAN', 'OFTEN',
      'OTHER', 'OUGHT', 'PANEL', 'PAPER', 'PARTS', 'PARTY', 'PEACE', 'PHASE', 'PHONE', 'PHOTO',
      'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'POINT',
      'POUND', 'POWER', 'PRESS', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD',
      'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATIO',
      'REACH', 'READY', 'REALM', 'REBEL', 'REFER', 'RELAX', 'RIGHT', 'RIGID', 'RIVAL', 'ROBIN',
      'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE', 'SCOPE',
      'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF',
      'SHELL', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SILLY', 'SINCE',
      'SIXTH', 'SIXTY', 'SIZED', 'SLEEP', 'SLIDE', 'SMALL', 'SMILE', 'SMITH', 'SMOKE', 'SOLID',
      'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPENT', 'SPLIT',
      'SPOKE', 'SPORT', 'STAGE', 'STAKE', 'STAND', 'START', 'STEAM', 'STEEP', 'STICK', 'STILL',
      'STONE', 'STOOD', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUFF', 'STYLE', 'SUGAR', 'SUITE',
      'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TEENS', 'TEETH', 'TERRY', 'TEXAS', 'THANK',
      'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THIRD', 'THOSE', 'THREE',
      'THREW', 'THROW', 'THUMB', 'TIGER', 'TIGHT', 'TIRED', 'TODAY', 'TOKEN', 'TOPIC', 'TOTAL',
      'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRAIN', 'TRAIT', 'TREAT', 'TREND', 'TRIAL', 'TRIBE',
      'TRICK', 'TRIED', 'TRIES', 'TRUCK', 'TRULY', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST',
      'TYLER', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE',
      'USUAL', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE', 'WATCH', 'WATER',
      'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD',
      'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'WROTE', 'YOUNG', 'YOUTH'
    ];

    // Common, recognizable 5-letter words for target selection (Wordle-style difficulty)
    const COMMON_TARGET_WORDS = [
      'BRAIN', 'ABOUT', 'BROKE', 'ADMIT', 'FLAME', 'ABOVE', 'CHAOS', 'ACTOR', 'CARRY', 'ADULT',
      'AROSE', 'BEARD', 'BRAVE', 'ARENA', 'AFTER', 'BEACH', 'CABLE', 'AGENT', 'BREAD', 'BROAD',
      'CHILD', 'AGREE', 'BENCH', 'CRANE', 'ALIEN', 'BEGUN', 'CHAIR', 'ALBUM', 'BASED', 'CHINA',
      'ALERT', 'BEGAN', 'CHASE', 'ALIVE', 'BEING', 'CHEAP', 'ALLOW', 'BELOW', 'CLEAR', 'ALONE',
      'BILLY', 'CLOSE', 'ALONG', 'BIRTH', 'CLOUD', 'ALTER', 'BLACK', 'COAST', 'AMONG', 'BLAME',
      'CRAZY', 'ANGER', 'BLANK', 'CREAM', 'ANGLE', 'BLIND', 'CRIME', 'ANGRY', 'BLOCK', 'CROSS',
      'APART', 'BLOOD', 'CROWD', 'APPLE', 'BOOST', 'CROWN', 'APPLY', 'BOOTH', 'CRUDE', 'ARGUE',
      'BOUND', 'CURVE', 'ARISE', 'BOUND', 'DANCE', 'ARRAY', 'BREAK', 'DATED', 'ARROW', 'BREED',
      'DEALT', 'ASIDE', 'BRIEF', 'DEATH', 'ASSET', 'BRING', 'DELAY', 'AVOID', 'BROWN', 'DEPTH',
      'AWAKE', 'BUILT', 'DOING', 'AWARD', 'CATCH', 'DOUBT', 'AWARE', 'CAUSE', 'DOZEN', 'BADLY',
      'CHARM', 'DRAMA', 'BAKER', 'CHEST', 'DRANK', 'BASES', 'CIVIL', 'DRAWN', 'BASIC', 'CLEAN',
      'DRESS', 'CLICK', 'DRILL', 'CLIMB', 'DRINK', 'CLOCK', 'DROVE', 'COULD', 'DYING', 'CRAFT',
      'EAGER', 'CRASH', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER',
      'ENTRY', 'EQUAL', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIBER',
      'FIFTH', 'FIFTY', 'FIGHT', 'FLASH', 'FLEET', 'FLUID', 'FORTH', 'FORTY', 'FRAME', 'FRANK',
      'FRAUD', 'FRESH', 'FRUIT', 'FULLY', 'FUNNY', 'GLASS', 'GLOBE', 'GOING', 'GRASS', 'GRAVE',
      'GREAT', 'GREEN', 'GROSS', 'GROWN', 'GUESS', 'GUEST', 'HARRY', 'HEAVY', 'HENCE', 'HENRY',
      'HORSE', 'HOTEL', 'JAPAN', 'JIMMY', 'JONES', 'LAUGH', 'LEARN', 'LYING', 'MARIA', 'MEANT',
      'MINUS', 'MOUSE', 'MOUTH', 'MOVIE', 'NEWLY', 'OCCUR', 'OFTEN', 'PAINT', 'PETER', 'POUND',
      'REALM', 'ROBIN', 'ROGER', 'ROMAN', 'RURAL', 'SHOWN', 'SIXTY', 'SIZED', 'SLIDE', 'SMITH',
      'SMOKE', 'STEEP', 'TWIST'
    ];

    // Get ALL 5-letter words for guessing validation (keeps comprehensive guessing)
    const fiveLetterWords = words
      .filter(word => word.length === 5)
      .map(word => word.toUpperCase());

    // Target words: Business words + Common words only (NO obscure words!)
    const targetWords = [
      ...BUSINESS_WORDS,
      ...COMMON_TARGET_WORDS.filter(word => !BUSINESS_WORDS.includes(word))
    ].filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

    // Create a Set for O(1) word validation (still allows all words for guessing)
    const validWordSet = new Set(fiveLetterWords);
    const isValidWordFunc = (word) => validWordSet.has(word);

    console.log(`✅ Loaded ${fiveLetterWords.length} valid 5-letter words for guessing`);
    console.log(`✅ Available ${targetWords.length} curated target words (no obscure words)`);

    return {
      VALID_GUESSES: fiveLetterWords,
      TARGET_WORDS: targetWords,
      isValidWord: isValidWordFunc
    };
  }, []); // Empty dependency array - only calculate once

  // Helper function to get Central Time date consistently
  const getCentralTimeDate = () => {
    const now = new Date();
    
    // Determine if we're in Daylight Saving Time (March-November)
    const year = now.getFullYear();
    
    // DST starts second Sunday in March
    const dstStart = new Date(year, 2, 8); // March 8th
    dstStart.setDate(dstStart.getDate() + (7 - dstStart.getDay()) % 7); // Move to second Sunday
    
    // DST ends first Sunday in November  
    const dstEnd = new Date(year, 10, 1); // November 1st
    dstEnd.setDate(dstEnd.getDate() + (7 - dstEnd.getDay()) % 7); // Move to first Sunday
    
    const isDST = now >= dstStart && now < dstEnd;
    const offsetHours = isDST ? -5 : -6; // CDT (-5) or CST (-6)
    
    // Calculate Central Time
    const centralTime = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));
    
    // Return YYYY-MM-DD format
    const year_ct = centralTime.getUTCFullYear();
    const month = String(centralTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(centralTime.getUTCDate()).padStart(2, '0');
    
    return `${year_ct}-${month}-${day}`;
  };

  // Get today's word - ensures ALL users get the same word
  const getTodaysWord = () => {
    // Get today's date as YYYY-MM-DD in Central Time
    const dateString = getCentralTimeDate();

    // Use a simple hash of the date string to get consistent results
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Make sure hash is positive
    const positiveHash = Math.abs(hash);
    const wordIndex = positiveHash % TARGET_WORDS.length;

    console.log(`Central Time Date: ${dateString}, hash: ${hash}, wordIndex: ${wordIndex}, word: ${TARGET_WORDS[wordIndex]}`);

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
        
        // Check if user has played today - using Central Time
        const today = getCentralTimeDate();
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
  }, [session?.user?.id, TARGET_WORDS.length]); // Add TARGET_WORDS.length to ensure it's loaded

  // Optimized input change handler
  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (value.length <= 5) {
      setCurrentGuess(value);
      setCurrentCol(value.length);
    }
  };

  // Separate useEffect to update the board when currentGuess changes
  useEffect(() => {
    if (!gameOver && !hasPlayedToday) {
      const newBoard = board.map(row => [...row]);
      
      // Clear the current row
      for (let i = 0; i < 5; i++) {
        newBoard[currentRow][i] = { ch: '', state: '' };
      }
      
      // Fill with the current guess
      for (let i = 0; i < currentGuess.length; i++) {
        newBoard[currentRow][i] = { ch: currentGuess[i], state: '' };
      }
      
      setBoard(newBoard);
    }
  }, [currentGuess, currentRow, gameOver, hasPlayedToday]);

  // Handle form submission with optimized word validation
  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    
    if (currentGuess.length !== 5) {
      setMessage('Word must be 5 letters');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Use optimized O(1) word validation
    if (!isValidWord(currentGuess)) {
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
      // Record the game using Central Time
      const today = getCentralTimeDate();
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
    
    // Only include rows that have actual guesses (non-empty cells)
    const rowsToInclude = isWinner ? currentRow + 1 : 6;
    
    board.slice(0, rowsToInclude).forEach(row => {
        // Check if this row has any letters (skip completely empty rows)
        const hasContent = row.some(cell => cell.ch !== '');
        
        if (hasContent) {
        const rowText = row.map(cell => {
            switch (cell.state) {
            case 'correct': return '🟨'; // Using gold for correct (UMN colors)
            case 'present': return '🟦'; // Using blue for present
            case 'absent': return '⬛'; // Black for absent
            default: return '⬜'; // This shouldn't appear if row has content
            }
        }).join('');
        shareText += rowText + '\n';
        }
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
          <li>• Guess the 5-letter word in 6 tries</li>
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