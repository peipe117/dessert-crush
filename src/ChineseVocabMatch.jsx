import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Sparkles, RefreshCw, Trophy, BookOpen, Lightbulb, Share2, 
  Volume2, VolumeX, Bomb, Candy, Target, ArrowRight, X, Star, Plus, Snowflake, Home, Repeat,
  Cake, Smartphone, Download, PenTool, HelpCircle, MousePointer2, Maximize, Minimize, Trash2
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, 
  query, orderBy, limit, doc, setDoc, updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ----------------------------------------------------------------------
// ⚠️ 全域配置
// ----------------------------------------------------------------------

const GRID_SIZE = 8;
const ITEM_BOMB = '$$BOMB$$';
const ITEM_CANDY = '$$CANDY$$';

// 預設課程資料
let LESSON_DATA = {
  0: "🐭🐮🐯🐰🐲🐍🐴🐑🐵🐔🐶🐷", // 12生肖
  1: "新同學自己年跟比",
  2: "外公以前工作班後",
  3: "去近買東西魚還可",
  4: "出先週末晚蛋飯現點",
  5: "黃綠色時候花子紅白",
  6: "華說對星期會每給如果",
  7: "起累早洗昨過別忘用臉",
  8: "送隻狗帶散步貓非愛",
  9: "南北方裡校門口因為所",
  10: "本著退休次旅行法國",
  11: "動物園老希望但胖真長",
  12: "久話高課寫沒題定意思",
  13: "🍰🍩🍪🍮🍦🍭🍬🍫" // 🍰 甜點關
};

// 🗣️ 發音對照表 (包含生肖與甜點)
const PRONUNCIATION_MAP = {
  // 生肖
  "🐭": "鼠", "🐮": "牛", "🐯": "虎", "🐰": "兔", 
  "🐲": "龍", "🐍": "蛇", "🐴": "馬", "🐑": "羊", 
  "🐵": "猴", "🐔": "雞", "🐶": "狗", "🐷": "豬",
  // 甜點
  "🍰": "蛋糕", "🍩": "甜甜圈", "🍪": "餅乾", "🍮": "布丁",
  "🍦": "冰淇淋", "🍭": "棒棒糖", "🍬": "糖果", "🍫": "巧克力"
};

const DESSERT_ICONS = ['🧁', '🍩', '🍰', '🍪', '🍮'];

// 🎨 回歸初始風格 (Original Saturated Style) 但移除易混淆色 🎨
const DISTINCT_PALETTE = [
  { bg: "#FFCDD2", border: "#E53935", text: "#B71C1C" }, // 1. 紅 (Red)
  { bg: "#FFE0B2", border: "#FB8C00", text: "#E65100" }, // 2. 橙 (Orange)
  { bg: "#FFF9C4", border: "#FBC02D", text: "#F57F17" }, // 3. 黃 (Yellow)
  { bg: "#C8E6C9", border: "#43A047", text: "#1B5E20" }, // 4. 綠 (Green)
  { bg: "#B2EBF2", border: "#00ACC1", text: "#006064" }, // 5. 青 (Cyan)
  { bg: "#BBDEFB", border: "#1E88E5", text: "#0D47A1" }, // 6. 藍 (Blue)
  { bg: "#E1BEE7", border: "#8E24AA", text: "#4A148C" }, // 7. 紫 (Purple)
  { bg: "#D7CCC8", border: "#8D6E63", text: "#3E2723" }, // 8. 棕 (Brown)
  // 移除灰藍色 (太暗)
  { bg: "#F0F4C3", border: "#AFB42B", text: "#827717" }, // 9. 萊姆 (Lime) - 與黃/綠區隔
  { bg: "#F8BBD0", border: "#EC407A", text: "#880E4F" }, // 10. 粉紅 (Pink) - 與紅區隔
  // 移除藍綠色 (易與青色混淆)
];

// ✅ 請使用您自己的 Firebase Config ✅
const firebaseConfig = {
  apiKey: "AIzaSyADRB5Mi8snvwJZL_kG8nYK9-I48obb-qE",
  authDomain: "wordcrush-e5535.firebaseapp.com",
  projectId: "wordcrush-e5535",
  storageBucket: "wordcrush-e5535.firebasestorage.app",
  messagingSenderId: "613321542933",
  appId: "1:613321542933:web:08922c724513a6b5296d1c"
};

// --- 初始化 Firebase ---
let db, auth;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase 初始化失敗", e);
}

