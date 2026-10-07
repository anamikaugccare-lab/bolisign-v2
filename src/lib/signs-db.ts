import fs from 'fs';
import path from 'path';
import { CustomSign, RecognizedResult } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'custom_signs.json');

// Built-in Indian Sign Language (ISL) baseline gestures
// Built-in Indian Sign Language (ISL) baseline gestures (Alphabets A-Z, Numbers 0-9, and Daily/College/Emergency)
export const DEFAULT_SIGNS: CustomSign[] = [
  {
    "id": "sign-dadaji",
    "nameHindi": "दादाजी (Dadaji)",
    "nameEnglish": "Grandfather (Dadaji)",
    "category": "daily",
    "handsCount": 1,
    "handType": "left",
    "bodyLocation": "forehead",
    "handDirection": "horizontal_head",
    "palmFacing": "front",
    "description": "माथे पर रखा हुआ बायां हाथ, उंगली माथे के आर-पार आड़ी/लेटी हुई (Horizontal across forehead)।",
    "icon": "👴",
    "landmarksSample": [],
    "createdAt": "2026-10-07T05:00:00.000Z"
  },
  {
    "id": "sign-dadiji",
    "nameHindi": "दादीजी (Dadiji)",
    "nameEnglish": "Grandmother (Dadiji)",
    "category": "daily",
    "handsCount": 1,
    "handType": "left",
    "bodyLocation": "chin",
    "handDirection": "horizontal_head",
    "palmFacing": "front",
    "description": "ठोड़ी पर रखा हुआ बायां हाथ, उंगली ठोड़ी के आर-पार आड़ी/लेटी हुई (Horizontal across chin)।",
    "icon": "👵",
    "landmarksSample": [],
    "createdAt": "2026-10-07T05:00:00.000Z"
  },
  {
    "id": "sign-fever",
    "nameHindi": "बुखार (Fever)",
    "nameEnglish": "Fever",
    "category": "emergency",
    "handsCount": 1,
    "handType": "left",
    "bodyLocation": "forehead",
    "handDirection": "horizontal_head",
    "palmFacing": "front",
    "description": "माथे पर रखा हुआ बायां हाथ, ४ उंगलियां माथे के आर-पार आड़ी/लेटी हुई (तापमान जांचना)।",
    "icon": "🤒",
    "landmarksSample": [],
    "createdAt": "2026-10-07T05:00:00.000Z"
  },
  {
    "id": "sign-num-0",
    "nameHindi": "० (0)",
    "nameEnglish": "Zero (0)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": false,
      "ring": false,
      "pinky": false,
      "isPinch": true
    },
    "bodyLocation": "above_head",
    "handDirection": "forward",
    "palmFacing": "front",
    "description": "अंगूठे और तर्जनी के सिरों को जोड़कर गोल छल्ला (Pinch / O-Loop) बनाएं, हथेली सामने रखें।",
    "icon": "0️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.265Z"
  },
  {
    "id": "sign-num-1",
    "nameHindi": "१ (1)",
    "nameEnglish": "One (1)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": false,
      "ring": false,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "केवल १ तर्जनी उंगली सीधी ऊपर आसमान की ओर उठाएं (☝️), हथेली सामने (Front)।",
    "icon": "1️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-2",
    "nameHindi": "२ (2)",
    "nameEnglish": "Two (2)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": true,
      "ring": false,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "तर्जनी और मध्यमा को ऊपर उठाकर V आकार (✌️) बनाएं, हथेली सामने रखें।",
    "icon": "2️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-3",
    "nameHindi": "३ (3)",
    "nameEnglish": "Three (3)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "३ उंगलियां (तर्जनी + मध्यमा + अनामिका) सीधी ऊपर उठाएं, हथेली सामने रखें।",
    "icon": "3️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-4",
    "nameHindi": "४ (4)",
    "nameEnglish": "Four (4)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "चारों उंगलियां सीधी ऊपर रखें, अंगूठा हथेली पर अंदर मुड़ा हो, हथेली सामने रखें।",
    "icon": "4️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-5",
    "nameHindi": "५ (5)",
    "nameEnglish": "Five (5)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "पूरा खुला हाथ दिखाएं (सभी ५ उंगलियां सीधी फैली हों ✋), हथेली सामने रखें।",
    "icon": "5️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-6",
    "nameHindi": "६ (6)",
    "nameEnglish": "Six (6)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": false,
      "middle": false,
      "ring": false,
      "pinky": false,
      "thumbPointsUp": true
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "अंगूठा ऊपर (Thumbs Up 👍), बाकी चारों उंगलियां मुट्ठी में बंद रखें।",
    "icon": "6️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-7",
    "nameHindi": "७ (7)",
    "nameEnglish": "Seven (7)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": false,
      "ring": false,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "forward",
    "palmFacing": "front",
    "description": "बंदूक का आकार (तर्जनी आगे और अंगूठा ऊपर 👉 90 डिग्री पर खुला)।",
    "icon": "7️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-8",
    "nameHindi": "८ (8)",
    "nameEnglish": "Eight (8)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": false,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "अंगूठा + तर्जनी + मध्यमा (३ उंगलियां खुली), अनामिका और कनिष्ठिका मुट्ठी में बंद।",
    "icon": "8️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-num-9",
    "nameHindi": "९ (9)",
    "nameEnglish": "Nine (9)",
    "category": "number",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": false
    },
    "bodyLocation": "above_head",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "अंगूठा + तर्जनी + मध्यमा + अनामिका (४ उंगलियां खुली), केवल छोटी उंगली बंद।",
    "icon": "9️⃣",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-principal",
    "nameHindi": "प्रिंसिपल",
    "nameEnglish": "Principal / Head",
    "category": "college",
    "handsCount": 1,
    "handType": "right",
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": false,
      "ring": false,
      "pinky": false
    },
    "bodyLocation": "forehead",
    "handDirection": "horizontal_head",
    "palmFacing": "front",
    "description": "१ तर्जनी उंगली को माथे/कनपटी पर क्षैतिज (Horizontal / Salute) रखकर छुएं (संस्थान प्रमुख का चिन्ह)।",
    "icon": "👨‍🏫",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z",
    "recordedBy": "College Admin"
  },
  {
    "id": "sign-khana",
    "nameHindi": "खाना",
    "nameEnglish": "Food / Hunger",
    "category": "daily",
    "handsCount": 1,
    "bodyLocation": "chin",
    "handDirection": "forward",
    "palmFacing": "front",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": false,
      "pinky": false,
      "isPinch": true
    },
    "description": "उंगलियां आपस में चुटकी की तरह मिलाकर मुंह/ठोड़ी के पास ले जाएं (खाना खाने का इशारा)।",
    "icon": "🍲",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-paani",
    "nameHindi": "पानी",
    "nameEnglish": "Water",
    "category": "daily",
    "handsCount": 1,
    "bodyLocation": "chin",
    "handDirection": "up",
    "palmFacing": "front",
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": false
    },
    "description": "३ उंगलियों (W आकार) को होंठ/ठोड़ी के पास ले जाकर दो बार छुएं।",
    "icon": "💧",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-calling",
    "nameHindi": "कॉलिंग (फोन)",
    "nameEnglish": "Phone Calling",
    "category": "daily",
    "handsCount": 1,
    "bodyLocation": "cheek",
    "handDirection": "up",
    "palmFacing": "front",
    "fingerSignature": {
      "thumb": true,
      "index": false,
      "middle": false,
      "ring": false,
      "pinky": true
    },
    "description": "अंगूठा कान पर और छोटी उंगली मुंह के पास रखें (🤙 फोन कॉल का इशारा)।",
    "icon": "📞",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-madad",
    "nameHindi": "मदद चाहिए (SOS)",
    "nameEnglish": "Help / Emergency (SOS)",
    "category": "emergency",
    "handsCount": 1,
    "bodyLocation": "chest",
    "handDirection": "up",
    "palmFacing": "front",
    "fingerSignature": {
      "thumb": true,
      "index": false,
      "middle": false,
      "ring": false,
      "pinky": true
    },
    "description": "अंगूठा और छोटी उंगली खोलकर छाती पर दिखाएं (आपातकालीन मदद / SOS Shaka)।",
    "icon": "🆘",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-haan",
    "nameHindi": "हाँ",
    "nameEnglish": "Yes",
    "category": "daily",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": false,
      "middle": false,
      "ring": false,
      "pinky": false,
      "thumbPointsUp": true
    },
    "bodyLocation": "chest",
    "handDirection": "up",
    "palmFacing": "front",
    "description": "छाती के सामने अंगूठा ऊपर (Thumbs Up 👍) करके सहमति जताएं।",
    "icon": "👍",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-nahi",
    "nameHindi": "नहीं",
    "nameEnglish": "No",
    "category": "daily",
    "handsCount": 1,
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "bodyLocation": "chest",
    "handDirection": "forward",
    "palmFacing": "front",
    "description": "खुली हथेली छाती के सामने रखकर या अंगूठा नीचे (👎) करके 'ना' जताएं।",
    "icon": "👎",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-file",
    "nameHindi": "फाइल (दस्तावेज़)",
    "nameEnglish": "File / Document",
    "category": "college",
    "handsCount": 2,
    "twoHandRelation": "apart",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "secondFingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "दोनों सीधी हथेलियों को आमने-सामने किताब/फाइल की तरह खोलें (२-हाथ पैरेलल)।",
    "icon": "📁",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z",
    "recordedBy": "College Admin"
  },
  {
    "id": "sign-attendance",
    "nameHindi": "अटेंडेंस",
    "nameEnglish": "Attendance",
    "category": "college",
    "handsCount": 1,
    "bodyLocation": "chest",
    "handDirection": "up",
    "palmFacing": "front",
    "fingerSignature": {
      "thumb": false,
      "index": true,
      "middle": false,
      "ring": false,
      "pinky": false
    },
    "description": "छाती के स्तर पर १ तर्जनी उंगली सीधी ऊपर उठाएं, हथेली सामने (हाजिरी का इशारा)।",
    "icon": "📋",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z",
    "recordedBy": "College Employee"
  },
  {
    "id": "sign-library",
    "nameHindi": "लाइब्रेरी (कॉलेज)",
    "nameEnglish": "College Library",
    "category": "college",
    "handsCount": 2,
    "twoHandRelation": "apart",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "secondFingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "दोनों हाथों की हथेलियों को खुली किताब की तरह छाती के सामने रखें (Book Shape)।",
    "icon": "📚",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z",
    "recordedBy": "College Employee"
  },
  {
    "id": "sign-namaste",
    "nameHindi": "नमस्ते",
    "nameEnglish": "Namaste / Greeting",
    "category": "daily",
    "handsCount": 2,
    "twoHandRelation": "touching_tips",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "secondFingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "दोनों हाथों की हथेलियों को छाती के पास आपस में जोड़ें (🙏)।",
    "icon": "🙏",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-doctor",
    "nameHindi": "डॉक्टर",
    "nameEnglish": "Doctor / Medical",
    "category": "emergency",
    "handsCount": 2,
    "twoHandRelation": "resting_on_palm",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "secondFingerSignature": {
      "thumb": false,
      "index": true,
      "middle": true,
      "ring": false,
      "pinky": false
    },
    "description": "एक हाथ की कलाई पर दूसरे हाथ की २ उंगलियों से नब्ज जांचें।",
    "icon": "🩺",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-dhanyavaad",
    "nameHindi": "धन्यवाद",
    "nameEnglish": "Thank You",
    "category": "daily",
    "handsCount": 1,
    "bodyLocation": "chin",
    "signType": "dynamic",
    "motionDirection": "outward",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "खुले हाथ को ठोड़ी से छूकर आगे की ओर बढ़ाएं।",
    "icon": "💐",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-good-morning",
    "nameHindi": "शुभ प्रभात",
    "nameEnglish": "Good Morning",
    "category": "daily",
    "handsCount": 1,
    "signType": "dynamic",
    "motionDirection": "upward",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "छाती से खुले हाथ को सूर्योदय की तरह ऊपर उठाएं।",
    "icon": "🌅",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  },
  {
    "id": "sign-alvida",
    "nameHindi": "अलविदा (Bye)",
    "nameEnglish": "Goodbye / Bye",
    "category": "daily",
    "handsCount": 1,
    "signType": "dynamic",
    "motionDirection": "wave",
    "bodyLocation": "chest",
    "fingerSignature": {
      "thumb": true,
      "index": true,
      "middle": true,
      "ring": true,
      "pinky": true
    },
    "description": "छाती के पास खुले हाथ से वेव (लहराना) करें।",
    "icon": "👋",
    "landmarksSample": [],
    "createdAt": "2026-10-06T18:03:35.266Z"
  }
];

