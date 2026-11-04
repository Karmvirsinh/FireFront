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

## Terrain structure — terrain-structure-v3 (uncommitted review)

Normal forest-environment-v7 maps now use a separate **terrain-structure-v3** identity. The forest cells, physical classifications, canopy, endpoints/spawns, trail layout and navigation mask remain byte-for-byte equal to the forest checkpoint. createGeneratedMapV7Baseline preserves its exact landforms-v2 terrain; v6 and v5 factories remain historical. The fixed fixture is flat. No new library, external data/tool, asset pack or WFC was selected.

### Families and finite levels

An independent terrain:structure-family-v3 stream chooses **lowland (25%)**, **plateau-country (40%)** or **ridge-valley (35%)**. These are seeded probabilities, not quotas over a small sample. Lowland uses one 0.5–1.2-unit hill and a 0.4-unit valley. The other families use two broad 1.2–3-unit hills, a 1–2.2-unit valley, and a terraced plateau. Plateau-country raises the main plateau 4–6 world units and attempts a second 2–4-unit plateau; ridge-valley uses a 2.5–4-unit main plateau. There is no mandatory second plateau if bounded placement cannot find separate space.

Plateau radii are 9–14 world units (secondary 8–12); tops are flat apart from 0.035-unit subtle noise. The main plateau has a localized intermediate shelf at 45% height. Two smooth finite risers connect the lower ground, shelf and top; this does not quantize every hill into steps. Hills/valleys can originate from -10% to 110% of map extents. Plateau centers can reach the boundaries; 55% of main candidates explicitly choose an edge. Shapes can be partially clipped at edges/corners. Separate plateau placement avoids one taller plateau swallowing another's shelf.

Shared heights and NW–SE triangles remain authoritative: no vertical discontinuities, overhangs, stacked ground, water or stairs. Relief is capped at 9 world units. Local fitting retains the 20-degree limit across **every** permitted navigation cell; off-policy finite faces are capped at 55 degrees. The existing conservative edge-component fitting preserves all trail/spawn/junction/bypass connections without changing A* or walking speed. It can soften risers wherever an existing trail crosses them; natural trail routing is the following checkpoint.

### Feature survival and failure behavior

Terrain candidates use terrain:structure-v3 with at most **12** attempts, keeping the family and horizontal map fixed. Each final proposed plateau must retain at least **40 cell centers** in its inner top with slopes below 5 degrees and height at least 70% of the intended level; every terraced plateau also needs **15 shelf cells** with slopes below 8 degrees and at least **10 off-policy riser cells** above 28 degrees. Geometry, height offset and counts are stored in elevation.generation and independently recomputed in tests. These are minimum integrity checks, not visual acceptance.

If trails or clipping erase these features, retry terrain only. If all attempts fail, report failure and retain the installed map. Do not remove a trail, change family to a flat fallback or call an erased plateau successful. A sample is not a guarantee for every uint32 seed. Broad tops can be partly hidden by the preserved forest; clipped corner tops are smaller than complete interior tops.

### Surface treatment and behavior

Only current V3 ground faces receive earth tint above 28 degrees and gray rock tint above 40 degrees, blended with the logical ground color up to 85%. This is **surface finish**, separate from unchanged obstacle cells and loose boulder meshes. Forest/grass on exposed faces remains eligible fuel; visual rock does not automatically become nonfuel or blocked. The visible map note states this. Fire-state colors override surface finish while burning/hot/cool; reset restores the slope finish. No overlapping surface sheets or separate cliff collider were added.

Agent occupancy, sensing, fire adjacency, hazards, speed and direct-active-fire loss remain horizontal-grid rules. Camera minimum distance additionally protects clearance above the highest relief at the existing lowest orbit angle; bindings, pan limits, simulation-reset camera preservation and R remain unchanged. Loose rock distribution and repetitive grass/vegetation assets are explicitly deferred to dressing.

### Current examples

| Seed | Family | Relief | Useful visual evidence |
| --- | --- | --- | --- |
| 0 | plateau-country | 6.75 world units | North-edge terraced plateau near grid (81,0), broad interior plateau |
| 7 | lowland | 1.13 | Flatter woodland/clearings with a gentle low corridor |
| 34 | lowland | 1.03 | A second flatter arrangement with different forest/trails |
| 2026 | plateau-country | 5.85 | Terraced clipped southeast corner and broad interior plateau |
| 1 | ridge-valley | 3.91 | Eastern boundary terrace plus broader hill/low-ground proportions |

Seed 0's final main plateau has 111 qualifying top cells, 70 shelf cells and 551 riser cells; seed 2026's clipped main plateau has 46/41/212. Cells are 0.25 square world units. Sample terrain slopes and counts do not promise the appearance of the concepts; see progress for real visual/browser evidence and pending manual review.


## Terrain-first trails — forest-environment-v8 / terrain-routed-v4

This supersedes the current-layout descriptions above; v7 terrain-structure-v3 remains available through createGeneratedMapV7, and createGeneratedMapV7Baseline retains the earlier landforms-v2 forest checkpoint. Historical profiles keep their exact layout-first order and streams.

Order: establish a validated terrain family with no trail constraints; find the largest four-edge-connected component of suitable ground; move proposed endpoints to nearest suitable footprints (START needs all 20 distinct 5×4 spawn cells); distribute 14–18 separated ordinary nodes on that component; route the branching graph and optional useful loops; finally classify/carve trails and endpoints. Existing forest/rock streams remain independent. Every carved cell becomes a new no-fuel/walkable object, so old rock/canopy/fuel properties cannot survive beneath a trail. Off-network cells retain the exact forest-regions-v2 classification.

The shared trailTerrain module checks both full triangle gradients at 20 degrees and samples the two center-to-shared-edge half segments using the authoritative NW–SE sampler. Construction and final validation use the same rule. Four-edge construction search favors short, gradual corridors, with small slope/turn costs, a nearby-trail penalty and a soft seeded curved-corridor preference. The latter avoids long rectangular doglegs on otherwise equal-cost flat ground; terrain feasibility always takes precedence. It is construction-only routing, not a change to evacuation A*. The existing graph coverage/spacing, 1.8× Manhattan detour bound, sparse carving budget and local 3×3 arm-reconnection thinning safeguard remain. Optional loops must also shorten the current carved route by at least six cells and 15%. Compact junctions may contain a protected 2×2, never a 2×3 trail band.

No grading is performed (maximum corner displacement zero): broad terrain/plateaus cannot be erased to force a route. This is deliberately more conservative than the permitted limited grading. Some plateau tops remain outside the trail component, and rigid spacing/short-route requirements can reject a terrain candidate. At most 32 environment attempts: eight network attempts per terrain candidate, four independent bounded terrain batches (each retaining the existing up-to-12 feature-integrity attempts). The family remains seeded; exhaustion reports failure and retains the installed map. All spawned cells and all final network cells must reach SAFE. Metadata traces describe the retained grid after thinning.

Terrain remains a shared continuous heightfield; surface finishes, placement, picking and camera sampling are unchanged. No slope cost or new restriction is added to runtime movement, hazards or fire. Current seed coordinates and outcomes necessarily differ from v7; historical timing evidence is not transferred. Overall appearance and new physical navigation checks remain for human review.
