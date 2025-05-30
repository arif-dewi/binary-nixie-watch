/**
 * Audio Manager
 * Handles all sound effects and ambient audio
 */
export class AudioManager {
  constructor() {
    this.soundEnabled = false;
    this.ambientVolume = -45; // Default whisper quiet
    this.lastTickTime = 0; // Track last tick to prevent rapid firing
    this.audioContext = null;
    this.setupAudio();
  }

  async setupAudio() {
    // Don't initialize Tone.js until user interaction
    this.isInitialized = false;
  }

  async initializeAudio() {
    if (this.isInitialized) return;

    try {
      // Ensure Tone.js context is started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Ultra-quiet ambient hum (barely audible)
      this.ambientOscillator = new Tone.Oscillator({
        frequency: 60,
        type: "sawtooth"
      }).toDestination();

      this.ambientFilter = new Tone.Filter({
        frequency: 150,
        type: "lowpass"
      }).toDestination();

      this.ambientOscillator.connect(this.ambientFilter);
      this.ambientOscillator.volume.value = this.ambientVolume;

      // Perfect tick sound for bit changes
      this.tickSynth = new Tone.NoiseSynth({
        noise: {
          type: "pink"
        },
        envelope: {
          attack: 0.005,
          decay: 0.06,  // Shorter decay to prevent overlap
          sustain: 0,
          release: 0.08 // Shorter release
        }
      }).toDestination();
      this.tickSynth.volume.value = -18; // Keep ticks prominent

      // Startup sound
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
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  async toggleSound() {
    // Initialize audio on first user interaction
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    this.soundEnabled = !this.soundEnabled;
    const button = d3.select('#soundToggle');
    const icon = button.select('.sound-icon');

    if (this.soundEnabled && this.isInitialized) {
      try {
        button.classed('active', true);
        icon.text('🔊');

        if (this.ambientOscillator) {
          this.ambientOscillator.start();
        }

        // Soft confirmation tone
        if (this.startupSynth) {
          this.startupSynth.triggerAttackRelease('C4', '0.2s');
        }
      } catch (error) {
        console.warn('Error starting audio:', error);
      }
    } else {
      button.classed('active', false);
      icon.text('🔇');

      if (this.ambientOscillator && this.isInitialized) {
        try {
          this.ambientOscillator.stop();

          // Restart oscillator for next time
          this.ambientOscillator = new Tone.Oscillator({
            frequency: 60,
            type: "sawtooth"
          }).connect(this.ambientFilter);
          this.ambientOscillator.volume.value = this.ambientVolume;
        } catch (error) {
          console.warn('Error stopping audio:', error);
        }
      }
    }
  }

  // Method to adjust ambient volume
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(-60, Math.min(-20, volume)); // Clamp between -60 and -20
    if (this.soundEnabled && this.ambientOscillator) {
      this.ambientOscillator.volume.value = this.ambientVolume;
    }
  }

  playTickSound() {
    if (!this.soundEnabled || !this.isInitialized || !this.tickSynth) return;

    // Prevent rapid-fire ticks (minimum 50ms between ticks)
    const now = Tone.now();
    if (now - this.lastTickTime < 0.05) return;

    try {
      // Use Tone.now() + small offset for scheduling
      this.tickSynth.triggerAttackRelease('16n', now + 0.01);
      this.lastTickTime = now;
    } catch (error) {
      console.warn('Tick sound failed:', error);
    }
  }

  playStartupSequenceSound(tubeIndex) {
    if (!this.soundEnabled || !this.isInitialized || !this.startupSynth) return;

    try {
      const frequencies = ['C5', 'D5', 'E5'];
      const freq = frequencies[tubeIndex % frequencies.length];
      // Schedule with slight delay to avoid conflicts
      const when = Tone.now() + (tubeIndex * 0.1);
      this.startupSynth.triggerAttackRelease(freq, '0.15s', when);
    } catch (error) {
      console.warn('Startup sound failed:', error);
    }
  }
}