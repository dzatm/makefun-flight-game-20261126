// The staged scenes behind ?shot=start|play|ring|end. Each one flies the
// real rules forward from a fresh world, steered by a small autopilot that
// aims at the next ring (detouring for fuel when the tank runs low), so the
// frame shows what a short flight really looks like — and the same seed
// always produces the same frame.
import { CRAFT, TICK } from './config.js';
import { EV } from './world.js';
import { SCREENS } from './render.js';

const START_SECONDS = 6;
const PLAY_LIMIT_SECONDS = 60;
const RING_LIMIT_SECONDS = 60;
const END_LIMIT_SECONDS = 240;

// One frame of autopilot steering, in the shape world.advance() takes.
function autopilot(state) {
  const craft = state.craft;
  // Default target: the next unjudged ring still ahead of the plane.
  let aimY = craft.y;
  const ring = state.ringSet.find((open) => !open.judged && open.x > CRAFT.x);
  if (ring) aimY = ring.y;
  // Running dry? Chase the nearest jerrycan instead.
  if (state.fuel < 32) {
    const can = state.canSet.find((open) => open.x > CRAFT.x);
    if (can) aimY = can.y;
  }
  // A star within easy reach is worth a detour while no ring is imminent.
  const ringImminent = ring && ring.x - CRAFT.x < 420;
  if (!ringImminent) {
    const star = state.starSet.find((open) => open.x > CRAFT.x && open.x - CRAFT.x < 520);
    if (star) aimY = star.y;
  }
  // Sidestep any storm cloud sitting right on the line to the target.
  for (const storm of state.stormSet) {
    const ahead = storm.x - CRAFT.x;
    if (ahead > 0 && ahead < 320 && Math.abs(storm.y - aimY) < storm.r + 30) {
      aimY = storm.y + (craft.y <= storm.y ? -(storm.r + 70) : storm.r + 70);
      aimY = Math.max(CRAFT.top + 40, Math.min(CRAFT.sea - 60, aimY));
    }
  }
  return { climb: 0, throttle: 0, boost: false, steerY: aimY };
}

/**
 * Set `world` to the named scene (start, play, ring or end; any other name
 * falls back to start) and return the screen to draw over it plus the best
 * score to show on that screen.
 */
export function stageScene(name, world) {
  const state = world.state;
  world.reset();
  const idle = { climb: 0, throttle: 0, boost: false, steerY: null };

  if (name !== 'play' && name !== 'ring' && name !== 'end') {
    // start: six seconds of title-screen attract flight behind the card.
    for (let i = 0; i < START_SECONDS / TICK; i += 1) {
      world.advance(TICK, idle, true);
    }
    return { screen: SCREENS.TITLE, best: 0 };
  }

  if (name === 'end') {
    // Fly the whole mission on autopilot: with seed 1 it threads ring after
    // ring and sweeps the early-finish line, so the report card shows a
    // won run — every ring cleared, time bonus banked, score past target.
    for (let i = 0; i < END_LIMIT_SECONDS / TICK; i += 1) {
      if (world.advance(TICK, autopilot(state), false) & EV.OVER) break;
    }
    return { screen: state.ended ? SCREENS.OVER : SCREENS.PLAY, best: state.points };
  }

  if (name === 'ring') {
    // Stop just after the second ring is cleared, feedback line still up.
    let cleared = 0;
    for (let i = 0; i < RING_LIMIT_SECONDS / TICK; i += 1) {
      const ev = world.advance(TICK, autopilot(state), false);
      if (ev & EV.RING) cleared += 1;
      if (cleared >= 2 || (ev & EV.OVER)) break;
    }
    return { screen: SCREENS.PLAY, best: state.points };
  }

  // play: stop mid-action — the next ring close ahead, a combo or a fresh
  // pickup note on screen, a storm cloud in frame for stakes.
  for (let i = 0; i < PLAY_LIMIT_SECONDS / TICK; i += 1) {
    if (world.advance(TICK, autopilot(state), false) & EV.OVER) break;
    const ahead = state.ringSet.some(
      (ring) => !ring.judged && ring.x > CRAFT.x + 320 && ring.x < 1080,
    );
    const lively = state.combo >= 2 || state.noteT > 0.4;
    if (state.t > 14 && ahead && lively && state.stormSet.length > 0) break;
  }
  return { screen: SCREENS.PLAY, best: state.points };
}
