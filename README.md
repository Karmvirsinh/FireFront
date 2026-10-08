# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increment 5 is checkpointed at `37adf4c`: nonburnable roads, distinct vegetation and nearby-fire navigation hazards. Final user-reported checks confirmed road rejection, vegetation eligibility, reset restoration and physical pan/orbit; invisible connectivity checks were automated. The layout is accepted for functional development, with visual refinements deferred. Increment 6 adds 20 basic evacuation agents and A* navigation, **completed with user-reported manual validation**. Increment 7 adds direct-active-fire loss handling, completed with user-reported manual validation; direct loss is verified through automated fixtures, not a visible browser loss demonstration. Off-path escape, crowd avoidance, weather and procedural generation are not implemented. Full MVP performance is unmeasured.

The intended stack is JavaScript, Three.js, Vite/npm, and HTML/CSS. FireFront is not a validated wildfire prediction tool.

## Dashboard exploration — Increment 8 (user-validated)

Work is on `feature/dashboard-layout`, created from the clean, validated Increment 7 checkpoint `0e42f8c`. `main` remains at that checkpoint with the original overlay layout for comparison. Increment 8 is completed with user-reported manual validation on this branch; no merge, push or deployment.

The dark HTML/CSS workspace puts one dedicated simulation viewport beside a scrollable panel for ignition/reset, selection status, five evacuation counts and map/fire legends. Compact camera hints sit below the canvas. At widths up to 800 px the panel stacks below a usable viewport and the page scrolls. Short desktop windows also allow page scrolling instead of shrinking the scene indefinitely. Fonts use the local system stack; no frameworks, assets or dependencies added. The scene background/assets, purple marker, map, fire/agent rules and pacing are unchanged.

`src/rendering/createViewportResize.js` observes the viewport container with `ResizeObserver`, updating renderer dimensions, camera projection and responsive reset framing even when panel layout changes without a window resize. A window listener retains pixel-ratio updates, capped at 2. Cleanup disconnects both. The absolutely sized canvas cannot resize its parent through its drawing buffer. Picking continues using the canvas's current bounding rectangle in client coordinates, so page offsets and scrolling do not change cell alignment. Controls/legends live outside the canvas and cannot initiate scene pointer gestures. Existing keyboard guards remain; R is camera-only and simulation reset preserves the camera.

Press **I** to toggle ignition placement through the same action as **Place ignition**; the button shows an I key hint using the existing R style. This shortcut never selects a cell or starts fire and remains locked while the button is disabled/after ignition. Held-key repeats, typing in inputs/editable elements, Ctrl/Alt/Meta combinations, composition and already-handled events are ignored. Reset re-enables placement. The shortcut listener is removed during cleanup.

The user reported all four Increment 8 manual checklist items passed: dashboard sizing/scrolling/selection alignment; I/button toggling and keyboard guards without automatic selection/start; shortcut lock during a run and re-enablement after reset; physical pan/orbit, zoom, camera-only R, evacuation/reset and console in development and preview. These user reports are separate from automated checks.

Repeat-check checklist:

1. At desktop, narrow and short sizes, identify START/SAFE, both routes, vegetation and all controls/counts/legends. Scroll the panel/page; ensure the viewport stays usable and proportions remain correct.
2. Toggle placement with I and the button; hold I to confirm no repeated toggles. Check modifier/typing guards where applicable. Confirm the shortcut alone neither selects nor starts fire. Click visible vegetation, and confirm marker/status alignment after resizing and page scrolling. Yellow road must reject ignition without moving the marker. Clicking/scrolling/dragging on panels must not select cells or move the camera.
3. After Start fire, confirm I cannot re-enable placement; after reset, confirm it works again. Check physical right-drag pan, middle-drag orbit, wheel zoom and R. Run the usual (32,32) scenario; confirm evacuation/fire/counts, camera-only R, and reset during/after a run with camera preservation.
4. Repeat on rebuilt production preview and inspect the console. Direct-fire loss remains fixture-verified, not visibly demonstrated on nonburnable roads. Full MVP performance remains unmeasured.

### Compare layouts safely after Increment 8 is committed

