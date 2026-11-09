# 3D assets

## Files

Models live in `public/models/` and are loaded at runtime by URL. Paths are set in
[src/config/scene.ts](../src/config/scene.ts) → `MODELS`:

```
public/models/
├── Table.fbx            table-top slab with the printed layout and the wheel recess
├── WheelBottom.fbx      stationary bowl of the wheel
├── WheelTop.fbx         spinning rotor with pockets and turret
└── chips/
    ├── 1kChip.fbx
    ├── 5kChip.fbx
    ├── 25kChip.fbx
    └── 100kChip.fbx
```

File names are case-sensitive once deployed. Textures are embedded in the FBX files. Any file that is missing
or fails to load is replaced by a placeholder, and a warning is printed in the console.

**Large files:** GitHub rejects files over 100 MB. If a model grows past that, use [Git LFS](https://git-lfs.com)
(`git lfs track "*.fbx"`) or convert to `.glb` (smaller and faster to load).

## Exporting from Blender

- **Table and wheel come from one scene and keep its coordinates.** The origin is the centre of the wheel,
  the table runs along +Z (Blender −Y) and the player sits on the −X side. Don't move or re-centre them on export.
- Units are centimetres (`TABLE.unitScale = 0.01` converts to metres). The table model is only the top slab;
  a cabinet is generated beneath it, and `TABLE.elevation` sets the height above the floor.
- On the wheel top, the **0 pocket points to −Z** (top of Blender's top view) and the numbers run **clockwise**.
  Change `WHEEL.zeroAngle` / `WHEEL.clockwise` if that ever changes.
- Chips are separate files and are fitted to `CHIP.diameter` (4 cm) and stacked automatically.
- Baked textures must use the **same UV map that is exported**. If a model looks black or scrambled,
  the bake was done on a different UV map than the active one.
- Blender's emissive export (white at intensity 0) is handled; materials are converted to PBR so they react to the
  scene lighting.

## Calibration

Open `http://localhost:5173/?debug` for an orbit camera, axes (red X, green Y, blue Z), a betting-grid
overlay and the model sizes in the console. The values in `src/config/scene.ts` were measured from the current models:

| Setting                        | Meaning                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `LAYOUT.originX/Z`             | corner of the **1** cell nearest the zero and the player            |
| `LAYOUT.cellWidth / cellDepth` | one number cell, along / across the table                           |
| `LAYOUT.outsideDepth`          | depth of the dozens and even-money rows (narrower than number rows) |
| `WHEEL.ballTrackRadius`        | radius of the groove where the ball circles                         |
| `WHEEL.pocketRadius`           | radius of the pocket centres                                        |

The ball's height is not configured: the wheel samples its own surface when it loads, so the ball follows the
track, the slope and the pockets of whatever model is used.
