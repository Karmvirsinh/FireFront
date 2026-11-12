# Production woodland and fine terrain integration (review pending)

## Preservation and manual status

Comparison/shadow checkpoint: **ef0df4b**, preserved on codex/asset-terrain-comparison.
New work: codex/production-woodland-integration, uncommitted. No merge/push/deployment.
User prefers Smooth257and the adapted Kenney palette. Checklist mostly passed,
not blanket final acceptance. Scale is tentative and evaluated on the52-unit map;
no global shrink/thinning in response to the small study. Original rocks and the
validated bare-face fire correction are retained; rejected formations stay removed.

## Curated roster and provenance

Inspected the actual archive and bundled side previews.16tree silhouettes,4low
shrubs and4grass/ground-cover forms; height-normalized geometry fingerprints are
all distinct for the16trees. Geometry differences are not a guarantee of visual
acceptance, but dark/fall recolors are NOT counted. No tropical/desert choices.

### Trees

`tree_oak.glb`, `tree_default.glb`, `tree_detailed.glb`, `tree_simple.glb`, `tree_small.glb`, `tree_tall.glb`, `tree_thin.glb`, `tree_fat.glb`, `tree_pineGroundB.glb`, `tree_pineDefaultA.glb`, `tree_pineRoundA.glb`, `tree_pineRoundC.glb`, `tree_pineSmallA.glb`, `tree_pineTallA.glb`, `tree_pineTallA_detailed.glb`, `tree_pineTallC.glb`.

### Low shrubs

`plant_bush.glb`, `plant_bushLarge.glb`, `plant_bushLargeTriangle.glb`, `plant_bushTriangle.glb`.

### Grass / ground cover

`grass.glb`, `grass_large.glb`, `plant_flatShort.glb`, `plant_flatTall.glb`.

Source/license and per-file hashes: public/woodland/kenney/SOURCE.md and original
License.txt. Kenney Nature Kit is CC0. Original GLBs unchanged; runtime approved
FireFront palette preserves trunk/crown parts and shade variation. Raw source and
Gaea comparison pages remain separate. No new dependency.

## Deterministic woodland composition

An independent named PRNG stream selects broadleaf, conifer, mixed or autumn
character; no numeric seed bands or seed-modulo cycle. A separate low-frequency
region field favors coherent local mixtures; per-cell streams choose species/age.
Autumn applies only in that character and coherent broadleaf regions, blending
muted greens/gold/rust instead of uniformly scattering orange trees. Fuel classes,
initial fuel, fire timing, awareness and agent rules do not depend on model choice.

Established full-map placement/scale is the starting point, with modest age variation
and varied native silhouettes. Clearances use conservative model radii, including
age scale, and protect every trail/spawn/destination footprint. This can omit a
plant whose actual canopy would intrude; it does not globally thin forest cover.
Each base stays owned by its original logical fuel cell. Some crown overlap remains.
Source-model native height normalization keeps ordinary mature shapes near the
accepted3.3-unit study scale, slender/tall forms near3.9, smaller forms near2.5,
before existing full-map instance scales/age. Agents remain0.42units tall; trails
remain0.5units wide. Full-map visual acceptance is pending.

Geometry/materials are shared within instanced model/part batches. Only selected
CPU artwork data are loaded; GPU resources belong to each map session and are
disposed on regeneration. Trees stand/darken while burning, exhaustion hides
originals and reveals remnants; shrubs/grass burn out; cooling clears fire/embers;
reset restores exact transforms/colors/theme/placement. Flames use actual model
base/height/radius. Production boulders and accepted surface materials stay intact.

## Authoritative fine surface and generation

Current identity: **forest-woodland-v12 / simulator-continuous-surface-v3**.
Logical104×104,0.5units,20agents remain. Surface257×257corners/256²cells spans52units;
indexed mesh has66049vertices/131072triangles and Smooth lighting normals.
This is an analytic field sample, not subdivision of coarse triangles. Shared
continuous ridge/cut cap/envelope corrections are reused on the production extent
and existing independent landform stream. No Gaea heightmap is adopted.

An optional elevation.surface holds authoritative fine shared corners. Logical
coordinates map by256/104; these grids DO NOT divide evenly. All height consumers
use sampleTerrainHeight: ground, skirt, agents, objects, labels, selection, flames
and embers. Ground picking borrows the rendered ground mesh, avoiding a duplicate
large raycast mesh. Logical masks/fire categories remain nearest-filtered textures,
so visual cell coverage and ignition data agree despite different mesh resolution.