Do not switch branches with uncommitted changes. With the validated Increment 8 checkpoint saved, stop the project servers, confirm `git status --short` is empty, and use `git switch main` to inspect the preserved overlay layout. Start development normally. To return, stop that server and use `git switch feature/dashboard-layout`, again only with a clean working tree. Rebuild with `npm.cmd run build` on each branch before starting production preview: ignored `dist/` output is not changed by switching Git branches. Do not merge or discard files to compare layouts. Both layouts use this same project folder and dependencies.

Pacing tuning and performance validation follow this layout exploration; no tuning is included here. Purple-marker redesign, richer assets/effects and abrupt road-width presentation remain deferred. Actual automated/browser results are recorded in `docs/progress.md`; Increment 8 manual checklist completion is user-reported. Full MVP performance remains unmeasured.

## Local development

Use a modern browser with WebGL2 support and Node.js compatible with Vite: `^20.19.0 || >=22.12.0`. This increment was checked with the regular Windows Node.js v24.21.0 and npm 11.19.0. Direct dependencies are pinned to Three.js 0.186.1 and Vite 8.3.2.

From the FireFront folder, install the versions recorded in `package-lock.json`:

```powershell
npm ci
```

Start the development server:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open <http://127.0.0.1:5173/>. Stop the server with Ctrl+C.

Build and preview the production output:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open <http://127.0.0.1:4173/>. Preview serves the existing `dist/` build; rebuild after source changes. The servers bind only to this computer. If a requested port is busy, stop the existing server or choose another port. `node_modules/` and `dist/` are ignored by Git; both package manifests remain trackable.

In PowerShell, `npm.cmd` can replace `npm` if script execution policy blocks the npm PowerShell launcher. Open a fresh terminal after PATH changes; restart Codex if its inherited environment is stale.

## How the scene works

- `src/main.js` initializes the map, shared evacuation simulation, UI, and renderer. Vite hot replacement disposes the previous scene and UI listeners.
- The **scene** contains the instanced map meshes, text markers, background, and lights. Built-in geometries require no external assets.
- The **camera** defines the viewing position and perspective. On viewport-container resize, its aspect ratio and projection matrix are updated to keep objects proportional.
- The **renderer** draws the camera's view of the scene into the HTML canvas. Its drawing buffer follows the canvas size and uses at most 2 pixels per CSS pixel in each dimension.
- The **animation loop** requests repeated renders through Three.js and passes its timestamp to the application. A shared 50 ms clock updates fire, derives hazards, then checks direct-fire loss before agent decisions/movement and rendering. Both fire and movement drop excess elapsed time beyond the existing 250 ms frame cap. Cleanup stops the loop and releases geometry, material, and renderer resources.
- `src/rendering/createCameraControls.js` uses OrbitControls from the installed Three.js package. It updates before drawing and removes its pointer, context-menu, and reset-key listeners during cleanup.

## Fixed map data and layout

`src/world/createFixedMap.js` creates a fresh deterministic 64×64 logical grid. Each cell is a plain object with separate `terrain`, `fuelType`, and `walkable` fields; no cell holds a Three.js object. `src/rendering/createMapView.js` uses shared instanced batches for ground, shrubs, grass, tree trunks/crowns, rocks, and fire indicators, plus four text sprites. It does not decide connectivity or modify the grid. Cell size is 0.5 world units, so the flat map spans 32×32 units and is centered at the origin.

Grid coordinates are zero-based `(x, z)`; Z increases toward the lower corridor in the initial view. Rectangle bounds below are inclusive:

| Area | Grid coordinates | Meaning |
| --- | --- | --- |
| Start | `(9, 32)`; area X 6–13, Z 28–35 | Blue, walkable, no fuel |
| Safe zone | `(54, 32)`; area X 50–57, Z 28–35 | Teal, walkable, no fuel |
| Route A | X 10–53, Z 22–25 | Upper corridor; fuel-free yellow road with local narrow passage |
| Route B | X 10–53, Z 42–45 | Lower corridor; fuel-free yellow road with local narrow passage |
| Connecting stems | X 10–13 and 50–53, Z 22–45 | Join both corridors to endpoints |
| Connected vegetation | X 27–36, Z 26–41; extensions X 30–33 at Z 25 / 42 | Grass rim, brush and forest interior; blocked off-path ground |
| Brush | X 27–30, Z 28–39 | Medium-green ground with low shrubs |
| Forest | X 31–36, Z 28–39 | Dark-green forest floor with trunks and tree crowns |
| Route A test passage | X 30–33, Z 24 | One-cell-wide bare road; grass beside it at Z 25 |
| Route B test passage | X 30–33, Z 43 | One-cell-wide bare road; grass beside it at Z 42 |

