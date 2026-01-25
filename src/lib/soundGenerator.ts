// Programmatic sound generation using Web Audio API
// Minimal/Subtle sounds for AYN eye interactions

export type SoundType = 
  // Mode sounds
  | 'mode-general' | 'mode-research' | 'mode-pdf' | 'mode-vision' | 'mode-civil'
  // Emotion sounds
  | 'emotion-happy' | 'emotion-thinking' | 'emotion-excited' | 'emotion-curious' | 'emotion-frustrated' | 'emotion-calm'
  | 'emotion-sad' | 'emotion-mad' | 'emotion-bored'
  // Interaction sounds
  | 'message-send' | 'message-absorb' | 'response-received' | 'suggestion-click' | 'blink' | 'blink-open'
  // Conversational sounds - real-time emotional connection
  | 'understanding' | 'empathy' | 'anticipation' | 'recognition' | 'comfort'
  // Typing context sounds
  | 'listening' | 'attentive-blink' | 'thoughtful-blink' | 'processing';

interface SoundConfig {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
  attack: number;
  decay: number;
  detune?: number;
  filterFreq?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  // Mode sounds - loud and distinct
  'mode-general': { type: 'sine', frequency: 440, duration: 0.15, gain: 0.25, attack: 0.01, decay: 0.14 },
  'mode-research': { type: 'triangle', frequency: 523, duration: 0.12, gain: 0.22, attack: 0.01, decay: 0.11, detune: 5 },
  'mode-pdf': { type: 'sine', frequency: 392, duration: 0.1, gain: 0.20, attack: 0.02, decay: 0.08 },
  'mode-vision': { type: 'sine', frequency: 587, duration: 0.18, gain: 0.22, attack: 0.01, decay: 0.17, filterFreq: 2000 },
  'mode-civil': { type: 'square', frequency: 330, duration: 0.08, gain: 0.15, attack: 0.01, decay: 0.07, filterFreq: 1500 },
  
  // Emotion sounds - audible and clear
  'emotion-calm': { type: 'sine', frequency: 261, duration: 0.2, gain: 0.15, attack: 0.05, decay: 0.15 },
  'emotion-happy': { type: 'sine', frequency: 523, duration: 0.15, gain: 0.20, attack: 0.01, decay: 0.14 },
  'emotion-thinking': { type: 'triangle', frequency: 349, duration: 0.25, gain: 0.18, attack: 0.02, decay: 0.23 },
  'emotion-excited': { type: 'sawtooth', frequency: 622, duration: 0.12, gain: 0.18, attack: 0.01, decay: 0.11, filterFreq: 3000 },
  'emotion-curious': { type: 'sine', frequency: 466, duration: 0.18, gain: 0.18, attack: 0.02, decay: 0.16, detune: 10 },
  'emotion-frustrated': { type: 'triangle', frequency: 220, duration: 0.2, gain: 0.15, attack: 0.03, decay: 0.17 },
  'emotion-sad': { type: 'sine', frequency: 196, duration: 0.4, gain: 0.18, attack: 0.1, decay: 0.3 },
  'emotion-mad': { type: 'square', frequency: 165, duration: 0.15, gain: 0.18, attack: 0.01, decay: 0.14, filterFreq: 1200 },
  'emotion-bored': { type: 'sine', frequency: 175, duration: 0.35, gain: 0.12, attack: 0.15, decay: 0.2 },
  
  // Interaction sounds - clear and prominent
  'message-send': { type: 'sine', frequency: 880, duration: 0.1, gain: 0.22, attack: 0.01, decay: 0.09 },
  'message-absorb': { type: 'sine', frequency: 330, duration: 0.15, gain: 0.18, attack: 0.01, decay: 0.14 },
  'response-received': { type: 'sine', frequency: 659, duration: 0.12, gain: 0.25, attack: 0.01, decay: 0.11 },
  'suggestion-click': { type: 'sine', frequency: 740, duration: 0.06, gain: 0.20, attack: 0.005, decay: 0.055 },
  // Blink sounds - subtle but audible
  'blink': { type: 'sine', frequency: 200, duration: 0.18, gain: 0.06, attack: 0.08, decay: 0.10 },
  'blink-open': { type: 'sine', frequency: 240, duration: 0.06, gain: 0.04, attack: 0.01, decay: 0.05 },
  
  // Conversational sounds - clear and audible
  'understanding': { type: 'sine', frequency: 392, duration: 0.25, gain: 0.20, attack: 0.05, decay: 0.2, detune: 3 },
  'empathy': { type: 'sine', frequency: 294, duration: 0.35, gain: 0.20, attack: 0.08, decay: 0.27 },
  'anticipation': { type: 'sine', frequency: 440, duration: 0.15, gain: 0.18, attack: 0.02, decay: 0.13, detune: 8 },
  'recognition': { type: 'triangle', frequency: 523, duration: 0.1, gain: 0.18, attack: 0.01, decay: 0.09 },
  'comfort': { type: 'sine', frequency: 262, duration: 0.4, gain: 0.20, attack: 0.1, decay: 0.3 },
  
  // Typing context sounds - audible feedback
  'listening': { type: 'sine', frequency: 330, duration: 0.12, gain: 0.18, attack: 0.03, decay: 0.09 },
  'attentive-blink': { type: 'sine', frequency: 494, duration: 0.06, gain: 0.15, attack: 0.01, decay: 0.05 },
  'thoughtful-blink': { type: 'sine', frequency: 262, duration: 0.15, gain: 0.15, attack: 0.04, decay: 0.11 },
  'processing': { type: 'triangle', frequency: 370, duration: 0.2, gain: 0.18, attack: 0.05, decay: 0.15, detune: 5 },
};

