/**
 * Audio Manager - Lazy Loading Version
 * Tone.js is loaded only when needed, after user interaction
 */
export class AudioManager {
  constructor() {
    this.soundEnabled = false;
    this.ambientVolume = -45;
    this.lastTickTime = 0;
    this.isInitialized = false;
    this.initializationAttempted = false;

    // Audio objects start as null
    this.ambientOscillator = null;
    this.ambientFilter = null;
    this.tickSynth = null;
    this.startupSynth = null;
  }

  async ensureToneIsAvailable() {
    // Check if Tone.js is available, if not load it
    if (typeof Tone === 'undefined') {
      if (typeof window.loadToneJS === 'function') {
        await window.loadToneJS();
      } else {
        throw new Error('Tone.js loader not available');
      }
    }

    // Verify Tone.js is now available
    if (typeof Tone === 'undefined') {
      throw new Error('Tone.js failed to load');
    }

    // Initialize audio objects if not done yet
    if (!this.isInitialized && !this.initializationAttempted) {
      await this.initializeAudioObjects();
    }

    return this.isInitialized;
  }

  async initializeAudioObjects() {
    if (this.initializationAttempted) return this.isInitialized;

    this.initializationAttempted = true;

    try {
      // Ensure Tone.js context is ready
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create ambient filter
      this.ambientFilter = new Tone.Filter({
        frequency: 150,
        type: "lowpass"
      }).toDestination();

      // Create ambient oscillator (don't start yet)
      this.ambientOscillator = new Tone.Oscillator({
        frequency: 60,
        type: "sawtooth"
      });
      this.ambientOscillator.connect(this.ambientFilter);
      this.ambientOscillator.volume.value = this.ambientVolume;

      // Create tick sound
      this.tickSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: {
          attack: 0.005,
          decay: 0.06,
          sustain: 0,
          release: 0.08
        }
      }).toDestination();
      this.tickSynth.volume.value = -18;

      // Create startup sound
      this.startupSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        envelope: {
          attack: 0.01,
          decay: 0.4,
          sustain: 0.1,
          release: 0.8
        }
      }).toDestination();
      this.startupSynth.volume.value = -15;

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('❌ Audio initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async toggleSound() {
    try {
      // Ensure Tone.js is loaded and initialized
      const audioReady = await this.ensureToneIsAvailable();
      if (!audioReady) {
        console.warn('Audio not available');
        return;
      }

      this.soundEnabled = !this.soundEnabled;
      const button = d3.select('#soundToggle');
      const icon = button.select('.sound-icon');

      if (this.soundEnabled) {
        button.classed('active', true);
        icon.text('🔊');

        // Start ambient oscillator
        if (this.ambientOscillator && this.ambientOscillator.state === 'stopped') {
          this.ambientOscillator.start();
        }

        // Play confirmation tone
        if (this.startupSynth) {
          this.startupSynth.triggerAttackRelease('C4', '0.2s');
        }
      } else {
        button.classed('active', false);
        icon.text('🔇');

        // Stop ambient oscillator
        if (this.ambientOscillator && this.ambientOscillator.state === 'started') {
          this.ambientOscillator.stop();

          // Recreate oscillator for next time
          this.ambientOscillator = new Tone.Oscillator({
            frequency: 60,
            type: "sawtooth"
          });
          this.ambientOscillator.connect(this.ambientFilter);
          this.ambientOscillator.volume.value = this.ambientVolume;
        }
      }
    } catch (error) {
      console.warn('Sound toggle failed:', error);

      // Update UI to show sound is unavailable
      const button = d3.select('#soundToggle');
      const icon = button.select('.sound-icon');
      button.classed('active', false);
      icon.text('🚫');
    }
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(-60, Math.min(-20, volume));
    if (this.soundEnabled && this.ambientOscillator) {
      this.ambientOscillator.volume.value = this.ambientVolume;
    }
  }

  playTickSound() {
    // Silently fail if audio not ready
    if (!this.soundEnabled ||
      !this.isInitialized ||
      !this.tickSynth ||
      typeof Tone === 'undefined' ||
      Tone.context.state !== 'running') {
      return;
    }

    const now = Tone.now();
    if (now - this.lastTickTime < 0.05) return;

    try {
      this.tickSynth.triggerAttackRelease('16n', now + 0.01);
      this.lastTickTime = now;
    } catch (error) {
      // Silently fail - don't spam console during normal operation
    }
  }

  playStartupSequenceSound(tubeIndex) {
    // Silently fail if audio not ready
    if (!this.soundEnabled ||
      !this.isInitialized ||
      !this.startupSynth ||
      typeof Tone === 'undefined' ||
      Tone.context.state !== 'running') {
      return;
    }

    try {
      const frequencies = ['C5', 'D5', 'E5'];
      const freq = frequencies[tubeIndex % frequencies.length];
      const when = Tone.now() + (tubeIndex * 0.1);
      this.startupSynth.triggerAttackRelease(freq, '0.15s', when);
    } catch (error) {
      // Silently fail - don't spam console during normal operation
    }
  }

  // Utility methods
  getAudioState() {
    return {
      soundEnabled: this.soundEnabled,
      isInitialized: this.isInitialized,
      initializationAttempted: this.initializationAttempted,
      toneAvailable: typeof Tone !== 'undefined',
      contextState: typeof Tone !== 'undefined' ? Tone.context.state : 'unavailable',
      hasOscillator: !!this.ambientOscillator,
      hasTickSynth: !!this.tickSynth,
      hasStartupSynth: !!this.startupSynth
    };
  }

  // Check if audio is ready for use
  isAudioReady() {
    return this.isInitialized &&
      typeof Tone !== 'undefined' &&
      Tone.context.state === 'running';
  }
}