The earlier artificial grass strips across roads were a test shortcut and have been removed. Every road cell is fuel-free and nonignitable, with no decorative vegetation on roads. Only corridors and endpoint areas are walkable; all off-path vegetation/gray ground is blocked. The user approved short one-cell-wide passages: a one-cell buffer cannot close a four-cell-wide road. At X 30–33, A's Z 22–23 and B's Z 44–45 are blocked nonfuel shoulders; A's Z 25 and B's Z 42 are blocked grass beside the road. Both routes remain connected initially, without an off-path shortcut.

Light-green ground is grass, medium-green is brush with low polyhedral shrubs, and dark-green is forest-floor fuel with trunk/cone tree models. One representative fuel type per cell avoids layered simulation. Ground between sparse models remains fuel where classified as vegetation; bare road gaps stay nonfuel. Ground treatment follows `fuelType` independently of base walkability. Tests also cover hypothetical walkable fuel cells, although this authored map confines navigation to fuel-free roads/endpoints.

`src/world/isConnected.js` is a four-neighbor BFS validation helper, not agent pathfinding. It accepts an optional unsafe mask while always requiring base walkability. Temporary route-cut copies verify each alternative and absence of shortcuts. Neither diagonal movement nor physical collision is implemented.

## Nearby-fire navigation safety

`src/simulation/getNavigationHazards.js` derives an invisible unsafe mask from current fire states. Burning and burned-hot cells are unsafe themselves. Every burning cell also marks exactly its eight immediately surrounding cells unsafe, including diagonals (one logical cell / 0.5 world units). Burned-hot cells project no buffer. A cell is usable only when its base map cell is walkable and its hazard-mask entry is clear. A cooled cell can still be unsafe beside another burning source, and blocked ground stays blocked after all fire clears.

Recomputing the mask keeps overlapping sources effective until all clear and prevents stale hazards after reset. This calculation never changes fuel or states: nonburning roads can be unsafe but cannot ignite or transmit fire. There is no visible hazard overlay. Agents now use the mask for navigation, with a limited emergency exit for an already-buffered occupant as described below. A precautionary buffer does not define death or loss behavior.

## Camera navigation

Use these bindings over the scene; the compact “Camera controls” panel lists them:

| Action | Binding |
| --- | --- |
| Zoom | Mouse wheel |
| Pan | Right-button drag |
| Orbit | Middle-button drag |
| Reset view | `R` key |

Left-button drag is unassigned to camera movement. Right-click context menus are suppressed over the canvas. Pointer interactions starting over the panel do not control the camera. `R` restores only the camera position, target, and zoom; it does not reset any simulation. The shortcut is ignored while typing in editable fields, composing text, or using Ctrl/Alt/Meta shortcuts.

Orbit angles remain limited to 15–75 degrees from vertical. For the 32×32 map, minimum camera-to-target distance is 16 units and target X/Z are limited to ±8, with Y kept at zero. Maximum distance remains 1.5 times the full-map fitted distance. Initial/reset framing instead fits the useful start/safe/routes/vegetation area with margins (29×16 world units, centered at X 0 / Z 1) to both viewport axes, including narrow windows. Resize updates the saved reset view; a camera still at its initial view refits automatically, while a navigated view is retained subject to movement limits. `R` returns to the same framing as initial load for the current window. When clamping the target, the camera receives the same correction to preserve viewing direction and distance. All camera controls stay available during ignition placement and burning; those gestures never select ignition cells.

## Ignition, neighboring spread, and lifecycle

Toggle **Place ignition** on with its button or **I** for a crosshair cursor. An unmodified stationary left mouse click on grass, brush or forest ground selects one fuel cell, shown with a purple ring. Clicking another eligible cell moves that ring before starting. Fuel-free roads/ground are rejected without changing the cell or existing selection. Turning placement off retains the selection but disables picking. Panel interactions and left drags do not place ignition.

