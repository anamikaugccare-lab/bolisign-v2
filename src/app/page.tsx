'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Camera, Volume2, VolumeX, Sparkles, Mic, MicOff, PlusCircle, 
  BookOpen, UserCheck, Smartphone, CheckCircle, RefreshCw, AlertCircle,
  Copy, Trash2, RotateCcw, Check, Maximize2, Minimize2, ArrowRight
} from 'lucide-react';
import { CustomSign } from '@/lib/types';
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
  
  // Body Location Tracking State (Forehead, Chin, Chest, Cheek, Neutral)
  const [detectedLocation, setDetectedLocation] = useState<'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'>('neutral');
  const [detectedLocationLabel, setDetectedLocationLabel] = useState<string>('✋ खुला स्पेस (Neutral)');
  const [selectedSignLocation, setSelectedSignLocation] = useState<'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'>('neutral');
  const faceDetectionRef = useRef<any>(null);
  const latestFaceRef = useRef<any>(null);
  const latestBodyLocationRef = useRef<{ location: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'; label: string; icon: string }>({
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
  const [selectedEndLocation, setSelectedEndLocation] = useState<'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'>('neutral');
  
  // Audio state
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  
  // Detection state
  const [currentSign, setCurrentSign] = useState<string>('कैमरा के आगे हाथ लाएं...');
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
  const lastStableLandmarksRef = useRef<any[] | null>(null);
  const lastStableSignatureRef = useRef<any>(null);
  const lastStableTimeRef = useRef<number>(0);
  const lockedPoseRef = useRef<{ 
    landmarks: any[]; 
    signature: any; 
    name: string; 
    label?: string; 
    location?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
    signType?: 'static' | 'dynamic';
    motionDirection?: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
  } | null>(null);
  const [lockedPoseStatus, setLockedPoseStatus] = useState<string>('');
  const [lockedPoseInfo, setLockedPoseInfo] = useState<{ 
    label: string; 
    signature: any; 
    location?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
    signType?: 'static' | 'dynamic';
    motionDirection?: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
  } | null>(null);
  const [liveGestureName, setLiveGestureName] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [poseCaptureNotice, setPoseCaptureNotice] = useState<string>('');

  const BASE_SIGN_IDS = ['sign-namaste', 'sign-paani', 'sign-madad', 'sign-haan', 'sign-nahi', 'sign-dhanyavaad', 'sign-doctor', 'sign-khana', 'sign-library', 'sign-attendance', 'sign-good-morning', 'sign-alvida'];
  const customSigns = allSigns.filter(s => !BASE_SIGN_IDS.includes(s.id));
  const activeTabRef = useRef<'interpret' | 'train' | 'reverse'>('interpret');
  const customSignsRef = useRef<CustomSign[]>([]);
  const allSignsRef = useRef<CustomSign[]>([]);
  const activeSignIdsRef = useRef<Set<string>>(new Set());
  const activeSignNamesRef = useRef<Set<string>>(new Set());

  // Helper to get nice emoji icon for any sign name
  const getSignEmoji = (name: string) => {
    if (name.includes('शुभ प्रभात') || name.includes('Morning')) return '🌅';
    if (name.includes('अलविदा') || name.includes('Bye')) return '👋';
    if (name.includes('नमस्ते') || name.includes('Hello')) return '✋';
    if (name.includes('पानी') || name.includes('Water')) return '🤏';
    if (name.includes('मदद') || name.includes('SOS') || name.includes('Help')) return '🤙';
    if (name.includes('लाइब्रेरी') || name.includes('Library')) return '✌️';
    if (name.includes('अटेंडेंस') || name.includes('Attendance')) return '☝️';
    if (name.includes('हाँ') || name.includes('Yes')) return '👍';
    if (name.includes('नहीं') || name.includes('No')) return '👎';
    if (name.includes('खाना') || name.includes('Food')) return '🤌';
    if (name.includes('डॉक्टर') || name.includes('Doctor')) return '🩺';
    if (name.includes('धन्यवाद') || name.includes('आभार') || name.includes('Thank')) return '🙏';
    return '✨';
  };

  // STRICT: A sign is active ONLY if it is currently in the dictionary (allSigns)
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
  const computeBodyLocation = (lm: any[], face: any | null): { location: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'; label: string; icon: string } => {
    if (!lm || lm.length === 0) return { location: 'neutral', label: 'हाथ नहीं दिख रहा', icon: '✋' };

    const indexTip = lm[8];
    const middleMcp = lm[9];

    // Reference focal point: tip of fingers or center of palm
    const handY = Math.min(indexTip.y, middleMcp.y);
    const handX = (middleMcp.x + indexTip.x) / 2;

    if (face && face.boundingBox) {
      const box = face.boundingBox;
      const faceX = box.xCenter;
      const faceY = box.yCenter;
      const faceW = box.width;
      const faceH = box.height;

      const topOfHead = faceY - faceH * 0.5;
      const eyesY = face.landmarks ? (face.landmarks[0].y + face.landmarks[1].y) / 2 : topOfHead + faceH * 0.35;
      const mouthY = face.landmarks ? face.landmarks[3].y : faceY + faceH * 0.28;
      const chinY = faceY + faceH * 0.5;

      // Cheek points
      const cheekR = face.landmarks ? face.landmarks[4] : { x: faceX - faceW * 0.45, y: faceY };
      const cheekL = face.landmarks ? face.landmarks[5] : { x: faceX + faceW * 0.45, y: faceY };

      const distToCheekR = Math.hypot(handX - cheekR.x, handY - cheekR.y);
      const distToCheekL = Math.hypot(handX - cheekL.x, handY - cheekL.y);

      // 1. Forehead zone (top of head down to eyes)
      if (handY <= eyesY + faceH * 0.06 && Math.abs(handX - faceX) < faceW * 0.95) {
        return { location: 'forehead', label: 'माथा (Forehead)', icon: '👤' };
      }

      // 2. Cheek / Ear zone (sides of face)
      if (handY > topOfHead + faceH * 0.20 && handY < chinY + faceH * 0.15 && (distToCheekR < faceW * 0.60 || distToCheekL < faceW * 0.60)) {
        return { location: 'cheek', label: 'गाल / कान (Cheek)', icon: '👂' };
      }

      // 3. Chin / Mouth zone (mouth level down to slightly below chin)
      if (Math.abs(handY - chinY) < faceH * 0.45 && Math.abs(handX - faceX) < faceW * 0.95) {
        return { location: 'chin', label: 'ठोड़ी / मुंह (Chin)', icon: '🗣️' };
      }

      // 4. Chest / Torso zone (below chin to chest level)
      if (handY >= chinY + faceH * 0.15 && handY <= chinY + faceH * 2.5 && Math.abs(handX - faceX) < faceW * 1.8) {
        return { location: 'chest', label: 'छाती (Chest)', icon: '🫀' };
      }
    }

    // Camera normalized fallback if face is not fully detected
    if (handY < 0.32) {
      return { location: 'forehead', label: 'माथा (Forehead)', icon: '👤' };
    } else if (handY >= 0.32 && handY < 0.58) {
      return { location: 'chin', label: 'ठोड़ी (Chin)', icon: '🗣️' };
    } else if (handY >= 0.58 && handY < 0.88) {
      return { location: 'chest', label: 'छाती (Chest)', icon: '🫀' };
    }

    return { location: 'neutral', label: 'खुला स्पेस (Neutral)', icon: '✋' };
  };

  // 4c. Draw Holographic Target Anchors on Camera Canvas
  const drawBodyAnchors = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    face: any | null,
    activeLoc: string
  ) => {
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
      { id: 'forehead', ...foreheadPt, defaultColor: 'rgba(192, 132, 252, 0.65)', activeColor: '#c084fc', icon: '👤' },
      { id: 'chin', ...chinPt, defaultColor: 'rgba(251, 191, 36, 0.65)', activeColor: '#fbbf24', icon: '🗣️' },
      { id: 'chest', ...chestPt, defaultColor: 'rgba(56, 189, 248, 0.65)', activeColor: '#38bdf8', icon: '🫀' }
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

  // 6. Draw Skeleton & Classify Gestures
  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the camera or video frame to canvas
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // 1. Detect Hand Location relative to Face/Chest anchors
    const face = latestFaceRef.current;
    let currentBodyLoc: { location: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'; label: string; icon: string } = {
      location: 'neutral',
      label: 'खुला स्पेस (Neutral)',
      icon: '✋'
    };

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      lastHandSeenTimeRef.current = Date.now();
      currentBodyLoc = computeBodyLocation(results.multiHandLandmarks[0], face);
      latestBodyLocationRef.current = currentBodyLoc;
      setDetectedLocation(currentBodyLoc.location);
      setDetectedLocationLabel(`${currentBodyLoc.icon} ${currentBodyLoc.label}`);

      // Track Hand Motion & Trajectory Vector
      updateMotionTrajectory(results.multiHandLandmarks[0][0]);
    } else {
      setDetectedLocation('neutral');
      setDetectedLocationLabel('✋ हाथ नहीं दिख रहा');
      latestMotionRef.current = { direction: 'none', label: '⏸️ स्थिर (Static)', speed: 0, isMoving: false };
      setCurrentMotion(latestMotionRef.current);
      motionHistoryRef.current = [];

      // When hands are lowered for > 650ms, gracefully clear current sign badge and buffer
      if (Date.now() - lastHandSeenTimeRef.current > 650) {
        setCurrentSign('');
        setLiveGestureName('');
        lastSpokenSignRef.current = '';
        recentDetectionsRef.current = [];
      }
    }

    // 2. Draw visual body anchors on canvas
    drawBodyAnchors(ctx, canvas.width, canvas.height, face, currentBodyLoc.location);

    // 3. Draw holographic motion trajectory trail
    drawMotionTrajectory(ctx, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandsDetectedCount(results.multiHandLandmarks.length);
      latestRawLandmarksRef.current = results.multiHandLandmarks[0];
      lastStableLandmarksRef.current = results.multiHandLandmarks[0];
      lastStableTimeRef.current = Date.now();

      for (const landmarks of results.multiHandLandmarks) {
        // Draw Skeleton Connections
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
            color: '#10b981',
            lineWidth: 4
          });
        }
        // Draw Keypoint Circles
        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, landmarks, {
            color: '#38bdf8',
            lineWidth: 2,
            radius: 5
          });
        }

        // Run Upgraded Geometric Classifier
        analyzeFingersAndClassify(landmarks, ctx, canvas.width, canvas.height);
      }
    } else {
      latestRawLandmarksRef.current = null;
      setHandsDetectedCount(0);
      setFingerStates('हाथ नहीं दिख रहा...');
      recentDetectionsRef.current = [];
      lastSpokenSignRef.current = '';
    }
    ctx.restore();
  };

  // High-Precision Scale & Rotation Invariant Geometric Sign Classifier
  const analyzeFingersAndClassify = (lm: any[], ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const wrist = lm[0];
    const thumbCmc = lm[1];
    const thumbMcp = lm[2];
    const thumbIp = lm[3];
    const thumbTip = lm[4];

    const indexMcp = lm[5];
    const indexPip = lm[6];
    const indexDip = lm[7];
    const indexTip = lm[8];

    const middleMcp = lm[9];
    const middlePip = lm[10];
    const middleDip = lm[11];
    const middleTip = lm[12];

    const ringMcp = lm[13];
    const ringPip = lm[14];
    const ringDip = lm[15];
    const ringTip = lm[16];

    const pinkyMcp = lm[17];
    const pinkyPip = lm[18];
    const pinkyDip = lm[19];
    const pinkyTip = lm[20];

    // Reference Palm Scale (wrist to middle MCP) to make checks distance-invariant
    const palmSize = Math.max(dist(wrist, middleMcp), 0.05);

    // True Euclidean Joint Angle & Distance Invariant Finger Extension (No screen-Y dependencies!)
    // When a finger is curled into the palm, its tip is closer to the wrist/MCP than its PIP joint:
    const isIndexOpen = dist(indexTip, wrist) > dist(indexPip, wrist) * 1.10 && dist(indexTip, indexMcp) > dist(indexPip, indexMcp) * 1.05;
    const isMiddleOpen = dist(middleTip, wrist) > dist(middlePip, wrist) * 1.10 && dist(middleTip, middleMcp) > dist(middlePip, middleMcp) * 1.05;
    const isRingOpen = dist(ringTip, wrist) > dist(ringPip, wrist) * 1.10 && dist(ringTip, ringMcp) > dist(ringPip, ringMcp) * 1.05;
    const isPinkyOpen = dist(pinkyTip, wrist) > dist(pinkyPip, wrist) * 1.10 && dist(pinkyTip, pinkyMcp) > dist(pinkyPip, pinkyMcp) * 1.05;

    // Thumb extension & orientation
    const isThumbOpen = dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.18 && dist(thumbTip, indexMcp) > palmSize * 0.38;
    const thumbPointsUp = thumbTip.y < thumbMcp.y && (wrist.y - thumbTip.y) > palmSize * 0.25;
    const thumbPointsDown = thumbTip.y > wrist.y && thumbTip.y > thumbMcp.y;

    // Pinch & Clustering
    const isIndexThumbPinch = dist(thumbTip, indexTip) < palmSize * 0.38;
    const isFoodPinch = dist(thumbTip, indexTip) < palmSize * 0.45 && dist(thumbTip, middleTip) < palmSize * 0.5 && dist(indexTip, middleTip) < palmSize * 0.45;

    // Proximity between index and middle:
    const indexMiddleApart = dist(indexTip, middleTip) > palmSize * 0.30;
    const indexMiddleTogether = dist(indexTip, middleTip) < palmSize * 0.28;

    // Global finger counts:
    const allFourOpen = isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen;
    const allFourClosed = !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen;
    const openCount = (isIndexOpen ? 1 : 0) + (isMiddleOpen ? 1 : 0) + (isRingOpen ? 1 : 0) + (isPinkyOpen ? 1 : 0);

    const stateDesc = `तर्जनी: ${isIndexOpen ? 'खुली' : 'मुड़ी'} | मध्यमा: ${isMiddleOpen ? 'खुली' : 'मुड़ी'} | अनामिका: ${isRingOpen ? 'खुली' : 'मुड़ी'} | कनिष्ठिका: ${isPinkyOpen ? 'खुली' : 'मुड़ी'}`;
    setFingerStates(stateDesc);

    let gestureSummary = '';
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      gestureSummary = '✌️ २ उंगलियां (तर्जनी + मध्यमा)';
    } else if (isIndexOpen && isMiddleOpen && isRingOpen && !isPinkyOpen) {
      gestureSummary = '३ उंगलियां (W आकार)';
    } else if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      gestureSummary = '☝️ १ उंगली (तर्जनी)';
    } else if (allFourOpen) {
      gestureSummary = '✋ खुला हाथ (नमस्ते)';
    } else if (allFourClosed && (isThumbOpen || thumbPointsUp)) {
      gestureSummary = '👍 अंगूठा ऊपर (हाँ)';
    } else if (allFourClosed) {
      gestureSummary = '✊ मुट्ठी';
    } else {
      gestureSummary = `${openCount} उंगलियां खुली`;
    }
    setLiveGestureName(gestureSummary);

    // Save live finger signature snapshot for custom sign training
    const currentSig = {
      thumb: isThumbOpen,
      index: isIndexOpen,
      middle: isMiddleOpen,
      ring: isRingOpen,
      pinky: isPinkyOpen,
      thumbPointsUp,
      isPinch: isIndexThumbPinch
    };
    latestFingerSignatureRef.current = currentSig;
    lastStableSignatureRef.current = currentSig;

    let detected = '';
    let conf = 0.95;

    // CRITICAL: If no signs exist in the active dictionary, DO NOT DETECT ANYTHING!
    if (activeSignNamesRef.current.size === 0 && activeSignIdsRef.current.size === 0) {
      return;
    }

    // 0. Match trained signs from the active dictionary
    const activeSignsToMatch = allSignsRef.current.length > 0 ? allSignsRef.current : allSigns;
    for (const sign of activeSignsToMatch) {
      if (!isSignActive(sign.id, sign.nameHindi)) continue;
      if (!sign.fingerSignature && (!sign.landmarksSample || sign.landmarksSample.length !== 21)) continue;
      let isMatch = false;

        // Check body location matching if specified
        if (sign.bodyLocation && sign.bodyLocation !== 'neutral') {
          if (latestBodyLocationRef.current.location !== sign.bodyLocation) {
            continue; // Location mismatch: skip this sign (e.g. sign is on forehead, but hand is at chin)
          }
        }

        // Check dynamic motion direction matching if specified
        if (sign.signType === 'dynamic' || (sign.motionDirection && sign.motionDirection !== 'none')) {
          if (latestMotionRef.current.direction !== sign.motionDirection) {
            continue; // Motion mismatch: skip (e.g. sign requires upward motion, but hand is moving downward or static)
          }
        }

        // Method A: Deterministic Finger Topology Signature (100% invariant to scale and rotation)
        if (sign.fingerSignature) {
          const sig = sign.fingerSignature;

          // Check if 4 main fingers match exactly:
          const fourFingersMatch = 
            Boolean(sig.index) === isIndexOpen &&
            Boolean(sig.middle) === isMiddleOpen &&
            Boolean(sig.ring) === isRingOpen &&
            Boolean(sig.pinky) === isPinkyOpen;

          if (fourFingersMatch) {
            // If sign is pinch-specific, verify pinch
            if (sig.isPinch && !isIndexThumbPinch) {
              isMatch = false;
            } else {
              isMatch = true;
            }
          }
        }

        // Method B: Normalized 21-Landmark Distance Check
        if (!isMatch && sign.landmarksSample && sign.landmarksSample.length === 21) {
          let diffSum = 0;
          for (let i = 0; i < 21; i++) {
            const currDx = (lm[i].x - wrist.x) / palmSize;
            const currDy = (lm[i].y - wrist.y) / palmSize;
            const currDz = (lm[i].z - wrist.z) / palmSize;

            const sampleDx = sign.landmarksSample[i][0];
            const sampleDy = sign.landmarksSample[i][1];
            const sampleDz = sign.landmarksSample[i][2];

            diffSum += Math.hypot(currDx - sampleDx, currDy - sampleDy, currDz - sampleDz);
          }
          const avgDiff = diffSum / 21;
          if (avgDiff < 0.60) {
            isMatch = true;
          }
        }

        if (isMatch) {
          detected = sign.nameHindi;
          break;
        }
      }

    // 1. Shaka / SOS (🤙 मदद चाहिए / Emergency): Thumb + Pinky open, middle 3 curled, wide spread
    const isSosGesture = (isThumbOpen || thumbPointsUp) && isPinkyOpen && !isIndexOpen && !isMiddleOpen && !isRingOpen && dist(thumbTip, pinkyTip) > palmSize * 0.70;

    // 2. Thumbs Up (👍 हाँ / Yes): Thumb pointing up, fingers curled, Pinky MUST be closed
    const isThumbsUpGesture = thumbPointsUp && (isThumbOpen || dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.10) &&
                              !isPinkyOpen && !isRingOpen &&
                              (allFourClosed || openCount <= 1) &&
                              (Date.now() - lastSosTimeRef.current > 1500);

    // 3. Thumbs Down (👎 नहीं / No): Thumb pointing down, fingers curled, Pinky closed
    const isThumbsDownGesture = thumbPointsDown && !isPinkyOpen && (allFourClosed || openCount <= 1) &&
                                (Date.now() - lastSosTimeRef.current > 1500);

    if (!detected) {
      const motion = latestMotionRef.current;
      const currentLoc = latestBodyLocationRef.current.location;

      // 1. SPECIFIC STATIC FINGER GESTURES (Only if active and has NO custom trained sample)
      if (isSosGesture && isBaselineWithoutCustomData('sign-madad', 'मदद चाहिए (SOS)')) {
        detected = 'मदद चाहिए (SOS)';
        lastSosTimeRef.current = Date.now();
        recentDetectionsRef.current = recentDetectionsRef.current.filter(s => s !== 'हाँ');
      }
      else if (isThumbsUpGesture && currentLoc !== 'forehead' && isBaselineWithoutCustomData('sign-haan', 'हाँ')) {
        detected = 'हाँ';
      }
      else if (isThumbsDownGesture && currentLoc !== 'forehead' && isBaselineWithoutCustomData('sign-nahi', 'नहीं')) {
        detected = 'नहीं';
      }
      // 4. Food / Hunger (🤌 खाना): All fingertips clustered together
      else if (isFoodPinch && !isRingOpen && !isPinkyOpen && isBaselineWithoutCustomData('sign-khana', 'खाना')) {
        detected = 'खाना';
      }
      // 5. Attendance (☝️ अटेंडेंस): Index finger alone pointing UP
      else if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen && isBaselineWithoutCustomData('sign-attendance', 'अटेंडेंस')) {
        detected = 'अटेंडेंस';
      }
      // 6. College Library (✌️ लाइब्रेरी - V / Peace Sign): Index + Middle open & spread, Ring + Pinky closed
      else if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen && indexMiddleApart && currentLoc !== 'forehead' && isBaselineWithoutCustomData('sign-library', 'लाइब्रेरी (कॉलेज)')) {
        detected = 'लाइब्रेरी (कॉलेज)';
      }
      // 7. Doctor (🩺 डॉक्टर): Index + Middle together or 3-finger medical pulse gesture
      else if (((isIndexOpen && isMiddleOpen && isRingOpen && !isPinkyOpen && dist(indexTip, ringTip) < palmSize * 0.45) ||
               (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen && indexMiddleTogether && currentLoc !== 'forehead')) && isBaselineWithoutCustomData('sign-doctor', 'डॉक्टर')) {
        detected = 'डॉक्टर';
      }
      // 8. Water (💧 पानी): "W" 3-finger sign (Index + Middle + Ring open spread) OR Pinch 🤏
      else if (((isIndexOpen && isMiddleOpen && isRingOpen && !isPinkyOpen) || (isIndexThumbPinch && !isMiddleOpen && !isRingOpen)) && isBaselineWithoutCustomData('sign-paani', 'पानी')) {
        detected = 'पानी';
      }
      // 9. Chest Resting Gestures (आभार / धन्यवाद) - Hand resting on chest
      else if (currentLoc === 'chest' && !motion.isMoving && (allFourOpen || openCount >= 4) && isBaselineWithoutCustomData('sign-dhanyavaad', 'धन्यवाद')) {
        detected = 'आभार';
      }
      // 2. DYNAMIC GESTURES (Only when hand is actually in transit and not resting on chest)
      // Dynamic Gesture 1: Good Morning (शुभ प्रभात) — Active UPWARD hand rising with open palm
      else if (motion.direction === 'upward' && motion.isMoving && motion.speed > 0.20 && currentLoc !== 'chest' && (allFourOpen || openCount >= 4) && isBaselineWithoutCustomData('sign-good-morning', 'शुभ प्रभात (Good Morning)')) {
        detected = 'शुभ प्रभात (Good Morning)';
      }
      // Dynamic Gesture 2: Goodbye / Bye (अलविदा) — Active side-to-side WAVING with open palm
      else if (motion.direction === 'wave' && motion.isMoving && motion.speed > 0.22 && currentLoc !== 'chest' && (allFourOpen || openCount >= 4) && isBaselineWithoutCustomData('sign-alvida', 'अलविदा (Bye)')) {
        detected = 'अलविदा (Bye)';
      }
      // Dynamic Gesture 3: Thank You (धन्यवाद) — Moving outward from chin or chest
      else if (motion.direction === 'outward' && motion.isMoving && (currentLoc === 'chin' || currentLoc === 'chest') && (allFourOpen || openCount >= 3) && isBaselineWithoutCustomData('sign-dhanyavaad', 'धन्यवाद')) {
        detected = 'धन्यवाद';
      }
      // 10. Thank You (🙏 धन्यवाद): Flat hand salute or fingers closed together
      else if (allFourOpen && indexMiddleTogether && !isThumbOpen && isBaselineWithoutCustomData('sign-dhanyavaad', 'धन्यवाद')) {
        detected = 'धन्यवाद';
      }
      // 11. Namaste (✋ नमस्ते): Open palm held steady in neutral/chest position, strictly NOT while in motion
      else if (!motion.isMoving && allFourOpen && isThumbOpen && (currentLoc === 'neutral' || currentLoc === 'chest') && isBaselineWithoutCustomData('sign-namaste', 'नमस्ते')) {
        detected = 'नमस्ते';
      }
    }

    if (detected) {
      // Draw detection badge directly on canvas
      ctx.fillStyle = 'rgba(16, 185, 129, 0.90)';
      ctx.roundRect ? ctx.roundRect(15, 15, 240, 48, 10) : ctx.fillRect(15, 15, 240, 48);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillText(`✓ ${detected}`, 30, 47);

      // Smooth Rolling Voting Buffer (tolerant to occasional dropped frames)
      const buffer = recentDetectionsRef.current;
      buffer.push(detected);
      if (buffer.length > 9) {
        buffer.shift();
      }

      // Count occurrences of 'detected' in recent frames
      const matchCount = buffer.filter(s => s === detected).length;

      // Threshold: 6 frames (~240ms) of rock-solid hold before confirming
      const requiredMatches = 6;

      if (matchCount >= requiredMatches) {
        setCurrentSign(detected);
        setConfidence(conf);

        const now = Date.now();
        const isSOS = detected === 'मदद चाहिए (SOS)';
        const elapsedSinceSpoken = now - lastSpokenTimeRef.current;

        // Speak when gesture changes AND cooldown has elapsed (2200ms) OR if emergency SOS
        if ((detected !== lastSpokenSignRef.current && elapsedSinceSpoken > 2200) || (isSOS && detected !== lastSpokenSignRef.current)) {
          lastSpokenSignRef.current = detected;
          lastSpokenTimeRef.current = now;

          if (isSOS) {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            setSentenceTokens(prev => prev.filter(token => token !== 'हाँ'));
            speakHindi(detected, true); // Force SOS immediately
          } else if (activeTabRef.current === 'interpret') {
            speakHindi(detected, false);
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
      // Gradually drain buffer when hand is transitioning or relaxing
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

    lockedPoseRef.current = {
      landmarks: rawLm,
      signature: sig,
      name: newSignHindi.trim() || 'Custom Sign',
      label: summary + motionSummary,
      location: currentLoc.location,
      signType: isDyn ? 'dynamic' : 'static',
      motionDirection: isDyn ? liveMotion.direction : 'none'
    };
    setLockedPoseStatus(`✅ पोज़ लॉक: ${summary} [📍 ${currentLoc.label}]${motionSummary}`);
    setLockedPoseInfo({ 
      label: summary + motionSummary, 
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

        lockedPoseRef.current = {
          landmarks: lm,
          signature: sig,
          name: newSignHindi.trim() || 'Custom Sign',
          label: summary + motionSummary,
          location: currentLoc.location,
          signType: isDyn ? 'dynamic' : 'static',
          motionDirection: isDyn ? liveMotion.direction : 'none'
        };
        setLockedPoseStatus(`✅ पोज़ लॉक: ${summary} [📍 ${currentLoc.label}]${motionSummary}`);
        setLockedPoseInfo({ 
          label: summary + motionSummary, 
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
          fingerSignature: fingerSig || latestFingerSignatureRef.current || null,
          bodyLocation: locationToSave,
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

            {/* Detected Badge */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              background: 'rgba(10, 14, 23, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>पहचाना गया इशारा</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', margin: 0 }}>
                  {currentSign}
                </h3>
              </div>

              {/* Real-time Hand Body Location Pill */}
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

              {/* Real-time Hand Motion Trajectory Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentMotion.isMoving ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${currentMotion.isMoving ? '#06b6d4' : 'rgba(255, 255, 255, 0.15)'}`,
                transition: 'all 0.2s ease'
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

              {isSpeaking && (
                <div style={{ display: 'flex', gap: '3px' }}>
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                  <span className="audio-bar" />
                </div>
              )}
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
                  {cameraActive ? (handsDetectedCount > 0 ? '✋ हाथ लाइव' : '⚠️ हाथ दिखाएं') : '📷 कैमरा बंद'}
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
      </div>
  );
}
