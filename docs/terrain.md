# Terrain elevation foundation

This increment stores generated hills but deliberately leaves the application visually flat. Rendering, picking, camera, navigation and fire do not consume elevation yet. No slope-based fire or movement effects are introduced.

## Plain-data contract and sampling

Optional `map.elevation` contains `units: 'world'`, `triangulation: 'nw-se'` and `cornerHeights`, a finite plain numeric array of `(width + 1) * (height + 1)` values. Corner `(x,z)` has index `z * (width + 1) + x`. Adjacent cells reference the SAME corner values, never independent tile heights. Missing elevation means zero everywhere. Normalization validates and clones the array, so caller changes cannot alter the installed reset baseline.

Horizontal world coordinates are `((gridX - width/2) * cellSize, (gridZ - height/2) * cellSize)`; height is Y in world units, positive upward. Cell centers use `(x + 0.5, z + 0.5)`, matching continuous agent coordinates. There is no authoritative duplicate center-height field.

Each cell uses the NW-to-SE diagonal, with upward-facing triangles **NW/SW/SE** and **NW/SE/NE** in X/Z coordinates. `sampleTerrainHeight(map, gridX, gridZ)` interpolates the containing triangle, NOT a bilinear patch. Both formulas agree on the diagonal and shared edges. Positions outside the map clamp to its boundary (for future offset labels); this is not permission for picking or agents to enter outside the grid. Nonfinite coordinates are rejected.

`terrainCellGradients` returns each triangle's steepest rise/horizontal-world-run: `hypot(dY/dX, dY/dZ)`. Its slope angle is `atan(gradient)`. Later rendering must use this exact triangulation and sampler; substituting a different diagonal or smooth bilinear surface would disagree. Continuous geometry does not imply smooth-shaded normals: low-poly shading remains a later rendering choice.

## Generation and constraints

The unchanged v5 candidate selection/validation finishes FIRST. Then `createTerrain` uses existing simplex-noise/Alea with the independent `terrain:gentle-hills-v1` named stream (within the unchanged forest-paths-v1 namespace). Terrain does not consume endpoint/path/vegetation/rock streams or cause another path attempt. `generation.version` stays **forest-network-v5**. Terrain provenance lives separately in `elevation.generation`: **gentle-hills-v1**, seed, stream, settings and applied slope scale.

Defaults: noise scale **0.025 per logical grid unit**, maximum relief **2 world units**, maximum trail slope **20 degrees**. Smooth cubic shaping flattens near-zero noise regions, giving gradual flatter areas without discrete terraces. Heights shift to a minimum of zero and normalize to the relief cap. These are illustrative terrain settings, not calibrated geography or human mobility thresholds.

If any triangle exceeds the slope limit, uniformly scale the entire height field down. This stronger whole-map constraint protects every existing navigable edge, spawn connection, junction and bypass, including both faces of each cell, without changing cells or carving shoulders. A continuous segment across these faces cannot exceed the same directional slope bound. No reliance on a single connected route or center-height-only check. The tradeoff is that one steep region can reduce relief elsewhere; exact visual amplitude awaits the next increment. Settings are configurable in the pure generator API, not a new UI control.

## Next bounded task

Visual integration: triangulated ground and boundary sides; terrain-following decorations, agents, labels, markers/fire; actual-surface picking; elevation-aware framing and resource disposal. Preserve flat fixed-map fallback, simulation reset versus R, and the horizontal network. Navigation costs/speed, sensing distance, slope fire effects, water, bridges, buildings and weather remain outside this foundation. No full semester schedule is inferred.

Automated results and manual-validation status are recorded in progress. The unchanged flat display cannot validate hill appearance; no human terrain pass is claimed.

## Visible surface integration — 2026-10-30

The renderer now consumes this contract. Elevated ground uses a batched cell-colored triangle mesh with flat normals, boundary-only sides and surface-only picking. Upright objects and continuous agent positions use the sampler. Selection and ember vertices conform to terrain. Camera target/framing include height; reset retains terrain/camera and R resets only the view. Fixed maps without elevation retain the flat rendering path. No slope simulation effects or generation-setting changes. See progress for actual automated/browser evidence and pending physical visual validation; earlier data-only statements above are historical.

## Reference-guided landforms-v2 — 2026-10-31 (review pending)

Current v6 maps use **landforms-v2**, retaining layout-first construction and unchanged forest-network-v6 cells, streams and metadata. V5 regression maps explicitly use the preserved createTerrainV1 implementation and original gentle-hills-v1 stream; the original flat fixture remains without elevation. Earlier global-slope descriptions above remain historical.

The four supplied references guide broad raised/low/flat proportions only. No image assets, water, structures, stairs, bridges, UI or realistic detail are imported. There are 2–3 seeded elliptical hills/ridges (radii 9–16 by 7–13 world units, height 2.5–4), one smaller raised area (radii 5–7, height 1.8–3), one rotated lower valley (width 5–8, depth 1.2–2.2), and three smoothly flattened regions (radius 5–8). Heights combine the hill envelopes rather than summing overlapping mountains. Smoothstep shoulders avoid steps; subtle simplex irregularity has amplitude 0.10 world units and frequency 0.055 per world unit, reduced inside flat regions. Minimum height is shifted to zero; relief is capped at 7 world units by terrain-only validation/retry, never whole-map rescaling.

The independent stream is terrain:landforms-v2, with at most three terrain attempts. Landform positions/parameters and attempt are recorded under elevation.generation. Changing terrain never retries or removes a horizontal trail candidate. Named endpoint/path/vegetation/rock streams are untouched. The old single-field terrain is preserved in createTerrainV1.js for historical tests rather than silently relabeled.

Navigation cells (physical walkability AND selected Path-first mask) have a 20-degree limit across both triangles of their entire footprint. Other cells have a 38-degree cap. Shared edges use the stricter adjacent constraint. Component limits use tan(angle)/sqrt(2) with a 0.995 margin, guaranteeing the full two-component triangle gradient bound; this is deliberately conservative, especially along axis-aligned slopes.

Local fitting computes upper/lower height envelopes over the corner-edge graph using a finite priority queue, averages them to balance peak lowering and valley raising, blends displacement for five neighbor passes and reapplies the envelopes. Remote compliant terrain is retained; no global scale reduction, trail trench cut, bridge or altered traversal mask. This queue is terrain fitting only, not a new evacuation planner. The final finite-height/triangle-slope/relief checks must pass or generation fails after terrain-only retries. No cliff/overhang or slope-based terrain/fuel reclassification is introduced.

Limitations: local fitting can soften hills near dense trail junctions; the conservative component bound may flatten more than strictly necessary. Flatter regions are geometric blends independent of the unchanged vegetation classification, so not every clearing or forest patch is flat. Appearance remains pending human acceptance. Current renderer/markers/fire use the unchanged sampler and NW–SE triangulation. Automated slope statistics are not visual acceptance or a performance benchmark.
