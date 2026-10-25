# FireFront requirements

FireFront is an educational wildfire/evacuation simulator. Mentor: Danrui Li.
The priority is simulation behavior supported by clear, stylized low-poly / voxel-inspired 3D. This is not a validated wildfire prediction tool.

> Status note (2026-10-22): increment-specific statements below are historical. Later approvals/closeouts supersede earlier "unimplemented" and timing statements; the deployed fixed-map baseline is 27893e2. Assignment 4 approvals at the end supersede earlier fixed-only/deferred-generation statements without changing historical MVP scenarios.

## Midterm MVP

- One small fixed 3D scene with a vegetation patch, one agent starting area, one safe zone, and two possible routes.
- Single ignition; simplified fuel-grid spread, burnout, and cooling.
- Automatic evacuation; agents avoid burning/hot ground and reroute when hazards invalidate their route.
- If no safe route exists, surviving agents become trapped and retry when cooled ground becomes walkable. Lost agents remain lost.
- Only ignition/reset controls and basic agent counts are required.

## Subsequently approved MVP addition — 2026-10-04

The user approved basic camera navigation (zoom, pan, orbit, reset-view) and a compact visible HTML/CSS panel explaining the controls. This addition supplements the original minimal ignition/reset UI scope above; it does not change simulation behavior or the acceptance scenarios below. The original Assignment 2 submission is not modified.

- Mouse wheel: zoom; right-button drag: pan; middle-button drag: orbit.
- `R`: reset camera position, target, and zoom to the initial view; this is not simulation reset.
- Left-button drag remains unassigned to camera movement.
- Keep the camera above ground, constrain zoom/pan around the scene, and preserve resizing.
- The panel lists all four bindings with readable text and a semantic keyboard key for `R`; panel pointer interactions do not move the camera.
- This camera addition originally left ignition-mode behavior undecided; the Increment 4 clarification below now defines it. MVP ignition count remains one.
- Multiple/configurable ignitions and compass-view presets remain later possibilities, not current tasks.

## Ignition interaction clarification — Increment 4

- Explicit **Place ignition** toggle: while on, the scene cursor is a crosshair and a stationary unmodified left mouse click selects one eligible unburned fuel cell. Another valid selection moves the marker before starting; invalid/nonburnable selections leave it unchanged. Mode off means no placement.
- **Start fire** requires a valid selection, exits placement mode, and locks further placement until **Reset simulation**. One ignition per run remains the MVP scope.
- Existing wheel zoom, right-drag pan, middle-drag orbit, and camera-only `R` remain available during placement and fire. Camera gestures and panel interactions must not place ignition. Picking resolves the logical ground grid beneath decorative geometry.
- **Reset simulation** restores initial fuel, states, timers, and ignition selection, turns placement off, and permits a new run while preserving the current camera view and authoritative map data.
- Increment 4 implemented only the selected cell's burning, burnout, and cooling. Increment 5 adds deterministic four-edge-neighbor exposure spread: accumulate exposure per burning neighbor, ignite at threshold, and clear incomplete exposure when no burning neighbors remain. Evaluate from a step-start snapshot and apply ignitions together; no diagonal spread, nonfuel jumps, or reignition. Keep one user ignition per run. Agents remain unimplemented; existing MVP acceptance scenarios and performance target are unchanged. These are illustrative rules, not calibrated wildfire physics.

## Approved environment correction and nearby-fire safety — 2026-10-07

The artificial fuel strips across roads were a test-layout shortcut, not the intended environment. Bare roads must be continuous, fuel-free and nonignitable. Grass, brush and forest each have a distinct representative fuel classification per cell, independent of base walkability; no layered vegetation simulation. Ground treatment shows fuel coverage, including forest-floor vegetation between trees. Brush uses shrub geometry, not trees. Models on roads must not suggest fuel where none exists.

The user approved two short local one-cell-wide passages, because the specified one-cell safety buffer cannot close the previous four-cell-wide roads. Keep both routes, start/safe endpoints, initial connectivity and blocked off-path terrain. Connected vegetation beside these passages supports single-ignition route-hazard scenarios; roads never transmit fire.

