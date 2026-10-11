# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increment 5 is checkpointed at `37adf4c`: nonburnable roads, distinct vegetation and nearby-fire navigation hazards. Final user-reported checks confirmed road rejection, vegetation eligibility, reset restoration and physical pan/orbit; invisible connectivity checks were automated. The layout is accepted for functional development, with visual refinements deferred. Increment 6 adds 20 basic evacuation agents and A* navigation, **completed with user-reported manual validation**. Increment 7 adds direct-active-fire loss handling, completed with user-reported manual validation; direct loss is verified through automated fixtures, not a visible browser loss demonstration. Off-path escape, crowd avoidance, weather and procedural generation are not implemented. Two completed local production measurements are documented in docs/performance.md; optional manual benchmark reproduction was not performed; the user-reported functional checks are complete.

The intended stack is JavaScript, Three.js, Vite/npm, and HTML/CSS. FireFront is not a validated wildfire prediction tool.

## Dashboard exploration — Increment 8 (user-validated)

The validated dashboard is preserved at `19858c3` on `feature/dashboard-layout` and has been fast-forward adopted on main, followed by adoption-documentation commit `3fcf20c`. Annotated tags preserve `layout-original` (`0e42f8c`) and `layout-dashboard-baseline` (`19858c3`). The forest styling increment on `feature/forest-ui` is completed with user-reported manual validation; main now contains validated scene readability at `387f42e`. The user-validated FPS/performance increment is on `feature/performance-validation`; prior branches and comparison tags are retained.

The dark HTML/CSS workspace puts one dedicated simulation viewport beside a scrollable panel for ignition/reset, selection status, five evacuation counts and map/fire legends. Compact camera hints sit below the canvas. At widths up to 800 px the panel stacks below a usable viewport and the page scrolls. Short desktop windows also allow page scrolling instead of shrinking the scene indefinitely. Fonts use the local system stack; no frameworks, assets or dependencies added. That dashboard increment left the scene unchanged; the current scene-readability changes are described below.

`src/rendering/createViewportResize.js` observes the viewport container with `ResizeObserver`, updating renderer dimensions, camera projection and responsive reset framing even when panel layout changes without a window resize. A window listener retains pixel-ratio updates, capped at 2. Cleanup disconnects both. The absolutely sized canvas cannot resize its parent through its drawing buffer. Picking continues using the canvas's current bounding rectangle in client coordinates, so page offsets and scrolling do not change cell alignment. Controls/legends live outside the canvas and cannot initiate scene pointer gestures. Existing keyboard guards remain; R is camera-only and simulation reset preserves the camera.

Press **I** to toggle ignition placement through the same action as **Place ignition**; the button shows an I key hint using the existing R style. This shortcut never selects a cell or starts fire and remains locked while the button is disabled/after ignition. Held-key repeats, typing in inputs/editable elements, Ctrl/Alt/Meta combinations, composition and already-handled events are ignored. Reset re-enables placement. The shortcut listener is removed during cleanup.

The user reported all four Increment 8 manual checklist items passed: dashboard sizing/scrolling/selection alignment; I/button toggling and keyboard guards without automatic selection/start; shortcut lock during a run and re-enablement after reset; physical pan/orbit, zoom, camera-only R, evacuation/reset and console in development and preview. These user reports are separate from automated checks.

Repeat-check checklist:

1. At desktop, narrow and short sizes, identify START/SAFE, both routes, vegetation and all controls/counts/legends. Scroll the panel/page; ensure the viewport stays usable and proportions remain correct.
2. Toggle placement with I and the button; hold I to confirm no repeated toggles. Check modifier/typing guards where applicable. Confirm the shortcut alone neither selects nor starts fire. Click visible vegetation, and confirm marker/status alignment after resizing and page scrolling. Yellow road must reject ignition without moving the marker. Clicking/scrolling/dragging on panels must not select cells or move the camera.
3. After Start fire, confirm I cannot re-enable placement; after reset, confirm it works again. Check physical right-drag pan, middle-drag orbit, wheel zoom and R. Run the usual (32,32) scenario; confirm evacuation/fire/counts, camera-only R, and reset during/after a run with camera preservation.
4. Repeat on rebuilt production preview and inspect the console. Direct-fire loss remains fixture-verified, not visibly demonstrated on nonburnable roads. Full MVP performance remains unmeasured.

