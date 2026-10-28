# Seeded environment - forest-network-v5

## V5 local-reconnection correction

Uncommitted review on **fix/preserve-trail-bypasses**, from clean deployed **e8ff7bf**. V4 thinning removed a cell whenever the entire network remained connected. Seed 34's selected candidate (attempt 1) consequently lost **(44,36)**: the upper trail ended at (44,35), diagonally beside (45,36), with grass between them excluded by Path-first. The lower trail still connected START/SAFE until ignition **(23,35)** buffered it. A* correctly found no safe alternative; the defect was in carving, not awareness or movement.

V5 removes a redundant square corner only when **all its incident trail arms remain edge-connected inside that cell's 3×3 neighborhood**. Curve endpoints remain protected. A remote circuit cannot justify deleting a local junction. One-cell carving remains; compact 2×2 junctions may retain a protected degree-two endpoint when the other three corners carry branching arms. Extended 2×3/3×2 road bands remain rejected. No seed-specific carve/restoration or new path geometry, vegetation noise, endpoint, fuel, awareness, A*, speed, fire, hazard or loss rule.

Final centerlines remain edge-adjacent and on carved cells; each connection's rasterSteps now equals its retained trace length minus one. Runtime validation rejects diagonal jumps, stale trace lengths, excess detours, broad bands and disconnected network/spawns. The existing nearbyFraction metric describes the construction-time proximity check. The version changes to **forest-network-v5**, while `forest-paths-v1` random streams/settings remain unchanged.

The compact-junction validation now accepts some earlier deterministic candidates. In particular ordinary **seed 34 selects attempt 0**, not the old attempt 1. Its shape therefore differs from the screenshot that exposed the defect. A dedicated regression explicitly constructs and validates attempt 1 as well, proving the actual upper bypass survives rather than relying only on the new default layout.

| Scenario / ignition | Global complete | Local complete | Evidence |
| --- | ---: | ---: | --- |
| Default v5 seed 34 / (23,35), attempt 0 | 90.90 s | 74.00 s | All 20 have an actual safe initial route; both models start immediately; 20 evacuated, zero lost |
| Diagnosed seed-34 attempt 1 / (23,35), corrected thinning | 66.00 s | 74.70 s | Global immediately uses northern loop/right-hand junction; Local initially chooses shorter unseen-blocked route, observes and reroutes; no cautious retry needed |
| Seed 7 / (40,34) | **88.90 s** | **63.65 s** | Exact v4 logical digest/layout retained; both timings rechecked |
| Seed 0 / (44,10) | 56.70 s | 56.70 s | Corrected bypass; no trapping in either model |
| Seed 2026 / (38,37) | 197.50 s | 130.75 s | Changed carving, existing awareness/retry rules; both complete |

All times are automated **50 ms simulation-step traces bounded at 300 seconds**, with 20 evacuated/zero lost and conserved counts. Not human stopwatch checks or performance benchmarks. Old v4 seed-0/2026 trapped/recovery timelines remain checked using compact logical trail fixtures captured from e8ff7bf; no simulation assertions were weakened to hide changed layouts. `node scripts/compareAwareness.js` measures current v5 examples.

Sample: seeds **0–1023**, plus **1024, 2026, 65535, 2147483648, 4294967295** (1,029). All generate successfully and pass network/spawn reachability, four-neighbor traces, narrow carving and metadata checks. Compared with e8ff7bf, **640** maps change cells and **114** select another candidate; endpoints and all spawn cells are identical for every sampled seed. Carving ranges **110–245 cells**, with **0–4 compact 2×2 junctions** per map and no 2×3/3×2 bands. Seed 7 is byte-identical in logical cells/navigation/network metadata; seed 0/2026 change carving without changing their candidate index. Underlying vegetation/rock generators and independent streams are unchanged; retained off-network cells match original vegetation data.

