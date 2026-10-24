# Map foundation contract

> The foundation-only scope below is historical. The first seeded increment now supplies this same flat contract; see [seeded environment](seeded-environment.md). Fixed-map adapter/data and regression scenarios remain unchanged.

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

Each cell contains `terrain` (`obstacle`, `vegetation`, `clearing`, `route`, `start`, `safe`), `fuelType` (`none`, `grass`, `brush`, `forest`) and boolean `walkable`. Fuel and walkability are independent. Do not include Three.js objects, DOM objects, functions or mutable simulation state. Index is `z * width + x`; world cell center is `((x + 0.5 - width/2) * cellSize, 0, (z + 0.5 - height/2) * cellSize)`.

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

## Seeded-map additions

Generated maps include `generation: {seed, version, settings, attempt}` and `pathNetwork: {widthCells, centerlines, trailCells}` for reproducibility/validation; neither contains mutable fire state or Three.js resources. `navigation: {mode: 'path-first', allowedCells: boolean[]}` is optional for historical fixed fixtures and required by the generated-map validator. The mask must match cell count, only allow physically walkable cells and include endpoints/spawns. Normal A* and buffer-exit searches use physical walkability AND this mask. Generated masks allow only paths/start/safe; physically walkable grass/clearings remain excluded. Cooling never changes either layer. Legacy fixtures without a mask preserve their exact previous behavior.

`clearing` is bare, nonfuel, physically walkable terrain with its own ground color; it is separate from the nonignitable path network. Generated labels/decoration/focus still use rendering metadata/defaults. Endpoint capacity, separation, clear roads and full spawn connectivity are additional generator validations, not new generic-contract requirements for controlled trapping fixtures.

The seed form belongs to the application entry point and persists across map-session replacement. `onStateChange` refreshes its lock after installation/ignition/reset without an extra loop. HMR disposes the form handler as well as the application. Failed candidate generation/validation never retires the installed session; a renderer-construction failure after retirement attempts to reconstruct its prior map, reporting reload if that also fails. Reset does not invoke the generator.

### Generated trail presentation metadata (forest-trails-v2)

`pathNetwork.trailCells` contains unique row-major indices of the exact carved single-cell network (some become endpoint terrain). Centerlines contain retained edge-sharing raster steps. Validation rejects route cells outside this set and redundant broad overlap blocks; genuine compact junctions may require a 2×2 footprint. Endpoint zones are a 5×4 spawn footprint and one destination cell. All 20 explicit spawns must reach safety before ignition.

Generated `rendering.compactEndpoints: true` colors only the origin-center cell blue; the other spawn cells receive the bare-trail treatment without changing their logical start terrain. `rendering.terrainColors` overrides route/clearing ground colors (earth-brown/neutral gray). Fuel ground colors still take priority. This optional presentation metadata does not affect eligibility, fuel or traversal; legacy fixed maps retain their original palette/areas. `generation.settings.randomStreamVersion` records the stable PRNG namespace separately from the changed logical generator version.

### v3 optional connection diagnostics

`pathNetwork.connections` records accepted local additions as plain data: `kind` (loop/branch), `from`, `to`, `directSteps` (Manhattan chord), `rasterSteps` (before thinning) and `nearbyFraction` (fraction of interior raster steps within two cells of existing trails, excluding the four-cell junction approaches). The generator validates a 6–24-cell chord, at most 2× chord raster length and at most 0.3 close-parallel fraction. These diagnostics describe accepted candidates, not simulated fire state or a promise of two routes. Thinned centerline metadata removes retraced loops; `trailCells` remains the authoritative exact carved set.

Current generated clearing palette is sandy beige #c4b38b, superseding the gray v2 override above without changing any cell's classification. Generator identity is forest-trails-v3; randomStreamVersion stays forest-paths-v1.

### Network-first v4 data (supersedes v3 connection semantics)

`pathNetwork.nodes` holds 6-9 ordinary grid points; they are not endpoints or spawn groups. `connections` now describes every tree, loop, start and safe attachment, with one corresponding `centerlines` trace each. Forest edges reference `fromNode`/`toNode` indices; endpoint attachments reference actual grid points and may meet an edge interior. A zero-length endpoint attachment is valid if that endpoint already lies on the network. Node cells are ordinary one-cell route terrain, not newly cleared rectangles. `trailCells` remains the exact carved set after connectivity-preserving overlap cleanup.

Connection diagnostics still record Manhattan `directSteps`, pre-thinning `rasterSteps` and `nearbyFraction`, but limits are v4-specific: raster/chord at most 1.8, nearby fraction at most 0.35 (0.2 for loops), excluding four-cell junction approaches. Tree degree is at most three with at least one branch; extra forest links permit degree four. Loops also record `previousRouteLength`, the shortest existing abstract-graph distance in Euclidean edge units before adding the link. This is a graph usefulness check, not an agent route or performance measurement. Graph connectivity and actual cell BFS are validated independently.

`generation.attempt` now identifies path-only retries. Endpoints, vegetation and rocks always use their seed's original attempt-zero independent streams; the shared namespace remains forest-paths-v1. New map identity is forest-network-v4. Fixed maps omit these optional fields and keep their exact previous behavior.