### Compare layouts safely after Increment 8 is committed

Do not switch with uncommitted work. After the current performance increment is validated and committed, stop project servers and confirm `git status --short` is empty. Use `git switch --detach layout-original` for the overlay layout or `git switch --detach layout-dashboard-baseline` for the dark dashboard. Return using `git switch feature/performance-validation`, stopping servers/checking clean before each switch. Rebuild before previewing each version: ignored dist output does not switch with Git. Main now contains validated scene readability at `387f42e`. Do not edit comparison snapshots or discard changes to compare; no comparison switches were performed here.

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

Toggle **Place ignition** on with its button or **I** for a torch cursor with a consistent 4,4 pixel tip hotspot. A prohibition badge identifies nonignitable ground. Leaving the canvas, camera gestures, placement off and Start fire restore the normal cursor. An unmodified stationary left mouse click on grass, brush or forest ground selects one fuel cell, shown with a compact amber square outline on the ground. Clicking another eligible cell moves that outline before starting. Its dark border and hollow center distinguish selection from active flames; it stays visible over decorative trees without changing its logical position. Fuel-free roads/ground are rejected without changing the cell or existing selection. Turning placement off retains the selection but disables picking. Panel interactions and left drags do not place ignition.

**Start fire** is enabled only after a valid selection. It ignites that cell, turns placement off, and locks selection until **Reset simulation**. Short orange/yellow flames indicate burning; flat red ember strips on charred ground indicate burned-hot; ash-gray ground without flames or embers indicates burned-cool. Full-cell ground coverage and these distinct shapes identify affected cells. Burning trees darken but keep their standing height; after fuel exhaustion their crowns disappear and short charred stumps remain through hot/cool states. Other burning vegetation shrinks/chars and disappears when exhausted. Reset restores the original vegetation. The status text describes the original selected cell; neighbors can still burn after that cell has cooled.

Each unburned fuel cell accumulates exposure from its four edge-sharing burning neighbors: 1 exposure unit per neighbor per simulated second, with ignition at 2 units. One burning neighbor takes 2 seconds; two take 1 second. Exposure returns to zero when no burning neighbor remains. Only burning cells contribute; hot/cooled cells do not. There is no diagonal spread or jumping across nonfuel gaps. Fuel quantity controls burn duration, independently of ignition delay and base walkability; blocked or walkable fuel can burn. The eight-neighbor navigation buffer does not change this four-neighbor spread rule.

Every fixed step snapshots the burning sources, evaluates targets, and applies new ignitions together. A newly ignited cell contributes only in the next step and retains full fuel until then; a source burning at the start of a step contributes even if it burns out during that step. This avoids iteration-order effects and same-step cascades. This simplified deterministic four-neighbor rule is **not calibrated wildfire physics**; wind, moisture, slope and stochastic behavior are absent.

`src/simulation/createFireSimulation.js` owns plain fire-state copies independent of Three.js and DOM. The lifecycle is `unburned → burning → burned-hot → burned-cool`. Burning/hot cells are directly hazardous; cooling clears their own hazard but not another cell's buffer. Original base walkability is preserved. Exhausted fuel cannot reignite. The single-run ignition lock also remains in force after cooling.

Demonstration configuration lives in `src/simulation/fireConfig.js`: grass starts with 4 fuel units, brush with 6, and forest with 10, consumed at 1/3 unit per simulated second. They burn for 12, 18 and 30 seconds respectively, followed by 8 seconds cooling. Forest retains more fuel and burns longest; fuel quantity does not accelerate ignition. These are illustrative values, **not calibrated wildfire physics**. A 50 ms fixed-step accumulator produces the same results at ordinary frame rates; each frame contributes at most 250 ms. Excess time from long frame gaps/background suspension is discarded, so resuming cannot skip the whole lifecycle in one catch-up jump. Simulation time may consequently lag wall time after suspension.

