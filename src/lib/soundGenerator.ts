// Programmatic sound generation using Web Audio API
// Minimal/Subtle sounds for AYN eye interactions

export type SoundType = 
  // Mode sounds
  | 'mode-general' | 'mode-research' | 'mode-pdf' | 'mode-vision' | 'mode-civil'
  // Emotion sounds
  | 'emotion-happy' | 'emotion-thinking' | 'emotion-excited' | 'emotion-curious' | 'emotion-frustrated' | 'emotion-calm'
  // Interaction sounds
  | 'message-send' | 'message-absorb' | 'response-received' | 'suggestion-click' | 'blink';

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
  // Mode sounds - distinct but subtle
  'mode-general': { type: 'sine', frequency: 440, duration: 0.15, gain: 0.08, attack: 0.01, decay: 0.14 },
  'mode-research': { type: 'triangle', frequency: 523, duration: 0.12, gain: 0.07, attack: 0.01, decay: 0.11, detune: 5 },
  'mode-pdf': { type: 'sine', frequency: 392, duration: 0.1, gain: 0.06, attack: 0.02, decay: 0.08 },
  'mode-vision': { type: 'sine', frequency: 587, duration: 0.18, gain: 0.07, attack: 0.01, decay: 0.17, filterFreq: 2000 },
  'mode-civil': { type: 'square', frequency: 330, duration: 0.08, gain: 0.04, attack: 0.01, decay: 0.07, filterFreq: 1500 },
  
  // Emotion sounds - very subtle
  'emotion-calm': { type: 'sine', frequency: 261, duration: 0.2, gain: 0.04, attack: 0.05, decay: 0.15 },
  'emotion-happy': { type: 'sine', frequency: 523, duration: 0.15, gain: 0.06, attack: 0.01, decay: 0.14 },
  'emotion-thinking': { type: 'triangle', frequency: 349, duration: 0.25, gain: 0.05, attack: 0.02, decay: 0.23 },
  'emotion-excited': { type: 'sawtooth', frequency: 622, duration: 0.12, gain: 0.05, attack: 0.01, decay: 0.11, filterFreq: 3000 },
  'emotion-curious': { type: 'sine', frequency: 466, duration: 0.18, gain: 0.05, attack: 0.02, decay: 0.16, detune: 10 },
  'emotion-frustrated': { type: 'triangle', frequency: 220, duration: 0.2, gain: 0.04, attack: 0.03, decay: 0.17 },
  
  // Interaction sounds - minimal
  'message-send': { type: 'sine', frequency: 880, duration: 0.1, gain: 0.06, attack: 0.01, decay: 0.09 },
  'message-absorb': { type: 'sine', frequency: 330, duration: 0.15, gain: 0.05, attack: 0.01, decay: 0.14 },
  'response-received': { type: 'sine', frequency: 659, duration: 0.12, gain: 0.07, attack: 0.01, decay: 0.11 },
  'suggestion-click': { type: 'sine', frequency: 740, duration: 0.06, gain: 0.05, attack: 0.005, decay: 0.055 },
  'blink': { type: 'sine', frequency: 200, duration: 0.05, gain: 0.02, attack: 0.01, decay: 0.04 },
};

export class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  private ensureContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
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

  play(soundType: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    this.ensureContext();
    
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
