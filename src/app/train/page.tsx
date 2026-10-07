'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Camera, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, 
  RotateCcw, Sparkles, Check, Info, ShieldCheck, ChevronRight
} from 'lucide-react';
import { CustomSign, FingerSignature, TwoHandRelation } from '@/lib/types';
import { getMergedSigns, saveSignPersistently } from '@/lib/storage-sync';

// Web Audio API beep generator (0 external assets required)
const playBeep = (freq: number = 600, duration: number = 0.15) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export default function SignTrainerPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraErrorNotice, setCameraErrorNotice] = useState<string>('');
  
  // Step 1: Sign Meta Details
  const [signNameHindi, setSignNameHindi] = useState<string>('');
  const [signNameEnglish, setSignNameEnglish] = useState<string>('');
  const [signCategory, setSignCategory] = useState<'college' | 'daily' | 'emergency' | 'alphabet' | 'number' | 'custom'>('college');
  const [trainHandsCount, setTrainHandsCount] = useState<1 | 2>(1);
  const [trainHandType, setTrainHandType] = useState<'right' | 'left' | 'both' | 'any'>('right');
  const [targetLocation, setTargetLocation] = useState<'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'>('neutral');
  const [signType, setSignType] = useState<'static' | 'dynamic'>('static');
  const [motionDirection, setMotionDirection] = useState<'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left'>('none');

  // Step 2: 3-2-1 Countdown & Pose Capture
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [capturedPose, setCapturedPose] = useState<{
    landmarks: number[][];
    fingerSignature: any;
    bodyLocation: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
    motionDirection?: string;
  } | null>(null);

  // Step 3: Test & Conflict Check
  const [existingSigns, setExistingSigns] = useState<CustomSign[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string>('');
  const [liveTestMatchScore, setLiveTestMatchScore] = useState<number>(0);
  const [isTestMatched, setIsTestMatched] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Live Vision State
  const [detectedLocation, setDetectedLocation] = useState<'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral'>('neutral');
  const [detectedLocationLabel, setDetectedLocationLabel] = useState<string>('✋ खुला स्पेस (Neutral)');
  const [fingerStates, setFingerStates] = useState<string>('इंतज़ार कर रहे हैं...');

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<any>(null);
  const faceDetectionRef = useRef<any>(null);
  const latestFaceRef = useRef<any>(null);
  const latestLandmarksRef = useRef<any[] | null>(null);
  const latestFingerSignatureRef = useRef<any>(null);
  const latestBodyLocationRef = useRef<any>({ location: 'neutral', label: 'खुला स्पेस' });
  const animationFrameRef = useRef<number | null>(null);

  // Motion Vector Tracking
  const motionHistoryRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const latestMotionRef = useRef<{ direction: string; isMoving: boolean }>({ direction: 'none', isMoving: false });

  // Load existing signs for conflict detection and prefill from URL params
  useEffect(() => {
    getMergedSigns().then(setExistingSigns).catch(() => {});

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('name');
      const nameEn = params.get('nameEn');
      const cat = params.get('category') as any;
      const loc = params.get('location') as any;
      const stype = params.get('type') as any;
      const mot = params.get('motion') as any;

      if (name) setSignNameHindi(name);
      if (nameEn) setSignNameEnglish(nameEn);
      if (cat && ['college', 'daily', 'emergency'].includes(cat)) setSignCategory(cat);
      if (loc && ['forehead', 'chin', 'cheek', 'chest', 'neutral'].includes(loc)) setTargetLocation(loc);
      if (stype && ['static', 'dynamic'].includes(stype)) setSignType(stype);
      if (mot && ['none', 'upward', 'downward', 'outward', 'wave', 'to_right', 'to_left'].includes(mot)) setMotionDirection(mot);
    }
  }, []);

  // Initialize Camera & MediaPipe
  useEffect(() => {
    let checkInterval: any = null;
    const initVision = () => {
      if (typeof window !== 'undefined' && window.Hands && window.FaceDetection) {
        if (!handsRef.current) {
          const hands = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
          });
          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
          });
          hands.onResults(handleResults);
          handsRef.current = hands;
        }

        if (!faceDetectionRef.current) {
          const face = new window.FaceDetection({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`
          });
          face.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
          face.onResults((faceRes: any) => {
            if (faceRes.detections && faceRes.detections.length > 0) {
              latestFaceRef.current = faceRes.detections[0];
            } else {
              latestFaceRef.current = null;
            }
          });
          faceDetectionRef.current = face;
        }

        if (checkInterval) clearInterval(checkInterval);
        startCamera();
      }
    };

    checkInterval = setInterval(initVision, 500);
    return () => {
      if (checkInterval) clearInterval(checkInterval);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraErrorNotice('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraErrorNotice('ब्राउज़र में कैमरा API उपलब्ध नहीं है।');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            try { await videoRef.current.play(); } catch (e) {}
            if (videoRef.current.videoWidth && videoRef.current.videoHeight && canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            setCameraActive(true);
            startLoop();
          }
        };
      }
    } catch (err: any) {
      setCameraErrorNotice('कैमरा परमिशन दें या कैमरा कनेक्ट करें।');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startLoop = () => {
    let frameCount = 0;
    const loop = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        frameCount++;
        if (handsRef.current) {
          try { await handsRef.current.send({ image: videoRef.current }); } catch (e) {}
        }
        if (faceDetectionRef.current && frameCount % 3 === 0) {
          try { await faceDetectionRef.current.send({ image: videoRef.current }); } catch (e) {}
        }
      }
      if (videoRef.current && !videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  // Distance helper
  const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const computeHandDirection = (lm: any[]): { direction: 'up' | 'horizontal_head' | 'forward' | 'down'; label: string; icon: string } => {
    if (!lm || lm.length < 21) return { direction: 'up', label: 'ऊपर सीधी', icon: '⬆️' };
    const indexKnuckle = lm[5];
    const indexTip = lm[8];
    const dx = indexTip.x - indexKnuckle.x;
    const dy = indexTip.y - indexKnuckle.y;

    if (Math.abs(dx) > Math.abs(dy) * 0.70 && Math.abs(dx) > 0.05) {
      return { direction: 'horizontal_head', label: 'माथा/कनपटी (क्षैतिज)', icon: '👈' };
    }
    if (dy < -0.06 && Math.abs(dy) >= Math.abs(dx) * 0.85) {
      return { direction: 'up', label: 'ऊपर सीधी', icon: '⬆️' };
    }
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


  type BodyLocation = 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';

  // Body Location Determination
  const computeLocation = (lm: any[], face: any | null): { location: BodyLocation; label: string; icon: string } => {
    if (!lm || lm.length === 0) return { location: 'neutral', label: 'हाथ नहीं दिख रहा', icon: '✋' };
    const handY = Math.min(lm[8].y, lm[9].y);
    const handX = (lm[9].x + lm[8].x) / 2;

    if (face && face.boundingBox) {
      const box = face.boundingBox;
      const faceY = box.yCenter;
      const faceH = box.height;
      const chinY = faceY + faceH * 0.5;

      if (handY < chinY - faceH * 0.25) {
        return { location: 'forehead', label: 'माथा (Forehead)', icon: '👤' };
      } else if (handY >= chinY - faceH * 0.25 && handY <= chinY + faceH * 0.20) {
        return { location: 'chin', label: 'ठोड़ी (Chin)', icon: '🗣️' };
      } else if (handY > chinY + faceH * 0.20 && handY <= chinY + faceH * 2.2) {
        return { location: 'chest', label: 'छाती (Chest)', icon: '🫀' };
      }
    }

    if (handY < 0.32) return { location: 'forehead', label: 'माथा (Forehead)', icon: '👤' };
    if (handY >= 0.32 && handY < 0.58) return { location: 'chin', label: 'ठोड़ी (Chin)', icon: '🗣️' };
    if (handY >= 0.58 && handY < 0.88) return { location: 'chest', label: 'छाती (Chest)', icon: '🫀' };

    return { location: 'neutral', label: 'खुला स्पेस (Neutral)', icon: '✋' };
  };

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
    let currentLoc: { location: BodyLocation; label: string; icon: string } = { location: 'neutral', label: 'खुला स्पेस', icon: '✋' };

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm = results.multiHandLandmarks[0];
      latestLandmarksRef.current = lm;
      currentLoc = computeLocation(lm, face);
      latestBodyLocationRef.current = currentLoc;
      setDetectedLocation(currentLoc.location);
      setDetectedLocationLabel(`${currentLoc.icon} ${currentLoc.label}`);

      // Track trajectory
      const wrist = lm[0];
      motionHistoryRef.current.push({ x: wrist.x, y: wrist.y, time: Date.now() });
      if (motionHistoryRef.current.length > 15) motionHistoryRef.current.shift();

      if (motionHistoryRef.current.length >= 6) {
        const first = motionHistoryRef.current[0];
        const last = motionHistoryRef.current[motionHistoryRef.current.length - 1];
        const dy = first.y - last.y; // positive is upward
        if (dy > 0.04) {
          latestMotionRef.current = { direction: 'upward', isMoving: true };
        } else if (dy < -0.04) {
          latestMotionRef.current = { direction: 'downward', isMoving: true };
        } else {
          latestMotionRef.current = { direction: 'none', isMoving: false };
        }
      }

      // Draw skeleton connectors
      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, { color: '#10b981', lineWidth: 4 });
      }
      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, lm, { color: '#38bdf8', lineWidth: 2, radius: 4 });
      }

      // Compute finger topology signature
      const palmSize = dist(lm[0], lm[9]) || 0.1;
      const isThumbOpen = dist(lm[4], lm[9]) > palmSize * 0.90;
      const isIndexOpen = dist(lm[8], lm[0]) > dist(lm[6], lm[0]) * 1.15;
      const isMiddleOpen = dist(lm[12], lm[0]) > dist(lm[10], lm[0]) * 1.15;
      const isRingOpen = dist(lm[16], lm[0]) > dist(lm[14], lm[0]) * 1.15;
      const isPinkyOpen = dist(lm[20], lm[0]) > dist(lm[18], lm[0]) * 1.15;
      const isIndexThumbPinch = dist(lm[4], lm[8]) < palmSize * 0.35;

      const sig = {
        thumb: isThumbOpen,
        index: isIndexOpen,
        middle: isMiddleOpen,
        ring: isRingOpen,
        pinky: isPinkyOpen,
        isPinch: isIndexThumbPinch
      };
      latestFingerSignatureRef.current = sig;

      setFingerStates(
        `तर्जनी: ${isIndexOpen ? 'खुली' : 'मुड़ी'} | मध्यमा: ${isMiddleOpen ? 'खुली' : 'मुड़ी'} | अनामिका: ${isRingOpen ? 'खुली' : 'मुड़ी'} | कनिष्ठिका: ${isPinkyOpen ? 'खुली' : 'मुड़ी'}`
      );

      // In Step 3: Compute live match with captured pose
      if (capturedPose && capturedPose.fingerSignature) {
        const cSig = capturedPose.fingerSignature;
        const matches = [
          cSig.index === isIndexOpen,
          cSig.middle === isMiddleOpen,
          cSig.ring === isRingOpen,
          cSig.pinky === isPinkyOpen
        ].filter(Boolean).length;

        const locMatch = capturedPose.bodyLocation === 'neutral' || capturedPose.bodyLocation === currentLoc.location;
        const score = Math.round((matches / 4) * 80 + (locMatch ? 20 : 0));
        setLiveTestMatchScore(score);
        setIsTestMatched(score >= 80);
      }
    } else {
      setDetectedLocation('neutral');
      setDetectedLocationLabel('✋ हाथ नहीं दिख रहा');
      setFingerStates('हाथ कैमरा के सामने लाएं');
      setLiveTestMatchScore(0);
      setIsTestMatched(false);
    }

    // Draw visual body anchors
    drawAnchors(ctx, canvas.width, canvas.height, face, targetLocation);

    ctx.restore();
  };

  const drawAnchors = (ctx: CanvasRenderingContext2D, width: number, height: number, face: any, target: string) => {
    let foreheadPt = { x: width * 0.5, y: height * 0.22, label: 'माथा' };
    let chinPt = { x: width * 0.5, y: height * 0.44, label: 'ठोड़ी' };
    let chestPt = { x: width * 0.5, y: height * 0.72, label: 'छाती' };

    if (face && face.boundingBox) {
      const b = face.boundingBox;
      const fx = b.xCenter * width;
      const fy = b.yCenter * height;
      const fh = b.height * height;
      foreheadPt = { x: fx, y: fy - fh * 0.38, label: 'माथा' };
      chinPt = { x: fx, y: fy + fh * 0.50, label: 'ठोड़ी' };
      chestPt = { x: fx, y: fy + fh * 1.30, label: 'छाती' };
    }

    const anchors = [
      { id: 'forehead', ...foreheadPt, color: '#c084fc' },
      { id: 'chin', ...chinPt, color: '#fbbf24' },
      { id: 'chest', ...chestPt, color: '#38bdf8' }
    ];

    anchors.forEach(a => {
      const isTarget = a.id === target;
      ctx.save();
      ctx.beginPath();
      ctx.arc(a.x, a.y, isTarget ? 22 : 14, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? a.color : 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = a.color;
      ctx.lineWidth = isTarget ? 3 : 1.5;
      ctx.stroke();
      if (isTarget) ctx.fill();

      ctx.fillStyle = isTarget ? '#000000' : '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.label, a.x, a.y);
      ctx.restore();
    });
  };

  // 3-2-1 Countdown Trigger for Hands-Free Capture
  const startCountdownCapture = () => {
    if (isCountingDown) return;
    setIsCountingDown(true);
    setCountdownNum(3);
    playBeep(440, 0.12);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNum(count);
        playBeep(440 + (3 - count) * 120, 0.12);
      } else {
        clearInterval(timer);
        setCountdownNum(0);
        playBeep(880, 0.3); // High pitch shutter snap
        executeCapture();
        setTimeout(() => {
          setIsCountingDown(false);
          setCountdownNum(null);
        }, 600);
      }
    }, 1000);
  };

  const executeCapture = () => {
    const rawLm = latestLandmarksRef.current;
    const sig = latestFingerSignatureRef.current;
    const loc = latestBodyLocationRef.current ? latestBodyLocationRef.current.location : targetLocation;

    if (!rawLm || rawLm.length < 21) {
      alert('⚠️ हाथ पूरी तरह कैमरे में नहीं दिख रहा था। कृपया दोबारा कैप्चर करें!');
      return;
    }

    const wrist = rawLm[0];
    const palm = dist(rawLm[0], rawLm[9]) || 1;
    const normalizedSample: number[][] = rawLm.map((pt: any) => [
      parseFloat(((pt.x - wrist.x) / palm).toFixed(4)),
      parseFloat(((pt.y - wrist.y) / palm).toFixed(4)),
      parseFloat(((pt.z - wrist.z) / palm).toFixed(4))
    ]);

    const captured = {
      landmarks: normalizedSample,
      fingerSignature: sig || {
        thumb: true,
        index: true,
        middle: true,
        ring: true,
        pinky: true
      },
      bodyLocation: loc || targetLocation,
      motionDirection: signType === 'dynamic' ? motionDirection : 'none'
    };

    setCapturedPose(captured);

    // Run conflict detection against existing signs
    checkConflicts(captured);
  };

  // Conflict Detection against existing base and custom signs
  const checkConflicts = (captured: any) => {
    let warning = '';
    const sig = captured.fingerSignature;

    for (const s of existingSigns) {
      // If re-training the same sign, don't flag conflict against itself
      if (s.nameHindi.trim() === signNameHindi.trim()) continue;

      if (s.handType && captured.handType && s.handType !== 'any' && captured.handType !== 'any' && s.handType !== captured.handType) {
        continue;
      }
      if (s.fingerSignature) {
        const matches = 
          s.fingerSignature.index === sig.index &&
          s.fingerSignature.middle === sig.middle &&
          s.fingerSignature.ring === sig.ring &&
          s.fingerSignature.pinky === sig.pinky;

        if (matches) {
          if (s.bodyLocation && s.bodyLocation === captured.bodyLocation) {
            warning = `⚠️ चेतावनी: यह साइन '${s.nameHindi}' से बिल्कुल मिलता-जुलता है (समान उंगली व समान स्थान)। इसे विशिष्ट बनाने के लिए कोई अलग बॉडी स्थान (जैसे माथा या छाती) चुनें।`;
            break;
          } else {
            warning = `ℹ️ नोट: यह उंगली मुद्रा '${s.nameHindi}' जैसी है, लेकिन आपका स्थान (${captured.bodyLocation}) इसे सुरक्षित रूप से अलग रखता है।`;
          }
        }
      }
    }

    setConflictWarning(warning);
  };

  // Final Save to LocalStorage + API
  const handleSaveSign = async () => {
    if (isSaving || !capturedPose || !signNameHindi.trim()) return;

    setIsSaving(true);
    try {
      const existing = existingSigns.find(s => s.nameHindi.trim().toLowerCase() === signNameHindi.trim().toLowerCase());
      await saveSignPersistently({
        id: existing?.id,
        nameHindi: signNameHindi.trim(),
        nameEnglish: signNameEnglish.trim() || signNameHindi.trim(),
        category: signCategory,
        landmarksSample: capturedPose.landmarks,
        fingerSignature: capturedPose.fingerSignature,
        bodyLocation: capturedPose.bodyLocation,
        signType: signType,
        motionDirection: capturedPose.motionDirection as any,
        recordedBy: 'College Employee'
      });

      setSaveSuccess(true);
    } catch (e) {
      alert('साइन सेव करने में समस्या आई।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForNewSign = () => {
    setSignNameHindi('');
    setSignNameEnglish('');
    setCapturedPose(null);
    setSaveSuccess(false);
    setConflictWarning('');
    setCurrentStep(1);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <Navbar voiceEnabled={false} signsCount={existingSigns.length} />

      {/* Progress Wizard Header */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: '#38bdf8' }} />
              साइन स्टूडियो (3-Step Guided Wizard)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>
              आराम से नाम लिखें, 3-2-1 टाइमर से हैंड्स-फ्री पोज़ कैप्चर करें और टेस्ट करके सेव करें।
            </p>
          </div>

          {/* Stepper Tabs */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[
              { num: 1, title: 'विवरण' },
              { num: 2, title: '3-2-1 पोज़' },
              { num: 3, title: 'टेस्ट & सेव' }
            ].map(step => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num === 1) setCurrentStep(1);
                    if (step.num === 2 && signNameHindi.trim()) setCurrentStep(2);
                    if (step.num === 3 && capturedPose) setCurrentStep(3);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: isActive ? '#3b82f6' : isPast ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#ffffff' : isPast ? '#34d399' : '#94a3b8',
                    border: `1px solid ${isActive ? '#3b82f6' : isPast ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: (step.num === 1 || (step.num === 2 && signNameHindi.trim()) || (step.num === 3 && capturedPose)) ? 'pointer' : 'default'
                  }}
                >
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isActive ? '#ffffff' : isPast ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                    color: isActive ? '#1e3a8a' : '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    {isPast ? '✓' : step.num}
                  </span>
                  <span>Step {step.num}: {step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: currentStep === 1 ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* CAMERA VIEWPORT (Rendered on Step 2 and Step 3) */}
        {currentStep !== 1 && (
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} style={{ color: '#10b981' }} />
                  स्टूडियो लाइव विज़न (आवाज़ म्यूट)
                </h3>
                <span style={{ fontSize: '12px', color: '#10b981' }}>{fingerStates}</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                {detectedLocationLabel}
              </span>
            </div>

            {/* Viewfinder with Countdown Overlay */}
            <div className="viewfinder-container" style={{ minHeight: '440px', height: 'clamp(440px, 58vh, 560px)' }}>
              <div className="hud-bracket hud-tl" />
              <div className="hud-bracket hud-tr" />
              <div className="hud-bracket hud-bl" />
              <div className="hud-bracket hud-br" />

              <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px' }} />
              <canvas ref={canvasRef} width={640} height={480} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

              {/* 3-2-1 Glowing Countdown Overlay */}
              {isCountingDown && countdownNum !== null && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20
                }}>
                  <div style={{
                    fontSize: '96px',
                    fontWeight: 900,
                    color: countdownNum === 0 ? '#10b981' : '#38bdf8',
                    textShadow: '0 0 35px rgba(56, 189, 248, 0.8)',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    {countdownNum === 0 ? '📸 LOCK!' : countdownNum}
                  </div>
                  <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, margin: '10px 0 0 0' }}>
                    {countdownNum === 0 ? 'पोज़ लॉक हो रहा है...' : 'हाथ स्थिर रखें...'}
                  </p>
                </div>
              )}

              {!cameraActive && (
                <div style={{ position: 'absolute', textAlign: 'center', padding: '20px' }}>
                  <Camera size={44} style={{ color: '#475569', marginBottom: '8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                    पोज़ कैप्चर करने के लिए कैमरा चालू करें
                  </p>
                  <button onClick={startCamera} className="btn-emerald" style={{ padding: '10px 18px' }}>
                    📷 कैमरा स्टार्ट करें
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: SIGN DETAILS & LOCATION FORM */}
        {currentStep === 1 && (
          <div className="glass-panel" style={{ padding: '24px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
              साइन की जानकारी और बॉडी लोकेशन तय करें
            </h3>

            {signNameHindi && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#7dd3fc',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={16} />
                <span>
                  आप <strong>"{signNameHindi}"</strong> के लिए नया एक्शन/पोज़ सिखा रहे हैं। नीचे बॉडी लोकेशन चुनकर आगे बढ़ें।
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  साइन का नाम (हिंदी में) *
                </label>
                <input
                  type="text"
                  value={signNameHindi}
                  onChange={e => setSignNameHindi(e.target.value)}
                  placeholder="उदा. लाइब्रेरी, प्रिंसिपल, कंप्यूटर लैब"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  इंग्लिश नाम (English Label)
                </label>
                <input
                  type="text"
                  value={signNameEnglish}
                  onChange={e => setSignNameEnglish(e.target.value)}
                  placeholder="e.g. Library, Principal Sir"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Category Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                श्रेणी (Category)
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'college', label: '🎓 कॉलेज / कैंपस' },
                  { id: 'daily', label: '☀️ दैनिक बातचीत' },
                  { id: 'emergency', label: '🚨 इमरजेंसी / मेडिकल' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSignCategory(cat.id as any)}
                    style={{
                      background: signCategory === cat.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${signCategory === cat.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: signCategory === cat.id ? '#60a5fa' : '#94a3b8',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Anchor Location Radio Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                टारगेट बॉडी लोकेशन (Body Target Anchor)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'neutral', label: 'खुला स्पेस (Neutral)', icon: '✋' },
                  { id: 'forehead', label: 'माथा (Forehead)', icon: '👤' },
                  { id: 'chin', label: 'ठोड़ी (Chin)', icon: '🗣️' },
                  { id: 'cheek', label: 'गाल / कान (Cheek)', icon: '👂' },
                  { id: 'chest', label: 'छाती (Chest)', icon: '🫀' }
                ].map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setTargetLocation(loc.id as any)}
                    style={{
                      background: targetLocation === loc.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${targetLocation === loc.id ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: targetLocation === loc.id ? '#34d399' : '#94a3b8',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '6px' }}>{loc.icon}</span>
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Static vs Dynamic Motion Choice */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                साइन का प्रकार (Motion Style)
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setSignType('static'); setMotionDirection('none'); }}
                  style={{
                    flex: 1,
                    background: signType === 'static' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${signType === 'static' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: signType === 'static' ? '#60a5fa' : '#94a3b8',
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  ⏸️ स्थिर पोज़ (Static Pose)
                </button>
                <button
                  type="button"
                  onClick={() => { setSignType('dynamic'); if (motionDirection === 'none') setMotionDirection('upward'); }}
                  style={{
                    flex: 1,
                    background: signType === 'dynamic' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${signType === 'dynamic' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: signType === 'dynamic' ? '#a78bfa' : '#94a3b8',
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  🔄 मोशन इशारा (Moving Gesture)
                </button>
              </div>

              {signType === 'dynamic' && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'upward', label: '🌅 ऊपर की ओर (Upward)' },
                    { id: 'wave', label: '👋 वेव / लहराना (Wave)' },
                    { id: 'outward', label: '⏩ आगे की ओर (Outward)' },
                    { id: 'downward', label: '⏬ नीचे की ओर (Downward)' }
                  ].map(dir => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => setMotionDirection(dir.id as any)}
                      style={{
                        background: motionDirection === dir.id ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${motionDirection === dir.id ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: motionDirection === dir.id ? '#c4b5fd' : '#94a3b8',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (!signNameHindi.trim()) {
                  alert('कृपया साइन का नाम (हिंदी में) लिखें!');
                  return;
                }
                setCurrentStep(2);
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
            >
              👉 Step 2: 3-2-1 पोज़ कैप्चर पर जाएं <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: HANDS-FREE 3-2-1 CAPTURE CONTROLS */}
        {currentStep === 2 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
              हाथों से पोज़ बनाएं और 3-2-1 कैप्चर करें
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              साइन: <strong style={{ color: '#38bdf8' }}>"{signNameHindi}"</strong> • टारगेट लोकेशन: <strong style={{ color: '#10b981' }}>{targetLocation}</strong>
            </p>

            <div style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <h4 style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> हैंड्स-फ्री कैप्चर गाइड:
              </h4>
              <ul style={{ color: '#cbd5e1', fontSize: '12px', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>कैमरे के सामने हाथ को <strong>{targetLocation}</strong> के पास लाएं।</li>
                <li>नीचे <strong>"3-2-1 कैप्चर शुरू करें"</strong> दबाएं।</li>
                <li>स्क्रीन पर 3 सेकंड का टाइमर चलेगा, आप आराम से बिना माउस पकड़े दोनों हाथों से पोज़ बनाइए।</li>
                <li>0 होते ही AI अपने-आप 1 बेस्ट स्टेबल पोज़ लॉक कर लेगा!</li>
              </ul>
            </div>

            {/* Countdown Trigger Button */}
            {!capturedPose ? (
              <button
                onClick={startCountdownCapture}
                disabled={isCountingDown}
                className="btn-emerald"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  opacity: isCountingDown ? 0.7 : 1
                }}
              >
                {isCountingDown ? `⏳ टाइमर चल रहा है (${countdownNum})...` : '📸 3-2-1 पोज़ कैप्चर शुरू करें'}
              </button>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 6px auto' }} />
                  <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 800, margin: 0 }}>
                    ✅ पोज़ सफलतापूर्वक लॉक हो गया!
                  </h4>
                  <p style={{ color: '#a7f3d0', fontSize: '12px', margin: '4px 0 0 0' }}>
                    21 लैंडमार्क्स और उंगली टोपोलॉजी सिरीज़ रिकॉर्ड हो गई।
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={startCountdownCapture}
                    className="btn-glass"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <RotateCcw size={16} /> दोबारा कैप्चर करें
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    👉 Step 3: टेस्ट करें <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setCurrentStep(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '10px'
              }}
            >
              <ArrowLeft size={14} /> नाम और डिटेल्स बदलें
            </button>
          </div>
        )}

        {/* STEP 3: INTERACTIVE TEST & CONFLICT CHECK & PERMANENT SAVE */}
        {currentStep === 3 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
              लाइव टेस्ट और क्लैश चेक
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              कैमरे के सामने नया साइन बनाकर देखें कि क्या AI इसे सही पहचान रहा है।
            </p>

            {/* Live Match Meter */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${isTestMatched ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                  लाइव मैच एक्यूरेसी (Match Score):
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: isTestMatched ? '#10b981' : '#f59e0b'
                }}>
                  {liveTestMatchScore}% {isTestMatched ? '🎯 मैच!' : 'इशारा बनाएं'}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${liveTestMatchScore}%`,
                  height: '100%',
                  background: isTestMatched ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>

            {/* Conflict Detection Banner */}
            {conflictWarning ? (
              <div style={{
                background: conflictWarning.includes('⚠️') ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${conflictWarning.includes('⚠️') ? '#eab308' : '#38bdf8'}`,
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#ffffff',
                lineHeight: 1.5
              }}>
                {conflictWarning}
              </div>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={16} /> कोई क्लैश नहीं मिला - यह साइन पूरी तरह सुरक्षित और यूनिक है!
              </div>
            )}

            {!saveSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleSaveSign}
                  disabled={isSaving}
                  className="btn-primary"
                  style={{
                    padding: '14px',
                    fontSize: '16px',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  {isSaving ? '⏳ सेव हो रहा है...' : '💾 साइन को परमानेंट सेव करें (Save Sign)'}
                </button>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-glass"
                  style={{ justifyContent: 'center' }}
                >
                  <RotateCcw size={15} /> दोबारा नया पोज़ कैप्चर करें
                </button>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.25))',
                border: '2px solid #10b981',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <CheckCircle size={44} style={{ color: '#10b981', margin: '0 auto 8px auto' }} />
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 900, margin: '0 0 6px 0' }}>
                  🎉 "{signNameHindi}" सफलतापूर्वक सेव हो गया!
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 16px 0' }}>
                  यह साइन आपके ब्राउज़र और बैकएंड दोनों में सुरक्षित रूप से दर्ज हो गया है।
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/" className="btn-emerald" style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13px' }}>
                    🗣️ लाइव इंटरप्रेटर में टेस्ट करें
                  </Link>
                  <button
                    onClick={handleResetForNewSign}
                    className="btn-purple"
                    style={{ padding: '10px 18px', fontSize: '13px' }}
                  >
                    ➕ एक और नया साइन सिखाएं
                  </button>
                  <Link href="/dictionary" className="btn-glass" style={{ textDecoration: 'none', padding: '10px 16px', fontSize: '13px' }}>
                    📖 डिक्शनरी में देखें
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