**Reset simulation** restores initial fuel, unburned states, exposure, timers, and selection, turns placement off, and allows a repeatable new run. Derived navigation hazards clear because no reset cell is burning/hot. It preserves the current camera. `R` resets only the camera. Neither operation changes the authoritative map. `src/rendering/createGroundPicker.js` raycasts from current pointer/camera coordinates onto the ground plane and resolves grid coordinates; vegetation and text sprites cannot intercept picking. Rendering updates affected full-cell ground colors, vegetation instances, and shared flame/core/ember batches on state changes. Only burning instances flicker between state changes; reduced motion keeps them static. Reset restores the original vegetation transforms and colors.

Suggested demonstration: forest cell **(32,32)**. Measured route connectivity closes A at **14 s**, B at **20 s**, reopens A at **26.15 s** and B at **32.1 s**. Invisible buffers cause closures; roads remain fuel-free/unburned. Alternative ignition **(32,25)** closes A immediately, so agents initially choose B; A reopens at 16 s and all agents cross B by 26.35 s before its 34 s closure. Reset between scenarios. These are simulation measurements; background suspension can extend wall time.

Run navigation, map, fire lifecycle, and interaction checks with no additional test dependency:

```powershell
npm test
```

## Basic evacuation agents — Increment 6

Twenty boxes spawn in the existing blue starting area (X 7–11, Z 30–33), waiting until **Start fire** automatically begins evacuation. `src/agents/` owns plain state/navigation with no Three.js or DOM dependency. `findPath.js` uses four-neighbor A* with Manhattan distance and deterministic f-score, heuristic, then cell-index tie-breaking. Normal paths require base walkability and a clear hazard mask at every cell. No diagonal corners, off-path movement, collisions or crowd avoidance; agents may overlap as paths merge.

`agentConfig.js` sets an illustrative speed of **1.5 logical cells per simulated second**, or **0.75 world units/second**. Continuous X/Z positions move along axis-aligned cell-center segments in fixed steps; logical occupancy is the cell containing the actual position, and rendering reads those same coordinates. START/SAFE text is positioned just below its area so it does not cover the boxes. Box colors are white waiting, blue evacuating, brown trapped, teal evacuated and crimson lost; the labeled live counts are authoritative and always total 20.

Paths are cached until a relevant hazard invalidates the occupied cell, target or remaining route. Trapped agents retry on hazard changes, not every rendered frame. When a segment becomes invalid, the agent smoothly returns to the center of its **currently occupied cell**, then replans; it does not teleport to an endpoint or enter a newly unsafe next cell. If already inside a precautionary buffer, an emergency BFS can leave through the nearest walkable buffered cells toward safe ground, excluding burning/hot cells. After leaving, normal safe A* resumes. This exception only exits an existing buffer; safe agents cannot use it to enter buffers as shortcuts. An actively burning occupied cell causes immediate terminal loss before movement. A burned-hot occupied cell stops movement as trapped and retries after hazards change without causing loss.

Implemented states: **waiting** before ignition; **evacuating** while following a route or emergency exit; **trapped** when no available route/exit exists; **evacuated** at the safe-zone center and **lost** from active fire in the occupied cell, both terminal until reset. Reset restores all 20 starting positions, waiting states, paths, retry caches, fire and simulation time while preserving the camera. R still resets the camera only.

Current trace at **(32,32)**: agent 0 initially plans A and turns west toward B at **14 s**; trapping starts at **20.15 s**, all 20 are trapped by **20.2 s**, and all resume at **26.15 s**. All fuel is cool at **52.7 s** and evacuation completes at **60.8 s**, Lost = 0. Automated measurements are separate from browser/human validation; full MVP performance is unmeasured.

Historical Increment 6 checklist (old timings retained for its validation record; use the current pacing checklist below):

1. Confirm 20 white waiting boxes in START and counts 20/0/0/0. Bare road rejects ignition; selecting vegetation alone must not start movement.
2. Ignite `(32,32)`. Watch movement toward A, a turn back toward B around 7 seconds, brief Trapped = 20 around 10–11.1 seconds, then resumed evacuation. By roughly 40 active-tab seconds, Evacuated = 20. Counts must always sum to 20.
3. Reset during movement/trapping and after evacuation: positions, vegetation, marker and counts restore, placement turns off, and camera stays put. Repeat the same ignition; R changes only the camera.
4. Check wheel zoom, physical pan/orbit, UI isolation, wide/narrow and tall/short resizing, production preview and browser console. Agents may overlap. This historical Increment 6 checklist preceded the Increment 7 loss rule below.

