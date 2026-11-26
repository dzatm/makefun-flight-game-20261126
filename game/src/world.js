// The sky and everything in it: the mail plane, the rings it threads, the
// stars and jerrycans it scoops up, the storm clouds it must not touch, and
// the mission clock ticking over all of it. Pure rules — nothing here draws.
// The renderer paints whatever this state holds, and the screenshot
// autopilot flies by calling the same advance() a player does.
import {
  CADENCE, CRAFT, ISLES, MAX_HEARTS, POINTS, RINGS_EARLY, RINGS_WIN,
  RUN_SECONDS, TANK, VIEW,
} from './config.js';
import { between, choose } from './random.js';

// Bit flags advance() hands back so the shell can play sounds and announce
// what just happened without peeking at the whole state.
export const EV = {
  NONE: 0,
  RING: 1,
  PERFECT: 2,
  STAR: 4,
  FUEL: 8,
  HIT: 16,
  MISSED: 32,
  OVER: 64,
  SPLASH: 128,
};

// A ring's mouth: cross inside this radius and the ring counts.
const RING_R = 54;
// Cross within this distance of the middle and the pass is "perfect".
const CENTRE_BAND = 18;
// Grace seconds after a dent, so one storm cloud costs exactly one heart.
const SHIELD_SECONDS = 1.5;

