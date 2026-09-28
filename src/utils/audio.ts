/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio synthesizer for crisp, satisfying fairy gem pop chain reaction chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Pentatonic frequencies for chain reaction cascades
const CHIME_PENTATONIC = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
];

export function playPopChime(stepIndex: number = 0, enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freq = CHIME_PENTATONIC[Math.min(stepIndex, CHIME_PENTATONIC.length - 1)];

    // Primary bell oscillator (sine)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Slight pitch pitch-up for bubbly sparkle pop feel
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + 0.05);

    // Harmonic sparkle oscillator (triangle)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.02, now);

    // Gain envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch {
    // Ignore audio errors
  }
}

// Shared noise buffer for silky swoosh / swish sound
let swooshNoiseBuffer: AudioBuffer | null = null;
function getSwooshNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (swooshNoiseBuffer && swooshNoiseBuffer.sampleRate === ctx.sampleRate) {
    return swooshNoiseBuffer;
  }
  const bufferSize = Math.floor(ctx.sampleRate * 0.25);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    // Pinkish filtered noise for smooth, silky air rather than harsh static
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut * 0.65) + (white * 0.35);
    data[i] = lastOut;
  }
  swooshNoiseBuffer = buffer;
  return buffer;
}

/**
 * Plays a quick, silky, physical "swoosh" / "swish" sound when two gems swap places.
 */
export function playSwapSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.16;

    // 1. Airy noise layer swept through a resonant bandpass filter (the physical "swish" / "swoosh")
    const noiseBuffer = getSwooshNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(2.6, now);
    // Sweeps up then smoothly descends for an authentic aerodynamic whip/swish
    bandpass.frequency.setValueAtTime(750, now);
    bandpass.frequency.exponentialRampToValueAtTime(2400, now + 0.04);
    bandpass.frequency.exponentialRampToValueAtTime(550, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.26, now + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Underlying tonal body glide (adds depth and weight to the motion)
    const tonalOsc = ctx.createOscillator();
    tonalOsc.type = 'sine';
    tonalOsc.frequency.setValueAtTime(460, now);
    tonalOsc.frequency.exponentialRampToValueAtTime(700, now + 0.035);
    tonalOsc.frequency.exponentialRampToValueAtTime(240, now + duration);

    const tonalGain = ctx.createGain();
    tonalGain.gain.setValueAtTime(0.0001, now);
    tonalGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    tonalGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.85);

    tonalOsc.connect(tonalGain);
    tonalGain.connect(ctx.destination);

    noiseSource.start(now);
    tonalOsc.start(now);
    noiseSource.stop(now + duration + 0.02);
    tonalOsc.stop(now + duration + 0.02);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a soft, low double buzz sound when swapping is attempted but energy is depleted.
 */
export function playDepletedSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a deep, ominous dark purple pulse resonance when the enemy gem is clicked or pulses.
 */
export function playEnemyPulseSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sub-bass dark rumble oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    // Dark crystalline overtone
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(110, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(120, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.46);
    osc2.stop(now + 0.46);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a dark deflection crackle/shield impact sound when dragging into enemy hexes.
 */
export function playEnemyDeflectSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays an impactful dark crystal crunch / hurt sound when the enemy gem takes damage from an adjacent match.
 */
export function playEnemyHitSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Hard impact strike
    const oscStrike = ctx.createOscillator();
    oscStrike.type = 'triangle';
    oscStrike.frequency.setValueAtTime(320, now);
    oscStrike.frequency.exponentialRampToValueAtTime(65, now + 0.22);

    // Dark crystalline shatter resonance
    const oscCrystal = ctx.createOscillator();
    oscCrystal.type = 'sawtooth';
    oscCrystal.frequency.setValueAtTime(540, now);
    oscCrystal.frequency.exponentialRampToValueAtTime(140, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    oscStrike.connect(filter);
    oscCrystal.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscStrike.start(now);
    oscCrystal.start(now);
    oscStrike.stop(now + 0.4);
    oscCrystal.stop(now + 0.4);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays an epic shattering explosion & triumphant magical chime when the enemy gem is completely defeated.
 */
export function playEnemyDefeatSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sub rumble boom
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.9);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.05);

    // Triumphant ascending magical chimes
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const noteTime = now + 0.15 + idx * 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a roaring fiery blast sound when the Dragon Flame powerup detonates.
 */
export function playDragonFlameSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Sub-bass fiery impact
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.55);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.35, now + 0.025);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.62);

    // 2. Fiery crackle / sparkle whoosh
    const sparkOsc = ctx.createOscillator();
    sparkOsc.type = 'triangle';
    sparkOsc.frequency.setValueAtTime(540, now);
    sparkOsc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    const sparkGain = ctx.createGain();
    sparkGain.gain.setValueAtTime(0.001, now);
    sparkGain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    sparkOsc.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    sparkOsc.start(now);
    sparkOsc.stop(now + 0.4);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a sparkling prismatic laser beam arpeggio when Sun Prism clears a gem color.
 */
