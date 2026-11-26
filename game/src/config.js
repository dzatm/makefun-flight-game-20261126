// Sky Courier — Terbang Nusantara: the one tuning sheet for the whole game.
// The playfield is a fixed 1280x720 logical sky. The renderer letterboxes it
// into whatever window it gets, so every number below is screen-independent.

export const VIEW = { w: 1280, h: 720 };

// The simulation advances in fixed sixtieths of a second, whatever the
// display refresh rate happens to be.
export const TICK = 1 / 60;

// A mail run lasts two and a half minutes.
export const RUN_SECONDS = 150;

// Clear this many rings before the clock dies and the run is won. Sweep
// every ring early and the leftover seconds pay out as a bonus instead.
export const RINGS_WIN = 12;
export const RINGS_EARLY = 15;

// Three dents to the airframe and the run ends on the spot.
export const MAX_HEARTS = 3;

// The number the end screen dares the player to beat.
export const GOAL_SCORE = 1500;

export const CRAFT = {
  // The plane holds this x on screen; the archipelago scrolls underneath.
  x: 300,
  r: 26,
  // Full-stick climb or dive speed, in logical pixels per second.
  climb: 420,
  // Forward speed of the scrolling world: slowest, cruising, fastest, boosted.
  slow: 180,
  cruise: 320,
  fast: 520,
  boost: 640,
  // How briskly forward speed chases its target.
  accel: 260,
  // The flyable band: `top` is the ceiling, `sea` is where the water starts.
  top: 70,
  sea: 640,
};

// Tank size, burn rates (per second, gentle and boosted), and what one
// jerrycan puts back.
export const TANK = {
  capacity: 100,
  sip: 1.05,
  gulp: 2.6,
  can: 34,
};

// Seconds between spawns. Rings and storms arrive faster as the run wears on.
export const CADENCE = {
  ring: 7.5,
  ringLate: 5.2,
  star: 4.2,
  fuel: 11,
  storm: 6.5,
  stormLate: 3.8,
  isle: 9,
};

// What everything is worth. Distance itself pays a slow trickle.
export const POINTS = {
  ring: 100,
  perfect: 50,
  comboStep: 15,
  star: 50,
  fuel: 25,
  perSecond: 2,
};

// The mail route crosses these islands; each one is painted on the horizon
// with its name underneath, in whatever order the seeded sky picks them.
export const ISLES = [
  { label: 'Pulau Kencana', green: '#3e7d4e', sand: '#e8d29a' },
  { label: 'Pulau Sawarna', green: '#4a8a5a', sand: '#ecd9a8' },
  { label: 'Pulau Bira', green: '#35705f', sand: '#e3cd8f' },
  { label: 'Pulau Derawan', green: '#4f9464', sand: '#f0dfae' },
  { label: 'Pulau Moyo', green: '#3a7d68', sand: '#e8d29a' },
  { label: 'Pulau Karimunjawa', green: '#44855a', sand: '#ecd9a8' },
];

// The sunset palette every canvas drawing pulls from.
export const INK = {
  skyHigh: '#2b4a7a',
  skyMid: '#5f8fce',
  skyGlow: '#f2b26b',
  sunCore: '#ffd97a',
  seaTop: '#1f6f8b',
  seaDeep: '#175a73',
  stormBody: '#4a5568',
  stormShade: '#333d4d',
  ringGold: '#ffd23f',
  ringPale: '#ffef9f',
  starGold: '#ffe45e',
  canOrange: '#e8590c',
  planeRed: '#e63946',
  wingCream: '#f1fa8c',
  panelDark: 'rgba(16, 28, 51, 0.82)',
  panelPale: 'rgba(255, 246, 227, 0.95)',
  paper: '#fff6e3',
  bark: '#2b2118',
  alarm: '#e84a3a',
  fine: '#51cf66',
  amber: '#ffb703',
  shadow: 'rgba(16, 28, 51, 0.3)',
};

export const TYPE = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// localStorage slot for the best mail-run score, this browser only.
export const BEST_SLOT = 'sky-courier.best';
