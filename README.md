# FireFront

FireFront is an educational 3D wildfire and evacuation simulator for a university project. It explores how changing fire hazards affect navigation through forest paths, with an authored two-route regression scenario. It uses JavaScript, Three.js, Vite/npm and HTML/CSS, with no runtime AI service or external assets.

**Live demo:** [FireFront on GitHub Pages](https://karmvirsinh.github.io/FireFront/)

## Current scope

Normal local environments now use **forest-composition-v11: 104×104 cells**, cell size 0.5 world units, 20 agents, one START and one SAFE. Networks contain 14–18 ordinary nodes with narrow trails and occasional useful loops. Forest coverage now uses broad cores and transitional woodland with denser, irregular instanced trees; visual acceptance is pending. Terrain is established before final trails and slope-safe endpoints/spawns; terrain-feasible routing preserves its shape without grading. Current local terrain genuinely shares the prototype landform operators: irregular polygon tablelands/terraces, asymmetric ridges, hills, basin/flat blends and branching dry cuts. The 52-unit composition profile is `simulator-composition-v2`; carved trails retain the production 20-degree constraint without grading away landforms. Human visual acceptance remains pending. Seed input reproduces the selected generator version's environment.

The published checkpoint remains `5a183e9` (64×64 v5); these larger maps are the validated local adaptation. The authored two-route fixture at `?map=fixed` and historical benchmark stay 64×64. Historical generated examples below are explicitly **v5**, not current v11 coordinates/timings. The pure `createGeneratedMapV5(seed)`, `createGeneratedMapV6(seed)`, `createGeneratedMapV7(seed)`, `createGeneratedMapV8(seed)`, `createGeneratedMapV9(seed)` and `createGeneratedMapV10(seed)` regression paths preserve those environments without duplicating the application. See [seeded environment](docs/seeded-environment.md).

**Beta surface integration (validated locally, checkpoint `9439bd6`):** generated environments now share the prototype’s regional woodland/meadow, earth/litter, dirt/gravel trail, weathered face and layered cutaway treatments. Burning/hot/cooled ground overrides the regional finish; reset restores it. Brown woodland or exposed slopes can contain fuel; bare paths and earth/gravel clearings do not. The torch cursor verifies eligibility. That surface increment preserved vegetation, generator, simulation and navigation. The user reports all four surface checklist items passed; no exact timing is inferred. See [Beta surface integration](docs/beta-surfaces.md).

**Beta vegetation (checkpoint `38010a2`, four user-reported functional passes):** current terrain-first environments now use the prototype’s fuller broadleaf/conifer variants, grass tufts and distinct shrubs. Deterministic render placement keeps their canopies clear of trails/endpoints and bases on authoritative terrain. Trees stay standing/darken during burning, show charred remnants only after exhaustion, and restore on reset. Flames follow actual model bases and dimensions. Map/fuel data and all simulation/navigation rules remain unchanged. See [vegetation implementation and checks](docs/beta-vegetation.md).

**Beta terrain integration (uncommitted, appearance pending):** denser/larger fuel-owned woodland and quieter nonfuel earth/gravel clearings accompany composed terrain. Historical v9 automated examples (not current v10 evidence): seed 0, ignition (46,9), completes at 104.7 s for either model; seed 7, ignition (83,65), at 155.5 s Global / 154.1 s Local. These are illustrative outcomes, not guarantees or user timing claims. See [composition, current results and limitations](docs/beta-terrain-integration.md). Prototype studies and Gaea remain separate; no 50-degree policy is adopted.

Single ignition, fire lifecycle, Global/Local awareness, agent state machine, entry/tour/results and reset controls remain. FireFront is illustrative and does not implement every semester feature or calibrated wildfire physics.

The current uncommitted refinement softens bare-earth/bedrock boundaries without changing logical classifications, adds bounded silhouette variation, and shares warm presentation settings. See [current refinement and comparison procedure](docs/beta-terrain-refinement.md). The user subsequently reported the **v10 checklist passed**. Ground-patch, shrub-variety and trail-readability feedback remains pending; validation of the new fire/surface correction is separate.

The latest **v10 checklist passed according to the user**. A separate **v11 fire/surface correction is pending validation**: explicit exposed landform faces and dry mineral beds are nonfuel; plateau tops and continuously vegetated slopes remain fuel-bearing. Fuel cover changes do not alter heights, trails, walkability, fire timing or neighbor-exposure rules. Prior v10 outcomes are historical. See [fire/surface findings and current checks](docs/fire-surface-cover.md). Ground-patch, shrub-variety and trail-readability feedback remains pending; no asset trial is adopted.

## Prerequisites and installation

- Node.js satisfying `^20.19.0 || >=22.12.0`, with npm. Verification used regular Windows Node.js **24.21.0** and npm **11.19.0**.
- A current desktop browser supporting **WebGL2**. Physical right/middle mouse buttons are useful for camera navigation.
- Git is useful for checking out source, but is not needed to run a downloaded source archive. GitHub CLI is not required.

Open a terminal in the project folder containing `package.json` and run:

```sh
npm ci
```

This installs the exact lockfile versions: Three.js **0.186.1**, Vite **8.3.3**, Alea **1.0.1** and simplex-noise **4.0.3**, plus their dependencies. Do not omit development dependencies: Vite is needed for both development and production builds. Vite's minimal security patch and exposure assessment are recorded in [docs/vite-security.md](docs/vite-security.md).

Development:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/FireFront/**.

Production build and local preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open **http://127.0.0.1:4173/FireFront/**. Preview serves the existing `dist/`; rebuild after source edits. Stop each server with Ctrl+C. These URLs are local to your computer, not a deployed submission site. If a port is occupied, stop the existing project server or choose another port.

On Windows PowerShell, replace `npm` with `npm.cmd` if execution policy blocks the npm PowerShell launcher. Restart the terminal after installing Node or changing PATH. No machine-specific installation path is required.

## Controls and interaction workflow

The three interaction stages are **generate/inspect the environment**, **select one ignition**, and **start/observe the simulation, then reset for another run**. They are user actions, separate from the five technical pillars listed below.

| Action | Control |
| --- | --- |
| Enter workspace | **Begin simulation**, then optional tour with Back / Next / Skip / Finish |
| Reopen guide | **Help / Tour** during setup only |
| Generate environment | Enter a decimal seed and press **Generate**; disabled during a run until reset |
| Toggle placement | **Place ignition** button or **I** |
| Select ignition | Stationary left-click on grass, brush or forest fuel while placement is enabled |
| Start simulation | **Start fire**, enabled after a valid selection |
| Reset simulation | **Reset simulation** restores fire, selection, fuel and all agents; preserves camera |
| Zoom | Mouse wheel over the scene |
| Pan | Right-button drag over the scene |
| Orbit | Middle-button drag over the scene |
| Reset camera only | **R** |
| Inspect outcome | **Inspect scene**, then **View results** to reopen; **Replay same map** resets; **New scenario** generates a fresh seed |

The torch cursor shows blocked feedback over nonignitable ground. The amber hollow cell outline identifies the selection. Selecting another eligible cell before starting moves the single marker; bare roads and terrain sides reject ignition. Starting locks placement until simulation reset. I never selects a cell or starts fire. Left drag does not move the camera; camera gestures and panel interactions do not place ignition. Keyboard shortcuts ignore editable fields and Ctrl/Alt/Meta combinations; I also ignores held-key repeats.

Ground treatment defines fuel coverage, including gaps between decorative trees. Full-cell scorched/ash ground and flame/ember geometry distinguish burning, hot and cool states. Burning trees remain standing until exhaustion; charred stumps remain afterward. Placement-button flames indicate placement/ignition usage, independently of whether cells are still burning. Ordinary pages respect reduced-motion preferences.

## Demonstration scenarios

The timings below belong to the **fixed regression fixture**. Open `http://127.0.0.1:4173/FireFront/?map=fixed` (or the development port) to reproduce them. The ordinary page generates a seeded map; these coordinates/timings are not a guarantee for generated maps.

Coordinates are zero-based **(x,z)**. Toggle placement and click vegetation, using the selection status to find the exact coordinate. Press Start fire and keep the tab active. Times below are deterministic **simulation times from Start fire**, measured by the scenario helper; background suspension and long frame gaps can extend wall time.

| Event | Central forest **(32,32)** | Near Route A **(32,25)** |
| --- | --- | --- |
| First neighboring ignition | 2 s | 2 s |
| Route A unsafe | 14 s | Immediately |
| Route B unsafe | 20 s | 34 s |
| Navigation response | Turn-back toward B around 14 s | Choose B initially; all cross B by 26.35 s |
| Trapping/recovery | All 20 trapped around 20.2–26.15 s, then recover | No trapping expected |
| Routes reopen | A 26.15 s; B 32.1 s | A 16 s; B 46.1 s |
| All 20 evacuated | 60.8 s | 47.35 s |
| All fuel cooled | 52.7 s | 66.2 s |

Both ordinary scenarios finish with **20 evacuated / 0 lost**. They show route hazards without roads burning. Reset and select the same cell to replay deterministically; reset during a run also restores the original scene and agents without changing the view.

## Simulation and technical pillars

| Pillar | Implemented MVP / deferred scope |
| --- | --- |
| **Physics & Dynamics** | Illustrative deterministic neighbor-exposure fire, fuel consumption, burnout/cooling; calibrated wildfire physics and weather deferred |
| **Procedural Generation** | Seeded flat endpoints, connected winding paths and coherent fuel/clearing/rock regions; elevation, buildings and broader generation remain deferred |
| **Pathfinding & Navigation** | Four-neighbor Manhattan A*, changing hazard checks, rerouting and recovery |
| **NPC AI / Behavior Trees** | Implemented agent **state machine**: waiting, evacuating, trapped, evacuated, lost; no behavior tree implementation |
| **Rendering** | Three.js instanced map/agents/fire, compact labels, shallow visual terrain base, responsive dashboard and camera navigation |

Only edge-sharing burning neighbors contribute exposure; new ignitions are applied together after evaluation so they cannot cascade further within that same step. One burning neighbor takes 2 simulated seconds to ignite adjacent fuel. Grass/brush/forest burn for 12/18/30 seconds respectively, followed by 8 seconds cooling. Agents move at 1.5 cells/second. A shared 50 ms fixed step keeps simulation independent of ordinary rendering rates; excess elapsed time beyond a 250 ms frame cap is discarded rather than fast-forwarding after long gaps.

Fuel and base walkability are independent. Burning/hot cells are navigation hazards; burning additionally creates a one-cell eight-neighbor safety buffer. Nonfuel roads can be unsafe near fire but cannot ignite. Cooling does not change base walkability or navigation policy. Generated grass/clearings can be physically walkable while Path-first agents follow a separate mask of paths and endpoint areas; dense brush/forest and rocks remain physically blocked. Fixed-map walkability is unchanged.

An agent becomes **lost only when its occupied logical cell is actively burning**, checked after fire/hazard updates and before movement. Occupancy is the cell containing its continuous rendered position, including between cell centers. Nearby buffers, hot ground and trapping alone do not cause loss. Evacuated/lost states are terminal until reset. Counts always total the initial 20 agents.

## Tests and measurements

```sh
npm test
node scripts/measurePacing.js
npm run build
```

The regression suite covers fire spread/lifecycle, snapshot ordering, fixed-step replay, map connectivity, hazards, pathfinding, agent loss/count conservation/reset, camera/ignition guards, rendering lifecycle, viewport picking/resizing, FPS capture, map contracts, repeated map replacement, seeded-map/form/navigation invariants across 1,029 seeds, and entry/tour/results ownership and completion semantics. The pacing helper reproduces both scenario timelines; it is not an FPS benchmark.

Two automated, visible **Global Awareness / fixed-map** production-preview measurements recorded approximately **144 FPS average**, lowest complete one-second windows **142.02 / 143.00 FPS**, p95 intervals **7.5 ms**, and **zero complete windows below 30 FPS**. Both captured 60 seconds and completed evacuation. Baseline was a **1280×720 browser viewport**, with a smaller **922×555 embedded canvas/drawing buffer**, DPR 1, on the documented local NVIDIA RTX 4060 setup. This is a local result, not a full-size-canvas or other-hardware guarantee; independent browser acceleration-setting confirmation was unavailable.

See [performance methodology, environment, limitations and reproduction](docs/performance.md) and [raw two-run evidence](docs/performance-results.json). Optional manual benchmark reproduction was **not performed**, not passed. The compact FPS counter updates roughly once per second; hidden time is excluded and sampling restarts on return.

For the existing opt-in capture, open `http://127.0.0.1:4173/FireFront/?benchmark=1&animation=normal`. This enables a small JSON download and explicitly uses normal animation even with reduced motion enabled. Ordinary URLs retain reduced motion. Follow the performance document for warm-up, baseline sizing, (32,32), 60-second capture and reset/repeat; there is no separate benchmark dashboard or stress mode.

## Known limitations

- Fire settings are demonstration values, not calibrated wildfire physics. No wind, moisture, slope, diagonal fire spread, smoke or predictive accuracy claim.
- Agents may overlap. No crowd avoidance, off-path escape, health/exposure accumulation or random mortality.
- Direct-active-fire loss is verified through **controlled automated fixtures**, not a visible loss demonstration on the current nonfuel-road scenarios.
- Flat seeded generation is implemented locally; elevation, configurable/multiple ignitions, buildings/interiors, water/bridges, weather controls and alternative movement/algorithm comparisons remain deferred.
- Small labels may require zoom on very narrow overviews. Richer assets, road-width presentation and improved ignition-button flame animation remain deferred.
- Source archives without `.git` build successfully, but the optional build-metadata probe prints Git diagnostics and records unknown commit/branch metadata. A Git checkout supplies those values.
- Production build reports the accepted >500 kB chunk warning. Warning thresholds are unchanged; no code/quality tuning was performed to silence it.
- FireFront source and the GitHub Pages demo are published. Assignment 3 video and PDF deliverables remain separate work and are not claimed complete.

## AI assistance and human validation

FireFront was developed incrementally with Codex assistance for implementation, documentation, regression tests and browser checks under human-approved scope. This is development assistance; FireFront does not call an LLM or use runtime machine learning. Tests provide automated evidence, not proof of physical wildfire accuracy.

FireFront has human-reported validation for the map/camera, ignition/fire lifecycle, agent evacuation/recovery/reset, forest UI, scene readability and FPS behavior, as recorded in progress. Latest reported checks include FPS readability across sizes, sampling returning after minimizing, navigation/ignition/reset/camera preservation, and no red errors in both development and production-preview consoles. Automated benchmark captures remain distinct from manual validation; optional manual reproduction was skipped. Exact scenario timelines and direct-fire loss tests are automated evidence, not additional claimed human measurements.

## Source organization and documentation

| Path | Responsibility |
| --- | --- |
| `src/world/` | Plain map contract, fixed fixture/adapter, seeded components, navigation policy and BFS validation |
| `src/app/` | One active map session and complete replacement/disposal ownership |
| `src/simulation/` | Fire state, hazards, configuration and shared clock |
| `src/agents/` | A*, continuous movement and agent state machine |
| `src/rendering/` | Three.js map/fire/agent visuals, camera, resize and picking |
| `src/ui/` | Ignition/reset workflow, counts, cursor feedback |
| `src/performance/` | Render-time FPS sampling and opt-in capture/export |
| `tests/`, `scripts/` | Regression tests and deterministic pacing measurement |
| `docs/` | Requirements, historical progress and performance evidence |

Read [AGENTS.md](AGENTS.md), [requirements](docs/requirements.md) and [progress](docs/progress.md) before development. Existing experiment branches and annotated layout snapshots are retained locally. Compare versions only with a clean working tree; rebuild preview after switching because ignored dist output does not switch with Git.

## Assignment 4 map foundation (validated)

The existing renderer/simulation now accepts normalized plain map data with explicit spawn cells and metadata for labels, decoration bounds and overview framing. See [map contract and lifecycle](docs/map-contract.md). At this foundation checkpoint the default app loaded the authored 64×64 fixture with 20 agents. Seed selection/generation and entry/results screens were deferred at that historical checkpoint; subsequent approvals below supersede those deferrals. Elevation remains unimplemented. The contract/adapter supersedes fixed rendering-coordinate assumptions.

The overview includes actual relevant cells/zones and label footprints, with no camera dependency on a rectangular vegetationPatch. Existing map labels, fuel/roads, visual theme, controls and timings are preserved. Replacement is an internal application API that releases the old loop, handlers, observer, renderer and visual resources before constructing a new session. Simulation reset preserves the current camera; R remains camera-only. The synthetic maps are automated fixtures, not new selectable UI content.

Current automated checks cover a 12×8 map with three explicit spawns, an off-center 40×16 fixture and repeated replacement/failure recovery. Fixed-map event traces and default spawns match the original exactly. User-reported foundation feedback generally passed labels/framing, physical camera controls, selection/road rejection, evacuation and reset. A maximum-zoom-out ground artifact required a follow-up before closeout. Hidden soil/rock top caps have now been removed to prevent depth fighting with ground tiles, while sides, ground height, camera limits and depth testing remain unchanged. Canvas drags continue outside while held and now cancel on focus/capture loss. The user reports all three final recheck items passed: maximum zoom-out/orbit without brown fragments; drag continuation, release/focus cancellation and panel isolation; and fuel selection, road rejection, simulation reset and R. These user-reported checks complete foundation validation alongside the earlier feedback; automated/browser evidence remains separately recorded in progress. The original two automated performance captures remain historical evidence, not a new benchmark of this branch.

Local review URLs (servers stopped at session closeout): development http://127.0.0.1:5175/FireFront/ and production preview http://127.0.0.1:4175/FireFront/. Restart with `npm run dev -- --host 127.0.0.1 --port 5175 --strictPort`; preview with `npm run build` then `npm run preview -- --host 127.0.0.1 --port 4175 --strictPort`. The standard commands above remain valid with their original ports when free.

## Assignment 4 seeded environment (validated generator checkpoint 1949f12)

Enter a whole decimal seed **0-4294967295** and click **Generate**. Whitespace/leading zeros normalize; negatives, fractions, exponent/hex notation and overflow are rejected while retaining the installed map. The active seed/version is separate from edited input. Same seed + settings + **forest-network-v5** reproduces the map. Independent random streams retain the `forest-paths-v1` namespace. Up to four path candidates are tried; retries leave endpoint positions and underlying vegetation/rocks unchanged. V5 corrects trail thinning so a distant detour cannot substitute for a local junction and silently erase an intended bypass. Layouts can differ from v4; see [the correction and scenario evidence](docs/seeded-environment.md#v5-local-reconnection-correction).

The generator places **6-9 well-spaced ordinary forest nodes**, connects them with nearby branching tree edges, and attempts up to two useful extra connections. START and SAFE attach afterward to this existing network. Gentle curved edges become one-cell trails, with compact junctions rather than large node clearings. Node count, branch placement and loops vary; no rectangular template or guaranteed loop. The same compact origin supports 20 distinct spawns; safety remains one destination cell. Every initial spawn-to-safe path is validated.

Brown ground marks bare nonignitable trails; sandy beige marks nonfuel clearings; green grass contains fuel. Existing vegetation noise/models/colors are unchanged except where trails/endpoints are carved. Physical walkability and the separate Path-first mask remain distinct. No extra origins/destinations, new controls, Flexible movement, simulation-rule changes or timing changes.

Compare seeds **0**, **7** and **2026**; seed **5** also illustrates two optional loop connections. For a current closure example, use **seed 7, brush ignition (40,34)** beside trail **(40,33)**. With **Global Awareness**, both builds show 20 initially trapped/zero lost; automated simulation first shows local buffer-escape movement at **21.25 s**, resumes ordinary SAFE-directed evacuation at **42.25 s**, and reaches 20 evacuated/zero lost at **88.9 simulation seconds**. Normal A* waits for a currently safe complete route; the early motion is not proof that this route reopened. Adjacent bare trails never burn: the existing nonlethal navigation buffer closes them. Old v2/v3 coordinates/timings are historical and must not be assumed valid. Current alternatives and methodology: [seeded environment](docs/seeded-environment.md).

**Reset simulation** replays the installed map, restores agents/fuel and preserves the camera; **R** remains camera-only. Generation stays locked after Start fire until reset, even after completion. Generate installs a fresh setup with a freshly framed camera. `/FireFront/?map=fixed` keeps the original authored fixture; benchmark URLs always force/lock that fixture. Its scenario timings and original performance evidence remain unchanged. No generated-map FPS benchmark or universal evacuation/trapping/pacing guarantee.

The user reports all three v4 manual rechecks passed and accepts the path-network appearance. The generator is committed at `1949f12`; its Global waiting behavior is expected. Local Awareness below is separately validated at `74db471`. A second trail from the same START remains unimplemented. No dependency upgrade was made in those historical generator corrections; the later release-preparation [Vite assessment](docs/vite-security.md) resolves the recorded advisory with 8.3.3.

## Local Awareness with cautious retry (user validation recorded)

Ordinary generated maps default to **Local**; setup **Awareness: Global / Local** compares decisions on the same map without moving the camera or changing the ignition marker. Start fire locks mode/seed until reset. Reset restores agents/fire and clears observations, timestamps, retry timers and navigation while retaining map/camera/model. Fixed-map and benchmark sessions explicitly use Global; earlier performance captures remain Global/fixed evidence.

Both models use existing A* and Path-first traversal. Local knows terrain/SAFE, senses cell-center hazards within **4 logical cells** of continuous position, and keeps separate per-agent memory. After **5 simulated seconds trapped**, at intervals no shorter than **5 s**, hazards outside sensing range last observed at least **10 s** ago can become **uncertain for planning**. This does not mean they were observed safe. Repeated sightings refresh timestamps; sensed danger stays blocked. Uncertainty persists consistently along the retry route until re-observation. Normal actual unsafe entry and active-fire loss remain enforced; existing already-buffered escape can cross buffer-only cells, never fire/hot cells.

Current v5 samples finish within the **300 simulation-second bound** with 20 evacuated/zero lost: seed **0 / (44,10): Local and Global 56.70 s**; seed **2026 / (38,37): Local 130.75 s, Global 197.50 s**; seed **7 / (40,34): Local 63.65 s, Global 88.90 s**. Seed 7's logical map and quoted presentation timings are unchanged and explicitly rechecked. Seed 0 now has a usable bypass; it no longer exercises trapped recovery. The older v4 114.65/190.25 and 142.75/255.45-second examples are historical, retained as awareness regression fixtures. Default v5 **seed 34 / (23,35)** has safe initial routes and finishes at **Global 90.90 s / Local 74.00 s**; the original diagnosed candidate is separately tested. These are deterministic functional timings, not wall-clock/FPS measurements or guarantees on every map. Re-probing can still cause stopping/backtracking near persistent danger.

Reproduce comparisons with `node scripts/compareAwareness.js`; inspect any remaining trapped agents with `node scripts/inspectAwarenessRecovery.js`. [Awareness models](docs/awareness.md) documents current semantics/results/checklist. The [earlier recovery investigation](docs/awareness-recovery.md) preserves the pre-retry stalls and boundary fix as history, not current expected outcomes. The user reports retreat, reassessment and successful evacuation, plus reset restoring 20 waiting agents, preserving camera/model and unlocking selectors. Optional scenarios and exact timings are not claimed as human-checked. The validated increment is checkpointed on feature/local-awareness.

## Alpha lifecycle (validated)

The user reports all four lifecycle manual checklist items passed and accepts the replacement results icons for now. More colorful, lively icons are deferred feedback, not implemented work. No extra scenario timings or performance measurements are inferred.

Entry and the optional guide lead into the existing setup dashboard. Results auto-open once when all agents are terminal, or when fire/hot ground has finished and no remaining agent has an actual Path-first route to SAFE. Temporary trapping and stale Local memory do not end a run. Actual connectivity is used only to classify outcomes; agents receive no extra hazard knowledge. Reachable-but-stalled agents remain in the run for reassessment and are reported in the status area rather than hidden by a timeout.

Results freeze counts, seed/model and elapsed simulation time while remaining fire/cooling continues. Inspect scene restores camera/dashboard interaction; View results reopens the snapshot. Replay same map uses reset (same map/model/camera); New scenario chooses a fresh seed, keeps awareness and frames the replacement map. Neither reopens entry. The fixed benchmark bypasses onboarding and retains explicit Global/fixed defaults. No new generated-alpha performance measurement is claimed. See [lifecycle behavior, classification and manual checklist](docs/lifecycle.md).

## Isolated terrain/art study (refinement awaiting review)

On codex/terrain-art-prototype, open `/FireFront/terrain-art.html` for a 12-composition gallery: seeds 7, 34, 2026 and 913 under gentle, mixed and rugged selection biases. These compose reusable hills, ridges, irregular tablelands, side shelves, basins, flatter regions and optional branching dry cuts, rather than selecting three fixed maps. Only the current scene is rendered. Overview/R and Close-up support inspection; **T / Scan terrain** shows pale suitable dots, near-limit triangles and blocked X markers for 7.5 seconds. Click ground for the measured slope, physical blocker and separate Path-first policy reason. Red is blocked, not lethal.

Normal FireFront at `/FireFront/` remains unchanged for comparison; no fire/evacuation runs on the study page. Original low-poly art direction was approved after the six-study review, but current terrain variety, surface detail and scan clarity still need human review. Historical studies remain explicit regression fixtures. See [prototype guide and checks](docs/terrain-art-prototype.md) and [asset/tool sources](docs/terrain-art-sources.md). Build/preview commands above build both entry pages. The preserved terrain-aware trail WIP's human acceptance is still pending.

An additional **Gaea comparison** button (or `/FireFront/terrain-art.html?study=gaea`) displays a real 512-square exported Sandstone Butte heightmap and layer mask. This is an offline authored, non-commercial educational comparison with no routed trail/simulation. Existing studies and normal maps remain unchanged. See [export evidence, scale and usage restrictions](docs/gaea-trial.md).

Current uncommitted prototype refinement compares **129×129 / 257×257** Gaea surface meshes with matched camera/lighting and unchanged 128-square traversal cells (`&mesh=257` opens fine mode). Original coherent surface textures/cutaway bands replace categorical color patches. T now includes every trail cell; clicking outlines the logical cell and distinguishes slope, physical blockers and Path-first permission. Fine-face slope is separately reported. The recommendation is 129 as default, 257 for close inspection; appearance/scan acceptance remains pending. See [actual checks, mesh costs and human checklist](docs/terrain-detail-comparison.md).

Those refinements are checkpointed at98b1bec. The user reports modest fine-mesh benefit and improved trail scan coverage; materials remain unaccepted as uniformly mottled. The current uncommitted **illustrative prototype slope trial** permits clear terrain up to50°: pale0–20°, triangle above20–50°, red above50° or a physical blocker. Forest/rock and Path-first restrictions remain; existing trail shapes and normal simulator20° rules are unchanged. See [trial limits, actual checks and examples](docs/prototype-slope-trial.md). No agent climbing or slope-dependent movement is implemented.

Prototype surface-detail review: the accepted 50° trial is checkpointed at **3b817a0**. Uncommitted substrate refinement replaces uniform spray with distinct dirt, meadow, forest-floor, weathered rock and layered cutaway treatments. Normal application behavior is unchanged. See [surface-detail checks and visual checklist](docs/prototype-surface-detail.md); final material appearance awaits human review.

Current prototype review: regional green/earth/litter cover and varied trail sections follow material checkpoint **1bf0c42**. The subsequently tried angular rock formations were selectively removed; original face geometry/boulders and ground-only picking are restored. Regional woodland still supports earthy, mixed and green outcomes. Normal application and map/traversal data remain unchanged. See [current correction and historical evidence](docs/prototype-regional-surfaces.md); appearance remains pending human review.


### Isolated asset and finer-terrain evaluation (uncommitted)

On `codex/asset-terrain-comparison`, open `/FireFront/asset-terrain-comparison.html`
through the same dev/preview server. Compare original artwork with a small CC0
Kenney Nature Kit subset on identical placements/view/light. Procedural surfaces
have65/129/257corners; Gaea has129/257/513corners from the original512² export.
Normal simulation and its production navigation are unchanged. Fine surfaces can
expose trail barriers: the comparison reports them rather than silently rerouting.
See [sources, costs, limitations and pending review](docs/asset-terrain-comparison.md).
Gaea's educational/noncommercial provenance remains separate from Kenney CC0.

Comparison correction: the65baseline now retains exact gallery face normals and original rock manifest. Fine procedural modes explicitly label continuous ridge-cap repairs; Gaea sampling stays separate. The neutral untouched Kenney source check is at `asset-terrain-comparison.html?modelCheck=1`; source turquoise is not silently recolored green. See the comparison document for findings and pending visual review.

Presentation review: comparison terrain now defaults to Smooth, with an independent Faceted option at every mesh size. B uses a labelled FireFront natural palette; neutral source rendering remains available. Generated simulator/comparison shadows are restored with map-fitted coverage; simulation rules and historical fixture workloads remain unchanged. This work is uncommitted pending visual review.


## Prior v12 woodland integration record (superseded by v13 below)

The current working branch is `codex/production-woodland-integration`, based on
comparison/shadow checkpoint `ef0df4b`. Normal generated environments now use
**forest-woodland-v12**: a 104×104 logical map with a genuinely sampled, Smooth
257×257-corner terrain surface. Production trails retain the 20° limit; the
prototype's 50° trial remains separate. New generated layouts differ from prior
versions, so earlier ignition coordinates/timings are historical examples.

Kenney Nature Kit CC0 vegetation uses 16 tree silhouettes, four low shrubs and
four ground-cover forms, with seeded broadleaf, conifer, mixed and autumn woodland
characters. Fire lifecycle, model ownership and reset follow the logical fuel
cells; decorative species do not change fuel or traversal. Original boulders,
accepted ground materials and the bare-face fire correction are retained.
See [roster, terrain contract, checks and limitations](docs/production-woodland-integration.md).

Use the existing commands: `npm ci`, `npm run dev -- --host 127.0.0.1`,
`npm test -- --test-concurrency=1`, `npm run build`, then
`npm run preview -- --host 127.0.0.1`. Vite prints the actual port. With the reused
servers for this review, Development is http://127.0.0.1:5178/FireFront/ and
Production preview is http://127.0.0.1:4178/FireFront/. Gallery and isolated
comparison remain at `terrain-art.html` and `asset-terrain-comparison.html` under
that base path; Gaea remains an authored comparison only.

For a short complete-flow check, use Local / seed 0 / ignition (6,77): this small
fuel island allows 20 evacuations at approximately 113.35 simulation seconds in
automated tracing. It is not a rerouting demonstration. Larger fuel components
can leave runs unfinished at 180 seconds; details are documented above.


## Assignment 5 functional setup (user-validated v13 checkpoint)

Normal environments now use **forest-settlements-v13**: 2–3 labelled origins,
2–3 safe destinations, and **20 agents total** distributed among outside entrance/
assembly cells. Small original shelters have blocked footprints and trail-connected
entrances; safe arrival is outside the structure. **Buildings do not burn or get
destroyed in this version**, and interiors are not simulated. Original structures
are used because suitable building models are not part of the curated local kit.

Choose **A*** or **Dijkstra** before Start fire. Both use the same unit-cost
four-neighbor graph, awareness, hazards and movement safety. Dijkstra is the same
search with a zero heuristic; A* estimates distance to the nearest allowed goal.
Routing can choose another reachable safe destination when known hazards block a
route. Local still discovers hazards within four cells and uses its approved
cautious retries. Planners are shortest-path alternatives, not new agent behavior
trees. Different equal-cost route choices can change scenario timelines.

Planner and awareness selectors lock during a run; Reset unlocks them and keeps
their choices and camera. R resets only the camera. Reset restores all 20 agents,
fire and original scene visuals; Generate replaces the map. Existing commands
and local ports remain unchanged. The accepted corrected ground pipeline, Smooth
257-corner surface, Kenney palette/variety, shadows and original boulders remain.
Historical fixed/v5–v12 fixtures retain their explicit replay paths and default A*.
See [map/endpoints/buildings contract](docs/map-contract.md) and
[actual functional verification](docs/progress.md).


Functional verification:197/197tests passed sequentially; production build passed.
The user reports the full functional checklist passed. With Local Awareness,
seed0/(6,77) completed at72.70simulation seconds for both planners; the larger
seed0/(70,41) case included trapping/replanning and completed at150.30s. Global
seed7/(24,97) completed at128.00s with either planner. These are automated traces,
not user-reported timings or performance benchmarks. Alternate-destination
switching is covered by controlled fixtures; those generated examples did not
switch destinations. Some seeds still exhaust bounded base generation; failures
retain the old map or visibly fall back to seed0 on initial load.
