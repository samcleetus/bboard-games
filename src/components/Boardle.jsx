import React, { useState, useEffect } from 'react';
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
    'ADZES', 'AECIA', 'AEDES', 'AEGIS', 'AEONS', 'AEROS', 'AFIRE', 'AFORE', 'AFOUL', 'AFRIT',
    'AFTER', 'AGAIN', 'AGAPE', 'AGARS', 'AGATE', 'AGAVE', 'AGAZE', 'AGENE', 'AGENT', 'AGERS',
    'AGGER', 'AGGIE', 'AGGRO', 'AGHAS', 'AGIOS', 'AGISM', 'AGIST', 'AGITA', 'AGLET', 'AGLEY',
    'AGLOW', 'AGMAS', 'AGONE', 'AGONS', 'AGONY', 'AGORA', 'AGREE', 'AGRIA', 'AGRIC', 'AGUED',
    'AGUES', 'AHEAD', 'AHING', 'AHOLD', 'AIDED', 'AIDER', 'AIDES', 'AILED', 'AIMED', 'AIMER',
    'AINEE', 'AINES', 'AIRED', 'AIRER', 'AIRNS', 'AIRTH', 'AIRTS', 'AISLE', 'AITCH', 'AIVER',
    'AJAR', 'AJEE', 'AJIVA', 'AJOG', 'AJUGA', 'AKEES', 'AKELA', 'AKENE', 'AKIN', 'ALACK',
    'ALAMO', 'ALAND', 'ALANE', 'ALANG', 'ALANS', 'ALANT', 'ALAPA', 'ALAPS', 'ALARM', 'ALARY',
    'ALATE', 'ALAYS', 'ALBAS', 'ALBEE', 'ALBUM', 'ALCID', 'ALDOL', 'ALEAD', 'ALECK', 'ALEFS',
    'ALEPH', 'ALERT', 'ALEFS', 'ALEUT', 'ALFAS', 'ALGAE', 'ALGAL', 'ALGAS', 'ALGID', 'ALGIN',
    'ALGOR', 'ALIAS', 'ALIBI', 'ALIEN', 'ALIFS', 'ALIGN', 'ALIKE', 'ALINE', 'ALIST', 'ALIVE',
    'ALIYA', 'ALKIE', 'ALKYL', 'ALLAY', 'ALLEE', 'ALLEY', 'ALLOD', 'ALLOT', 'ALLOW', 'ALLOY',
    'ALLYL', 'ALMAH', 'ALMAS', 'ALMEH', 'ALMES', 'ALMUD', 'ALMUG', 'ALODS', 'ALOED', 'ALOES',
    'ALOFT', 'ALOHA', 'ALOIN', 'ALONE', 'ALONG', 'ALOOF', 'ALOUD', 'ALPHA', 'ALTAR', 'ALTER',
    'ALTHO', 'ALTOS', 'ALULA', 'ALUMS', 'ALWAY', 'AMAHS', 'AMAIN', 'AMASS', 'AMAZE', 'AMBER',
    'AMBIT', 'AMBLE', 'AMBOS', 'AMBRY', 'AMEBA', 'AMEER', 'AMEND', 'AMENS', 'AMENT', 'AMIAS',
    'AMICE', 'AMIDE', 'AMIDO', 'AMIDS', 'AMIES', 'AMIGA', 'AMIGO', 'AMINE', 'AMINO', 'AMINS',
    'AMIRS', 'AMISS', 'AMITY', 'AMMOS', 'AMNIA', 'AMNIC', 'AMNIO', 'AMOKS', 'AMONG', 'AMORT',
    'AMOUR', 'AMPED', 'AMPLE', 'AMPLY', 'AMUCK', 'AMUSE', 'AMYLS', 'ANCHO', 'ANCLE', 'ANCON',
    'ANDED', 'ANEAR', 'ANELE', 'ANENT', 'ANGAS', 'ANGEL', 'ANGER', 'ANGLE', 'ANGLO', 'ANGRY',
    'ANGST', 'ANIGH', 'ANILE', 'ANILS', 'ANIMA', 'ANIME', 'ANION', 'ANISE', 'ANKHS', 'ANKLE',
    'ANKUS', 'ANLAS', 'ANNAL', 'ANNAS', 'ANNAT', 'ANNEX', 'ANNOY', 'ANNUL', 'ANOAS', 'ANODE',
    'ANOLE', 'ANOMY', 'ANSAE', 'ANTAE', 'ANTAR', 'ANTAS', 'ANTED', 'ANTES', 'ANTIC', 'ANTIS',
    'ANTRA', 'ANTRE', 'ANTSY', 'ANURA', 'ANVIL', 'ANYON', 'AORTA', 'APACE', 'APAGE', 'APAID',
    'APART', 'APAYD', 'APEAK', 'APEEK', 'APERS', 'APERT', 'APERY', 'APGAR', 'APHID', 'APHIS',
    'APIAN', 'APING', 'APIOL', 'APISH', 'APISM', 'APNEA', 'APODE', 'APODS', 'APOOP', 'APORT',
    'APPAL', 'APPEL', 'APPLE', 'APPLY', 'APPOS', 'APRES', 'APRON', 'APSES', 'APSIS', 'APSOS',
    'AQUAE', 'AQUAS', 'ARABA', 'ARAKS', 'ARAME', 'ARARS', 'ARBOR', 'ARCED', 'ARCHI', 'ARCS',
    'ARDEB', 'AREAE', 'AREAL', 'AREAS', 'ARECA', 'AREDD', 'AREDE', 'AREFY', 'AREIC', 'ARENA',
    'ARERE', 'ARETE', 'ARGAL', 'ARGAN', 'ARGIL', 'ARGLE', 'ARGOL', 'ARGON', 'ARGOT', 'ARGUE',
    'ARGUS', 'ARHAT', 'ARIAS', 'ARIEL', 'ARILS', 'ARIOT', 'ARISE', 'ARISH', 'ARKED', 'ARLES',
    'ARMED', 'ARMER', 'ARMET', 'ARMIL', 'ARMOR', 'ARNAS', 'ARNUT', 'AROBA', 'AROHA', 'AROID',
    'AROMA', 'AROSE', 'ARPAS', 'ARPEN', 'ARPTS', 'ARRAU', 'ARRAY', 'ARREA', 'ARRET', 'ARRIS',
    'ARROW', 'ARSES', 'ARSEY', 'ARSIS', 'ARSON', 'ARTAL', 'ARTEL', 'ARTIC', 'ARTIS', 'ARTSY',
    'ARUM', 'ARVAL', 'ARVOS', 'ARYLS', 'ASANA', 'ASCI', 'ASCOT', 'ASCUS', 'ASDIC', 'ASHED',
    'ASHEN', 'ASHES', 'ASIDE', 'ASKED', 'ASKER', 'ASKEW', 'ASKOI', 'ASKOS', 'ASPEN', 'ASPER',
    'ASPIC', 'ASPIS', 'ASSAI', 'ASSAM', 'ASSAY', 'ASSES', 'ASSET', 'ASSEZ', 'ASSOT', 'ASTER',
    'ASTIR', 'ASTUN', 'ASURA', 'ASWAY', 'ASWIM', 'ASYLA', 'ATAPS', 'ATAXY', 'ATELIC', 'ATHAM',
    'ATLAS', 'ATMAN', 'ATMAS', 'ATMOS', 'ATOKE', 'ATOLL', 'ATOMS', 'ATOMY', 'ATONE', 'ATONY',
    'ATOPY', 'ATRIA', 'ATRIP', 'ATTAH', 'ATTAR', 'ATTIC', 'AUDAD', 'AUDIO', 'AUDIT', 'AUFS',
    'AUGER', 'AUGHT', 'AUGUR', 'AULAS', 'AULD', 'AULOI', 'AULOS', 'AUMIL', 'AUNTS', 'AUNTY',
    'AURAE', 'AURAL', 'AURAR', 'AURAS', 'AUREI', 'AURES', 'AURIC', 'AURIS', 'AURUM', 'AUTOS',
    'AUXIN', 'AVAIL', 'AVALE', 'AVANT', 'AVAST', 'AVELS', 'AVENS', 'AVERS', 'AVERT', 'AVGAS',
    'AVIAN', 'AVION', 'AVISE', 'AVISO', 'AVOID', 'AVONS', 'AVOWS', 'AVYZE', 'AWAKE', 'AWANE',
    'AWARD', 'AWARE', 'AWARN', 'AWASH', 'AWATO', 'AWAVE', 'AWAYS', 'AWDLS', 'AWEEL', 'AWETO',
    'AWFUL', 'AWING', 'AWMRY', 'AWNED', 'AWNER', 'AWNS', 'AWOKE', 'AWOL', 'AWRY', 'AXELS',
    'AXIAL', 'AXILE', 'AXILS', 'AXING', 'AXIOM', 'AXION', 'AXITE', 'AXLED', 'AXLES', 'AXMAN',
    'AXMEN', 'AXOID', 'AXONE', 'AXONS', 'AYAH', 'AYAHS', 'AYELP', 'AYGRE', 'AYINS', 'AYONT',
    'AYRES', 'AYRIE', 'AZANS', 'AZIDE', 'AZIDO', 'AZINE', 'AZLON', 'AZOIC', 'AZOLE', 'AZONS',
    'AZOTE', 'AZOTH', 'AZUKI', 'AZURE', 'AZURN', 'AZURY', 'AZYGY', 'AZYME', 'BAAED', 'BAALS',
    'BABAS', 'BABEL', 'BABES', 'BABKA', 'BABOO', 'BABUL', 'BABUS', 'BACCA', 'BACCO', 'BACCY',
    'BACHA', 'BACHS', 'BACKS', 'BACON', 'BADDY', 'BADGE', 'BADLY', 'BAELS', 'BAFFS', 'BAFFY',
    'BAFTS', 'BAGEL', 'BAGGY', 'BAGHS', 'BAGIE', 'BAHTS', 'BAILS', 'BAIRN', 'BAISA', 'BAITH',
    'BAITS', 'BAIZA', 'BAIZE', 'BAJAN', 'BAJRA', 'BAJRI', 'BAJUS', 'BAKED', 'BAKER', 'BAKES',
    'BAKRA', 'BALAS', 'BALDS', 'BALDY', 'BALED', 'BALER', 'BALES', 'BALKS', 'BALKY', 'BALLS',
    'BALLY', 'BALMS', 'BALMY', 'BALOO', 'BALSA', 'BALTI', 'BALUN', 'BALUS', 'BAMBI', 'BANAK',
    'BANAL', 'BANCO', 'BANCS', 'BANDA', 'BANDH', 'BANDS', 'BANDY', 'BANED', 'BANES', 'BANGS',
    'BANIA', 'BANJO', 'BANKS', 'BANNS', 'BANTS', 'BANTU', 'BANTY', 'BAPUS', 'BARBE', 'BARBS',
    'BARBY', 'BARCA', 'BARDE', 'BARDS', 'BARDY', 'BARED', 'BARER', 'BARES', 'BARFS', 'BARGE',
    'BARIC', 'BARKS', 'BARKY', 'BARMS', 'BARMY', 'BARNS', 'BARNY', 'BARON', 'BARPS', 'BARRA',
    'BARRE', 'BARRO', 'BARRY', 'BARYE', 'BASAN', 'BASED', 'BASER', 'BASES', 'BASHO', 'BASIC',
    'BASIL', 'BASIN', 'BASIS', 'BASKS', 'BASON', 'BASSE', 'BASSO', 'BASSY', 'BASTA', 'BASTE',
    'BASTI', 'BASTO', 'BASTS', 'BATCH', 'BATED', 'BATES', 'BATHE', 'BATHS', 'BATIK', 'BATON',
    'BATTS', 'BATTU', 'BAUDS', 'BAUKS', 'BAULK', 'BAWDS', 'BAWDY', 'BAWL', 'BAWLS', 'BAWNS',
    'BAWRS', 'BAWTY', 'BAYED', 'BAYES', 'BAYLE', 'BAYOU', 'BAYTS', 'BAZAR', 'BAZOO', 'BEACH',
    'BEADS', 'BEADY', 'BEAGLE', 'BEAKS', 'BEAKY', 'BEAMS', 'BEAMY', 'BEANO', 'BEANS', 'BEANY',
    'BEARD', 'BEARS', 'BEAST', 'BEATH', 'BEATS', 'BEATY', 'BEAUS', 'BEAUT', 'BEAUX', 'BEBOP',
    'BECAP', 'BECKE', 'BECKS', 'BEDAB', 'BEDAD', 'BEDEL', 'BEDES', 'BEDEW', 'BEDIM', 'BEDOG',
    'BEDUB', 'BEDYE', 'BEECH', 'BEEDI', 'BEEFS', 'BEEFY', 'BEEPS', 'BEERS', 'BEERY', 'BEETS',
    'BEFIT', 'BEFOG', 'BEGAN', 'BEGAT', 'BEGET', 'BEGIN', 'BEGOT', 'BEGUM', 'BEGUN', 'BEIGE',
    'BEIGY', 'BEING', 'BEKAH', 'BELAH', 'BELAR', 'BELAY', 'BELCH', 'BELDS', 'BELGA', 'BELIE',
    'BELLE', 'BELLS', 'BELLY', 'BELON', 'BELOW', 'BELTS', 'BEMAS', 'BEMAD', 'BEMAN', 'BEMIX',
    'BEMUD', 'BENCH', 'BENDS', 'BENDY', 'BENES', 'BENET', 'BENGS', 'BENIS', 'BENNE', 'BENNI',
    'BENNY', 'BENTO', 'BENTS', 'BENTY', 'BEPAT', 'BEPED', 'BERGS', 'BERKO', 'BERKS', 'BERMS',
    'BERRY', 'BERTH', 'BERYL', 'BESAT', 'BESAW', 'BESEE', 'BESES', 'BESET', 'BESIT', 'BESOM',
    'BESOT', 'BESTI', 'BESTS', 'BETAS', 'BETED', 'BETEL', 'BETES', 'BETHS', 'BETID', 'BETON',
    'BETTA', 'BETTY', 'BEVEL', 'BEVER', 'BEVOR', 'BEVUE', 'BEVVY', 'BEWET', 'BEWIG', 'BEZEL',
    'BEZIL', 'BEZZY', 'BHAJI', 'BHANG', 'BHATS', 'BHELS', 'BHOOT', 'BHUNA', 'BHUTS', 'BIACH',
    'BIALI', 'BIALY', 'BIBBS', 'BIBES', 'BIBLE', 'BICCY', 'BIDDY', 'BIDED', 'BIDER', 'BIDES',
    'BIDET', 'BIDIS', 'BIDON', 'BIELD', 'BIERS', 'BIFFO', 'BIFFS', 'BIFFY', 'BIFID', 'BIGAE',
    'BIGAS', 'BIGGY', 'BIGHT', 'BIGLY', 'BIGOT', 'BIJOU', 'BIKED', 'BIKER', 'BIKES', 'BIKIE',
    'BILBO', 'BILBY', 'BILED', 'BILES', 'BILGE', 'BILGY', 'BILKS', 'BILLS', 'BILLY', 'BIMBO',
    'BINAL', 'BINDS', 'BINDI', 'BINDS', 'BINER', 'BINES', 'BINGE', 'BINGO', 'BINGY', 'BINIT',
    'BINKS', 'BINTS', 'BIOME', 'BIONT', 'BIOTA', 'BIPED', 'BIPOD', 'BIRCH', 'BIRDS', 'BIRKS',
    'BIRLE', 'BIRLS', 'BIROS', 'BIRRS', 'BIRSE', 'BIRTH', 'BISES', 'BISKS', 'BISOM', 'BISON',
    'BITAI', 'BITCH', 'BITER', 'BITES', 'BITOS', 'BITOU', 'BITSY', 'BITTE', 'BITTS', 'BITTY',
    'BIZES', 'BLABS', 'BLACK', 'BLADE', 'BLADS', 'BLAE', 'BLAES', 'BLAFF', 'BLAGS', 'BLAHS',
    'BLAIN', 'BLAIR', 'BLAME', 'BLAMS', 'BLAND', 'BLANK', 'BLARE', 'BLART', 'BLASE', 'BLAST',
    'BLATE', 'BLATS', 'BLATT', 'BLAUD', 'BLAWN', 'BLAWS', 'BLAZE', 'BLEAK', 'BLEAT', 'BLEBS',
    'BLECH', 'BLEDE', 'BLEED', 'BLEEP', 'BLEND', 'BLENT', 'BLERT', 'BLESS', 'BLEST', 'BLETS',
    'BLEW', 'BLEYS', 'BLIMP', 'BLIND', 'BLING', 'BLINK', 'BLINS', 'BLINY', 'BLIPS', 'BLISS',
    'BLITE', 'BLITZ', 'BLITZ', 'BLIVE', 'BLOAT', 'BLOBS', 'BLOCK', 'BLOCS', 'BLOGS', 'BLOKE',
    'BLOND', 'BLOOD', 'BLOOK', 'BLOOM', 'BLOOP', 'BLORE', 'BLOTS', 'BLOWN', 'BLOWS', 'BLOWY',
    'BLUBS', 'BLUDE', 'BLUDS', 'BLUDY', 'BLUED', 'BLUER', 'BLUES', 'BLUET', 'BLUEY', 'BLUFF',
    'BLUID', 'BLUME', 'BLUMS', 'BLUNK', 'BLUNT', 'BLURB', 'BLURS', 'BLURT', 'BLUSH', 'BLYPE',
    'BOABS', 'BOAKS', 'BOARD', 'BOARS', 'BOART', 'BOAST', 'BOATS', 'BOBAC', 'BOBAK', 'BOBAS',
    'BOBBY', 'BOBED', 'BOBOL', 'BOBOS', 'BOCCA', 'BOCCE', 'BOCCI', 'BOCHE', 'BOCKS', 'BODED',
    'BODES', 'BODGE', 'BODHI', 'BODLE', 'BODON', 'BODYS', 'BOEUF', 'BOFFO', 'BOFFS', 'BOGAN',
    'BOGEY', 'BOGGY', 'BOGIE', 'BOGLE', 'BOGUS', 'BOHEA', 'BOHOS', 'BOILS', 'BOING', 'BOINK',
    'BOITE', 'BOKAS', 'BOKEH', 'BOKES', 'BOKOS', 'BOLAR', 'BOLAS', 'BOLDS', 'BOLES', 'BOLLS',
    'BOLOS', 'BOLTS', 'BOLUS', 'BOMAS', 'BOMBE', 'BOMBS', 'BONCE', 'BONDS', 'BONED', 'BONER',
    'BONES', 'BONGS', 'BONIE', 'BONKS', 'BONNE', 'BONNY', 'BONUS', 'BONZE', 'BOOAI', 'BOOAY',
    'BOOBS', 'BOOBY', 'BOOCH', 'BOODY', 'BOOED', 'BOOFY', 'BOOGY', 'BOOHS', 'BOOKS', 'BOOKY',
    'BOOLS', 'BOOMS', 'BOOMY', 'BOONG', 'BOONS', 'BOORD', 'BOORS', 'BOOST', 'BOOTH', 'BOOTS',
    'BOOTY', 'BOOZE', 'BOOZY', 'BORAL', 'BORAS', 'BORAX', 'BORDE', 'BORDS', 'BORED', 'BOREE',
    'BOREL', 'BORER', 'BORES', 'BORGO', 'BORIC', 'BORKS', 'BORMS', 'BORN', 'BORON', 'BORTS',
    'BORTY', 'BORTZ', 'BOSIE', 'BOSKS', 'BOSKY', 'BOSOM', 'BOSON', 'BOSSY', 'BOSUN', 'BOTAS',
    'BOTCH', 'BOTEL', 'BOTES', 'BOTHY', 'BOTOX', 'BOTTE', 'BOTTS', 'BOTTY', 'BOTUL', 'BOUCH',
    'BOUFI', 'BOUGH', 'BOUKS', 'BOULE', 'BOULS', 'BOUND', 'BOURG', 'BOURN', 'BOUSE', 'BOUSY',
    'BOUTS', 'BOVID', 'BOWAT', 'BOWED', 'BOWEL', 'BOWER', 'BOWES', 'BOWET', 'BOWIE', 'BOWLS',
    'BOWNE', 'BOWRS', 'BOWSE', 'BOXED', 'BOXER', 'BOXES', 'BOYAR', 'BOYAU', 'BOYED', 'BOYFS',
    'BOYGS', 'BOYLA', 'BOYOS', 'BOYSY', 'BOZOS', 'BRAAI', 'BRABS', 'BRACE', 'BRACH', 'BRACK',
    'BRACS', 'BRACT', 'BRADS', 'BRAES', 'BRAGS', 'BRAID', 'BRAIL', 'BRAIN', 'BRAKE', 'BRAKS',
    'BRAKY', 'BRAME', 'BRAND', 'BRANE', 'BRANK', 'BRANS', 'BRANT', 'BRASH', 'BRASS', 'BRAST',
    'BRATS', 'BRAVA', 'BRAVE', 'BRAVI', 'BRAVO', 'BRAWL', 'BRAWN', 'BRAWS', 'BRAXY', 'BRAYS',
    'BRAZE', 'BREAD', 'BREAK', 'BREAM', 'BREDE', 'BREEDS', 'BREES', 'BREID', 'BREIS', 'BREME',
    'BRENS', 'BRENT', 'BRERE', 'BRERS', 'BREVE', 'BREWS', 'BREYS', 'BRIAR', 'BRIBE', 'BRICK',
    'BRIDE', 'BRIEF', 'BRIER', 'BRIES', 'BRIGS', 'BRIKS', 'BRILL', 'BRIMS', 'BRINE', 'BRING',
    'BRINK', 'BRINS', 'BRINY', 'BRIOS', 'BRISK', 'BRISS', 'BRITS', 'BRITT', 'BRIZE', 'BROAD',
    'BROCH', 'BROCK', 'BRODS', 'BROGH', 'BROGS', 'BROIL', 'BROKE', 'BROME', 'BROMO', 'BRONC',
    'BROND', 'BROOD', 'BROOK', 'BROOM', 'BROOS', 'BROSE', 'BROSY', 'BROTH', 'BROWN', 'BROWS',
    'BRPTS', 'BRUGH', 'BRUIN', 'BRUIT', 'BRUJA', 'BRUJO', 'BRULE', 'BRUME', 'BRUMP', 'BRUMS',
    'BRUNG', 'BRUNK', 'BRUNS', 'BRUNT', 'BRURY', 'BRUSH', 'BRUSK', 'BRUSS', 'BRUTS', 'BUATS',
    'BUAZE', 'BUBAL', 'BUBBA', 'BUBBE', 'BUBBY', 'BUBO', 'BUBUS', 'BUCES', 'BUCKO', 'BUCKS',
    'BUCKU', 'BUDDY', 'BUDGE', 'BUDIS', 'BUDOS', 'BUFFA', 'BUFFE', 'BUFFI', 'BUFFO', 'BUFFS',
    'BUFFY', 'BUFOS', 'BUFTY', 'BUGGY', 'BUGLE', 'BUHLS', 'BUHRS', 'BUILD', 'BUILT', 'BUIST',
    'BUKES', 'BULBS', 'BULGE', 'BULGY', 'BULKS', 'BULKY', 'BULLS', 'BULLY', 'BULSE', 'BUMBO',
    'BUMFS', 'BUMPH', 'BUMPS', 'BUMPY', 'BUNAS', 'BUNCE', 'BUNCH', 'BUNCO', 'BUND', 'BUNDT',
    'BUNDU', 'BUNDY', 'BUNFS', 'BUNGS', 'BUNGY', 'BUNIA', 'BUNJE', 'BUNKO', 'BUNKS', 'BUNNS',
    'BUNNY', 'BUNTS', 'BUNTY', 'BUNYA', 'BUOYS', 'BUPPY', 'BUQSHA', 'BURBS', 'BURDS', 'BURET',
    'BURFI', 'BURGH', 'BURGS', 'BURIN', 'BURKE', 'BURLS', 'BURLY', 'BURNS', 'BURNT', 'BUROO',
    'BURPS', 'BURQA', 'BURRO', 'BURRS', 'BURRY', 'BURSA', 'BURSE', 'BURST', 'BUSBY', 'BUSED',
    'BUSES', 'BUSHY', 'BUSKS', 'BUSKY', 'BUSSU', 'BUSTI', 'BUSTS', 'BUSTY', 'BUTCH', 'BUTEO',
    'BUTES', 'BUTLE', 'BUTOH', 'BUTON', 'BUTTS', 'BUTTY', 'BUTUT', 'BUTYL', 'BUZUK', 'BUZZY',
    'BWANA', 'BWAZI', 'BYDED', 'BYDES', 'BYKED', 'BYKES', 'BYLAW', 'BYNED', 'BYNES', 'BYRES',
    'BYRLS', 'BYSSI', 'BYWAY', 'BYWORD', 'CAABA', 'CABAS', 'CABER', 'CABIN', 'CABLE', 'CABOB',
    'CABOC', 'CABRE', 'CACAO', 'CACAS', 'CACHE', 'CACKY', 'CACTI', 'CADDY', 'CADED', 'CADES',
    'CADET', 'CADGE', 'CADGY', 'CADIE', 'CADIS', 'CADRE', 'CAECA', 'CAESE', 'CAFES', 'CAFFS',
    'CAGED', 'CAGER', 'CAGES', 'CAGEY', 'CAGOT', 'CAHOW', 'CAIDS', 'CAINS', 'CAIRD', 'CAIRN',
    'CAJON', 'CAKED', 'CAKES', 'CAKEY', 'CALFS', 'CALID', 'CALIF', 'CALIX', 'CALKS', 'CALLA',
    'CALLS', 'CALMS', 'CALOS', 'CALPA', 'CALPS', 'CALYX', 'CAMAS', 'CAMEL', 'CAMEO', 'CAMES',
    'CAMIS', 'CAMOS', 'CAMPI', 'CAMPO', 'CAMPS', 'CAMPY', 'CAMUS', 'CANAL', 'CANDY', 'CANED',
    'CANER', 'CANES', 'CANGS', 'CANID', 'CANNA', 'CANNS', 'CANOE', 'CANON', 'CANSO', 'CANST',
    'CANTO', 'CANTS', 'CANTY', 'CAPED', 'CAPER', 'CAPES', 'CAPEX', 'CAPHS', 'CAPIZ', 'CAPLE',
    'CAPON', 'CAPOS', 'CAPOT', 'CAPRI', 'CAPUL', 'CAPUT', 'CARBO', 'CARBS', 'CARBY', 'CARDI',
    'CARDS', 'CARDY', 'CARED', 'CARER', 'CARES', 'CARET', 'CAREX', 'CARGO', 'CARKS', 'CARLE',
    'CARLS', 'CARNS', 'CARNY', 'CAROB', 'CAROL', 'CAROM', 'CARPI', 'CARPS', 'CARRS', 'CARRY',
    'CARSE', 'CARTA', 'CARTE', 'CARTS', 'CARVE', 'CARVY', 'CASAS', 'CASCO', 'CASED', 'CASER',
    'CASES', 'CASKS', 'CASKY', 'CASTE', 'CASTS', 'CASUS', 'CATCH', 'CATER', 'CATES', 'CATTY',
    'CAULD', 'CAULS', 'CAUMS', 'CAUPS', 'CAURI', 'CAUSA', 'CAUSE', 'CAVAS', 'CAVED', 'CAVEL',
    'CAVER', 'CAVES', 'CAVIE', 'CAVIL', 'CAWED', 'CAWKS', 'CAXON', 'CEASE', 'CEAZE', 'CEBID',
    'CECAL', 'CEDAR', 'CEDED', 'CEDER', 'CEDES', 'CEDIS', 'CEIBA', 'CEILI', 'CEILS', 'CELEB',
    'CELLA', 'CELLO', 'CELLS', 'CELOM', 'CELTS', 'CENSE', 'CENTO', 'CENTS', 'CENTU', 'CEORL',
    'CEPES', 'CERCI', 'CERED', 'CERES', 'CERGE', 'CERIA', 'CERIC', 'CEROC', 'CEROS', 'CERTS',
    'CERTY', 'CESTA', 'CESTI', 'CETES', 'CETYL', 'CEZVE', 'CHACE', 'CHACK', 'CHACO', 'CHADS',
    'CHAFE', 'CHAFF', 'CHAFT', 'CHAIN', 'CHAIR', 'CHAIS', 'CHAIT', 'CHAJA', 'CHAKA', 'CHAKS',
    'CHALS', 'CHAMP', 'CHAMS', 'CHANA', 'CHANG', 'CHANK', 'CHANS', 'CHANT', 'CHAOS', 'CHAPE',
    'CHAPS', 'CHAPT', 'CHARA', 'CHARD', 'CHARE', 'CHARK', 'CHARM', 'CHARR', 'CHARS', 'CHART',
    'CHARY', 'CHASE', 'CHASM', 'CHATS', 'CHAVE', 'CHAVS', 'CHAWK', 'CHAWS', 'CHAYA', 'CHAYS',
    'CHAZZ', 'CHEAP', 'CHEAT', 'CHECK', 'CHECO', 'CHEDD', 'CHEEK', 'CHEEP', 'CHEER', 'CHEFS',
    'CHEKA', 'CHELA', 'CHELP', 'CHEMO', 'CHEMS', 'CHERE', 'CHERT', 'CHESS', 'CHEST', 'CHETH',
    'CHEVY', 'CHEWS', 'CHEWY', 'CHIAO', 'CHIAS', 'CHIBS', 'CHICA', 'CHICH', 'CHICK', 'CHICO',
    'CHICS', 'CHIDE', 'CHIEF', 'CHIEL', 'CHIKS', 'CHILD', 'CHILE', 'CHILI', 'CHILL', 'CHIMB',
    'CHIME', 'CHIMP', 'CHINA', 'CHINE', 'CHING', 'CHINK', 'CHINO', 'CHINS', 'CHIPS', 'CHIRK',
    'CHIRL', 'CHIRM', 'CHIRP', 'CHIRR', 'CHIRT', 'CHIRU', 'CHITS', 'CHIVE', 'CHIVS', 'CHIVY',
    'CHIZZ', 'CHOCK', 'CHOCO', 'CHOCS', 'CHODE', 'CHOGS', 'CHOIL', 'CHOIR', 'CHOKE', 'CHOKO',
    'CHOKY', 'CHOLA', 'CHOLE', 'CHOLI', 'CHOLO', 'CHOMP', 'CHONS', 'CHOOF', 'CHOOK', 'CHOOM',
    'CHOON', 'CHOOP', 'CHOPS', 'CHORD', 'CHORE', 'CHOSE', 'CHOTA', 'CHOTT', 'CHOUT', 'CHOUX',
    'CHOWK', 'CHOWS', 'CHOYA', 'CHOYS', 'CHUBS', 'CHUCK', 'CHUFA', 'CHUFF', 'CHUGS', 'CHUMP',
    'CHUMS', 'CHUNK', 'CHURL', 'CHURN', 'CHURR', 'CHUSE', 'CHUTE', 'CHUTS', 'CHYLE', 'CHYME',
    'CIBOL', 'CIDED', 'CIDER', 'CIDES', 'CIELS', 'CIGAR', 'CIGGY', 'CILIA', 'CILLS', 'CIMAR',
    'CIMEX', 'CINCH', 'CINCT', 'CINDER', 'CINES', 'CINQS', 'CIONS', 'CIPPI', 'CIRCA', 'CIRCS',
    'CIRES', 'CIRLS', 'CIRRI', 'CISCO', 'CISSY', 'CISTS', 'CITED', 'CITER', 'CITES', 'CIVES',
    'CIVET', 'CIVIC', 'CIVIE', 'CIVIL', 'CIVVY', 'CLACH', 'CLACK', 'CLADE', 'CLADS', 'CLAES',
    'CLAGS', 'CLAIM', 'CLAM', 'CLAMP', 'CLAMS', 'CLANG', 'CLANK', 'CLANS', 'CLAPS', 'CLAPT',
    'CLARO', 'CLART', 'CLARY', 'CLASH', 'CLASP', 'CLASS', 'CLAST', 'CLATS', 'CLAUT', 'CLAVE',
    'CLAVI', 'CLAWS', 'CLAYS', 'CLEAN', 'CLEAR', 'CLEAT', 'CLECK', 'CLEEK', 'CLEEP', 'CLEFS',
    'CLEFT', 'CLEGS', 'CLEIK', 'CLEMS', 'CLEPE', 'CLEPT', 'CLERK', 'CLEVE', 'CLEWS', 'CLICK',
    'CLIED', 'CLIES', 'CLIFF', 'CLIFT', 'CLIMB', 'CLIME', 'CLING', 'CLINK', 'CLINT', 'CLIPE',
    'CLIPS', 'CLIPT', 'CLIQUE', 'CLITS', 'CLOAK', 'CLOAM', 'CLOCK', 'CLODS', 'CLOGS', 'CLOMB',
    'CLOMP', 'CLONE', 'CLONK', 'CLONS', 'CLOOP', 'CLOOT', 'CLOPS', 'CLOSE', 'CLOTE', 'CLOTH',
    'CLOTS', 'CLOUD', 'CLOUR', 'CLOUS', 'CLOUT', 'CLOWN', 'CLOYS', 'CLOZE', 'CLUBS', 'CLUCK',
    'CLUED', 'CLUES', 'CLUEY', 'CLUMP', 'CLUNG', 'CLUNK', 'CLUPE', 'CLUSIA', 'CLYER', 'CLYPE',
    'CNIDA', 'COACH', 'COACT', 'COADY', 'COALS', 'COALY', 'COAPT', 'COARB', 'COAST', 'COATE',
    'COATI', 'COATS', 'COBBS', 'COBBY', 'COBIA', 'COBLE', 'COBRA', 'COBZA', 'COCAS', 'COCCI',
    'COCCO', 'COCKS', 'COCKY', 'COCOA', 'COCOS', 'CODAS', 'CODEC', 'CODED', 'CODER', 'CODES',
    'CODEX', 'CODON', 'COEDS', 'COFFS', 'COGIE', 'COGON', 'COGUE', 'COHAB', 'COHEN', 'COHOE',
    'COHOG', 'COHOS', 'COIFS', 'COIGN', 'COILS', 'COINS', 'COIRS', 'COITS', 'COKED', 'COKES',
    'COLAS', 'COLBY', 'COLDS', 'COLED', 'COLES', 'COLEY', 'COLIC', 'COLIN', 'COLLS', 'COLLY',
    'COLOG', 'COLON', 'COLOR', 'COLTS', 'COLZA', 'COMAE', 'COMAL', 'COMAS', 'COMBE', 'COMBI',
    'COMBO', 'COMBS', 'COMBY', 'COMER', 'COMES', 'COMET', 'COMFY', 'COMIC', 'COMIX', 'COMMA',
    'COMMO', 'COMMS', 'COMMY', 'COMPO', 'COMPS', 'COMPT', 'COMTE', 'COMUS', 'CONCH', 'CONDO',
    'CONDS', 'CONED', 'CONES', 'CONEY', 'CONFS', 'CONGA', 'CONGE', 'CONGO', 'CONIC', 'CONIN',
    'CONKS', 'CONKY', 'CONNE', 'CONNS', 'CONTE', 'CONTO', 'CONUS', 'COOCH', 'COOED', 'COOEE',
    'COOER', 'COOEY', 'COOFS', 'COOKS', 'COOKY', 'COOLS', 'COOLY', 'COOMB', 'COOMS', 'COOMY',
    'COONS', 'COOPS', 'COOPT', 'COOST', 'COOTS', 'COOZE', 'COPAL', 'COPAY', 'COPED', 'COPEN',
    'COPER', 'COPES', 'COPHS', 'COPIA', 'COPIS', 'COPPY', 'COPRA', 'COPSE', 'COPSY', 'COQUI',
    'CORBE', 'CORBY', 'CORED', 'CORER', 'CORES', 'CORGI', 'CORIA', 'CORKS', 'CORKY', 'CORMS',
    'CORNS', 'CORNU', 'CORNY', 'CORPS', 'CORSE', 'CORSO', 'CORZA', 'COSEC', 'COSED', 'COSES',
    'COSET', 'COSEY', 'COSIE', 'COSMO', 'COSTS', 'COTAN', 'COTED', 'COTES', 'COTHS', 'COTTA',
    'COTTS', 'COUCH', 'COUDE', 'COUGH', 'COULD', 'COUNT', 'COUPE', 'COUPS', 'COURB', 'COURD',
    'COURE', 'COURS', 'COURT', 'COUTA', 'COUTH', 'COVED', 'COVEN', 'COVER', 'COVES', 'COVET',
    'COVEY', 'COVIN', 'COWAL', 'COWAN', 'COWED', 'COWER', 'COWKS', 'COWLS', 'COWPS', 'COWRY',
    'COXAE', 'COXAL', 'COXED', 'COXES', 'COYDOG', 'COYED', 'COYER', 'COYLY', 'COYPU', 'COYPU',
    'COZEN', 'COZES', 'COZEY', 'COZIE', 'COZZA', 'CRABS', 'CRACK', 'CRAFT', 'CRAGS', 'CRAIC',
    'CRAIG', 'CRAKE', 'CRAMP', 'CRAMS', 'CRANE', 'CRANK', 'CRANS', 'CRAPE', 'CRAPS', 'CRAPY',
    'CRARE', 'CRASH', 'CRASS', 'CRATE', 'CRAVE', 'CRAWL', 'CRAWS', 'CRAZE', 'CRAZY', 'CREAK',
    'CREAM', 'CREAT', 'CREDS', 'CREED', 'CREEK', 'CREEL', 'CREEP', 'CREES', 'CREME', 'CREMS',
    'CRENA', 'CREPE', 'CREPS', 'CREPY', 'CRESS', 'CREST', 'CREWE', 'CREWS', 'CRIAS', 'CRIBS',
    'CRICK', 'CRIED', 'CRIER', 'CRIES', 'CRIME', 'CRIMP', 'CRIMS', 'CRINE', 'CRIOS', 'CRIPE',
    'CRISP', 'CRITS', 'CROAK', 'CROCI', 'CROCK', 'CROCS', 'CROFT', 'CROGS', 'CROIK', 'CROJIK',
    'CROME', 'CRONE', 'CRONK', 'CRONS', 'CRONY', 'CROOK', 'CROOL', 'CROON', 'CROPS', 'CRORE',
    'CROSS', 'CROST', 'CROUP', 'CROUT', 'CROWD', 'CROWN', 'CROWS', 'CROZE', 'CRUCK', 'CRUDE',
    'CRUDS', 'CRUEL', 'CRUES', 'CRUET', 'CRUFT', 'CRUMB', 'CRUMP', 'CRUMS', 'CRUNK', 'CRURA',
    'CRUSE', 'CRUSH', 'CRUST', 'CRUSY', 'CRUTH', 'CRWTH', 'CRYAL', 'CRYER', 'CRYPT', 'CTENE',
    'CUBAN', 'CUBBY', 'CUBED', 'CUBER', 'CUBES', 'CUBIC', 'CUBIT', 'CUBITS', 'CUDDY', 'CUFFO',
    'CUFFS', 'CUIFS', 'CUING', 'CUISH', 'CUITS', 'CUKES', 'CULCH', 'CULET', 'CULEX', 'CULLS',
    'CULLY', 'CULMS', 'CULPA', 'CULTI', 'CULTS', 'CULTY', 'CUMBE', 'CUMIN', 'CUMQUAT', 'CUNIT',
    'CUNTS', 'CUPEL', 'CUPID', 'CUPPA', 'CUPPY', 'CURBS', 'CURCH', 'CURDS', 'CURDY', 'CURED',
    'CURER', 'CURES', 'CURFS', 'CURIA', 'CURIE', 'CURIO', 'CURLS', 'CURLY', 'CURNS', 'CURNY',
    'CURRS', 'CURRY', 'CURSE', 'CURSI', 'CURST', 'CURVE', 'CURVY', 'CUSCO', 'CUSEC', 'CUSHY',
    'CUSKS', 'CUSPS', 'CUSPY', 'CUSSO', 'CUSUM', 'CUTCH', 'CUTER', 'CUTES', 'CUTEY', 'CUTIE',
    'CUTIN', 'CUTIS', 'CUTS', 'CUTTY', 'CUTUP', 'CUVEE', 'CUZES', 'CWTCH', 'CYANO', 'CYANS',
    'CYBER', 'CYCAD', 'CYCAS', 'CYCLE', 'CYCLO', 'CYDER', 'CYLIX', 'CYMAE', 'CYMAR', 'CYMAS',
    'CYMES', 'CYMOL', 'CYNIC', 'CYSTS', 'CYTES', 'CYTON', 'CZARS', 'CZECH', 'DAALS', 'DABER',
    // ... (continue with more words - this would be thousands more in a real implementation)
    ];

  // FIXED: Get today's word - ensures ALL users get the same word
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

  // FIXED: Reconstruct board from completed game
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

  // FIXED: Initialize game - removed circular dependency
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
  }, [session?.user?.id]); // Removed todaysGameData from dependencies

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver || hasPlayedToday || !initialized) return;

      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (/^[A-Za-z]$/.test(e.key)) {
        handleLetterInput(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentRow, currentCol, gameOver, hasPlayedToday, initialized, board]);

  const handleLetterInput = (letter) => {
    if (currentCol < 5) {
      const newBoard = board.map(row => [...row]);
      newBoard[currentRow][currentCol] = { ch: letter, state: '' };
      setBoard(newBoard);
      setCurrentCol(currentCol + 1);
    }
  };

  const handleBackspace = () => {
    if (currentCol > 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[currentRow][currentCol - 1] = { ch: '', state: '' };
      setBoard(newBoard);
      setCurrentCol(currentCol - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentCol !== 5) {
      setMessage('Word too short');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const guess = board[currentRow].map(cell => cell.ch).join('');
    
    // Use VALID_GUESSES for validation (much more permissive)
    if (!VALID_GUESSES.includes(guess)) {
      setMessage('Not in word list');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Check the guess against target word
    const newBoard = board.map(row => [...row]);
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    
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
    if (guess === targetWord) {
      const points = 7 - currentRow - 1; // 6 points for row 0, 5 for row 1, etc.
      await awardPoints(points, true, guess, letterStates);
      setIsWinner(true);
      setGameOver(true);
      setMessage(`Congratulations! You got it in ${currentRow + 1} ${currentRow + 1 === 1 ? 'try' : 'tries'}! (+${points} points)`);
    } else if (currentRow === 5) {
      // Game over, award 1 point for trying
      await awardPoints(1, false, guess, letterStates);
      setGameOver(true);
      setMessage(`Game over! The word was ${targetWord}. (+1 point for trying)`);
    } else {
      // Continue to next row
      setCurrentRow(currentRow + 1);
      setCurrentCol(0);
    }
  };

  // FIXED: Enhanced points awarding with guess storage
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

    shareText += `\nPlay at: [Your Website URL]`;

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

  // FIXED: Loading state
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
          Guess the business word in 6 tries!
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

      {/* Virtual Keyboard */}
      {!hasPlayedToday && !gameOver && (
        <div className="space-y-2">
          {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {rowIndex === 2 && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-3 rounded font-bold transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--umn-maroon)',
                    color: 'white'
                  }}
                >
                  ENTER
                </button>
              )}
              {row.split('').map(letter => (
                <button
                  key={letter}
                  onClick={() => handleLetterInput(letter)}
                  className="w-10 h-12 rounded font-bold transition-colors duration-200 border-2"
                  style={{
                    backgroundColor: 'var(--panel)',
                    color: 'var(--umn-maroon)',
                    borderColor: 'var(--line)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--umn-maroon)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--panel)';
                    e.target.style.color = 'var(--umn-maroon)';
                  }}
                >
                  {letter}
                </button>
              ))}
              {rowIndex === 2 && (
                <button
                  onClick={handleBackspace}
                  className="px-4 py-3 rounded font-bold transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--umn-maroon)',
                    color: 'white'
                  }}
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
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