Increment 6 user-reported validation passed: 20 waiting agents; ignition at (32,32) produced turn-back, trapping, recovery and evacuation as described; reset during movement and after completion preserved the camera; pan/orbit, zoom, R, resizing and console checks passed. These reports are distinct from automated checks.

The earlier pacing feedback is addressed by the coordinated settings below, pending new human validation. Historical validation records used the old settings.

## Direct-fire loss — Increment 7 (manual checklist passed)

Each fixed step updates fire, derives navigation hazards, then checks nonterminal agents for active fire in their **occupied logical cell before movement**. At Start fire, the immediate ignition receives the same check before any agent can leave. Loss uses only state `burning`: nearby fire/buffers, burned-hot ground and trapping alone never cause loss. No health, exposure/damage timer or random mortality is used. Lost agents stop at their current position, clear paths/targets/retry state and remain lost after cooling. Evacuated agents remain evacuated, even if their cell later burns. Simulation reset restores all agents, appearance, counts and fire while preserving the camera; R stays camera-only.

Occupancy remains `floor(z) * width + floor(x)` for continuous grid coordinates. Cells include their minimum boundary and exclude their maximum boundary. Crossing a boundary changes occupancy before reaching the next cell center; rendering uses the same continuous X/Z position. Loss therefore checks the containing cell, not the last visited center or the target. Normal movement still cannot enter burning/hot/unsafe cells; the existing buffered-occupant escape exception is preserved.

The five live counts always sum to the initial population. Lost boxes are crimson with no effects. Current agents travel on nonfuel roads/endpoints, so ignition (32,32) ordinarily produces 20 evacuated and **Lost = 0**. Loss is verified with controlled tests containing walkable fuel that ignites under an agent, including mid-segment occupancy, simultaneous losses, terminal states and reset/render/count restoration. These fixtures do not modify the displayed map and are not a visible-loss browser demonstration. Run `npm.cmd test` to reproduce them.

The user reported all four Increment 7 manual checklist items passed: initial counts, ordinary evacuation/count conservation, reset/camera preservation, and navigation/R/resizing/console. Direct-fire loss itself remains verified through automated fixtures and was not visibly demonstrated in the browser.

Repeat-check checklist: confirm Waiting = 20 / Lost = 0; ignite (32,32), watch ordinary evacuation and counts totaling 20 with Lost staying zero; reset during movement and after completion, checking restoration and preserved camera; check R, navigation, resizing and console. Observing crimson losses manually is limited by the current nonburnable road layout; no hidden damage or lethal-area expansion was added.

The validated dashboard has been adopted and comparison snapshots retained. Planned follow-up: coordinated spread/burn/cooling/agent-speed pacing tuning and performance validation, keeping meaningful rerouting/trapping scenarios. No pacing tuning is included in the forest styling increment. At that checkpoint, purple-marker, richer-assets/effects and road-width presentation feedback was deferred; the current scene-readability section supersedes the marker work.

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

1. Toggle placement on/off; check torch cursor, one movable amber cell outline, invalid-cell rejection, and disabled Start fire before selection. Try brush and grass-bearing route cells.
2. Zoom, physically pan/orbit, then select visible fuel. Camera gestures, left drags, and all panel interactions must not select cells.
3. At Increment 4, placement locked and only the selected cell changed orange → red → dark gray (4/6 seconds burning, then 5 seconds cooling in an active tab). Neighbors stayed unchanged then.
4. Move the camera, reset simulation during burning/hot/cool, and repeat a run. Fuel/appearance/selection reset, placement turns off, and camera stays put. `R` resets camera only.
5. Resize and check readable/scrollable panels, repeat on production preview, and check the console. Physical mouse checks remain necessary; automated/agent checks are separate from user validation. Full MVP performance is unmeasured.

Increment 5 feedback: the user reported the checklist mostly passed, but fuel appearance was misleading. Individual results were not specified; full validation is **not recorded as passed**. The approved environment/navigation correction used this historical checklist (timings predate the pacing increment):

