// The painter: everything the player sees, drawn on one canvas — the sunset
// sky, the sea and its islands, rings, stars, jerrycans, storm clouds, the
// little red mail plane, the instrument panel, and the title, pause and
// mission-report screens. Every shape is a canvas path; there are no image
// files and nothing is fetched.
import {
  CRAFT, GOAL_SCORE, INK, MAX_HEARTS, RINGS_WIN, RUN_SECONDS, TANK, TYPE, VIEW,
} from './config.js';

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  OVER: 'over',
};

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, value, x, y, size, colour, align = 'left', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${TYPE}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function clockText(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function heart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#e84a3a' : 'rgba(255,246,227,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.8);
  ctx.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.6, -s, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.6, -s, s * 1.2, -s * 0.1, 0, s * 0.8);
  ctx.fill();
  ctx.restore();
}

function puff(ctx, x, y, s, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y + 4 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x - 30 * s, y + 5 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 6 * s, y - 12 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx, x, y, r, rotation) {
  ctx.save();
  ctx.translate(x, y);
  // A soft glow so pickups read at a glance against the bright sky.
  const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.1);
  halo.addColorStop(0, 'rgba(255,228,94,0.5)');
  halo.addColorStop(1, 'rgba(255,228,94,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(rotation);
  ctx.fillStyle = INK.starGold;
  ctx.strokeStyle = '#d9a406';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * rad;
    const py = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function jerrycan(ctx, x, y, t) {
  const bob = Math.sin(t * 3 + x * 0.02) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = INK.canOrange;
  rounded(ctx, -13, -16, 26, 32, 5);
  ctx.fill();
  ctx.fillStyle = '#b94a06';
  ctx.fillRect(-13, -16, 26, 7);
  ctx.strokeStyle = INK.paper;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(6, 8);
  ctx.moveTo(6, -4);
  ctx.lineTo(-6, 8);
  ctx.stroke();
  ctx.fillStyle = INK.ringGold;
  ctx.beginPath();
  ctx.arc(0, -20, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function stormCloud(ctx, storm) {
  ctx.save();
  ctx.translate(storm.x, storm.y);
  const s = storm.r / 46;
  puff(ctx, 0, 0, s * 1.5, INK.stormBody);
  puff(ctx, -14 * s, 8 * s, s * 1.15, INK.stormShade);
  puff(ctx, 16 * s, 9 * s, s * 1.05, INK.stormShade);
  // Lightning flickers under the cloud now and then.
  if (Math.sin(storm.puff * 2.1) > 0.55) {
    ctx.fillStyle = INK.starGold;
    ctx.beginPath();
    ctx.moveTo(2 * s, 16 * s);
    ctx.lineTo(-8 * s, 34 * s);
    ctx.lineTo(-1 * s, 34 * s);
    ctx.lineTo(-6 * s, 50 * s);
    ctx.lineTo(9 * s, 28 * s);
    ctx.lineTo(2 * s, 28 * s);
    ctx.lineTo(8 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function ring(ctx, item, t, isNext) {
  ctx.save();
  ctx.translate(item.x, item.y);
  const pulse = isNext ? 1 + Math.sin(t * 5) * 0.05 : 1;
  ctx.scale(pulse, pulse);
  if (isNext && !item.judged) {
    // A breathing halo of light around the target ring, plus four sparkles
    // orbiting it, so the eye lands on the goal before anything else.
    const glow = ctx.createRadialGradient(0, 0, item.r * 0.6, 0, 0, item.r * 1.9);
    glow.addColorStop(0, 'rgba(255,210,63,0)');
    glow.addColorStop(0.55, 'rgba(255,210,63,0.28)');
    glow.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, item.r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK.ringPale;
    for (let i = 0; i < 4; i += 1) {
      const a = t * 2.4 + (i * Math.PI) / 2;
      const sx = Math.cos(a) * (item.r + 13);
      const sy = Math.sin(a) * (item.r + 13);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = item.judged ? 'rgba(255,210,63,0.35)' : INK.ringGold;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, item.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = item.judged ? 'rgba(255,239,159,0.3)' : INK.ringPale;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, item.r - 7, 0, Math.PI * 2);
  ctx.stroke();
  if (isNext && !item.judged) {
    // A little pennant on the next ring so the eye finds it at once.
    ctx.fillStyle = INK.planeRed;
    ctx.beginPath();
    ctx.moveTo(0, -item.r - 16);
    ctx.lineTo(16, -item.r - 9);
    ctx.lineTo(0, -item.r - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function island(ctx, item) {
  const baseY = CRAFT.sea + 26;
  const cx = item.x + item.w / 2;
  ctx.fillStyle = item.isle.sand;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, item.w / 2, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = item.isle.green;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 8, item.w / 2.6, 26, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Two palms leaning over the sand.
  for (const px of [cx - item.w * 0.22, cx + item.w * 0.18]) {
    ctx.strokeStyle = '#7a4a21';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, baseY - 14);
    ctx.quadraticCurveTo(px + 6, baseY - 38, px + 12, baseY - 48);
    ctx.stroke();
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 3;
    for (const angle of [-0.9, -0.3, 0.3, 0.9]) {
      ctx.beginPath();
      ctx.moveTo(px + 12, baseY - 48);
      ctx.quadraticCurveTo(
        px + 12 + Math.sin(angle) * 20,
        baseY - 48 - Math.cos(angle) * 12,
        px + 12 + Math.sin(angle) * 30,
        baseY - 48 - Math.cos(angle) * 4 + 8,
      );
      ctx.stroke();
    }
  }
  // A mail hut with a thatched roof between the palms — every island is a
  // stop on the route, and the little red flag says so.
  const hutX = cx - 4;
  const hutY = baseY - 16;
  ctx.fillStyle = '#a4713f';
  ctx.fillRect(hutX - 13, hutY - 13, 26, 14);
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(hutX - 18, hutY - 12);
  ctx.lineTo(hutX, hutY - 27);
  ctx.lineTo(hutX + 18, hutY - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(hutX - 4, hutY - 9, 8, 10);
  ctx.strokeStyle = '#5d3c1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hutX + 14, hutY - 12);
  ctx.lineTo(hutX + 14, hutY - 30);
  ctx.stroke();
  ctx.fillStyle = INK.planeRed;
  ctx.beginPath();
  ctx.moveTo(hutX + 14, hutY - 30);
  ctx.lineTo(hutX + 26, hutY - 26);
  ctx.lineTo(hutX + 14, hutY - 22);
  ctx.closePath();
  ctx.fill();
  label(ctx, item.isle.label, cx, baseY + 26, 12, 'rgba(255,246,227,0.75)', 'center', 600);
}

function plane(ctx, state, t) {
  const craft = state.craft;
  // Blink while shielded, so the grace period is visible.
  if (craft.shield > 0 && Math.floor(t * 12) % 2 === 0) return;
  ctx.save();
  ctx.translate(CRAFT.x, craft.y);
  ctx.rotate(craft.tilt);
  // Shadow skating on the sea far below.
  ctx.fillStyle = INK.shadow;
  ctx.beginPath();
  ctx.ellipse(0, CRAFT.sea - craft.y + 30, 40, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Draw the mail plane a third larger than life so it reads clearly as
  // the aircraft in frame, even shrunk into a contact sheet. The shadow
  // above stays unscaled so it still lands on the sea.
  ctx.scale(1.3, 1.3);
  // Tail feathers.
  ctx.fillStyle = INK.planeRed;
  ctx.beginPath();
  ctx.moveTo(-34, -2);
  ctx.lineTo(-50, -18);
  ctx.lineTo(-44, 2);
  ctx.lineTo(-50, 10);
  ctx.lineTo(-34, 6);
  ctx.closePath();
  ctx.fill();
  // Fuselage.
  ctx.fillStyle = INK.planeRed;
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c1272d';
  ctx.beginPath();
  ctx.ellipse(-4, 5, 36, 7, 0, 0, Math.PI);
  ctx.fill();
  // Wing.
  ctx.fillStyle = INK.wingCream;
  ctx.beginPath();
  ctx.ellipse(-2, 8, 26, 7, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9c84a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Canopy and the pilot under it.
  ctx.fillStyle = '#aee2ff';
  ctx.beginPath();
  ctx.ellipse(8, -9, 13, 8, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(8, -11, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK.bark;
  ctx.fillRect(3, -17, 10, 3.5);
  // The mail bag slung under the wing.
  ctx.fillStyle = '#8a5a33';
  rounded(ctx, -14, 10, 18, 13, 4);
  ctx.fill();
  ctx.fillStyle = INK.paper;
  ctx.fillRect(-11, 14, 12, 5);
  // Propeller, spinning faster with speed.
  const spin = t * (18 + craft.speed * 0.05);
  ctx.strokeStyle = 'rgba(43,33,24,0.75)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(43, -Math.cos(spin) * 17);
  ctx.lineTo(43, Math.cos(spin) * 17);
  ctx.stroke();
  ctx.fillStyle = INK.bark;
  ctx.beginPath();
  ctx.arc(42, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Exhaust puffs while boosting.
  if (craft.speed > CRAFT.fast) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 3; i += 1) {
      const px = -48 - i * 14 - ((t * 60) % 14);
      ctx.beginPath();
      ctx.arc(px, 2, 4 + i * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Speed streaks streaming past the wingtips at full throttle.
  if (craft.speed > CRAFT.cruise + 60) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const ly = -16 + i * 10;
      const lx = -56 - ((t * 320 + i * 47) % 90);
      const len = 16 + (craft.speed - CRAFT.cruise) * 0.06;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - len, ly);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function backdrop(ctx, state) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  gradient.addColorStop(0, INK.skyHigh);
  gradient.addColorStop(0.55, INK.skyMid);
  gradient.addColorStop(0.85, INK.skyGlow);
  gradient.addColorStop(1, INK.skyGlow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // The sun sinks toward the sea as the mission clock runs down, and its
  // halo swells — the sky itself is the timer.
  const dayFrac = Math.max(0, Math.min(1, 1 - state.clock / RUN_SECONDS));
  const sunY = 150 + dayFrac * 190;
  const haloR = 92 + dayFrac * 46;
  ctx.fillStyle = 'rgba(255,217,122,0.25)';
  ctx.beginPath();
  ctx.arc(1060, sunY, haloR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,180,90,0.18)';
  ctx.beginPath();
  ctx.arc(1060, sunY, haloR * 1.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK.sunCore;
  ctx.beginPath();
  ctx.arc(1060, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
  // A far ridge of hazy island silhouettes on the horizon, crawling by at
  // a fifth of the flight speed for depth.
  ctx.fillStyle = 'rgba(38,64,105,0.45)';
  const ridgeSpan = 520;
  for (let i = -1; i < 4; i += 1) {
    const rx = i * ridgeSpan - ((state.flown * 0.18) % ridgeSpan);
    const peak = 60 + ((i * 37) % 40 + 40) % 40;
    ctx.beginPath();
    ctx.moveTo(rx, CRAFT.sea + 20);
    ctx.quadraticCurveTo(rx + ridgeSpan * 0.3, CRAFT.sea + 20 - peak, rx + ridgeSpan * 0.55, CRAFT.sea + 20 - peak * 0.55);
    ctx.quadraticCurveTo(rx + ridgeSpan * 0.8, CRAFT.sea + 20 - peak * 0.85, rx + ridgeSpan, CRAFT.sea + 20);
    ctx.closePath();
    ctx.fill();
  }
  // Drifting clouds behind everything.
  for (const cloud of state.cloudSet) {
    puff(ctx, cloud.x, cloud.y, cloud.s, 'rgba(255,255,255,0.85)');
  }
  // A loose skein of birds crossing the sky, wings flapping on the clock.
  ctx.strokeStyle = 'rgba(16,28,51,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const span = VIEW.w + 300;
    const bx = span - (((state.flown * 0.55 + i * 260) % span) + span) % span - 150;
    const by = 120 + (i % 3) * 36 + Math.sin(state.t * 0.9 + i * 1.7) * 8;
    const flap = Math.sin(state.t * 7 + i * 1.3) * 5;
    ctx.beginPath();
    ctx.moveTo(bx - 11, by + flap);
    ctx.quadraticCurveTo(bx - 4, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 3, bx + 11, by + flap);
    ctx.stroke();
  }
  // The sea, two bands deep, with little wave strokes sliding by.
  ctx.fillStyle = INK.seaTop;
  ctx.fillRect(0, CRAFT.sea + 18, VIEW.w, VIEW.h - CRAFT.sea);
  ctx.fillStyle = INK.seaDeep;
  ctx.fillRect(0, CRAFT.sea + 52, VIEW.w, VIEW.h - CRAFT.sea);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i += 1) {
    const span = VIEW.w + 120;
    const wx = ((i * 173 - state.flown * 0.7) % span + span) % span - 60;
    const wy = CRAFT.sea + 34 + (i % 3) * 18;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + 16, wy - 5, wx + 32, wy);
    ctx.stroke();
  }
  // Sun glitter: short bright dashes twinkling under the sun's column.
  ctx.strokeStyle = 'rgba(255,226,150,0.5)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 7; i += 1) {
    const gx = 980 + ((i * 61 + Math.floor(state.flown * 0.9)) % 190);
    const gy = CRAFT.sea + 30 + (i % 4) * 14;
    const glint = 8 + 6 * Math.abs(Math.sin(state.t * 2.2 + i * 1.9));
    ctx.beginPath();
    ctx.moveTo(gx - glint / 2, gy);
    ctx.lineTo(gx + glint / 2, gy);
    ctx.stroke();
  }
  for (const item of state.isleSet) island(ctx, item);
}

function instruments(ctx, state) {
  ctx.fillStyle = INK.panelDark;
  rounded(ctx, 14, 12, 1252, 84, 14);
  ctx.fill();
  const urgent = state.clock <= 30;
  label(ctx, `⏱ ${clockText(state.clock)}`, 32, 44, 30, urgent ? INK.alarm : INK.paper);
  label(ctx, `Score ${state.points}`, 32, 78, 17, INK.paper);
  label(ctx, `Target ${GOAL_SCORE}`, 190, 78, 14, 'rgba(255,246,227,0.7)');

  label(ctx, `Rings ${state.ringsDone}/${RINGS_WIN}`, 380, 44, 22, INK.amber);
  label(ctx, `Stars ${state.starsGot}`, 380, 78, 14, 'rgba(255,246,227,0.85)');
  for (let i = 0; i < MAX_HEARTS; i += 1) heart(ctx, 560 + i * 30, 44, 11, i < state.hearts);
  if (state.combo >= 2) {
    ctx.fillStyle = INK.canOrange;
    rounded(ctx, 640, 28, 96, 32, 16);
    ctx.fill();
    label(ctx, `COMBO x${state.combo}`, 688, 45, 14, '#ffffff', 'center');
  }

  // Fuel gauge.
  label(ctx, 'FUEL', 790, 32, 13, 'rgba(255,246,227,0.8)');
  ctx.fillStyle = 'rgba(255,246,227,0.2)';
  rounded(ctx, 790, 44, 150, 16, 8);
  ctx.fill();
  const fuelFrac = Math.max(0, state.fuel / TANK.capacity);
  ctx.fillStyle = fuelFrac < 0.22 ? INK.alarm : fuelFrac < 0.45 ? INK.canOrange : INK.fine;
  rounded(ctx, 790, 44, 150 * fuelFrac, 16, 8);
  ctx.fill();
  if (state.craft.gliding) label(ctx, 'GLIDING!', 880, 78, 14, INK.alarm, 'center');

  // Flight instruments: speed, altitude and heading on lit plates, big
  // enough to read at a glance — the three numbers a pilot flies by.
  // Heading comes straight from the velocity vector: due east is 090,
  // climbing swings it toward north, diving toward south.
  const kmh = Math.round(state.craft.speed * 0.62);
  const metres = Math.max(0, Math.round((CRAFT.sea - state.craft.y) * 3));
  const headingDeg = Math.round(
    90 + (Math.atan2(state.craft.vy, Math.max(1, state.craft.speed)) * 180) / Math.PI,
  );
  const headingText = `${String(((headingDeg % 360) + 360) % 360).padStart(3, '0')}°`;
  const plates = [
    ['SPD km/h', `${kmh}`],
    ['ALT m', `${metres}`],
    ['HDG', headingText],
  ];
  plates.forEach(([caption, value], i) => {
    const px = 958 + i * 100;
    ctx.fillStyle = 'rgba(255,246,227,0.10)';
    rounded(ctx, px, 22, 92, 64, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,227,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    label(ctx, caption, px + 46, 39, 11, INK.amber, 'center');
    label(ctx, value, px + 46, 73, 28, INK.paper, 'center', 800);
  });

  // An arrow at the right edge points at the next ring's height.
  const next = state.ringSet.find((item) => !item.judged && item.x > CRAFT.x);
  if (next) {
    const ay = Math.max(120, Math.min(620, next.y));
    ctx.fillStyle = INK.amber;
    ctx.beginPath();
    ctx.moveTo(1252, ay);
    ctx.lineTo(1226, ay - 11);
    ctx.lineTo(1226, ay + 11);
    ctx.closePath();
    ctx.fill();
    label(ctx, 'ring', 1239, ay - 22, 11, INK.amber, 'center');
  }
}

function card(ctx, lines, title, colour) {
  ctx.fillStyle = 'rgba(16, 28, 51, 0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = INK.panelPale;
  rounded(ctx, 290, 110, 700, 480, 18);
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 5;
  ctx.stroke();
  label(ctx, title, 640, 172, 44, colour, 'center', 800);
  let y = 236;
  for (const line of lines) {
    label(ctx, line, 640, y, 19, INK.bark, 'center', 400);
    y += 34;
  }
}

export function makePainter(canvas) {
  const ctx = canvas.getContext('2d');

  function paint(state, screen, best) {
    const t = state.t;
    // Fit the 1280x720 sky into the window, letterboxed.
    const scale = Math.min(canvas.width / VIEW.w, canvas.height / VIEW.h);
    const offsetX = (canvas.width - VIEW.w * scale) / 2;
    const offsetY = (canvas.height - VIEW.h * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#101c33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // A storm hit rattles the whole sky for a moment.
    const shakeX = state.shake > 0 ? Math.sin(t * 70) * 7 * state.shake : 0;
    const shakeY = state.shake > 0 ? Math.cos(t * 63) * 5 * state.shake : 0;
    ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX * scale, offsetY + shakeY * scale);

    backdrop(ctx, state);
    const nextRing = state.ringSet.find((item) => !item.judged && item.x > CRAFT.x);
    for (const item of state.ringSet) ring(ctx, item, t, item === nextRing);
    for (const item of state.starSet) star(ctx, item.x, item.y, item.r, item.spin);
    for (const item of state.canSet) jerrycan(ctx, item.x, item.y, t);
    for (const item of state.stormSet) stormCloud(ctx, item);
    plane(ctx, state, t);
    instruments(ctx, state);

    if (state.noteT > 0 && screen === SCREENS.PLAY) {
      ctx.font = `700 16px ${TYPE}`;
      const w = ctx.measureText(state.note).width + 36;
      ctx.fillStyle = 'rgba(16, 28, 51, 0.85)';
      rounded(ctx, 640 - w / 2, 560, w, 34, 17);
      ctx.fill();
      label(ctx, state.note, 640, 578, 16, '#ffffff', 'center');
    }

    if (screen === SCREENS.TITLE) {
      card(ctx, [
        'Deliver the mail across the archipelago before sunset!',
        '',
        '↑ ↓ / W S — climb & dive    ← → / A D — slower & faster',
        'Hold Space — boost    Mouse — steer the plane',
        'P — pause    M — sound',
        '',
        `Clear ${RINGS_WIN} rings in ${Math.floor(RUN_SECONDS / 60)}½ minutes to win.`,
        'Grab stars & fuel. Dodge storm clouds and the sea!',
        `Best score: ${best}`,
        '',
        'Press SPACE or click to take off!',
      ], 'SKY COURIER', INK.canOrange);
      label(ctx, 'TERBANG NUSANTARA', 640, 208, 20, '#6b5a44', 'center', 700);
    } else if (screen === SCREENS.PAUSED) {
      card(ctx, [
        'Engines off for a moment — the mail is safe on the wing.',
        '',
        'Press P or Space to keep flying.',
      ], 'PAUSED', '#4a90d9');
    } else if (screen === SCREENS.OVER) {
      const won = state.won;
      const reason = state.reason === 'hearts'
        ? 'The airframe gave out in the storm.'
        : state.reason === 'fuel'
          ? 'Ran dry over the open sea.'
          : state.reason === 'rings'
            ? 'Every ring cleared — landed early!'
            : "Time's up — the sun has set.";
      card(ctx, [
        reason,
        '',
        `Final score: ${state.points}   (target ${GOAL_SCORE})`,
        `Rings cleared: ${state.ringsDone}    Missed: ${state.ringsMissed}`,
        `Stars: ${state.starsGot}    Fuel cans: ${state.cansGot}`,
        `Best combo: x${state.topCombo}    Distance: ${(state.flown / 1000).toFixed(1)} km`,
        `Best score: ${best}`,
        '',
        'Press SPACE or click to fly again!',
      ], won ? 'MISSION COMPLETE!' : 'MISSION OVER', won ? '#2f9e44' : INK.canOrange);
    }
  }

  function fit(width, height) {
    canvas.width = width;
    canvas.height = height;
  }

  return { paint, fit };
}
