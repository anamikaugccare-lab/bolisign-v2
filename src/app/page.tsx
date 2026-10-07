'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Camera, Volume2, VolumeX, Sparkles, Mic, MicOff, PlusCircle, 
  BookOpen, UserCheck, Smartphone, CheckCircle, RefreshCw, AlertCircle,
  Copy, Trash2, RotateCcw, Check, Maximize2, Minimize2, ArrowRight, X, Image as ImageIcon
} from 'lucide-react';
import { CustomSign, FingerSignature, TwoHandRelation, BodyLocation } from '@/lib/types';
import { getMergedSigns, deleteSignPersistently } from '@/lib/storage-sync';

declare global {
  interface Window {
    Hands: any;
    FaceDetection: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function BoliSignPage() {
  const [activeTab, setActiveTab] = useState<'interpret' | 'train' | 'reverse'>('interpret');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraErrorNotice, setCameraErrorNotice] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<string>('AI मॉडल लोड हो रहा है...');
  const [aiReady, setAiReady] = useState<boolean>(false);
  const [handsDetectedCount, setHandsDetectedCount] = useState<number>(0);
  const [twoHandRelationLabel, setTwoHandRelationLabel] = useState<string>('कोई नहीं (Single Hand)');
  
  // Body Location Tracking State (Forehead, Chin, Chest, Cheek, Neutral)
  const [detectedLocation, setDetectedLocation] = useState<BodyLocation>('neutral');
  const [detectedLocationLabel, setDetectedLocationLabel] = useState<string>('✋ खुला स्पेस (Neutral)');
  const [selectedSignLocation, setSelectedSignLocation] = useState<BodyLocation>('neutral');
  const faceDetectionRef = useRef<any>(null);
  const latestFaceRef = useRef<any>(null);
  const latestBodyLocationRef = useRef<{ location: BodyLocation; label: string; icon: string }>({
    location: 'neutral',
    label: 'खुला स्पेस (Neutral)',
    icon: '✋'
  });

  // Dynamic Motion Trajectory Tracking (Upward, Downward, Outward, Wave, etc.)
  const [currentMotion, setCurrentMotion] = useState<{
    direction: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
    label: string;
    speed: number;
    isMoving: boolean;
  }>({
    direction: 'none',
    label: '⏸️ स्थिर (Static)',
    speed: 0,
    isMoving: false
  });
  const motionHistoryRef = useRef<{ x: number; y: number; z: number; time: number }[]>([]);
  const latestMotionRef = useRef<{
    direction: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
    label: string;
    speed: number;
    isMoving: boolean;
  }>({
    direction: 'none',
    label: '⏸️ स्थिर (Static)',
    speed: 0,
    isMoving: false
  });

  // Tab 2 Sign Type Selection: Static vs Dynamic
  const [selectedSignType, setSelectedSignType] = useState<'static' | 'dynamic'>('static');
  const [selectedMotionDirection, setSelectedMotionDirection] = useState<'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left'>('none');
  const [selectedEndLocation, setSelectedEndLocation] = useState<BodyLocation>('neutral');
  
  // Audio state
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  
  // Detection state
  const [currentSign, setCurrentSign] = useState<string>('कैमरा के आगे हाथ लाएं...');
  const [liveHandType, setLiveHandType] = useState<'right' | 'left' | 'both' | 'none'>('none');
  const [liveHandTypeLabel, setLiveHandTypeLabel] = useState<string>('कोई नहीं');
  const latestHandTypeRef = useRef<'right' | 'left' | 'both'>('right');
  const [liveHandDirection, setLiveHandDirection] = useState<{ direction: string; label: string; icon: string }>({ direction: 'up', label: 'ऊपर सीधी', icon: '⬆️' });
  const [livePalmFacing, setLivePalmFacing] = useState<{ facing: string; label: string; icon: string }>({ facing: 'front', label: 'हथेली सामने (आगे का भाग)', icon: '🖐️' });
  const [showSignGuideModal, setShowSignGuideModal] = useState<boolean>(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'numbers' | 'daily'>('daily');
  const [confidence, setConfidence] = useState<number>(0);
  const [fingerStates, setFingerStates] = useState<string>('इंतज़ार कर रहे हैं...');
  const [sentenceTokens, setSentenceTokens] = useState<string[]>([]);
  const [fluentHindiSentence, setFluentHindiSentence] = useState<string>('');
  
  // Custom Signs State (College Employee data)
  const [allSigns, setAllSigns] = useState<CustomSign[]>([]);
  const [newSignHindi, setNewSignHindi] = useState<string>('');
  const [newSignEnglish, setNewSignEnglish] = useState<string>('');
  const [newSignCategory, setNewSignCategory] = useState<'college' | 'daily' | 'emergency'>('college');
  const [isRecordingSign, setIsRecordingSign] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [quickSignName, setQuickSignName] = useState<string>('');

  // Reverse Mode & Voice-to-Text Speech Recognition
  const [spokenHindiText, setSpokenHindiText] = useState<string>('हाँ, लाइब्रेरी दूसरे माले पर खुली है।');
  const [manualHindiInput, setManualHindiInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Video file test mode & Camera Expansion Mode
  const [isVideoFileMode, setIsVideoFileMode] = useState<boolean>(false);
  const [currentVideoName, setCurrentVideoName] = useState<string>('');
  const [isCameraExpanded, setIsCameraExpanded] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpokenSignRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSosTimeRef = useRef<number>(0);
  const lastUpwardMotionTimeRef = useRef<number>(0);
  const lastWaveMotionTimeRef = useRef<number>(0);
  const lastHandSeenTimeRef = useRef<number>(Date.now());
  const recentDetectionsRef = useRef<string[]>([]);
  const latestRawLandmarksRef = useRef<any[] | null>(null);
  const latestFingerSignatureRef = useRef<any>(null);
  const latestSecondRawLandmarksRef = useRef<any[] | null>(null);
  const latestSecondFingerSignatureRef = useRef<FingerSignature | null>(null);
  const latestTwoHandRelationRef = useRef<{ relation: TwoHandRelation; distance: number; label: string }>({ relation: 'none', distance: 0, label: 'कोई नहीं' });
  const lastStableLandmarksRef = useRef<any[] | null>(null);
  const lastStableSignatureRef = useRef<any>(null);
  const lastStableSecondLandmarksRef = useRef<any[] | null>(null);
  const lastStableSecondSignatureRef = useRef<any>(null);
  const lastStableTimeRef = useRef<number>(0);
  const lockedPoseRef = useRef<{ 
    landmarks: any[]; 
    signature: any; 
    name: string; 
    label?: string; 
    location?: BodyLocation;
    signType?: 'static' | 'dynamic';
    motionDirection?: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
    handsCount?: 1 | 2;
    handType?: 'right' | 'left' | 'both' | 'any';
    handTypeLabel?: string;
    secondLandmarks?: any[];
    secondSignature?: any;
    twoHandRelation?: TwoHandRelation;
    twoHandDistance?: number;
  } | null>(null);
  const [lockedPoseStatus, setLockedPoseStatus] = useState<string>('');
  const [lockedPoseInfo, setLockedPoseInfo] = useState<{ 
    label: string; 
    signature: any; 
    location?: BodyLocation;
    handType?: string;
    handTypeLabel?: string;
    signType?: 'static' | 'dynamic';
    motionDirection?: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
  } | null>(null);
  const [liveGestureName, setLiveGestureName] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [poseCaptureNotice, setPoseCaptureNotice] = useState<string>('');

  const BASE_SIGN_IDS = [
    'sign-dadaji', 'sign-dadiji', 'sign-fever',
    'sign-principal', 'sign-khana', 'sign-paani', 'sign-calling', 'sign-madad', 'sign-haan', 'sign-nahi', 'sign-file',
    'sign-attendance', 'sign-library', 'sign-namaste', 'sign-doctor', 'sign-dhanyavaad', 'sign-good-morning', 'sign-alvida',
    'sign-num-0', 'sign-num-1', 'sign-num-2', 'sign-num-3', 'sign-num-4', 'sign-num-5', 'sign-num-6', 'sign-num-7', 'sign-num-8', 'sign-num-9'
  ];
  const customSigns = allSigns.filter(s => !BASE_SIGN_IDS.includes(s.id));
  const activeTabRef = useRef<'interpret' | 'train' | 'reverse'>('interpret');
  const customSignsRef = useRef<CustomSign[]>([]);
  const allSignsRef = useRef<CustomSign[]>([]);
  const activeSignIdsRef = useRef<Set<string>>(new Set());
  const activeSignNamesRef = useRef<Set<string>>(new Set());

  // Helper to get nice emoji icon for any sign name
  const getSignEmoji = (name: string) => {
    // Numbers 0-9
    if (name.includes('०') || name.includes('(0)')) return '0️⃣';
    if (name.includes('१') || name.includes('(1)')) return '1️⃣';
    if (name.includes('२') || name.includes('(2)')) return '2️⃣';
    if (name.includes('३') || name.includes('(3)')) return '3️⃣';
    if (name.includes('४') || name.includes('(4)')) return '4️⃣';
    if (name.includes('५') || name.includes('(5)')) return '5️⃣';
    if (name.includes('६') || name.includes('(6)')) return '6️⃣';
    if (name.includes('७') || name.includes('(7)')) return '7️⃣';
    if (name.includes('८') || name.includes('(8)')) return '8️⃣';
    if (name.includes('९') || name.includes('(9)')) return '9️⃣';

    // Daily & College Words
    if (name.includes('दादाजी') || name.includes('Dadaji')) return '👴';
    if (name.includes('दादीजी') || name.includes('Dadiji')) return '👵';
    if (name.includes('बुखार') || name.includes('Fever')) return '🤒';
    if (name.includes('प्रिंसिपल') || name.includes('Principal')) return '👨‍🏫';
    if (name.includes('कॉलिंग') || name.includes('Calling') || name.includes('फोन')) return '📞';
    if (name.includes('फाइल') || name.includes('File') || name.includes('दस्तावेज़')) return '📁';
    if (name.includes('खाना') || name.includes('Food')) return '🍲';
    if (name.includes('पानी') || name.includes('Water')) return '💧';
    if (name.includes('मदद') || name.includes('SOS') || name.includes('Help')) return '🆘';
    if (name.includes('हाँ') || name.includes('Yes')) return '👍';
    if (name.includes('नहीं') || name.includes('No')) return '👎';
    if (name.includes('अटेंडेंस') || name.includes('Attendance')) return '☝️';
    if (name.includes('लाइब्रेरी') || name.includes('Library')) return '📚';
    if (name.includes('नमस्ते') || name.includes('Hello')) return '🙏';
    if (name.includes('डॉक्टर') || name.includes('Doctor')) return '🩺';
    if (name.includes('शुभ प्रभात') || name.includes('Morning')) return '🌅';
    if (name.includes('अलविदा') || name.includes('Bye')) return '👋';
    if (name.includes('धन्यवाद') || name.includes('आभार') || name.includes('Thank')) return '🙏';
    return '✨';
  };

  const isSignActive = (id: string, name: string) => {
    return activeSignIdsRef.current.has(id) || activeSignNamesRef.current.has(name);
  };

  // Only run built-in fallback heuristic if sign has NO custom trained sample in dictionary
  const isBaselineWithoutCustomData = (id: string, name: string) => {
    if (!isSignActive(id, name)) return false;
    const found = allSignsRef.current.find(s => s.id === id || s.nameHindi === name);
    if (found && ((found.landmarksSample && found.landmarksSample.length === 21) || found.fingerSignature)) {
      return false; // has custom trained pose, do NOT use hardcoded heuristic!
    }
    return true;
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    allSignsRef.current = allSigns;
    customSignsRef.current = allSigns.filter(s => !BASE_SIGN_IDS.includes(s.id));
    activeSignIdsRef.current = new Set(allSigns.map(s => s.id));
    activeSignNamesRef.current = new Set(allSigns.map(s => s.nameHindi));
  }, [allSigns]);

  // 1. Load signs from hybrid storage (LocalStorage + Backend API)
  const loadSigns = async () => {
    try {
      const merged = await getMergedSigns();
      setAllSigns(merged);
      allSignsRef.current = merged;
      customSignsRef.current = merged.filter((s: any) => !BASE_SIGN_IDS.includes(s.id));
      activeSignIdsRef.current = new Set(merged.map((s: any) => s.id));
      activeSignNamesRef.current = new Set(merged.map((s: any) => s.nameHindi));
    } catch (err) {
      console.error('Error loading signs:', err);
    }
  };

  useEffect(() => {
    loadSigns();
    window.addEventListener('bolisign-signs-updated', loadSigns);
    window.addEventListener('storage', loadSigns);
    const handleVis = () => {
      if (!document.hidden) loadSigns();
    };
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('focus', loadSigns);
    window.addEventListener('pageshow', loadSigns);

    return () => {
      window.removeEventListener('bolisign-signs-updated', loadSigns);
      window.removeEventListener('storage', loadSigns);
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('focus', loadSigns);
      window.removeEventListener('pageshow', loadSigns);
    };
  }, []);

  // 2. Mobile Speech Unlock & Text-to-Speech
  const unlockAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const test = new SpeechSynthesisUtterance('आवाज़ चालू है!');
      test.lang = 'hi-IN';
      test.rate = 1.0;
      window.speechSynthesis.speak(test);
      setAudioUnlocked(true);
      setVoiceEnabled(true);
    }
  };

  const speakHindi = (text: string, force: boolean = false) => {
    if (!voiceEnabled || !text) return;
    if ('speechSynthesis' in window) {
      // Don't cut off previous word mid-syllable unless forced (e.g. SOS emergency)
      if (window.speechSynthesis.speaking && !force) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) utterance.voice = hindiVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // 2b. Hindi Speech Recognition (Voice-to-Text for Reverse Mode)
  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechNotice('⚠️ आपके ब्राउज़र में आवाज़ पहचान (Speech Recognition) उपलब्ध नहीं है। कृपया Google Chrome या Microsoft Edge का उपयोग करें।');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const rec = new SpeechRec();
      rec.lang = 'hi-IN'; // Indian Hindi
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setSpeechNotice('🔴 माइक चालू है... कृपया हिंदी में बोलें');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        if (text && text.trim()) {
          setSpokenHindiText(text);
          setSpeechNotice(`✓ पहचाना गया: "${text}"`);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechNotice('⚠️ माइक्रोफ़ोन अनुमति ब्लॉक है! कृपया ब्राउज़र एड्रेस बार में 🔒 या माइक आइकन पर क्लिक करके Microphone "Allow" करें।');
        } else if (event.error === 'no-speech') {
          setSpeechNotice('⚠️ आवाज़ सुनाई नहीं दी। दोबारा माइक दबाकर बोलें।');
        } else if (event.error === 'network') {
          setSpeechNotice('⚠️ नेटवर्क एरर: आवाज़ पहचान के लिए इंटरनेट आवश्यक है।');
        } else {
          setSpeechNotice(`माइक स्थिति: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
      unlockAudio();
    } catch (err: any) {
      console.error('Speech recognition start error:', err);
      setSpeechNotice('माइक शुरू करने में समस्या: ' + err.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpeechNotice('माइक बंद किया गया');
    setTimeout(() => setSpeechNotice(''), 3000);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const copyToClipboard = () => {
    if (!spokenHindiText) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(spokenHindiText);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // 3. Initialize MediaPipe Hands & Face Detection
  useEffect(() => {
    let checkInterval: any = null;

    const initModels = () => {
      if (typeof window === 'undefined') return;

      // 1. Initialize Hands
      if (window.Hands && !handsRef.current) {
        try {
          setAiStatus('MediaPipe मॉडल इनिशियलाइज़ हो रहा है...');
          const hands = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
          });

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0, // 0 is ultra fast on mobile phones/tablets
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          hands.onResults(handleResults);
          handsRef.current = hands;
          setAiReady(true);
          setAiStatus('AI मॉडल तैयार है (Ready) ✅');
        } catch (err: any) {
          console.error('MediaPipe Hands Init Error:', err);
          setAiStatus('MediaPipe लोड करने में त्रुटि आई');
        }
      }

      // 2. Initialize Face Detection for Body Location Anchors (Forehead, Chin, Chest)
      if (window.FaceDetection && !faceDetectionRef.current) {
        try {
          const fd = new window.FaceDetection({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`
          });
          fd.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
          });
          fd.onResults((faceRes: any) => {
            if (faceRes.detections && faceRes.detections.length > 0) {
              latestFaceRef.current = faceRes.detections[0];
            } else {
              latestFaceRef.current = null;
            }
          });
          faceDetectionRef.current = fd;
        } catch (fErr: any) {
          console.warn('FaceDetection Init notice (using geometric fallback):', fErr);
        }
      }

      if (handsRef.current && faceDetectionRef.current && checkInterval) {
        clearInterval(checkInterval);
      }
    };

    checkInterval = setInterval(() => {
      initModels();
    }, 400);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) {}
      }
      if (faceDetectionRef.current) {
        try { faceDetectionRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // 4. Robust Multi-Fallback Camera Start with Comprehensive Diagnostics
  const startCamera = async () => {
    try {
      setCameraErrorNotice('');
      setAiStatus('कैमरा शुरू हो रहा है...');

      // Check if navigator.mediaDevices and getUserMedia exist
      if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        const isNotLocalhost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        let msg = 'ब्राउज़र में कैमरा API (getUserMedia) उपलब्ध नहीं है।';
        if (isNotLocalhost) {
          msg = 'ब्राउज़र सुरक्षा नियम: मोबाइल या नेटवर्क IP (HTTP) पर ब्राउज़र कैमरा को ब्लॉक करता है। कृपया अपने लैपटॉप के ब्राउज़र में सीधे http://localhost:3000 खोलें, या HTTPS इस्तेमाल करें।';
        }
        setCameraErrorNotice(msg);
        setAiStatus('कैमरा एरर: localhost या HTTPS आवश्यक है');
        return;
      }

      let stream: MediaStream | null = null;

      // Tier 1: Front camera with ideal 640x480 resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (e1) {
        console.warn('Tier 1 constraint failed, trying Tier 2 (facingMode only)...', e1);
        try {
          // Tier 2: Basic user-facing camera without resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        } catch (e2) {
          console.warn('Tier 2 constraint failed, trying Tier 3 (universal video)...', e2);
          // Tier 3: Universal video fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (!stream) {
        throw new Error('कैमरा वीडियो स्ट्रीम प्राप्त नहीं हो सकी।');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn('video.play() warning:', playErr);
            }
            if (videoRef.current.videoWidth && videoRef.current.videoHeight && canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            setCameraActive(true);
            setAiStatus('कैमरा लाइव है • हाथ सामने लाएं 🖐️');
            startProcessingLoop();
          }
        };
      }
      unlockAudio();
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      let userFriendlyMsg = 'कैमरा शुरू करने में समस्या आई: ' + (err.message || 'त्रुटि');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMsg = '⚠️ कैमरा परमिशन ब्लॉक है! ब्राउज़र के URL बार में 🔒 या कैमरा आइकन पर क्लिक करें और Camera को "Allow" करें, फिर रिफ्रेश करें।';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMsg = '⚠️ कोई वेबकैम/कैमरा नहीं मिला! कृपया अपना कैमरा कनेक्ट करें।';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userFriendlyMsg = '⚠️ कैमरा किसी अन्य ऐप (जैसे Zoom, Teams, Meet या कैमरा ऐप) में व्यस्त है। कृपया उसे बंद करके दोबारा कोशिश करें।';
      } else if (err.name === 'OverconstrainedError') {
        userFriendlyMsg = '⚠️ कैमरा इस रिज़ॉल्यूशन को सपोर्ट नहीं कर रहा।';
      }

      setCameraErrorNotice(userFriendlyMsg);
      setAiStatus('कैमरा एरर: ' + (err.name || 'त्रुटि'));
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {}
    }
    setCameraActive(false);
    setIsVideoFileMode(false);
    setCurrentVideoName('');
    setHandsDetectedCount(0);
    setAiStatus('कैमरा / वीडियो बंद है');
  };

  // Play pre-recorded or uploaded video file through MediaPipe AI
  const playDemoVideo = (srcUrl: string = '/demo1.mp4', name: string = 'demo1.mp4') => {
    try {
      setCameraErrorNotice('');
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        videoRef.current.src = srcUrl;
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            try {
              await videoRef.current.play();
              if (videoRef.current.videoWidth && videoRef.current.videoHeight && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
              setCameraActive(true);
              setIsVideoFileMode(true);
              setCurrentVideoName(name);
              setAiStatus(`🎬 वीडियो टेस्ट चालू है: ${name}`);
              startProcessingLoop();
            } catch (playErr) {
              console.error('Video play error:', playErr);
            }
          }
        };
      }
      unlockAudio();
    } catch (e: any) {
      alert('वीडियो लोड करने में समस्या: ' + e.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      playDemoVideo(url, file.name);
    }
  };

  // 4b. Intelligent Face & Body Anchor Detection (Forehead, Chin, Cheek, Chest)
  const computeBodyLocation = (lm: any[], face: any | null): { location: BodyLocation; label: string; icon: string } => {
    if (!lm || lm.length === 0) return { location: 'neutral', label: 'हाथ नहीं दिख रहा', icon: '✋' };

    const indexTip = lm[8];
    const middleMcp = lm[9];
    const wrist = lm[0];

    const handTipY = Math.min(indexTip.y, lm[12]?.y || indexTip.y);
    const handCenterY = (middleMcp.y + wrist.y) / 2;
    const handX = middleMcp.x;

    if (face && face.boundingBox) {
      const box = face.boundingBox;
      const faceX = box.xCenter;
      const faceY = box.yCenter;
      const faceW = box.width;
      const faceH = box.height;

      const topOfHead = faceY - faceH * 0.5;
      const eyesY = face.landmarks ? (face.landmarks[0].y + face.landmarks[1].y) / 2 : topOfHead + faceH * 0.32;
      const noseY = face.landmarks ? face.landmarks[2].y : faceY + faceH * 0.05;
      const mouthY = face.landmarks ? face.landmarks[3].y : faceY + faceH * 0.28;
      const chinY = faceY + faceH * 0.48;

      // Cheek points
      const cheekR = face.landmarks ? face.landmarks[4] : { x: faceX - faceW * 0.45, y: faceY };
      const cheekL = face.landmarks ? face.landmarks[5] : { x: faceX + faceW * 0.45, y: faceY };

      const distToCheekR = Math.hypot(handX - cheekR.x, handCenterY - cheekR.y);
      const distToCheekL = Math.hypot(handX - cheekL.x, handCenterY - cheekL.y);

      // 1. Above Head Zone: Open air space ABOVE the forehead (अंक ०-९ दायां हाथ ज़ोन)
      if (handTipY < topOfHead + faceH * 0.05 && Math.abs(handX - faceX) < faceW * 2.2) {
        return { location: 'above_head', label: 'माथे से ऊपर खुला स्पेस (अंक ०-९)', icon: '🔢' };
      }

      // 2. Forehead Zone: Hand placed on the forehead itself (प्रिंसिपल, दादाजी, बुखार)
      if (handTipY >= topOfHead + faceH * 0.05 && handTipY <= eyesY + faceH * 0.12 && Math.abs(handX - faceX) < faceW * 1.5) {
        return { location: 'forehead', label: 'माथा (प्रिंसिपल, दादाजी, बुखार ज़ोन)', icon: '👤' };
      }

      // 3. Chin / Mouth Zone (खाना / पानी / दादीजी): Near mouth or chin
      const distToMouth = Math.hypot(indexTip.x - faceX, indexTip.y - mouthY);
      const isAtMouthOrChin = (distToMouth < faceH * 0.38) || 
                              (Math.abs(handTipY - mouthY) < faceH * 0.32 && Math.abs(handX - faceX) < faceW * 1.1) ||
                              (Math.abs(handCenterY - chinY) < faceH * 0.35 && Math.abs(handX - faceX) < faceW * 1.1);
      if (isAtMouthOrChin) {
        return { location: 'chin', label: 'ठोड़ी / मुंह (पानी, खाना, दादीजी ज़ोन)', icon: '🗣️' };
      }

      // 4. Cheek / Ear Zone (कॉलिंग / फोन): Hand near left or right cheek/ear
      if (handCenterY > eyesY && handCenterY < chinY + faceH * 0.20 && (distToCheekR < faceW * 0.65 || distToCheekL < faceW * 0.65)) {
        return { location: 'cheek', label: 'गाल / कान (कॉलिंग ज़ोन)', icon: '👂' };
      }

      // 5. Chest Zone (छाती: अटेंडेंस, नमस्ते, मदद, फाइल...): Below chin
      if (handCenterY >= chinY && Math.abs(handX - faceX) < faceW * 2.5) {
        return { location: 'chest', label: 'छाती (अटेंडेंस, हाँ, नहीं, मदद)', icon: '🫀' };
      }
    }

    // Normalized frame coordinates fallback when face tracker is searching
    if (handTipY < 0.20) {
      return { location: 'above_head', label: 'माथे से ऊपर खुला स्पेस (अंक ०-९)', icon: '🔢' };
    } else if (handTipY >= 0.20 && handTipY < 0.32) {
      return { location: 'forehead', label: 'माथा (प्रिंसिपल, दादाजी, बुखार ज़ोन)', icon: '👤' };
    } else if (handTipY >= 0.32 && handTipY < 0.48 && Math.abs(handX - 0.5) < 0.28) {
      return { location: 'chin', label: 'ठोड़ी / मुंह (पानी, खाना, दादीजी ज़ोन)', icon: '🗣️' };
    }
    return { location: 'chest', label: 'छाती (अटेंडेंस, हाँ, नहीं, मदद)', icon: '🫀' };
  };

  // 4c. Draw Holographic Target Anchors on Camera Canvas
  const drawBodyAnchors = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    face: any | null,
    activeLoc: string
  ) => {
    let aboveHeadPt = { x: width * 0.5, y: height * 0.10, label: 'खुला स्पेस' };
    let foreheadPt = { x: width * 0.5, y: height * 0.22, label: 'माथा' };
    let chinPt = { x: width * 0.5, y: height * 0.44, label: 'ठोड़ी' };
    let chestPt = { x: width * 0.5, y: height * 0.72, label: 'छाती' };

    if (face && face.boundingBox) {
      const b = face.boundingBox;
      const fx = b.xCenter * width;
      const fy = b.yCenter * height;
      const fw = b.width * width;
      const fh = b.height * height;
      const topHead = fy - fh * 0.5;
      const chinY = fy + fh * 0.5;

      aboveHeadPt = { x: fx, y: topHead - fh * 0.25, label: 'खुला स्पेस' };
      foreheadPt = { x: fx, y: topHead + fh * 0.12, label: 'माथा' };
      chinPt = { x: fx, y: chinY, label: 'ठोड़ी' };
      chestPt = { x: fx, y: chinY + fh * 0.85, label: 'छाती' };

      // Soft face contour guideline
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(fx, fy, fw * 0.48, fh * 0.52, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    const anchors = [
      { id: 'above_head', ...aboveHeadPt, label: 'खुला स्पेस: अंक ०-९ (दायां)', defaultColor: 'rgba(56, 189, 248, 0.65)', activeColor: '#38bdf8', icon: '🔢' },
      { id: 'forehead', ...foreheadPt, label: 'माथा: प्रिंसिपल / दादाजी / बुखार', defaultColor: 'rgba(168, 85, 247, 0.65)', activeColor: '#a855f7', icon: '👤' },
      { id: 'chin', ...chinPt, label: 'ठोड़ी व मुंह: पानी / खाना / दादीजी', defaultColor: 'rgba(251, 191, 36, 0.65)', activeColor: '#fbbf24', icon: '🗣️' },
      { id: 'chest', ...chestPt, label: 'छाती: अटेंडेंस / हाँ / नहीं', defaultColor: 'rgba(16, 185, 129, 0.65)', activeColor: '#10b981', icon: '🫀' }
    ];

    anchors.forEach(a => {
      const isActive = activeLoc === a.id;
      ctx.save();

      // Outer Target Ring
      ctx.beginPath();
      ctx.arc(a.x, a.y, isActive ? 26 : 14, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? '#10b981' : a.defaultColor;
      ctx.lineWidth = isActive ? 3 : 1.5;
      if (!isActive) ctx.setLineDash([3, 3]);
      ctx.stroke();

      // Pulsing glow when active
      if (isActive) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 34, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.fill();
      }

      // Center Anchor Dot
      ctx.beginPath();
      ctx.arc(a.x, a.y, isActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#10b981' : a.activeColor;
      ctx.fill();

      // Floating Location Tag
      ctx.font = isActive ? 'bold 13px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = isActive ? '#10b981' : 'rgba(255, 255, 255, 0.65)';
      ctx.textAlign = 'left';
      ctx.fillText(`${a.icon} ${a.label}${isActive ? ' (सक्रिय ✓)' : ''}`, a.x + (isActive ? 32 : 18), a.y + 4);

      ctx.restore();
    });
  };

  // 4B. Dynamic Motion & Trajectory Vector Engine
  const updateMotionTrajectory = (wrist: { x: number; y: number; z: number }) => {
    const now = performance.now();
    const history = motionHistoryRef.current;
    history.push({ x: wrist.x, y: wrist.y, z: wrist.z || 0, time: now });

    // Keep history of last 24 frames (~0.8s window at 30fps)
    if (history.length > 24) {
      history.shift();
    }

    if (history.length < 5) {
      return latestMotionRef.current;
    }

    const oldest = history[0];
    const newest = history[history.length - 1];
    const dt = Math.max((newest.time - oldest.time) / 1000, 0.05);

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const dz = newest.z - oldest.z;

    const distance = Math.hypot(dx, dy);
    const speed = distance / dt;

    // Jitter Deadband: If hand movement is below genuine physical motion threshold, strictly classify as static!
    if (speed < 0.16 || distance < 0.035) {
      const motionInfo = {
        direction: 'none' as const,
        label: '⏸️ स्थिर (Static)',
        speed: Math.round(speed * 100) / 100,
        isMoving: false
      };
      latestMotionRef.current = motionInfo;
      setCurrentMotion(motionInfo);
      return motionInfo;
    }

    // Detect genuine horizontal wave oscillation (sign changes in velocity above noise floor)
    let waveChanges = 0;
    for (let i = 2; i < history.length; i++) {
      const v1 = history[i - 1].x - history[i - 2].x;
      const v2 = history[i].x - history[i - 1].x;
      if (Math.abs(v1) > 0.016 && Math.abs(v2) > 0.016 && (v1 * v2 < 0)) {
        waveChanges++;
      }
    }

    // Compare earliest points with latest points in window to calculate vertical displacement
    const earlyY = (history[0].y + (history[1]?.y || history[0].y)) / 2;
    const lateY = (history[history.length - 1].y + (history[history.length - 2]?.y || history[history.length - 1].y)) / 2;
    const verticalRise = earlyY - lateY; // Positive when hand moved UPWARD (screen Y=0 is top)

    const earlyX = (history[0].x + (history[1]?.x || history[0].x)) / 2;
    const lateX = (history[history.length - 1].x + (history[history.length - 2]?.x || history[history.length - 1].x)) / 2;
    const horizontalShift = lateX - earlyX;

    let direction: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left' = 'none';
    let label = '⏸️ स्थिर (Static)';
    let isMoving = false;

    if (waveChanges >= 2 && Math.abs(dx) > 0.07 && speed > 0.22) {
      direction = 'wave';
      label = '👋 वेव / लहराना (Wave)';
      isMoving = true;
      lastWaveMotionTimeRef.current = Date.now();
    } else if (verticalRise > 0.065 && speed > 0.20) { // Hand moved UP by at least 6.5% with real velocity
      direction = 'upward';
      label = '⬆️ ऊपर की ओर (Upward)';
      isMoving = true;
      lastUpwardMotionTimeRef.current = Date.now();
    } else if (verticalRise < -0.065 && speed > 0.20) { // Hand moved DOWN
      direction = 'downward';
      label = '⬇️ नीचे की ओर (Downward)';
      isMoving = true;
    } else if (Math.abs(horizontalShift) > 0.07 && speed > 0.20) {
      direction = horizontalShift > 0 ? 'to_right' : 'to_left';
      label = horizontalShift > 0 ? '➡️ दाईं ओर (Right)' : '⬅️ बाईं ओर (Left)';
      isMoving = true;
    } else if (dz < -0.05 && speed > 0.20) {
      direction = 'outward';
      label = '↗️ आगे की ओर (Outward)';
      isMoving = true;
    }

    const motionInfo = {
      direction,
      label,
      speed: Math.round(speed * 100) / 100,
      isMoving
    };

    latestMotionRef.current = motionInfo;
    setCurrentMotion(motionInfo);
    return motionInfo;
  };

  // Holographic Visual Motion Trail on Canvas
  const drawMotionTrajectory = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const history = motionHistoryRef.current;
    if (history.length < 3) return;

    ctx.save();
    for (let i = 1; i < history.length; i++) {
      const p1 = history[i - 1];
      const p2 = history[i];
      const progress = i / history.length;

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.strokeStyle = `rgba(56, 189, 248, ${progress * 0.85})`; // neon cyan-blue
      ctx.lineWidth = 2 + progress * 5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Glowing head at current wrist
    const head = history[history.length - 1];
    ctx.beginPath();
    ctx.arc(head.x * width, head.y * height, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  };

  // 5. Continuous Frame Processing Loop (Hands + Face Detection)
  const startProcessingLoop = () => {
    let frameCount = 0;
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        frameCount++;
        if (handsRef.current) {
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch (e) {
            // ignore dropped frames
          }
        }
        if (faceDetectionRef.current && frameCount % 2 === 0) {
          try {
            await faceDetectionRef.current.send({ image: videoRef.current });
          } catch (e) {
            // ignore dropped frames
          }
        }
      }
      if (videoRef.current && !videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // 6. High-Precision Geometric Helpers & Dual-Hand Classification Engine
  const dist3D = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y, ((p1.z || 0) - (p2.z || 0)) * 1.2);
  const dist2D = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  // 6b. Direction & Palm Facing (हथेली आगे/पीछे और उंगली/हाथ की दिशा)
  const computeHandDirection = (lm: any[]): { direction: 'up' | 'horizontal_head' | 'forward' | 'down'; label: string; icon: string } => {
    if (!lm || lm.length < 21) return { direction: 'up', label: 'ऊपर सीधी', icon: '⬆️' };
    const indexKnuckle = lm[5];
    const indexTip = lm[8];
    const dx = indexTip.x - indexKnuckle.x;
    const dy = indexTip.y - indexKnuckle.y;

    // Horizontal pointing (towards forehead/temple):
    if (Math.abs(dx) > Math.abs(dy) * 0.70 && Math.abs(dx) > 0.05) {
      return { direction: 'horizontal_head', label: 'माथा/कनपटी (क्षैतिज)', icon: '👈' };
    }
    // Vertical Upward into the air:
    if (dy < -0.06 && Math.abs(dy) >= Math.abs(dx) * 0.85) {
      return { direction: 'up', label: 'ऊपर सीधी', icon: '⬆️' };
    }
    // Downward:
    if (dy > 0.06) {
      return { direction: 'down', label: 'नीचे', icon: '⬇️' };
    }
    return { direction: 'forward', label: 'आगे / सामने', icon: '↗️' };
  };

  const computeHandFacing = (lm: any[], handedness: string = 'Right'): { facing: 'front' | 'back'; label: string; icon: string } => {
    if (!lm || lm.length < 21) return { facing: 'front', label: 'हथेली सामने (आगे का भाग)', icon: '🖐️' };
    const wrist = lm[0];
    const indexMcp = lm[5];
    const pinkyMcp = lm[17];

    const vUp = { x: lm[9].x - wrist.x, y: lm[9].y - wrist.y };
    const vAcross = { x: pinkyMcp.x - indexMcp.x, y: pinkyMcp.y - indexMcp.y };
    const crossZ = vUp.x * vAcross.y - vUp.y * vAcross.x;

    const isFront = (handedness === 'Left') ? (crossZ < 0) : (crossZ > 0);
    if (isFront) {
      return { facing: 'front', label: 'हथेली सामने (आगे का भाग)', icon: '🖐️' };
    } else {
      return { facing: 'back', label: 'उल्टा हाथ (पीछे का भाग)', icon: '🤚' };
    }
  };


  // Rock-solid 3D Joint-Ratio & Vector-Alignment Finger Extension Check
  // Completely eliminates 1-finger vs 2-finger confusion:
  const isFingerExtended = (lm: any[], mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number): boolean => {
    const mcp = lm[mcpIdx];
    const pip = lm[pipIdx];
    const tip = lm[tipIdx];
    const wrist = lm[0];

    const distTipMcp = dist3D(tip, mcp);
    const distPipMcp = dist3D(pip, mcp);
    const distTipWrist = dist3D(tip, wrist);
    const distPipWrist = dist3D(pip, wrist);

    // 1. Ratio of Tip distance vs PIP distance from MCP
    const extRatio = distTipMcp / Math.max(distPipMcp, 0.005);

    // 2. Vector alignment (Cosine of angle between (pip - mcp) and (tip - pip))
    const v1x = pip.x - mcp.x;
    const v1y = pip.y - mcp.y;
    const v1z = ((pip.z || 0) - (mcp.z || 0)) * 1.2;
    const v2x = tip.x - pip.x;
    const v2y = tip.y - pip.y;
    const v2z = ((tip.z || 0) - (pip.z || 0)) * 1.2;

    const len1 = Math.hypot(v1x, v1y, v1z);
    const len2 = Math.hypot(v2x, v2y, v2z);
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;
    const cosAngle = (len1 > 0.001 && len2 > 0.001) ? dot / (len1 * len2) : 0;

    // 3. Tip further from wrist than PIP
    const wristRatio = distTipWrist / Math.max(distPipWrist, 0.005);

    // Extended finger requires: extRatio > 1.28 AND straight alignment (cosAngle > 0.20) AND wristRatio > 1.05
    return extRatio > 1.28 && cosAngle > 0.20 && wristRatio > 1.05;
  };

  const analyzeThumb = (lm: any[], palmSize: number) => {
    const wrist = lm[0];
    const thumbMcp = lm[2];
    const thumbTip = lm[4];
    const indexMcp = lm[5];
    const middleMcp = lm[9];

    const distTipWrist = dist2D(thumbTip, wrist);
    const distMcpWrist = dist2D(thumbMcp, wrist);
    const distTipMiddleMcp = dist2D(thumbTip, middleMcp);
    const distTipIndexMcp = dist2D(thumbTip, indexMcp);

    // Truly extended thumb is spread laterally away from middle MCP and index MCP:
    // (Prevents curled thumb on index-up gesture from falsely triggering thumb=true)
    const isOpen = (distTipMiddleMcp > palmSize * 0.65) && (distTipIndexMcp > palmSize * 0.48);
    const pointsUp = thumbTip.y < thumbMcp.y && (wrist.y - thumbTip.y) > palmSize * 0.25 && distTipMiddleMcp > palmSize * 0.48;
    const pointsDown = thumbTip.y > wrist.y && thumbTip.y > thumbMcp.y;

    return { isOpen, pointsUp, pointsDown, distTipMiddleMcp };
  };

  const extractFingerSignature = (lm: any[]): FingerSignature => {
    const wrist = lm[0];
    const middleMcp = lm[9];
    const palmSize = Math.max(dist2D(wrist, middleMcp), 0.05);

    const isIndexOpen = isFingerExtended(lm, 5, 6, 7, 8);
    const isMiddleOpen = isFingerExtended(lm, 9, 10, 11, 12);
    const isRingOpen = isFingerExtended(lm, 13, 14, 15, 16);
    const isPinkyOpen = isFingerExtended(lm, 17, 18, 19, 20);
    const thumb = analyzeThumb(lm, palmSize);
    const isIndexThumbPinch = dist3D(lm[4], lm[8]) < palmSize * 0.40;

    return {
      thumb: thumb.isOpen,
      index: isIndexOpen,
      middle: isMiddleOpen,
      ring: isRingOpen,
      pinky: isPinkyOpen,
      thumbPointsUp: thumb.pointsUp,
      isPinch: isIndexThumbPinch
    };
  };

  const matchFingerSignature = (expected?: FingerSignature, actual?: FingerSignature): boolean => {
    if (!expected || !actual) return false;
    const fourMatch = 
      Boolean(expected.index) === Boolean(actual.index) &&
      Boolean(expected.middle) === Boolean(actual.middle) &&
      Boolean(expected.ring) === Boolean(actual.ring) &&
      Boolean(expected.pinky) === Boolean(actual.pinky);
    if (!fourMatch) return false;

    // Strict Thumb verification:
    if (typeof expected.thumb === 'boolean') {
      const expThumb = Boolean(expected.thumb);
      const actThumb = Boolean(actual.thumb || actual.thumbPointsUp);
      if (expThumb !== actThumb) {
        return false;
      }
    }

    if (expected.isPinch && !actual.isPinch) return false;
    if (expected.thumbPointsUp && !actual.thumbPointsUp) return false;
    return true;
  };

  // Two-Hand Spatial Interaction & Topological Relation Engine
  const computeTwoHandRelation = (
    lm1: any[],
    lm2: any[],
    sig1: FingerSignature,
    sig2: FingerSignature
  ): { relation: TwoHandRelation; distance: number; label: string } => {
    const wrist1 = lm1[0];
    const wrist2 = lm2[0];
    const indexTip1 = lm1[8];
    const indexTip2 = lm2[8];
    const thumbTip1 = lm1[4];
    const thumbTip2 = lm2[4];
    const middleMcp1 = lm1[9];
    const middleMcp2 = lm2[9];

    const palmSize1 = Math.max(dist2D(wrist1, middleMcp1), 0.05);
    const palmSize2 = Math.max(dist2D(wrist2, middleMcp2), 0.05);
    const avgPalm = (palmSize1 + palmSize2) / 2;

    const distWrists = dist2D(wrist1, wrist2);
    const distIndexTips = dist2D(indexTip1, indexTip2);
    const distThumbTips = dist2D(thumbTip1, thumbTip2);

    // 1. Namaste (दोनों हथेलियां जुड़ी हुई)
    const allFourOpen1 = sig1.index && sig1.middle && sig1.ring && sig1.pinky;
    const allFourOpen2 = sig2.index && sig2.middle && sig2.ring && sig2.pinky;
    if (allFourOpen1 && allFourOpen2 && distWrists < avgPalm * 1.5 && distIndexTips < avgPalm * 0.65) {
      return { relation: 'touching_tips', distance: distIndexTips, label: '🙏 नमस्ते (दोनों हथेलियां जुड़ी)' };
    }

    // 2. Touching Index Tips (Letter A - Roof / Triangle 🔺)
    // Only index fingers open, wrists spread wide forming a tent (/)
    if (sig1.index && sig2.index && !sig1.middle && !sig2.middle && !sig1.ring && !sig2.ring && distIndexTips < avgPalm * 0.50 && distWrists > avgPalm * 0.60) {
      return { relation: 'touching_tips', distance: distIndexTips, label: '🔺 छत/त्रिकोण (A Shape - सिरें सटी)' };
    }

    // 3. Touching Circles / Binoculars (Letter B 👓)
    // BOTH hands MUST have pinch circles (thumb + index touching)
    if (sig1.isPinch && sig2.isPinch && (distIndexTips < avgPalm * 0.85 || distThumbTips < avgPalm * 0.85)) {
      return { relation: 'touching_circles', distance: Math.min(distIndexTips, distThumbTips), label: '👓 चश्मा / २ गोले (B Shape)' };
    }

    // 4. Crossed Fingers (Letter F / X ✚)
    // NEITHER hand is in a pinch circle! Both index fingers extended
    const distTip1Pip2 = dist2D(indexTip1, lm2[6]);
    const distTip2Pip1 = dist2D(indexTip2, lm1[6]);
    if (!sig1.isPinch && !sig2.isPinch && sig1.index && sig2.index && 
        (distTip1Pip2 < avgPalm * 0.45 || distTip2Pip1 < avgPalm * 0.45 || 
         (distIndexTips < avgPalm * 0.40 && Math.abs(lm1[8].x - lm2[8].x) < avgPalm * 0.35 && Math.abs(lm1[8].y - lm2[8].y) < avgPalm * 0.35))) {
      return { relation: 'crossed', distance: Math.min(distTip1Pip2, distTip2Pip1), label: '✚ क्रॉस उंगलियां (F / X Shape)' };
    }

    // 5. Stacked Fists (Letter G ✊ on ✊)
    const allClosed1 = !sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky;
    const allClosed2 = !sig2.index && !sig2.middle && !sig2.ring && !sig2.pinky;
    const horizontalDist = Math.abs(wrist1.x - wrist2.x);
    const verticalDist = Math.abs(wrist1.y - wrist2.y);
    if (allClosed1 && allClosed2 && horizontalDist < avgPalm * 0.85 && verticalDist > avgPalm * 0.35 && distWrists < avgPalm * 2.2) {
      return { relation: 'stacked_fists', distance: distWrists, label: '✊ मुट्ठी के ऊपर मुट्ठी (G Shape)' };
    }

    // 6. Fists touching side-by-side (Letter S 🤛🤜)
    if (allClosed1 && allClosed2 && distWrists < avgPalm * 1.5 && verticalDist < avgPalm * 0.5) {
      return { relation: 'fists_touching', distance: distWrists, label: '🤛🤜 मुट्ठियां सटी (S Shape)' };
    }

    // 7. Stem and Loop (Letter D 🔤)
    // One hand index vertical stem, other hand loop/pinch touching it
    const isHand1Stem = sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky;
    const isHand2Stem = sig2.index && !sig2.middle && !sig2.ring && !sig2.pinky;
    const distTips1ToPalm2 = dist2D(indexTip1, lm2[9]);
    const distTips2ToPalm1 = dist2D(indexTip2, lm1[9]);
    if ((isHand1Stem && (sig2.isPinch || sig2.thumb)) || (isHand2Stem && (sig1.isPinch || sig1.thumb))) {
      if (distIndexTips < avgPalm * 0.75 || distTips1ToPalm2 < avgPalm * 0.75 || distTips2ToPalm1 < avgPalm * 0.75) {
        return { relation: 'stem_and_loop', distance: distIndexTips, label: '🔤 तना और लूप (D / P / K Shape)' };
      }
    }

    // 8. T-Touch (Letter T ⊤)
    // NEITHER hand is in a pinch circle
    if (!sig1.isPinch && !sig2.isPinch && sig1.index && sig2.index && distIndexTips < avgPalm * 0.65) {
      return { relation: 't_touch', distance: distIndexTips, label: '⊤ टी-स्पर्श (T Shape)' };
    }

    // 9. Resting on palm (Letter M, N, E, H ✋)
    if (distTips1ToPalm2 < avgPalm * 0.60 || distTips2ToPalm1 < avgPalm * 0.60) {
      return { relation: 'resting_on_palm', distance: Math.min(distTips1ToPalm2, distTips2ToPalm1), label: '✋ हथेली पर उंगलियां (M / N / E / H Shape)' };
    }

    return { relation: 'apart', distance: distWrists, label: '👐 दोनों हाथ अलग-अलग' };
  };

  // Main Draw Skeleton & Dual-Hand / Single-Hand Classification
  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    const face = latestFaceRef.current;
    let currentBodyLoc: { location: BodyLocation; label: string; icon: string } = {
      location: 'neutral',
      label: 'खुला स्पेस (Neutral)',
      icon: '✋'
    };

    let numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
    const lm1 = numHands > 0 ? results.multiHandLandmarks[0] : null;
    let lm2 = numHands > 1 ? results.multiHandLandmarks[1] : null;

    // Eliminate ghost duplicate detections of the same single hand:
    if (lm1 && lm2) {
      const wrist1 = lm1[0];
      const wrist2 = lm2[0];
      const middleMcp1 = lm1[9];
      const middleMcp2 = lm2[9];
      const palmSize1 = Math.max(dist2D(wrist1, middleMcp1), 0.05);
      const palmSize2 = Math.max(dist2D(wrist2, middleMcp2), 0.05);
      const avgPalm = (palmSize1 + palmSize2) / 2;

      const isDuplicateSameHand = dist2D(wrist1, wrist2) < avgPalm * 0.45 && dist2D(middleMcp1, middleMcp2) < avgPalm * 0.45;
      const isSpuriousSmall = palmSize2 < avgPalm * 0.30;

      if (isDuplicateSameHand || isSpuriousSmall) {
        lm2 = null;
        numHands = 1;
      }
    }

    if (numHands > 0) {
      lastHandSeenTimeRef.current = Date.now();
      currentBodyLoc = computeBodyLocation(results.multiHandLandmarks[0], face);
      latestBodyLocationRef.current = currentBodyLoc;
      setDetectedLocation(currentBodyLoc.location);
      setDetectedLocationLabel(`${currentBodyLoc.icon} ${currentBodyLoc.label}`);
      updateMotionTrajectory(results.multiHandLandmarks[0][0]);
      
      const handedness = (results.multiHandedness && results.multiHandedness[0]) ? results.multiHandedness[0].label : 'Right';
      const curDir = computeHandDirection(results.multiHandLandmarks[0]);
      const curFace = computeHandFacing(results.multiHandLandmarks[0], handedness);
      setLiveHandDirection(curDir);
      setLivePalmFacing(curFace);
    } else {
      setDetectedLocation('neutral');
      setDetectedLocationLabel('✋ हाथ नहीं दिख रहा');
      latestMotionRef.current = { direction: 'none', label: '⏸️ स्थिर (Static)', speed: 0, isMoving: false };
      setCurrentMotion(latestMotionRef.current);
      motionHistoryRef.current = [];

      if (Date.now() - lastHandSeenTimeRef.current > 650) {
        setCurrentSign('');
        setLiveGestureName('');
        lastSpokenSignRef.current = '';
        recentDetectionsRef.current = [];
      }
    }

    drawBodyAnchors(ctx, canvas.width, canvas.height, face, currentBodyLoc.location);
    drawMotionTrajectory(ctx, canvas.width, canvas.height);

    if (numHands > 0) {
      setHandsDetectedCount(numHands);

      const lm1 = results.multiHandLandmarks[0];
      const lm2 = numHands > 1 ? results.multiHandLandmarks[1] : null;

      latestRawLandmarksRef.current = lm1;
      lastStableLandmarksRef.current = lm1;
      lastStableTimeRef.current = Date.now();

      // Hand 1: Neon Emerald Skeleton (#10b981) + Cyan Landmarks (#38bdf8)
      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, lm1, window.HAND_CONNECTIONS, {
          color: '#10b981',
          lineWidth: 4
        });
      }
      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, lm1, {
          color: '#38bdf8',
          lineWidth: 2,
          radius: 5
        });
      }

      // Hand 2: Electric Violet Skeleton (#a855f7) + Pink Landmarks (#f472b6)
      if (lm2) {
        latestSecondRawLandmarksRef.current = lm2;
        lastStableSecondLandmarksRef.current = lm2;

        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(ctx, lm2, window.HAND_CONNECTIONS, {
            color: '#a855f7',
            lineWidth: 4
          });
        }
        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, lm2, {
            color: '#f472b6',
            lineWidth: 2,
            radius: 5
          });
        }

        // Draw interaction dashed line connecting index tips
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lm1[8].x * canvas.width, lm1[8].y * canvas.height);
        ctx.lineTo(lm2[8].x * canvas.width, lm2[8].y * canvas.height);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        const midX = ((lm1[8].x + lm2[8].x) / 2) * canvas.width;
        const midY = ((lm1[8].y + lm2[8].y) / 2) * canvas.height;
        ctx.beginPath();
        ctx.arc(midX, midY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        ctx.restore();
      } else {
        latestSecondRawLandmarksRef.current = null;
        latestSecondFingerSignatureRef.current = null;
      }

      // Determine Handedness for both hands (Right vs Left Hand)
      let hType1: 'right' | 'left' = 'right';
      let hType2: 'right' | 'left' | null = null;
      if (results.multiHandedness && results.multiHandedness.length > 0) {
        const raw1 = results.multiHandedness[0]?.label || 'Right';
        hType1 = raw1.toLowerCase() === 'left' ? 'left' : 'right';
        if (results.multiHandedness.length > 1) {
          const raw2 = results.multiHandedness[1]?.label || 'Left';
          hType2 = raw2.toLowerCase() === 'left' ? 'left' : 'right';
        }
      }
      latestHandTypeRef.current = numHands === 2 ? 'both' : hType1;
      setLiveHandType(numHands === 2 ? 'both' : hType1);
      setLiveHandTypeLabel(numHands === 2 ? 'दोनों हाथ (Both Hands)' : (hType1 === 'right' ? 'दायां हाथ (Right Hand)' : 'बायां हाथ (Left Hand)'));

      // Execute Classifier
      classifyMultiHands(lm1, lm2, ctx, canvas.width, canvas.height, hType1, hType2);
    } else {
      latestRawLandmarksRef.current = null;
      latestSecondRawLandmarksRef.current = null;
      setHandsDetectedCount(0);
      setLiveHandType('none');
      setLiveHandTypeLabel('कोई नहीं');
      setFingerStates('हाथ नहीं दिख रहा...');
      setTwoHandRelationLabel('कोई नहीं (None)');
      recentDetectionsRef.current = [];
      lastSpokenSignRef.current = '';
    }
    ctx.restore();
  };

  // Upgraded Dual-Hand vs Single-Hand Classifier
  const classifyMultiHands = (
    lm1: any[],
    lm2: any[] | null,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    handedness1: 'right' | 'left' = 'right',
    handedness2: 'right' | 'left' | null = null
  ) => {
    const isDualHand = Boolean(lm2);
    const sig1 = extractFingerSignature(lm1);
    latestFingerSignatureRef.current = sig1;
    lastStableSignatureRef.current = sig1;

    let sig2: FingerSignature | null = null;
    let twoHand: { relation: TwoHandRelation; distance: number; label: string } = {
      relation: 'none',
      distance: 0,
      label: 'कोई नहीं'
    };

    if (lm2) {
      sig2 = extractFingerSignature(lm2);
      latestSecondFingerSignatureRef.current = sig2;
      lastStableSecondSignatureRef.current = sig2;
      twoHand = computeTwoHandRelation(lm1, lm2, sig1, sig2);
      latestTwoHandRelationRef.current = twoHand;
      setTwoHandRelationLabel(twoHand.label);
    } else {
      setTwoHandRelationLabel('कोई नहीं (Single Hand)');
    }

    // Describe Finger States (with explicit Left / Right hand naming)
    const hand1NameHindi = handedness1 === 'right' ? 'दायां हाथ (Right)' : 'बायां हाथ (Left)';
    const descHand1 = `[${hand1NameHindi}]: तर्जनी: ${sig1.index ? 'खुली' : 'मुड़ी'} | मध्यमा: ${sig1.middle ? 'खुली' : 'मुड़ी'} | अनामिका: ${sig1.ring ? 'खुली' : 'मुड़ी'} | कनिष्ठिका: ${sig1.pinky ? 'खुली' : 'मुड़ी'}`;
    if (isDualHand && sig2) {
      const hand2NameHindi = handedness2 === 'left' ? 'बायां हाथ (Left)' : 'दायां हाथ (Right)';
      setFingerStates(`${descHand1} || [${hand2NameHindi}]: तर्जनी: ${sig2.index ? 'खुली' : 'मुड़ी'} मध्यमा: ${sig2.middle ? 'खुली' : 'मुड़ी'}`);
    } else {
      setFingerStates(descHand1);
    }

    // Set Live Gesture Summary
    let gestureSummary = '';
    if (isDualHand) {
      gestureSummary = `👐 २-हाथ (${twoHand.label})`;
    } else {
      if (sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky) {
        gestureSummary = '☝️ १ उंगली (तर्जनी)';
      } else if (sig1.index && sig1.middle && !sig1.ring && !sig1.pinky) {
        gestureSummary = '✌️ २ उंगलियां (तर्जनी + मध्यमा)';
      } else if (sig1.index && sig1.middle && sig1.ring && !sig1.pinky) {
        gestureSummary = '३ उंगलियां (W आकार)';
      } else if (sig1.index && sig1.middle && sig1.ring && sig1.pinky) {
        gestureSummary = '✋ खुला हाथ (नमस्ते)';
      } else if (!sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && (sig1.thumb || sig1.thumbPointsUp)) {
        gestureSummary = '👍 अंगूठा ऊपर (हाँ)';
      } else if (!sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky) {
        gestureSummary = '✊ मुट्ठी';
      } else {
        const count = (sig1.index ? 1 : 0) + (sig1.middle ? 1 : 0) + (sig1.ring ? 1 : 0) + (sig1.pinky ? 1 : 0);
        gestureSummary = `${count} उंगलियां खुली`;
      }
    }
    setLiveGestureName(gestureSummary);

    // CRITICAL: If no signs exist in active dictionary, DO NOT DETECT ANYTHING!
    if (activeSignNamesRef.current.size === 0 && activeSignIdsRef.current.size === 0) {
      return;
    }

    let detected = '';
    let conf = 0.95;
    const activeSignsToMatch = allSignsRef.current.length > 0 ? allSignsRef.current : allSigns;

    // ==========================================
    // CASE A: DUAL HANDS ACTIVE (२ हाथ डिटेक्टेड)
    // ==========================================
    const hDir1 = computeHandDirection(lm1);
    const pFace1 = computeHandFacing(lm1);
    const hDir2 = lm2 ? computeHandDirection(lm2) : null;
    const pFace2 = lm2 ? computeHandFacing(lm2) : null;

    if (isDualHand && sig2 && lm2) {
      const wrist1 = lm1[0];
      const wrist2 = lm2[0];
      const indexTip1 = lm1[8];
      const indexTip2 = lm2[8];
      const avgPalm = (Math.max(dist2D(wrist1, lm1[9]), 0.05) + Math.max(dist2D(wrist2, lm2[9]), 0.05)) / 2;
      const distWrists = dist2D(wrist1, wrist2);
      const distIndexTips = dist2D(indexTip1, indexTip2);

      // 1. Doctor (डॉक्टर): Checking pulse on wrist (Hand 1 fingers on Hand 2 wrist, or vice versa)
      const distTip1ToWrist2 = dist2D(lm1[8], lm2[0]);
      const distTip2ToWrist1 = dist2D(lm2[8], lm1[0]);
      const distTip1ToPalm2 = dist2D(lm1[8], lm2[9]);
      const distTip2ToPalm1 = dist2D(lm2[8], lm1[9]);
      const isDoctorPulse = (
        (distTip1ToWrist2 < avgPalm * 1.35 && (sig1.index || sig1.middle)) ||
        (distTip2ToWrist1 < avgPalm * 1.35 && (sig2.index || sig2.middle)) ||
        (distTip1ToPalm2 < avgPalm * 1.05 && (sig1.index || sig1.middle)) ||
        (distTip2ToPalm1 < avgPalm * 1.05 && (sig2.index || sig2.middle)) ||
        twoHand.relation === 'resting_on_palm'
      );

      // 2. Namaste (नमस्ते): Folded hands facing upward at chest
      const isNamasteFolded = (
        twoHand.label.includes('नमस्ते') ||
        (
          distWrists < avgPalm * 2.8 &&
          distIndexTips < avgPalm * 2.0 &&
          (lm1[8].y < lm1[0].y) && (lm2[8].y < lm2[0].y) &&
          (sig1.index || sig1.middle) && (sig2.index || sig2.middle)
        )
      );

      // 3. Library (लाइब्रेरी): Open book hands (हथेलियां खुली किताब की तरह सटी/सामने)
      const isLibraryBook = (
        (twoHand.relation === 'touching_tips' || distWrists < avgPalm * 1.8) &&
        sig1.index && sig1.middle && sig2.index && sig2.middle &&
        !isNamasteFolded && !isDoctorPulse
      );

      // 4. File (फाइल): Both hands parallel vertical flat open palms facing each other (समानांतर फाइल पकड़ना)
      const isFileParallel = (
        sig1.index && sig1.middle && sig2.index && sig2.middle &&
        distWrists >= avgPalm * 1.8 && distWrists < avgPalm * 4.2 &&
        Math.abs(wrist1.y - wrist2.y) < avgPalm * 0.95 &&
        !isNamasteFolded && !isDoctorPulse
      );

      if (isDoctorPulse && isSignActive('sign-doctor', 'डॉक्टर')) {
        detected = 'डॉक्टर';
      } else if (isNamasteFolded && isSignActive('sign-namaste', 'नमस्ते')) {
        detected = 'नमस्ते';
      } else if (isLibraryBook && isSignActive('sign-library', 'लाइब्रेरी (कॉलेज)')) {
        detected = 'लाइब्रेरी (कॉलेज)';
      } else if (isFileParallel && isSignActive('sign-file', 'फाइल (दस्तावेज़)')) {
        detected = 'फाइल (दस्तावेज़)';
      }

      // Check custom 2-handed user signs if still not detected
      if (!detected) {
        for (const sign of activeSignsToMatch) {
          if (!sign.id.startsWith('sign-custom-')) continue;
          if (!isSignActive(sign.id, sign.nameHindi)) continue;
          if (sign.handsCount !== 2) continue;
          if (sign.twoHandRelation && sign.twoHandRelation === twoHand.relation) {
            detected = sign.nameHindi;
            break;
          }
        }
      }
    } 
    // ==========================================
    // CASE B: SINGLE HAND ACTIVE (१ हाथ डिटेक्टेड)
    // ==========================================
    else {
      const motion = latestMotionRef.current;
      const currentLoc = latestBodyLocationRef.current.location;
      const wrist = lm1[0];
      const palmSize = Math.max(dist2D(wrist, lm1[9]), 0.05);

      const distThumbIndex = dist2D(lm1[4], lm1[8]);
      const distThumbMiddle = dist2D(lm1[4], lm1[9]);

      // Check Zero (०) / Pinch circle: Thumb + Index tip touching forming circle
      const isZeroGesture = (sig1.isPinch || distThumbIndex < palmSize * 0.40) && !sig1.middle && !sig1.ring;

      // SOS / Help / Shaka: Thumb + Pinky open, middle 3 curled
      const isSosGesture = (sig1.thumb || sig1.thumbPointsUp) && sig1.pinky && !sig1.index && !sig1.middle && !sig1.ring;

      // Thumbs Up (६ / हाँ): Thumb pointing up or open, all 4 fingers closed
      const isThumbsUpGesture = (sig1.thumbPointsUp || sig1.thumb) && !sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky;

      // Thumbs Down (नहीं): Thumb down, all 4 fingers closed
      const isThumbsDownGesture = sig1.thumb && !sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && lm1[4].y > lm1[0].y;

      // Precise Thumb extension check for ISL digits 7, 8, 9 (requires thumb extended away from palm)
      const isThumbExtendedForSeven = sig1.thumb && (sig1.thumbPointsUp || distThumbMiddle > palmSize * 0.62);

      // ==============================================================
      // 1. ZONE: ABOVE_HEAD (माथे से ऊपर खुला स्पेस -> अंक ०-९ दायां हाथ)
      // "main chahti hu ki forehead se upr open space me digit detect ho right hand ke"
      // ==============================================================
      if (currentLoc === 'above_head') {
        // Digits strictly for RIGHT HAND in the open space above head!
        if (handedness1 === 'right') {
          // 0: Zero (०) / OK loop
          if (isZeroGesture && isSignActive('sign-num-0', '० (0)')) {
            detected = '० (0)';
          }
          // 6: Thumbs Up (👍) with fist
          else if (isThumbsUpGesture && isSignActive('sign-num-6', '६ (6)')) {
            detected = '६ (6)';
          }
          // 7: Gun or L-shape (Thumb extended + Index extended, Middle, Ring, Pinky curled)
          else if (isThumbExtendedForSeven && sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && isSignActive('sign-num-7', '७ (7)')) {
            detected = '७ (7)';
          }
          // 8: Thumb extended + Index + Middle extended (Ring, Pinky curled)
          else if (isThumbExtendedForSeven && sig1.index && sig1.middle && !sig1.ring && !sig1.pinky && isSignActive('sign-num-8', '८ (8)')) {
            detected = '८ (8)';
          }
          // 9: Thumb extended + Index + Middle + Ring extended (Pinky curled)
          else if (isThumbExtendedForSeven && sig1.index && sig1.middle && sig1.ring && !sig1.pinky && isSignActive('sign-num-9', '९ (9)')) {
            detected = '९ (9)';
          }
          // 5: All 5 fingers open
          else if (sig1.index && sig1.middle && sig1.ring && sig1.pinky && (sig1.thumb || sig1.thumbPointsUp) && isSignActive('sign-num-5', '५ (5)')) {
            detected = '५ (5)';
          }
          // 4: 4 fingers open, thumb tucked/curled
          else if (sig1.index && sig1.middle && sig1.ring && sig1.pinky && !sig1.thumb && !sig1.thumbPointsUp && isSignActive('sign-num-4', '४ (4)')) {
            detected = '४ (4)';
          }
          // 3: 3 fingers open (Index + Middle + Ring), thumb curled, pinky curled
          else if (sig1.index && sig1.middle && sig1.ring && !sig1.pinky && !sig1.thumb && isSignActive('sign-num-3', '३ (3)')) {
            detected = '३ (3)';
          }
          // 2: 2 fingers open (Index + Middle), thumb curled, ring & pinky curled
          else if (sig1.index && sig1.middle && !sig1.ring && !sig1.pinky && !sig1.thumb && isSignActive('sign-num-2', '२ (2)')) {
            detected = '२ (2)';
          }
          // 1: Only Index extended, thumb tucked/curled (NOT 7)
          else if (sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && !sig1.thumb && !isThumbExtendedForSeven && isSignActive('sign-num-1', '१ (1)')) {
            detected = '१ (1)';
          }
        }
      }

      // ==============================================================
      // 2. ZONE: FOREHEAD ZONE (माथा -> प्रिंसिपल, दादाजी, बुखार)
      // "forhead pr rakha huya right hand उंगली माथे के आर-पार आड़ी = प्रिंसिपल"
      // "forhead pr rakha huya left hand उंगली माथे के आर-पार आड़ी = dadaji"
      // "forhead pr rakha huya left hand 4 finger उंगली माथे के आर-पार आड़ी = fever"
      // ==============================================================
      else if (currentLoc === 'forehead') {
        const isHorizontalAcrossForehead = (Math.abs(lm1[8].x - lm1[5].x) > 0.028 && Math.abs(lm1[8].x - lm1[5].x) > Math.abs(lm1[8].y - lm1[5].y) * 0.45) || hDir1.direction === 'horizontal_head';

        // Fever (बुखार): Left hand 4 fingers flat horizontal across forehead
        if (handedness1 === 'left' && sig1.index && sig1.middle && sig1.ring && sig1.pinky && isHorizontalAcrossForehead && (isSignActive('sign-fever', 'बुखार (Fever)') || isSignActive('sign-fever', 'बुखार'))) {
          detected = 'बुखार (Fever)';
        }
        // Dadaji (दादाजी): Left hand 1 index finger horizontal across forehead
        else if (handedness1 === 'left' && sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && isHorizontalAcrossForehead && (isSignActive('sign-dadaji', 'दादाजी (Dadaji)') || isSignActive('sign-dadaji', 'दादाजी'))) {
          detected = 'दादाजी (Dadaji)';
        }
        // Principal (प्रिंसिपल): Right hand 1 index finger horizontal across forehead
        else if (handedness1 === 'right' && sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && isHorizontalAcrossForehead && (isSignActive('sign-principal', 'प्रिंसिपल (Principal)') || isSignActive('sign-principal', 'प्रिंसिपल'))) {
          detected = 'प्रिंसिपल (Principal)';
        }
        // Fallback: Check custom user-trained forehead signs
        else {
          for (const sign of activeSignsToMatch) {
            if (!sign.id.startsWith('sign-custom-')) continue;
            if (!isSignActive(sign.id, sign.nameHindi)) continue;
            if (sign.handsCount === 2) continue;
            if (sign.handType && sign.handType !== 'any' && sign.handType !== handedness1) continue;
            if (sign.bodyLocation !== 'forehead') continue;
            if (sign.fingerSignature && matchFingerSignature(sign.fingerSignature, sig1)) {
              detected = sign.nameHindi;
              break;
            }
          }
        }
      }

      // ==============================================================
      // 3. ZONE: CHIN / MOUTH ZONE (ठोड़ी व मुंह -> दादीजी, पानी, खाना)
      // "chin par left hand आड़ी/लेटी हुई = dadiji"
      // "मुंह के पास 'W' शेप (३ उंगलियां) = पानी"
      // "मुंह के पास उंगलियों का गुच्छा/चुटकी (खाने की मुद्रा) = खाना"
      // ==============================================================
      else if (currentLoc === 'chin') {
        const isHorizontalAcrossChin = (Math.abs(lm1[8].x - lm1[5].x) > 0.028 && Math.abs(lm1[8].x - lm1[5].x) > Math.abs(lm1[8].y - lm1[5].y) * 0.45) || hDir1.direction === 'horizontal_head';

        // Dadiji (दादीजी): Left hand horizontal across chin
        if (handedness1 === 'left' && isHorizontalAcrossChin && (isSignActive('sign-dadiji', 'दादीजी (Dadiji)') || isSignActive('sign-dadiji', 'दादीजी'))) {
          detected = 'दादीजी (Dadiji)';
        }
        // Water (पानी): 3 fingers open (Index + Middle + Ring in W-shape), Pinky curled, Thumb folded
        else if (sig1.index && sig1.middle && sig1.ring && !sig1.pinky && !sig1.thumb && !isZeroGesture && isSignActive('sign-paani', 'पानी')) {
          detected = 'पानी';
        }
        // Food (खाना): Fingers bunched together / pinch towards mouth (eating pose)
        // NOT open peace sign, NOT 1 finger, NOT open hand!
        else if (
          (isZeroGesture || (dist2D(lm1[4], lm1[8]) < palmSize * 0.45 && dist2D(lm1[8], lm1[12]) < palmSize * 0.45)) &&
          !(sig1.index && sig1.middle && !sig1.ring) &&
          !(sig1.index && !sig1.middle && !sig1.ring) &&
          isSignActive('sign-khana', 'खाना')
        ) {
          detected = 'खाना';
        }
      }

      // ==============================================================
      // 4. ZONE: CHEEK / EAR ZONE (गाल व कान -> कॉलिंग/फोन)
      // ==============================================================
      else if (currentLoc === 'cheek') {
        if ((isSosGesture || (sig1.thumb && sig1.pinky)) && (isSignActive('sign-calling', 'कॉलिंग (फोन)') || isSignActive('sign-calling', 'कॉलिंग'))) {
          detected = 'कॉलिंग (फोन)';
        }
      }

      // ==============================================================
      // 5. ZONE: CHEST ZONE (छाती -> अटेंडेंस, हाँ, नहीं, मदद)
      // "छाती के पास १ तर्जनी उंगली सीधी ऊपर = अटेंडेंस"
      // "हाँ (Yes) = अंगूठा ऊपर छाती के सामने"
      // "नहीं (No) = अंगूठा नीचे छाती के सामने"
      // ==============================================================
      else {
        // Attendance (अटेंडेंस): 1 index pointing up at chest
        if (sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && !sig1.thumb && hDir1.direction === 'up' && isSignActive('sign-attendance', 'अटेंडेंस')) {
          detected = 'अटेंडेंस';
        }
        // Yes (हाँ): Thumbs up at chest
        else if (isThumbsUpGesture && (sig1.thumbPointsUp || lm1[4].y < lm1[2].y) && isSignActive('sign-haan', 'हाँ')) {
          detected = 'हाँ';
        }
        // No (नहीं): Thumbs down at chest
        else if ((isThumbsDownGesture || (sig1.thumb && !sig1.index && !sig1.middle && !sig1.ring && !sig1.pinky && lm1[4].y > lm1[0].y)) && isSignActive('sign-nahi', 'नहीं')) {
          detected = 'नहीं';
        }
        // SOS / Help (मदद चाहिए): Shaka at chest
        else if (isSosGesture && (isSignActive('sign-madad', 'मदद चाहिए (SOS)') || isSignActive('sign-madad', 'मदद'))) {
          detected = 'मदद चाहिए (SOS)';
        }
        // Open Palm / Good Morning / Bye / Thank You (NO NAMASTE HERE - Namaste is only 2-hands)
        else if (sig1.index && sig1.middle && sig1.ring) {
          if (motion.direction === 'upward' && motion.isMoving && isSignActive('sign-good-morning', 'शुभ प्रभात (Good Morning)')) {
            detected = 'शुभ प्रभात (Good Morning)';
          } else if (motion.direction === 'wave' && motion.isMoving && (isSignActive('sign-alvida', 'अलविदा (Bye)') || isSignActive('sign-alvida', 'अलvida (Bye)'))) {
            detected = 'अलविदा (Bye)';
          } else if (isSignActive('sign-dhanyavaad', 'धन्यवाद')) {
            detected = 'धन्यवाद';
          }
        }
        // Check custom user signs at chest
        else {
          for (const sign of activeSignsToMatch) {
            if (!sign.id.startsWith('sign-custom-')) continue;
            if (!isSignActive(sign.id, sign.nameHindi)) continue;
            if (sign.handsCount === 2) continue;
            if (sign.handType && sign.handType !== 'any' && sign.handType !== handedness1) continue;
            if (sign.category === 'number') continue;
            if (sign.bodyLocation === 'forehead' || sign.bodyLocation === 'above_head') continue;

            if (sign.fingerSignature && matchFingerSignature(sign.fingerSignature, sig1)) {
              detected = sign.nameHindi;
              break;
            }
          }
        }
      }
    }

    if (detected) {
      // Draw detection badge directly on canvas
      const badgePrefix = isDualHand 
        ? '👐 [२-हाथ]' 
        : (handedness1 === 'right' ? '✋ [दायां हाथ]' : '🤚 [बायां हाथ]');
      const fullBadge = `${badgePrefix} ${detected}`;

            // Sleek informative top-left indicator on canvas (with Direction & Palm Facing)
      ctx.fillStyle = isDualHand ? 'rgba(168, 85, 247, 0.92)' : 'rgba(16, 185, 129, 0.92)';
      const hudText = `✓ ${fullBadge} | ${hDir1.icon} ${hDir1.label} | ${pFace1.icon} ${pFace1.label}`;
      const hudW = Math.min(ctx.measureText(hudText).width + 30, width - 24);
      ctx.roundRect ? ctx.roundRect(12, 12, hudW, 36, 8) : ctx.fillRect(12, 12, hudW, 36);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillText(hudText, 22, 35);

      // Smooth Rolling Voting Buffer (3 frames hold threshold for instant snappy feel)
      const buffer = recentDetectionsRef.current;
      buffer.push(detected);
      if (buffer.length > 8) buffer.shift();

      const matchCount = buffer.filter(s => s === detected).length;
      const requiredMatches = 3;

      // Update UI status badge immediately once confirmed in at least 2 frames
      if (matchCount >= 2) {
        setCurrentSign(fullBadge);
        setConfidence(conf);
      }

      if (matchCount >= requiredMatches) {
        const now = Date.now();
        const isSOS = detected.includes('मदद चाहिए') || detected.includes('SOS');
        const elapsedSinceSpoken = now - lastSpokenTimeRef.current;

        if ((detected !== lastSpokenSignRef.current && elapsedSinceSpoken > 1800) || (isSOS && detected !== lastSpokenSignRef.current)) {
          lastSpokenSignRef.current = detected;
          lastSpokenTimeRef.current = now;

          // Smart Hindi speech extraction:
          // e.g. "A (ए)" -> speaks "ए", "१ (1)" -> speaks "एक", "अलविदा (Bye)" -> speaks "अलविदा"
          let speakText = detected;
          const matchParen = detected.match(/\(([^)]+)\)/);
          if (matchParen) {
            const inside = matchParen[1].trim();
            const outside = detected.replace(/\([^)]*\)/g, '').trim();
            if (/[\u0900-\u097F]/.test(inside)) {
              speakText = inside;
            } else if (/[\u0900-\u097F]/.test(outside)) {
              speakText = outside;
            } else {
              speakText = inside || outside;
            }
          }

          if (isSOS) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            speakHindi('मदद चाहिए', true);
          } else if (activeTabRef.current === 'interpret') {
            speakHindi(speakText || detected, false);
          }

          if (activeTabRef.current === 'interpret') {
            setSentenceTokens(prev => {
              if (prev.length === 0 || prev[prev.length - 1] !== detected) {
                return [...prev, detected];
              }
              return prev;
            });
          }
        }
      }
    } else {
      if (recentDetectionsRef.current.length > 0) {
        recentDetectionsRef.current.shift();
      }
    }
  };
  
