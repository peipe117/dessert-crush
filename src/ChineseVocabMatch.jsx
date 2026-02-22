import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Sparkles, RefreshCw, Trophy, BookOpen, Lightbulb, Share2, 
  Volume2, VolumeX, Bomb, Candy, Target, ArrowRight, X, Star, Plus, Snowflake, Home, Repeat,
  Cake, Smartphone, Download, PenTool, HelpCircle, MousePointer2, Maximize, Minimize, Trash2, Zap, Lock
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, 
  doc, setDoc, updateDoc, getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";

// ----------------------------------------------------------------------
// ⚠️ 全域配置
// ----------------------------------------------------------------------

const GRID_SIZE = 8;
const ITEM_BOMB = '$$BOMB$$';
const ITEM_CANDY = '$$CANDY$$';
const ITEM_CROSS = '$$CROSS$$';
const ITEM_SHUFFLE = '$$SHUFFLE$$';

// ✅ 遊戲通關解鎖密碼 (可在這裡修改)
const GAME_PASSWORD = "8888";

// ✅ 完整收錄「學華語向前走」1~10冊、注音課與特別關卡
let LESSON_DATA = {
  // 第一冊
  "b1-1": "你好我是他",
  "b1-2": "有幾個人爸媽一二三四五",
  "b1-3": "也們男女生六七八九十",
  "b1-4": "來吃喝要今天",
  "b1-5": "很不太了喜歡",
  "b1-6": "的日月快到玩什麼",
  "b1-7": "手頭眼看大小",
  "b1-8": "下常打球做吧",
  "b1-9": "在哪上都找", 
  "b1-10": "這那張中兩右",
  "b1-11": "怎想開走路坐",
  "b1-12": "請問朋友機再",
  // 第二冊
  "b2-1": "新同學自己年跟比",
  "b2-2": "外公以前工作班後",
  "b2-3": "去近買東西魚還可",
  "b2-4": "出先週末晚蛋飯現點",
  "b2-5": "黃綠色時候花子紅白",
  "b2-6": "華說對星期會每給如果",
  "b2-7": "起累早洗昨過別忘用臉",
  "b2-8": "送隻狗帶散步貓非愛",
  "b2-9": "南北方裡校門口因為所",
  "b2-10": "本著退休次旅行法國",
  "b2-11": "動物園老希望但胖真長",
  "b2-12": "久話高課寫沒題定意思",
  // 第三冊
  "b3-1": "回放假午練習字始嗎等念",
  "b3-2": "樣心跑得最餓功叫讀書",
  "b3-3": "筆貴又便宜共多少錢枝",
  "b3-4": "準備些汽水樂能和奶茶",
  "b3-5": "涼溫度差穿衣服感冒雨",
  "b3-6": "平就棵彩掛窗聽卡片寄",
  "b3-7": "像病覺痛息肚吐陪接醫",
  "b3-8": "教室總敢才跳誰決剪刀",
  "b3-9": "搬家離號附旁邊房鳥舊",
  "b3-10": "拜文化毛炒筷除厲害辦",
  "b3-11": "遊木馬碰車趣怕飛更緊",
  "b3-12": "特選氣句祝畫圖收應該",
  // 第四冊
  "b4-1": "分鐘渴幫忙把紙拿完包",
  "b4-2": "熱鬧約讓答表妹參加熟",
  "b4-3": "考試較半從鋼概網必須",
  "b4-4": "湯辣糖肉味道酸甜越苦",
  "b4-5": "冷面變低而且厚夠風著",
  "b4-6": "春街舞條全夜火另存歲",
  "b4-7": "師禮流血哭腳扭只慢地",
  "b4-8": "電影種傳統難處身演空",
  "b4-9": "各城市英美部清楚雪記",
  "b4-10": "世界其彎圈懂德拼古千",
  "b4-11": "餐明草館討論父母通知",
  "b4-12": "親節事廣告掃錯百貨司",
  // 第五冊
  "b5-1": "直經已級興增議建於終",
  "b5-2": "亮圓團陽查秋故餅重代",
  "b5-3": "輛修壞架丟具廳客理整",
  "b5-4": "廚正材料麵粉油聞香烤",
  "b5-5": "破摔煙迎數報酒運音聲",
  "b5-7": "院書拉護士體瓜食注淡",
  "b5-8": "賽合隊惜名第當連力努",
  "b5-9": "周彎間成左積置位或麗",
  "b5-10": "場山搭遠算爺迷速往轉",
  "b5-11": "輕樹票底活發保響然雖",
  // 第六冊
  "b6-1": "招式拋簡單藝結線編謝",
  "b6-2": "詩歌朗誦組靜背首李關",
  "b6-3": "介紹肖份極牛虎兔羊雞",
  "b6-4": "信箱戴帽短褲夏相反冬",
  "b6-5": "杯碗安夕睡倒罵管被",
  "b6-7": "盤菜厭腿類豆腐健康助",
  "b6-8": "您舉唱茉莉束語奇順敬",
  "b6-9": "原尺景島主括政治濟交",
  "b6-10": "鮮餵青擠野欣賞騎黑蟲",
  "b6-11": "指竹產價普遍使腦它般",
  // 第七冊
  "b7-1": "歷史解尤吸引專術需插",
  "b7-2": "鈴米段係航派利慕羨薯",
  "b7-3": "適仔鞋雙折倍付刷帳划",
  "b7-4": "豬蝦仁餃皮捏汁扁餡",
  "b7-5": "扮蹈曾目遇剛業畢顏裝",
  "b7-7": "桶圾垃飽費浪良足即死",
  "b7-8": "曲彈典情受呼鬆享聊無",
  "b7-9": "講由立民金元鈔貢持支",
  "b7-10": "許深象印童兒待燈發驗",
  "b7-11": "此科件絡聯靠漸實透型",
  // 第八冊
  "b8-1": "志際省環姊換夢社義蓋",
  "b8-2": "慣弄移巧冠嗨隨擔堡漢",
  "b8-3": "佔溝商示況詞達易容石",
  "b8-4": "造災颱震搖壓升淹田陸",
  "b8-5": "龍紀菇鹹粽端並軍船",
  "b8-7": "肩撞傷暖膝怪肌痠臂膀",
  "b8-8": "識刺怖恐頻根趁劇續擇",
  "b8-9": "技及按細詳築狀形土損",
  "b8-10": "鄉舍農矮棟巴蹟晴族村",
  "b8-11": "拍搶精質品閒互將善角",
  // 第九冊
  "b9-1": "例創礎基抽照符雜複旦",
  "b9-2": "察警員偷責負改願帥幸",
  "b9-3": "零萬排量億止亞集居河",
  "b9-4": "麻臭乎脆芒冰炎棒膩窮",
  "b9-5": "餘減養源資竟汙府植肥",
  "b9-7": "貼謎觀俗宵曆戲籠猜案",
  "b9-8": "禁群飢缺裕富捐珍營擴",
  "b9-9": "項吹微錄里踏勵鼓牌耐",
  "b9-10": "寶宮皇朝紫憶栩幅刻玉",
  "b9-11": "務衫摸挑髮光券銷促購",
  // 第十冊
  "b10-1": "登樓入層提描堂絕押韻",
  "b10-2": "設計窄寬尚甚布薄悶髒趕",
  "b10-3": "飲神氏與鳥泡壺區展藥",
  "b10-4": "製廢誌聰研究瓶罐鋪斷",
  "b10-5": "孔祈福戚燃充溪緩壯未",
  "b10-7": "吵脾衛控制緒熬既諒",
  "b10-8": "奧旗徵誠態操銀銅獎眾",
  "b10-9": "之遞絲綢瓷器貿範圍繁",
  "b10-10": "唐強坊則座超糯氛",
  "b10-11": "曬衝躺氧筒棄趴板衡掉",
  // 注音關 (陣列格式支援雙字元的結合韻)
  "z-1": "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ",
  "z-2": "ㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ",
  "z-3": ["ㄧㄚ", "ㄧㄛ", "ㄧㄝ", "ㄧㄞ", "ㄧㄠ", "ㄧㄡ", "ㄧㄢ", "ㄧㄣ", "ㄧㄤ", "ㄧㄥ", "ㄨㄚ", "ㄨㄛ", "ㄨㄞ", "ㄨㄟ", "ㄨㄢ", "ㄨㄣ", "ㄨㄤ", "ㄨㄥ", "ㄩㄝ", "ㄩㄢ", "ㄩㄣ", "ㄩㄥ"],
  // 特別關卡
  "s-zodiac": "🐭🐮🐯🐰🐲🐍🐴🐑🐵🐔🐶🐷",
  "s-dessert": "🍰🍩🍪🍮🍦🍭🍬🍫",
  "s-veg1": "🥬🥦🥕🌽🍆",
  "s-veg2": "🍅🥔🧅🍄🥒",
  "s-fruit": "🍎🍐🍊🍋🍌🍉🍇🍓🍈🍒🍑🥭🍍🥥🥝"
};