Terrain is generated FIRST. Every logical navigation cell is conservatively checked
against ALL overlapping fine triangles, plus existing edge checks and20°constraint.
Routing/spawns/network construction then use that same feasibility rule. Initial
reachability, bypass and final graph checks remain. Zero grading: no plateaus are
flattened to hide invalid routes; bounded retries select valid terrain/network.
No prototype50°capability, slope speed/fire effects or new navigation algorithm.

Layouts/endpoints/trails and example coordinates/timings can change. v11 is retained
through createGeneratedMapV11; historical vegetation/surface/fire tests explicitly
use it. v5–v10and authored flat fixture/benchmark remain unchanged. Existing fuel
noise is preserved outside newly carved paths/endpoints and explicitly exposed
mineral cover. Species selection does not rewrite fuel/walkability. Old generated
timings are historical and must not be relabeled v12.

## Checks and review

Focused fine-surface, picking, deterministic map, slope/connectivity, model/fuel
ownership, lifecycle/reset, historical fire and map/session checks passed before
the full suite. The complete sequential suite passed **189/189 tests** (about 357 seconds).
Production build passed (107 modules).
No new benchmark tooling or full-MVP performance claim.


### Scenario traces (simulation time, not browser/performance measurements)

All runs conserved the 20-agent population. These are new v12 layouts:

| Seed / ignition | Model | First movement | Outcome at 180 s |
| --- | --- | --- | --- |
| 0 / (70,41) | Global | 0.05 s | 8 evacuating, 12 trapped; unfinished |
| 0 / (70,41) | Local | 0.05 s | 20 evacuating; unfinished |
| 2 / (83,23) | Both, separately | 0.05 s | 20 trapped; unfinished |

Trapping occurred in each of these traces. No evacuation or loss occurred within
that bound. This is not a promise that every generated ignition completes quickly.
No timing, awareness, fire or movement rules were changed to force an outcome.

Separate **small isolated fuel patches**, useful for checking complete flow rather
than demonstrating route hazards, completed with Local Awareness and 20 evacuated:
seed 0 / (6,77), 113.35 s; seed 7 / (24,97), 157.35 s. Historical scenario timings
remain historical and are not relabeled as v12 results.

### Costs and limitations

The main entry now includes the compiled curated geometry: 527.09 kB / 95.18 kB
gzip (previous main entry 84.59 / 31.51 kB). Shared/comparison chunks also retain
visible Vite size warnings. Thresholds are unchanged. Source GLBs are preserved
for provenance; the runtime uses compiled selected geometry, not the whole kit.

Seed 34 needed terrain/network attempt 60 and visibly paused synchronous generation
for several seconds before completing. Seeds 0, 7 and 2026 selected attempts 9,
8 and 12 respectively. Bounded retries preserve terrain and route constraints;
this latency remains a limitation, not a hidden relaxed navigation rule.

Browser review and pending human checklist are recorded in the progress log.
These checks are not a full performance benchmark or final visual acceptance.


### Final browser verification

The reused production tab showed all four woodland characters (seeds 0/2/7/34),
shadows, overview and close-up scale. Seed 0/(6,77), Local, reached the results
popup with **20 evacuated / 0 lost / 0 trapped at 113.35 s**. The selected cell
reached burned-cool; Inspect and reset worked. Reset restored 20 waiting agents,
plants and unlocked setup while preserving zoom. A separate forest-floor ignition
at (22,55) showed neighboring propagation, standing darkened vegetation and charred
remnants; active reset restored it. After zoom, fuel picking worked and a road and
bare face rejected ignition. R retained its camera-only behavior.

Development entry/Skip, regeneration, selection, ignition lock and reset also
passed. Production narrow390×740 had no horizontal overflow; short1280×650 retained
usable overview/panel scrolling. One canvas remained after regeneration. Inspected
Development and production consoles were clear. Temporary viewport overrides were
removed. Physical mouse gestures and final visual/scale acceptance remain pending.

Human review: inspect seeds0/2/7/34; compare size against agents/trails; test picking
after pan/orbit; watch burning, burnout/cooling and reset; check regeneration and
narrow layout. Existing original boulders and accepted ground materials should
remain. No new human passes or complete performance validation are claimed.