- Burning and burned-hot cells are unsafe themselves. Only burning cells additionally make the eight immediately surrounding cells unsafe (one logical cell, including diagonals).
- A cell is usable only if its base map cell is walkable and the derived hazard mask is clear there. Overlapping buffers persist while any relevant source burns. Hot cells project no buffer; cooling never makes blocked ground walkable. A cooled cell can still be unsafe beside another burning source.
- Navigation hazards are calculated separately from four-edge-neighbor exposure spread. Buffers do not add fuel, ignite roads, transmit fire, or imply agent death. No visible overlay, warning popup, debug toggle, additional UI, agents or A* in this correction.
- Illustrative fuel amounts: grass 4, brush 6, forest 10; consume 1 unit per simulated second, giving 4/6/10 seconds burning plus 5 seconds cooling. Existing exposure rate 1 per burning neighbor per second and threshold 1 remain equal across fuel types. More fuel only lengthens burning; these are not calibrated physical measurements.
- Reset restores fuel, fire/exposure/timers and clears derived hazards by recomputation from reset states, without moving the camera. R remains camera-only. Purple-marker redesign and richer assets/effects remain deferred. Increment 5 is closed out with the specific user checks recorded in progress; invisible hazard/connectivity checks were automated. Full MVP performance and loss scenarios remain unverified.

## Increment 6 — approved basic evacuation implementation

Twenty visible agents wait in the existing starting area, evacuating automatically when Start fire is pressed. Use deterministic four-neighbor Manhattan A*, base walkability and the existing navigation hazard mask, with simulation-time movement and explicit handling of hazards appearing during a segment. An already-buffered occupant may attempt an emergency exit toward safe ground; this does not permit normal paths through buffers or imply death. Keep states waiting, evacuating, trapped (retry on hazard changes), and evacuated (terminal until reset), with live counts totaling 20. Reset restores agent/fire state and preserves the camera; R remains camera-only. No map/fire-timing changes, crowd avoidance, off-path escape, assets or dependencies for this increment. Increment 6 user-reported manual validation is complete; Increment 7 below defines the subsequent loss rule. Full MVP performance measurement remains pending.

## Increment 7 — approved direct-active-fire loss rule

A non-evacuated, non-lost agent becomes lost when its occupied logical cell is actively burning, after fire/hazard updates and before agent movement. Occupancy remains the cell containing the continuous rendered position (`floor(z) * width + floor(x)`), including during segments between centers. Buffers/nearby fire, burned-hot ground and trapping alone do not cause loss. No health, accumulated damage, mortality timer or randomness. Lost agents stop and release navigation state; lost and evacuated are terminal until reset. Five live counts (waiting, evacuating, trapped, evacuated, lost) total the initial population; reset restores state, appearance, counts and fire without moving the camera. Navigation exclusions, fire parameters and map remain unchanged. Current nonfuel roads may produce zero ordinary-run losses; verify direct loss with controlled fuel-bearing-cell fixtures, not altered roads or hidden damage.

Planned follow-up, not this increment: explore a dedicated simulation viewport and surrounding controls/statistics on a future `feature/dashboard-layout` branch, retaining the current layout for comparison; follow with coordinated pacing tuning and performance validation. No branch creation, dashboard redesign or pacing changes are authorized for Increment 7.

## Increment 8 — approved dashboard layout exploration

Explore a restrained dark HTML/CSS dashboard on `feature/dashboard-layout` from validated checkpoint `0e42f8c`, preserving `main` for comparison in the same project folder. A dedicated simulation viewport stays the focus, with existing ignition/reset/status, five counts, concise legends and camera hints around it. Narrow screens stack panels and allow page scrolling. Renderer/camera sizing follows the viewport container; picking must remain accurate with offsets and scrolling. Preserve all simulation/map/fuel/timing/agent/hazard/loss rules, single ignition, camera bindings, shortcut guards and reset semantics. No new dependencies/assets, inactive controls, marker redesign, merge or deployment. This approved presentation exploration does not redefine the MVP or acceptance scenarios. Coordinated pacing and performance validation remain subsequent work.

