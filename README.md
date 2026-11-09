# Mates Casino

3D European roulette in the browser, built with **Vue 3**, **three.js**, **Pinia** and **GSAP**.

Buy chips at the cashier, place them on the table, spin, and follow the ball with a chase camera
until it drops into its pocket. Play money only.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Add `?debug` to the URL for a free orbit camera, axes, the betting-grid overlay and model sizes in the console.

Models are in `public/models/` (exporting and calibration: [docs/ASSETS.md](docs/ASSETS.md)). If one is missing,
a simple placeholder is used so the game still runs.

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Dev server with hot reload      |
| `npm run build`     | Type-check and build to `dist/` |
| `npm run preview`   | Serve the production build      |
| `npm test`          | Unit tests (Vitest)             |
| `npm run typecheck` | `vue-tsc` type check            |
| `npm run format`    | Format everything with Prettier |

## Controls

| Input       | Action                         |
| ----------- | ------------------------------ |
| Left click  | Place the selected chip        |
| Right click | Remove the last chip on a spot |
| `1`–`4`     | Select 1K / 5K / 25K / 100K    |
| `Space`     | Spin                           |
| `Ctrl+Z`    | Undo last chip                 |
| `R`         | Repeat last round's bets       |

## Project layout

```
public/models/        FBX models (see docs/ASSETS.md)
src/
  config/             Tunables: bankroll, house bias, model placement, spin timing
  game/               Pure roulette rules — no Vue, no three.js, fully unit-tested
  stores/             Pinia: wallet (cash/chips) and roulette (round state machine)
  three/              3D scene: engine, lighting, wheel + ball, betting surface, camera, effects
  composables/        Glue between Vue and the scene (mounting, round flow, hotkeys, toasts)
  components/         HUD (top bar, chip rack, controls, cashier, result banner…)
  styles/             Design tokens, base styles, shared animations
docs/                 Architecture and asset guides
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## House edge

Single-zero roulette already favours the house by 2.7 %. On top of that, `HOUSE_BIAS` in
[src/config/game.ts](src/config/game.ts) is the chance that a spin which would put the player in profit
is redrawn from the numbers where the house doesn't lose (default `0.2`; `0` = fair wheel).

## CI / deployment

- **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs format check, type check, tests and build on every push and PR.
- **Deploy** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) publishes to GitHub Pages. Enable Pages
  (Settings → Pages → Source: GitHub Actions), then run the workflow from the Actions tab.