Full suite: **115/115 passed**, including fixed-map **60.80 / 47.35 s** timelines, v4 recovery fixtures, boundary observations, cautious retry/loss safety, reset/replay, camera/picking and lifecycle regressions. Production build passed on Vite 8.3.3. Browser evidence and pending human validation are recorded in the latest progress entry. No new performance capture, dependency update or deployment.

### V5 human recheck (all three user-reported passes)

The user reports all three items below passed. The timing values remain automated reference evidence; the human validation does not establish exact timings or a performance result. The subsequent closeout authorizes checkpoint/adoption/publication; the earlier uncommitted-review description records the implementation stage.

1. Generate **34**, confirm v5 and inspect the new narrow network. With **Global**, ignite **(23,35)**: agents should move immediately rather than all wait near START. Observe completion, then reset.
2. Repeat on **Local**. Its route choices can differ because distant fire is unknown. Confirm evacuation/counts, reset restores 20 waiting and preserves the model/camera; R still resets only the camera.
3. Compare **0, 7, 2026** for narrow trails/compact junctions, fuel versus road picking and repeatable regeneration. Seed 7/(40,34) still uses the quoted 88.90/63.65-second Global/Local simulation references. Check physical navigation and console.

## Historical v4 baseline and validation

Validated network-first generator checkpoint: **1949f12** on feature/seeded-environment, based on foundation 6e39804. It is preserved unchanged on feature/local-awareness. The Global examples here describe the generator checkpoint; ordinary generated-map pages now default to Local, whose separate uncommitted results are in [Awareness models](awareness.md). The user now reports all three v4 manual rechecks passed and accepts the path-network appearance. Prior v2 passes remain historical; no additional timing/performance checks are inferred. v1-v3 corridor-first construction and example timings below are superseded history. Flat 64x64, cellSize 0.5, one origin, one safe destination, 20 agents; fixed-map data, simulation, palette and dependencies remain unchanged.

## Construction and tuning choices

1. Use the independent paths stream to select **6-9 ordinary forest nodes**. Bounded rejection sampling keeps nodes at least **11 cells apart**, within an eight-cell map margin, away from the endpoints, and spanning at least 28 cells on both axes. Nodes are ordinary route cells; do not carve large clearings around them.
2. Connect nodes using short-edge, degree-limited spanning-tree construction, avoiding straight-edge crossings. Tree degree is at most three and edges at most 38 Euclidean cells. If the initial tree is a chain, a short edge swap creates a branch without fixing its location or total branch count. Reject unsuitable candidates through bounded path-only retries.
3. Try up to **two optional loop links**, each with **0.45** attempt probability. A link must be local (at most 27 Euclidean cells), avoid crossings, respect forest degree four, and shorten an existing abstract-graph route by more than 10 units and a factor of 1.5. Existing graph distances use a small deterministic shortest-path search. No mandatory loop or two-route template.
4. Render-independent geometry uses one gentle quadratic bend per edge. Control offset is at most 22% of edge length, capped at five cells; try a quieter reverse bend or straight connection if necessary. Edge-sharing raster steps carve only one cell. Reject excessive raster detours (over 1.8 times Manhattan chord), existing interior intersections and sustained close parallels. Interior proximity limit is 0.35, or 0.2 for loops, within two cells of existing trails; four-cell endpoint approaches are excluded. Merge incidental grid junctions and remove redundant overlap blocks without disconnecting nodes. Exact trail carving is capped at 300 cells, apart from the existing spawn/safe area carve.
5. **Only then attach START and SAFE** to nearby existing trail cells. Keep the 5x4 origin footprint/20 spawns with one blue indicator and one green safe destination cell. Validate the forest graph separately from actual-grid reachability for every spawn and all network cells.

Same seed/settings/version reproduces the map, with canonical decimal input 0-4294967295. The PRNG namespace stays forest-paths-v1. At most four deterministic **path-only** attempts are made; endpoint/vegetation/rock streams always remain at attempt zero. This avoids changing the underlying forest merely because a trail candidate was rejected. The vegetation generator and thresholds are untouched; only carved trails/endpoints replace its cells.

