export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface CustomSign {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  category: 'daily' | 'emergency' | 'college' | 'custom';
  // 21 landmarks x 3 coordinates normalized signature
  landmarksSample: number[][]; 
  fingerSignature?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
    thumbPointsUp?: boolean;
    isPinch?: boolean;
  };
  bodyLocation?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
  signType?: 'static' | 'dynamic';
  motionDirection?: 'none' | 'upward' | 'downward' | 'outward' | 'wave' | 'to_right' | 'to_left';
  endBodyLocation?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
  recordedBy?: string;
  createdAt: string;
  updatedAt?: string;
  confidenceThreshold?: number;
}

export interface RecognizedResult {
  signNameHindi: string;
  signNameEnglish: string;
  confidence: number;
  category: string;
  bodyLocation?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
  signType?: 'static' | 'dynamic';
  motionDirection?: string;
}

export interface InterpretRequest {
  tokens: string[];
}

export interface InterpretResponse {
  originalTokens: string[];
  fluentHindi: string;
  englishMeaning: string;
}