1. Identify bare yellow roads, light-green grass, medium-green brush with low shrubs, and dark-green forest floor with trees. Follow both roads through the narrow passages; no green strip should cross them. Check the legend and narrow-window scrolling.
2. Try selecting yellow road: it must be rejected. Grass/brush/forest ground, including gaps between models, can be selected. Move the single marker before starting and confirm placement locks afterward.
3. Ignite `(32,32)` (forest), then watch propagation and orange/red/dark-gray transitions. Roads must stay yellow and unburned. Tests verify A-only closure with B available at 7.5 seconds and both closures at 10.5 seconds; there is intentionally no visible buffer overlay. Optionally reset and try `(32,25)` for an earlier A-only hazard around 1 second.
4. During spread, zoom/pan/orbit and press `R`; fire must continue. Reset simulation while spread is active: ground, shrubs/trees, fuel, indicators and selection restore, placement turns off, and the camera stays put. Re-select the same coordinate to replay.
5. Resize wide/narrow and tall/short; check labels and controls. Repeat on production preview and inspect the console. Physical right/middle drag checks remain human checks. No full MVP performance result is claimed.

Final Increment 5 user-reported checks: bare yellow road rejects ignition; grass, brush and forest accept ignition; reset restores the scene; physical pan/orbit work. The user accepts the current layout for functional development, not final visual design. Invisible hazard/connectivity checks remain automated, not visually confirmed by the user. Earlier partial validation is retained without inferring additional passed checks.

Increment 5 deferred visual refinements: abrupt road-width changes near vegetation, purple selection-ring redesign, and richer vegetation assets/effects (marker work is now addressed below). Basic grass/brush/forest distinctions and representative forest fuel are implemented; no marker redesign, downloaded assets or advanced effects included. Forest-floor gaps intentionally contain logical fuel, while bare road gaps do not.

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

## Forest UI and ignition feedback (user-validated)

Forest framing, parchment panels, moss raised/stepped buttons and warm accents theme the existing dashboard. Original CSS/SVG pine, keycaps, contained border flames and native torch cursors use no downloaded assets or new dependencies. Layout, viewport sizing, scene assets and simulation rules remain unchanged.

Place ignition and I share the existing guarded toggle. Placement on makes the button orange with flames; toggling off clears it. Start fire disables it as **Ignition locked**, retaining decoration until simulation reset, even after cooling. Decoration means placement is on or ignition was used this run, not that cells remain burning. Reduced motion keeps the flame pattern static. Start fire remains separate; simulation reset preserves camera and R remains camera-only. Torch feedback reuses existing picking/eligibility, never intercepts input, and refreshes after camera changes. Crosshair/not-allowed fallbacks remain available.

Verification: 50/50 tests and production build passed. Development/preview checks covered toggle, (32,32) selection, road rejection, run lock, reset/count restoration, wheel/R, panel isolation and clear consoles. Narrow/short layouts passed. The browser has reduced motion enabled: static flames were verified; ordinary animation and physical mouse/cursor checks were subsequently reported passed by the user, separately from agent-browser checks. Full MVP performance remains unmeasured.

User-reported validation: all four final manual checklist items passed. The flame effect is acceptable for now but visually limited; improved animation is deferred, with no redesign in this closeout. Repeat-check checklist:

1. Inspect contrast, viewport space and controls/legends at desktop, narrow and short sizes; scroll panels/page.
2. Toggle button/I and check flames on/off and keyboard guards. Aim the torch at fuel after zoom/pan/orbit/scroll; roads show blocked feedback and reject selection. Panel interactions stay isolated.
3. Ignite (32,32): check Ignition locked, inactive I and normal cursor; observe evacuation/fire. Reset during/after activity restores state while preserving camera. R resets only the view.
4. Repeat on preview; inspect console, physical right/middle drags, flame containment and reduced-motion static versus ordinary animated treatment.

At the forest-UI checkpoint, terrain thickness, scene readability, purple-marker refinement, richer assets/effects, road-width presentation and coordinated pacing/performance validation were pending. Subsequent pacing and scene-readability sections supersede the corresponding items; richer assets, road-width feedback, button-flame animation and formal performance validation remain deferred.