Brown trails #806247, sandy nonfuel clearings #c4b38b and ignitable grass #91aa59 remain. Physical walkability is separate from Path-first policy. Forest junctions are not additional spawns/safe zones. Fire exposure/burn/cooling, fixed steps/catch-up cap, agent speed, hazards, direct-active-fire-only loss, overlap and camera/reset rules are unchanged. No new controls, dependencies, mandatory casualty/trapping scenarios or generated-map FPS claim.

## Current verification

- **82/82 tests passed**, including a **1,029-seed sample**: 0-1023 plus 1024, 2026, 65535, 2147483648 and 4294967295. Checks cover complete graph/cell connectivity, all 20 distinct initial spawn paths, node spacing, degree limits, one-cell/broad-band invariants, carving budget, reproducibility, seed variation, policy/fuel separation and candidate failure retention.
- Sample node counts: 6 / 7 / 8 / 9 nodes on 232 / 242 / 304 / 251 maps. Tree branch-node counts: one / two / three on 659 / 343 / 27 maps. Extra-loop counts: zero / one / two on 365 / 521 / 143 maps. Exact carved network size ranged **110-244 cells**. **159 maps** used a later path attempt; none of these sampled seeds exhausted the four attempts. Coverage is bounded, not proof over all uint32 seeds.
- New v4 seed-7 logical digest; explicit repeatability and component-stream tests. Off-network cells match the original vegetation generator exactly, including path-retry fixtures. All 20 spawns on 0/7/2026 additionally run actual A*. A constant-zero random stream verifies bounded node-placement failure, not an infinite sampling loop.
- Existing fire/loss/navigation/agent/reset/replay, rendering/picking/camera and repeated-session/form cleanup regressions pass. Fixed authored scenario traces remain **60.8 / 47.35 simulation seconds**.
- Production build passes (43 modules; JS **645.72 kB / 168.23 kB gzip**). Existing warning/advisory policy remains; no dependency upgrades. No new performance benchmark.

| Seed | Ordinary nodes | Extra loops | Carved trail cells | Path attempt |
| --- | --- | --- | --- | --- |
| 0 | 8 | 1 | 180 | 1 |
| 7 | 7 | 0 | 138 | 0 |
| 2026 | 9 | 1 | 190 | 0 |

Actual browser inspections and any pending human checks are recorded in the latest progress entry. Screenshots use a closer ordinary wheel zoom; the default/reset framing and navigation limits are unchanged.

## Current closure examples (old coordinates retired)

All times below are **automated fixed 50 ms simulation-step evidence**, not claims of uninterrupted browser completion or guarantees for every seed. All three start with 20 trapped/zero lost because adjacent burning vegetation closes a bare trail through the unchanged nonlethal buffer. Trails themselves remain unburned. The seed-7 case is also a regression test.

| Seed | Ignition (x,z) | Adjacent bare trail | First movement (may be buffer escape) | All 20 evacuated / zero lost |
| --- | --- | --- | --- | --- |
| 0 | (44,10), grass | (44,11) | 62.95 s | 190.25 s |
| 7 | **(40,34), brush** | **(40,33)** | **21.25 s** | **88.9 s** |
| 2026 | (38,37), grass | (38,38) | 26.4 s | 255.45 s |

For seed 7 the 21.25-second motion is emergency escape within the START area, not an open SAFE route. Everyone is trapped again by 27.25 s. The full safe route and sustained evacuation first resume at **42.25 s**; all 20 finish at 88.9 s. The initial cut is internal at (40,35)/(39,35), then advances toward START's connector. See progress for the detailed in-memory trace and the distinction from prior browser observations.

Generated scenarios can last longer than the fixed-map pacing example; no fire/agent timing was changed to force an outcome. Branches can be dead ends, and a loop need not supply an escape from every ignition. Earlier seed-0 (28,20) and seed-2026 (34,24) examples must not be assumed valid for v4.

## Targeted human recheck (user reports all three passed)