Approved Increment 8 shortcut: I toggles the same ignition-placement action as the button, with a visible key hint; never selects a cell or starts fire. Respect disabled/run-lock state and ignore held repeats, editable-field typing and Ctrl/Alt/Meta combinations. Camera bindings and simulation semantics remain unchanged.

## Core technical challenge

Keep navigation synchronized with changing fire hazards.

## Acceptance scenarios

- Fire closes the preferred route; agents use the alternative.
- Both routes become blocked; surviving agents become trapped and can retry after cooling.
- Agents avoid burning/hot ground.
- State counts always sum to the initial population.
- Reset reproduces the initial scenario.

## Performance target — local automated measurements recorded

At least 30 FPS at 1280x720 with 20 agents and an initial 64x64 fire grid.
Measure a repeatable 60-second scenario after loading; record the test computer's CPU, GPU, RAM, and browser version. Two completed local automated production measurements are recorded in docs/performance.md. The requested baseline uses a 1280×720 browser viewport; the smaller embedded canvas and buffer dimensions are reported explicitly. Results apply to that local setup; full-canvas, other-hardware and physical-browser validation are not inferred. Optional manual benchmark reproduction was not performed. User-reported functional validation is recorded separately in progress. The original target and acceptance scenarios remain unchanged.

## Broader semester scope — excluded from this MVP

Seeded procedural terrain/vegetation; buildings and reachable safe zones; water/bridges; generation controls; simplified wind, humidity, temperature and slope effects; comparison of Path-first and Flexible movement.
Potential later features include watchtower alerts and burning bridges. These are not tasks to implement now.

## Implementation direction

- Custom JavaScript fire grid, A* navigation, and an agent state machine.
- JavaScript, Three.js, Vite/npm, HTML/CSS.
- `simplex-noise` and `alea` are planned for later procedural generation.
- Use simple or licensed assets; Blender can support asset editing.
- AI supports coding and concept/asset exploration. Optional generated meshes are not a dependency. No runtime ML or LLM API is planned.
- The separate exploratory hosted demo is not the authoritative MVP or an approved code baseline; reuse requires review.

## Assignment 3 deliverables

- Running MVP/live web URL.
- Public GitHub source repository with README build instructions.
- 2–3 minute video with walkthrough and performance stress test.
- 1–2 page PDF report: plan versus reality, AI utility, roadmap to final.

These are future deliverables. Publishing, pushing, and deployment require explicit instruction.

## Subsequently approved forest UI presentation increment

Adopt the validated dashboard while retaining annotated comparison snapshots. Preserve layout and simulation scope. Apply forest framing, parchment panels, moss stepped/raised buttons and warm accents using existing HTML/CSS and original SVG. Placement/I enables orange contained border flames; off clears them; Start fire locks the button as "Ignition locked" with decoration retained until reset. This is ignition-usage feedback, independent of actual fire status. Reduced motion uses static flames. Native torch/blocked cursor variants use existing picking/eligibility and clear outside placement/canvas or during camera gestures. Keyboard guards, separate Start fire, camera controls and reset semantics remain unchanged. Terrain thickness and scene readability are future work; no map, pacing, fire, agent, dependency or acceptance-scenario changes.

## Subsequently approved coordinated pacing increment

Adopt the validated forest UI on main and tune on feature/simulation-pacing. Coordinate spread delay, burn duration, cooling and agent speed for a more readable demonstration, roughly 60–90 active-tab seconds as a usability goal. Preserve central (32,32) reroute/trap/recovery and verify the alternative (32,25) scenario from measurements. Keep deterministic spread, shared 50 ms fixed steps, 250 ms frame cap, authored map, hazards, direct-active-fire loss, styling and dependencies unchanged. Retained defaults: exposure rate 1 unit per burning neighbor per second, threshold 2 units; fuel 4/6/10 at consumption 1/3 unit/s gives grass/brush/forest burns of 12/18/30 s; cooling 8 s; agents 1.5 cells/s. These illustrative settings supersede earlier demonstration timing values, not simulation rules or acceptance scenarios. The user found the checklist satisfactory and movement not objectionably slow, and requested retaining these defaults. No additional manual checks are inferred; this is not calibrated physics or a full performance measurement.