// --- 音效工具 ---
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const playSound = (type, isEnabled = true) => {
  if (!isEnabled) return; // 如果靜音，直接返回
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain(); 
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch (type) {
    case 'select':
      osc.frequency.setValueAtTime(440, now);
      gainNode.gain.setValueAtTime(0.05, now);
      osc.start(); osc.stop(now + 0.1);
      break;
    case 'match3':
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gainNode.gain.setValueAtTime(0.08, now);
      osc.start(); osc.stop(now + 0.2);
      break;
    case 'win':
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(783, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(); osc.stop(now + 0.5);
      break;
    case 'bomb':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gainNode.gain.setValueAtTime(0.15, now);
      osc.start(); osc.stop(now + 0.3);
      break;
    case 'collect':
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1760, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(); osc.stop(now + 0.15);
      break;
    case 'ice':
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(); osc.stop(now + 0.15);
      break;
    case 'combo':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(); osc.stop(now + 0.2);
      break;
    default: break;
  }
};

const speakText = (text, enabled) => {
  if (!enabled || !window.speechSynthesis) return;
  if (text === ITEM_BOMB || text === ITEM_CANDY) return;
  window.speechSynthesis.cancel();
  // ✅ 使用發音對照表 (確保布丁念對)
  const spoken = PRONUNCIATION_MAP[text] || text;
  const utterance = new SpeechSynthesisUtterance(String(spoken));
  utterance.lang = 'zh-TW';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
};

// --- 子組件：慶祝紙花 ---
const ConfettiEffect = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      color: DISTINCT_PALETTE[Math.floor(Math.random() * DISTINCT_PALETTE.length)].text,
      delay: Math.random() * 1.5 + 's',
      duration: 2 + Math.random() * 2 + 's',
      size: 8 + Math.random() * 8 + 'px',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute top-[-20px] animate-confetti-fall"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

// --- 優化：漂浮甜點背景 (z-index: 0) ---
const FloatingDessertBackground = () => {
    const items = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            icon: DESSERT_ICONS[i % DESSERT_ICONS.length],
            left: `${(i * 13 + 5) % 95}%`,
            top: `${(i * 19 + 7) % 90}%`,
            delay: `${i * 0.5}s`,
            duration: `${8 + (i % 5)}s`,
            size: `${2.5 + (i % 3)}rem`
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
            {items.map((item) => (
                <div 
                    key={item.id}
                    className="absolute animate-float"
                    style={{
                        left: item.left,
                        top: item.top,
                        fontSize: item.size,
                        animationDelay: item.delay,
                        animationDuration: item.duration,
                        opacity: 0.6,
                        filter: 'blur(1px)'
                    }}
                >
                    {item.icon}
                </div>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------
// 主程式組件
// ----------------------------------------------------------------------

export default function App() {
  // ✅ 修正：從 URL 初始化 currentLesson
  const [currentLesson, setCurrentLesson] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const lessonId = searchParams.get('lesson');
      // 確保 lessonId 存在且在 LESSON_DATA 中
      if (lessonId && LESSON_DATA[lessonId]) {
        return Number(lessonId);
      }
    }
    return 0;
  });

  const [board, setBoard] = useState([]);
  const [activeChars, setActiveChars] = useState([]); 
  const [colorMap, setColorMap] = useState({}); 
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(80); 
  const [gameState, setGameState] = useState('welcome'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchMessage, setMatchMessage] = useState(""); 
  const [combo, setCombo] = useState(0);
  const [hintTiles, setHintTiles] = useState([]); 
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hoveredTile, setHoveredTile] = useState(null); 
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastTargetHit, setLastTargetHit] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [gameStages, setGameStages] = useState([]); 
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [levelTargets, setLevelTargets] = useState([]); 
  const messageTimeoutRef = useRef(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false); 

  // ✅ 自訂題目相關狀態 ✅
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState("");

  const [inputName, setInputName] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('wordcrush_player_name') || "") : "";
  });
  const [playerName, setPlayerName] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  const [bombCount, setBombCount] = useState(0);
  const [candyCount, setCandyCount] = useState(0);
  const [activeTool, setActiveTool] = useState(null);

  // --- Logic Helpers ---

  // 監聽全螢幕變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error("無法進入全螢幕模式", e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const findMatches = useCallback((currentBoard) => {
    const matches = [];
    if (!currentBoard || currentBoard.length === 0) return matches;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const char = currentBoard[r][c].char;
        if (!char || char === ITEM_BOMB || char === ITEM_CANDY) continue; 
        let len = 1;
        while (c + len < GRID_SIZE && currentBoard[r][c + len].char === char) len++;
        if (len >= 3) { for (let i = 0; i < len; i++) matches.push({ r, c: c + i }); c += len - 1; }
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const char = currentBoard[r][c].char;
        if (!char || char === ITEM_BOMB || char === ITEM_CANDY) continue;
        let len = 1;
        while (r + len < GRID_SIZE && currentBoard[r + len][c].char === char) len++;
        if (len >= 3) { for (let i = 0; i < len; i++) matches.push({ r: r + i, c }); r += len - 1; }
      }
    }
    return matches;
  }, []);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffleBoard = useCallback((currentBoard, chars) => {
    const allExistingChars = currentBoard.flat().map(cell => cell.char).filter(c => c !== null && c !== ITEM_BOMB && c !== ITEM_CANDY);
    const shuffledPool = shuffleArray(allExistingChars);
    const newBoard = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let char;
        if (currentBoard[r] && (currentBoard[r][c].char === ITEM_BOMB || currentBoard[r][c].char === ITEM_CANDY)) {
            char = currentBoard[r][c].char;
        } else if (shuffledPool.length > 0) {
            char = shuffledPool.pop();
        } else {
            char = chars[Math.floor(Math.random() * chars.length)];
        }
        const isFrozen = currentBoard[r][c].isFrozen;
        row.push({ char, id: `s-${r}-${c}-${Math.random()}`, isMatched: false, isNew: true, isFrozen });
      }
      newBoard.push(row);
    }
    return newBoard;
  }, []);

  const generateBoard = useCallback((chars, isInitial = false, isAdvanced = false) => {
    const newBoard = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let char;
        do { char = chars[Math.floor(Math.random() * chars.length)]; } 
        while (
          (c >= 2 && row[c - 1].char === char && row[c - 2].char === char) ||
          (r >= 2 && newBoard[r - 1][c].char === char && newBoard[r - 2][c].char === char)
        );
        const isFrozen = isAdvanced && Math.random() < 0.15;
        row.push({ char, id: `t-${r}-${c}-${Math.random()}`, isMatched: false, isNew: isInitial, isFrozen: isFrozen });
      }
      newBoard.push(row);
    }
    return newBoard;
  }, []);

  const getCharStyle = useCallback((char) => {
    if (char === ITEM_BOMB) return { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A', color: '#D32F2F', borderWidth: '2px' };
    if (char === ITEM_CANDY) return { backgroundColor: '#F3E5F5', borderColor: '#CE93D8', color: '#7B1FA2', borderWidth: '2px' };
    const theme = colorMap[char] || DISTINCT_PALETTE[0];
    return {
        backgroundColor: theme.bg, 
        borderColor: theme.border,
        color: theme.text,
        boxShadow: 'none', 
        borderWidth: '2px'
    };
  }, [colorMap]);

  const applyGravity = useCallback((currentBoard, chars, isAdvanced = false) => {
    const newBoard = JSON.parse(JSON.stringify(currentBoard));
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyCount = 0;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newBoard[r][c].char === null) emptyCount++;
        else if (emptyCount > 0) {
          newBoard[r + emptyCount][c] = { ...newBoard[r][c], isNew: false, isMatched: false };
          newBoard[r][c].char = null;
        }
      }
      for (let r = 0; r < emptyCount; r++) {
        const isFrozen = isAdvanced && Math.random() < 0.1;
        newBoard[r][c] = { 
            char: chars[Math.floor(Math.random() * chars.length)], 
            id: `n-${Date.now()}-${Math.random()}`, 
            isMatched: false, 
            isNew: true,
            isFrozen: isFrozen
        };
      }
    }
    return newBoard;
  }, []);

  const showGameMessage = (msg, duration = 1200) => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      setMatchMessage(msg);
      messageTimeoutRef.current = setTimeout(() => {
          setMatchMessage("");
      }, duration);
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    if (currentLesson !== 999) url.searchParams.set('lesson', currentLesson.toString());
    const textToCopy = url.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showGameMessage(`連結已複製!`))
        .catch(() => fallbackCopyTextToClipboard(textToCopy));
    } else {
      fallbackCopyTextToClipboard(textToCopy);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showGameMessage(`連結已複製!`);
      } else {
        showGameMessage(`複製失敗`);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      showGameMessage(`複製失敗`);
    }

    document.body.removeChild(textArea);
  };

  const setupStage = useCallback((lessonIndex, stageIndex, stages, isAdvanced) => {
    const currentStageChars = stages[stageIndex];
    if (!currentStageChars) return;
    let boardChars = [...currentStageChars];
    if (boardChars.length < 6) {
        const fullPool = Array.from(LESSON_DATA[lessonIndex] || LESSON_DATA[1]);
        const fillers = shuffleArray(fullPool.filter(c => !boardChars.includes(c)));
        boardChars = [...boardChars, ...fillers.slice(0, 6 - boardChars.length)];
    }
    setActiveChars(boardChars);
    setLevelTargets(currentStageChars.map(char => ({ char, count: 15 })));
    setBoard(generateBoard(boardChars, true, isAdvanced));
    setMoves(80); 
    setCombo(0);
    setGameState('playing');
  }, [generateBoard]);

  const startNewLesson = useCallback((lesson, isAdvanced = false) => {
    const pool = LESSON_DATA[lesson] || LESSON_DATA[1];
    const allCharsInLesson = Array.from(new Set(Array.from(pool).filter(c => c.trim() !== '')));
    
    // ✅ 這裡使用新的配色表，但因為有 shuffleArray，顏色會隨機分配
    const shuffledColors = shuffleArray(DISTINCT_PALETTE);
    const newGlobalColorMap = {};
    allCharsInLesson.forEach((char, index) => {
        newGlobalColorMap[char] = shuffledColors[index % shuffledColors.length];
    });
    setColorMap(newGlobalColorMap);

    // ✅ 修改這裡：針對 Lesson 0 (12生肖) 設定 chunkSize 為 4，這樣 12/4 = 3 關
    const chunkSize = (lesson === 0 || lesson === 13 || allCharsInLesson.length === 8) ? 4 : 5;
    
    const stages = [];
    for (let i = 0; i < allCharsInLesson.length; i += chunkSize) { 
        stages.push(allCharsInLesson.slice(i, i + chunkSize)); 
    }
    
    setGameStages(stages);
    setCurrentStageIndex(0);
    setScore(0);
    setCombo(0);
    // 寶物不歸零
    setIsProcessing(false);
    setSelectedTile(null);
    setHintTiles([]);
    setActiveTool(null);
    setIsAdvancedMode(isAdvanced);
    setupStage(lesson, 0, stages, isAdvanced);
  }, [setupStage]);

  const handleCustomStart = () => {
      if (!customText.trim()) return;
      const cleanText = customText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
      const uniqueChars = Array.from(new Set(cleanText));
      
      if (uniqueChars.length < 6) {
          alert('請至少輸入 6 個不同的文字喔！');
          return;
      }
      
      LESSON_DATA[999] = uniqueChars.join('');
      setCurrentLesson(999);
      setShowCustomModal(false);
      startNewLesson(999, false);
  };

  // ✅ 新增：刪除自訂題目的功能
  const handleDeleteCustom = () => {
      if (LESSON_DATA[999]) {
          delete LESSON_DATA[999];
      }
      setCustomText("");
      // 如果當前是在自訂關卡，強制跳回第0課
      if (Number(currentLesson) === 999) {
          setCurrentLesson(0);
          startNewLesson(0, false);
      }
      setShowCustomModal(false);
      showGameMessage("自訂題目已刪除");
  };

  const processBoard = async (startBoard) => {
    setIsProcessing(true);
    let tempBoard = JSON.parse(JSON.stringify(startBoard));
    let hasMatches = true;
    let loopCount = 0;
    const turnMatches = [];

    while (hasMatches && loopCount < 15) {
      const matches = findMatches(tempBoard);
      if (matches.length === 0) { hasMatches = false; break; }
      
      const currentCombo = loopCount + 1;
      setCombo(currentCombo);
      
      if (currentCombo === 1) {
        if (matches.length >= 10) setMatchMessage("UNBELIEVABLE!");
        else if (matches.length >= 7) setMatchMessage("AMAZING!");
        else if (matches.length >= 5) setMatchMessage("GREAT!");
        else setMatchMessage("Good!");
        setTimeout(() => setMatchMessage(""), 1200);
        // ✅ 修正：傳入 audioEnabled
        playSound('match3', audioEnabled);
        const firstMatchChar = tempBoard[matches[0].r][matches[0].c].char;
        if (firstMatchChar !== ITEM_BOMB && firstMatchChar !== ITEM_CANDY) {
            speakText(firstMatchChar, audioEnabled);
        }
      } else {
        // ✅ 修正：傳入 audioEnabled
        playSound('combo', audioEnabled);
        showGameMessage(`${currentCombo} COMBO!`, 1000);
      }

      let spawnReward = null;
      let spawnIndex = -1;
      if (matches.length >= 5) spawnReward = ITEM_CANDY;
      else if (matches.length >= 4) spawnReward = ITEM_BOMB;
      if (spawnReward) spawnIndex = Math.floor(matches.length / 2);

      let iceBroken = false;

      matches.forEach(({ r, c }, idx) => {
        if (tempBoard[r][c].isFrozen) {
            tempBoard[r][c].isFrozen = false;
            tempBoard[r][c].isMatched = true; 
            iceBroken = true;
        } else {
            if (tempBoard[r][c].char && tempBoard[r][c].char !== ITEM_BOMB && tempBoard[r][c].char !== ITEM_CANDY) {
                turnMatches.push(tempBoard[r][c].char);
            }
            tempBoard[r][c].isMatched = true;
            if (idx === spawnIndex && spawnReward) tempBoard[r][c].spawnItem = spawnReward;
        }
      });
      
      // ✅ 修正：傳入 audioEnabled
      if (iceBroken) playSound('ice', audioEnabled);

      setBoard([...tempBoard]);
      await new Promise(r => setTimeout(r, 400)); 

      matches.forEach(({ r, c }, idx) => {
        if (!startBoard[r][c].isFrozen) { 
             if (idx === spawnIndex && spawnReward) {
                tempBoard[r][c].char = spawnReward; 
                tempBoard[r][c].isMatched = false;
                tempBoard[r][c].isNew = true; 
                delete tempBoard[r][c].spawnItem;
            } else {
                tempBoard[r][c].char = null;
            }
        } else {
             tempBoard[r][c].isMatched = false;
        }
      });
      
      setScore(prev => prev + (matches.length * 10 * currentCombo));
      setBoard([...tempBoard]);
      await new Promise(r => setTimeout(r, 100));
      
      tempBoard = applyGravity(tempBoard, activeChars, isAdvancedMode);
      setBoard([...tempBoard]);
      await new Promise(r => setTimeout(r, 500));
      loopCount++;
    }

    if (turnMatches.length > 0) {
      setLevelTargets(prev => prev.map(t => {
        const foundCount = turnMatches.filter(c => c === t.char).length;
        if (foundCount > 0) {
            setLastTargetHit(t.char);
            setTimeout(() => setLastTargetHit(null), 600);
            if (t.count - foundCount <= 0 && t.count > 0) {
                // ✅ 修正：傳入 audioEnabled
                playSound('win', audioEnabled);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2500);
            }
        }
        return { ...t, count: Math.max(0, t.count - foundCount) };
      }));
    }
    setCombo(0);
    setIsProcessing(false);
  };

  const handleTileClick = async (r, c) => {
    if (gameState !== 'playing' || isProcessing) return;
    const clickedCell = board[r][c];

    if (clickedCell.char === ITEM_BOMB) {
        // ✅ 修正：傳入 audioEnabled
        playSound('collect', audioEnabled);
        setBombCount(prev => prev + 1);
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[r][c].char = null;
        setBoard(newBoard);
        showGameMessage("+1 炸彈!", 800);
        setTimeout(() => {
            setMatchMessage("");
            const filledBoard = applyGravity(newBoard, activeChars, isAdvancedMode);
            setBoard(filledBoard);
            processBoard(filledBoard);
        }, 500);
        return;
    }
    if (clickedCell.char === ITEM_CANDY) {
        // ✅ 修正：傳入 audioEnabled
        playSound('collect', audioEnabled);
        setCandyCount(prev => prev + 1);
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[r][c].char = null;
        setBoard(newBoard);
        showGameMessage("+1 消除!", 800);
        setTimeout(() => {
            setMatchMessage("");
            const filledBoard = applyGravity(newBoard, activeChars, isAdvancedMode);
            setBoard(filledBoard);
            processBoard(filledBoard);
        }, 500);
        return;
    }

    if (activeTool === 'bomb') {
      setBombCount(prev => prev - 1); setActiveTool(null); setHoveredTile(null); 
      // ✅ 修正：傳入 audioEnabled
      playSound('bomb', audioEnabled);
      let tempBoard = JSON.parse(JSON.stringify(board));
      const exploded = [];
      for(let i = r-1; i <= r+1; i++) {
        for(let j = c-1; j <= c+1; j++) {
          if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
            if(tempBoard[i][j].char && tempBoard[i][j].char !== ITEM_BOMB && tempBoard[i][j].char !== ITEM_CANDY) { 
                exploded.push(tempBoard[i][j].char); 
                tempBoard[i][j].isMatched = true; 
            }
            else if (tempBoard[i][j].char) {
                tempBoard[i][j].isMatched = true;
            }
          }
        }
      }
      setBoard([...tempBoard]);
      await new Promise(r => setTimeout(r, 400));
      for(let i = r-1; i <= r+1; i++) {
        for(let j = c-1; j <= c+1; j++) {
            if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) tempBoard[i][j].char = null;
        }
      }
      setLevelTargets(prev => prev.map(t => {
        const countLost = exploded.filter(c=>c===t.char).length;
        if (countLost > 0 && t.count - countLost <= 0 && t.count > 0) {
            setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500);
        }
        return {...t, count: Math.max(0, t.count - countLost)};
      }));
      tempBoard = applyGravity(tempBoard, activeChars, isAdvancedMode);
      setBoard(tempBoard);
      await new Promise(r => setTimeout(r, 500));
      await processBoard(tempBoard); 
      return;
    }

    if (activeTool === 'candy') {
      const target = board[r][c].char; 
      if (target === ITEM_BOMB || target === ITEM_CANDY) return; 

      setCandyCount(prev => prev - 1); setActiveTool(null); 
      // ✅ 修正：傳入 audioEnabled
      playSound('win', audioEnabled); 
      speakText(target, audioEnabled);
      let tempBoard = JSON.parse(JSON.stringify(board));
      let count = 0;
      for(let rr=0; rr<GRID_SIZE; rr++) {
        for(let cc=0; cc<GRID_SIZE; cc++) {
          if (tempBoard[rr][cc].char === target) { tempBoard[rr][cc].isMatched = true; count++; }
        }
      }
      setBoard([...tempBoard]);
      await new Promise(r => setTimeout(r, 400));
      for(let rr=0; rr<GRID_SIZE; rr++) {
        for(let cc=0; cc<GRID_SIZE; cc++) {
            if (tempBoard[rr][cc].char === target) tempBoard[rr][cc].char = null;
        }
      }
      setLevelTargets(prev => prev.map(t => {
        if (t.char === target && t.count > 0) {
            setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500);
            return {...t, count: 0};
        }
        return t;
      }));
      tempBoard = applyGravity(tempBoard, activeChars, isAdvancedMode);
      setBoard(tempBoard);
      await new Promise(r => setTimeout(r, 500));
      await processBoard(tempBoard);
      return;
    }

    speakText(board[r][c].char, audioEnabled);
    if (hintTiles.length > 0) setHintTiles([]);

    if (!selectedTile) { 
        setSelectedTile({ r, c }); 
        // ✅ 修正：傳入 audioEnabled
        playSound('select', audioEnabled); 
        return; 
    }
    const { r: r1, c: c1 } = selectedTile;
    if (r1 === r && c1 === c) { setSelectedTile(null); return; }

    if (Math.abs(r1 - r) + Math.abs(c1 - c) === 1) {
      const newBoard = JSON.parse(JSON.stringify(board));
      let tmp = newBoard[r][c].char;
      let tmpFrozen = newBoard[r][c].isFrozen; 
      
      newBoard[r][c].char = newBoard[r1][c1].char;
      newBoard[r][c].isFrozen = newBoard[r1][c1].isFrozen;
      
      newBoard[r1][c1].char = tmp;
      newBoard[r1][c1].isFrozen = tmpFrozen;
      
      setBoard(newBoard);
      setSelectedTile(null);
      if (findMatches(newBoard).length > 0) {
        setMoves(prev => prev - 1);
        await processBoard(newBoard);
      } else {
        setTimeout(() => setBoard(board), 300);
      }
    } else {
      setSelectedTile({ r, c }); 
      // ✅ 修正：傳入 audioEnabled
      playSound('select', audioEnabled);
    }
  };

  const handleGiveHint = () => {
    const b = JSON.parse(JSON.stringify(board));
    let found = false;
    let r1, c1, r2, c2;

    for (let r = 0; r < GRID_SIZE && !found; r++) {
      for (let c = 0; c < GRID_SIZE && !found; c++) {
        if (c < GRID_SIZE - 1) {
          let char1 = b[r][c].char; let char2 = b[r][c+1].char;
          b[r][c].char = char2; b[r][c+1].char = char1;
          if (findMatches(b).length > 0) { r1=r; c1=c; r2=r; c2=c+1; found=true; }
          b[r][c].char = char1; b[r][c+1].char = char2; 
        }
        if (!found && r < GRID_SIZE - 1) {
          let char1 = b[r][c].char; let char2 = b[r+1][c].char;
          b[r][c].char = char2; b[r+1][c].char = char1;
          if (findMatches(b).length > 0) { r1=r; c1=c; r2=r+1; c2=c; found=true; }
          b[r][c].char = char1; b[r+1][c].char = char2;
        }
      }
    }

    if (found) {
      setHintTiles([{ r: r1, c: c1, dr: r2 - r1, dc: c2 - c1 }, { r: r2, c: c2, dr: r1 - r2, dc: c1 - c2 }]);
      setIsProcessing(true);
      setTimeout(() => {
        setHintTiles([]);
        setIsProcessing(false);
      }, 800); 
    } else {
      showGameMessage("No moves! Shuffling...");
      setTimeout(() => {
          const shuffled = shuffleBoard(board, activeChars);
          setBoard(shuffled);
          showGameMessage("");
          processBoard(shuffled);
      }, 1500);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    // ✅ 修正：使用 inputName 來設定
    const finalName = inputName.trim();
    if (!finalName) return;
    
    localStorage.setItem('wordcrush_player_name', finalName);
    setPlayerName(finalName); // ✅ 確認玩家名稱，這會觸發 Effect

    if (db && auth.currentUser) {
      try {
        await setDoc(doc(db, "players", finalName), {
          name: finalName,
          score: 0,
          lesson: currentLesson,
          lastSeen: serverTimestamp(),
          uid: auth.currentUser.uid 
        }, { merge: true });
      } catch (err) { console.error(err); }
    }
    startNewLesson(currentLesson);
  };

  const handleNextStage = () => {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < gameStages.length) {
      setCurrentStageIndex(nextIndex);
      setupStage(currentLesson, nextIndex, gameStages, isAdvancedMode);
    }
  };

  const goToNextLevel = () => {
    // 邏輯：0(生肖) -> 1 -> 2 ... -> 12 -> 13 -> 0 循環
    const nextLesson = currentLesson < 13 ? currentLesson + 1 : 0;
    setCurrentLesson(nextLesson);
    startNewLesson(nextLesson, false); 
  };

  useEffect(() => {
    if (db && auth) {
      signInAnonymously(auth).then(() => setIsFirebaseReady(true)).catch(e => console.error(e));
      return onAuthStateChanged(auth, u => setCurrentUser(u));
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;
    const qL = query(collection(db, "players"), orderBy("score", "desc"), limit(20));
    return onSnapshot(qL, s => setLeaderboard(s.docs.map(d => ({ ...d.data(), id: d.id })).filter(u => Number(u.score) > 0)));
  }, [isFirebaseReady]);

  // ✅ 自動心跳：使用 playerName 更新時間 ✅
  useEffect(() => {
    // 只有當 playerName (已確認的名字) 存在時才執行心跳
    if (!currentUser || !playerName) return; 
    const heartbeat = setInterval(async () => {
      try {
        await setDoc(doc(db, "players", playerName), {
          lastSeen: serverTimestamp(),
          uid: currentUser.uid // 同時更新 UID
        }, { merge: true });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    }, 60000); 
    return () => clearInterval(heartbeat);
  }, [currentUser, playerName]);

  // 自動同步分數 (使用 playerName)
  useEffect(() => {
    // 只有當 playerName (已確認的名字) 存在時才執行同步
    if (isFirebaseReady && currentUser && score >= 0 && playerName) {
      const saveToFirebase = async () => {
        try {
          await setDoc(doc(db, "players", playerName), {
            name: playerName,
            score: score,
            lesson: currentLesson,
            lastSeen: serverTimestamp(),
            uid: currentUser.uid
          }, { merge: true });
        } catch (e) {
          console.error("Auto save failed:", e);
        }
      };
      saveToFirebase();
    }
  }, [score, currentLesson, currentUser, isFirebaseReady, playerName]);

  useEffect(() => {
    if (gameState === 'playing' && levelTargets.length > 0) {
        if (levelTargets.every(t => Number(t.count) === 0)) {
            if (currentStageIndex < gameStages.length - 1) { 
                setGameState('stage_cleared'); 
                // ✅ 修正：傳入 audioEnabled
                playSound('win', audioEnabled); 
            } 
            else { 
                setGameState('won'); 
                // ✅ 修正：傳入 audioEnabled
                playSound('win', audioEnabled); 
            }
        } else if (Number(moves) <= 0 && !isProcessing) {
            setGameState('lost');
        }
    }
  }, [levelTargets, gameState, currentStageIndex, gameStages, moves, isProcessing, audioEnabled]);

  if (gameState === 'welcome') {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4 font-sans text-black text-center relative overflow-hidden">
        {/* 背景甜點漂浮動畫 */}
        <FloatingDessertBackground />

        <div className="bg-white p-8 rounded-[40px] border-4 border-pink-200 text-black relative z-10">
          <div className="bg-gradient-to-tr from-pink-400 to-yellow-300 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-sm">
            <Cake size={48} />
          </div>
          <h1 className="text-4xl font-black mb-2 text-pink-600">華語甜點碰碰樂</h1>
          <p className="text-gray-500 mb-8 font-bold text-black">快來輸入名字，開啟馬卡龍課程！</p>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* ✅ 修正：輸入框綁定 inputName，只有送出時才設定 playerName */}
            <input type="text" value={String(inputName)} onChange={(e) => setInputName(e.target.value)} placeholder="你的名字..."
                   className="w-full px-6 py-4 rounded-2xl border-4 border-pink-50 mb-2 text-xl focus:border-pink-300 focus:outline-none bg-gray-50 text-black placeholder-gray-300" required />
            <button type="submit" className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl text-xl active:translate-y-1">
                開始上課！
            </button>
          </form>
          <button 
            onClick={() => setShowInstallModal(true)} 
            className="mt-6 flex items-center justify-center gap-2 text-gray-400 hover:text-pink-500 font-bold text-sm w-full transition-colors"
          >
            <Smartphone size={16}/> 📱 安裝 / 加入書籤
          </button>
          
          {/* 新增：遊戲說明按鈕 */}
          <button 
            onClick={() => setShowHelpModal(true)}
            className="mt-3 text-pink-400 font-bold text-sm hover:underline flex items-center justify-center gap-1 w-full"
          >
             <HelpCircle size={16} /> 遊戲說明
          </button>
        </div>
        
        {/* 安裝教學彈窗 */}
        {showInstallModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstallModal(false)}>
                <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-left space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-pink-600">把甜點教室帶回家！</h3>
                        <button onClick={() => setShowInstallModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600">
                        <p><span className="font-bold text-black">iOS (iPhone/iPad):</span><br/>點擊瀏覽器下方 <Share2 size={14} className="inline"/> 分享按鈕，往下滑找到「加入主畫面」<Plus size={14} className="inline border border-black rounded-sm p-[1px]"/>。</p>
                        <p><span className="font-bold text-black">Android (Chrome):</span><br/>點擊瀏覽器右上角選單，選擇「加入主畫面」或「安裝應用程式」。</p>
                        <p><span className="font-bold text-black">電腦 (PC/Mac):</span><br/>按下 <kbd className="bg-gray-100 px-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded">D</kbd> 加入書籤，隨時回來複習！</p>
                    </div>
                    <button onClick={() => setShowInstallModal(false)} className="w-full bg-pink-100 text-pink-600 py-2 rounded-xl font-bold mt-2">我知道了</button>
                </div>
            </div>
        )}

        {/* 新增：遊戲說明彈窗 */}
        {showHelpModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}>
                <div className="bg-white p-6 rounded-[30px] shadow-2xl w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    <h3 className="text-2xl font-black text-pink-500 mb-6 text-center">🎮 怎麼玩？</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-pink-100 p-3 rounded-2xl text-pink-500"><MousePointer2 size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">1. 交換方塊</h4>
                                <p className="text-gray-500 text-sm">手指滑動或點擊，讓 3 個一樣的字連成一線就能消除！</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600"><Target size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">2. 收集目標</h4>
                                <p className="text-gray-500 text-sm">注意看最上面的目標，把它們的數量都變成 0 就過關囉！</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-500"><Bomb size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">3. 寶物獎勵</h4>
                                <p className="text-gray-500 text-sm">一次消掉 4 個或 5 個字，會掉落炸彈或糖果，點擊收集它們！</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowHelpModal(false)} className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold py-3 rounded-2xl mt-8 shadow-lg active:scale-95 transition-all">
                        開始挑戰！
                    </button>
                </div>
            </div>
        )}

        <div className="mt-8 text-center text-pink-300 font-bold text-sm tracking-widest uppercase relative z-10">Design by Sophia Wong</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 flex font-sans select-none overflow-hidden justify-center text-black">
      <div className="w-full max-w-[600px] flex flex-col items-center h-screen relative pt-4 md:pt-6 px-4">
        {/* 背景甜點漂浮動畫 */}
        <FloatingDessertBackground />
        
        {showConfetti && <ConfettiEffect />}

        {/* Header */}
        <div className="w-full bg-white p-4 mb-4 flex flex-col gap-4 rounded-[32px] border-2 border-white shadow-sm text-black z-10 relative">
          <div className="flex justify-between items-center w-full px-2 text-black gap-2">
            {/* ✅ 修正：移除中間的分隔線，並縮小 gap 與 padding 以節省空間 */}
            <div className="flex gap-2 items-center bg-gray-50 px-2 py-2 rounded-[24px] flex-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex flex-col items-center leading-none shrink-0">
                <Target size={14} className="mb-0.5 text-pink-400"/>目標
              </span>
              
              <div className="flex gap-1 justify-start flex-1 overflow-x-auto no-scrollbar text-black py-1">
                {levelTargets.map((t, i) => {
                  const style = getCharStyle(t.char);
                  return (
                    <div key={`${String(t.char)}-${i}`} 
                         className={`flex flex-col items-center transition-all duration-500 
                                  ${t.count === 0 ? 'opacity-100 scale-100 grayscale-0 order-last' : 'scale-100'}
                                  ${lastTargetHit === t.char ? 'animate-goal-pop' : ''}`}>
                      {t.count === 0 ? (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl animate-bounce">
                          {DESSERT_ICONS[i % DESSERT_ICONS.length]}
                        </div>
                      ) : (
                        <div className="w-10 h-10 border-2 rounded-xl flex items-center justify-center p-0.5" 
                             style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}>
                          <div className="w-full h-full border rounded-lg flex items-center justify-center" style={{borderColor: style.borderColor}}>
                            {/* ✅ 修正文字顏色 (style.color) ✅ */}
                            <span className="text-xl font-black" style={{color: style.color}}>{String(t.char)}</span>
                          </div>
                        </div>
                      )}
                      <span className="text-[11px] font-black text-pink-600 mt-1">{t.count === 0 ? '' : Number(t.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* ✅ SCORE 移到這裡，稍微縮小最小寬度 */}
            <div className="flex flex-col items-center justify-center bg-pink-50 px-3 py-2 rounded-[24px] shrink-0 min-w-[70px] h-[60px]">
                <div className="text-[10px] text-pink-400 font-black uppercase leading-none mb-1">Score</div>
                <div className="text-xl font-black text-pink-600 leading-none">{Number(score)}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center w-full px-2 text-black">
            <div className="flex items-center gap-3">
              <select value={currentLesson} onChange={(e) => { const n = Number(e.target.value); setCurrentLesson(n); startNewLesson(n, false); }}
                      className="bg-gray-100 border-2 border-gray-100 rounded-2xl px-4 py-2 font-black text-pink-600 text-sm outline-none">
                {Object.keys(LESSON_DATA).map(k => <option key={k} value={k}>{Number(k) === 0 ? "🐲 生肖關" : (Number(k) === 13 ? "🍰 甜點關" : (Number(k) === 999 ? "✏️ 自訂題目" : `第 ${k} 課`))}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowCustomModal(true)}
                  className="p-2 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors"
                >
                  <PenTool size={16} />
                </button>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {isAdvancedMode && <span className="text-blue-500 flex items-center gap-1"><Snowflake size={12}/>進階</span>}
                </div>
              </div>
            </div>
            {/* ✅ 分享、靜音、全螢幕、獎盃 (分數已移除) ✅ */}
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 bg-blue-100 text-blue-500 rounded-xl hover:bg-blue-200 transition-all active:scale-90 shadow-sm"><Share2 size={18} /></button>
              <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-xl transition-all active:scale-90 shadow-sm ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {audioEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
              </button>
              {/* ✅ 新增：全螢幕按鈕 ✅ */}
              <button onClick={toggleFullscreen} className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all active:scale-90 shadow-sm">
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              <button onClick={() => setShowLeaderboardModal(true)} className="p-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-all active:scale-90 shadow-sm">
                <Trophy size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 遊戲棋盤區 */}
        <div className="relative flex-1 flex flex-col justify-center w-full px-2 pb-6 overflow-hidden z-10">
          {matchMessage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none w-full text-center">
              <span className="text-5xl font-black text-pink-500 animate-match-pop block" style={{ textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff' }}>
                {String(matchMessage)}
              </span>
              {combo > 1 && (
                <span className="text-4xl font-black text-yellow-500 animate-bounce block mt-2" style={{ textShadow: '2px 2px 0 #fff' }}>
                   {String(combo)} COMBO!
                </span>
              )}
            </div>
          )}

          <div className={`p-4 rounded-[40px] border-4 border-white mx-auto transition-all duration-500 ${activeTool ? 'ring-8 ring-pink-200 cursor-crosshair' : 'shadow-xl'}`}
               style={{ 
                 position: 'relative', 
                 width: '100%', 
                 aspectRatio: '1/1',
                 background: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 33%, #FFF9C4 66%, #D1FFD7 100%)' 
               }}>
            {board.flatMap((row, r) => 
              row.map((cell, c) => {
                if (!cell.char) return null; 
                const hint = hintTiles.find(h => h.r === r && h.c === c);
                const isSelected = selectedTile?.r === r && selectedTile?.c === c;
                const isMatching = cell.isMatched; 
                const charStyle = getCharStyle(cell.char);
                
                let previewOverlay = null;
                if (activeTool && hoveredTile) {
                  if (activeTool === 'bomb') {
                    if (Math.abs(hoveredTile.r - r) <= 1 && Math.abs(hoveredTile.c - c) <= 1) {
                        previewOverlay = <div className="absolute inset-0 z-10 border-[6px] border-red-500 bg-red-500/30 rounded-2xl animate-pulse" />;
                    }
                  } else if (activeTool === 'candy' && board[hoveredTile.r]?.[hoveredTile.c]?.char) {
                    if (cell.char === board[hoveredTile.r][hoveredTile.c].char) {
                        previewOverlay = <div className="absolute inset-0 z-10 border-[6px] border-purple-600 bg-purple-600/30 rounded-2xl animate-pulse shadow-[inset_0_0_20px_purple]" />;
                    }
                  }
                }

                let finalTransform = 'none';
                if (isSelected) {
                    finalTransform = 'scale(1.15) translateY(-5px)';
                } else if (hint) {
                    finalTransform = `translate(${hint.dc * 100}%, ${hint.dr * 100}%) scale(1.05)`;
                }

                // 道具 - ✅ 改用彩色 Emoji ✅
                if (cell.char === ITEM_BOMB || cell.char === ITEM_CANDY) {
                    return (
                      <button key={cell.id} onClick={() => handleTileClick(r, c)} onMouseEnter={() => setHoveredTile({r, c})}
                        className={`absolute flex items-center justify-center transition-all duration-300 active:scale-90 animate-bounce`}
                        style={{
                            width: '12.5%', height: '12.5%', top: `${r * 12.5}%`, left: `${c * 12.5}%`, padding: '2px',
                            transform: finalTransform
                        }}>
                         <div className="w-full h-full flex items-center justify-center rounded-2xl text-4xl shadow-lg border-2 border-white"
                             style={{ backgroundColor: cell.char === ITEM_BOMB ? '#FFCDD2' : '#E1BEE7' }}>
                             {/* ✅ 修正：使用彩色 Emoji ✅ */}
                             {cell.char === ITEM_BOMB ? '💣' : '🍬'}
                         </div>
                      </button>
                    );
                }

                return (
                  <button key={cell.id} 
                    onClick={() => handleTileClick(r, c)} 
                    onMouseEnter={() => setHoveredTile({r, c})}
                    className={`absolute flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'z-20' : 'z-0'}
                        ${hint ? 'z-30 animate-hint-wiggle' : ''}
                        active:scale-90`}
                    style={{
                        width: '12.5%', height: '12.5%', top: `${r * 12.5}%`, left: `${c * 12.5}%`,
                        padding: '2.5px', backgroundClip: 'content-box',
                        transform: finalTransform,
                        animation: isMatching ? 'popOut 0.5s forwards' : (cell.isNew ? 'fallIn 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67) backwards' : 'none')
                    }}>
                    <div className="w-full h-full border-2 rounded-2xl flex items-center justify-center p-0.5 relative overflow-hidden" 
                         style={{backgroundColor: charStyle.backgroundColor, borderColor: charStyle.borderColor}}>
                      {cell.isFrozen && (
                        <div className="absolute inset-0 z-10 bg-blue-100/50 backdrop-blur-[1px] border-2 border-white/60 rounded-xl flex items-center justify-center">
                            <Snowflake size={20} className="text-blue-400 opacity-80" />
                        </div>
                      )}
                      
                      <div className="w-full h-full border rounded-xl flex items-center justify-center" 
                           style={{borderColor: charStyle.borderColor}}>
                        {previewOverlay}
                        {/* ✅ 修正文字顏色 (style.color) ✅ */}
                        <span 
                          className={`font-black select-none pointer-events-none relative z-0 transition-transform ${Number(currentLesson) === 0 ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}
                          style={{ color: charStyle.color }}
                        >
                          {String(cell.char)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          {/* 過關彈窗 */}
          {(gameState === 'lost' || gameState === 'won' || gameState === 'stage_cleared') && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-pink-900/20 backdrop-blur-md">
              <div className="bg-white rounded-[50px] p-10 shadow-2xl text-center border-8 border-pink-50 animate-in zoom-in duration-500 w-full max-w-sm relative text-black">
                <div className="text-8xl mb-6 animate-bounce-slow text-black">{gameState === 'lost' ? '😢' : '🎉'}</div>
                <h2 className="text-3xl font-black text-pink-600 mb-2">
                  {gameState === 'won' ? '甜點大師！' : gameState === 'stage_cleared' ? '恭喜晉級！' : '下次再來！'}
                </h2>
                <div className="text-gray-500 mb-8 font-bold text-lg leading-relaxed">
                    {/* ✅ 修正：文字排版，加入 <br/> 換行 ✅ */}
                    {gameState === 'won' ? (
                        <>
                            {playerName || '你'} 已經認識{Number(currentLesson) === 0 ? " 12生肖 所有動物" : (Number(currentLesson) === 13 ? " 所有甜點" : (Number(currentLesson) === 999 ? " 自訂題目的所有生字" : `第 ${currentLesson} 課所有生字`))}了！
                        </>
                    ) : gameState === 'stage_cleared' ? (
                        <>
                           {playerName || '你'} 挑戰成功！<br/>準備進入下一小關嗎？
                        </>
                    ) : (
                        '再試一次，你一定可以的！'
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {gameState === 'stage_cleared' && (
                      <button onClick={handleNextStage} className="col-span-2 w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-5 rounded-[25px] font-black shadow-[0_6px_0_#16a34a] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 text-xl">
                          繼續學習 <ArrowRight size={24} />
                      </button>
                  )}
                  {gameState === 'won' && (
                      <>
                        <button onClick={() => startNewLesson(currentLesson, false)} className="col-span-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-black hover:bg-gray-200">再玩一次</button>
                        <button onClick={goToNextLevel} className="col-span-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 rounded-2xl font-black shadow-lg hover:brightness-110 active:translate-y-1">挑戰下一課</button>
                        
                        {/* ✅ 進階遊戲最顯眼 (Row 2, 全寬) ✅ */}
                        <button onClick={() => startNewLesson(currentLesson, true)} className="col-span-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white py-4 rounded-2xl font-black shadow-[0_6px_0_#db2777] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all text-xl flex items-center justify-center gap-2"><Snowflake size={20}/> 挑戰進階遊戲 (冰塊模式)</button>
                        
                        <button onClick={() => setGameState('welcome')} className="col-span-2 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-2xl font-bold hover:text-gray-600 flex items-center justify-center gap-2"><Home size={18}/> 結束遊戲</button>
                      </>
                  )}
                  {(gameState === 'lost' || gameState === 'won') && gameState !== 'won' && (
                      <button onClick={() => startNewLesson(currentLesson, isAdvancedMode)} className="col-span-2 w-full bg-gray-100 text-gray-500 py-4 rounded-[25px] font-black hover:bg-gray-200 transition-all text-black flex items-center justify-center gap-2 text-xl">
                          <Repeat size={20}/> 再試一次
                      </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar - ✅ 修正層級：z-20 確保浮在背景之上 ✅ */}
        <div className="w-full px-2 pb-8 flex justify-between items-center gap-4 text-black relative z-20">
          <button onClick={() => bombCount > 0 && setActiveTool(activeTool === 'bomb' ? null : 'bomb')}
                  className={`flex-1 py-4 rounded-[28px] flex flex-col items-center transition-all ${activeTool === 'bomb' ? 'bg-red-100 text-red-500 scale-105 border-red-300 border-2 shadow-sm' : 'bg-white border-gray-100 border-2 shadow-sm text-black'}`}>
            <div className="relative text-red-400"><Bomb size={28} /><span className="absolute -top-2 -right-4 bg-red-500 text-white text-[12px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{Number(bombCount)}</span></div>
            <span className="text-xs font-black mt-1 uppercase tracking-tighter text-black">炸彈</span>
          </button>
          <button onClick={() => candyCount > 0 && setActiveTool(activeTool === 'candy' ? null : 'candy')}
                  className={`flex-1 py-4 rounded-[28px] flex flex-col items-center transition-all ${activeTool === 'candy' ? 'bg-purple-100 text-purple-600 scale-105 border-purple-300 border-2 shadow-sm' : 'bg-white border-gray-100 border-2 shadow-sm text-black'}`}>
            <div className="relative text-purple-500"><Candy size={28} /><span className="absolute -top-2 -right-3 bg-purple-400 text-white text-[12px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{Number(candyCount)}</span></div>
            <span className="text-xs font-black mt-1 uppercase tracking-tighter text-black">消除</span>
          </button>
          <button onClick={handleGiveHint} className="flex-1 py-4 bg-white rounded-[28px] border-gray-100 border-2 flex flex-col items-center text-black transition-all shadow-sm">
              <Lightbulb size={28} className="text-yellow-400"/>
              <span className="text-xs font-black mt-1 text-black">提示</span>
          </button>
          <button onClick={() => startNewLesson(currentLesson)} className="flex-1 py-4 bg-white rounded-[28px] border-gray-100 border-2 flex flex-col items-center text-black transition-all shadow-sm">
              <RefreshCw size={28} className="text-blue-400" />
              <span className="text-xs font-black mt-1 text-black">重置</span>
          </button>
        </div>
        
        {/* ✅ 自訂題目彈窗 ✅ */}
        {showCustomModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCustomModal(false)}>
                <div className="bg-white p-6 rounded-[30px] shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-pink-600 mb-2 flex items-center gap-2"><PenTool/> 自訂題目</h3>
                    <p className="text-sm text-gray-500 mb-4">請輸入您想要練習的文字 (至少6個不同的字)</p>
                    <textarea 
                        className="w-full h-32 border-2 border-pink-100 rounded-xl p-3 focus:outline-none focus:border-pink-300 text-lg text-black"
                        placeholder="在此貼上文章或輸入生字..."
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                    />
                    <div className="flex gap-2 mt-4">
                        {LESSON_DATA[999] && (
                             <button onClick={handleDeleteCustom} className="flex-none px-4 py-3 rounded-xl bg-red-100 text-red-500 font-bold hover:bg-red-200 transition-colors" title="刪除自訂題目">
                                <Trash2 size={20}/>
                             </button>
                        )}
                        <button onClick={() => setShowCustomModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">取消</button>
                        <button onClick={handleCustomStart} className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-bold shadow-lg hover:bg-pink-600 transition-colors">開始遊戲</button>
                    </div>
                </div>
            </div>
        )}

        <div className="text-center text-gray-400 text-xs pb-2 text-black">Design by Sophia Wong</div>
      </div>
      
      {/* 排行榜 */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 text-black">
          <div className="bg-white w-full max-w-md h-[75vh] rounded-[40px] flex flex-col overflow-hidden border-8 border-pink-50 shadow-2xl text-black">
            <div className="bg-pink-50/50 p-6 border-b-2 border-pink-100 flex justify-between items-center text-black">
              <h3 className="text-xl font-black text-pink-600 flex items-center gap-3 text-black"><Trophy className="text-yellow-500" /> 華語小學霸</h3>
              <button onClick={() => setShowLeaderboardModal(false)} className="p-2 bg-white rounded-full flex items-center justify-center text-black"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar text-black">
              {leaderboard.map((user, idx) => (
                <div key={user.id} className={`flex items-center justify-between p-5 rounded-[30px] transition-all ${user.id === (currentUser?.uid || '') ? 'bg-pink-100' : 'bg-gray-50'}`}>
                  <div className="flex flex-col text-black">
                    <div className="flex items-center gap-4 text-black">
                      {/* ✅ 新增：在線狀態指示燈 (🟢) ✅ */}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-gray-400'}`}>{idx + 1}</span>
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-700 text-black flex items-center gap-2">
                              {String(user.name)}
                              {/* 這裡的判斷邏輯非常關鍵 */}
                              {((currentUser && user.id === currentUser.uid) || (user.lastSeen && typeof user.lastSeen.toMillis === 'function' && (Date.now() - user.lastSeen.toMillis()) < 5 * 60 * 1000)) && (
                                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 在線
                                  </span>
                              )}
                          </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-black text-pink-500 text-xl text-black">{Number(user.score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fallIn { from { transform: translateY(-500%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popOut { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.9; } 100% { transform: scale(0); opacity: 0; } }
        @keyframes hintWiggle { 0% { transform: rotate(0deg) scale(1.1); } 25% { transform: rotate(-8deg) scale(1.1); } 50% { transform: rotate(8deg) scale(1.1); } 75% { transform: rotate(-8deg) scale(1.1); } 100% { transform: rotate(0deg) scale(1.1); } }
        @keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        @keyframes match-pop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes goal-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .animate-confetti-fall { animation: confetti-fall linear forwards; }
        .animate-goal-pop { animation: goal-pop 0.5s ease-out; }
        .animate-match-pop { animation: match-pop 0.5s forwards; }
        .animate-float { animation: float 10s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}