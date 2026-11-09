# Architecture

Three layers with one-way dependencies:

```
components / composables  (Vue UI)
        │           │
     stores       three/  (3D scene)
        │           │
        └── game/ ──┘     (pure rules)
```

- **`game/`** knows nothing about Vue or three.js. It defines the wheel, chips, bet types and payouts, the
  layout geometry (`spotAt(u, v)` maps a point on the table to a bet) and the outcome draw. Everything here is unit-tested.
- **`stores/`** hold state. `wallet` owns cash, chips in hand and chips on the table; `roulette` is the round
  state machine (`betting → spinning → result → betting`).
- **`three/`** renders and animates. `CasinoScene` is the only class the UI talks to; it exposes
  `syncBets()`, `playSpin()` and `playOutcome()` and reports pointer events through callbacks.
- **`composables/useRound`** connects them: draw result → animate spin → settle → animate payout → next round.

## A round, step by step

1. Player clicks the table. `CasinoScene` ray-casts onto the felt plane, converts the hit into layout
   units and calls `spotAt` → `onPlace(spot)` → `roulette.placeChip()` moves one chip from hand to table.
2. `useRound` watches the bets and calls `scene.syncBets()`; `ChipStacks` rebuilds that stack and drops the new chip.
3. **Spin:** `roulette.startSpin()` draws the number (`drawOutcome`, with the house bias) and persists the
   post-round wallet immediately, so reloading mid-spin can't undo a loss.
4. `scene.playSpin(n)` — the ball's angle _relative to the wheel_ eases from its current pocket to pocket `n`
   over `SPIN.duration`, so it always lands exactly, however the wheel moves. The camera orbits, then swings
   behind the ball and closes in as it slows.
5. `roulette.settle()` pays out; `scene.playOutcome()` fires sparks, returns to the table, highlights the
   winning number, sweeps losing chips to the dealer and bounces winning stacks.
6. `roulette.nextRound()` clears the table and stores the bets for **Rebet**.

## Coordinates

- World units are metres, Y up. The floor is at y = 0.
- **Table space** (`table-space` group) is the shared Blender scene scaled to metres: origin at the wheel centre,
  table along +Z, player on the −X side looking towards +X. It is raised by `TABLE.elevation`.
- Layout units: `u` along the table (one number column), `v` away from the player — see the diagram in
  [src/game/layout.ts](../src/game/layout.ts). `BettingSurface` maps them into table space using `LAYOUT`.
- Pocket angles are around +Y in the wheel-top's local space, starting at `WHEEL.zeroAngle`.

## Conventions

- TypeScript strict, `noUncheckedIndexedAccess`; Vue `<script setup>` with typed props/emits.
- Styles use the tokens in `src/styles/tokens.css`; components use scoped styles.
- three.js resources are disposed when the scene unmounts.
- Tests sit next to the code they cover (`*.test.ts`).