// Memory cache for serverless environments (Vercel)
let memoryCache: CustomSign[] | null = null;

function getDataFilePath(): string {
  // On Vercel, the app root is read-only, but /tmp is writable
  if (process.env.VERCEL || process.platform === 'linux') {
    const tmpFile = path.join('/tmp', 'custom_signs.json');
    if (!fs.existsSync(tmpFile)) {
      try {
        const sourceData = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : JSON.stringify(DEFAULT_SIGNS, null, 2);
        fs.writeFileSync(tmpFile, sourceData, 'utf8');
      } catch (e) {
        // Fallback to in-memory
      }
    }
    return tmpFile;
  }
  return DATA_FILE;
}

function ensureDataDirectory(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Ignore in read-only environment
  }
}

function deduplicateSigns(signs: CustomSign[]): CustomSign[] {
  const seen = new Set<string>();
  const res: CustomSign[] = [];
  for (const s of signs) {
    if (!s || !s.nameHindi) continue;
    const norm = s.nameHindi.trim().toLowerCase();
    if (!norm) continue;
    if (!seen.has(norm)) {
      seen.add(norm);
      res.push(s);
    }
  }
  return res;
}

export function getAllSigns(): CustomSign[] {
  if (memoryCache !== null) {
    return deduplicateSigns(memoryCache);
  }

  const targetFile = getDataFilePath();
  ensureDataDirectory(targetFile);

  try {
    if (fs.existsSync(targetFile)) {
      const raw = fs.readFileSync(targetFile, 'utf8');
      const signs = JSON.parse(raw) as CustomSign[];
      memoryCache = deduplicateSigns(signs);
      return memoryCache;
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const signs = JSON.parse(raw) as CustomSign[];
      memoryCache = deduplicateSigns(signs);
      return memoryCache;
    }
    memoryCache = deduplicateSigns([...DEFAULT_SIGNS]);
    persistSigns(memoryCache);
    return memoryCache;
  } catch (err) {
    console.error('Error reading signs data file:', err);
    memoryCache = deduplicateSigns([...DEFAULT_SIGNS]);
    return memoryCache;
  }
}