// Global unlock state for iOS AudioContext
let globalUnlockPromise: Promise<void> | null = null;
let isUnlocked = false;

// Unlock AudioContext on first user interaction (required for iOS/Safari)
const unlockAudioContext = (audioContext: AudioContext): Promise<void> => {
  if (isUnlocked || audioContext.state === 'running') {
    isUnlocked = true;
    return Promise.resolve();
  }
  
  if (globalUnlockPromise) return globalUnlockPromise;
  
  globalUnlockPromise = new Promise((resolve) => {
    const unlock = () => {
      if (isUnlocked) {
        resolve();
        return;
      }
      
      // Resume context
      audioContext.resume().then(() => {
        // Play silent buffer to fully unlock on iOS
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        isUnlocked = true;
        
        // Remove listeners after unlock
        document.removeEventListener('touchstart', unlock, true);
        document.removeEventListener('touchend', unlock, true);
        document.removeEventListener('mousedown', unlock, true);
        document.removeEventListener('keydown', unlock, true);
        
        resolve();
      }).catch(() => {
        // Retry on next interaction
      });
    };
    
    // Listen for first user interaction
    document.addEventListener('touchstart', unlock, true);
    document.addEventListener('touchend', unlock, true);
    document.addEventListener('mousedown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    
    // Try immediately in case already interacted
    unlock();
  });
  
  return globalUnlockPromise;
};

export class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;
  private unlockPromise: Promise<void> | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Use webkitAudioContext for older Safari
      const AudioContextClass = window.AudioContext || 
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      
      // Start unlock process for iOS
      this.unlockPromise = unlockAudioContext(this.audioContext);
    } catch {
      // Web Audio API not supported - fail silently
    }
  }

  private async ensureContext(): Promise<boolean> {
    if (!this.audioContext) return false;
    
    // Wait for unlock on iOS
    if (this.unlockPromise) {
      await this.unlockPromise;
    }
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return false;
      }
    }
    
    return this.audioContext.state === 'running';
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async play(soundType: SoundType): Promise<void> {
    if (!this.enabled || !this.audioContext || !this.masterGain) {
      return;
    }
    
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    // Ensure context is unlocked and running
    const isReady = await this.ensureContext();
    if (!isReady || !this.audioContext) {
      return;
    }
    
    const config = SOUND_CONFIGS[soundType];
    if (!config) return;

    const now = this.audioContext.currentTime;
    
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    if (config.detune) {
      oscillator.detune.value = config.detune;
    }
    
    // Create gain for envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(config.gain, now + config.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
    
    // Optional filter for softer sounds
    if (config.filterFreq) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = config.filterFreq;
      oscillator.connect(filter);
      filter.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }
    
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + config.duration);
    
    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  // Synchronous instant play for time-critical sounds like blink (no await delay)
  playInstant(soundType: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) {
      return;
    }
    
    // Skip reduced motion check for essential feedback sounds
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    // If context is suspended, try to resume (fire-and-forget, don't wait)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Don't check state - just try to play, Web Audio API handles gracefully
    const config = SOUND_CONFIGS[soundType];
    if (!config) return;
    
    try {
      const now = this.audioContext.currentTime;
      
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = config.type;
      oscillator.frequency.value = config.frequency;
      if (config.detune) {
        oscillator.detune.value = config.detune;
      }
      
      // Create gain for envelope
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(config.gain, now + config.attack);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      
      // Optional filter for softer sounds
      if (config.filterFreq) {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = config.filterFreq;
        oscillator.connect(filter);
        filter.connect(gainNode);
      } else {
        oscillator.connect(gainNode);
      }
      
      gainNode.connect(this.masterGain);
      
      oscillator.start(now);
      oscillator.stop(now + config.duration);
    
      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch {
      // Silently fail if context not ready
    }
  }

  // Play a quick double tone for mode changes
  playModeChange(mode: string): void {
    const modeMap: Record<string, SoundType> = {
      'General': 'mode-general',
      'Research': 'mode-research',
      'PDF Analysis': 'mode-pdf',
      'Vision': 'mode-vision',
      'Civil Engineering': 'mode-civil',
    };
    
    const soundType = modeMap[mode] || 'mode-general';
    this.play(soundType);
  }

  // Play emotion-based sound
  playEmotion(emotion: string): void {
    const emotionMap: Record<string, SoundType> = {
      'calm': 'emotion-calm',
      'happy': 'emotion-happy',
      'thinking': 'emotion-thinking',
      'excited': 'emotion-excited',
      'curious': 'emotion-curious',
      'frustrated': 'emotion-frustrated',
      'sad': 'emotion-sad',
      'mad': 'emotion-mad',
      'bored': 'emotion-bored',
    };
    
    const soundType = emotionMap[emotion] || 'emotion-calm';
    this.play(soundType);
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Singleton instance
let soundGeneratorInstance: SoundGenerator | null = null;

export const getSoundGenerator = (): SoundGenerator => {
  if (!soundGeneratorInstance) {
    soundGeneratorInstance = new SoundGenerator();
  }
  return soundGeneratorInstance;
};
