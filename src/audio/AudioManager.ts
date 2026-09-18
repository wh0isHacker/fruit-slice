/**
 * Zero-dependency Web Audio API procedural sound engine for Fruit Slice.
 * Guarantees instantaneous, zero-latency playback with zero external asset loading issues.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;

  private musicIntervalId: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private lastWhooshTime: number = 0;
  private readonly whooshCooldown: number = 0.22; // Prevent constant whoosh spam

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundEnabled ? this.soundVolume : 0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(soundEnabled: boolean, musicEnabled: boolean, soundVolume: number, musicVolume: number) {
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    this.soundVolume = soundVolume;
    this.musicVolume = musicVolume;

    if (this.sfxGain) {
      this.sfxGain.gain.value = soundEnabled ? soundVolume : 0;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = musicEnabled ? musicVolume : 0;
    }

    if (!musicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    } else if (musicEnabled && !this.isMusicPlaying && this.ctx) {
      this.startMusic();
    }
  }

  /**
   * Crisp blade whoosh sound on swiping fast, with cooldown to avoid audio clutter
   */
  public playWhoosh() {
    if (!this.soundEnabled) return;
    const nowSec = performance.now() / 1000;
    if (nowSec - this.lastWhooshTime < this.whooshCooldown) return;
    this.lastWhooshTime = nowSec;

    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.09);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 2.5;
      filter.frequency.setValueAtTime(1000 + Math.random() * 300, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.09);
    } catch {
      // Ignore audio errors gracefully
    }
  }

  /**
   * Satisfying single fruit slice sound: sharp arcade "swish + slice" transient + juicy squelch
   */
  public playSingleSlice(pitchMod = 1.0, isRare = false) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      // Add random pitch micro-variation
      const randomPitch = pitchMod * (0.95 + Math.random() * 0.1);

      // 1. Blade steel cut transient (crisp swish + slice metallic bite)
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(1800 * randomPitch, now);
      metalOsc.frequency.exponentialRampToValueAtTime(320 * randomPitch, now + 0.06);

      const metalFilter = this.ctx.createBiquadFilter();
      metalFilter.type = 'bandpass';
      metalFilter.frequency.setValueAtTime(2800 * randomPitch, now);
      metalFilter.Q.value = 3.5;

      metalGain.gain.setValueAtTime(0.35 * this.soundVolume, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      metalOsc.connect(metalFilter);
      metalFilter.connect(metalGain);
      metalGain.connect(this.sfxGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.065);

      // 2. Juicy squelch pop (low/mid body)
      const squelchOsc = this.ctx.createOscillator();
      const squelchGain = this.ctx.createGain();
      squelchOsc.type = 'triangle';
      squelchOsc.frequency.setValueAtTime(520 * randomPitch, now);
      squelchOsc.frequency.exponentialRampToValueAtTime(110 * randomPitch, now + 0.11);

      squelchGain.gain.setValueAtTime(0.45 * this.soundVolume, now);
      squelchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      squelchOsc.connect(squelchGain);
      squelchGain.connect(this.sfxGain);
      squelchOsc.start(now);
      squelchOsc.stop(now + 0.12);

      // 3. Crisp juice spray high-frequency noise
      const noiseLen = Math.floor(this.ctx.sampleRate * 0.045);
      const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const nData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        nData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.25));
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'highpass';
      nFilter.frequency.value = 2400 * randomPitch;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.24 * this.soundVolume, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noiseSrc.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.sfxGain);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.045);

      // 4. Special/rare fruit chime shimmer
      if (isRare) {
        const rareOsc = this.ctx.createOscillator();
        const rareGain = this.ctx.createGain();
        rareOsc.type = 'sine';
        rareOsc.frequency.setValueAtTime(1567.98, now); // G6
        rareOsc.frequency.exponentialRampToValueAtTime(2093.0, now + 0.18); // C7

        rareGain.gain.setValueAtTime(0.3 * this.soundVolume, now);
        rareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        rareOsc.connect(rareGain);
        rareGain.connect(this.sfxGain);
        rareOsc.start(now);
        rareOsc.stop(now + 0.22);
      }
    } catch {
      // Ignore audio errors gracefully
    }
  }

  /**
   * Slices multiple fruits in one swipe:
   * 1 fruit -> normal slice sound
   * 2 fruits -> two quick slice sounds with pitch shift
   * 3 fruits -> three quick slice sounds with slight variation
   * 4+ fruits -> rapid layered slicing effect without creating overwhelming audio
   */
  public playMultiSlice(count: number, hasRare = false) {
    if (!this.soundEnabled) return;
    const slicesToPlay = Math.min(count, 4);

    for (let i = 0; i < slicesToPlay; i++) {
      const delayMs = i * 36;
      const pitchMod = 1.0 + i * 0.12 + (Math.random() * 0.08 - 0.04);
      const isRareSlice = i === 0 && hasRare;

      if (delayMs === 0) {
        this.playSingleSlice(pitchMod, isRareSlice);
      } else {
        window.setTimeout(() => {
          this.playSingleSlice(pitchMod, isRareSlice);
        }, delayMs);
      }
    }
  }

  /**
   * Backward-compatible slice trigger
   */
  public playSlice(comboLevel = 0, isRare = false) {
    const pitch = 1.0 + Math.min(comboLevel, 6) * 0.08;
    this.playSingleSlice(pitch, isRare);
  }

  /**
   * Countdown tick blip for 00:05, 00:04, 00:03, 00:02, 00:01
   */
  public playCountdownTick(remainingSeconds: number) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Higher pitch for 1 second remaining
      const freq = remainingSeconds === 1 ? 1200 : 880;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.08);

      gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Sound effect when timer reaches 00:00 (TIME'S UP!)
   */
  public playTimeUp() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      // Arcade dual gong chime
      [587.33, 440, 293.66].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteTime = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.45 * this.soundVolume, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Dramatic bomb explosion
   */
  public playBombExplosion() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;

      // 1. Deep sub-bass boom
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

      subGain.gain.setValueAtTime(0.9 * this.soundVolume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 0.52);

      // 2. Heavy explosive noise burst
      const noiseLen = this.ctx.sampleRate * 0.6;
      const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.3));
      }

      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1200, now);
      lowpass.frequency.exponentialRampToValueAtTime(100, now + 0.55);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8 * this.soundVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      noiseSrc.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSrc.start(now);
      noiseSrc.stop(now + 0.6);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Ascending celebratory combo sound
   */
  public playCombo(comboCount: number) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      // Pentatonic scale frequencies
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
      const baseIdx = Math.min(Math.max(0, comboCount - 2), scale.length - 2);

      const notes = [scale[baseIdx], scale[baseIdx + 1]];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteTime = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.4 * this.soundVolume, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.19);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Crisp UI button click
   */
  public playButtonClick() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Miss sound (soft thud/splat)
   */
  public playMiss() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

      gain.gain.setValueAtTime(0.25 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Game Over descending chime
   */
  public playGameOver() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const tones = [440, 392, 349.23, 293.66];
      tones.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const t = now + idx * 0.14;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, t);

        gain.gain.setValueAtTime(0.3 * this.soundVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.24);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Triumphant high score fanfare
   */
  public playNewHighScore() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const t = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.4 * this.soundVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === notes.length - 1 ? 0.6 : 0.2));

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.65);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Procedural upbeat background music loop:
   * Playful pentatonic marimba arpeggios + warm sub-bass groove + soft percussion pulse
   */
  public startMusic() {
    if (this.isMusicPlaying || !this.musicEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.isMusicPlaying = true;
      this.musicStep = 0;

      // 120 BPM -> 16th note = 125ms
      const stepDuration = 125;
      const bassNotes = [130.81, 130.81, 164.81, 196.0, 146.83, 146.83, 174.61, 220.0];
      const melodyNotes = [
        523.25, 0, 659.25, 783.99, 0, 659.25, 523.25, 0,
        587.33, 0, 783.99, 880.0, 0, 783.99, 659.25, 587.33
      ];

      this.musicIntervalId = window.setInterval(() => {
        if (!this.isMusicPlaying || !this.musicEnabled || !this.ctx || !this.musicGain) return;

        const now = this.ctx.currentTime;
        const step = this.musicStep % 16;
        const bassIdx = Math.floor(step / 2);

        // Bass pulse every 2 steps
        if (step % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassNotes[bassIdx] * 0.5, now);

          bassGain.gain.setValueAtTime(0.25 * this.musicVolume, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          bassOsc.connect(bassGain);
          bassGain.connect(this.musicGain);
          bassOsc.start(now);
          bassOsc.stop(now + 0.22);
        }

        // Marimba melodic step
        const note = melodyNotes[step];
        if (note > 0) {
          const mOsc = this.ctx.createOscillator();
          const mGain = this.ctx.createGain();
          mOsc.type = 'sine';
          mOsc.frequency.setValueAtTime(note, now);

          // Fast decay like wood block / marimba
          mGain.gain.setValueAtTime(0.18 * this.musicVolume, now);
          mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          mOsc.connect(mGain);
          mGain.connect(this.musicGain);
          mOsc.start(now);
          mOsc.stop(now + 0.13);
        }

        // Light percussion click on beats 4 and 12
        if (step === 4 || step === 12) {
          const hatLen = Math.floor(this.ctx.sampleRate * 0.03);
          const hatBuf = this.ctx.createBuffer(1, hatLen, this.ctx.sampleRate);
          const hatData = hatBuf.getChannelData(0);
          for (let i = 0; i < hatLen; i++) {
            hatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hatLen * 0.2));
          }
          const hatSrc = this.ctx.createBufferSource();
          hatSrc.buffer = hatBuf;
          const hFilter = this.ctx.createBiquadFilter();
          hFilter.type = 'highpass';
          hFilter.frequency.value = 5000;

          const hGain = this.ctx.createGain();
          hGain.gain.setValueAtTime(0.08 * this.musicVolume, now);
          hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          hatSrc.connect(hFilter);
          hFilter.connect(hGain);
          hGain.connect(this.musicGain);
          hatSrc.start(now);
          hatSrc.stop(now + 0.035);
        }

        this.musicStep++;
      }, stepDuration);
    } catch {
      // Audio fallback
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioManager = new AudioManager();
