/**
 * Haptic feedback utility using the Web Vibration API
 * Provides tactile feedback on button interactions for supported devices
 */

type HapticType = 'light' | 'medium' | 'heavy';

const hapticPatterns: Record<HapticType, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
};

/**
 * Trigger haptic feedback vibration
 * @param type - Intensity of the haptic feedback
 */
export const hapticFeedback = (type: HapticType = 'light'): void => {
  // Check if the Vibration API is supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(hapticPatterns[type]);
    } catch (error) {
      // Silently fail on unsupported browsers
      console.debug('Haptic feedback not supported:', error);
    }
  }
};
