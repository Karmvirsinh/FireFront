# Beta: composed terrain in the simulator

Historical v9 implementation record. The subsequent uncommitted v10 refinement is described in [Beta terrain refinement](beta-terrain-refinement.md). These v9 scenario timings and prior non-matched lighting comparisons are not current v10 evidence.

Vegetation checkpoint: **38010a2**, `feat: integrate stylized vegetation with fire lifecycle`, on `feature/beta-visual-integration`. The user reports all four functional checks passed; no timings are inferred. Sparse forest, pale patches and production/prototype terrain differences were separate visual feedback. Overall landscape appearance remains unaccepted. This subsequent integration is uncommitted for review.

## Shared composition

`src/world/generation/landformComposition.js` now owns the actual prototype operators. Both studies and simulator call the same functions: irregular polygon tablelands, variable shelves with optional long approaches, asymmetric curved-spine ridges, hills, subtractive basins, flatter blends, descending dry cuts and joined tributaries. The prototype compatibility export retains its original 32-unit profile, stream and resolution.

Current **forest-composition-v9**, terrain **simulator-composition-v1**, composes these over 52×52 world units. Separate named streams choose Gentler/Mixed/Rugged probabilities and vary outline, orientation, relief, shelves, approaches and relationships. Sites span the map, including clipped boundary/corner forms. One to three additional raised forms and optional flat regions cover the larger domain; hills/ridges/tablelands retain world-unit sizes, and dry trunk lengths span the larger extent. This is not a stretched study or three fixed templates. Relief is bounded to 0.5–12 world units.

The surface remains **105×105 shared corners**, 104×104 logical cells at 0.5 units, NW–SE triangles. Broad forms do not need artificial subdivision. Rendering, agents, object/fire bases, selection and ground-only picking share that authoritative surface.

Terrain comes first. The existing production rule protects both complete cell faces and cardinal crossings at **20°**, including the 20-cell spawn footprint, junctions and bypasses. Endpoints and the branching narrow network fit connected suitable ground. **Zero terrain grading**: retries preserve landforms rather than flatten them to force trails. Up to 12 terrain candidates × eight network attempts are bounded. Terrain/routing is reused only within one generation call; failure retains the previous live map. Off-trail steep surfaces do not change fuel or physical walkability.

## Woodland and clearing presentation

Render-only woodland-v3 increases candidate density multiplier 0.78 to 1.4, vertical tree scale 0.40–0.54 to 0.60–0.80, lateral multiplier 0.86–0.99 to 0.78–0.91, and changes minimum separation from 0.82 to 0.66 times the two conservative crown radii. Prototype trees use isotropic 0.70–1.10 scale and 0.86-unit spacing. Production keeps narrower crowns and strict trail/endpoint clearance for agents/fire readability, with some crown overlap to connect woodland. Trunks remain in their own forest-fuel cells, using deterministic hashes. Grass/shrub placement rules remain unchanged. Larger crowns mean final instance counts need not increase: seeds 0/7/34/2026 have 790/822/815/874 trees. On the same current maps, mean conservative crown diameter increases from about 1.13–1.14 to 1.51–1.53 world units, and summed crown-circle areas rise about 65–74%. These are layout diagnostics, not measured union coverage or visual acceptance.

Fuel generation remains **forest-regions-v2**, with independent forest/rock streams. Only newly chosen routes/endpoints carve fuel as before. New layouts legitimately change spread/outcomes. Nonfuel clearings were pale sandy earth; now they use quieter earth/gravel with an updated legend note/swatch. They remain nonignitable, physically walkable and off-policy under Path-first. Exposed rock/earth surface finish can cover fuel; the torch remains authoritative.

Each model retains cell ownership and actual base/size flame poses. Burning trees stand/darken until exhaustion, then show remnants; cooling removes flames/embers. Reset restores surfaces, transforms and colors. Fire, awareness/retry, A*, speed, hazards/direct-fire loss and population are unchanged.

## Historical and separate components

`createGeneratedMapV8` preserves forest-environment-v8/terrain-routed-v4 settings, attempt selection and streams. The preexisting terrain-first suite explicitly uses it. V5/V6/V7 and the authored flat fixed-map/benchmark fixtures remain. Old generated coordinates/timings are historical, even when a coordinate happens to recur.

Gaea remains an optional offline authored comparison with its existing provenance/restrictions; no new export or Gaea-derived map is used here. The prototype gallery/scan, 50° trial, authored Gaea surface and comparison camera/lighting remain separate. No water, bridges, buildings, new fire animation, rejected rock fragments or dependencies.

## Automated evidence

Sample: **0–23, 34, 2026, 4294967295**. All 27 generated successfully with finite bounded heights, 20° permitted faces/edges, all-spawn/network connectivity, consistent narrow-network metadata and bypass protection. Off-network fuel equals the original independent forest stream. Repeated 0/7/34/2026 maps, terrain reconstruction and placements are exact. No grading. Sample generation took approximately 0.06–1.95 s locally, a diagnostic rather than a benchmark. Seed 3 needed attempt 94/96; difficult shapes can still exhaust the bounded search.

