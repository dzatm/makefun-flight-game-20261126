// Boot and the one loop. Input is read every frame, the sky advances in
// fixed 1/60 s ticks (several in a slow frame, none in a fast one), and the
// painter draws whatever is there. The game moves between four screens:
// title, play, paused and over.
//
// ?seed=N fixes the sky. ?shot=start|play|ring|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and raises
// window.__shotReady for a screenshot.
import { BEST_SLOT, TICK } from './config.js';
import { makeRng } from './random.js';
import { EV, makeWorld } from './world.js';
import { TAP_MUTE, TAP_PAUSE, TAP_START, watchInput } from './input.js';
import { makeChimes } from './audio.js';
import { makePainter, SCREENS } from './render.js';
import { stageScene } from './shots.js';

// The longest frame the loop will catch up on; a longer stall (a hidden
// tab) is dropped, not replayed.
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const world = makeWorld(makeRng(seed));
const painter = makePainter(canvas);
const chimes = makeChimes();
const input = watchInput(canvas);

// Exposed for play-testing from the console and the screenshot script;
// not part of play.
window.__world = world;

function resize() {
  painter.fit(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_SLOT) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_SLOT, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts
    // this visit only.
  }
}

function soundFor(ev) {
  if (ev & EV.OVER) chimes.onEnd(world.state.won);
  else if (ev & EV.HIT) chimes.onHit();
  else if (ev & EV.SPLASH) chimes.onSplash();
  else if (ev & EV.RING) chimes.onRing(Boolean(ev & EV.PERFECT));
  else if (ev & EV.STAR) chimes.onStar();
  else if (ev & EV.FUEL) chimes.onFuel();
  else if (ev & EV.MISSED) chimes.onMiss();
}

function runShot(name) {
  const scene = stageScene(name, world);
  let painted = 0;
  function paint() {
    painter.paint(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREENS.TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the changes.
  function announce(message) {
    statusLine.textContent = message;
  }

  function startGame() {
    chimes.wake();
    world.reset();
    accumulator = 0;
    screen = SCREENS.PLAY;
    announce('Airborne! Clear the rings, grab stars and fuel, dodge the storms.');
  }

  function endGame() {
    screen = SCREENS.OVER;
    if (world.state.points > best) {
      best = world.state.points;
      saveBest(best);
    }
    announce(`Mission over. Score ${world.state.points}. Best ${best}.`);
  }

  function stepPlay() {
    const taps = input.taps();
    if (taps & TAP_MUTE) {
      const muted = chimes.flipMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (taps & TAP_PAUSE) {
      screen = SCREENS.PAUSED;
      announce('Paused.');
      return;
    }
    const ev = world.advance(TICK, input.steer(), false);
    soundFor(ev);
    if (ev & EV.OVER) endGame();
    else if (ev & EV.HIT) {
      announce(`Storm hit! ${world.state.hearts} hearts left.`);
    } else if (ev & EV.RING) {
      announce(`Ring ${world.state.ringsDone} cleared! Score ${world.state.points}.`);
    }
  }

  function handleTaps() {
    const taps = input.taps();
    if (taps & TAP_MUTE) {
      const muted = chimes.flipMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    const clicked = input.tapped();
    if ((clicked || (taps & TAP_START)) && (screen === SCREENS.TITLE || screen === SCREENS.OVER)) {
      startGame();
      return;
    }
    if (taps & TAP_PAUSE && screen === SCREENS.PLAY) {
      screen = SCREENS.PAUSED;
      announce('Paused.');
    } else if (taps & (TAP_PAUSE | TAP_START) && screen === SCREENS.PAUSED) {
      screen = SCREENS.PLAY;
      announce('Flying again.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === SCREENS.PLAY) {
      while (accumulator >= TICK && screen === SCREENS.PLAY) {
        stepPlay();
        accumulator -= TICK;
      }
      if (screen !== SCREENS.PLAY) accumulator = 0;
    } else if (screen === SCREENS.TITLE) {
      // The title screen flies the plane behind it as a living backdrop.
      while (accumulator >= TICK) {
        world.advance(TICK, { climb: 0, throttle: 0, boost: false, steerY: null }, true);
        accumulator -= TICK;
      }
      handleTaps();
    } else {
      accumulator = 0;
      handleTaps();
    }
    painter.paint(world.state, screen, best);
  }

  // Leaving the tab pauses a running flight rather than letting it crash
  // unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREENS.PLAY) {
      screen = SCREENS.PAUSED;
      announce('Paused.');
    }
  });

  world.reset();
  announce('Sky Courier, Terbang Nusantara. Press Space or click to take off.');
  requestAnimationFrame(frame);
}

if (shotName) runShot(shotName);
else runGame();
