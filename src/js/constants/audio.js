export const AUDIO_CONSTANTS = {
  VOLUME: {
    AMBIENT: {
      DESKTOP: -45,
      MOBILE: -50,
    },
    TICK: {
      DESKTOP: -18,
      MOBILE: -22,
      MUTE: -99,
    },
    STARTUP: {
      DESKTOP: -15,
      MOBILE: -18,
    },
  },
  FREQUENCY: {
    AMBIENT: {
      DESKTOP: 60,
      MOBILE: 40,
    },
    FILTER: {
      DESKTOP: 150,
      MOBILE: 100,
    },
  },
  TICK_THROTTLE_MS: {
    DESKTOP: 50,
    MOBILE: 100,
  },
  STARTUP_TONES: ['C5', 'D5', 'E5'],
  CONFIRM_TONE: 'C4',
  CONFIRM_TONE_DURATION: '0.2s',
  STARTUP_TONE_DURATION: '0.15s',
  MAX_VOLUME: -20,
  MIN_VOLUME: -60,
  VIBRATION: 50,
  SYNTH: {
    TICK: {
      envelope: {
        desktop: {
          attack: 0.005,
          decay: 0.06,
          sustain: 0,
          release: 0.08,
        },
        mobile: {
          attack: 0.005,
          decay: 0.04,
          sustain: 0,
          release: 0.06,
        },
      },
      noise: { type: 'pink' },
    },
    STARTUP: {
      harmonicity: 3,
      modulationIndex: { desktop: 10, mobile: 8 },
      envelope: {
        desktop: {
          attack: 0.01,
          decay: 0.4,
          sustain: 0.1,
          release: 0.8,
        },
        mobile: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.1,
          release: 0.6,
        },
      },
    },
  },
  STATE: {
    STARTED: 'started',
    STOPPED: 'stopped',
    RUNNING: 'running',
    UNAVAILABLE: 'unavailable',
  },
};