## Coordinated simulation pacing (user feedback accepted)

Main fast-forward adopted validated forest UI `d549293`; existing branches/tags are preserved. This bounded increment is checkpointed on `feature/simulation-pacing` following user feedback. Runtime changes are confined to fireConfig and agentConfig; measurement/tests and documentation support the tuning.

| Setting | Previous | New | Rationale |
| --- | --- | --- | --- |
| Exposure per burning neighbor | 1 unit/s | 1 unit/s | Retain simple accumulation |
| Ignition threshold | 1 unit | 2 units | One neighbor now takes 2 s; two take 1 s |
| Grass / brush / forest fuel | 4 / 6 / 10 units | 4 / 6 / 10 units | Preserve relative quantities |
| Fuel consumption | 1 unit/s | 1/3 unit/s | Burn durations increase from 4 / 6 / 10 s to 12 / 18 / 30 s |
| Cooling after burnout | 5 s | 8 s | Longer readable hot-to-cool transition |
| Agent speed | 2 cells/s (1 world unit/s) | 1.5 cells/s (0.75 world units/s) | 25% slower walking coordinated with later closures |
| Fixed step / frame cap | 0.05 / 0.25 s | 0.05 / 0.25 s | Preserve shared clock and long-gap handling |

These are **illustrative simulation settings, not physically calibrated wildfire values**. The 60–90 s demonstration goal is a usability target, not a required duration for every ignition. Four-neighbor exposure, snapshot spread, map, hazards, direct-fire loss, UI/scene styling and dependencies remain unchanged.

Measure with `node scripts/measurePacing.js`. The script uses the actual shared simulation and reports seconds from Start fire at 0.05 s resolution. Route availability uses BFS with the other route disabled on a temporary map copy. Turn-back tracks representative agent 0 moving west while planning B; trapping/recovery track actual agent states. It checks conserved population every step. This is scenario measurement, not an FPS benchmark.

| Event | (32,32) old → new | (32,25) old → new |
| --- | --- | --- |
| First spread | 1 → 2 s | 1 → 2 s |
| A closes | 7 → 14 s | 0 → 0 s |
| B closes | 10 → 20 s | 17 → 34 s |
| Agent 0 reroute/turn toward B | 7.1 → 14 s | Initially plans B in both |
| All 20 trapped | 10 → 20.2 s | Never in either run |
| Recovery / A reopens | 11.1 → 26.15 s | A reopens 6 → 16 s; no trapping |
| B reopens | 14.1 → 32.1 s | 21.1 → 46.1 s |
| All fuel cooled | 22.4 → 52.7 s | 29.2 → 66.2 s |
| All 20 evacuated | 39.55 → 60.8 s | 63.5 → 47.35 s |

Central trapping begins at 20.15 s, reaches all 20 by 20.2 s, and lasts about 5.95 s for the whole population (formerly 1.1 s). First burnout anywhere is 8 → 22 s; the central selected forest cell itself burns for 30 s, then cools for 8 s.

Tradeoff: at (32,25), all agents cross B by 26.35 s before its 34 s closure, avoiding the old detour and shortening evacuation despite slower walking. Remaining fire/cooling continues until 66.2 s. Initial B routing should be compared with the central reroute/trap scenario, not expected to trap too. Nonfuel roads reopen when adjacent burning buffers clear; hot fuel remains hazardous itself, so longer cooling does not delay road reopening. Agent overlap and normal zero-loss road scenarios remain. No map/rule redesign forced these outcomes.

User-reported feedback: the checklist was satisfactory and movement was not objectionably slow. All current values, including agent speed 1.5 cells/second, are retained. This does not claim additional individual manual checks or exact measured browser timings. Repeat-check checklist (keep the tab active; suspension/long frames can extend wall time):