**Start fire** is enabled only after a valid selection. It ignites that cell, turns placement off, and locks selection until **Reset simulation**. Orange indicates burning, red burned-hot, and dark gray burned-cool; raised indicators and recolored ground distinguish every affected cell. Exhausted decorative fuel is hidden and restored on reset. The status text describes the original selected cell; neighbors can still burn after that cell has cooled.

Each unburned fuel cell accumulates exposure from its four edge-sharing burning neighbors: 1 exposure unit per neighbor per simulated second, with ignition at 1 unit. One burning neighbor takes 1 second; two take 0.5 seconds. Exposure returns to zero when no burning neighbor remains. Only burning cells contribute; hot/cooled cells do not. There is no diagonal spread or jumping across nonfuel gaps. Fuel quantity controls burn duration, independently of ignition delay and base walkability; blocked or walkable fuel can burn. The eight-neighbor navigation buffer does not change this four-neighbor spread rule.

Every fixed step snapshots the burning sources, evaluates targets, and applies new ignitions together. A newly ignited cell contributes only in the next step and retains full fuel until then; a source burning at the start of a step contributes even if it burns out during that step. This avoids iteration-order effects and same-step cascades. This simplified deterministic four-neighbor rule is **not calibrated wildfire physics**; wind, moisture, slope and stochastic behavior are absent.

`src/simulation/createFireSimulation.js` owns plain fire-state copies independent of Three.js and DOM. The lifecycle is `unburned → burning → burned-hot → burned-cool`. Burning/hot cells are directly hazardous; cooling clears their own hazard but not another cell's buffer. Original base walkability is preserved. Exhausted fuel cannot reignite. The single-run ignition lock also remains in force after cooling.

Demonstration configuration lives in `src/simulation/fireConfig.js`: grass starts with 4 fuel units, brush with 6, and forest with 10, consumed at 1 unit per simulated second. They burn for 4, 6 and 10 seconds respectively, followed by 5 seconds cooling. Forest has more fuel to keep it burning longer; ignition exposure is unchanged. These are illustrative values, **not calibrated wildfire physics**. A 50 ms fixed-step accumulator produces the same results at ordinary frame rates; each frame contributes at most 250 ms. Excess time from long frame gaps/background suspension is discarded, so resuming cannot skip the whole lifecycle in one catch-up jump. Simulation time may consequently lag wall time after suspension.

**Reset simulation** restores initial fuel, unburned states, exposure, timers, and selection, turns placement off, and allows a repeatable new run. Derived navigation hazards clear because no reset cell is burning/hot. It preserves the current camera. `R` resets only the camera. Neither operation changes the authoritative map. `src/rendering/createGroundPicker.js` raycasts from current pointer/camera coordinates onto the ground plane and resolves grid coordinates; vegetation and text sprites cannot intercept picking. Rendering updates affected tile/decoration instances and one shared fire-indicator batch on state changes, with partial instance-buffer updates rather than rebuilding the map each frame.

Suggested demonstration: select forest cell **(32, 32)**. Automated BFS verifies A is unavailable and B reachable at **7.5 simulated seconds**, with road cells X 30–33 / Z 24 unsafe. At **10.5 seconds**, both passages (X 30–33 at Z 24 and Z 43) are unsafe and safety is unreachable. Both routes are reachable again by 45 seconds with every hazard cleared. This uses one ignition and the approved local narrow passages; all road cells remain unburned with zero fuel/exposure. The buffer is invisible, so these are test results, not visible road-color changes or agent rerouting. Background suspension can extend wall-clock times. A second optional ignition **(32,25)** makes A's full designated passage unsafe at about 1 second while B remains reachable; reset before changing ignition.

Run navigation, map, fire lifecycle, and interaction checks with no additional test dependency:

```powershell
npm test
```

## Basic evacuation agents — Increment 6

Twenty boxes spawn in the existing blue starting area (X 7–11, Z 30–33), waiting until **Start fire** automatically begins evacuation. `src/agents/` owns plain state/navigation with no Three.js or DOM dependency. `findPath.js` uses four-neighbor A* with Manhattan distance and deterministic f-score, heuristic, then cell-index tie-breaking. Normal paths require base walkability and a clear hazard mask at every cell. No diagonal corners, off-path movement, collisions or crowd avoidance; agents may overlap as paths merge.

