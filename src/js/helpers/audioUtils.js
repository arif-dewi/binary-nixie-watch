import { AUDIO_CONSTANTS as C } from '../constants/audio';

export function isToneAvailable() {
  return typeof Tone !== 'undefined';
}

export function isToneReady() {
  return isToneAvailable() && Tone.context.state === C.STATE.RUNNING;
}

export function isOscillatorStopped(osc) {
  return osc?.state === C.STATE.STOPPED;
}
