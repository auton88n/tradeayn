/**
 * Haptic Feedback Utility
 * Provides vibration patterns for emotional feedback on supported devices
 */

// Extended haptic patterns for emotional feedback
export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'notification'
  | 'pulse'
  // Emotional haptics (matches AYNEmotion)
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'frustrated'
  | 'calm'
  | 'curious'
  | 'bored'
  | 'sad'
  | 'mad'
  // Empathy response haptics
  | 'empathy'
  | 'comfort'
  | 'mirror-joy'
  | 'patience'
  | 'celebration'
  | 'reassurance';

// Vibration patterns in milliseconds
// [vibrate, pause, vibrate, pause, ...]
const hapticPatterns: Record<HapticType, number | number[]> = {
  // Basic patterns
  light: 5,
  medium: 15,
  heavy: 25,
  success: [15, 50, 15],
  error: [30, 50, 30, 50, 30],
  warning: [20, 100, 20],
  notification: [10, 50, 10],
  pulse: [10, 60, 10],
  
  // Emotional state patterns
  happy: [15, 80, 15],        // Light double tap - joyful
  excited: [10, 30, 10, 30],  // Rapid excitement
  thinking: [20, 100, 20, 100, 20], // Slow thoughtful rhythm
  frustrated: [60, 50, 60],   // Firm acknowledgment
  calm: 5,                    // Barely perceptible - grounding
  curious: [12, 60, 25],      // Rising pattern - inquisitive
  bored: [8, 200, 8],         // Slow, minimal - low energy
  sad: [15, 150, 15, 150, 15], // Slow, gentle pulses
  mad: [40, 40, 40, 40, 40],  // Strong, rapid bursts
  
  // Empathy response patterns - what AYN feels towards user
  empathy: [20, 80, 30, 80, 20],        // Warm embrace rhythm
  comfort: [15, 120, 15, 120, 15, 120], // Slow breathing pattern - soothing
  'mirror-joy': [10, 40, 10, 40, 10, 40, 20], // Celebratory burst
  patience: [30, 150, 30],              // Slow, steady - I'm here
  celebration: [8, 25, 8, 25, 15, 50, 15], // Festive rhythm
  reassurance: [20, 100, 30, 100, 40],  // Growing warmth - building confidence
};

/**
 * Check if haptics are supported
 */
export const isHapticsSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Check if device is iOS (no Web Vibration API support)
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Trigger haptic feedback
 * @param type - The type of haptic feedback to trigger (can be HapticType or AYNEmotion)
 */
export const hapticFeedback = (type: HapticType | string = 'light'): void => {
  if (!isHapticsSupported() || isIOSDevice()) {
    return; // Silently fail on unsupported devices
  }

  try {
    // Map any emotion to valid haptic type, fallback to 'calm' for unknown types
    const validType = (type in hapticPatterns ? type : 'calm') as HapticType;
    const pattern = hapticPatterns[validType] || hapticPatterns.light;
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration fails
    console.debug('Haptic feedback failed:', error);
  }
};