`agentConfig.js` sets an illustrative speed of **2 logical cells per simulated second**, or **1 world unit/second**. Continuous X/Z positions move along axis-aligned cell-center segments in fixed steps; logical occupancy is the cell containing the actual position, and rendering reads those same coordinates. START/SAFE text is positioned just below its area so it does not cover the boxes. Box colors are white waiting, blue evacuating, brown trapped, teal evacuated and crimson lost; the labeled live counts are authoritative and always total 20.

Paths are cached until a relevant hazard invalidates the occupied cell, target or remaining route. Trapped agents retry on hazard changes, not every rendered frame. When a segment becomes invalid, the agent smoothly returns to the center of its **currently occupied cell**, then replans; it does not teleport to an endpoint or enter a newly unsafe next cell. If already inside a precautionary buffer, an emergency BFS can leave through the nearest walkable buffered cells toward safe ground, excluding burning/hot cells. After leaving, normal safe A* resumes. This exception only exits an existing buffer; safe agents cannot use it to enter buffers as shortcuts. An actively burning occupied cell causes immediate terminal loss before movement. A burned-hot occupied cell stops movement as trapped and retries after hazards change without causing loss.

Implemented states: **waiting** before ignition; **evacuating** while following a route or emergency exit; **trapped** when no available route/exit exists; **evacuated** at the safe-zone center and **lost** from active fire in the occupied cell, both terminal until reset. Reset restores all 20 starting positions, waiting states, paths, retry caches, fire and simulation time while preserving the camera. R still resets the camera only.

Actual-fire trace on the unchanged map/config with ignition **(32,32)**: agent 0 initially plans Route A, turns west toward Route B at approximately **7.1 seconds**, all 20 are trapped at **10.0 seconds**, all resume at **11.1 seconds**, and evacuation completes between **36.05 and 39.55 seconds**. These are independent simulation checks, separate from controlled-hazard tests and browser observations. Keep the tab active; background suspension can lengthen wall time. This road-only scenario produces zero losses; no full MVP performance target has been measured.

Increment 6 repeat-check checklist (the user-reported closeout results are recorded below):

1. Confirm 20 white waiting boxes in START and counts 20/0/0/0. Bare road rejects ignition; selecting vegetation alone must not start movement.
2. Ignite `(32,32)`. Watch movement toward A, a turn back toward B around 7 seconds, brief Trapped = 20 around 10–11.1 seconds, then resumed evacuation. By roughly 40 active-tab seconds, Evacuated = 20. Counts must always sum to 20.
3. Reset during movement/trapping and after evacuation: positions, vegetation, marker and counts restore, placement turns off, and camera stays put. Repeat the same ignition; R changes only the camera.
4. Check wheel zoom, physical pan/orbit, UI isolation, wide/narrow and tall/short resizing, production preview and browser console. Agents may overlap. This historical Increment 6 checklist preceded the Increment 7 loss rule below.

Increment 6 user-reported validation passed: 20 waiting agents; ignition at (32,32) produced turn-back, trapping, recovery and evacuation as described; reset during movement and after completion preserved the camera; pan/orbit, zoom, R, resizing and console checks passed. These reports are distinct from automated checks.

Pending pacing issue: the user finds fire progression too fast. After loss handling, perform a focused tuning pass on spread, burn duration, cooling and agent speed together, preserving meaningful rerouting/trapping scenarios. No timing or speed changes were made during closeout.

## Direct-fire loss — Increment 7 (manual checklist passed)

Each fixed step updates fire, derives navigation hazards, then checks nonterminal agents for active fire in their **occupied logical cell before movement**. At Start fire, the immediate ignition receives the same check before any agent can leave. Loss uses only state `burning`: nearby fire/buffers, burned-hot ground and trapping alone never cause loss. No health, exposure/damage timer or random mortality is used. Lost agents stop at their current position, clear paths/targets/retry state and remain lost after cooling. Evacuated agents remain evacuated, even if their cell later burns. Simulation reset restores all agents, appearance, counts and fire while preserving the camera; R stays camera-only.

Occupancy remains `floor(z) * width + floor(x)` for continuous grid coordinates. Cells include their minimum boundary and exclude their maximum boundary. Crossing a boundary changes occupancy before reaching the next cell center; rendering uses the same continuous X/Z position. Loss therefore checks the containing cell, not the last visited center or the target. Normal movement still cannot enter burning/hot/unsafe cells; the existing buffered-occupant escape exception is preserved.