## Subsequently approved scene-readability increment

Adopt validated pacing on main at fe9329a, then work on feature/scene-readability. Reduce and recolor START/SAFE/route labels; replace the purple ring with a compact amber ground cell outline; use low orange/yellow flames, flat hot embers and cool ash with vegetation charring/burnout; add a shallow boundary-aligned visual soil/rock base below unchanged ground. Preserve all logical map data, timing, agents/hazards/loss, camera, dashboard, ignition workflow, dependencies and reset semantics. Rendering animation is deterministic and separate from simulation, with static reduced-motion treatment. Ground-only picking excludes decorations/base. Button-flame animation remains deferred. This is presentation work, not a redefinition of MVP acceptance scenarios or a performance result.

## Assignment 4 — approved map foundation (2026-10-22)

On feature/procedural-foundation from deployed 27893e2, define a shared plain-data map contract and clean replacement lifecycle. Preserve createFixedMap(), all cells/connectivity/fuel/walkability, original 20-agent spawns, fire/agent timing, hazards/loss and fixed benchmark scenarios. An adapter supplies explicit spawn cells and presentation metadata. Derive labels, decoration bounds and camera framing from map metadata/actual relevant cells; a vegetation rectangle is not required. Replacement disposes prior rendering/UI/FPS/resize/camera bindings and resources before constructing a new session. Reset still replays the current map while preserving the camera; R remains camera-only.

A second small synthetic map with different dimensions/endpoints/spawns and repeated-replacement checks are verification fixtures, not new user-facing controls. This supersedes old fixed-coordinate rendering assumptions, not the simulation rules or historical acceptance scenarios. No generation, elevation, new screens/controls/dependencies, pacing changes or theme redesign in this increment. Five technical pillars and three interaction stages remain distinct. Future generation parameters, seed policy and map-quality guarantees still require separate agreement; named procedural libraries remain uninstalled plans.

Foundation follow-up: retain the direct-active-fire-only loss rule; navigation safety buffers remain nonlethal. Road widths for generated maps are undecided. A rendering-only distant-ground correction and drag ownership/cancellation checks do not approve generation or change fixed-map/simulation scope.

## Assignment 4 — approved first seeded environment (2026-10-22)

Adopt the validated foundation on main at 6e39804 and work uncommitted on feature/seeded-environment. Flat 64×64, cellSize 0.5, 20 agents, one seed-varying origin and one safe destination; decimal seed input and Generate with fixed density defaults. Alea and simplex-noise are the only approved added dependencies. One coordinator combines independent seeded endpoint/path/vegetation/rock streams, constructs connectivity deliberately and validates before replacement with bounded deterministic retries. Preserve the original fixed fixture, timings and benchmark entry point.

Initial path-width decision: a consistent three-cell swept band, including bends, with optional branches/junctions/loops; no mandatory two-route rectangle, maze, artificial pinches or fuel-bearing roads. Endpoint clearings are 7×7 with 20 distinct spawn cells and separated endpoints. Every spawn initially reaches safety through paths/endpoints. Grass and clearings may be physically walkable; dense brush/forest and rocks are blocked. A separate Path-first navigation mask constrains A* and emergency buffer exits to the network/endpoints without falsifying physical walkability. Flexible movement is deferred. Existing fixed data/policies remain unchanged.

Record seed/settings/version forest-paths-v1. Accept decimal integers 0–4294967295, trim whitespace and canonicalize leading zeros; reject invalid/overflow inputs without substituting another seed. Show active seed/version separately. Generate restores setup; reset replays the installed map and preserves camera. Disable generation during a started run until reset, including after completion. Failure retains the usable map; validate complete logical data before retirement and recover the previous map on renderer-construction failure when possible. Use existing theme/models/depth correction/drag guards with derived metadata, never invented Route A/B identities. No generation FPS claim from old fixed-map captures.