function persistSigns(signs: CustomSign[]) {
  const cleanSigns = deduplicateSigns(signs);
  memoryCache = cleanSigns;
  const targetFile = getDataFilePath();
  try {
    ensureDataDirectory(targetFile);
    fs.writeFileSync(targetFile, JSON.stringify(cleanSigns, null, 2), 'utf8');
  } catch (err) {
    console.warn('Persist to disk failed, maintained in memory:', err);
  }
}

export function saveNewSign(sign: Partial<CustomSign> & { nameHindi: string }): CustomSign {
  let signs = deduplicateSigns(getAllSigns());
  const normName = (sign.nameHindi || '').trim().toLowerCase();

  const existingIndex = signs.findIndex(s => 
    (sign.id && s.id === sign.id) ||
    (s.nameHindi && s.nameHindi.trim().toLowerCase() === normName)
  );

  if (existingIndex !== -1) {
    const updated: CustomSign = {
      ...signs[existingIndex],
      ...sign,
      id: signs[existingIndex].id, // preserve stable ID
      updatedAt: new Date().toISOString()
    };
    signs[existingIndex] = updated;
    persistSigns(signs);
    return updated;
  }

  const newSign: CustomSign = {
    nameEnglish: sign.nameHindi,
    category: 'custom',
    landmarksSample: [],
    bodyLocation: 'neutral',
    signType: 'static',
    motionDirection: 'none',
    recordedBy: 'User',
    ...sign,
    id: sign.id || ('sign-custom-' + Date.now()),
    createdAt: new Date().toISOString()
  };
  signs.push(newSign);
  persistSigns(signs);
  return newSign;
}

export function deleteSign(id: string): boolean {
  let signs = [...getAllSigns()];
  const initialLen = signs.length;
  signs = signs.filter(s => s.id !== id && s.nameHindi !== id);
  if (signs.length !== initialLen) {
    persistSigns(signs);
    return true;
  }
  return false;
}

export function resetToDefaults(): CustomSign[] {
  memoryCache = [...DEFAULT_SIGNS];
  persistSigns(memoryCache);
  return memoryCache;
}

export function clearAllSigns(): CustomSign[] {
  memoryCache = [];
  persistSigns([]);
  return [];
}

export function updateSign(id: string, updates: Partial<CustomSign>): CustomSign | null {
  const signs = [...getAllSigns()];
  const index = signs.findIndex(s => s.id === id);
  if (index === -1) return null;
  signs[index] = { ...signs[index], ...updates };
  persistSigns(signs);
  return signs[index];
}