export function makeWorld(rng) {
  const state = blankState();

  function blankState() {
    return {
      t: 0,
      clock: RUN_SECONDS,
      points: 0,
      pointsFrac: 0,
      combo: 0,
      topCombo: 0,
      hearts: MAX_HEARTS,
      ringsDone: 0,
      ringsMissed: 0,
      starsGot: 0,
      cansGot: 0,
      fuel: TANK.capacity,
      flown: 0,
      craft: { y: 340, vy: 0, speed: CRAFT.cruise, tilt: 0, shield: 0, gliding: false },
      ringSet: [],
      starSet: [],
      canSet: [],
      stormSet: [],
      isleSet: [],
      cloudSet: [],
      nextRingIn: 2.2,
      nextStarIn: 1.4,
      nextCanIn: 6,
      nextStormIn: 4,
      nextIsleIn: 0.5,
      nextCloudIn: 0.2,
      ended: false,
      won: false,
      reason: '',
      shake: 0,
      // A short feedback line the renderer shows under the HUD.
      note: '',
      noteT: 0,
    };
  }

  function reset() {
    Object.assign(state, blankState());
    addIsle(420);
    addIsle(980);
    addCloud(240);
    addCloud(760);
    addCloud(1120);
  }

  function note(message) {
    state.note = message;
    state.noteT = 2.2;
  }

  // A random height inside the flyable band, kept clear of ceiling and sea.
  function bandY() {
    return between(rng, CRAFT.top + 60, CRAFT.sea - 90);
  }

  function addRing() {
    state.ringSet.push({ x: VIEW.w + 90, y: bandY(), r: RING_R, judged: false });
  }

  function addStar() {
    state.starSet.push({ x: VIEW.w + 60, y: bandY(), r: 16, spin: rng() * Math.PI * 2 });
  }

  function addCan() {
    state.canSet.push({ x: VIEW.w + 60, y: bandY(), r: 18 });
  }

  function addStorm() {
    state.stormSet.push({
      x: VIEW.w + 110,
      y: bandY(),
      r: between(rng, 40, 58),
      drift: between(rng, -14, 14),
      puff: rng() * Math.PI * 2,
    });
  }

  function addIsle(atX) {
    state.isleSet.push({
      x: atX ?? VIEW.w + 220,
      w: between(rng, 220, 380),
      isle: choose(rng, ISLES),
    });
  }

  function addCloud(atX) {
    state.cloudSet.push({
      x: atX ?? VIEW.w + 140,
      y: between(rng, 60, 300),
      s: between(rng, 0.7, 1.5),
    });
  }

  function finish(won, reason, ev) {
    state.ended = true;
    state.won = won;
    state.reason = reason;
    if (won && reason === 'rings') {
      // Sweeping every ring early cashes in the seconds still on the clock.
      state.points += Math.ceil(state.clock) * 5;
    }
    return ev | EV.OVER;
  }

  function dent(ev, splashed) {
    state.hearts -= 1;
    state.combo = 0;
    state.craft.shield = SHIELD_SECONDS;
    state.shake = 0.55;
    note(splashed ? 'Splash! The airframe is dented.' : 'Storm cloud hit! Airframe dented.');
    if (state.hearts <= 0) return finish(false, 'hearts', ev | EV.HIT);
    return ev | EV.HIT;
  }

  // --- the plane itself -----------------------------------------------------
  function flyCraft(dt, control, attract) {
    let ev = EV.NONE;
    const craft = state.craft;

    let wantVy;
    if (attract) {
      // Title-screen autopilot: a lazy sine wave across the sky.
      wantVy = Math.cos(state.t * 0.7) * 120;
    } else if (craft.gliding) {
      wantVy = 150; // dead engine: the nose sinks and the sea comes up
    } else if (control.steerY !== null && control.steerY !== undefined) {
      const pull = (control.steerY - craft.y) * 4;
      wantVy = Math.max(-CRAFT.climb, Math.min(CRAFT.climb, pull));
    } else {
      wantVy = control.climb * CRAFT.climb;
    }
    craft.vy += (wantVy - craft.vy) * Math.min(1, dt * 6);
    craft.y += craft.vy * dt;
    craft.tilt = Math.max(-0.45, Math.min(0.45, (craft.vy / CRAFT.climb) * 0.45));

    let wantSpeed;
    if (control.throttle >= 0) {
      wantSpeed = CRAFT.cruise + control.throttle * (CRAFT.fast - CRAFT.cruise);
    } else {
      wantSpeed = CRAFT.cruise + control.throttle * (CRAFT.cruise - CRAFT.slow);
    }
    if (control.boost && !craft.gliding) wantSpeed = CRAFT.boost;
    if (craft.gliding) wantSpeed = CRAFT.slow;
    if (attract) wantSpeed = CRAFT.cruise;
    const gap = wantSpeed - craft.speed;
    craft.speed += Math.sign(gap) * Math.min(Math.abs(gap), CRAFT.accel * dt);

    state.flown += craft.speed * dt;

    if (craft.y < CRAFT.top) {
      craft.y = CRAFT.top;
      craft.vy = Math.max(0, craft.vy);
    }
    if (craft.y >= CRAFT.sea) {
      craft.y = CRAFT.sea;
      if (craft.gliding && !attract) {
        return finish(state.ringsDone >= RINGS_WIN, 'fuel', ev | EV.SPLASH);
      }
      craft.vy = -280;
      if (!attract && craft.shield <= 0) ev = dent(ev, true) | EV.SPLASH;
    }
    return ev;
  }

  // --- tank and clock ---------------------------------------------------------
  function burnAndClock(dt, control) {
    const craft = state.craft;
    const burn = control.boost && !craft.gliding ? TANK.gulp : TANK.sip;
    state.fuel = Math.max(0, state.fuel - burn * dt);
    if (state.fuel <= 0 && !craft.gliding) {
      craft.gliding = true;
      note('Out of fuel! Gliding down…');
    }
    state.clock -= dt;
    if (state.clock <= 0) {
      state.clock = 0;
      return finish(state.ringsDone >= RINGS_WIN, 'time', EV.NONE);
    }
    // Distance pays a trickle, scaled by how fast the world is scrolling.
    state.pointsFrac += POINTS.perSecond * dt * (craft.speed / CRAFT.cruise);
    const whole = Math.floor(state.pointsFrac);
    if (whole > 0) {
      state.points += whole;
      state.pointsFrac -= whole;
    }
    return EV.NONE;
  }

  // --- spawning, with the late-run ramp ---------------------------------------
  function spawnSky(dt, ramp) {
    const ringEvery = CADENCE.ring + (CADENCE.ringLate - CADENCE.ring) * ramp;
    const stormEvery = CADENCE.storm + (CADENCE.stormLate - CADENCE.storm) * ramp;

    state.nextRingIn -= dt;
    if (state.nextRingIn <= 0) {
      addRing();
      state.nextRingIn = ringEvery * (0.85 + rng() * 0.3);
    }
    state.nextStarIn -= dt;
    if (state.nextStarIn <= 0) {
      addStar();
      state.nextStarIn = CADENCE.star * (0.8 + rng() * 0.4);
    }
    state.nextCanIn -= dt;
    if (state.nextCanIn <= 0) {
      addCan();
      state.nextCanIn = CADENCE.fuel * (0.85 + rng() * 0.3);
    }
    state.nextStormIn -= dt;
    if (state.nextStormIn <= 0) {
      addStorm();
      state.nextStormIn = stormEvery * (0.85 + rng() * 0.3);
    }
    state.nextIsleIn -= dt;
    if (state.nextIsleIn <= 0) {
      addIsle();
      state.nextIsleIn = CADENCE.isle * (0.8 + rng() * 0.5);
    }
    state.nextCloudIn -= dt;
    if (state.nextCloudIn <= 0) {
      addCloud();
      state.nextCloudIn = 2.4 * (0.7 + rng() * 0.6);
    }
  }

  // --- the world scrolls past --------------------------------------------------
  function driftSky(dt) {
    const scroll = state.craft.speed * dt;
    for (const ring of state.ringSet) ring.x -= scroll;
    for (const star of state.starSet) {
      star.x -= scroll;
      star.spin += dt * 2.4;
    }
    for (const can of state.canSet) can.x -= scroll;
    for (const storm of state.stormSet) {
      storm.x -= scroll;
      storm.y += storm.drift * dt;
      storm.puff += dt * 1.6;
      if (storm.y < CRAFT.top + 40) storm.drift = Math.abs(storm.drift);
      if (storm.y > CRAFT.sea - 60) storm.drift = -Math.abs(storm.drift);
    }
    // Parallax: islands and clouds lag behind the action.
    for (const isle of state.isleSet) isle.x -= scroll * 0.55;
    for (const cloud of state.cloudSet) cloud.x -= scroll * 0.32;

    state.ringSet = state.ringSet.filter((ring) => ring.x > -140);
    state.starSet = state.starSet.filter((star) => star.x > -80);
    state.canSet = state.canSet.filter((can) => can.x > -80);
    state.stormSet = state.stormSet.filter((storm) => storm.x > -180);
    state.isleSet = state.isleSet.filter((isle) => isle.x + isle.w > -80);
    state.cloudSet = state.cloudSet.filter((cloud) => cloud.x > -260);
  }

  // --- rings are judged the instant they reach the plane ------------------------
  function judgeRings(ev) {
    const craft = state.craft;
    for (const ring of state.ringSet) {
      if (ring.judged || ring.x > CRAFT.x) continue;
      ring.judged = true;
      const dy = Math.abs(craft.y - ring.y);
      if (dy <= ring.r - CRAFT.r * 0.35) {
        const perfect = dy <= CENTRE_BAND;
        state.ringsDone += 1;
        state.combo += 1;
        state.topCombo = Math.max(state.topCombo, state.combo);
        const earned = POINTS.ring
          + (perfect ? POINTS.perfect : 0)
          + POINTS.comboStep * (state.combo - 1);
        state.points += earned;
        ev |= EV.RING | (perfect ? EV.PERFECT : 0);
        note(perfect
          ? `Perfect! Ring ${state.ringsDone} +${earned}`
          : `Ring ${state.ringsDone} cleared! +${earned}`);
        if (state.ringsDone >= RINGS_EARLY) return finish(true, 'rings', ev);
      } else {
        state.ringsMissed += 1;
        state.combo = 0;
        ev |= EV.MISSED;
        note('Ring missed!');
      }
    }
    return ev;
  }

  // --- pickups: stars and jerrycans ----------------------------------------------
  function grabPickups(ev) {
    const craft = state.craft;
    const touches = (obj) => {
      const dx = obj.x - CRAFT.x;
      const dy = obj.y - craft.y;
      return dx * dx + dy * dy <= (CRAFT.r + obj.r) ** 2;
    };
    for (let i = state.starSet.length - 1; i >= 0; i -= 1) {
      if (!touches(state.starSet[i])) continue;
      state.starSet.splice(i, 1);
      state.starsGot += 1;
      state.points += POINTS.star;
      ev |= EV.STAR;
      note(`Star! +${POINTS.star}`);
    }
    for (let i = state.canSet.length - 1; i >= 0; i -= 1) {
      if (!touches(state.canSet[i])) continue;
      state.canSet.splice(i, 1);
      state.cansGot += 1;
      state.fuel = Math.min(TANK.capacity, state.fuel + TANK.can);
      if (craft.gliding && state.fuel > 0) craft.gliding = false;
      state.points += POINTS.fuel;
      ev |= EV.FUEL;
      note(`Fuel +${TANK.can}!`);
    }
    return ev;
  }

  // --- storm clouds ---------------------------------------------------------------
  function checkStorms(ev) {
    const craft = state.craft;
    if (craft.shield > 0) return ev;
    for (const storm of state.stormSet) {
      const dx = storm.x - CRAFT.x;
      const dy = storm.y - craft.y;
      if (dx * dx + dy * dy <= (CRAFT.r + storm.r * 0.78) ** 2) {
        return dent(ev, false);
      }
    }
    return ev;
  }

  /**
   * Advance the sky by `dt` seconds. `control` is { climb, throttle, boost,
   * steerY }: climb -1 (up) .. 1 (down), throttle -1 (slower) .. 1 (faster),
   * boost a held flag, steerY a logical y the mouse steers toward or null.
   * In attract mode (the title backdrop) the plane flies itself, nothing can
   * be hit, and the mission clock stands still.
   */
  function advance(dt, control, attract) {
    state.t += dt;
    if (state.noteT > 0) state.noteT -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.craft.shield > 0) state.craft.shield -= dt;

    const ramp = Math.min(1, (RUN_SECONDS - state.clock) / RUN_SECONDS);

    let ev = flyCraft(dt, control, attract);
    if (state.ended) return ev;

    if (!attract) {
      ev |= burnAndClock(dt, control);
      if (state.ended) return ev;
    }

    spawnSky(dt, ramp);
    driftSky(dt);
    if (attract) return ev;

    ev = judgeRings(ev);
    if (state.ended) return ev;
    ev = grabPickups(ev);
    ev = checkStorms(ev);
    return ev;
  }

  return { state, reset, advance };
}