// 🗣️ 發音對照表 (包含生肖與甜點)
const PRONUNCIATION_MAP = {
  "🐭": "鼠", "🐮": "牛", "🐯": "虎", "🐰": "兔", 
  "🐲": "龍", "🐍": "蛇", "🐴": "馬", "🐑": "羊", 
  "🐵": "猴", "🐔": "雞", "🐶": "狗", "🐷": "豬",
  "🍰": "蛋糕", "🍩": "甜甜圈", "🍪": "餅乾", "🍮": "布丁",
  "🍦": "冰淇淋", "🍭": "棒棒糖", "🍬": "糖果", "🍫": "巧克力",
  "🥬": "白菜", "🥦": "花爺菜", "🥕": "胡蘿蔔", "🌽": "玉米", "🍆": "茄子",
  "🍅": "番茄", "🥔": "馬鈴薯", "🧅": "洋蔥", "🍄": "蘑菇", "🥒": "黃瓜",
  "🍎": "蘋果", "🍐": "梨子", "🍊": "橘子", "🍋": "檸檬", "🍌": "香蕉",
  "🍉": "西瓜", "🍇": "葡萄", "🍓": "草莓", "🍈": "哈密瓜", "🍒": "櫻桃",
  "🍑": "桃子", "🥭": "芒果", "🍍": "鳳梨", "🥥": "椰子", "🥝": "奇異果"
};

const DESSERT_ICONS = ['🧁', '🍩', '🍰', '🍪', '🍮'];

// 🎨 回歸初始風格
const DISTINCT_PALETTE = [
  { bg: "#FFCDD2", border: "#E53935", text: "#B71C1C" }, 
  { bg: "#FFE0B2", border: "#FB8C00", text: "#E65100" }, 
  { bg: "#FFF9C4", border: "#FBC02D", text: "#F57F17" }, 
  { bg: "#C8E6C9", border: "#43A047", text: "#1B5E20" }, 
  { bg: "#B2EBF2", border: "#00ACC1", text: "#006064" }, 
  { bg: "#BBDEFB", border: "#1E88E5", text: "#0D47A1" }, 
  { bg: "#E1BEE7", border: "#8E24AA", text: "#4A148C" }, 
  { bg: "#D7CCC8", border: "#8D6E63", text: "#3E2723" }, 
  { bg: "#F0F4C3", border: "#AFB42B", text: "#827717" }, 
  { bg: "#F8BBD0", border: "#EC407A", text: "#880E4F" }, 
];

// 🌐 多國語系翻譯字典 🌐
const I18N = {
  zh: {
    title: "華語甜點碰碰樂",
    textbook: "📖 學華語向前走",
    subtitle: "快來輸入名字，開啟馬卡龍課程！",
    namePlaceholder: "你的名字...",
    startClass: "開始上課！",
    installMsg: "📱 安裝 / 加入書籤",
    howToPlay: "遊戲說明",
    installTitle: "把甜點教室帶回家！",
    installIOS: "iOS (iPhone/iPad):",
    installIOSDesc: "點擊瀏覽器下方分享按鈕，往下滑找到「加入主畫面」。",
    installAnd: "Android (Chrome):",
    installAndDesc: "點擊瀏覽器右上角選單，選擇「加入主畫面」或「安裝應用程式」。",
    installPC: "電腦 (PC/Mac):",
    installPCDesc: "按下 Ctrl + D 加入書籤，隨時回來複習！",
    gotIt: "我知道了",
    helpTitle: "🎮 怎麼玩？",
    help1: "1. 交換方塊",
    help1Desc: "手指滑動或點擊，讓 3 個一樣的字連成一線就能消除！",
    help2: "2. 收集目標",
    help2Desc: "注意看最上面的目標，把它們的數量都變成 0 就過關囉！",
    help3: "3. 寶物獎勵",
    help3Desc: "消除4個得炸彈，3連鎖得閃電，點擊收集或發動它們！",
    startChallenge: "開始挑戰！",
    target: "目標",
    score: "Score",
    book1: "第一冊",
    book2: "第二冊",
    book3: "第三冊",
    book4: "第四冊",
    book5: "第五冊",
    book6: "第六冊",
    book7: "第七冊",
    book8: "第八冊",
    book9: "第九冊",
    book10: "第十冊",
    zhuyin: "注音關",
    z1: "聲母 (21個)",
    z2: "韻母 (16個)",
    z3: "結合韻符 (22種)",
    special: "特別關卡",
    zodiac: "🐲 生肖關",
    dessert: "🍰 甜點關",
    veg1: "🥦 青菜關 (一)",
    veg2: "🥦 青菜關 (二)",
    fruit: "🍎 水果關",
    custom: "✏️ 自訂題目",
    customShort: "✏️自訂",
    lessonPrefix: "第 ",
    lessonSuffix: " 課",
    addCustom: "➕新增自訂",
    advanced: "進階",
    bomb: "炸彈",
    candy: "消除",
    cross: "閃電",
    hint: "提示",
    reset: "重置",
    customTitle: "自訂題目",
    customDesc: "請輸入您想要練習的文字 (至少6個不同的字，支援中英數與注音)",
    customPlaceholder: "在此貼上文章或輸入生字...",
    deleteCustom: "刪除自訂題目",
    cancel: "取消",
    startGame: "開始遊戲",
    leaderboard: "華語小學霸",
    online: "在線",
    challenge: "挑戰：",
    learning: "學習中",
    customDeleted: "自訂題目已刪除",
    noMoves: "沒有可以消除的方塊囉！自動洗牌中...",
    linkCopied: "連結已複製!",
    copyFailed: "複製失敗",
    bombPlus: "+1 炸彈!",
    candyPlus: "+1 消除!",
    crossPlus: "+1 閃電!",
    crossClear: "⚡ 閃電消除!",
    shuffleClear: "🔄 洗牌成功!",
    winTitle: "甜點大師！",
    stageClearedTitle: "恭喜晉級！",
    loseTitle: "下次再來！",
    you: "你",
    winMsg1: " 已經認識 [",
    winMsg3: "] 的所有生字了！",
    clearedDesc1: "挑戰成功！",
    clearedDesc2: "準備進入下一小關嗎？",
    loseDesc: "再試一次，你一定可以的！",
    continueLearn: "繼續學習",
    playAgain: "再玩一次",
    nextLesson: "挑戰下一課",
    hardMode: "挑戰進階遊戲 (冰塊模式)",
    endGame: "結束遊戲",
    tryAgain: "再試一次",
    needMoreChars: "請至少輸入 6 個不同的文字喔！",
    homeTitle: "回首頁 / 離開遊戲",
    shareTitle: "分享",
    fullscreenTitle: "全螢幕",
    leaderboardTitle: "排行榜",
    shuffleRescue: "🔄 救援洗牌！",
    unlockTitle: "專屬課程解鎖",
    unlockDesc: "請輸入老師提供的通關密碼",
    unlockPlaceholder: "通關密碼...",
    unlockBtn: "解鎖進入",
    unlockError: "密碼錯誤，請再試一次！"
  },
  en: {
    title: "Dessert Crush",
    textbook: "📖 Let's Learn Mandarin",
    subtitle: "Enter your name to start the Macaron class!",
    namePlaceholder: "Your name...",
    startClass: "Start Playing!",
    installMsg: "📱 Install / Bookmark",
    howToPlay: "How to Play",
    installTitle: "Take the Classroom Home!",
    installIOS: "iOS (iPhone/iPad):",
    installIOSDesc: "Tap the Share button at the bottom of the browser, scroll down and find 'Add to Home Screen'.",
    installAnd: "Android (Chrome):",
    installAndDesc: "Tap the browser menu at the top right, select 'Add to Home screen' or 'Install app'.",
    installPC: "PC/Mac:",
    installPCDesc: "Press Ctrl + D to bookmark, come back to review anytime!",
    gotIt: "Got it",
    helpTitle: "🎮 How to play?",
    help1: "1. Swap Tiles",
    help1Desc: "Swipe or click to match 3 identical tiles in a row to clear them!",
    help2: "2. Collect Targets",
    help2Desc: "Watch the targets at the top, reduce their count to 0 to pass!",
    help3: "3. Power-ups",
    help3Desc: "Match 4 for Bombs, 3 Combo for Lightning. Click to collect or use them!",
    startChallenge: "Start Challenge!",
    target: "TARGET",
    score: "Score",
    book1: "Book 1",
    book2: "Book 2",
    book3: "Book 3",
    book4: "Book 4",
    book5: "Book 5",
    book6: "Book 6",
    book7: "Book 7",
    book8: "Book 8",
    book9: "Book 9",
    book10: "Book 10",
    zhuyin: "Zhuyin",
    z1: "Consonants (21)",
    z2: "Vowels (16)",
    z3: "Combined (22)",
    special: "Special",
    zodiac: "🐲 Zodiac",
    dessert: "🍰 Desserts",
    veg1: "🥦 Vegetables 1",
    veg2: "🥦 Vegetables 2",
    fruit: "🍎 Fruits",
    custom: "✏️ Custom",
    customShort: "✏️Custom",
    lessonPrefix: "Lesson ",
    lessonSuffix: "",
    addCustom: "➕Add Custom",
    advanced: "Hard",
    bomb: "Bomb",
    candy: "Candy",
    cross: "Lightning",
    hint: "Hint",
    reset: "Reset",
    customTitle: "Custom Lesson",
    customDesc: "Enter text to practice (at least 6 different chars)",
    customPlaceholder: "Paste text or enter chars here...",
    deleteCustom: "Delete Custom Lesson",
    cancel: "Cancel",
    startGame: "Start Game",
    leaderboard: "Leaderboard",
    online: "Online",
    challenge: "Stage: ",
    learning: "Learning",
    customDeleted: "Custom lesson deleted",
    noMoves: "No moves! Shuffling...",
    linkCopied: "Link copied!",
    copyFailed: "Copy failed",
    bombPlus: "+1 Bomb!",
    candyPlus: "+1 Candy!",
    crossPlus: "+1 Lightning!",
    crossClear: "⚡ Lightning Clear!",
    shuffleClear: "🔄 Board Shuffled!",
    winTitle: "Dessert Master!",
    stageClearedTitle: "Stage Cleared!",
    loseTitle: "Try Again!",
    you: "You",
    winMsg1: " have learned all characters in [",
    winMsg3: "]!",
    clearedDesc1: "Challenge successful!",
    clearedDesc2: "Ready for the next stage?",
    loseDesc: "Try again, you can do it!",
    continueLearn: "Continue",
    playAgain: "Play Again",
    nextLesson: "Next Lesson",
    hardMode: "Play Hard Mode (Ice Blocks)",
    endGame: "End Game",
    tryAgain: "Try Again",
    needMoreChars: "Please enter at least 6 different characters!",
    homeTitle: "Home / Leave Game",
    shareTitle: "Share",
    fullscreenTitle: "Fullscreen",
    leaderboardTitle: "Leaderboard",
    shuffleRescue: "🔄 Shuffle Rescue!",
    unlockTitle: "Class Unlock",
    unlockDesc: "Please enter the classroom password",
    unlockPlaceholder: "Password...",
    unlockBtn: "Unlock",
    unlockError: "Incorrect password, try again!"
  }
};