1. Generate/replay **0, 7 and 2026**, zoom in one wheel step, and judge branching coverage, varied shapes, one-cell trails and compact markers. Seed 5 additionally shows two optional loops. No new large clearings should appear at ordinary junctions.
2. On seed 7 reject trail (40,33) and beige clearing (38,25), then select brush **(40,34)**. Expect 20 initially trapped/zero lost, later recovery; the automated completion reference is 88.9 simulation seconds. Generation stays locked until reset; counts must total 20.
3. Check picking after physical pan/orbit/zoom, reset during/after fire, restored forest/20 waiting on the same seed, preserved camera, R and consoles. These checks and path-network appearance are now user-reported passes. Future awareness/second-connection policy remains a proposal, not implemented.

## Historical v3 and earlier methodology/evidence (superseded)

The following snapshot preserves earlier design reasoning/results. Its corridor-first rules, current-status wording and example coordinates refer to that older build; use the v4 sections above for the current implementation. Historical user feedback remains separate from pending v4 validation.


The first seeded increment remains **uncommitted and not yet accepted**, on feature/seeded-environment at foundation 6e39804. The user liked vegetation patches, seed variation and vegetation appearance, and confirms all three v2 rechecks passed. New design feedback is pending for sandy-beige clearings and local optional connections. The correction below supersedes v1 width/endpoint/palette decisions and its generated scenario timings. Historical v1 implementation/evidence follows for reference; v2 results remain in progress. Fixed-map evidence is unchanged.

#### Current trail and presentation correction

- Carve one edge-connected cell per raster step, without the former 3×3 sweep. Deterministically remove redundant 2×2 overlaps only when the whole network stays connected; preserve curve endpoints/branch tips and reconnect recorded traces through retained cells. Bends and junctions remain clean, with no broad 2×3/3×2 cleared bands in the checked seed range. A genuine irreducible four-arm junction may retain a compact 2×2 footprint. Optional branches/loops remain; no forced two-route shape, trapping or casualties.

- Origin: minimal **5×4** bare footprint for the original 20 distinct spawns, with one blue center indicator; safety: **one green destination cell**. Other spawn cells look like bare trail, not an oversized blue clearing. No population/destination semantics change.

- Bare trails: muted earth-brown **#806247**. Bare nonfuel clearings: muted sandy beige **#c4b38b**. Grass remains green **#91aa59** and ignitable. Legend swatches use the same generated-map palette. Ground coverage, not sparse models, defines fuel. Clearings/grass remain physically walkable but excluded by Path-first policy; trails remain fuel-free. Fixed fixture colors/data are untouched.

- Map identity changes to **forest-trails-v3**. Settings record **randomStreamVersion: forest-paths-v1**, keeping the established independent endpoint/path/vegetation/rock random streams while carving changes. Vegetation thresholds, noise patterns, models and endpoint centers stay on their prior streams. Regenerate the same seed/settings/version for replay; v1 maps are different logical layouts. Default seed remains 42; input validation, locks, replacement and reset controls are unchanged.

- Fire exposure, fuel, burn/cooling, fixed-step/catch-up behavior, agent speed, hazards, occupancy and direct-active-fire-only loss are unchanged. Buffers remain nonlethal. No dependency changes in this correction.

#### Why the large oval occurred, and the general correction

The previous optional bypass always joined main control points at 25% and 75% progress and chose global-axis offsets of 13–19 cells. On seed 2026 its bypass lay opposite the bowed main trail, enclosing a prominent oval; the long branch crossed that area too. This was authored optional-connection geometry, not vegetation noise, extra endpoints or a seed-specific preset. Reconstructed v2 trace lengths could also overcount retracing after overlap thinning; trace metadata now erases those repeated subloops without deleting the actual trail set.

