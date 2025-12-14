/**
 * Haptic feedback utility using the Web Vibration API
 * Provides tactile feedback on interactions for supported devices
 * Note: iOS Safari does not support Web Vibration API - haptics silently fail there
 */

type HapticType = 
  | 'light' | 'medium' | 'heavy' | 'success' | 'notification' | 'pulse'
  | 'happy' | 'excited' | 'frustrated' | 'thinking' | 'curious' | 'calm'
  | 'sad' | 'mad' | 'bored'
  | 'empathy' | 'comfort' | 'mirror-joy' | 'patience';

const hapticPatterns: Record<HapticType, number | number[]> = {
  // Base interaction patterns
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],      // Double tap for success actions
  notification: [15, 30, 15], // Message received pattern
  pulse: 8,                   // Subtle streaming pulse
  
  // Emotion-specific patterns (AYN's emotions)
  happy: [15, 80, 15],              // Double tap with pause - joyful heartbeat
  excited: [10, 30, 10, 30],        // Two quick bursts - energetic buzz
  frustrated: [60, 50, 60],         // Two long pulses - heavy/tense feel
  thinking: [20, 100, 20, 100, 20], // Rhythmic pattern - contemplative
  curious: [12, 60, 25],            // Short-long pattern - inquisitive
  calm: 5,                          // Very subtle - peaceful
  sad: [40, 150, 40],               // Slow, heavy - melancholic
  mad: [80, 30, 80, 30],            // Aggressive short bursts - intense
  bored: [5, 300],                  // Long pause, subtle - disengaged
  
  // Empathetic response patterns (responding to USER emotions)
  empathy: [8, 100, 8],             // Gentle double pulse - "I understand"
  comfort: [5, 150, 5, 150, 5],     // Soft rhythm - calming presence
  'mirror-joy': [12, 40, 12, 40, 12], // Quick happy pattern - sharing joy
  patience: [30, 200],              // Long gentle pulse - "take your time"
};

// Cache the support check
let hapticsSupport: boolean | null = null;

/**
 * Check if haptic feedback is supported on this device
 * Note: Returns false on iOS (no Web Vibration API support)
 */
export const isHapticsSupported = (): boolean => {
  if (hapticsSupport === null) {
    hapticsSupport = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }
  return hapticsSupport;
};

/**
 * Check if device is iOS (no haptic support via web)
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Trigger haptic feedback vibration
 * @param type - Type/intensity of the haptic feedback
 * Silently fails on iOS and unsupported browsers
 */
export const hapticFeedback = (type: HapticType = 'light'): void => {
  // Skip if haptics not supported (includes iOS)
  if (!isHapticsSupported()) return;
  
  try {
    navigator.vibrate(hapticPatterns[type]);
  } catch {
    // Silently fail on unsupported browsers
  }
};