// 取得關卡名稱的 Helper Function
const getLessonName = (key, t) => {
    if (key === undefined) return t.learning;
    
    // 處理舊版數字紀錄 (向下相容)
    const numKey = Number(key);
    if (!isNaN(numKey)) {
       if (numKey === 0) return t.zodiac;
       if (numKey === 13) return t.dessert;
       if (numKey === 999) return t.customTitle;
       return `${t.book2} ${t.lessonPrefix}${numKey}${t.lessonSuffix}`;
    }

    if (key === 'z-1') return t.z1;
    if (key === 'z-2') return t.z2;
    if (key === 'z-3') return t.z3;

    if (key === 's-zodiac') return t.zodiac;
    if (key === 's-dessert') return t.dessert;
    if (key === 's-veg1') return t.veg1;
    if (key === 's-veg2') return t.veg2;
    if (key === 's-fruit') return t.fruit;
    if (key === 'custom') return t.customTitle;
    
    const match = String(key).match(/b(\d+)-(\d+)/);
    if (match) {
        return `${t[`book${match[1]}`]} ${t.lessonPrefix}${match[2]}${t.lessonSuffix}`;
    }
    return String(key);
};

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 

try {
  const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase 初始化失敗", e);
}

// --- 音效工具 ---
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const playSound = (type, isEnabled = true) => {
  if (!isEnabled) return; 
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
  if (text === ITEM_BOMB || text === ITEM_CANDY || text === ITEM_CROSS || text === ITEM_SHUFFLE) return;
  window.speechSynthesis.cancel();
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

// --- 優化：漂浮甜點背景 ---
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

const getBookFromLesson = (lesson) => {
    if (!lesson) return 'z';
    if (lesson === 'custom' || lesson === 'new_custom') return 'c';
    if (String(lesson).startsWith('s-')) return 's';
    if (String(lesson).startsWith('z-')) return 'z';
    const match = String(lesson).match(/^(b\d+)-/);
    if (match) return match[1];
    return 'z';
};

const getInitialLesson = () => {
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const lessonId = searchParams.get('lesson');
    if (lessonId) {
        const numId = Number(lessonId);
        if (!isNaN(numId) && String(lessonId).trim() !== '') { // 相容舊版連結
             if (numId === 0) return 's-zodiac';
             else if (numId === 13) return 's-dessert';
             else if (numId === 999) return 'custom';
             else if (numId >= 1 && numId <= 12) return `b2-${numId}`;
        } else if (LESSON_DATA[lessonId] || lessonId === 'custom') {
             return lessonId;
        }
    }
  }
  return 'z-1';
};