Now a bypass joins adjacent main control points (25–50% or 50–75%), with two bends derived from that **local segment**, offset 40% of segment length clamped to 3.5–6 cells. Branch reach is 7–12 cells, normal to the local main direction, with a modest forward bend. Additions are attempted with the existing 0.55 probabilities, then rejected if their endpoint chord is outside 6–24 Manhattan cells, raster detour exceeds 2× chord, they cross existing interior trail cells, or over 30% of their interior steps lie within two cells of existing trails. Four-cell junction approaches are excluded from that proximity check. Rejection skips that addition, not all loops. No seed-specific exceptions.

Across 1,029 validated seeds, **549 loops / 487 branches** were accepted and **233 maps** had neither addition. **49 maps** needed a later deterministic candidate attempt under the existing validation/retry process; this can also change vegetation for that attempt. Seeds 0, 7 and 2026 stayed on attempt 0, retaining the same raw vegetation/noise/endpoint streams while changed carving restores fuel where long old detours were removed. Logical digest and map identity change deliberately; vegetation generation itself is untouched.

#### Current verification and reproduction

**81/81 tests pass.** The expanded 1,029-seed sweep (0–1023 plus 1024, 2026, 65535, 2147483648, 4294967295) checks deterministic valid networks, single-cell carving, no broad bands, compact origin/safety, 20 unique reachable spawns and policy/fuel separation. Seeds 0, 7 and 2026 additionally run actual A* from every spawn. Replays and a new seed-7 v3 logical digest are pinned. Zero-length control-point termination remains tested with the appropriate single-cell minimum length. Rendering checks inspect actual instanced colors (one blue/one green cell), fuel coverage and nonfuel rejection, while repeated application fixtures verify generation/reset/lock/disposal.

#### Adjacent-fire closure examples (reverified on v3)

1. Generate **seed 0**. Enable Place ignition and select **(28,20)**, then Start fire.

2. Bare trail **(29,20)** is adjacent and immediately becomes navigation-unsafe under the existing burning buffer, while remaining nonfuel/unburned. All 20 agents initially report Trapped; none are lost. This is a network closure, not lethal proximity damage.

3. Neighboring exposure still takes about **2 simulation seconds**. The automated 50 ms-step run includes recovery/reblocking and ultimately reaches **20 evacuated / zero lost at 188.1 simulation seconds**. Reset clears the buffer/fire and restores 20 waiting agents on the same map. Outcomes depend on seed/ignition; this is an example, not a universal trapping guarantee or a pacing/performance target.

For a revised-layout example use **seed 2026, brush (34,24)**, beside nonfuel trail **(35,24)**. Automated 50 ms-step inspection starts with 20 Trapped/zero Lost, first resumes movement at **54.6 s**, and reaches 20 evacuated/zero lost at **217.5 s**. Both dev and preview verified exact selection, bare trail/clearing rejection and initial trapping; full completion timing is automated evidence. These runs can exceed three simulation minutes; pacing was intentionally not changed in this design correction.

The fixed authored scenario traces remain exactly **60.8 s / 47.35 s**. Existing loss/navigation/camera/lifecycle regressions pass. Production build succeeds (43 modules; JS 642.16 kB / 166.94 kB gzip); the accepted chunk warning is unchanged. No generated FPS benchmark or full-MVP performance claim.

Current development/preview checks and pending design validation are recorded in the latest progress entry. New screenshots are outside the repository. The automated completion timing above is not a claim that an uninterrupted browser run was observed through completion in this correction.

#### Targeted human recheck (current v3)

1. Compare/regenerate **0, 7, 2026**: sandy clearings distinct from brown trails/green grass, winding one-cell trails and smaller local loops. Seed 2026 should no longer have its large oval. Same seed should reproduce.

2. Seed 0: reject trail **(29,20)**, select fuel **(28,20)** and start. Expect 20 initially trapped/zero lost, followed by changing hazards/recovery; the full automated example finishes around 188 simulation seconds. Check the five counts always total 20.

3. After camera movement, recheck picking, reset during spread, same-map restoration/20 waiting/camera preservation, R and generation unlock. Check both consoles; confirmation of this new design and acceptance remain pending.

