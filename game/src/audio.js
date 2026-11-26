// The cockpit buzzer: every sound in the game is a short WebAudio tone
// synthesized on the fly — no audio files, nothing fetched. The context is
// only created on the first user gesture, and every call is guarded so a
// browser without sound still flies the mission in silence.

// Each jingle is a list of [frequency, seconds, wave, volume, delay] notes.
const JINGLES = {
  ring: [
    [784, 0.1, 'triangle', 0.12, 0],
    [1047, 0.14, 'triangle', 0.12, 0.08],
  ],
  perfect: [
    [784, 0.1, 'triangle', 0.12, 0],
    [1047, 0.14, 'triangle', 0.12, 0.08],
    [1319, 0.18, 'triangle', 0.12, 0.16],
  ],
  star: [
    [1047, 0.08, 'sine', 0.11, 0],
    [1568, 0.12, 'sine', 0.1, 0.06],
  ],
  fuel: [
    [440, 0.09, 'triangle', 0.11, 0],
    [587, 0.11, 'triangle', 0.11, 0.08],
  ],
  missed: [
    [392, 0.14, 'sawtooth', 0.06, 0],
    [330, 0.18, 'sawtooth', 0.06, 0.1],
  ],
  hit: [
    [160, 0.22, 'sawtooth', 0.1, 0],
    [110, 0.28, 'square', 0.08, 0.08],
  ],
  splash: [
    [300, 0.12, 'sine', 0.09, 0],
    [200, 0.2, 'sine', 0.09, 0.09],
  ],
  win: [523, 659, 784, 1047, 1319].map((freq, i) => [freq, 0.16, 'triangle', 0.12, i * 0.12]),
  lose: [392, 330, 262, 196].map((freq, i) => [freq, 0.2, 'triangle', 0.1, i * 0.14]),
};

export function makeChimes() {
  let ctx = null;
  let silenced = false;

  function context() {
    if (ctx) return ctx;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function playNote([freq, secs, wave, vol, delay]) {
    const audio = context();
    if (!audio || silenced) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + delay;
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + secs);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + secs);
    } catch {
      // Sound is garnish: a broken audio stack must never ground the plane.
    }
  }

  function play(name) {
    for (const note of JINGLES[name]) playNote(note);
  }

  return {
    /** Call from any user gesture so the browser unlocks the buzzer. */
    wake() {
      const audio = context();
      if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
    },
    /** Flip the mute switch; returns the new muted state. */
    flipMute() {
      silenced = !silenced;
      return silenced;
    },
    onRing(perfect) {
      play(perfect ? 'perfect' : 'ring');
    },
    onStar() {
      play('star');
    },
    onFuel() {
      play('fuel');
    },
    onMiss() {
      play('missed');
    },
    onHit() {
      play('hit');
    },
    onSplash() {
      play('splash');
    },
    onEnd(won) {
      play(won ? 'win' : 'lose');
    },
  };
}