export default function App() {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('wordcrush_lang') || 'zh';
    }
    return 'zh';
  });
  
  const toggleLang = () => {
      setLang(prev => {
          const next = prev === 'zh' ? 'en' : 'zh';
          if (typeof window !== 'undefined') localStorage.setItem('wordcrush_lang', next);
          return next;
      });
  };

  const t = I18N[lang];

  // 解鎖狀態管理
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('wordcrush_unlocked') === 'true';
    }
    return false;
  });
  const [inputPassword, setInputPassword] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [currentLesson, setCurrentLesson] = useState(getInitialLesson);
  const [selectedBook, setSelectedBook] = useState(() => getBookFromLesson(getInitialLesson()));

  useEffect(() => {
      // 確保從遊戲內回到首頁，或透過網址載入時，首頁的選單能同步對應目前的冊別
      setSelectedBook(getBookFromLesson(currentLesson));
  }, [currentLesson]);

  const [board, setBoard] = useState([]);
  const [activeChars, setActiveChars] = useState([]); 
  const [colorMap, setColorMap] = useState({}); 
  const [selectedTile, setSelectedTile] = useState(null);
  
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);

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

  // 包含炸彈、糖果、閃電收集到下方
  const [bombCount, setBombCount] = useState(0);
  const [candyCount, setCandyCount] = useState(0);
  const [crossCount, setCrossCount] = useState(0);
  const [activeTool, setActiveTool] = useState(null);

  // --- Logic Helpers ---

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
        if (!char || char === ITEM_BOMB || char === ITEM_CANDY || char === ITEM_CROSS || char === ITEM_SHUFFLE) continue; 
        let len = 1;
        while (c + len < GRID_SIZE && currentBoard[r][c + len].char === char) len++;
        if (len >= 3) { for (let i = 0; i < len; i++) matches.push({ r, c: c + i }); c += len - 1; }
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const char = currentBoard[r][c].char;
        if (!char || char === ITEM_BOMB || char === ITEM_CANDY || char === ITEM_CROSS || char === ITEM_SHUFFLE) continue;
        let len = 1;
        while (r + len < GRID_SIZE && currentBoard[r + len][c].char === char) len++;
        if (len >= 3) { for (let i = 0; i < len; i++) matches.push({ r: r + i, c }); r += len - 1; }
      }
    }
    return matches;
  }, []);

  const getAllPossibleMoves = useCallback((currentBoard) => {
      const moves = [];
      if (!currentBoard || currentBoard.length === 0) return moves;
      const clone = JSON.parse(JSON.stringify(currentBoard));
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (c < GRID_SIZE - 1) {
            let tmp = clone[r][c].char; clone[r][c].char = clone[r][c+1].char; clone[r][c+1].char = tmp;
            if (findMatches(clone).length > 0) moves.push([{r,c}, {r, c:c+1}]);
            clone[r][c+1].char = clone[r][c].char; clone[r][c].char = tmp;
          }
          if (r < GRID_SIZE - 1) {
            let tmp = clone[r][c].char; clone[r][c].char = clone[r+1][c].char; clone[r+1][c].char = tmp;
            if (findMatches(clone).length > 0) moves.push([{r,c}, {r: r+1, c}]);
            clone[r+1][c].char = clone[r][c].char; clone[r][c].char = tmp;
          }
        }
      }
      return moves;
  }, [findMatches]);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffleBoard = useCallback((currentBoard, chars) => {
    const allExistingChars = currentBoard.flat().map(cell => cell.char).filter(c => c !== null && c !== ITEM_BOMB && c !== ITEM_CANDY && c !== ITEM_CROSS && c !== ITEM_SHUFFLE);
    const shuffledPool = shuffleArray(allExistingChars);
    const newBoard = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let char;
        if (currentBoard[r] && (currentBoard[r][c].char === ITEM_BOMB || currentBoard[r][c].char === ITEM_CANDY || currentBoard[r][c].char === ITEM_CROSS || currentBoard[r][c].char === ITEM_SHUFFLE)) {
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
    if (char === ITEM_CROSS) return { backgroundColor: '#FFF9C4', borderColor: '#FBC02D', color: '#F57F17', borderWidth: '2px' };
    if (char === ITEM_SHUFFLE) return { backgroundColor: '#E3F2FD', borderColor: '#64B5F6', color: '#1565C0', borderWidth: '2px' };
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
    if (currentLesson !== 'custom') url.searchParams.set('lesson', currentLesson.toString());
    const textToCopy = url.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showGameMessage(t.linkCopied))
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
        showGameMessage(t.linkCopied);
      } else {
        showGameMessage(t.copyFailed);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      showGameMessage(t.copyFailed);
    }

    document.body.removeChild(textArea);
  };

  const setupStage = useCallback((lessonIndex, stageIndex, stages, isAdvanced) => {
    const currentStageChars = stages[stageIndex];
    if (!currentStageChars) return;
    let boardChars = [...currentStageChars];
    if (boardChars.length < 6) {
        const rawPool = LESSON_DATA[lessonIndex] || LESSON_DATA['z-1'];
        // 確保 pool 是陣列 (支援雙字元如注音結合韻)
        const fullPool = Array.isArray(rawPool) ? rawPool : Array.from(rawPool);
        const fillers = shuffleArray(fullPool.filter(c => !boardChars.includes(c)));
        boardChars = [...boardChars, ...fillers.slice(0, 6 - boardChars.length)];
    }
    
    // ✅ 修正：在這裡為「當前關卡」的所有字（包含干擾字）分配「絕對不重複」的獨立顏色
    const shuffledColors = shuffleArray(DISTINCT_PALETTE);
    const stageColorMap = {};
    boardChars.forEach((char, index) => {
        stageColorMap[char] = shuffledColors[index % DISTINCT_PALETTE.length];
    });
    setColorMap(stageColorMap);

    setActiveChars(boardChars);
    setLevelTargets(currentStageChars.map(char => ({ char, count: 15 })));
    setBoard(generateBoard(boardChars, true, isAdvanced));
    setMoves(80); 
    setCombo(0);
    setGameState('playing');
  }, [generateBoard]);

  const startNewLesson = useCallback((lesson, isAdvanced = false) => {
    const rawPool = LESSON_DATA[lesson] || LESSON_DATA['z-1'];
    // 支援陣列 (如結合韻)
    const pool = Array.isArray(rawPool) ? rawPool : Array.from(rawPool);
    const allCharsInLesson = Array.from(new Set(pool.filter(c => typeof c === 'string' && c.trim() !== '')));
    
    const shuffledColors = shuffleArray(DISTINCT_PALETTE);
    const newGlobalColorMap = {};
    allCharsInLesson.forEach((char, index) => {
        newGlobalColorMap[char] = shuffledColors[index % shuffledColors.length];
    });
    setColorMap(newGlobalColorMap);

    const isSpecial = String(lesson).startsWith('s-') || String(lesson).startsWith('z-') || lesson === 'custom';
    let chunkSize = 5;
    if (lesson === 's-zodiac') chunkSize = 4;
    else if (lesson === 's-dessert') chunkSize = 4;
    else if (lesson === 's-veg') chunkSize = 5;
    else if (lesson === 's-fruit') chunkSize = 5;
    else if (isSpecial) {
        chunkSize = allCharsInLesson.length === 5 ? 5 : 4;
    } else if (allCharsInLesson.length <= 8) {
        chunkSize = 4;
    }
    
    const stages = [];
    for (let i = 0; i < allCharsInLesson.length; i += chunkSize) { 
        stages.push(allCharsInLesson.slice(i, i + chunkSize)); 
    }
    
    setGameStages(stages);
    setCurrentStageIndex(0);
    
    setScore(0);
    setCombo(0);
    
    setIsProcessing(false);
    setSelectedTile(null);
    setHintTiles([]);
    setActiveTool(null);
    setIsAdvancedMode(isAdvanced);
    setupStage(lesson, 0, stages, isAdvanced);
  }, [setupStage]);

  const handleCustomStart = () => {
      if (!customText.trim()) return;
      // ✅ 支援自訂注音符號 \u3105-\u312F
      const cleanText = customText.replace(/[^\u4e00-\u9fa5\u3105-\u312Fa-zA-Z0-9]/g, '');
      const uniqueChars = Array.from(new Set(cleanText));
      
      if (uniqueChars.length < 6) {
          alert(t.needMoreChars);
          return;
      }
      
      LESSON_DATA['custom'] = uniqueChars.join('');
      setCurrentLesson('custom');
      setShowCustomModal(false);
      startNewLesson('custom', false);
  };

  const handleDeleteCustom = () => {
      if (LESSON_DATA['custom']) {
          delete LESSON_DATA['custom'];
      }
      setCustomText("");
      if (currentLesson === 'custom') {
          setCurrentLesson('z-1');
          startNewLesson('z-1', false);
      }
      setShowCustomModal(false);
      showGameMessage(t.customDeleted);
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
        playSound('match3', audioEnabled);
        const firstMatchChar = tempBoard[matches[0].r][matches[0].c].char;
        if (firstMatchChar !== ITEM_BOMB && firstMatchChar !== ITEM_CANDY) {
            speakText(firstMatchChar, audioEnabled);
        }
      } else {
        playSound('combo', audioEnabled);
        showGameMessage(`${currentCombo} COMBO!`, 1000);
      }

      let spawnReward = null;
      let spawnIndex = -1;
      if (matches.length >= 5) spawnReward = ITEM_CANDY;
      else if (currentCombo >= 3) spawnReward = ITEM_CROSS;
      else if (matches.length >= 4) spawnReward = ITEM_BOMB;
      
      if (spawnReward) spawnIndex = Math.floor(matches.length / 2);

      let iceBroken = false;

      matches.forEach(({ r, c }, idx) => {
        if (tempBoard[r][c].isFrozen) {
            tempBoard[r][c].isFrozen = false;
            tempBoard[r][c].isMatched = true; 
            iceBroken = true;
        } else {
            if (tempBoard[r][c].char && tempBoard[r][c].char !== ITEM_BOMB && tempBoard[r][c].char !== ITEM_CANDY && tempBoard[r][c].char !== ITEM_CROSS && tempBoard[r][c].char !== ITEM_SHUFFLE) {
                turnMatches.push(tempBoard[r][c].char);
            }
            tempBoard[r][c].isMatched = true;
            if (idx === spawnIndex && spawnReward) tempBoard[r][c].spawnItem = spawnReward;
        }
      });
      
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
      
      setScore(prev => {
        const newScore = prev + (matches.length * 10 * currentCombo);
        setHighScore(hs => Math.max(hs, newScore));
        return newScore;
      });

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
                playSound('win', audioEnabled);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2500);
            }
        }
        return { ...t, count: Math.max(0, t.count - foundCount) };
      }));
    }

    const remainingMoves = getAllPossibleMoves(tempBoard);
    if (remainingMoves.length === 0) {
      setTimeout(() => {
          showGameMessage(t.noMoves, 1000);
          const shuffled = shuffleBoard(tempBoard, activeChars);
          setBoard(shuffled);
          processBoard(shuffled); 
      }, 500);
    } else if (remainingMoves.length <= 3) {
      if (Math.random() < 0.8) { 
          let normalTiles = [];
          for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                  const ch = tempBoard[r][c].char;
                  if (ch && ch !== ITEM_BOMB && ch !== ITEM_CANDY && ch !== ITEM_CROSS && ch !== ITEM_SHUFFLE) {
                      normalTiles.push({r, c});
                  }
              }
          }
          if (normalTiles.length > 0) {
              const pick = normalTiles[Math.floor(Math.random() * normalTiles.length)];
              tempBoard[pick.r][pick.c].char = ITEM_SHUFFLE;
              tempBoard[pick.r][pick.c].isNew = true; 
              setBoard([...tempBoard]);
              setTimeout(() => {
                showGameMessage(t.shuffleRescue, 1500);
                playSound('collect', audioEnabled); 
              }, 300);
          }
      }
    }

    setCombo(0);
    setIsProcessing(false);
  };

  const handleTileClick = async (r, c) => {
    if (gameState !== 'playing' || isProcessing) return;
    const clickedCell = board[r][c];

    // ✅ 工具列收集
    if (clickedCell.char === ITEM_BOMB) {
        playSound('collect', audioEnabled);
        setBombCount(prev => prev + 1);
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[r][c].char = null;
        setBoard(newBoard);
        showGameMessage(t.bombPlus, 800);
        setTimeout(() => {
            setMatchMessage("");
            const filledBoard = applyGravity(newBoard, activeChars, isAdvancedMode);
            setBoard(filledBoard);
            processBoard(filledBoard);
        }, 500);
        return;
    }
    if (clickedCell.char === ITEM_CANDY) {
        playSound('collect', audioEnabled);
        setCandyCount(prev => prev + 1);
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[r][c].char = null;
        setBoard(newBoard);
        showGameMessage(t.candyPlus, 800);
        setTimeout(() => {
            setMatchMessage("");
            const filledBoard = applyGravity(newBoard, activeChars, isAdvancedMode);
            setBoard(filledBoard);
            processBoard(filledBoard);
        }, 500);
        return;
    }
    if (clickedCell.char === ITEM_CROSS) {
        playSound('collect', audioEnabled);
        setCrossCount(prev => prev + 1);
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[r][c].char = null;
        setBoard(newBoard);
        showGameMessage(t.crossPlus, 800);
        setTimeout(() => {
            setMatchMessage("");
            const filledBoard = applyGravity(newBoard, activeChars, isAdvancedMode);
            setBoard(filledBoard);
            processBoard(filledBoard);
        }, 500);
        return;
    }

    // ✅ 點擊洗牌道具時，直接發動重新洗牌
    if (clickedCell.char === ITEM_SHUFFLE) {
      setActiveTool(null); setHoveredTile(null); 
      setIsProcessing(true);
      playSound('collect', audioEnabled);
      let tempBoard = JSON.parse(JSON.stringify(board));
      tempBoard[r][c].char = null;
      setBoard([...tempBoard]);
      showGameMessage(t.shuffleClear, 800);
      setTimeout(() => {
          const shuffled = shuffleBoard(tempBoard, activeChars);
          setBoard(shuffled);
          processBoard(shuffled); 
      }, 500);
      return;
    }

    if (activeTool === 'bomb') {
      setBombCount(prev => prev - 1); setActiveTool(null); setHoveredTile(null); 
      playSound('bomb', audioEnabled);
      let tempBoard = JSON.parse(JSON.stringify(board));
      const exploded = [];
      for(let i = r-1; i <= r+1; i++) {
        for(let j = c-1; j <= c+1; j++) {
          if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
            if(tempBoard[i][j].char && tempBoard[i][j].char !== ITEM_BOMB && tempBoard[i][j].char !== ITEM_CANDY && tempBoard[i][j].char !== ITEM_CROSS && tempBoard[i][j].char !== ITEM_SHUFFLE) { 
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

    if (activeTool === 'cross') {
      setCrossCount(prev => prev - 1); setActiveTool(null); setHoveredTile(null); 
      playSound('bomb', audioEnabled);
      let tempBoard = JSON.parse(JSON.stringify(board));
      const exploded = [];
      for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
          if (i === r || j === c) {
            if(tempBoard[i][j].char && tempBoard[i][j].char !== ITEM_BOMB && tempBoard[i][j].char !== ITEM_CANDY && tempBoard[i][j].char !== ITEM_CROSS && tempBoard[i][j].char !== ITEM_SHUFFLE) { 
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
      showGameMessage(t.crossClear, 800);
      await new Promise(res => setTimeout(res, 400));
      for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            if (i === r || j === c) tempBoard[i][j].char = null;
        }
      }
      setLevelTargets(prev => prev.map(target => {
        const countLost = exploded.filter(ch => ch === target.char).length;
        if (countLost > 0 && target.count - countLost <= 0 && target.count > 0) {
            setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500);
        }
        return {...target, count: Math.max(0, target.count - countLost)};
      }));
      tempBoard = applyGravity(tempBoard, activeChars, isAdvancedMode);
      setBoard(tempBoard);
      await new Promise(res => setTimeout(res, 500));
      await processBoard(tempBoard); 
      return;
    }

    if (activeTool === 'candy') {
      const target = board[r][c].char; 
      if (target === ITEM_BOMB || target === ITEM_CANDY || target === ITEM_CROSS || target === ITEM_SHUFFLE) return; 

      setCandyCount(prev => prev - 1); setActiveTool(null); 
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
      playSound('select', audioEnabled);
    }
  };

  const handleGiveHint = () => {
    const movesList = getAllPossibleMoves(board);

    if (movesList.length > 0) {
      const hint = movesList[0];
      setHintTiles([{ r: hint[0].r, c: hint[0].c, dr: hint[1].r - hint[0].r, dc: hint[1].c - hint[0].c }, 
                    { r: hint[1].r, c: hint[1].c, dr: hint[0].r - hint[1].r, dc: hint[0].c - hint[1].c }]);
      setIsProcessing(true);
      setTimeout(() => {
        setHintTiles([]);
        setIsProcessing(false);
      }, 800); 
    } else {
      showGameMessage(t.noMoves);
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
    const finalName = inputName.trim();
    if (!finalName) return;
    
    localStorage.setItem('wordcrush_player_name', finalName);
    setPlayerName(finalName);

    if (isFirebaseReady && db && currentUser) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', currentUser.uid);
        const docSnap = await getDoc(docRef);
        let currentHighScore = highScore;
        
        if (docSnap.exists()) {
          currentHighScore = Math.max(currentHighScore, docSnap.data().score || 0);
          setHighScore(currentHighScore);
        }
        
        await setDoc(docRef, {
          name: finalName,
          score: currentHighScore,
          lesson: currentLesson,
          lastSeen: serverTimestamp(),
          uid: currentUser.uid 
        }, { merge: true });
      } catch (err) { console.error(err); }
    }
    
    const expectedBook = getBookFromLesson(currentLesson);
    let startLsn = currentLesson;
    
    // 如果首頁下拉選單的值和 URL 解析出來的所屬冊別不同，代表使用者手動改了首頁選單
    if (selectedBook !== expectedBook) {
        const firstLessonMap = {
            'b1': 'b1-1', 'b2': 'b2-1', 'b3': 'b3-1', 'b4': 'b4-1', 'b5': 'b5-1', 'b6': 'b6-1', 'b7': 'b7-1', 'b8': 'b8-1', 'b9': 'b9-1', 'b10': 'b10-1', 'z': 'z-1', 's': 's-zodiac', 'c': 'custom'
        };
        startLsn = firstLessonMap[selectedBook] || 'z-1';
    }
    
    setCurrentLesson(startLsn);
    startNewLesson(startLsn);

    // 如果使用者選擇自訂題目且沒有資料，立刻跳出輸入框
    if (startLsn === 'custom' && !LESSON_DATA['custom']) {
        setShowCustomModal(true);
    }
  };

  const handleNextStage = () => {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < gameStages.length) {
      setCurrentStageIndex(nextIndex);
      setupStage(currentLesson, nextIndex, gameStages, isAdvancedMode);
    }
  };

  const goToNextLevel = () => {
    let nextLesson = "z-1";
    const parts = String(currentLesson).split('-');
    
    if (parts[0].startsWith('b')) {
        const prefix = parts[0];
        let num = parseInt(parts[1]);
        let nextNum = num + 1;
        // 自動跳過缺少的課
        while (nextNum <= 12 && !LESSON_DATA[`${prefix}-${nextNum}`]) {
            nextNum++;
        }
        // 如果到了盡頭，就循環回該冊的第一課
        nextLesson = nextNum <= 12 ? `${prefix}-${nextNum}` : `${prefix}-1`;
    } else if (parts[0] === 'z') {
        let num = parseInt(parts[1]);
        let nextNum = num + 1;
        nextLesson = nextNum <= 3 ? `z-${nextNum}` : `z-1`;
    } else if (currentLesson === 's-zodiac') {
       nextLesson = 's-dessert';
    } else if (currentLesson === 's-dessert') {
       nextLesson = 's-veg';
    } else if (currentLesson === 's-veg') {
       nextLesson = 's-fruit';
    } else if (currentLesson === 's-fruit') {
       nextLesson = 's-zodiac';
    } else if (currentLesson === 'custom') {
       nextLesson = 'custom';
    } else {
       nextLesson = 'z-1';
    }
    
    setCurrentLesson(nextLesson);
    startNewLesson(nextLesson, false);
  };

  // 初始化 Auth
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setIsFirebaseReady(true);
      } catch (e) {
        console.error("Auth init failed:", e);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 讀取排行榜資料
  useEffect(() => {
    if (!isFirebaseReady || !db) return;
    const qL = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const unsubscribe = onSnapshot(qL, (s) => {
      let players = s.docs.map(d => ({ ...d.data(), id: d.id })).filter(u => Number(u.score) > 0);
      players.sort((a, b) => Number(b.score) - Number(a.score)); // 前端排序
      setLeaderboard(players.slice(0, 20)); // 只顯示前 20 名
    }, (error) => {
      console.error("讀取排行榜失敗:", error);
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

  // 自動心跳：更新最後上線時間
  useEffect(() => {
    if (!isFirebaseReady || !currentUser || !playerName || !db) return; 
    const heartbeat = setInterval(async () => {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', currentUser.uid), {
          lastSeen: serverTimestamp(),
          uid: currentUser.uid
        }, { merge: true });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    }, 60000); 
    return () => clearInterval(heartbeat);
  }, [isFirebaseReady, currentUser, playerName]);

  // 自動同步分數：寫入的是 HighScore (最高紀錄)
  useEffect(() => {
    if (isFirebaseReady && db && currentUser && highScore > 0 && playerName) {
      const saveToFirebase = async () => {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', currentUser.uid), {
            name: playerName,
            score: highScore, 
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
  }, [highScore, currentLesson, currentUser, isFirebaseReady, playerName]);

  useEffect(() => {
    if (gameState === 'playing' && levelTargets.length > 0) {
        if (levelTargets.every(t => Number(t.count) === 0)) {
            if (currentStageIndex < gameStages.length - 1) { 
                setGameState('stage_cleared'); 
                playSound('win', audioEnabled); 
            } 
            else { 
                setGameState('won'); 
                playSound('win', audioEnabled); 
            }
        } else if (Number(moves) <= 0 && !isProcessing) {
            setGameState('lost');
        }
    }
  }, [levelTargets, gameState, currentStageIndex, gameStages, moves, isProcessing, audioEnabled]);

  // 動態判斷目前屬於哪一個冊別 (用來過濾下拉選單)
  let currentGroup = 'z';
  if (String(currentLesson).startsWith('b1-')) currentGroup = 'b1';
  else if (String(currentLesson).startsWith('b2-')) currentGroup = 'b2';
  else if (String(currentLesson).startsWith('b3-')) currentGroup = 'b3';
  else if (String(currentLesson).startsWith('b4-')) currentGroup = 'b4';
  else if (String(currentLesson).startsWith('b5-')) currentGroup = 'b5';
  else if (String(currentLesson).startsWith('b6-')) currentGroup = 'b6';
  else if (String(currentLesson).startsWith('b7-')) currentGroup = 'b7';
  else if (String(currentLesson).startsWith('b8-')) currentGroup = 'b8';
  else if (String(currentLesson).startsWith('b9-')) currentGroup = 'b9';
  else if (String(currentLesson).startsWith('b10-')) currentGroup = 'b10';
  else if (String(currentLesson).startsWith('s-')) currentGroup = 's';
  else if (currentLesson === 'custom' || currentLesson === 'new_custom') currentGroup = 'c';

  const handleUnlock = (e) => {
    e.preventDefault();
    if (inputPassword === GAME_PASSWORD) {
        setIsUnlocked(true);
        if (typeof window !== 'undefined') localStorage.setItem('wordcrush_unlocked', 'true');
    } else {
        setPwdError(true);
        setTimeout(() => setPwdError(false), 800);
        setInputPassword("");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4 font-sans text-black text-center relative overflow-hidden">
        {/* 語言切換按鈕 */}
        <button 
          onClick={toggleLang}
          className="absolute top-4 right-4 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-pink-600 font-bold py-2 px-4 rounded-full shadow-sm transition-all border-2 border-pink-100 flex items-center gap-2 z-20"
        >
          {lang === 'zh' ? '🌐 EN' : '🌐 中文'}
        </button>

        {/* 背景甜點漂浮動畫 */}
        <FloatingDessertBackground />

        <div className={`bg-white p-8 rounded-[40px] border-4 border-pink-200 text-black relative z-10 w-full max-w-sm transition-transform ${pwdError ? 'animate-shake' : ''}`}>
          <div className="bg-gradient-to-tr from-pink-400 to-yellow-300 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-sm">
            <Lock size={48} />
          </div>
          <h1 className="text-3xl font-black mb-2 text-pink-600">{t.unlockTitle}</h1>
          <p className="text-gray-500 mb-8 font-bold text-black">{t.unlockDesc}</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={inputPassword} 
                onChange={(e) => setInputPassword(e.target.value)} 
                placeholder={t.unlockPlaceholder}
                className={`w-full px-6 py-4 rounded-2xl border-4 mb-2 text-xl focus:outline-none bg-gray-50 text-center tracking-widest transition-colors ${pwdError ? 'border-red-300 focus:border-red-400 text-red-500' : 'border-pink-50 focus:border-pink-300 text-black placeholder-gray-300'}`} 
                required 
              />
              {pwdError && <p className="text-red-500 text-sm font-bold mt-1 absolute w-full left-0">{t.unlockError}</p>}
            </div>
            <button type="submit" className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl text-xl active:translate-y-1 mt-4">
                {t.unlockBtn}
            </button>
          </form>
        </div>
        <div className="mt-8 text-center text-pink-300 font-bold text-sm tracking-widest uppercase relative z-10">Design by Sophia Wong</div>
      </div>
    );
  }

  if (gameState === 'welcome') {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4 font-sans text-black text-center relative overflow-hidden">
        {/* 語言切換按鈕 */}
        <button 
          onClick={toggleLang}
          className="absolute top-4 right-4 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-pink-600 font-bold py-2 px-4 rounded-full shadow-sm transition-all border-2 border-pink-100 flex items-center gap-2 z-20"
        >
          {lang === 'zh' ? '🌐 EN' : '🌐 中文'}
        </button>

        {/* 背景甜點漂浮動畫 */}
        <FloatingDessertBackground />

        <div className="bg-white p-8 rounded-[40px] border-4 border-pink-200 text-black relative z-10 w-full max-w-sm">
          <div className="bg-gradient-to-tr from-pink-400 to-yellow-300 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-sm">
            <Cake size={48} />
          </div>
          <div className="text-sm font-black text-pink-400 mb-2 tracking-wide border-2 border-pink-100 rounded-full px-4 py-1 inline-block bg-pink-50">{t.textbook}</div>
          <h1 className="text-4xl font-black mb-2 text-pink-600">{t.title}</h1>
          <p className="text-gray-500 mb-8 font-bold text-black">{t.subtitle}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-4 border-pink-50 text-xl focus:border-pink-300 focus:outline-none bg-white text-pink-600 font-black text-center text-center-last">
                <option value="z">{t.zhuyin}</option>
                <option value="b1">{t.book1}</option>
                <option value="b2">{t.book2}</option>
                <option value="b3">{t.book3}</option>
                <option value="b4">{t.book4}</option>
                <option value="b5">{t.book5}</option>
                <option value="b6">{t.book6}</option>
                <option value="b7">{t.book7}</option>
                <option value="b8">{t.book8}</option>
                <option value="b9">{t.book9}</option>
                <option value="b10">{t.book10}</option>
                <option value="s">{t.special}</option>
                <option value="c">{t.customTitle}</option>
            </select>
            <input type="text" value={String(inputName)} onChange={(e) => setInputName(e.target.value)} placeholder={t.namePlaceholder}
                   className="w-full px-6 py-4 rounded-2xl border-4 border-pink-50 mb-2 text-xl focus:border-pink-300 focus:outline-none bg-gray-50 text-black placeholder-gray-300 text-center" required />
            <button type="submit" className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl text-xl active:translate-y-1 mt-2">
                {t.startClass}
            </button>
          </form>
          <button 
            onClick={() => setShowInstallModal(true)} 
            className="mt-6 flex items-center justify-center gap-2 text-gray-400 hover:text-pink-500 font-bold text-sm w-full transition-colors"
          >
            <Smartphone size={16}/> {t.installMsg}
          </button>
          
          <button 
            onClick={() => setShowHelpModal(true)}
            className="mt-3 text-pink-400 font-bold text-sm hover:underline flex items-center justify-center gap-1 w-full"
          >
             <HelpCircle size={16} /> {t.howToPlay}
          </button>
        </div>
        
        {/* 安裝教學彈窗 */}
        {showInstallModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstallModal(false)}>
                <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-left space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-pink-600">{t.installTitle}</h3>
                        <button onClick={() => setShowInstallModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600">
                        <p><span className="font-bold text-black">{t.installIOS}</span><br/>{t.installIOSDesc}</p>
                        <p><span className="font-bold text-black">{t.installAnd}</span><br/>{t.installAndDesc}</p>
                        <p><span className="font-bold text-black">{t.installPC}</span><br/>{t.installPCDesc}</p>
                    </div>
                    <button onClick={() => setShowInstallModal(false)} className="w-full bg-pink-100 text-pink-600 py-2 rounded-xl font-bold mt-2">{t.gotIt}</button>
                </div>
            </div>
        )}

        {/* 遊戲說明彈窗 */}
        {showHelpModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}>
                <div className="bg-white p-6 rounded-[30px] shadow-2xl w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    <h3 className="text-2xl font-black text-pink-500 mb-6 text-center">{t.helpTitle}</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-pink-100 p-3 rounded-2xl text-pink-500"><MousePointer2 size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{t.help1}</h4>
                                <p className="text-gray-500 text-sm">{t.help1Desc}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600"><Target size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{t.help2}</h4>
                                <p className="text-gray-500 text-sm">{t.help2Desc}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-500"><Bomb size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{t.help3}</h4>
                                <p className="text-gray-500 text-sm">{t.help3Desc}</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowHelpModal(false)} className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold py-3 rounded-2xl mt-8 shadow-lg active:scale-95 transition-all">
                        {t.startChallenge}
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
            <div className="flex gap-2 items-center bg-gray-50 px-2 py-2 rounded-[24px] flex-1 relative overflow-hidden">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex flex-col items-center leading-none shrink-0">
                <Target size={14} className="mb-0.5 text-pink-400"/>{t.target}
              </span>
              
              <div className="flex gap-1 justify-start flex-1 overflow-x-auto no-scrollbar text-black py-1">
                {levelTargets.map((targetObj, i) => {
                  const style = getCharStyle(targetObj.char);
                  return (
                    <div key={`${String(targetObj.char)}-${i}`} 
                         className={`flex flex-col items-center transition-all duration-500 
                                  ${targetObj.count === 0 ? 'opacity-100 scale-100 grayscale-0 order-last' : 'scale-100'}
                                  ${lastTargetHit === targetObj.char ? 'animate-goal-pop' : ''}`}>
                      {targetObj.count === 0 ? (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl animate-bounce">
                          {DESSERT_ICONS[i % DESSERT_ICONS.length]}
                        </div>
                      ) : (
                        <div className="w-10 h-10 border-2 rounded-xl flex items-center justify-center p-0.5" 
                             style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}>
                          <div className="w-full h-full border rounded-lg flex items-center justify-center" style={{borderColor: style.borderColor}}>
                            <span className={`${String(targetObj.char).length > 1 ? 'text-lg tracking-tighter' : 'text-xl'} font-black`} style={{color: style.color}}>{String(targetObj.char)}</span>
                          </div>
                        </div>
                      )}
                      <span className="text-[11px] font-black text-pink-600 mt-1">{targetObj.count === 0 ? '' : Number(targetObj.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* SCORE */}
            <div className="flex flex-col items-center justify-center bg-pink-50 px-3 py-2 rounded-[24px] shrink-0 min-w-[70px] h-[60px]">
                <div className="text-[10px] text-pink-400 font-black uppercase leading-none mb-1">{t.score}</div>
                <div className="text-xl font-black text-pink-600 leading-none">{Number(score)}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center w-full px-2 text-black">
            <div className="flex items-center gap-1">
              <select value={currentLesson} onChange={(e) => { 
                  const val = e.target.value;
                  if (val === 'new_custom') {
                      setShowCustomModal(true);
                  } else {
                      setCurrentLesson(val); 
                      startNewLesson(val, false); 
                  }
              }}
                      className="bg-gray-100 border-2 border-gray-100 rounded-2xl px-2 py-1.5 font-black text-pink-600 text-[11px] sm:text-sm outline-none w-24 sm:w-28 text-center truncate">
                
                {/* 動態顯示當前冊別的課程 */}
                {currentGroup === 'z' && (
                   <optgroup label={t.zhuyin}>
                       <option value="z-1">{t.z1}</option>
                       <option value="z-2">{t.z2}</option>
                       <option value="z-3">{t.z3}</option>
                   </optgroup>
                )}
                {currentGroup === 'b1' && [...Array(12)].map((_, i) => LESSON_DATA[`b1-${i+1}`] ? <option key={`b1-${i+1}`} value={`b1-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b2' && [...Array(12)].map((_, i) => LESSON_DATA[`b2-${i+1}`] ? <option key={`b2-${i+1}`} value={`b2-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b3' && [...Array(12)].map((_, i) => LESSON_DATA[`b3-${i+1}`] ? <option key={`b3-${i+1}`} value={`b3-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b4' && [...Array(12)].map((_, i) => LESSON_DATA[`b4-${i+1}`] ? <option key={`b4-${i+1}`} value={`b4-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b5' && [...Array(12)].map((_, i) => LESSON_DATA[`b5-${i+1}`] ? <option key={`b5-${i+1}`} value={`b5-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b6' && [...Array(12)].map((_, i) => LESSON_DATA[`b6-${i+1}`] ? <option key={`b6-${i+1}`} value={`b6-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b7' && [...Array(12)].map((_, i) => LESSON_DATA[`b7-${i+1}`] ? <option key={`b7-${i+1}`} value={`b7-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b8' && [...Array(12)].map((_, i) => LESSON_DATA[`b8-${i+1}`] ? <option key={`b8-${i+1}`} value={`b8-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b9' && [...Array(12)].map((_, i) => LESSON_DATA[`b9-${i+1}`] ? <option key={`b9-${i+1}`} value={`b9-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 'b10' && [...Array(12)].map((_, i) => LESSON_DATA[`b10-${i+1}`] ? <option key={`b10-${i+1}`} value={`b10-${i+1}`}>{t.lessonPrefix}{i+1}{t.lessonSuffix}</option> : null)}
                {currentGroup === 's' && (
                   <optgroup label={t.special}>
                       <option value="s-zodiac">{t.zodiac}</option>
                       <option value="s-dessert">{t.dessert}</option>
                       <option value="s-veg">{t.veg}</option>
                       <option value="s-fruit">{t.fruit}</option>
                   </optgroup>
                )}
                {currentGroup === 'c' && (
                   <optgroup label={t.customTitle}>
                       <option value="custom">{LESSON_DATA['custom'] ? t.customShort : t.customTitle}</option>
                       <option value="new_custom">{t.addCustom}</option>
                   </optgroup>
                )}
              </select>
              {isAdvancedMode && <span className="text-blue-500 flex items-center gap-0.5 text-[10px] font-bold bg-gray-50 px-1.5 py-1 rounded-lg ml-1"><Snowflake size={10}/>{t.advanced}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setGameState('welcome')} className="p-1.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all active:scale-90 shadow-sm" title={t.homeTitle}>
                <Home size={16} />
              </button>
              <button onClick={handleShare} className="p-1.5 bg-blue-100 text-blue-500 rounded-xl hover:bg-blue-200 transition-all active:scale-90 shadow-sm" title={t.shareTitle}><Share2 size={16} /></button>
              <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-1.5 rounded-xl transition-all active:scale-90 shadow-sm ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {audioEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
              </button>
              <button onClick={toggleFullscreen} className="p-1.5 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all active:scale-90 shadow-sm" title={t.fullscreenTitle}>
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
              <button onClick={() => setShowLeaderboardModal(true)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-all active:scale-90 shadow-sm" title={t.leaderboardTitle}>
                <Trophy size={16} />
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
                  } else if (activeTool === 'cross') {
                    if (r === hoveredTile.r || c === hoveredTile.c) {
                        previewOverlay = <div className="absolute inset-0 z-10 border-[6px] border-yellow-500 bg-yellow-500/30 rounded-2xl animate-pulse" />;
                    }
                  } 
                }

                let finalTransform = 'none';
                if (isSelected) {
                    finalTransform = 'scale(1.15) translateY(-5px)';
                } else if (hint) {
                    finalTransform = `translate(${hint.dc * 100}%, ${hint.dr * 100}%) scale(1.05)`;
                }

                // 道具
                if (cell.char === ITEM_BOMB || cell.char === ITEM_CANDY || cell.char === ITEM_CROSS || cell.char === ITEM_SHUFFLE) {
                    let bgColor = cell.char === ITEM_BOMB ? '#FFCDD2' : cell.char === ITEM_CANDY ? '#E1BEE7' : cell.char === ITEM_CROSS ? '#FFF9C4' : '#E3F2FD';
                    let emoji = cell.char === ITEM_BOMB ? '💣' : cell.char === ITEM_CANDY ? '🍬' : cell.char === ITEM_CROSS ? '✨' : '🔄';
                    return (
                      <button key={cell.id} onClick={() => handleTileClick(r, c)} onMouseEnter={() => setHoveredTile({r, c})}
                        className={`absolute flex items-center justify-center transition-all duration-300 active:scale-90 animate-bounce`}
                        style={{
                            width: '12.5%', height: '12.5%', top: `${r * 12.5}%`, left: `${c * 12.5}%`, padding: '2px',
                            transform: finalTransform
                        }}>
                         <div className="w-full h-full flex items-center justify-center rounded-2xl text-3xl sm:text-4xl shadow-lg border-2 border-white"
                             style={{ backgroundColor: bgColor }}>
                             {emoji}
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
                        <span 
                          className={`font-black select-none pointer-events-none relative z-0 transition-transform ${String(cell.char).length > 1 ? 'text-2xl md:text-3xl tracking-tighter' : (String(currentLesson).startsWith('s-') ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl')}`}
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
                  {gameState === 'won' ? t.winTitle : gameState === 'stage_cleared' ? t.stageClearedTitle : t.loseTitle}
                </h2>
                <div className="text-gray-500 mb-8 font-bold text-lg leading-relaxed">
                    {gameState === 'won' ? (
                        <>
                            {playerName || t.you}{t.winMsg1}{getLessonName(currentLesson, t)}{t.winMsg3}
                        </>
                    ) : gameState === 'stage_cleared' ? (
                        <>
                           {playerName || t.you} {t.clearedDesc1}<br/>{t.clearedDesc2}
                        </>
                    ) : (
                        t.loseDesc
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {gameState === 'stage_cleared' && (
                      <button onClick={handleNextStage} className="col-span-2 w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-5 rounded-[25px] font-black shadow-[0_6px_0_#16a34a] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 text-xl">
                          {t.continueLearn} <ArrowRight size={24} />
                      </button>
                  )}
                  {gameState === 'won' && (
                      <>
                        <button onClick={() => startNewLesson(currentLesson, false)} className="col-span-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-black hover:bg-gray-200">{t.playAgain}</button>
                        <button onClick={goToNextLevel} className="col-span-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 rounded-2xl font-black shadow-lg hover:brightness-110 active:translate-y-1">{t.nextLesson}</button>
                        
                        <button onClick={() => startNewLesson(currentLesson, true)} className="col-span-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white py-4 rounded-2xl font-black shadow-[0_6px_0_#db2777] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all text-xl flex items-center justify-center gap-2"><Snowflake size={20}/> {t.hardMode}</button>
                        
                        <button onClick={() => setGameState('welcome')} className="col-span-2 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-2xl font-bold hover:text-gray-600 flex items-center justify-center gap-2"><Home size={18}/> {t.endGame}</button>
                      </>
                  )}
                  {(gameState === 'lost' || gameState === 'won') && gameState !== 'won' && (
                      <button onClick={() => startNewLesson(currentLesson, isAdvancedMode)} className="col-span-2 w-full bg-gray-100 text-gray-500 py-4 rounded-[25px] font-black hover:bg-gray-200 transition-all text-black flex items-center justify-center gap-2 text-xl">
                          <Repeat size={20}/> {t.tryAgain}
                      </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="w-full px-1 sm:px-2 pb-8 flex justify-between items-stretch gap-1 sm:gap-2 text-black relative z-20">
          <button onClick={() => bombCount > 0 && setActiveTool(activeTool === 'bomb' ? null : 'bomb')}
                  className={`flex-1 py-2.5 sm:py-3 rounded-[18px] sm:rounded-[24px] flex flex-col items-center justify-center transition-all border-2 shadow-sm ${activeTool === 'bomb' ? 'bg-red-50 border-red-300 scale-105' : 'bg-white border-gray-100'}`}>
            <div className="relative text-red-400"><Bomb className="w-5 h-5 sm:w-6 sm:h-6" /><span className="absolute -top-2 -right-2 sm:-right-3 bg-red-500 text-white text-[10px] sm:text-[12px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{Number(bombCount)}</span></div>
            <span className="text-[10px] sm:text-xs font-black mt-1.5 text-black whitespace-nowrap">{t.bomb}</span>
          </button>
          <button onClick={() => crossCount > 0 && setActiveTool(activeTool === 'cross' ? null : 'cross')}
                  className={`flex-1 py-2.5 sm:py-3 rounded-[18px] sm:rounded-[24px] flex flex-col items-center justify-center transition-all border-2 shadow-sm ${activeTool === 'cross' ? 'bg-yellow-50 border-yellow-300 scale-105' : 'bg-white border-gray-100'}`}>
            <div className="relative text-yellow-500"><Zap className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" /><span className="absolute -top-2 -right-2 sm:-right-3 bg-yellow-400 text-white text-[10px] sm:text-[12px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{Number(crossCount)}</span></div>
            <span className="text-[10px] sm:text-xs font-black mt-1.5 text-black whitespace-nowrap">{t.cross}</span>
          </button>
          <button onClick={() => candyCount > 0 && setActiveTool(activeTool === 'candy' ? null : 'candy')}
                  className={`flex-1 py-2.5 sm:py-3 rounded-[18px] sm:rounded-[24px] flex flex-col items-center justify-center transition-all border-2 shadow-sm ${activeTool === 'candy' ? 'bg-purple-50 border-purple-300 scale-105' : 'bg-white border-gray-100'}`}>
            <div className="relative text-purple-500"><Candy className="w-5 h-5 sm:w-6 sm:h-6" /><span className="absolute -top-2 -right-2 sm:-right-3 bg-purple-400 text-white text-[10px] sm:text-[12px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{Number(candyCount)}</span></div>
            <span className="text-[10px] sm:text-xs font-black mt-1.5 text-black whitespace-nowrap">{t.candy}</span>
          </button>
          <button onClick={handleGiveHint} className="flex-1 py-2.5 sm:py-3 bg-white rounded-[18px] sm:rounded-[24px] border-gray-100 border-2 flex flex-col items-center justify-center transition-all shadow-sm">
              <div className="relative text-yellow-400"><Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <span className="text-[10px] sm:text-xs font-black mt-1.5 text-black whitespace-nowrap">{t.hint}</span>
          </button>
          <button onClick={() => startNewLesson(currentLesson)} className="flex-1 py-2.5 sm:py-3 bg-white rounded-[18px] sm:rounded-[24px] border-gray-100 border-2 flex flex-col items-center justify-center transition-all shadow-sm">
              <div className="relative text-blue-400"><RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <span className="text-[10px] sm:text-xs font-black mt-1.5 text-black whitespace-nowrap">{t.reset}</span>
          </button>
        </div>
        
        {/* 自訂題目彈窗 */}
        {showCustomModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCustomModal(false)}>
                <div className="bg-white p-6 rounded-[30px] shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-pink-600 mb-2 flex items-center gap-2"><PenTool/> {t.customTitle}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t.customDesc}</p>
                    <textarea 
                        className="w-full h-32 border-2 border-pink-100 rounded-xl p-3 focus:outline-none focus:border-pink-300 text-lg text-black"
                        placeholder={t.customPlaceholder}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                    />
                    <div className="flex gap-2 mt-4">
                        {LESSON_DATA['custom'] && (
                             <button onClick={handleDeleteCustom} className="flex-none px-4 py-3 rounded-xl bg-red-100 text-red-500 font-bold hover:bg-red-200 transition-colors" title={t.deleteCustom}>
                                <Trash2 size={20}/>
                             </button>
                        )}
                        <button onClick={() => setShowCustomModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">{t.cancel}</button>
                        <button onClick={handleCustomStart} className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-bold shadow-lg hover:bg-pink-600 transition-colors">{t.startGame}</button>
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
              <h3 className="text-xl font-black text-pink-600 flex items-center gap-3 text-black"><Trophy className="text-yellow-500" /> {t.leaderboard}</h3>
              <button onClick={() => setShowLeaderboardModal(false)} className="p-2 bg-white rounded-full flex items-center justify-center text-black"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar text-black">
              {leaderboard.map((user, idx) => (
                <div key={user.id} className={`flex items-center justify-between p-5 rounded-[30px] transition-all ${user.id === (currentUser?.uid || '') ? 'bg-pink-100' : 'bg-gray-50'}`}>
                  <div className="flex flex-col text-black">
                    <div className="flex items-center gap-4 text-black">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-gray-400'}`}>{idx + 1}</span>
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-700 text-black flex items-center gap-2">
                              {String(user.name)}
                              {((currentUser && user.id === currentUser.uid) || (user.lastSeen && typeof user.lastSeen.toMillis === 'function' && (Date.now() - user.lastSeen.toMillis()) < 5 * 60 * 1000)) && (
                                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {t.online}
                                  </span>
                              )}
                          </span>
                          <span className="text-xs text-gray-500 font-medium mt-0.5">
                              {t.challenge}{getLessonName(user.lesson, t)}
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
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 50% { transform: translateX(8px); } 75% { transform: translateX(-8px); } }
        .animate-confetti-fall { animation: confetti-fall linear forwards; }
        .animate-goal-pop { animation: goal-pop 0.5s ease-out; }
        .animate-match-pop { animation: match-pop 0.5s forwards; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-float { animation: float 10s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}