#### Historical v1 implementation and verification (superseded where noted)

The following is the initial forest-paths-v1 record. Its three-cell width, 7×7 endpoint clearings, protected-centerline limitation, old palette, timings and pending checklist are historical, not instructions for the current v3 build. The general seed/UI architecture, fixed-fixture guarantees and advisory record still apply.

This is the first bounded Assignment 4 environment increment, on `feature/seeded-environment` from local main/foundation `6e39804`. It is uncommitted pending human validation. The published fixed-map build remains `27893e2`; no push/deployment was performed. Flat 64×64 at 0.5 world units per cell, 20 agents, one origin and one destination. The five technical pillars remain distinct from the three interaction stages; agents still use a state machine.

#### Reproduction and controls

Ordinary `/FireFront/` loads seed **42**. Enter decimal **0–4294967295** and click **Generate**. Spaces around the value and leading zeros canonicalize (` 0007 ` → `7`); signs, negatives, fractions, exponent/hex notation, empty input and overflow are rejected. No modulo wrapping, rounding or random fallback. The active seed/version is displayed separately from draft input. No automatic seed changes or density slider.

Map identity is `{seed, version: 'forest-paths-v1', settings}`; the installed map also records successful attempt 0–3. Separate Alea streams are keyed by version, canonical seed, attempt and component name (`endpoints`, `paths`, `vegetation`, `rocks`). Changing vegetation sampling does not consume endpoint/path randomness. Future algorithm/default changes affecting reproduction must use a new generator version. A seed-7 SHA-256 logical fixture detects accidental v1 drift independently of rendering changes.

Generate constructs/validates a complete candidate before calling the existing replacement lifecycle, restoring setup with 20 waiting agents, no selection/fire and a freshly framed camera. Generation is disabled once Start fire is used, including after evacuation completes; **Reset simulation** unlocks it. Reset replays the installed map without regeneration, restores fire/agents and preserves camera; **R** remains camera-only. Invalid input/candidate failure preserves the active session/view. At most four deterministic candidate attempts are made. If renderer construction fails after retiring a session, the form attempts to reconstruct its previous map; if that also fails it reports reload rather than claiming successful retention.

Development/test fixed fixture: `/FireFront/?map=fixed`. It uses the unchanged `createFixedMap()` adapter and original 20-agent formation. Benchmark URLs with `?benchmark=1&animation=normal` always force this fixed fixture and disable generation, preserving the original workload. No start/results screen or map-selector control was added.

#### Cooperating components

| Component | Responsibility |

| --- | --- |

| `generation/seed.js` | Strict input normalization, version/default settings and independent Alea streams |

| `generation/placeEndpoints.js` | Opposing seed-varying endpoints with margin, 7×7 clearings and 20 distinct origin spawns |

| `generation/createPathNetwork.js` | Deliberately connected smooth centerlines, raster sweep and optional loop/branch additions |

| `generation/createVegetation.js` | Independent 2D simplex regions for vegetation/clearings and rocks |

| `generation/validateGeneratedMap.js` | Shared contract, metadata/settings, separation/capacity, clear network and reverse BFS from safety |

| `generation/createGeneratedMap.js` | Coordinate components, carve paths/endpoints, form metadata/policy and bounded validation retries |

| `world/navigationPolicy.js` | Physical walkability AND Path-first mask for A* / buffer exit; legacy fixtures unchanged |

| `ui/createGenerationControls.js` | One persistent form, active seed, lock/error/retention behavior and cleanup |

