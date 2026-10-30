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
