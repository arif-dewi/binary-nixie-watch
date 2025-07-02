import { AUDIO_CONSTANTS as C } from './constants/audio';
import {
    isToneAvailable,
    isToneReady,
    isOscillatorStopped,
} from './helpers/audioUtils';

export class AudioManager {
    constructor() {
        this.soundEnabled = false;
        this.ambientVolume = C.VOLUME.AMBIENT.DESKTOP;
        this.lastTickTime = 0;
        this.isInitialized = false;
        this.initializationAttempted = false;

        this.isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
        this.tickThrottle = this.isMobile
            ? C.TICK_THROTTLE_MS.MOBILE
            : C.TICK_THROTTLE_MS.DESKTOP;

        this.ambientOscillator = null;
        this.ambientFilter = null;
        this.tickSynth = null;
        this.startupSynth = null;

        this.setupMobileOptimizations();
    }

    setupMobileOptimizations() {
        if (!this.isMobile) return;
        this.ambientVolume = C.VOLUME.AMBIENT.MOBILE;

        navigator.getBattery?.().then((battery) => {
            battery.addEventListener('levelchange', () => {
                if (battery.level < 0.2 && this.soundEnabled)
                    this.disableAmbientSound();
            });
        });

        document.addEventListener('visibilitychange', () => {
            if (!this.soundEnabled) return;
            document.hidden ? this.pauseAudio() : this.resumeAudio();
        });
    }

    async ensureToneIsAvailable() {
        if (!isToneAvailable() && typeof window.loadToneJS === 'function') {
            await window.loadToneJS();
        }
        if (!isToneAvailable()) throw new Error('Tone.js not available');
        if (!this.isInitialized && !this.initializationAttempted) {
            await this.initializeAudioObjects();
        }
        return this.isInitialized;
    }

    async initializeAudioObjects() {
        this.initializationAttempted = true;

        try {
            if (Tone.context.state !== C.STATE.RUNNING) {
                await Tone.start();
            }

            this.ambientFilter = new Tone.Filter({
                frequency: this.isMobile
                    ? C.FREQUENCY.FILTER.MOBILE
                    : C.FREQUENCY.FILTER.DESKTOP,
                type: 'lowpass',
            }).toDestination();

            this.ambientOscillator = new Tone.Oscillator({
                frequency: this.isMobile
                    ? C.FREQUENCY.AMBIENT.MOBILE
                    : C.FREQUENCY.AMBIENT.DESKTOP,
                type: 'sawtooth',
            }).connect(this.ambientFilter);
            this.ambientOscillator.volume.value = this.ambientVolume;

            this.tickSynth = new Tone.NoiseSynth({
                noise: C.SYNTH.TICK.noise,
                envelope: this.isMobile
                    ? C.SYNTH.TICK.envelope.mobile
                    : C.SYNTH.TICK.envelope.desktop,
            }).toDestination();
            this.tickSynth.volume.value = this.isMobile
                ? C.VOLUME.TICK.MOBILE
                : C.VOLUME.TICK.DESKTOP;

            this.startupSynth = new Tone.FMSynth({
                harmonicity: C.SYNTH.STARTUP.harmonicity,
                modulationIndex: this.isMobile
                    ? C.SYNTH.STARTUP.modulationIndex.mobile
                    : C.SYNTH.STARTUP.modulationIndex.desktop,
                envelope: this.isMobile
                    ? C.SYNTH.STARTUP.envelope.mobile
                    : C.SYNTH.STARTUP.envelope.desktop,
            }).toDestination();
            this.startupSynth.volume.value = this.isMobile
                ? C.VOLUME.STARTUP.MOBILE
                : C.VOLUME.STARTUP.DESKTOP;

            this.isInitialized = true;
            return true;
        } catch (err) {
            console.warn('❌ Audio init failed:', err);
            return false;
        }
    }

    async toggleSound() {
        try {
            const ready = await this.ensureToneIsAvailable();
            if (!ready) return;

            this.soundEnabled = !this.soundEnabled;
            const btn = d3.select('#soundToggle');
            const icon = btn.select('.sound-icon');

            if (this.soundEnabled) {
                btn.classed('active', true);
                icon.text('🔊');

                if (isOscillatorStopped(this.ambientOscillator)) {
                    if (!this.isMobile || !this.isLowBattery()) {
                        this.ambientOscillator.start();
                    }
                }

                this.tickSynth.volume.value = this.isMobile
                    ? C.VOLUME.TICK.MOBILE
                    : C.VOLUME.TICK.DESKTOP;

                this.startupSynth?.triggerAttackRelease(
                    C.CONFIRM_TONE,
                    C.CONFIRM_TONE_DURATION
                );
                navigator.vibrate?.(C.VIBRATION);
            } else {
                btn.classed('active', false);
                icon.text('🔇');

                this.ambientOscillator?.stop();
                this.resetAmbientOscillator();

                this.tickSynth.volume.value = C.VOLUME.TICK.MUTE;
            }
        } catch (err) {
            console.warn('🔇 toggleSound failed:', err);
            const btn = d3.select('#soundToggle');
            btn.classed('active', false).select('.sound-icon').text('🚫');
        }
    }

    resetAmbientOscillator() {
        this.ambientOscillator = new Tone.Oscillator({
            frequency: this.isMobile
                ? C.FREQUENCY.AMBIENT.MOBILE
                : C.FREQUENCY.AMBIENT.DESKTOP,
            type: 'sawtooth',
        }).connect(this.ambientFilter);
        this.ambientOscillator.volume.value = this.ambientVolume;
    }

    playTickSound() {
        if (!this.isAudioReady() || !this.tickSynth) return;
        if (this.tickSynth.volume.value <= C.VOLUME.TICK.MUTE) return;

        const now = Tone.now();
        const minInterval = this.tickThrottle / 1000;

        if (now - this.lastTickTime >= minInterval) {
            this.tickSynth.triggerAttackRelease('16n', now + 0.01);
            this.lastTickTime = now;
        }
    }

    playStartupSequenceSound(index) {
        if (!this.isAudioReady() || !this.startupSynth) return;
        const tone = C.STARTUP_TONES[index % C.STARTUP_TONES.length];
        this.startupSynth.triggerAttackRelease(
            tone,
            C.STARTUP_TONE_DURATION,
            Tone.now() + index * 0.1
        );
    }

    pauseAudio() {
        try {
            Tone.Transport.pause();
        } catch {}
    }

    resumeAudio() {
        try {
            if (this.soundEnabled) Tone.Transport.start();
        } catch {}
    }

    disableAmbientSound() {
        try {
            this.ambientOscillator?.stop();
        } catch {}
    }

    isLowBattery() {
        return false; // Battery API logic can be implemented later
    }

    isAudioReady() {
        return this.isInitialized && isToneReady();
    }
}
