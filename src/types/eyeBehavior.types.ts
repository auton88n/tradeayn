// Eye Behavior Library Types
// Pre-generated AI behavior scenarios for intelligent eye movements

import { AYNEmotion } from '@/contexts/AYNEmotionContext';

export interface EyeContext {
  // Typing signals
  typingSpeed: number; // chars per second
  typingPauseDuration: number; // ms since last keystroke
  deletionCount: number; // backspaces in last 5 seconds
  
  // Mouse signals
  mouseDistanceFromEye: number; // px
  mouseVelocity: number; // px/s
  isMouseIdle: boolean;
  
  // State signals
  idleDuration: number; // ms since last activity
  currentMode: string;
  lastAction: 'none' | 'sent_message' | 'received_response' | 'clicked_suggestion' | 'mode_change' | 'file_upload';
  timeSinceLastAction: number; // ms
  
  // Conversation signals
  messageCount: number;
  hasActiveResponse: boolean;
  isWaitingForResponse: boolean;
}

export interface EyeBehavior {
  id: string;
  name: string;
  description: string;
  priority: number; // Higher = more important (1-10)
  
  // Trigger conditions (all must match)
  triggers: BehaviorTrigger;
  
  // Eye behavior outputs
  behavior: BehaviorConfig;
  
  // Duration and transitions
  duration: number; // ms, 0 = until context changes
  cooldown: number; // ms before this behavior can trigger again
  transitionSpeed: 'instant' | 'fast' | 'normal' | 'slow';
}

export interface BehaviorTrigger {
  // Typing conditions (optional)
  typingSpeed?: { min?: number; max?: number };
  typingPauseDuration?: { min?: number; max?: number };
  deletionCount?: { min?: number; max?: number };
  
  // Mouse conditions (optional)
  mouseDistanceFromEye?: { min?: number; max?: number };
  mouseVelocity?: { min?: number; max?: number };
  isMouseIdle?: boolean;
  
  // State conditions (optional)
  idleDuration?: { min?: number; max?: number };
  currentMode?: string[];
  lastAction?: ('none' | 'sent_message' | 'received_response' | 'clicked_suggestion' | 'mode_change' | 'file_upload')[];
  timeSinceLastAction?: { min?: number; max?: number };
  
  // Conversation conditions (optional)
  messageCount?: { min?: number; max?: number };
  hasActiveResponse?: boolean;
  isWaitingForResponse?: boolean;
}

export interface BehaviorConfig {
  // Emotion state
  emotion: AYNEmotion;
  
  // Gaze behavior
  gazePattern: 'center' | 'follow_mouse' | 'wander' | 'focus_input' | 'look_away' | 'scan_screen';
  gazeIntensity: number; // 0-1, how far eye moves
  gazeSpeed: number; // 0-1, movement speed
  
  // Blink behavior
  blinkPattern: 'none' | 'normal' | 'slow' | 'rapid' | 'double' | 'sleepy';
  blinkFrequency: number; // blinks per minute
  
  // Pupil behavior
  pupilDilation: 'contracted' | 'normal' | 'dilated' | 'very_dilated';
  
  // Micro-movements
  microMovementIntensity: number; // 0-1
  microMovementSpeed: number; // 0-1
  
  // Special effects
  triggerSurprise?: boolean;
  triggerPulse?: boolean;
  headTilt?: number; // degrees, -10 to 10
}

export interface MatchedBehavior {
  behavior: EyeBehavior;
  matchScore: number; // 0-100, how well context matches triggers
  startedAt: number;
}
