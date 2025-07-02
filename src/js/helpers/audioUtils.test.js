import {
  isOscillatorStopped,
  isToneReady,
  isToneAvailable
} from './audioUtils'

import { describe, expect, it } from 'vitest'

describe('Audio Utils', () => {
  it('should check if Tone.js is available', () => {
    expect(isToneAvailable()).toBe(typeof Tone !== 'undefined');
  });

  it('should check if Tone.js is ready', () => {
    expect(isToneReady()).toBe(isToneAvailable() && Tone.context.state === 'running');
  });

  it('should check if an oscillator is stopped', () => {
    const osc = { state: 'stopped' };
    expect(isOscillatorStopped(osc)).toBe(true);

    osc.state = 'started';
    expect(isOscillatorStopped(osc)).toBe(false);

    expect(isOscillatorStopped(null)).toBe(false);
  });
})