1. Ignite **(32,32)**: first neighbors around 2 s, turn-back around 14 s, Trapped = 20 around 20.2–26.15 s, recovery, then Evacuated = 20 around 61 s. Judge readability and walking speed; counts sum to 20 and Lost stays zero.
2. Reset; ignite **(32,25)**: agents initially choose B, no trapping expected, evacuation around 47 s, all remaining fuel cooled by 66 s. Roads remain yellow/unburned.
3. Reset during spread/trapping and after completion; confirm 20 waiting, restored vegetation/selection, camera preserved. Replay; R resets only the view, with existing navigation and ignition locks intact.
4. Repeat on preview and inspect console. Report whether the longer burning, six-second trapped interval and recovery are comfortable to follow. The user accepted the current pacing based on the feedback recorded above; no additional checks are inferred.

Automated verification: **52/52 tests passed**, including measured scenarios, reset/replay, population conservation, ordinary render intervals through 80 s, long-gap handling and existing loss/navigation/camera regressions. Production build succeeds. These checks are not a full MVP performance benchmark.

The subsequent scene-readability increment addresses the purple marker, labels, fire states and terrain thickness. Button-flame animation, richer assets and road-width feedback remain deferred. Formal performance validation is separate future work.

## Scene readability (user-validated)

Validated pacing was fast-forward adopted on main at `fe9329a`; the validated scene-readability checkpoint is on `feature/scene-readability`. Existing branches/tags are preserved. Do not switch layouts with uncommitted work. Earlier increment descriptions/checklists are historical; this section describes the current presentation.

START/SAFE labels are about half their former width; route labels are compact and moved just outside the lanes. Forest-green backgrounds and parchment text replace oversized white panels. They remain camera-facing sprites, with no new label system; on very narrow overviews or at distant zoom, zoom in for detail.

Selection is an amber hollow cell-sized square with a dark outline at ground level, independent of the torch cursor. Burning uses orange/yellow flames over scorched full-cell ground. Grass, brush and undecorated forest floor use the restored fuller, compact flame cluster (about 0.335 world units high). Actual tree-model cells use a separate surrounding flame cluster reaching approximately the crown height (highest tongue about 105% of standing-tree height, plus subtle flicker), so the tree visibly looks engulfed. Tongues stay within the logical cell footprint with gaps that retain parts of the standing silhouette. The earlier narrow 70%-height treatment is superseded by this feedback refinement. Burning trees darken at their original standing height. Only at burned-hot does the crown disappear and the trunk become a short charred remnant, retained when cool. Other vegetation shrinks/chars while burning and disappears when exhausted. Burned-hot is dark char with flat red ember strips and no flames. Burned-cool is ash-gray ground with no embers or flames. Geometry, not just color, distinguishes selection, active flame and cooling. The legend follows these cues. Reset restores initial fuel coverage, vegetation and selection state.

`src/rendering/createFireView.js` owns five shared instanced batches; the two tree-only batches allocate instances only for actual tree models, not all forest-floor cells. Flicker uses render timestamps and a stable cell-index phase, never simulation randomness or state. Reduced motion uses static flames. A two-layer soil/rock base extends 0.69 world units below the unchanged y=0 surface, aligned to the full map boundary. Ground-plane picking ignores all decoration and the base; visible side faces cannot become ignition cells. Camera framing, limits, bindings, UI layout and all simulation parameters/rules are unchanged. The ignition-button decoration is unchanged.

Automated verification: **54/54 tests passed**, production build passed, and both scenario traces match validated pacing. Focused checks exercise selection alignment, full-cell ground coverage, flame/ember lifecycle, charring/removal/restoration, render-only flicker, reduced-motion stability, unchanged state/map data and terrain-side picking. Central (32,32) still closes A/B at 14/20 s, recovers at 26.15 s and evacuates all 20 at 60.8 s; alternative (32,25) still evacuates at 47.35 s. These are simulated times, not a performance benchmark.

Repeat-check checklist:

1. In development and preview, inspect smaller labels at overview and useful zoom/orbit; try narrow and short windows and scroll panels/page. Check label contrast, map space and the shallow base from an angle.
2. Toggle I/button; select fuel after physical pan/orbit/zoom. Check the amber outline matches the selected cell. Roads and soil/rock sides must reject ignition; panel gestures must not select or move the scene.
3. Ignite (32,32): distinguish flames, flat hot embers and cool ash, with roads/agents visible and standing trees darkening, then changing to short charred remnants only after burnout (other exhausted vegetation disappears). Check subtle flicker with reduced motion off and static flames with it on. Expect route changes/trapping around 14-26 s and evacuation around 61 active-tab seconds.
4. Reset during/after a run: all original vegetation/ground/counts return and camera stays put; R resets only camera. Repeat in preview and inspect console. Report any rendering slowdown. User-reported validation is recorded below; full MVP performance remains unmeasured.