The five live counts always sum to the initial population. Lost boxes are crimson with no effects. Current agents travel on nonfuel roads/endpoints, so ignition (32,32) ordinarily produces 20 evacuated and **Lost = 0**. Loss is verified with controlled tests containing walkable fuel that ignites under an agent, including mid-segment occupancy, simultaneous losses, terminal states and reset/render/count restoration. These fixtures do not modify the displayed map and are not a visible-loss browser demonstration. Run `npm.cmd test` to reproduce them.

The user reported all four Increment 7 manual checklist items passed: initial counts, ordinary evacuation/count conservation, reset/camera preservation, and navigation/R/resizing/console. Direct-fire loss itself remains verified through automated fixtures and was not visibly demonstrated in the browser.

Repeat-check checklist: confirm Waiting = 20 / Lost = 0; ignite (32,32), watch ordinary evacuation and counts totaling 20 with Lost staying zero; reset during movement and after completion, checking restoration and preserved camera; check R, navigation, resizing and console. Observing crimson losses manually is limited by the current nonburnable road layout; no hidden damage or lethal-area expansion was added.

Planned work after loss handling: explore a dedicated simulation viewport with surrounding controls/statistics on a future `feature/dashboard-layout` branch, preserving the current layout for comparison. Follow with coordinated spread/burn/cooling/agent-speed pacing tuning and performance validation, keeping meaningful rerouting/trapping scenarios. No branch, redesign or tuning is included here. Existing purple-marker, richer-assets/effects and road-width presentation feedback remains deferred.

## Earlier manual validation records

The user reported passing these checks on 2026-10-04, including wide/narrow and tall/short resizing, readable labeling, no red console errors, and matching development/production-preview appearance. The checklist remains available for repeat checks:

1. For the original Increment 1 scene, confirm the ground, orange cube, lighting, and label. That demonstration scene has now been replaced by the map.
2. Resize the window wide, narrow, and tall. Confirm the cube keeps its proportions, the canvas fills the window, and the label stays readable.
3. Open browser developer tools and check for console errors.
4. Build and open the production-preview URL; confirm the same scene and resize behavior.

The user reported all four Increment 2 checklist items passed on 2026-10-04, including physical-mouse right-drag panning and middle-drag orbit. Retain these steps for repeat validation:

1. Check wheel zoom, right-drag pan, middle-drag orbit, and inactive left drag. Move repeatedly toward zoom, pan, and vertical-orbit limits; the camera should stay above ground and near the scene.
2. Combine all movements, press `R`, and confirm the original view returns. Check that Ctrl/Alt/Meta+R and typing in an editable field do not trigger the camera shortcut (browser shortcuts may reload the page).
3. Scroll and drag starting on the panel; confirm the camera stays still. Right-drag on the scene should not open a context menu.
4. Resize wide/narrow and tall/short; confirm proportions, readable bindings, and a visible cube. Repeat on production preview and check the console.

Agent browser checks cover wheel zoom and its limits, `R`, inactive left drag, panel wheel isolation, right-click suppression, resizing, and console inspection. Right/middle-button drags are covered by automated tests with DOM event stand-ins; the browser automation only exposes left-button dragging. Physical-mouse pan/orbit validation was subsequently reported as passed by the user.

Automated/agent checks are recorded in [progress](docs/progress.md). The production build succeeds but emits a warning for a JavaScript chunk above 500 kB (about 552 kB minified, 137 kB gzip for Increment 2). The user accepted this as non-blocking for this stage. Keep build warnings visible and do not adjust thresholds or suppress them solely to silence it. Revisit in handoffs only if it materially changes, affects performance/loading, or becomes relevant to release review. No performance target has been measured.

The user reported that the Increment 3 checklist looked acceptable and physical panning worked, with the map understood as an intermediate test layout. Final user feedback confirmed closer useful-area framing, working panning, and working resizing. The following checklist remains available for repeat checks; this final feedback does not claim additional user checks:

1. Identify blue START, teal SAFE, upper Route A, lower Route B, the central vegetation band, and gray blocked areas using the legend. Follow both routes visually from start to safety.
2. Zoom, right-drag pan, middle-drag orbit, and press `R`; confirm the map stays navigable and reset restores a complete overview. Left drag remains inactive.
3. Resize wide/narrow and tall/short, then press `R`. Check map proportions, framing, labels, legend, and camera hints.
4. Repeat on production preview and inspect the console. No fire, ignition controls, or moving agents should appear.

