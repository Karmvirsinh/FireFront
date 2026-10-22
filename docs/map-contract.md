# Map foundation contract

This Assignment 4 increment accepts different **flat** plain-data maps without generating them. The normal application still loads the fixed MVP. It adds no seed controls, elevation, start/results screens, dependencies or simulation rules. The five technical pillars remain separate from the three user interaction stages described in README.

## Logical data

`src/world/mapContract.js` exports `normalizeMap(input)`, which validates and clones a map snapshot before installation. Required fields:

| Field | Meaning |
| --- | --- |
| `width`, `height` | Positive integer logical dimensions; rectangular grids are supported |
| `cellSize` | Positive world units per cell; the current artwork is tuned for 0.5 |
| `cells` | Row-major array of exactly `width * height` plain cell objects |
| `start`, `safeZone` | Integer `{x,z}` endpoints, in bounds and base-walkable |
| `spawnCells` | Nonempty array of explicit in-bounds, walkable integer cell indices; one entry per agent |

Each cell contains `terrain` (`obstacle`, `vegetation`, `route`, `start`, `safe`), `fuelType` (`none`, `grass`, `brush`, `forest`) and boolean `walkable`. Fuel and walkability are independent. Do not include Three.js objects, DOM objects, functions or mutable simulation state. Index is `z * width + x`; world cell center is `((x + 0.5 - width/2) * cellSize, 0, (z + 0.5 - height/2) * cellSize)`.

Spawn array order determines stable agent IDs. Explicit duplicates are allowed if a fixture intentionally shares a spawn. Population defaults to this array length; movement speed remains the existing agent configuration. The safe endpoint is a **single destination cell**, not an entire zone. Optional `name` provides existing dashboard descriptive text. Optional `zones` is an object of inclusive integer rectangles `{x0,x1,z0,z1}` within the grid; it is presentation metadata, not an alternative evacuation rule.

Validation checks structural/cell/spawn/endpoint/bounds correctness, not route solvability or scenario quality. Disconnected maps remain valid for controlled trapping tests. Connectivity and future generation guarantees require separate BFS/scenario validation. This increment makes no generation algorithm or seed-format decision.

## Rendering metadata

Optional `rendering` is normalized to:

- `labels`: array of `{text,x,z,width}`. X/Z are logical center coordinates (fractional or outside-edge positions are allowed for text); width is in world units. Without explicit labels, START/SAFE derive from endpoints/zones; legacy routes with `section` rectangles can contribute labels. Explicit labels fully replace defaults.
- `decorationBounds`: inclusive in-grid rectangle restricting decorative rocks; defaults to the whole grid. It does not change obstacles, fuel or walkability. Sparse grass/brush/forest models still follow fuel cells, and colored ground still defines fuel coverage.
- `focusBounds`: inclusive in-grid rectangle for overview fitting. Defaults to the actual walkable/fuel cells, endpoints and relevant zones; a rectangular vegetation patch is **not required**. Camera bounds include label footprints and comfortable margins. Full dimensions still determine navigation limits.

Rendering reads this metadata; it contains no authored route-label or rock-bound coordinates. `getCameraBounds(map)` converts it into dimensions/framing for camera controls. An overview near a map edge is included in the pan bounds; fitted distance cannot fall below the existing minimum zoom distance. For the fixed map, its original navigation limits remain valid. Camera geometry, labels and picking remain flat at Y=0. Elevation is not supported by this contract.

Example of a different input shape (cells must also be supplied):

```js
{
  width: 12, height: 8, cellSize: 0.5,
  start: { x: 1, z: 2 }, safeZone: { x: 10, z: 5 },
  spawnCells: [25, 26, 37],
  rendering: {
    labels: [
      { text: 'START', x: 1, z: 1, width: 1.2 },
      { text: 'SAFE', x: 10, z: 6, width: 1.2 },
    ],
    decorationBounds: { x0: 2, x1: 8, z0: 1, z1: 6 },
  },
}
```

`vegetationPatch` and `routes` may remain on the authored fixture for historical regression/pacing helpers. They are not required by generic scene construction. There is no requirement that a new map invent two routes or a single vegetation rectangle merely to render.

## Fixed-map adapter

`createFixedMap()` is unchanged. `createFixedMapDefinition()` adds name, explicit original 20-agent formation and authored label/decoration metadata, preserving every original layout field and all cells. Its rendering labels remain at their original authored positions. Camera focus is now derived from actual map content and those labels, so the overview can differ slightly from the old vegetation-rectangle calculation.

The application uses the adapter. Existing low-level tests/helpers can still use raw `createFixedMap()`; the legacy default spawn fallback is retained there for compatibility. New application maps must provide explicit spawns through normalization. Both fixed ignition scenarios, `(32,32)` and `(32,25)`, remain exact regression fixtures. Existing FPS capture still deliberately requires the 64×64 / 20-agent / (32,32) scenario; no new seed benchmark is introduced.

## Replacement ownership

`src/app/createApplication.js` owns a single active session and exposes internal `replaceMap(map)`, `current` and `dispose()` methods. `src/main.js` only initializes the fixed definition and connects hot-replacement cleanup. No window-global map/debug API or new UI control is added.

Replacement sequence:

1. Validate and clone the candidate map. Invalid data leaves the active session running.
2. Dispose the old ignition/cursor/keyboard handlers and FPS/export listeners/URLs, stop its render loop, disconnect resize observers, dispose camera controls, instanced meshes, geometry/materials/textures and renderer.
3. Construct fresh simulation, scene and bindings; refresh existing counts/header text from the map's population and dimensions.

The fire/agent simulations have no independent timers, subscriptions or render objects; retiring the session removes the callbacks that can advance them. A stale frame cannot update a disposed session. If construction fails after retirement, partial bindings/resources are cleaned and `current` is null; callers may retry with a valid map. Disposal is idempotent; replacing after final application disposal is rejected.

**Map replacement** creates a fresh, appropriately framed camera and fresh map simulation. **Reset simulation** replays the current map from its initial fuel/spawns, clearing ignition while preserving the camera. **R** resets only that map's camera view. These are separate operations.

## Verification and user validation

The foundation tests use a 12×8 map, distinct endpoints and three explicit spawns, with no vegetationPatch/zones/routes, plus an off-center 40×16 framing fixture. They verify labels/rock bounds, projected picking with viewport offsets across desktop/narrow/short sizes, default/reset framing, normal simulation/reset, invalid contracts and failure recovery. Repeated fixed/synthetic replacements exercise real Three.js geometry, OrbitControls, UI and FPS bindings with a renderer stand-in: one active loop/observer, one set of handlers, removed export elements and disposal events for all tracked GPU resources. This is a lifecycle regression, not a graphics-driver memory/performance benchmark.

Full suite: 68 tests. The adapter is compared against the raw fixed map for original fields, spawns and complete measured event traces. Central evacuation remains 60.8 simulation seconds; alternative evacuation 47.35 seconds. Actual build/browser observations and the completed user-reported manual checks are recorded separately in progress. The final user recheck confirmed clean distant/orbited ground, drag ownership/cancellation/panel isolation, fuel selection/road rejection, simulation reset and R. Existing performance measurements retain their original environment/limitations; this increment does not claim a new FPS target result.