// 7. Quick Simulation click for testing
  const handleQuickTest = (sign: string) => {
    setCurrentSign(sign);
    speakHindi(sign);
    setSentenceTokens(prev => {
      if (!prev.includes(sign)) return [...prev, sign];
      return prev;
    });
  };

  // 8. AI Sentence Generation
  const handleGenerateSentence = async () => {
    if (sentenceTokens.length === 0) return;
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: sentenceTokens })
      });
      const data = await res.json();
      if (data.fluentHindi) {
        setFluentHindiSentence(data.fluentHindi);
        speakHindi(data.fluentHindi);
      }
    } catch (err) {
      console.error('Error generating sentence:', err);
    }
  };

  // Instant 1-Click Pose Lock from Live Camera Feed
  const handleLockCurrentPose = () => {
    if (!cameraActive) {
      setPoseCaptureNotice('⚠️ कृपया पहले ऊपर "कैमरा ऑन करें" ताकि आपका हाथ दिख सके!');
      return;
    }
    const rawLm = latestRawLandmarksRef.current || lastStableLandmarksRef.current;
    const sig = latestFingerSignatureRef.current || lastStableSignatureRef.current;

    if (!rawLm || rawLm.length < 21 || !sig) {
      setPoseCaptureNotice('⚠️ कैमरे के सामने अपना हाथ लाएं और स्थिर रखें, फिर लॉक बटन दबाएं!');
      return;
    }

    let summary = '';
    if (sig.index && sig.middle && !sig.ring && !sig.pinky) summary = '✌️ २ उंगलियां (तर्जनी + मध्यमा)';
    else if (sig.index && sig.middle && sig.ring && !sig.pinky) summary = '३ उंगलियां (W आकार)';
    else if (sig.index && !sig.middle && !sig.ring && !sig.pinky) summary = '☝️ १ उंगली';
    else if (sig.index && sig.middle && sig.ring && sig.pinky) summary = '✋ खुला हाथ (सभी उंगलियां)';
    else if (!sig.index && !sig.middle && !sig.ring && !sig.pinky && (sig.thumb || sig.thumbPointsUp)) summary = '👍 अंगूठा';
    else if (!sig.index && !sig.middle && !sig.ring && !sig.pinky) summary = '✊ मुट्ठी';
    else {
      const openFingers = [];
      if (sig.index) openFingers.push('तर्जनी');
      if (sig.middle) openFingers.push('मध्यमा');
      if (sig.ring) openFingers.push('अनामिका');
      if (sig.pinky) openFingers.push('कनिष्ठिका');
      if (sig.thumb) openFingers.push('अंगूठा');
      summary = openFingers.length > 0 ? `${openFingers.join(' + ')} खुली` : 'हाथ पोज़';
    }

    const currentLoc = latestBodyLocationRef.current;
    setSelectedSignLocation(currentLoc.location);

    const liveMotion = latestMotionRef.current;
    const isDyn = liveMotion.isMoving && liveMotion.direction !== 'none';
    if (isDyn) {
      setSelectedSignType('dynamic');
      setSelectedMotionDirection(liveMotion.direction);
    } else {
      setSelectedSignType('static');
      setSelectedMotionDirection('none');
    }

    const motionSummary = isDyn ? ` [🎬 गति: ${liveMotion.label}]` : '';

    const isDual = Boolean(latestSecondRawLandmarksRef.current);
    const secLm = latestSecondRawLandmarksRef.current || lastStableSecondLandmarksRef.current;
    const secSig = latestSecondFingerSignatureRef.current || lastStableSecondSignatureRef.current;
    const relInfo = latestTwoHandRelationRef.current;
    const dualPrefix = isDual ? `[👐 २-हाथ | ${relInfo.label}] ` : '[🖐️ १-हाथ] ';

    const capturedHandType = isDual ? 'both' : latestHandTypeRef.current;
    const handLabelStr = capturedHandType === 'both' ? '👐 दोनों हाथ' : (capturedHandType === 'right' ? '✋ दायां हाथ (Right)' : '🤚 बायां हाथ (Left)');
    lockedPoseRef.current = {
      landmarks: rawLm,
      signature: sig,
      name: newSignHindi.trim() || 'Custom Sign',
      label: dualPrefix + summary + motionSummary,
      location: currentLoc.location,
      signType: isDyn ? 'dynamic' : 'static',
      motionDirection: isDyn ? liveMotion.direction : 'none',
      handsCount: isDual ? 2 : 1,
      handType: capturedHandType,
      handTypeLabel: handLabelStr,
      secondLandmarks: secLm || undefined,
      secondSignature: secSig || undefined,
      twoHandRelation: isDual ? relInfo.relation : undefined,
      twoHandDistance: isDual ? relInfo.distance : undefined
    };
    setLockedPoseStatus(`✅ ${dualPrefix} पोज़ लॉक: ${summary} [📍 ${currentLoc.label}]${motionSummary}`);
    setLockedPoseInfo({ 
      label: dualPrefix + summary + motionSummary, 
      signature: sig, 
      location: currentLoc.location,
      signType: isDyn ? 'dynamic' : 'static',
      motionDirection: isDyn ? liveMotion.direction : 'none'
    });
    setPoseCaptureNotice(`🔒 "${summary}" [स्थान: ${currentLoc.label}]${motionSummary} लॉक हो गया! अब आप नाम लिखकर 'सेव' दबाएं।`);
    speakHindi(`${summary} पोज़ लॉक हो गया!`);
  };

  const handleUnlockPose = () => {
    lockedPoseRef.current = null;
    setLockedPoseStatus('');
    setLockedPoseInfo(null);
    setPoseCaptureNotice('🔓 पोज़ अनलॉक हो गया। अब आप लाइव कैमरा या नया पोज़ ले सकते हैं।');
  };

  // 3-Second Pose Snapshot Countdown (Freeze / Lock Pose before typing)
  const handleCapturePoseCountdown = () => {
    if (!cameraActive) {
      setPoseCaptureNotice('⚠️ कृपया पहले "कैमरा ऑन करें" ताकि हाथ दिख सके!');
      setTimeout(() => setPoseCaptureNotice(''), 4000);
      return;
    }
    setCountdownSeconds(3);
    setPoseCaptureNotice('⏱️ हाथ का इशारा कैमरे के सामने रखें: ३...');

    setTimeout(() => {
      setCountdownSeconds(2);
      setPoseCaptureNotice('⏱️ हाथ का इशारा कैमरे के सामने रखें: २...');
    }, 1000);

    setTimeout(() => {
      setCountdownSeconds(1);
      setPoseCaptureNotice('⏱️ हाथ का इशारा कैमरे के सामने रखें: १...');
    }, 2000);

    setTimeout(() => {
      setCountdownSeconds(null);
      let lm = latestRawLandmarksRef.current;
      let sig = latestFingerSignatureRef.current;
      if (!lm || lm.length < 21) {
        lm = lastStableLandmarksRef.current;
        sig = lastStableSignatureRef.current;
      }

      if (lm && lm.length === 21) {
        let summary = '';
        if (sig.index && sig.middle && !sig.ring && !sig.pinky) summary = '✌️ २ उंगलियां (तर्जनी + मध्यमा)';
        else if (sig.index && sig.middle && sig.ring && !sig.pinky) summary = '३ उंगलियां (W आकार)';
        else if (sig.index && !sig.middle && !sig.ring && !sig.pinky) summary = '☝️ १ उंगली';
        else if (sig.index && sig.middle && sig.ring && sig.pinky) summary = '✋ खुला हाथ (सभी उंगलियां)';
        else summary = 'हाथ पोज़';

        const currentLoc = latestBodyLocationRef.current;
        setSelectedSignLocation(currentLoc.location);

        const liveMotion = latestMotionRef.current;
        const isDyn = liveMotion.isMoving && liveMotion.direction !== 'none';
        if (isDyn) {
          setSelectedSignType('dynamic');
          setSelectedMotionDirection(liveMotion.direction);
        } else {
          setSelectedSignType('static');
          setSelectedMotionDirection('none');
        }

        const motionSummary = isDyn ? ` [🎬 गति: ${liveMotion.label}]` : '';

        const isDual = Boolean(latestSecondRawLandmarksRef.current);
        const secLm = latestSecondRawLandmarksRef.current || lastStableSecondLandmarksRef.current;
        const secSig = latestSecondFingerSignatureRef.current || lastStableSecondSignatureRef.current;
        const relInfo = latestTwoHandRelationRef.current;
        const dualPrefix = isDual ? `[👐 २-हाथ | ${relInfo.label}] ` : '[🖐️ १-हाथ] ';

        lockedPoseRef.current = {
          landmarks: lm,
          signature: sig,
          name: newSignHindi.trim() || 'Custom Sign',
          label: dualPrefix + summary + motionSummary,
          location: currentLoc.location,
          signType: isDyn ? 'dynamic' : 'static',
          motionDirection: isDyn ? liveMotion.direction : 'none',
          handsCount: isDual ? 2 : 1,
          secondLandmarks: secLm || undefined,
          secondSignature: secSig || undefined,
          twoHandRelation: isDual ? relInfo.relation : undefined,
          twoHandDistance: isDual ? relInfo.distance : undefined
        };
        setLockedPoseStatus(`✅ ${dualPrefix} पोज़ लॉक: ${summary} [📍 ${currentLoc.label}]${motionSummary}`);
        setLockedPoseInfo({ 
          label: dualPrefix + summary + motionSummary, 
          signature: sig, 
          location: currentLoc.location,
          signType: isDyn ? 'dynamic' : 'static',
          motionDirection: isDyn ? liveMotion.direction : 'none'
        });
        setPoseCaptureNotice(`📸 "${summary}" [स्थान: ${currentLoc.label}]${motionSummary} लॉक हो गया! अब आप नाम लिखकर 'सेव' बटन दबा सकते हैं।`);
        speakHindi(`${summary} पोज़ लॉक हो गया!`);
      } else {
        setPoseCaptureNotice('⚠️ हाथ नहीं दिखा! कृपया कैमरे के सामने हाथ लाएं और दोबारा कोशिश करें।');
      }
    }, 3000);
  };

  // 9. Save Custom Sign (with Live Camera Pose or Locked Pose capture)
  const handleSaveSign = async () => {
    const nameH = newSignHindi.trim();
    if (!nameH) {
      setSaveStatus('⚠️ कृपया नए साइन का नाम लिखें (जैसे: फीस काउंटर, कैरम, कैंटीन)!');
      return;
    }

    if (!cameraActive) {
      setSaveStatus('⚠️ कैमरा अभी बंद है! कृपया ऊपर "कैमरा ऑन करें" ताकि AI आपके हाथ का पोज़ देख सके।');
      return;
    }

    let rawLm: any[] | null = null;
    let fingerSig: any = null;
    let locationToSave = selectedSignLocation;
    let signTypeToSave = selectedSignType;
    let motionDirToSave = selectedSignType === 'dynamic' ? selectedMotionDirection : 'none';

    if (lockedPoseRef.current && lockedPoseRef.current.landmarks.length === 21) {
      rawLm = lockedPoseRef.current.landmarks;
      fingerSig = lockedPoseRef.current.signature;
      if (lockedPoseRef.current.location) locationToSave = lockedPoseRef.current.location;
      if (lockedPoseRef.current.signType) signTypeToSave = lockedPoseRef.current.signType;
      if (lockedPoseRef.current.motionDirection) motionDirToSave = lockedPoseRef.current.motionDirection;
    } else if (latestRawLandmarksRef.current && latestRawLandmarksRef.current.length === 21) {
      rawLm = latestRawLandmarksRef.current;
      fingerSig = latestFingerSignatureRef.current;
      locationToSave = latestBodyLocationRef.current.location;
      if (latestMotionRef.current.isMoving && latestMotionRef.current.direction !== 'none') {
        signTypeToSave = 'dynamic';
        motionDirToSave = latestMotionRef.current.direction;
      }
    } else if (lastStableLandmarksRef.current && (Date.now() - lastStableTimeRef.current < 8000)) {
      rawLm = lastStableLandmarksRef.current;
      fingerSig = lastStableSignatureRef.current;
    }

    if (!rawLm || rawLm.length < 21) {
      setSaveStatus('⚠️ कैमरे के सामने अपना हाथ लाएं और वह इशारा बनाकर रखें जो आप सिखाना चाहते हैं!');
      return;
    }

    setIsRecordingSign(true);
    setSaveStatus('डेटाबेस में सेव हो रहा है...');

    const wrist = rawLm[0];
    const palmSize = Math.max(Math.hypot(wrist.x - rawLm[9].x, wrist.y - rawLm[9].y), 0.05);
    const landmarksToSave = rawLm.map((p: any) => [
      (p.x - wrist.x) / palmSize,
      (p.y - wrist.y) / palmSize,
      (p.z - wrist.z) / palmSize
    ]);

    try {
      const res = await fetch('/api/signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameHindi: nameH,
          nameEnglish: newSignEnglish.trim() || nameH,
          category: newSignCategory,
          landmarksSample: landmarksToSave,
          secondLandmarksSample: lockedPoseRef.current?.secondLandmarks ? lockedPoseRef.current.secondLandmarks.map((p: any) => [
            (p.x - (lockedPoseRef.current?.secondLandmarks?.[0]?.x || 0)) / palmSize,
            (p.y - (lockedPoseRef.current?.secondLandmarks?.[0]?.y || 0)) / palmSize,
            ((p.z || 0) - (lockedPoseRef.current?.secondLandmarks?.[0]?.z || 0)) / palmSize
          ]) : (latestSecondRawLandmarksRef.current ? latestSecondRawLandmarksRef.current.map((p: any) => [
            (p.x - (latestSecondRawLandmarksRef.current?.[0]?.x || 0)) / palmSize,
            (p.y - (latestSecondRawLandmarksRef.current?.[0]?.y || 0)) / palmSize,
            ((p.z || 0) - (latestSecondRawLandmarksRef.current?.[0]?.z || 0)) / palmSize
          ]) : undefined),
          fingerSignature: fingerSig || latestFingerSignatureRef.current || null,
          secondFingerSignature: lockedPoseRef.current?.secondSignature || latestSecondFingerSignatureRef.current || undefined,
          handsCount: lockedPoseRef.current?.handsCount || (handsDetectedCount === 2 ? 2 : 1),
          handType: lockedPoseRef.current?.handType || (handsDetectedCount === 2 ? 'both' : latestHandTypeRef.current) || 'any',
          twoHandRelation: lockedPoseRef.current?.twoHandRelation || (handsDetectedCount === 2 ? latestTwoHandRelationRef.current.relation : undefined),
          twoHandDistance: lockedPoseRef.current?.twoHandDistance || (handsDetectedCount === 2 ? latestTwoHandRelationRef.current.distance : undefined),
          bodyLocation: locationToSave,
          handDirection: (computeHandDirection(rawLm)).direction,
          palmFacing: (computeHandFacing(rawLm)).facing,
          signType: signTypeToSave,
          motionDirection: motionDirToSave,
          endBodyLocation: signTypeToSave === 'dynamic' ? selectedEndLocation : undefined,
          recordedBy: 'College Employee'
        })
      });
      const data = await res.json();
      if (data.success) {
        const motionBadge = signTypeToSave === 'dynamic' ? ` | 🎬 गति: ${motionDirToSave}` : '';
        const msg = `🎉 साइन "${nameH}" [स्थान: ${locationToSave}]${motionBadge} सेव हो गया!`;
        setSaveStatus(msg);
        setPoseCaptureNotice(msg);
        speakHindi(`${nameH} साइन सीख लिया गया है!`);
        setNewSignHindi('');
        setNewSignEnglish('');
        lockedPoseRef.current = null;
        setLockedPoseStatus('');
        setLockedPoseInfo(null);
        await loadSigns();
        setTimeout(() => {
          setSaveStatus('');
          setPoseCaptureNotice('');
        }, 5000);
      } else {
        setSaveStatus('❌ सेव करने में समस्या: ' + (data.error || 'अज्ञात त्रुटि'));
      }
    } catch (e: any) {
      setSaveStatus('❌ सेव करने में त्रुटि आई: ' + e.message);
    } finally {
      setIsRecordingSign(false);
    }
  };

  // 10. Capture Live Camera Pose for an Existing Custom Sign
  const handleCaptureLivePose = async (signId: string, signName: string) => {
    if (!cameraActive) {
      setPoseCaptureNotice('⚠️ कृपया पहले "कैमरा स्टार्ट करें" बटन दबाएं ताकि आपका हाथ दिख सके!');
      setTimeout(() => setPoseCaptureNotice(''), 4000);
      return;
    }

    let rawLm = latestRawLandmarksRef.current;
    let fingerSig = latestFingerSignatureRef.current;
    if ((!rawLm || rawLm.length < 21) && lastStableLandmarksRef.current && (Date.now() - lastStableTimeRef.current < 8000)) {
      rawLm = lastStableLandmarksRef.current;
      fingerSig = lastStableSignatureRef.current;
    }

    if (!rawLm || rawLm.length < 21) {
      setPoseCaptureNotice('⚠️ कैमरे के सामने अपना हाथ लाएं ताकि AI पोज़ को कैप्चर कर सके!');
      setTimeout(() => setPoseCaptureNotice(''), 4000);
      return;
    }

    const wrist = rawLm[0];
    const palmSize = Math.max(Math.hypot(wrist.x - rawLm[9].x, wrist.y - rawLm[9].y), 0.05);
    const normalized = rawLm.map((p: any) => [
      (p.x - wrist.x) / palmSize,
      (p.y - wrist.y) / palmSize,
      (p.z - wrist.z) / palmSize
    ]);

    const loc = latestBodyLocationRef.current.location;

    try {
      const res = await fetch('/api/signs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: signId,
          landmarksSample: normalized,
          fingerSignature: fingerSig || latestFingerSignatureRef.current || null,
          bodyLocation: loc
        })
      });
      const data = await res.json();
      if (data.success) {
        setPoseCaptureNotice(`🎉 "${signName}" का लाइव हाथ पोज़ [स्थान: ${loc}] कैप्चर हो गया!`);
        speakHindi(`${signName} का पोज़ रिकॉर्ड हो गया!`);
        loadSigns();
        setTimeout(() => setPoseCaptureNotice(''), 5000);
      }
    } catch (e) {
      setPoseCaptureNotice('❌ पोज़ सेव करने में त्रुटि आई।');
      setTimeout(() => setPoseCaptureNotice(''), 4000);
    }
  };

  // 11. Instant 1-Click Learn for Live Hackathon Demo
  const handleInstantLearn = async () => {
    const name = quickSignName.trim();
    if (!name) {
      alert('कृपया नए साइन का नाम लिखें (जैसे: कैंटीन, कैरम)!');
      return;
    }
    if (!cameraActive) {
      alert('कृपया पहले "कैमरा ऑन करें" बटन दबाएं ताकि हाथ की उंगलियां दिख सकें!');
      return;
    }

    let rawLm = latestRawLandmarksRef.current;
    let fingerSig = latestFingerSignatureRef.current;
    if ((!rawLm || rawLm.length < 21) && lastStableLandmarksRef.current && (Date.now() - lastStableTimeRef.current < 8000)) {
      rawLm = lastStableLandmarksRef.current;
      fingerSig = lastStableSignatureRef.current;
    }

    if (!rawLm || rawLm.length < 21) {
      alert('कृपया कैमरे के सामने अपना हाथ लाएं और वह नया इशारा बनाएं जो सिखाना चाहते हैं!');
      return;
    }

    setIsRecordingSign(true);
    const wrist = rawLm[0];
    const palmSize = Math.max(Math.hypot(wrist.x - rawLm[9].x, wrist.y - rawLm[9].y), 0.05);
    const landmarksToSave = rawLm.map((p: any) => [
      (p.x - wrist.x) / palmSize,
      (p.y - wrist.y) / palmSize,
      (p.z - wrist.z) / palmSize
    ]);

    try {
      const res = await fetch('/api/signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameHindi: name,
          nameEnglish: name,
          category: 'college',
          landmarksSample: landmarksToSave,
          fingerSignature: fingerSig || latestFingerSignatureRef.current || null,
          handsCount: handsDetectedCount === 2 ? 2 : 1,
          bodyLocation: latestBodyLocationRef.current.location,
          handDirection: (computeHandDirection(rawLm)).direction,
          palmFacing: (computeHandFacing(rawLm)).facing,
          recordedBy: 'Hackathon Live Demo'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPoseCaptureNotice(`🎉 बधाई! "${name}" साइन तुरंत सीख लिया गया! अब कैमरे के सामने यह इशारा करें।`);
        speakHindi(`${name} सीख लिया गया है!`);
        setQuickSignName('');
        loadSigns();
        setTimeout(() => setPoseCaptureNotice(''), 6000);
      }
    } catch (e) {
      alert('साइन सेव करने में समस्या आई।');
    } finally {
      setIsRecordingSign(false);
    }
  };

  // 12. Delete a Sign (Default or Custom)
  const handleDeleteSign = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" साइन को हटाना चाहते हैं?`)) return;
    try {
      await deleteSignPersistently(id, name);
      setPoseCaptureNotice(`🗑️ "${name}" साइन हटा दिया गया।`);
      setTimeout(() => setPoseCaptureNotice(''), 3000);
      loadSigns();
    } catch (e) {
      alert('साइन हटाने में त्रुटि आई।');
    }
  };

  return (
    <div style={{ maxWidth: isCameraExpanded ? '1440px' : '1280px', margin: '0 auto', padding: '16px', transition: 'max-width 0.3s ease' }}>
      {/* Top Banner with Audio Unlock Notice for Mobile */}
      <div style={{
        background: audioUnlocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.15)',
        border: `1px solid ${audioUnlocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.4)'}`,
        borderRadius: '14px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Smartphone size={22} style={{ color: '#10b981' }} />
          <div>
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
              {aiStatus}
            </span>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>
              {handsDetectedCount > 0 ? `🟢 ${handsDetectedCount} हाथ डिटेक्ट हो रहा है!` : 'हाथ कैमरा के सामने लाएं'}
            </p>
          </div>
        </div>

        {!audioUnlocked && (
          <button
            onClick={unlockAudio}
            className="btn-emerald"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Volume2 size={16} /> 🔊 आवाज़ चालू करें (Tap to Unmute)
          </button>
        )}
      </div>

      {/* Unified Global Navbar */}
      <Navbar
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => {
          setVoiceEnabled(!voiceEnabled);
          if (!voiceEnabled) speakHindi('आवाज़ चालू है');
        }}
        signsCount={allSigns.length}
      />

      {/* Sub-navigation & Quick Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-glass)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('interpret')}
            style={{
              background: activeTab === 'interpret' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'interpret' ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === 'interpret' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Camera size={15} />
            1. लाइव इंटरप्रेटर (Sign to Speech)
          </button>

          <button
            onClick={() => setActiveTab('reverse')}
            style={{
              background: activeTab === 'reverse' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'reverse' ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === 'reverse' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Mic size={15} />
            2. रिवर्स मोड (Speech to Text)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href="/train"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Sparkles size={15} />
            ✨ साइन स्टूडियो (3-Step Wizard)
          </Link>

          <Link
            href="/dictionary"
            style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <BookOpen size={15} />
            📖 डिक्शनरी ({allSigns.length})
          </Link>
        </div>
      </div>

      {/* SHARED VIEW: TAB 1 (INTERPRETER) & TAB 2 (COLLEGE EMPLOYEE TRAINING) */}
      <div 
        className={`vision-grid ${isCameraExpanded ? 'theater-view' : 'standard-view'}`} 
        style={{ display: activeTab === 'reverse' ? 'none' : 'grid' }}
      >
        {/* Left Column: Live Vision Screen (3D Hand Skeleton, Camera / Video Controls, Instant Audio Test Bar) */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={18} style={{ color: '#10b981' }} />
                लाइव विज़न स्क्रीन (3D Hand Skeleton)
              </h3>
              <span style={{ fontSize: '12px', color: '#10b981' }}>{fingerStates}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsCameraExpanded(!isCameraExpanded)} 
                className="btn-glass" 
                style={{ 
                  padding: '8px 14px', 
                  fontSize: '13px',
                  borderColor: isCameraExpanded ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                  background: isCameraExpanded ? 'rgba(59, 130, 246, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  color: isCameraExpanded ? '#60a5fa' : '#cbd5e1'
                }}
                title={isCameraExpanded ? "सामान्य स्क्रीन पर लौटें" : "कैमरा स्क्रीन को बड़ा करें (Theater Mode)"}
              >
                {isCameraExpanded ? <Minimize2 size={15} style={{ color: '#60a5fa' }} /> : <Maximize2 size={15} style={{ color: '#60a5fa' }} />}
                {isCameraExpanded ? '🗗 सामान्य व्यू' : '⛶ बड़ा व्यू (Theater Mode)'}
              </button>

              {!cameraActive ? (
                <>
                  <button onClick={startCamera} className="btn-emerald" style={{ padding: '8px 14px', fontSize: '13px' }}>
                    📷 कैमरा ऑन करें
                  </button>
                  <button 
                    onClick={() => playDemoVideo('/demo1.mp4', 'demo1.mp4')} 
                    className="btn-purple" 
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                  >
                    🎬 demo1.mp4
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="btn-glass" 
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    title="अपनी कोई अन्य वीडियो फ़ाइल टेस्ट करें"
                  >
                    📁 अन्य वीडियो
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="video/*" 
                    style={{ display: 'none' }} 
                  />
                </>
              ) : (
                <button onClick={stopCamera} className="btn-danger" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {isVideoFileMode ? '⏹️ वीडियो बंद करें' : '⏹️ कैमरा बंद करें'}
                </button>
              )}
            </div>
          </div>

          {/* Viewfinder */}
          <div className={`viewfinder-container ${isCameraExpanded ? 'is-expanded' : ''}`}>
            {/* Sci-Fi HUD Corner Brackets for Clean Professional Framing */}
            <div className="hud-bracket hud-tl" />
            <div className="hud-bracket hud-tr" />
            <div className="hud-bracket hud-bl" />
            <div className="hud-bracket hud-br" />

            {/* Quick In-Viewfinder Size Toggle Button */}
            <button
              onClick={() => setIsCameraExpanded(!isCameraExpanded)}
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease'
              }}
              title={isCameraExpanded ? "सामान्य स्क्रीन पर लौटें" : "बड़ा स्क्रीन मोड (Theater Mode)"}
            >
              {isCameraExpanded ? <Minimize2 size={13} style={{ color: '#38bdf8' }} /> : <Maximize2 size={13} style={{ color: '#38bdf8' }} />}
              {isCameraExpanded ? '🗗 सामान्य' : '⛶ बड़ा व्यू'}
            </button>

            {/* Hidden video stream source */}
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              autoPlay
              style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} 
            />
            
            {/* Active display canvas */}
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={480} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
            />

            {isVideoFileMode && cameraActive && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(99, 102, 241, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                वीडियो टेस्ट मोड: {currentVideoName}
              </div>
            )}

            {!cameraActive && (
              <div style={{ position: 'absolute', textAlign: 'center', padding: '20px', maxWidth: '480px' }}>
                {cameraErrorNotice ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '14px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ color: '#f87171', fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0' }}>
                          कैमरा समस्या का समाधान:
                        </h4>
                        <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                          {cameraErrorNotice}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera size={44} style={{ color: '#475569', marginBottom: '8px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '14px' }}>
                      हाथ के इशारे पहचानने और नया साइन सिखाने के लिए कैमरा ऑन करें:
                    </p>
                  </>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={startCamera} className="btn-emerald" style={{ padding: '10px 18px' }}>
                    {cameraErrorNotice ? '🔄 दोबारा कोशिश करें' : '📷 कैमरा स्टार्ट करें'}
                  </button>
                  <button 
                    onClick={() => playDemoVideo('/demo1.mp4', 'demo1.mp4')} 
                    className="btn-purple" 
                    style={{ padding: '10px 18px' }}
                  >
                    🎬 demo1.mp4 टेस्ट करें
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Real-Time Detection HUD Panel - MOVED CLEANLY BELOW CAMERA (Unobstructed Camera Screen) */}
          <div style={{
            marginTop: '14px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
            backdropFilter: 'blur(12px)',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ minWidth: '170px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                पहचाना गया इशारा (Live Detection)
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentSign || 'साइन डिटेक्ट हो रहा है...'}
                {isSpeaking && (
                  <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '6px' }}>
                    <span className="audio-bar" />
                    <span className="audio-bar" />
                    <span className="audio-bar" />
                  </span>
                )}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Hand Mode & Handedness (Right / Left Hand) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: handsDetectedCount === 2 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.25))' 
                  : (liveHandType === 'left' ? 'rgba(236, 72, 153, 0.22)' : 'rgba(16, 185, 129, 0.22)'),
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1px solid ${handsDetectedCount === 2 ? '#a855f7' : (liveHandType === 'left' ? '#f472b6' : '#10b981')}`,
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>हाथ:</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: handsDetectedCount === 2 ? '#c084fc' : (liveHandType === 'left' ? '#f472b6' : '#34d399')
                }}>
                  {handsDetectedCount === 2 
                    ? `👐 २ हाथ (${twoHandRelationLabel})` 
                    : (liveHandType === 'left' ? '🤚 बायां हाथ (Left Hand)' : '✋ दायां हाथ (Right Hand)')}
                </span>
              </div>

              {/* Location */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>स्थान:</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: detectedLocation === 'forehead' ? '#c084fc' :
                         detectedLocation === 'chin' ? '#fbbf24' :
                         detectedLocation === 'chest' ? '#38bdf8' :
                         detectedLocation === 'cheek' ? '#f472b6' : '#94a3b8'
                }}>
                  {detectedLocationLabel}
                </span>
              </div>

              {/* Motion */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentMotion.isMoving ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${currentMotion.isMoving ? '#06b6d4' : 'rgba(255, 255, 255, 0.15)'}`,
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>मोशन:</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: currentMotion.isMoving ? '#38bdf8' : '#94a3b8'
                }}>
                  {currentMotion.label}
                </span>
              </div>

              {/* Hand Direction */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>दिशा:</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                  {liveHandDirection.icon} {liveHandDirection.label}
                </span>
              </div>

              {/* Palm Facing (आगे का भाग / पीछे का भाग) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>हथेली:</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
                  {livePalmFacing.icon} {livePalmFacing.label}
                </span>
              </div>

              {/* Sign Guide Button */}
              <button
                onClick={() => setShowSignGuideModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <BookOpen size={14} /> 📚 सचित्र गाइड (फोटो)
              </button>
            </div>
          </div>

          {/* Quick Test Bar with Base + Custom Employee Signs */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                👇 तुरंत आवाज़ टेस्ट करने के लिए क्लिक करें:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/dictionary" style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'none', borderBottom: '1px dotted #94a3b8' }}>
                  📖 डिक्शनरी / साइन हटाएं &raquo;
                </Link>
                {allSigns.length > 0 && (
                  <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    ✨ {allSigns.length} साइन एक्टिव
                  </span>
                )}
              </div>
            </div>

            {/* If dictionary is empty, show clean notice */}
            {allSigns.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>
                    📭 डिक्शनरी में कोई साइन एक्टिव नहीं है
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                    AI केवल उन्हीं साइंस को पहचानेगा जो डिक्शनरी में मौजूद होंगे।
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/train" className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}>
                    ➕ नया साइन सिखाएं
                  </Link>
                  <Link href="/dictionary" className="btn-glass" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                    📖 डिक्शनरी खोलें
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {allSigns.map(sign => {
                  const isCustom = sign.id.includes('custom') || sign.id.includes('local') || sign.recordedBy;
                  const icon = getSignEmoji(sign.nameHindi);

                  return (
                    <button
                      key={sign.id}
                      onClick={() => handleQuickTest(sign.nameHindi)}
                      style={{
                        background: isCustom 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25))' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isCustom ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isCustom ? '#67e8f9' : '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{icon}</span>
                      <span>{sign.nameHindi}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live AI Sentence Builder Strip (Accessible on Mobile without scrolling) */}
          <div style={{
            marginTop: '14px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} style={{ color: '#38bdf8' }} />
                AI वाक्य निर्माण (Sentence Builder)
              </span>
              {sentenceTokens.length > 0 && (
                <button
                  onClick={() => { setSentenceTokens([]); setFluentHindiSentence(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                >
                  🗑️ साफ़ करें
                </button>
              )}
            </div>

            {/* Live Tokens Sequence */}
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              minHeight: '38px',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.15)'
            }}>
              {sentenceTokens.length === 0 ? (
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  हाथ से इशारे करें, वे यहाँ क्रम से जुड़ते जाएंगे...
                </span>
              ) : (
                sentenceTokens.map((tok, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(16, 185, 129, 0.35))',
                      color: '#67e8f9',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid rgba(59, 130, 246, 0.5)'
                    }}
                  >
                    {tok}
                  </span>
                ))
              )}
            </div>

            {/* Trigger Button & Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleGenerateSentence}
                disabled={sentenceTokens.length === 0}
                className="btn-emerald"
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '9px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Sparkles size={15} />
                ✨ AI से पूरा वाक्य बनाएं और बोलें
              </button>

              {fluentHindiSentence && (
                <button
                  onClick={() => speakHindi(fluentHindiSentence, true)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    color: '#93c5fd',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Volume2 size={14} /> दोबारा बोलें
                </button>
              )}
            </div>

            {/* Generated Natural Hindi Result */}
            {fluentHindiSentence && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#4ade80',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Volume2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>{fluentHindiSentence}</span>
              </div>
            )}
          </div>

          {/* Notice banner for live pose capture */}
          {poseCaptureNotice && (
            <div style={{
              marginTop: '12px',
              background: poseCaptureNotice.includes('⚠️') ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${poseCaptureNotice.includes('⚠️') ? 'rgba(234, 179, 8, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {poseCaptureNotice}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (TAB 1: LIVE INTERPRETER MODE) */}
        {activeTab === 'interpret' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sentence Builder */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: '#3b82f6' }} />
                  साइन सीक्वेंस & AI वाक्य निर्माण
                </h3>
                {sentenceTokens.length > 0 && (
                  <button 
                    onClick={() => { setSentenceTokens([]); setFluentHindiSentence(''); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                  >
                    साफ़ करें (Clear)
                  </button>
                )}
              </div>

              <div style={{ 
                minHeight: '65px', 
                background: 'rgba(0, 0, 0, 0.3)', 
                borderRadius: '10px', 
                padding: '10px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                {sentenceTokens.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    जैसे ही आप इशारे करेंगे, वे यहाँ जुड़ते जाएंगे...
                  </span>
                ) : (
                  sentenceTokens.map((t, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.25)', 
                        color: '#93c5fd', 
                        padding: '4px 10px', 
                        borderRadius: '16px', 
                        fontSize: '13px',
                        fontWeight: 700,
                        border: '1px solid rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>

              <button
                onClick={handleGenerateSentence}
                disabled={sentenceTokens.length === 0}
                className="btn-emerald"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <Sparkles size={16} />
                AI से प्राकृतिक हिंदी वाक्य बनाएं और बोलें
              </button>
            </div>

            {/* Hindi Spoken Output */}
            <div className="glass-panel" style={{ padding: '20px', flex: 1, borderColor: fluentHindiSentence ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                  🔊 बोली गई प्राकृतिक हिंदी
                </span>
                {fluentHindiSentence && (
                  <button
                    onClick={() => speakHindi(fluentHindiSentence)}
                    style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Volume2 size={14} /> दोबारा बोलें
                  </button>
                )}
              </div>

              <div style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: fluentHindiSentence ? '#f8fafc' : 'var(--text-muted)', 
                lineHeight: 1.4,
                minHeight: '60px'
              }}>
                {fluentHindiSentence || 'वाक्य यहाँ साफ़ हिंदी में दिखाई देगा और स्पीकर से बोलेगा...'}
              </div>
            </div>

            {/* Instant Hackathon 1-Click Fast Trainer Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '12px',
              padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                    ⚡ 1-क्लिक में तुरंत नया साइन सिखाएं
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: cameraActive && handsDetectedCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)',
                  color: cameraActive && handsDetectedCount > 0 ? '#4ade80' : '#f87171',
                  fontWeight: 700
                }}>
                  {cameraActive ? (handsDetectedCount > 0 ? `✋ ${handsDetectedCount === 2 ? '२-हाथ' : '१-हाथ'} | ${liveHandDirection.icon} ${liveHandDirection.label} | ${livePalmFacing.icon} ${livePalmFacing.label}` : '⚠️ हाथ दिखाएं') : '📷 कैमरा बंद'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="नया साइन नाम (जैसे: कैंटीन, फीस...)"
                  value={quickSignName}
                  onChange={e => setQuickSignName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleInstantLearn(); }}
                  style={{
                    flex: '1',
                    minWidth: '200px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
                <button
                  onClick={handleInstantLearn}
                  disabled={isRecordingSign}
                  className="btn-emerald"
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700 }}
                >
                  🎯 {isRecordingSign ? 'सेव हो रहा...' : 'सिखाएं'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN (TAB 2: REDIRECT TO 3-STEP STUDIO) */}
        {activeTab === 'train' && (
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '50%',
              width: '72px',
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Sparkles size={36} style={{ color: '#34d399' }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              नया '3-Step साइन स्टूडियो' तैयार है!
            </h3>
            
            <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '440px', marginBottom: '20px', lineHeight: 1.6 }}>
              कैमरा और आवाज़ के टकराव (Collision) से बचने के लिए, साइन ट्रेनिंग को एक समर्पित 3-चरण विज़ार्ड में अलग कर दिया गया है:
            </p>

            <div style={{ textAlign: 'left', maxWidth: '380px', width: '100%', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>1</span>
                <span>साइन नाम व श्रेणी (Category & Body Anchor)</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>2</span>
                <span>हैंड्स-फ्री 3-2-1 बीप टाइमर (साइलेंट पोज़ कैप्चर)</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>3</span>
                <span>लाइव सैंडबॉक्स टेस्ट व कंफ्लिक्ट चेकर</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                href="/train"
                className="btn-emerald"
                style={{
                  textDecoration: 'none',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Sparkles size={16} />
                साइन स्टूडियो में जाएं (Open Studio)
              </Link>

              <Link
                href="/dictionary"
                className="btn-glass"
                style={{
                  textDecoration: 'none',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BookOpen size={16} />
                साइन लाइब्रेरी देखें
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* TAB 3: REVERSE MODE (Two-Way Voice to Text Hub) */}
      <div style={{ display: activeTab === 'reverse' ? 'block' : 'none', maxWidth: '780px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '50%', color: '#a78bfa' }}>
              <Mic size={24} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
              रिवर्स मोड: टू-वे संवाद (Voice-to-Text)
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', maxWidth: '560px', margin: '0 auto 24px auto' }}>
            सामान्य व्यक्ति माइक दबाकर हिंदी में बोलेगा, और AI तुरंत उसे बड़े अक्षरों में मूक-बधिर साथी के पढ़ने के लिए स्क्रीन पर दिखाएगा।
          </p>

          {/* Central Pulsing Microphone Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={toggleListening}
              className={isListening ? 'mic-listening' : ''}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: isListening 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: isListening ? '3px solid #fecaca' : '3px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening 
                  ? '0 0 30px rgba(239, 68, 68, 0.8)' 
                  : '0 8px 25px rgba(139, 92, 246, 0.5)',
                transition: 'all 0.3s ease'
              }}
              title={isListening ? 'माइक बंद करने के लिए क्लिक करें' : 'माइक चालू करने के लिए क्लिक करें'}
            >
              {isListening ? <MicOff size={42} /> : <Mic size={42} />}
            </button>

            <div style={{ marginTop: '14px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isListening ? '#f87171' : '#c4b5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}>
                {isListening ? (
                  <>
                    <span className="recording-dot" />
                    सुन रहे हैं... हिंदी में बोलिए (Tap to Stop)
                  </>
                ) : (
                  '🎙️ माइक दबाकर हिंदी में बोलें (Tap to Speak)'
                )}
              </span>

              {isListening && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px' }}>
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                </div>
              )}
            </div>

            {/* Speech Notice Banner */}
            {speechNotice && (
              <div style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: speechNotice.includes('⚠️') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: `1px solid ${speechNotice.includes('⚠️') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                color: speechNotice.includes('⚠️') ? '#fca5a5' : '#e9d5ff',
                fontSize: '12px',
                fontWeight: 600,
                maxWidth: '520px'
              }}>
                {speechNotice}
              </div>
            )}
          </div>

          {/* Big High-Contrast Visual Box for Deaf User */}
          <div style={{
            background: '#020617',
            borderRadius: '18px',
            padding: '24px 20px',
            border: '2px solid rgba(139, 92, 246, 0.45)',
            boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.8), 0 8px 30px rgba(139, 92, 246, 0.15)',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                👁️ मूक-बधिर साथी के लिए देवनागरी डिस्प्ले (High-Contrast)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {spokenHindiText && (
                  <>
                    <button
                      onClick={() => speakHindi(spokenHindiText)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                    >
                      <Volume2 size={12} /> आवाज़ सुनें
                    </button>
                    <button
                      onClick={copyToClipboard}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#93c5fd',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                    >
                      {copiedNotice ? <Check size={12} /> : <Copy size={12} />}
                      {copiedNotice ? 'कॉपी हुआ!' : 'कॉपी करें'}
                    </button>
                    <button
                      onClick={() => { setSpokenHindiText(''); setSpeechNotice(''); }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="टेक्स्ट साफ़ करें"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p style={{
              fontSize: '26px',
              fontWeight: 800,
              color: spokenHindiText ? '#facc15' : '#475569',
              lineHeight: 1.45,
              minHeight: '80px',
              margin: 0
            }}>
              {spokenHindiText || 'माइक दबाकर बोलें या नीचे से वाक्य चुनें...'}
            </p>
          </div>

          {/* College Quick Phrases */}
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#c4b5fd', marginBottom: '10px' }}>
              🏛️ तुरंत भेजने के लिए कॉलेज के सामान्य वाक्य:
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                'हाँ, लाइब्रेरी दूसरे माले पर खुली है।',
                'प्रिंसिपल सर अपने केबिन में मौजूद हैं।',
                'आपकी आज की अटेंडेंस लग चुकी है।',
                'फीस काउंटर खिड़की नंबर 3 पर है।',
                'कंप्यूटर लैब में क्लास चल रही है।',
                'कृपया 5 मिनट प्रतीक्षा करें।',
                'धन्यवाद! आपका दिन शुभ हो।'
              ].map(phrase => (
                <button
                  key={phrase}
                  onClick={() => {
                    setSpokenHindiText(phrase);
                    speakHindi(phrase);
                    setSpeechNotice(`चुना गया: "${phrase}"`);
                  }}
                  style={{
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    color: '#e9d5ff',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>

          {/* Manual Hindi Input fallback */}
          <div style={{
            display: 'flex',
            gap: '8px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <input
              type="text"
              placeholder="या यहाँ कीबोर्ड से हिंदी में टाइप करें..."
              value={manualHindiInput}
              onChange={e => setManualHindiInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && manualHindiInput.trim()) {
                  setSpokenHindiText(manualHindiInput.trim());
                  speakHindi(manualHindiInput.trim());
                  setManualHindiInput('');
                }
              }}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => {
                if (manualHindiInput.trim()) {
                  setSpokenHindiText(manualHindiInput.trim());
                  speakHindi(manualHindiInput.trim());
                  setManualHindiInput('');
                }
              }}
              className="btn-purple"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              दिखाएं & बोलें
            </button>
          </div>

        </div>
      </div>
  
      {/* ========================================================================= */}
      {/* 📚 ISL VISUAL PHOTO GUIDE MODAL (सचित्र साइन गाइड: 0-9 और A-Z)           */}
      {/* ========================================================================= */}
      {showSignGuideModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🖼️ इंडियन साइन लैंग्वेज (ISL) सचित्र गाइड
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  कैमरे के सामने हाथ कैसे रखें — नीचे देखकर सही मुद्रा (Posture) बनाएं:
                </p>
              </div>
              <button
                onClick={() => setShowSignGuideModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Zonal Guide Banner */}
            <div style={{
              margin: '12px 20px 0 20px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <div style={{ fontSize: '12px', color: '#e0f2fe', lineHeight: 1.4 }}>
                <strong>स्मार्ट ज़ोन व दिशा नियम (Smart Zonal & Handedness Detection):</strong><br />
                • <strong>माथे से ऊपर खुला स्पेस:</strong> <strong>अंक ०-९ (केवल दायां हाथ - Right Hand)</strong><br />
                • <strong>माथा:</strong> <strong>प्रिंसिपल</strong> (दायां हाथ आड़ा) | <strong>दादाजी</strong> (बायां हाथ आड़ा) | <strong>बुखार</strong> (बायां हाथ ४ आड़ी उंगलियां)<br />
                • <strong>ठोड़ी व मुंह:</strong> <strong>दादीजी</strong> (बायां हाथ आड़ा) | <strong>पानी</strong> (३ उंगलियां W आकार) | <strong>खाना</strong> (उंगलियों का गुच्छा/चुटकी)<br />
                • <strong>छाती:</strong> <strong>अटेंडेंस</strong> (१ उंगली ऊपर) | <strong>हाँ</strong> (👍) | <strong>नहीं</strong> (👎) | <strong>२-हाथ</strong> (डॉक्टर, नमस्ते, लाइब्रेरी, फाइल)
              </div>
            </div>

            {/* Guide Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(10, 14, 23, 0.5)',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setGuideActiveTab('daily')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: guideActiveTab === 'daily' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  whiteSpace: 'nowrap'
                }}
              >
                🤝 दैनिक व कॉलेज शब्द (प्रिंसिपल, खाना, पानी, कॉलिंग, फाइल, मदद...)
              </button>
              <button
                onClick={() => setGuideActiveTab('numbers')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: guideActiveTab === 'numbers' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  whiteSpace: 'nowrap'
                }}
              >
                🔢 अंक (0 से 9) [माथा / Forehead]
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* TAB 1: DAILY & COLLEGE USE SIGNS (FEATURED POSTER + CARDS) */}
              {guideActiveTab === 'daily' && (
                <div>
                  {/* Generated Rich Poster */}
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    marginBottom: '18px',
                    background: '#0f172a',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                  }}>
                    <img 
                      src="/images/daily_isl_signs_chart.jpg" 
                      alt="ISL Daily Conversation Signs Poster" 
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                    />
                  </div>

                  <h4 style={{ fontSize: '15px', color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💡 दैनिक व कॉलेज जीवन के संकेत (हाथ की संख्या, दिशा व हथेली गाइड):
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {[
                      { 
                        name: 'प्रिंसिपल (Principal)', 
                        icon: '👨‍🏫', 
                        hands: '🖐️ १-हाथ (दायां)', 
                        dir: '👈 माथे पर क्षैतिज', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '👤 माथा', 
                        desc: 'माथे पर रखा हुआ दायां हाथ, तर्जनी उंगली माथे के आर-पार आड़ी/लेटी हुई (Horizontal across forehead)।' 
                      },
                      { 
                        name: 'दादाजी (Dadaji)', 
                        icon: '👴', 
                        hands: '🖐️ १-हाथ (बायां)', 
                        dir: '👉 माथे पर क्षैतिज', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '👤 माथा', 
                        desc: 'माथे पर रखा हुआ बायां हाथ, तर्जनी उंगली माथे के आर-पार आड़ी/लेटी हुई (Horizontal across forehead)।' 
                      },
                      { 
                        name: 'बुखार (Fever)', 
                        icon: '🤒', 
                        hands: '🖐️ १-हाथ (बायां)', 
                        dir: '👉 माथे पर क्षैतिज ४ उंगलियां', 
                        palm: '🖐️ हथेली माथे पर', 
                        loc: '👤 माथा', 
                        desc: 'माथे पर रखा हुआ बायां हाथ, ४ उंगलियां माथे के आर-पार आड़ी/लेटी हुई (तापमान जांचने की मुद्रा)।' 
                      },
                      { 
                        name: 'दादीजी (Dadiji)', 
                        icon: '👵', 
                        hands: '🖐️ १-हाथ (बायां)', 
                        dir: '👉 ठोड़ी पर क्षैतिज', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '🗣️ ठोड़ी / मुंह', 
                        desc: 'ठोड़ी पर रखा हुआ बायां हाथ, उंगली ठोड़ी के आर-पार आड़ी/लेटी हुई (Horizontal across chin)।' 
                      },
                      { 
                        name: 'खाना (Food)', 
                        icon: '🍲', 
                        hands: '🖐️ १-हाथ', 
                        dir: '↗️ मुंह की ओर', 
                        palm: '🖐️ हथेली मुंह की ओर', 
                        loc: '🗣️ ठोड़ी / मुंह', 
                        desc: 'सभी उंगलियों को चुटकी बनाकर या मिलाकर मुंह की ओर ले जाएं।' 
                      },
                      { 
                        name: 'पानी (Water)', 
                        icon: '💧', 
                        hands: '🖐️ १-हाथ', 
                        dir: '⬆️ ऊपर (W आकार)', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '🗣️ ठोड़ी / मुंह', 
                        desc: '३ उंगलियों (तर्जनी, मध्यमा, अनामिका) से W आकार बनाकर ठोड़ी या होंठ को छूएं।' 
                      },
                      { 
                        name: 'कॉलिंग (Calling / फोन)', 
                        icon: '📞', 
                        hands: '🖐️ १-हाथ', 
                        dir: '👂 कान-मुंह रेखा', 
                        palm: '🖐️ चेहरे की ओर', 
                        loc: '👂 गाल / कान', 
                        desc: 'अंगूठा कान पर और छोटी उंगली मुंह के पास रखकर फोन पर बात करने का संकेत करें (🤙)।' 
                      },
                      { 
                        name: 'मदद चाहिए (SOS / Help)', 
                        icon: '🆘', 
                        hands: '🖐️ १-हाथ', 
                        dir: '↗️ आगे / सामने', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '🫀 छाती', 
                        desc: 'शका मुद्रा (🤙 अंगूठा व छोटी उंगली खुली) छाती के सामने रखें या हाथ लहराएं।' 
                      },
                      { 
                        name: 'हाँ (Yes)', 
                        icon: '👍', 
                        hands: '🖐️ १-हाथ', 
                        dir: '⬆️ ऊपर', 
                        palm: '🖐️ अंदर/सामने', 
                        loc: '🫀 छाती', 
                        desc: 'अंगूठा ऊपर (Thumbs Up) करके सहमति जताएं।' 
                      },
                      { 
                        name: 'नहीं (No)', 
                        icon: '👎', 
                        hands: '🖐️ १-हाथ', 
                        dir: '⬇️ नीचे', 
                        palm: '🖐️ हथेली नीचे', 
                        loc: '🫀 छाती', 
                        desc: 'अंगूठा नीचे (Thumbs Down) करके मना करने का इशारा करें।' 
                      },
                      { 
                        name: 'फाइल (File / दस्तावेज़)', 
                        icon: '📁', 
                        hands: '👐 २-हाथ', 
                        dir: '↗️ समानांतर आगे', 
                        palm: '🖐️ हथेलियां आमने-सामने', 
                        loc: '🫀 छाती', 
                        desc: 'दोनों हथेलियां समानांतर सीधी एक-दूसरे के आमने-सामने फाइल पकड़ने की मुद्रा में रखें।' 
                      },
                      { 
                        name: 'अटेंडेंस (Attendance)', 
                        icon: '☝️', 
                        hands: '🖐️ १-हाथ', 
                        dir: '⬆️ ऊपर सीधी', 
                        palm: '🖐️ हथेली सामने', 
                        loc: '🫀 छाती', 
                        desc: 'छाती के पास १ तर्जनी उंगली सीधी ऊपर उठाएं (Present Sir / उपस्थिति मुद्रा)।' 
                      },
                      { 
                        name: 'लाइब्रेरी (Library)', 
                        icon: '📚', 
                        hands: '👐 २-हाथ', 
                        dir: '↗️ आगे', 
                        palm: '🖐️ हथेलियां ऊपर/सामने', 
                        loc: '🫀 छाती', 
                        desc: 'दोनों हथेलियों को खुली किताब की तरह सामने फैलाकर रखें।' 
                      },
                      { 
                        name: 'नमस्ते (Namaste)', 
                        icon: '🙏', 
                        hands: '👐 २-हाथ', 
                        dir: '⬆️ ऊपर', 
                        palm: '🖐️ आपस में जुड़ी', 
                        loc: '🫀 छाती', 
                        desc: 'दोनों खुली हथेलियों को छाती के पास जोड़कर प्रणाम करें।' 
                      },
                      { 
                        name: 'डॉक्टर (Doctor)', 
                        icon: '🩺', 
                        hands: '👐 २-हाथ', 
                        dir: '⬇️ कलाई पर', 
                        palm: '🖐️ नब्ज पर', 
                        loc: '🫀 छाती', 
                        desc: 'एक हाथ की कलाई पर दूसरे हाथ की २ उंगलियों से नब्ज जांचने का संकेत करें।' 
                      },
                    ].map(item => (
                      <div key={item.name} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fde047' }}>{item.name}</span>
                          </div>
                          
                          {/* Badges for Hands count, Direction, Palm Facing, Location */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {item.hands}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {item.dir}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {item.palm}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                              {item.loc}
                            </span>
                          </div>

                          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                            {item.desc}
                          </p>
                        </div>

                        <button
                          onClick={() => { speakHindi(item.name.split(' ')[0]); }}
                          style={{
                            marginTop: '10px',
                            background: 'rgba(251, 191, 36, 0.15)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            color: '#fbbf24',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔊 बोलकर सुनें
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: NUMBERS (0-9) AT FOREHEAD */}
              {guideActiveTab === 'numbers' && (
                <div>
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '18px',
                    background: '#000000'
                  }}>
                    <img 
                      src="/images/isl_dataset_numbers_row.jpg" 
                      alt="ISL Numbers 0 to 9 Chart" 
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                    />
                  </div>

                  <h4 style={{ fontSize: '15px', color: '#10b981', marginBottom: '12px' }}>
                    💡 अंकों की विस्तृत गाइड (माथे के पास सीधी ऊपर उंगलियां):
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {[
                      { num: '० (0)', name: 'शून्य / OK', icon: '0️⃣', dir: 'सामने', desc: 'अंगूठे और तर्जनी के सिरों को मिलाकर गोल (O) बनाएं, बाकी ३ उंगलियां बंद रखें।' },
                      { num: '१ (1)', name: 'एक (One)', icon: '1️⃣', dir: '⬆️ सीधी ऊपर हवा में', desc: 'केवल तर्जनी (☝️) सीधी ऊपर हवा में उठाएं, अंगूठे को मुट्ठी पर मोड़कर रखें। (माथे पर आड़ा नहीं!)' },
                      { num: '२ (2)', name: 'दो (Two)', icon: '2️⃣', dir: '⬆️ ऊपर V आकार', desc: 'तर्जनी और मध्यमा को ऊपर फैलाकर V (✌️) आकार बनाएं।' },
                      { num: '३ (3)', name: 'तीन (Three)', icon: '3️⃣', dir: '⬆️ ऊपर W आकार', desc: 'तर्जनी + मध्यमा + अनामिका तीनों ऊपर उठाएं।' },
                      { num: '४ (4)', name: 'चार (Four)', icon: '4️⃣', dir: '⬆️ ऊपर ४ उंगलियां', desc: 'चारों उंगलियां सीधी रखें, केवल अंगूठा हथेली पर मोड़े रखें।' },
                      { num: '५ (5)', name: 'पाँच (Five)', icon: '5️⃣', dir: '⬆️ खुली हथेली', desc: 'पूरी खुली हथेली (सभी ५ उंगलियां सीधी फैली हों ✋)।' },
                      { num: '६ (6)', name: 'छह (Six)', icon: '6️⃣', dir: '⬆️ अंगूठा ऊपर', desc: 'थम्ब्स अप (👍 अंगूठा ऊपर, बाकी चारों उंगलियां मुट्ठी में बंद)।' },
                      { num: '७ (7)', name: 'सात (Seven)', icon: '7️⃣', dir: '👉 गन आकार', desc: 'गन / L आकार (👉 तर्जनी आगे और अंगूठा ऊपर 90° पर खुला)।' },
                      { num: '८ (8)', name: 'आठ (Eight)', icon: '8️⃣', dir: '⬆️ ३ उंगलियां + अंगूठा', desc: 'अंगूठा + तर्जनी + मध्यमा (३ उंगलियां खुली), बाकी २ मुट्ठी में बंद।' },
                      { num: '९ (9)', name: 'नौ (Nine)', icon: '9️⃣', dir: '⬆️ ४ उंगलियां + अंगूठा', desc: 'अंगूठा + तर्जनी + मध्यमा + अनामिका (४ उंगलियां खुली), केवल छोटी उंगली बंद।' },
                    ].map(item => (
                      <div key={item.num} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>{item.num}</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>- {item.name}</span>
                          </div>
                          <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px' }}>
                              दिशा: {item.dir}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                            {item.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => { speakHindi(item.name.split(' ')[0]); }}
                          style={{
                            marginTop: '8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔊 बोलकर सुनें
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

{/* Modal Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(15, 23, 42, 0.8)'
            }}>
              <button
                onClick={() => setShowSignGuideModal(false)}
                className="btn-emerald"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                ✓ समझ गया, कैमरा टेस्ट करें
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
