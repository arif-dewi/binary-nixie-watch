/**
 * Audio Manager - Mobile Optimized Version
 * Tone.js is loaded only when needed, with mobile battery optimizations
 */
export class AudioManager {
  constructor() {
    this.soundEnabled = false;
    this.ambientVolume = -45;
    this.lastTickTime = 0;
    this.isInitialized = false;
    this.initializationAttempted = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Audio objects start as null
    this.ambientOscillator = null;
    this.ambientFilter = null;
    this.tickSynth = null;
    this.startupSynth = null;

    // Mobile-specific optimizations
    this.tickThrottle = this.isMobile ? 100 : 50; // Longer throttle on mobile
    this.setupMobileOptimizations();
  }

  setupMobileOptimizations() {
    // Reduce audio quality slightly on mobile for better performance
    if (this.isMobile) {
      this.ambientVolume = -50; // Quieter ambient on mobile

      // Listen for battery status if available
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          battery.addEventListener('levelchange', () => {
            // Disable ambient sound when battery is low
            if (battery.level < 0.2 && this.soundEnabled) {
              this.disableAmbientSound();
            }
          });
        });
      }

      // Listen for page visibility changes to pause audio when hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.soundEnabled) {
          this.pauseAudio();
        } else if (!document.hidden && this.soundEnabled) {
          this.resumeAudio();
        }
      });
    }
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

      // Create ambient filter with mobile-optimized settings
      this.ambientFilter = new Tone.Filter({
        frequency: this.isMobile ? 100 : 150, // Lower frequency on mobile
        type: "lowpass"
      }).toDestination();

      // Create ambient oscillator (don't start yet)
      this.ambientOscillator = new Tone.Oscillator({
        frequency: this.isMobile ? 40 : 60, // Lower frequency on mobile
        type: "sawtooth"
      });
      this.ambientOscillator.connect(this.ambientFilter);
      this.ambientOscillator.volume.value = this.ambientVolume;

      // Create tick sound with mobile optimization
      this.tickSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: {
          attack: 0.005,
          decay: this.isMobile ? 0.04 : 0.06, // Shorter on mobile
          sustain: 0,
          release: this.isMobile ? 0.06 : 0.08 // Shorter on mobile
        }
      }).toDestination();
      this.tickSynth.volume.value = this.isMobile ? -22 : -18; // Quieter on mobile

      // Create startup sound
      this.startupSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: this.isMobile ? 8 : 10, // Simpler on mobile
        envelope: {
          attack: 0.01,
          decay: this.isMobile ? 0.3 : 0.4,
          sustain: 0.1,
          release: this.isMobile ? 0.6 : 0.8
        }
      }).toDestination();
      this.startupSynth.volume.value = this.isMobile ? -18 : -15; // Quieter on mobile

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

        // Start ambient oscillator (but not on mobile if battery is low)
        if (this.ambientOscillator && this.ambientOscillator.state === 'stopped') {
          if (!this.isMobile || !this.isLowBattery()) {
            this.ambientOscillator.start();
          }
        }

        // Play confirmation tone
        if (this.startupSynth) {
          this.startupSynth.triggerAttackRelease('C4', '0.2s');
        }

        // Add haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else {
        button.classed('active', false);
        icon.text('🔇');

        // Stop ambient oscillator
        if (this.ambientOscillator && this.ambientOscillator.state === 'started') {
          this.ambientOscillator.stop();

          // Recreate oscillator for next time
          this.ambientOscillator = new Tone.Oscillator({
            frequency: this.isMobile ? 40 : 60,
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
    const throttleTime = this.isMobile ? (this.tickThrottle / 1000) : 0.05;

    if (now - this.lastTickTime < throttleTime) return;

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

  // Mobile-specific methods
  pauseAudio() {
    if (this.ambientOscillator && this.ambientOscillator.state === 'started') {
      try {
        Tone.Transport.pause();
      } catch (error) {
        // Silently handle error
      }
    }
  }

  resumeAudio() {
    if (this.soundEnabled && this.ambientOscillator) {
      try {
        Tone.Transport.start();
      } catch (error) {
        // Silently handle error
      }
    }
  }

  disableAmbientSound() {
    if (this.ambientOscillator && this.ambientOscillator.state === 'started') {
      try {
        this.ambientOscillator.stop();
      } catch (error) {
        // Silently handle error
      }
    }
  }

  isLowBattery() {
    // Simple battery check - in a real app you'd want to use the Battery API
    return false; // Placeholder - implement actual battery check if needed
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
      hasStartupSynth: !!this.startupSynth,
      isMobile: this.isMobile,
      tickThrottle: this.tickThrottle
    };
  }

  // Check if audio is ready for use
  isAudioReady() {
    return this.isInitialized &&
      typeof Tone !== 'undefined' &&
      Tone.context.state === 'running';
  }
}