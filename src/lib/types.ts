export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerSignature {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  thumbPointsUp?: boolean;
  isPinch?: boolean;
}

export type TwoHandRelation = 
  | 'touching_tips'      // Index tips touching (A shape)
  | 'touching_circles'   // Thumb+index circles touching (B binoculars)
  | 'crossed'            // Fingers crossing (X, F)
  | 'stacked_fists'      // One fist on top of other (G)
  | 'resting_on_palm'    // Fingers resting on other palm (M, N, E, H)
  | 'stem_and_loop'      // One vertical finger stem, other loop touching (D, P, K)
  | 't_touch'            // Horizontal index touched by vertical index (T)
  | 'fists_touching'     // Both fists touching side-by-side (S)
  | 'apart'              // Both hands open separated (Namaste, symmetrical)
  | 'none';

export type BodyLocation = 'above_head' | 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';

export interface CustomSign {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  category: 'alphabet' | 'number' | 'daily' | 'emergency' | 'college' | 'custom';
  handsCount?: 1 | 2; // 1 for single hand, 2 for two hands (default: 1)
  handType?: 'right' | 'left' | 'both' | 'any'; // Explicit hand detection (Right hand vs Left hand distinction)
  // Primary (or single) hand 21 landmarks x 3 coordinates
  landmarksSample: number[][]; 
  // Secondary hand 21 landmarks x 3 coordinates (for 2-handed signs)
  secondLandmarksSample?: number[][];
  fingerSignature?: FingerSignature;
  secondFingerSignature?: FingerSignature;
  twoHandRelation?: TwoHandRelation;
  twoHandDistance?: number;
  description?: string; // Guidance on how to perform the sign
  icon?: string; // Visual emoji or icon badge
  bodyLocation?: 'above_head' | 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
  handDirection?: 'up' | 'horizontal_head' | 'forward' | 'down' | 'any';
  palmFacing?: 'front' | 'back' | 'any';
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
  handsCount?: 1 | 2;
  handType?: 'right' | 'left' | 'both' | 'any';
  bodyLocation?: 'forehead' | 'chin' | 'cheek' | 'chest' | 'neutral';
  handDirection?: string;
  palmFacing?: 'front' | 'back';
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