export function playPrismRaySound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const prismFrequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];

    prismFrequencies.forEach((freq, idx) => {
      const noteTime = now + idx * 0.045;
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, noteTime + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays an electric ascending surge chime when Digit's Tech Pop activates.
 */
export function playEnergySurgeSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Upward frequency sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.28);
    osc.frequency.setValueAtTime(1046.5, now + 0.3); // High C

    const oscHarmonic = ctx.createOscillator();
    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(520, now);
    oscHarmonic.frequency.exponentialRampToValueAtTime(1840, now + 0.28);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 0.7);
    oscHarmonic.stop(now + 0.7);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a whimsical dimensional portal warp sound for Lockette's Portal Pop.
 */
export function playPortalWhooshSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.42);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a shimmering, loving harp bell arpeggio for Amore's Heart Pop.
 */
export function playHeartCharmSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a dreamy, celestial music-box lullaby for Piff's Dream Pop.
 */
export function playDreamLullabySound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [659.25, 587.33, 783.99, 880.0, 1046.5]; // E5, D5, G5, A5, C6

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.52);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a crystalline, cosmic time freeze chime for Lockette's Time Portal.
 */
export function playTimeFreezeSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Ascending harmonic ice glockenspiel
    const notes = [880.0, 1174.66, 1567.98, 2093.0]; // A5, D6, G6, C7
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, noteTime + 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.75);
    });

    // Subzero cold wind sweep
    const sweep = ctx.createOscillator();
    sweep.type = 'triangle';
    sweep.frequency.setValueAtTime(1400, now);
    sweep.frequency.exponentialRampToValueAtTime(420, now + 0.5);

    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.55);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a shattered dark crystal sound when an immovable enemy gem is destroyed by an adjacent match.
 */
export function playImmovableBreakSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a classic mobile game "Out of Time / Game Over alert" melodic warning chime.
 */
export function playTimeUpSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Descending two-tone alert with whimsical fairy resonance
    const notes = [440, 392, 349.2, 293.7]; // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a celebratory coin/gem purchase fanfare and magical harp sparkle chime.
 */
export function playPurchaseSuccessSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // 1. Bright jingle of gold coins / gems
    [987.77, 1318.51, 1567.98, 1975.53, 2637.02].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.001, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Triumphant "STAGE CLEARED" fanfare with ascending fairy brass chords and celestial sparkles.
 */
export function playStageClearedSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Ascending major fanfare notes: C5, E5, G5, B5, C6, E6, G6
    const fanfareNotes = [
      { f: 523.25, time: 0.0, dur: 0.28 },
      { f: 659.25, time: 0.12, dur: 0.28 },
      { f: 783.99, time: 0.24, dur: 0.32 },
      { f: 987.77, time: 0.36, dur: 0.35 },
      { f: 1046.5, time: 0.48, dur: 0.9 },
      { f: 1318.51, time: 0.52, dur: 0.95 },
      { f: 1567.98, time: 0.56, dur: 1.1 },
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.time);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(n.f * 2, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.linearRampToValueAtTime(0.28, now + n.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc2.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
      osc2.stop(now + n.time + n.dur + 0.05);
    });

    // 2. High fairy sparkle cascade
    const sparkleNotes = [1760, 2093, 2349.32, 2793.83, 3135.96, 3520];
    sparkleNotes.forEach((f, idx) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sTime = now + 0.45 + idx * 0.07;

      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(f, sTime);

      sGain.gain.setValueAtTime(0.001, sTime);
      sGain.gain.linearRampToValueAtTime(0.18, sTime + 0.015);
      sGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.4);

      sOsc.connect(sGain);
      sGain.connect(ctx.destination);

      sOsc.start(sTime);
      sOsc.stop(sTime + 0.45);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Quick magical swoosh when coins shoot out from the matched gem.
 */
export function playCoinFlySound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1480, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Crisp metallic coin collection chime when each flying coin hits the top coin badge.
 */
export function playCoinCollectSound(enabled: boolean = true, pitchOffset: number = 0) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const baseFreq = 1864.66 * Math.pow(1.05, pitchOffset % 8); // Bb6 ascending scale

    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(baseFreq * 2.75, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 0.28);
    oscHarmonic.stop(now + 0.28);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a subtle, tactile "drrr" vibration/shake sound when a gem is tapped.
 */
export function playGemTapDrrrSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.18; // 180ms subtle tactile shudder

    // Carrier oscillator: warm triangle wave giving gentle wooden/crystalline mass
    const carrier = ctx.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(175, now);
    carrier.frequency.exponentialRampToValueAtTime(135, now + duration);

    // Fast LFO creating the rapid "drrr" flutter/vibration (~32 Hz)
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(32, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(55, now);
    lfoGain.gain.exponentialRampToValueAtTime(10, now + duration);

    lfo.connect(carrier.frequency);

    // Subtle harmonic overtone giving crisp definition to each micro-vibration
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(350, now);
    harmonic.frequency.exponentialRampToValueAtTime(260, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(580, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + duration);
    filter.Q.setValueAtTime(2.0, now);

    // Master volume envelope for subtle, unobtrusive presence
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    carrier.connect(filter);
    harmonic.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    carrier.start(now);
    harmonic.start(now);
    lfo.start(now);

    carrier.stop(now + duration + 0.02);
    harmonic.stop(now + duration + 0.02);
    lfo.stop(now + duration + 0.02);
  } catch {
    // Ignore audio errors
  }
}





