/**
 * Simple sound effects using Web Audio API.
 * No external audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Short "pop" sound for adding a person/chip.
 */
export function playPopSound(): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio not available
  }
}

/**
 * Drum roll / suspense sound building up.
 */
export function playRollSound(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioCtx();
      const duration = 1.5;
      const numBumps = 12;

      for (let i = 0; i < numBumps; i++) {
        const time = ctx.currentTime + (i / numBumps) * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const freq = 150 + (i / numBumps) * 300;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.02, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.1);
      }

      // Final "ta-da" sound
      setTimeout(() => {
        playRevealSound();
        resolve();
      }, duration * 1000 + 50);
    } catch {
      resolve();
    }
  });
}

/**
 * Reveal / victory sound when teams are shown.
 */
export function playRevealSound(): void {
  try {
    const ctx = getAudioCtx();

    // Chord: C major
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05 + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + 1);
    });
  } catch {
    // Audio not available
  }
}

/**
 * Click sound for buttons.
 */
export function playClickSound(): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Audio not available
  }
}