Keep fire exposure/fuel/burn/cooling, fixed steps, agent speed, hazards and direct-active-fire-only loss unchanged. Buffers stay nonlethal. Three-cell paths retain protected centerlines with the existing buffer, so generated maps need not exhibit full closures, rerouting/trapping or losses; fixed authored acceptance scenarios remain intact. No elevation, water/bridges, weather, multi-endpoint UI, density slider, new movement algorithm, start/results screens or asset redesign in this increment.

Future direction remains multiple origins up to 4 and safe zones up to 3; minimum counts and destination-choice rules are undecided. Sen's algorithm-comparison suggestion remains later exploration. These are not current implementation tasks. Generator details/check evidence and pending human validation: docs/seeded-environment.md and progress.

## 2026-10-24 — Seeded alpha trail/ground correction (supersedes initial width decision)

The user requested one-cell-wide fuel-free trails for this alpha, replacing the initial three-cell sweep above. Keep clean edge-connected bends/junctions and seed-varying winding routes, branches and optional loops; do not force a rectangle, two alternatives, trapping or casualties. Remove redundant raster overlaps without disconnecting the network. Compact genuine junction footprints may remain; broad cleared bands must not.

Use a minimal 5×4 origin footprint for the same 20 distinct spawns and verify each initial path; show only a compact blue origin indicator. Safety is one green destination cell with unchanged destination semantics. Bare trails use muted earth-brown, nonfuel clearings neutral gray and ignitable grass green. Physical walkability remains separate from Path-first policy. Vegetation noise/appearance, fire/agent timings, nonlethal navigation buffers and direct-active-fire-only loss remain unchanged.

Current identity is forest-trails-v2; record forest-paths-v1 as its stable random-stream namespace to retain established endpoint/vegetation choices. Adjacent burning vegetation may now close a one-cell trail under the existing mask; verify an example without guaranteeing any outcome for every seed. Fixed authored layout and timing fixtures remain unchanged. Seeded increment remains unaccepted pending this correction's human recheck; preserve earlier feedback accurately. Vite advisory stays a separate focused assessment, with no dependency upgrade here.

## 2026-10-24 — Seeded design refinement (supersedes gray clearing palette and v2 connection rules)

User confirms the three prior targeted rechecks passed; record these as user-reported functional validation, not final acceptance of the evolving design. Change only clearing color to muted sandy beige, distinct from earth-brown trails and green ignitable grass, with matching legend. Keep its existing nonfuel/physical-walkability/Path-first classifications.

Review optional path connections generally: avoid unnecessary long detours and sustained closely parallel routes. Use local adjacent waypoint attachments and quality checks rather than special-casing seed 2026, banning loops or adding endpoints. Preserve winding/seed variation and initial reachability. Current logical version is forest-trails-v3 with the existing forest-paths-v1 random-stream namespace, preserving vegetation generation where practical. Keep one-cell trails, 20 agents, one origin/safety, all fixed-map fixtures and simulation timings/rules. New design feedback is pending; no push/deployment or dependency upgrade.

## 2026-10-24 - Approved network-first forest trails (supersedes corridor-first v1-v3)

Within the same uncommitted seeded increment, replace the START-to-SAFE-first spine with a connected branching network of 6-9 seeded, well-spaced ordinary forest nodes. Use nearby tree connections, occasional useful loop connections, then attach START and SAFE. Additional nodes are ordinary trail locations/junctions, never extra spawns or safe destinations. Keep winding one-cell trails and compact junctions, without large node clearings, forced rectangles/loops, repetitive branch counts, excessive detours or sustained close-parallel trails. Initial settings are documented tuning choices pending human design feedback.

