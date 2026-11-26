// Hands on the stick: keyboard and pointer, translated into the two things
// the game loop needs each frame — a held steering state, and a handful of
// one-shot taps (start, pause, mute) that must fire exactly once even when
// they land between frames.
//
// Moving the pointer hands the plane to the mouse: it steers toward the
// pointer's height until any vertical arrow key takes the stick back.

export const TAP_START = 1;
export const TAP_PAUSE = 2;
export const TAP_MUTE = 4;

// What each key code means while it is held down.
const HELD = {
  ArrowUp: 'climbUp',
  KeyW: 'climbUp',
  ArrowDown: 'climbDown',
  KeyS: 'climbDown',
  ArrowRight: 'throttleUp',
  KeyD: 'throttleUp',
  ArrowLeft: 'throttleDown',
  KeyA: 'throttleDown',
  Space: 'boost',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
};

// What each key code means the moment it goes down (auto-repeat ignored).
const TAPPED = {
  Space: TAP_START,
  Enter: TAP_START,
  KeyE: TAP_START,
  KeyP: TAP_PAUSE,
  Escape: TAP_PAUSE,
  KeyM: TAP_MUTE,
};

export function watchInput(canvas) {
  const held = {
    climbUp: false,
    climbDown: false,
    throttleUp: false,
    throttleDown: false,
    boost: false,
  };
  let taps = 0;
  let clicked = false;
  // The logical height the pointer is steering toward, or null while the
  // keyboard has the stick.
  let pointerY = null;

  function onKeyDown(event) {
    const slot = HELD[event.code];
    const tap = TAPPED[event.code];
    if (slot === undefined && tap === undefined) return;
    event.preventDefault();
    if (slot !== undefined) held[slot] = true;
    if (slot === 'climbUp' || slot === 'climbDown') pointerY = null;
    if (tap !== undefined && !event.repeat) taps |= tap;
  }

  function onKeyUp(event) {
    const slot = HELD[event.code];
    if (slot !== undefined) held[slot] = false;
  }

  function onBlur() {
    // A key released while the tab is hidden never delivers its keyup, so
    // let go of everything when focus leaves.
    for (const slot of Object.keys(held)) held[slot] = false;
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    // The canvas is stretched to the window; map the pointer back into the
    // 720-tall logical sky.
    const frac = (event.clientY - rect.top) / rect.height;
    pointerY = Math.max(0, Math.min(720, frac * 720));
  }

  function onPointerDown() {
    clicked = true;
    taps |= TAP_START;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** Held steering for this frame: climb -1..1, throttle -1..1, boost, steerY. */
    steer() {
      return {
        climb: (held.climbDown ? 1 : 0) - (held.climbUp ? 1 : 0),
        throttle: (held.throttleUp ? 1 : 0) - (held.throttleDown ? 1 : 0),
        boost: held.boost,
        steerY: pointerY,
      };
    },
    /** The one-shot taps queued since the last call, as TAP_* bits. */
    taps() {
      const out = taps;
      taps = 0;
      return out;
    },
    /** True exactly once after a pointer press (title/end screens start on it). */
    tapped() {
      const was = clicked;
      clicked = false;
      return was;
    },
  };
}
