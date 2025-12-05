/**
 * Haptic feedback utility using the Web Vibration API
 * Provides tactile feedback on interactions for supported devices
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'notification' | 'pulse';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],      // Double tap for success actions
  notification: [15, 30, 15], // Message received pattern
  pulse: 8,                   // Subtle streaming pulse
};

/**
 * Trigger haptic feedback vibration
 * @param type - Type/intensity of the haptic feedback
 */
export const hapticFeedback = (type: HapticType = 'light'): void => {
  // Check if the Vibration API is supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(hapticPatterns[type]);
    } catch {
      // Silently fail on unsupported browsers
    }
  }
};

/**
 * Check if haptic feedback is supported on this device
 */
export const isHapticsSupported = (): boolean => {
  return 'vibrate' in navigator;
};