Keep one origin, one safe destination, 20 distinct spawns, initial reachability, existing ground palette, vegetation noise and independent random streams. Carve only trails/endpoints. Path-only candidate retries must leave endpoint and underlying vegetation/rock patterns fixed. Record new identity forest-network-v4 and remeasure examples rather than assuming old closures survive. Preserve the fixed authored map and exact timing fixtures, all simulation rules/timings, controls/reset behavior and dependency versions. Earlier user manual passes remain historical functional feedback, not acceptance of this network design.

V4 validation follow-up: the user reports all three manual checklist items passed and accepts the path-network appearance. Two START connections, if later approved, mean two distinct trails from the same existing START area, not extra origins. Second-trail geometry and a local fire-awareness policy remain investigation/proposals only; current global hazard knowledge, navigation, loss and simulation rules are unchanged.

## 2026-10-25 - Approved Local Awareness increment

Checkpoint the validated forest-network-v4 generator (all three user-reported manual items passed; appearance accepted; Global waiting expected, not a generator failure) as 1949f12, then work uncommitted on feature/local-awareness. Preserve Global Awareness as the baseline. Ordinary generated-map pages default to Local, with a compact setup Global/Local selector locked after Start fire until reset. Fixed-map sessions and benchmark entry points explicitly force Global; historical benchmark results are Global measurements.

Local agents know static terrain/routes and SAFE. Each agent separately observes cell-center hazards within a configurable four-logical-cell Euclidean radius from its continuous position; this is illustrative, not calibrated vision. No line-of-sight, shared knowledge or new pathfinding algorithm. A* still respects Path-first policy but uses observed hazards, treating unobserved hazards optimistically. Refresh observations every step; remember blocked cells outside the radius until re-observed safe. This **conservative memory has no expiry or remote cooling updates**, superseding the earlier provisional expiry suggestion. It can leave an agent waiting even after a distant physical route clears.

Replan on relevant knowledge changes or an unexpected blocked next step, not every frame. Actual hazards independently prohibit normal unsafe entry, including mid-segment; preserve direct-active-fire loss before movement and the existing already-buffered escape exception (buffer-only traversal, never burning/hot/off-policy cells). Trapped agents keep observing; lost/evacuated stay terminal. Reset clears knowledge/paths/positions/fire and unlocks setup while preserving camera and selected model; changing model in setup preserves map, seed, camera and ignition marker. No fire, hazard-radius, fuel, speed, generation, dependency or additional-START-trail changes.

Compare both models on identical v4 seeds/ignitions with bounded traces, and report unfinished conservative-memory outcomes without claiming Local is faster or always succeeds. Keep the five technical pillars separate from the three interaction stages; agents remain a state machine. Human Local Awareness validation remains pending.

## 2026-10-25 - Approved cautious Local retry (supersedes indefinite planning blockage)

Preserve raw per-agent hazard records, but after five continuous simulated seconds trapped allow cautious reconsideration no more often than every five simulated seconds. Only remembered hazards outside the current sensing radius and last observed at least ten simulated seconds ago may become uncertain/traversable for planning. Repeated observations refresh the last-observed timestamp even if still blocked. Current sensed hazards cannot be demoted; approaching agents re-observe and actual unsafe entry remains prohibited, with the existing already-buffered escape exception/direct-active-fire loss unchanged.

Use simulation time only. Effective planning masks must consistently retain uncertainty during replanning/path validity/movement until new observation revokes it; do not immediately invalidate the retry using the same stale raw memory. Do not repeatedly run identical A* on unchanged failed knowledge. Reset clears timestamps, uncertain beliefs, retry timers/counters and navigation state. Preserve four-cell boundary fix, Global behavior, generator/layout/version, speed/fire/hazard/fuel/loss rules. No remote cooling knowledge, guaranteed evacuation, new exit or new feature is approved. Human retry-policy validation remains pending.

Local closeout validation: the user reports retreat, reassessment and successful evacuation; reset restored 20 waiting agents, preserved camera/awareness choice and unlocked selectors. Optional scenario and exact-timing checks are not inferred. The requested Local Awareness checkpoint does not authorize merging, publishing or another increment.