Alea **1.0.1** and simplex-noise **4.0.3** are pinned in package.json/lockfile, with no transitive runtime additions. Official registry metadata reported these versions. Official [simplex-noise guidance](https://github.com/jwagner/simplex-noise.js#using-a-seed-value) documents browser/Node ESM/CommonJS and `createNoise2D(alea(seed))`; [Alea guidance](https://github.com/coverslide/node-alea#usage) documents its seeded callable PRNG. Neither package declares an engine constraint; import/integration/build verified on the existing Node 24.21.0 environment and Vite 8.3.2. These checks do not certify every browser/Node release.

#### Defaults and layout decisions

- Origin/safe centers are chosen around opposing directions with radii 21–25 cells, with seed-dependent direction/radius; validation requires at least 34 cells Euclidean separation. Clearings stay in bounds. Twenty spawns use the same 5-column/4-row formation relative to the new origin, within its 7×7 clearing; the destination is one center cell.

- Initial path width is **3 cells (1.5 world units)**: each rounded sample and edge-sharing connecting sample sweeps the same 3×3 footprint. Catmull–Rom centerlines with a few broad bends avoid gratuitous zigzags; rounding creates ordinary grid stair-steps. Joins/curves may be wider, but there are no deliberate one-cell pinches. Optional loop and branch each have probability 0.55 using only the paths stream. Not every map has two routes; none receives invented Route A/B labels.

- Vegetation scale **0.075**: simplex value below **−0.45** gives a bare clearing, [−0.45,−0.05) grass, [−0.05,0.35) brush, ≥0.35 forest. Independent rock noise at scale **0.13**, offset (100,100), above **0.68** creates blocked nonfuel rock regions. Paths and endpoint clearings are carved afterward, so noise never determines initial reachability or leaves fuel/rocks on the network. These thresholds are fixed defaults, not exact percentage quotas.

- Fuel and physical traversal stay independent. Grass/clearings are physically walkable; dense brush/forest and rocks are blocked. The separate boolean navigation mask permits only path/start/safe cells for **Path-first** agents; both ordinary A* and emergency buffer-exit search respect it. No Flexible movement implementation. Ground coverage follows fuel cells; existing sparse models do not define coverage. Clearings have a distinct bare ground treatment/legend.

- Existing fire exposure, fuel 4/6/10, burns 12/18/30 s, cooling 8 s, 50 ms steps / 250 ms cap, speed 1.5 cells/s, hazards, occupancy and direct-active-fire-only loss are unchanged. Buffers/hot ground/trapping alone remain nonlethal. Agent overlap remains allowed.

**Width/hazard tradeoff:** a swept three-cell band has a nonfuel centerline whose eight neighbors are also nonfuel network cells. The unchanged one-cell burning buffer therefore cannot fully close that protected backbone. Edge paths can be avoided/rerouted as hazards change, but full closures/trapping/loss are not promised on generated layouts. Do not narrow roads or change lethal/hazard rules to force them. The fixed authored fixture continues to exercise deliberate closures/trapping/recovery. Future path-width/hazard design needs separate agreement; this increment does not expand the buffer.

#### Actual verification

- **78 tests passed.** Range: all integer seeds **0–255**, plus **1024, 2026, 65535, 2147483648, 4294967295** (261 total). Checked dimensions, unique spawn capacity, endpoint separation/bounds, independent reverse reachability, bare network, physical grass versus navigation mask, full swept width, all fuel classes/rocks/clearings and variation. Seeds 0–15 and uint32 maximum also replay identically; seed 7 has a pinned logical digest. Coverage is bounded, not proof over all 2³² seeds; runtime validation/retries remain necessary.

- Component-stream isolation, invalid inputs, deterministic bounded retries, malformed policy/network rejection and grass-shortcut/buffer-exit exclusion have focused tests. Cooling preserves physical grass while leaving its Path-first exclusion intact.

- Actual application/form/Three.js-control fixtures repeatedly generate seeds **0, 7, 42, 2026, 1, 4294967295**, check active-run lock/reset/canonical input/error retention and recovery after controlled renderer failure. Renderer-only stand-in checks one loop/observer/handler set, removal of old resources/listeners, fresh counts/selection and no generated network decorations. Existing lifecycle/picking/drag regressions remain intact; this is not a GPU-memory benchmark.

- Fire/A* integration on **0, 7, 42** checks neighboring spread, count conservation, staying inside policy, reset/replay and equivalent 30/60 Hz rendering inputs for ten simulation seconds. Existing direct-fire loss, fixed-map closure/recovery and exact fixed scenario timings pass unchanged (central 60.8 s; alternative 47.35 s evacuation).

- Separate automated functional inspections ran each example below for **120 simulation seconds** (50 ms steps), conserving 20 and ending 20 evacuated/zero lost. These are functional scenario timings, not rendering/FPS measurements and not acceptance requirements for every seed.

| Seed | Paths/appearance | Suggested ignition (x,z) | First neighboring spread | Measured evacuation complete |

| --- | --- | --- | --- | --- |

| 0 | Single winding corridor, roughly north-to-south endpoints | (27,17), grass | ~2 s | 40.7 s |

| 7 | Loop/branch additions, opposite diagonal endpoints | (44,43), grass | ~2 s | 43.35 s |

| 42 | Default, single winding corridor | (41,45), grass | ~2 s | 45.35 s |

| 2026 | Different diagonal endpoints/network additions | (48,41), grass | ~2 s | 46.7 s |

- Browser checks: development displayed seeds 42/7/0, invalid `1e3` retained seed 7, generated-path rejection and exact (44,43) selection worked. Development seed 7 and production seed 2026 (48,41) visibly spread/burned/cooled and reached **20 evacuated / zero lost**; generation remained locked until reset. Preview also displayed 42/7, with seed-7 appearance matching dev. Responsive preview checked 360×640 stacking/scrolling (319×314.19 canvas, scrollbar accounted for) and 1280×360 short-window scrolling. Wheel/R and camera-preserving simulation reset are checked separately below in progress. Physical right/middle gestures and subjective readability on generated maps remain pending user validation; existing controls/guards are regression-tested, not claimed newly physically tested.

- Final normal production build passed (43 modules; JS 638.54 kB / 165.69 kB gzip); diff checks/review passed. Both inspected app consoles and the fixed benchmark entry point were clear. Preview reset after completion preserved zoom, restored 20 waiting/vegetation and kept seed 2026; R restored overview, and overflow input retained the map. Final-build seed-7 ignition/reset during movement restored setup/unlocked generation. Typing I in the development seed field did not toggle placement, and a preview panel-origin click in placement mode did not select fuel. The fixed development entry point and forced/locked production benchmark fixture were browser-verified without capturing a new benchmark. No generated-map FPS benchmark was performed; earlier fixed-map captures do not apply. The existing FPS display is observational, not certification of generated-map performance.

#### Remaining limitations and future choices

No elevation, water/bridges, weather, buildings, alternative algorithms, start/results screens or multiple endpoints. Multiple origins up to 4 / safe zones up to 3 remain future direction; minimum counts and destination-choice behavior are undecided. Sen’s algorithm-comparison suggestion remains later exploration. No new assets, procedural scene models, random mortality or pacing changes. Existing deferred ignition-button animation/assets feedback remains deferred.

Installation/audit reported **one high-severity package finding in pre-existing Vite 8.3.2**, covering launch-editor and dev-server advisories; neither new dependency was flagged. npm reports a patch to **8.3.5** available. No automatic/force fix or unrelated upgrade was applied. Review separately before future publishing/deployment. See [the high-severity advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm) and npm audit for the full related list.

#### Pending human recheck

1. Compare seeds 0, 7 and 2026; regenerate a seed and confirm the same endpoints/network/fuel. Try invalid input; the active map must remain usable.

2. On seed 7, select grass (44,43), reject a neighboring bare path, then Start fire. Confirm generation input/button lock, visible propagation and the five counts total 20. Protected centerlines may allow everyone to escape.

3. Zoom/pan/orbit and use R; check picking after movement. Reset during/after a run: same map/seed, restored agents/fuel, selection off, camera preserved and Generate unlocked.

4. Check narrow/short layouts, panel isolation and both consoles. Confirm no brown distant-ground artifact. These checks do not establish generated-map FPS performance.