Local servers/restart commands remain those in Local development above. Deferred: richer assets/effects, abrupt road-width presentation, improved ignition-button flame animation, and formal performance validation. No simulation/map/dependency changes.

Scene-readability user-reported validation: checklist 1, reset restoration/camera preservation, R and preview-console checks passed earlier; corrected tree lifecycle/reset looked satisfactory and embers were acceptable for MVP. Final checks confirmed terrain-side ignition rejection, reduced motion, acceptable latest flames with readable roads/agents, and burnout/reset. No extra manual checks or full MVP performance measurements are inferred. Historical pending entries in the progress log are superseded by its closeout record.


## FPS and local performance verification (user-validated)

Validated scene readability at `387f42e` is adopted on main. The user-validated performance increment is checkpointed on `feature/performance-validation`; prior branches/tags are retained. The compact viewport-header FPS counter measures actual rendered-frame counts and elapsed time, refreshes roughly once per second, excludes hidden-tab time and starts a fresh sample on return. It uses the existing rendering loop and remains independent of the simulation clock/reset.

Two fresh production-preview captures at a 1280×720 browser viewport (embedded canvas 922×555, drawing buffer 922×555, DPR 1), normal animation and default overview produced averages 143.98 / 144.00 FPS, lowest complete one-second windows 142.02 / 143.00 FPS, p95 intervals 7.5 / 7.5 ms and zero complete windows below 30 FPS. Both conserved 20 agents and completed evacuation at about 60.8 seconds with zero losses, without recorded interruptions. This meets the observed local criterion for that workload, not a full-size-canvas or other-hardware guarantee. Automated visible in-app browser reported NVIDIA RTX 4060 through ANGLE; independent acceleration-setting confirmation remains unavailable. Optional manual benchmark reproduction was skipped: **not performed**, not passed.

See [performance methodology, environment, results and reproduction](docs/performance.md) and [raw measurements](docs/performance-results.json). The interrupted earlier capture is not evidence. `?benchmark=1&animation=normal` opts into a small JSON download and the existing normal-animation workload; ordinary URLs continue respecting reduced motion. Reload for a fresh set, allow five seconds warm-up, ignite (32,32), leave the foreground/camera untouched for 60 seconds and completion, reset and repeat. No benchmark dashboard, additional loop, dependencies, simulation/quality tuning or permanent global debug API was added.

Current checks: 60/60 tests, successful production build and diff check. Development and freshly built preview FPS/ignition/reset/console checks, production evacuation, narrow/short layout and road/panel isolation were checked through browser automation. True tab hiding was not reproduced by switching the automation tabs; hidden/return handling is covered by fixtures, and the user subsequently confirmed sampling returning after minimizing. Historical claims of unmeasured performance in earlier sections describe their original checkpoints; this section and docs/performance.md give the current limited local results.

Manual checklist:

1. In development and preview, confirm FPS updates about once per second and remains readable on desktop, narrow and short windows.
2. Hide/switch away from the physical browser tab for several seconds, return and confirm FPS resumes with a fresh sample; reset should restore 20 waiting and preserve the camera while FPS continues independently.
3. Check physical pan/orbit, zoom, R, I, accurate vegetation picking and road rejection; panel interactions must not move/select the scene. Run (32,32), check counts/recovery/evacuation and reset, and inspect both consoles.
4. Reproduce both foreground production measurements using docs/performance.md, export JSON and report any interruptions/dips plus the browser/hardware and actual viewport/canvas dimensions.


Performance-validation closeout: user-reported manual checks passed for FPS readability across window sizes, sampling after minimizing, navigation/ignition/reset and camera preservation. Both development and production-preview consoles were checked with no red errors. Optional manual benchmark reproduction was **not performed**; the two automated captures and their documented limitations remain the only benchmark evidence. The checklist above is available for future reproduction, not a claim that its optional measurement item passed.