| Seed | Family | Attempt | Relief (units) | Forest cells | Nonfuel clearing cells |
| --- | --- | --- | --- | --- | --- |
| 0 | Mixed / plateau | 9 | 5.0014 | 6591 | 335 |
| 7 | Rugged / ridge | 17 | 5.6915 | 6834 | 355 |
| 34 | Rugged / ridge | 42 | 8.3696 | 7283 | 179 |
| 2026 | Mixed / plateau | 12 | 6.6118 | 7021 | 265 |

New fixed-step scenario traces are bounded to **180 simulated seconds**. Reset/replay is exact and counts always sum to 20. These are automated observations, not human timing claims:

| Seed / ignition | Global | Local |
| --- | --- | --- |
| 0 / (46,9) | 20 evacuated at 104.70 s | 20 evacuated at 104.70 s |
| 7 / (83,65) | 20 evacuated at 155.50 s | 20 evacuated at 154.10 s |
| 34 / (14,28) | 180 s: 20 trapped, unfinished | 180 s: 20 evacuating, unfinished |
| 2026 / (76,73) | 180 s: 20 trapped, unfinished | 180 s: 20 trapped, unfinished |

No losses in these traces; no guarantee of completion on every seed or claim of visible direct-fire loss. Changed terrain/layouts explain new timings. No new benchmark or full-MVP performance claim.

Sequential full suite: **165 tests exercised, 164 passed initially**. An outdated hardcoded sandy-clearing color assertion failed after the intentional change. It now checks the map's declared clearing color; **all 11 map/session tests pass on rerun**, with no unresolved failure. All other tests, including new composition/scenario/lifecycle checks, historical/fixed exact timelines, loss/awareness, prototype/Gaea, picking, camera and resource cleanup passed. An earlier new assertion compared raw with normalized rendering metadata; it was corrected to compare normalized maps before that full run. The initial full run is not reported as entirely green.

Production build passes: **80 modules**, main 80.61 kB /30.17 gzip, shared 625.45 kB /160.89 gzip, prototype 822.74 kB /340.65 gzip. The existing size warning remains unsuppressed. Diff and UTF-8 checks pass. No dependencies changed.

## Browser evidence and limitations

Used one reused tab and existing dev5178/preview4178 servers; no duplicate servers or heavy parallel checks. Development inspected seeds 0,2,7,34,2026 at overview/closer zoom: gentler woodland, irregular ridges, tablelands, cuts and clipped boundary relief are visible. Production inspected 0,34,2026. Actual selection at seed0/(46,9) and rejection of bare trail(44,15) passed in both. Model-aligned burning, standing/darkened crowns, exhaustion/remnants and selected-cell cooling were observed. Both Local runs completed with **20 evacuated /0 lost /0 trapped at104.70 s** in their results popups. Development Inspect/reset and production Replay restored plants/surfaces/20 waiting with camera retained; production also reset an active fire. Regeneration 0→34→2026→0 retained one canvas and repeatable appearance. R/wheel and panel isolation were exercised; physical pan/orbit remain human checks.

Development and preview both passed **390×740 narrow** and **1280×600 short** layout smoke checks; narrow canvas349 pixels, page375 with390 viewport and no horizontal overflow. Both warning/error consoles were clear. The existing FPS readout was around144 in ordinary desktop observations, not a timed benchmark or a guarantee for other hardware. Viewport override was cleared and preview left in setup.

Saved full-simulator seed0 and separate Gentler/7 comparison views at1280×720, with the normal map zoomed to comparable world scale rather than comparing two differently sized full-map overviews. Also saved matched **Rugged emphasis / seed7** simulator/prototype views: the 52-unit current composition and 32-unit study deliberately use separate profiles/streams, so these are operator/art comparisons, not identical layouts. Existing camera orientation, lighting/shadows and backgrounds differ; this is not a pixel-identical controlled art comparison. Also inspected prototype Mixed/34 close-up, without adopting its special camera or 50° scan. Images are local review artifacts outside source. Original artwork/material provenance is unchanged.

Final human approval of landforms, connected-canopy balance, nonfuel clearing appearance and physical mouse behavior is pending. Some plateaus remain inaccessible because trails retain20° constraints; generation deliberately routes around unsuitable faces. Difficult seeds can fail the bounded search, and some valid scenarios remain trapped/unfinished in bounded traces. This increment does not solve every visual concern or add slope-based fire/navigation effects.

## Review

- Development: http://127.0.0.1:5178/FireFront/
- Production preview: http://127.0.0.1:4178/FireFront/
- Separate prototype/Gaea: `/FireFront/terrain-art.html`

1. Compare seeds 0, 2, 7, 34 and 2026 at overview and closer zoom. Judge hills, irregular raised tops, valleys/cuts, boundary features and woodland scale. Tests do not establish visual acceptance.
2. Seed 0: ignite (46,9); approximately 105 s completion. Seed 7 alternative: (83,65), approximately 154–156 s. Inspect standing/darkened trees, flame alignment, burnout/embers/cool remnants, readable trails/agents. Exact human timing checks are not required.
3. Move camera and verify picking, trail/clearing rejection; reset during/after fire restores all surfaces/plants/20 waiting and preserves camera. R resets only camera.
4. Regenerate/switch seeds, test physical pan/orbit/zoom, narrow/short windows, both consoles and entry/results/Inspect/Replay/New scenario. Functional passes and visual acceptance remain separate.