The user reported passing Increment 4 marker movement, invalid-ground rejection, camera/selection interactions, reset/restoration with preserved camera, camera reset, resizing, and no observed errors. The final uninterrupted-run check reached dark gray with `burned-cool` status. The following records the historical Increment 4 checklist; Increment 5 now adds neighboring spread:

1. Toggle placement on/off; check crosshair, one movable ring, invalid-cell rejection, and disabled Start fire before selection. Try brush and grass-bearing route cells.
2. Zoom, physically pan/orbit, then select visible fuel. Camera gestures, left drags, and all panel interactions must not select cells.
3. At Increment 4, placement locked and only the selected cell changed orange → red → dark gray (4/6 seconds burning, then 5 seconds cooling in an active tab). Neighbors stayed unchanged then.
4. Move the camera, reset simulation during burning/hot/cool, and repeat a run. Fuel/appearance/selection reset, placement turns off, and camera stays put. `R` resets camera only.
5. Resize and check readable/scrollable panels, repeat on production preview, and check the console. Physical mouse checks remain necessary; automated/agent checks are separate from user validation. Full MVP performance is unmeasured.

Increment 5 feedback: the user reported the checklist mostly passed, but fuel appearance was misleading. Individual results were not specified; full validation is **not recorded as passed**. The approved environment/navigation correction now requires this human recheck:

1. Identify bare yellow roads, light-green grass, medium-green brush with low shrubs, and dark-green forest floor with trees. Follow both roads through the narrow passages; no green strip should cross them. Check the legend and narrow-window scrolling.
2. Try selecting yellow road: it must be rejected. Grass/brush/forest ground, including gaps between models, can be selected. Move the single marker before starting and confirm placement locks afterward.
3. Ignite `(32,32)` (forest), then watch propagation and orange/red/dark-gray transitions. Roads must stay yellow and unburned. Tests verify A-only closure with B available at 7.5 seconds and both closures at 10.5 seconds; there is intentionally no visible buffer overlay. Optionally reset and try `(32,25)` for an earlier A-only hazard around 1 second.
4. During spread, zoom/pan/orbit and press `R`; fire must continue. Reset simulation while spread is active: ground, shrubs/trees, fuel, indicators and selection restore, placement turns off, and the camera stays put. Re-select the same coordinate to replay.
5. Resize wide/narrow and tall/short; check labels and controls. Repeat on production preview and inspect the console. Physical right/middle drag checks remain human checks. No full MVP performance result is claimed.

Final Increment 5 user-reported checks: bare yellow road rejects ignition; grass, brush and forest accept ignition; reset restores the scene; physical pan/orbit work. The user accepts the current layout for functional development, not final visual design. Invisible hazard/connectivity checks remain automated, not visually confirmed by the user. Earlier partial validation is retained without inferring additional passed checks.

Deferred visual refinements: abrupt road-width changes near vegetation, purple selection-ring redesign, and richer vegetation assets/effects. Basic grass/brush/forest distinctions and representative forest fuel are implemented; no marker redesign, downloaded assets or advanced effects included. Forest-floor gaps intentionally contain logical fuel, while bare road gaps do not.

## Intended organization

The current application uses `src/main.js`, `src/styles.css`, `src/rendering/`, `src/world/`, `src/simulation/`, `src/agents/`, `src/ui/`, and `tests/`. Other directories will be created when first needed:

| Path | Purpose |
| --- | --- |
| `src/simulation/` | Independent fire state, fixed-step spread/lifecycle, and demonstration configuration |
| `src/agents/` | Implemented deterministic A*, movement, buffer exit and five-state agent logic |
| `src/world/` | Authored logical grid and BFS connectivity validation |
| `src/rendering/` | Three.js visualization |
| `src/ui/` | Ignition placement, Start fire, and simulation reset controls |
| `public/assets/` | Simple or licensed assets |
| `tests/` | Relevant automated checks |
| `docs/` | Requirements and progress |

Read [requirements](docs/requirements.md), [progress](docs/progress.md), and [working rules](AGENTS.md) before implementation.
