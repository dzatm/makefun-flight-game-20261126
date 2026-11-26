# dzatm/makefun-flight-game-20261126

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/dzatm/makefun-flight-game-20261126/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/dzatm/makefun-flight-game-20261126/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Sky Courier — Terbang Nusantara**: an original flight game for the
[best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057).
One little mail plane, one sunset over the archipelago: thread the glowing
rings, grab stars and fuel, and keep out of the storm clouds.

## How to play

- **Climb / dive**: `↑` `↓` or `W` `S`. **Slower / faster**: `←` `→` or `A` `D`.
- **Boost**: hold `Space` (burns fuel faster). **Mouse**: move the pointer and
  the plane steers toward its height; any arrow key takes control back.
- **The route**: fly through the golden rings (gerbang) over Pulau Kencana,
  Sawarna, Bira, Derawan, Moyo and Karimunjawa. The middle of a ring pays a
  perfect bonus, and ring after ring without a miss builds a combo bonus.
  Stars pay 50, fuel cans pay 25 and refill the tank.
- **Watch out**: storm clouds and the sea cost a heart — lose three hearts
  and the run ends early. An empty tank means gliding down to the sea.
- **Win**: clear 12 rings before the 2½-minute mission timer runs out
  (15 rings finishes early, with a time bonus). Score target: 1500.
- **Pause**: `P` or `Esc`. **Mute**: `M`.

## Run it

No build step, no network: everything the game needs is a file under `game/`.

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open the page in desktop Chrome and play with keyboard and mouse.

## Layout

- `game/index.html` — the page and the canvas.
- `game/src/main.js` — boot, the fixed-step loop, the four screens.
- `game/src/world.js` — the flight rules: rings, fuel, storms, scoring.
- `game/src/render.js` — all the art, drawn on canvas (no image files).
- `game/src/config.js` — tuning, islands, palette.
- `game/src/input.js` — keyboard and mouse steering.
- `game/src/audio.js` — small synthesized WebAudio sounds, no files.
- `game/src/shots.js` — the autopilot that stages the screenshots.
- `game/src/random.js` — the seeded random behind the sky and screenshots.
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  `dossier.json` with the vendored `vendor/makefun-game.ts`.
- `screenshots/` — 3–4 real renders of the game running in a browser.
