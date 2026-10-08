# FireFront progress

## 2026-10-04 — Earlier environment setup (reported in this chat)

- Selected folder: `C:\Users\karmv\Desktop\USA\Rutgers\Fall 2026\AI for Visual Compute\FireFront`.
- Earlier inspection reported an empty folder, no Git repository, Git 2.49.0.windows.1, and only Codex's bundled Node.js v24.19.0 available on the agent PATH; npm was unavailable.
- Earlier setup reported no regular installation in standard locations or Windows/winget records. Installed the official Windows x64 Node.js v24.21.0 LTS ZIP with npm 11.19.0 under `C:\Users\karmv\AppData\Local\Programs\nodejs\node-v24.21.0-win-x64`.
- Earlier setup reported matching the archive SHA-256 against the official checksum and appending the installation directory to the user PATH while preserving existing entries. Codex's bundled runtime was left unchanged.
- Fresh terminals use the updated Windows PATH; fully restart Codex for its inherited environment to refresh. Codex may still select its bundled runtime internally.

## 2026-10-04 — Documentation and local version-control increment

Acceptance criteria: create the five requested setup files, accurately record scope and status, verify ignore behavior, review the staged diff, and save a local checkpoint on `main` using the existing Git identity. Stop before application scaffolding.

### Changes

- Added `AGENTS.md`, `docs/requirements.md`, `docs/progress.md`, `README.md`, and `.gitignore`.
- Recorded the midterm MVP, acceptance scenarios, unachieved performance target, excluded later scope, implementation direction, and Assignment 3 deliverables.
- Established bounded increments, separation of simulation/rendering/UI, preservation of work, human validation, and Git checkpoint rules.
- Initialized local Git on `main`; no remote or publication requested.

### Checks performed in this increment

- Confirmed the working directory is the selected FireFront folder; it was empty, including hidden files, and was not inside a Git repository.
- Verified the regular Windows Node.js v24.21.0 and npm 11.19.0 using the saved machine/user PATH in an approved process outside the sandbox. PowerShell resolved `node.exe` and npm's launchers in the regular installation directory; `process.execPath` confirmed that Node executable.
- Verified Git 2.49.0.windows.1. Existing author identity is configured; no identity or global Git settings were changed.
- The agent's inherited sandbox PATH still selects the separate Codex runtime; executing the regular installation there required sandbox approval.
- Verified ignore rules with hypothetical paths: dependencies, build output, coverage, logs, local `.env` files, and OS clutter are ignored; `.env.example`, source, documentation, `package.json`, and `package-lock.json` remain trackable. No placeholder files were created.
- Confirmed branch `main` and no configured remotes. Git staging requires approval because the sandbox protects `.git` writes.
- Reviewed all five staged files and passed `git diff --cached --check`. No application files or dependencies were added.
- Resolved the new repository's sandbox ownership mismatch by assigning only `.git` metadata ownership to the user's Windows account; normal user Git now works without a persistent trust exception or global configuration change.

### Git checkpoint

Checkpoint message for this increment: `chore: establish FireFront scope and development workflow`. The checkpoint contains only the five requested setup files; its hash is available in Git history and the completion response.

### Human validation

Pending. Review the five setup files for fidelity to the agreed scope. In a fresh local terminal, check `node --version`, `npm --version`, and `Get-Command node,npm` to confirm local development access. No user testing has been confirmed.

### Unresolved issues and next task

- No simulation, rendering, navigation, performance checks, or application validation exists yet. The performance target is unmeasured.
- Next task, after documentation review and explicit instruction: scaffold the agreed JavaScript/Vite/Three.js application as one bounded increment with stated acceptance criteria, relevant checks, human validation steps, a progress update, and a Git checkpoint.
- Do not install project dependencies or scaffold in this increment. Do not add remotes, push, publish, or deploy without explicit instruction.

## 2026-10-04 — Increment 1: minimal working 3D application

### Acceptance criteria and changes

- Vite starts locally; Three.js displays a ground plane and colored cube with a camera and basic lighting.
- The scene follows window resizing; a small HTML/CSS label identifies FireFront and the initial scene setup.
- A production build succeeds and its local preview renders correctly.
- No fire, agents, procedural generation, or weather is implemented.
- Added `index.html`, `package.json`, `package-lock.json`, `src/main.js`, `src/rendering/createScene.js`, and `src/styles.css`. Updated README with exact installation, development, build, and preview instructions plus a scene explanation and validation checklist.
- Rendering uses built-in geometry, a perspective camera, hemisphere/directional lighting, a resize listener, pixel ratio capped at 2, and a render-only animation loop. Vite hot replacement stops the old loop and disposes GPU resources.
- Existing instructions and requirements were preserved. No empty future modules, downloaded assets, frameworks, or other direct dependencies were added.

### Actual checks in this increment

- Read `AGENTS.md`, requirements, and prior progress before implementation; initial Git status was clean on `main`.
- Verified regular Windows Node.js v24.21.0 and npm 11.19.0. Executable directory: `C:\Users\karmv\AppData\Local\Programs\nodejs\node-v24.21.0-win-x64`. Used `node.exe` and `npm.cmd` there by prepending this directory only to the process PATH; persistent PATH and Codex's bundled runtime were not changed.
- Checked official [Vite compatibility documentation](https://vite.dev/guide/) and [Three.js installation documentation](https://threejs.org/manual/pages/installation.html). Queried `npm view vite@latest version engines --json` and `npm view three@latest version engines --json` before selection. Vite 8.3.2 requires `^20.19.0 || >=22.12.0`; the verified Node version satisfies it. Three.js metadata supplied version 0.186.1 and no Node engines restriction; rendering still requires a WebGL2-capable browser.
- `npm.cmd install`: succeeded; installed 16 packages (including Vite's transitive dependencies), audited 17 packages, and reported zero vulnerabilities.
- `npm.cmd ls --depth=0`: only `three@0.186.1` and `vite@8.3.2` as direct dependencies.
- `npm.cmd run build`: succeeded (8 transformed modules). Output: HTML 0.69 kB, CSS 0.53 kB, JavaScript 528.82 kB (131.44 kB gzip). Non-blocking warning: JavaScript chunk exceeds 500 kB; no warning suppression or unrelated optimization added.
- Started `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort` and `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`; both started successfully and remain running for handoff.
- Agent browser inspection confirmed the ground, colored cube, lit faces, and label on both development and production preview. At 1280x720 and after resizing to 640x480, canvas CSS and drawing-buffer dimensions matched the viewport at device pixel ratio 1; the cube retained its proportions. Restored the normal browser viewport afterward.
- Browser console inspection returned no warnings or errors on either server. These are agent checks, not confirmed user testing. High-DPI hardware and the full MVP performance target were not tested.
- Reviewed the tracked Git diff and new source-file diffs; `git diff --check` passed. Parsed the generated lockfile and verified the pinned direct versions and official npm registry sources. Confirmed `node_modules/` and `dist/` are ignored, both package manifests are trackable, and nothing is staged or committed for this increment.

### Human validation and checkpoint

On 2026-10-04, the user reported completing manual validation:

- Ground, orange cube, lighting, and FireFront label display correctly.
- Wide/narrow and tall/short resizing work; objects retain their proportions.
- The label remains readable.
- No red browser-console errors were observed.
- Development and production preview appear identical.

These are user-reported results, separate from the agent checks above. They do not measure the complete MVP performance target.

The user authorized closing Increment 1 with checkpoint message `feat: establish minimal Three.js application`. This checkpoint includes only the Increment 1 application files, both package manifests, README, and this progress log. Generated dependencies/build output remain ignored. No remote, push, publication, or deployment occurred.

### Pending interaction discussion — not approved MVP scope

- Proposed camera controls: zoom, pan, orbit, and reset-view.
- Keyboard/mouse bindings with a visible controls hint are acceptable; not every action needs a button. Exact bindings remain undecided.
- Intended ignition interaction is an explicit toggle mode; the MVP ignition count remains one. Camera behavior during ignition mode is undecided.
- Multiple/configurable ignitions and compass-view presets are later possibilities, not current implementation tasks.

This discussion does not approve new MVP scope. No camera controls or ignition interaction were implemented during this closeout; agreed requirements remain unchanged.

### Remaining issues and next task

- Non-blocking bundle-size warning remains; no runtime issue was observed in browser checks.
- The educational simulation and its performance target remain unimplemented/unmeasured.
- Next task: agree on the next bounded increment and its acceptance criteria with the user. Resolve pending interaction choices before implementing them; do not begin another feature during this closeout.

## 2026-10-04 — Increment 2: camera navigation and controls panel

### Acceptance criteria and changes

- Implement approved wheel zoom, right-button pan, middle-button orbit, and `R` camera reset. Leave left drag unassigned; constrain navigation around the ground and preserve resizing.
- Show a compact readable panel listing all bindings, including semantic `<kbd>R</kbd>`, with pointer interactions isolated from the canvas controls.
- Integrate updates and cleanup; exclude editable-field/modifier shortcuts from reset. Build successfully; review the diff and leave uncommitted for user validation.
- Initial Git status was clean on `main` at expected checkpoint `73d8ae7`. Read project rules, requirements, and progress first. No unrelated work was present.
- Added `src/rendering/createCameraControls.js`; integrated it into the renderer's loop and disposal. Used OrbitControls from existing Three.js with no dependency installation/version changes.
- Orbit polar angles: 15–75 degrees; camera-to-target distance: 6–22 world units. Ground-plane target X/Z: ±3, Y: 0. Clamping translates camera and target equally to preserve their offset. Saved the original position, target, and zoom with `saveState()` for `reset()`.
- Added HTML/CSS controls panel at the bottom right with compact narrow/short-window styling. OrbitControls' canvas context-menu suppression and event cleanup are retained. Reset ignores editable composed paths, Ctrl/Alt/Meta, composition, and previously prevented keys.
- Added `tests/cameraControls.test.js` and `npm test` using Node's built-in runner; tests exercise actual installed OrbitControls with DOM event stand-ins. Package lock and dependency versions are unchanged.
- Updated requirements with a subsequently approved MVP camera-navigation addition; original simulation scope and acceptance scenarios are preserved. No original Assignment 2 submission was edited. Updated README controls, explanation, checks, and manual checklist.

### Actual checks

- Consulted the official [OrbitControls API](https://threejs.org/docs/pages/OrbitControls.html) and installed source for bindings, distance/angle limits, ground-plane panning, saved-state reset, and disposal.
- `npm.cmd test`: all 3 tests passed. Covered left drag (including Ctrl+left), middle orbit, right pan, target bounds with unchanged camera offset, both zoom endpoints, above-ground orbit limits, combined movement/target/zoom reset without drift, editable/modifier/composition exclusions, context-menu prevention, and event-listener cleanup.
- `npm.cmd run build`: passed, 10 transformed modules. JavaScript 552.28 kB minified / 137.03 kB gzip. The existing non-blocking chunk-size warning remains.
- Existing development (`http://127.0.0.1:5173/`) and rebuilt production-preview (`http://127.0.0.1:4173/`) servers were accessible; no environment/version rechecks or new servers were needed.
- Agent browser checks on production preview: panel text and `kbd`, wheel zoom in/out to both limits (further scrolling stops changing the view), `R` reset, inactive left drag, wheel isolation over panel, right-click context-menu suppression, and layouts at 1280x720, 360x640, and 640x360. Cube proportions and readable panel preserved; canvas/drawing buffer matched the narrow viewport. Restored the default viewport.
- Browser automation exposes only left-button drags; right/middle dragging, extreme pan/orbit limits, combined reset, and editable-field guards were tested with DOM event stand-ins rather than physical mouse/browser interaction. These still require user manual validation.
- Development browser inspection also confirmed panel appearance, zoom/reset, and no console warnings/errors. Production-preview console inspection likewise returned no warnings/errors.
- Reviewed Git diffs and passed `git diff --check`. Changes are limited to navigation, panel, built-in tests/test script, and related documentation. Nothing is staged; the latest checkpoint remains `73d8ae7`. Dependency versions, lockfile contents, and the original Assignment 2 submission are unchanged; package.json only gained the test script.

### Human validation, remaining issues, and next task

- On 2026-10-04, the user reported that all four Increment 2 manual checklist items passed: all bindings and navigation limits (including physical-mouse right-drag panning and middle-drag orbit), reset after combined movements, pointer isolation over the panel/context-menu behavior, and resizing/readability/console checks on development and production preview. This is user-reported validation, separate from the agent checks above.
- No ignition, simulation reset, fire, agents, compass presets, or other simulation features were added. `R` resets the camera only. Camera behavior during future ignition mode remains undecided; MVP ignition count remains one.
- Full MVP performance target is unmeasured. The user accepted the current bundle-size warning as a non-blocking issue for this stage. Keep build warnings visible; do not change thresholds or suppress warnings solely to silence it. Mention this warning again in handoffs only if it materially changes, affects performance/loading, or becomes relevant to release review.
- The user authorized the reviewed Increment 2 checkpoint: `feat: add bounded camera navigation and controls hints`. No application code changed during closeout. Next task: agree on the next bounded increment and acceptance criteria; do not start another feature during this closeout. No push, publication, or deployment.

## 2026-10-04 — Increment 3: fixed MVP map

### Acceptance criteria and changes

- Replace the demonstration cube with a deterministic flat 64x64 map containing explicit start/safe areas, two initially connected corridors, vegetation, and blocked ground. Keep fuel and walkability independent.
- Separate logical layout in `src/world/` from rendering; use shared geometry/instancing. Preserve controls and hints, adapt framing/bounds/reset to the map, and add a legend.
- Verify dimensions, determinism, endpoints, and BFS connectivity under each route cut and both cuts. Run camera regressions and build; inspect browser appearance/resizing/reset/console. Leave uncommitted pending human validation.
- Read rules, requirements, and progress; confirmed clean Git status and Increment 2 committed as `7b4d189` on `main`. No unrelated work was present.
- Added `src/world/createFixedMap.js` and `src/world/isConnected.js`. Cells are plain data with terrain, fuel type, and base walkability. Grid cell size is 0.5; rendered map is 32x32 world units.
- Start `(9,32)` and safe zone `(54,32)` connect via upper Route A and lower Route B, with four-cell-wide corridors and side stems. Only these corridors/zones are walkable. Central/border gray ground and green brush are blocked, so neither can bypass the two routes.
- A continuous vegetation patch X 27–36 / Z 20–47 carries brush off-route and grass on-route. Designated future hazard cuts span X 30–33 / Z 22–25 (A) and X 30–33 / Z 42–45 (B). No ignition markers or hazard behavior are present. README records full coordinate assumptions and future route-blocking/restoration cases.
- Added `src/rendering/createMapView.js`: one 4096-instance tile batch plus brush, grass, and sparse rock batches; four locally drawn text sprites label START, SAFE, and routes. Built-in geometry only; no downloaded assets or dependencies. Rendering reads but does not mutate logical cells. Geometry/material/texture/instance buffers are disposed during hot replacement.
- Updated initialization and scene rendering to consume the map. Camera bounds scale with the 32-unit map: minimum distance 16, pan target ±8 on X/Z, 15–75-degree polar limits retained. Maximum distance and saved initial/reset view use a fit of the bounding sphere to viewport aspect. Resize refits an untouched initial view, retaining navigated views subject to bounds; `R` fits the current viewport.
- Added map legend, resized on-map text for readability, and preserved the controls panel. No terrain elevation, water, bridges, building interiors, fire behavior, moving agents, A*, or weather controls.

### Actual checks

- `npm.cmd test`: all 9 tests passed (existing camera tests, responsive map framing/bounds/reset test, and 5 map tests).
- Verified dimensions/4096 independent cell objects, deterministic creation, valid walkable fuel-free endpoints, out-of-range lookup, and all four fuel/walkability combinations.
- BFS checks on temporary clones: initially connected; blocking only A leaves B connected; blocking only B leaves A connected; blocking both disconnects safety; reopening either restores connectivity. Displayed/original map remains unchanged and connected. BFS rejects blocked endpoints and does not infer walkability from fuel.
- Final `npm.cmd run build`: passed, 12 transformed modules; HTML 1.57 kB, CSS 1.65 kB, JavaScript 570.79 kB minified / 142.27 kB gzip. Existing accepted warning remains visible with unchanged thresholds and no suppression.
- Agent browser inspection on existing development and rebuilt production preview confirmed start/safe markers, both routes, vegetation, obstacles, legend, and controls hints. Wheel zoom and `R` reset worked; the default complete overview refitted at 1280x720, 360x640, and 640x360. Checked canvas/drawing-buffer dimensions at 640x360 and restored the normal viewport. Enlarged labels following initial visual inspection, then rebuilt and verified final production labels and narrow-window reset.
- Development and production browser console inspections returned no warnings/errors. No physical right/middle drag check was performed by the agent; automated camera tests and pending manual validation cover these.
- Reviewed tracked and new map/rendering/test files and documentation diffs; whitespace checks passed. No dependency or requirements changes, unrelated edits, staged files, or new commit. Latest checkpoint remains `7b4d189`.

### Human validation and next task

- The user reported that the Increment 3 manual checklist looked acceptable and physical panning worked. The map is understood as an intermediate test layout. This is user-reported feedback, separate from automated/agent inspection; the subsequent framing refinement below awaits a quick visual check.
- Full MVP performance target remains unmeasured: there are no moving agents or fire simulation, and no repeatable 60-second stress measurement was performed.
- Browser tooling cannot physically right/middle-drag; camera event tests cover those bindings. Physical panning on the map was subsequently reported as working by the user.
- Leave this increment uncommitted. Next: address map validation findings and checkpoint when authorized; do not begin fire/agent implementation. No push, publication, or deployment.

### Initial/reset framing refinement following user feedback

- Acceptance: frame START, SAFE, both routes, and vegetation more closely with comfortable margins; initial load and `R` match, important markers remain visible at typical desktop sizes, and navigation bounds/controls remain unchanged. Map logic, assets, and simulation scope are unchanged.
- Rendering derives a useful framing rectangle from existing start/safe areas and vegetation bounds, with extra space for text/margins: 29×16 world units centered at `(0,0,1)`. Camera fit uses this smaller area's bounding sphere; saved reset position includes the same target offset. Maximum zoom-out distance continues to use the original full-map fit. Minimum distance, pan bounds, polar limits, bindings, and resize behavior are preserved.
- `npm.cmd test`: all 10 tests passed. Added projected-area visibility checks at 1280×720, 1440×900, 640×360, and 360×640, unchanged navigation limits, and exact position/target reset after combined pan/orbit. Existing map/BFS checks pass.
- `npm.cmd run build`: passed, 12 modules; JavaScript 571.22 kB minified / 142.44 kB gzip. Existing accepted build warning remains visible without threshold changes.
- Browser checks: production preview at all four sizes above; all important markers visible with margins and unobscured at both desktop sizes and 360×640. At 640×360, the unchanged legend can overlap part of START; small-window overlay layout was left unchanged as this refinement is limited to framing. Proportions and responsive framing remained correct. Wheel zoom followed by `R` produced a byte-identical screenshot to initial load at 1280×720. Development view matched; both browser consoles returned no warnings/errors. Temporary viewport override restored.
- Updated README framing description and recorded user feedback. Reviewed the diff and whitespace checks; all Increment 3 work remains unstaged and uncommitted on checkpoint `7b4d189`. No full MVP performance measurement was performed.
- Next: user quick visual check of closer framing, resize, and reset; checkpoint only when authorized. No new feature, push, or deployment.

### Increment 3 closeout

- Final user-reported validation: the revised camera view frames the useful map area more closely; panning works; resizing works. The earlier validation record above is retained. This report does not claim additional user checks of reset, console errors, or production preview.
- The user authorized the Increment 3 checkpoint: `feat: add fixed two-route MVP test map`. Reviewed Git status and the map, rendering, camera-framing, test, and related documentation diffs; no unrelated work was present. Whitespace checks passed. No application code changed during closeout; the recorded 10 passing tests and successful production build remain the latest automated results.
- Full MVP performance target remains unmeasured. The small 640×360 legend overlap noted above remains an issue for later UI review.
- Next task: agree on the next bounded increment and acceptance criteria with the user. Do not begin another feature during closeout. No push, publication, or deployment.

## 2026-10-04 — Increment 4: single-point ignition, burnout, cooling, reset

### Acceptance criteria and changes

- Explicit placement toggle/crosshair, one movable eligible ignition marker before starting, fuel-free rejection without mutation, Start fire validity/placement lock, and simulation reset preserving camera. All camera controls remain available; panels and camera gestures do not place ignition.
- Independent plain fire state in `src/simulation/`: unburned → burning → burned-hot → burned-cool, fuel exhaustion, hazardous burning/hot states, cooled hazard removal with base walkability retained, no reignition. Fixed simulation steps with capped long-gap catch-up; one demonstration configuration. No neighboring spread, agents, or weather.
- Read AGENTS, requirements, and progress; confirmed clean working tree on `main` at expected Increment 3 checkpoint `f30222b`. No unrelated work present.
- Added `fireConfig.js` and `createFireSimulation.js`. Each simulation owns copies of initial fuel/state/walkability, with reset restoring copies rather than mutating authored map data. Only the selected cell advances. Configuration: grass fuel 4, brush 6, consumption 1 unit/second, cooling 5 seconds, fixed step 50 ms, maximum accumulated frame contribution 250 ms. Demonstration values, not calibrated wildfire physics. Excess long-gap wall time is discarded.
- Added ground-plane raycasting in `src/rendering/createGroundPicker.js`; picking uses current camera matrices and canvas rectangle, then floors to logical grid coordinates. Decorative geometry cannot intercept it. Added `src/ui/createIgnitionControls.js` with button/status handling, primary mouse click guards, drag threshold, modifier/button exclusion, cleanup, and explicit placement mode.
- Updated initialization/render loop to pass elapsed time to the independent model. Rendering updates changed tile colors and affected vegetation instance matrices; exhausted decoration disappears and returns on reset. One purple ring denotes selection; orange/red/dark-gray raised indicators distinguish lifecycle states. No map layout, dependency, or camera-bound changes.
- Added HTML fire controls/status/legend and compact responsive CSS. Existing map legend now receives pointer events instead of passing clicks to the canvas. Short panels scroll to keep controls/legends accessible. Browser inspection found OrbitControls' inline cursor overrode CSS; placement now updates that inline cursor explicitly.
- Clarified approved single-ignition interaction in requirements without changing original simulation scope, acceptance scenarios, or Assignment 2 submission. Updated README with controls, configuration/time policy, state/render separation, and manual checklist.

### Actual checks

- `npm.cmd test`: all 18 tests passed (10 existing map/navigation checks plus 6 simulation tests and 2 picking/UI interaction tests).
- Covered eligibility/invalid selection without state mutation, single movable selection/start lock, both fuel durations, exact exhaustion and cooling boundaries, hazardous-state removal with original walkability, no spread/reignition, configurable cooling, reset during/after a run, repeatable outcomes, and unchanged original map.
- Compared identical state/fuel/timers after ordinary intervals at 20/30/60/144 FPS. A 120-second gap contributed only 250 ms, then the next step advanced normally; invalid/nonpositive time intervals were ignored. Tests verify accumulator reset and no remaining catch-up backlog.
- Actual Three.js raycasting tests projected known cells through cameras with zoom, translated targets, orbit, canvas offsets, and desktop/narrow aspects; recovered the expected grid indices and rejected out-of-canvas input. Initial test fixture placed a point off-screen in a narrow camera; corrected the fixture to a visible view and reran successfully.
- Consulted official Three.js [Raycaster](https://threejs.org/docs/pages/Raycaster.html), [Ray ground-plane intersection](https://threejs.org/docs/pages/Ray.html), and [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) APIs for picking and instance updates.
- Event-based UI checks cover off/on toggle, crosshair, disabled Start fire, valid replacement/invalid rejection, right/middle/modifier/touch exclusions, left-drag rejection, cancellation when wheel zoom occurs during a pending click, panel isolation, start lock, reset-to-off, and listener cleanup. Actual installed OrbitControls tests continue to pass.
- Final `npm.cmd run build`: passed, 16 modules; HTML 2.57 kB, CSS 2.92 kB, JavaScript 578.36 kB minified / 145.05 kB gzip. Existing accepted bundle warning remains visible; no threshold changes or suppression.
- Browser checks on existing development and rebuilt production preview: initial disabled Start fire, placement/crosshair, fuel picking after wheel zoom, one-marker replacement, invalid-cell rejection, mode-off clicks, panel click/wheel isolation, right/middle clicks and left-drag exclusion, start locking, orange burning/red burned-hot/dark burned-cool visuals, unchanged neighboring cells, reset restoring appearance/selection/off mode and allowing another run. Visually confirmed zoomed camera framing remained unchanged by simulation reset; `R` restored responsive camera framing without clearing the fire state.
- Checked 1280×720, 360×640, and 640×360 layouts; viewport/canvas/drawing buffer matched in the narrow view. Short-window legends use scrollable panels. Restored viewport override. Both development/production console inspections returned no warnings/errors.
- Browser automation cannot perform physical right/middle drags. Picking after physical pan/orbit remains pending human validation; automated mathematical camera/picking and controls tests cover those transformations/bindings. Browser timing wait sometimes expired before burnout; direct subsequent inspection confirmed red burned-hot, with cooling separately observed. No full MVP performance target was measured.

### Human validation, remaining issues, and next task

- Increment 4 human validation is pending; use the README checklist. All checks above are agent/automated results, not user-reported validation.
- Only the selected cell burns. Neighboring spread comes next after this increment is validated and the next bounded task is authorized. No agents, weather, advanced flames/smoke, assets, or new dependencies added.
- Reviewed tracked diffs and new simulation/UI/picking/test files; `git diff --check` passed. All Increment 4 work remains unstaged and uncommitted on `f30222b`; no unrelated work was changed. No push, deployment, or next feature during this task.

### Increment 4 validation follow-up

- User-reported checks passed: moving the single marker; rejection of nonburnable ground; camera/selection interactions from checklist item 2; reset during and after burning, restoration and preserved camera; camera reset; resizing; and no observed errors. This confirms the previously pending physical camera/selection validation. Do not infer additional user lifecycle/color checks from this report.
- Investigated reported cells `(32,41)` and `(32,43)`. `(32,41)` is vegetation with brush fuel, initial fuel 6, base walkability false, grid index 2656. Its ground center is `(0.25,0,4.75)`, footprint X 0–0.5 / Z 4.5–5.0. `(32,43)` is Route B with grass fuel, initial fuel 4, base walkability true, index 2784. Its ground center is `(0.25,0,5.75)`, footprint X 0–0.5 / Z 5.5–6.0.
- The vegetation patch contains continuous logical fuel; brush/grass models are deliberately sparse and placed only at even X and even Z. Both reported cells have odd Z, so neither has its own decorative fuel model. Ignition between those models is intentional. Model gaps do not remove fuel or determine base walkability.
- Added `tests/firePresentation.test.js`, exercising the actual Three.js map objects, ground raycasting, simulation, and UI refresh with a text-canvas/DOM event stand-in. Confirmed each reported ground center projects and picks back to the same logical cell, matches the tile instance matrix, and shares X/Z with selection and lifecycle indicators. Ring center Y is 0.55; fire indicator center Y is 0.325 (bottom on ground, top 0.65). No picking/rendering mismatch found, so no runtime or visual fix was made.
- Verified each reported cell's full `unburned → burning → burned-hot → burned-cool` progression. Status text matches the active cell/state; tile and raised indicator colors match legend swatches: orange `#ff8a20` burning, red `#d33138` burned-hot/cooling, dark gray `#4e5663` burned-cool. Burning and burned-hot are hazardous; fully cooled is not. At cooling completion both remaining fuel and hot timer are zero; exhausted fuel remains ineligible for ignition.
- For traversal eligibility, base walkability must be combined with absence of a fire hazard: `cell.walkable && !isHazardous(cell)`. The test confirms `(32,43)` is unavailable while burning/hot and eligible again after cooling; `(32,41)` remains blocked after cooling because its base walkability is false. This verifies state eligibility, not actual agent movement or pathfinding; no agents added.
- `npm.cmd test`: all 19 tests passed, including the new presentation/position/legend/hazard check and all existing regressions. Only verification and progress documentation changed in this follow-up; the application build is unchanged from the last successful Increment 4 build. Reviewed follow-up diff and passed whitespace checks.
- User dislikes the purple selection ring. Recorded as a deferred visual refinement; ring appearance is unchanged and no redesign is approved/implemented in this follow-up.
- Remaining human recheck: observe red hot/cooling changing to dark gray fully cooled, with matching status, in one uninterrupted active-tab run. Brush burns for 6 simulated seconds plus 5 cooling; route grass burns for 4 plus 5. Long frame gaps drop excess wall time, so suspended/background runs can take longer in real time. Earlier passed user checks are retained without claiming this lifecycle recheck passed.
- Increment 4 remains unstaged and uncommitted on `f30222b`. Full MVP performance remains unmeasured. No push, deployment, or next feature.

### Increment 4 completed and validated — session break

- Final user-reported validation: the user watched an uninterrupted run reach dark gray with `burned-cool` status. This completes the remaining lifecycle visual check alongside the previously recorded marker movement, invalid-ground rejection, camera/selection interactions, reset during/after burning and restoration, preserved camera/camera reset, resizing, and no observed errors. Agent/automated verification remains separately recorded above.
- Increment 4 is completed and validated. Only the selected cell burns; no agents or neighboring fire spread are implemented yet. Next increment: neighboring fire spread, with bounded acceptance criteria to be supplied/agreed before implementation. No next feature started during this closeout.
- Retain deferred visual feedback: replace/refine the purple ignition-selection ring; make grass, brush, and tree-covered fuel areas visually distinguishable. Current logical fuel can occupy decorative gaps, as verified above. This is deferred visual direction, not a new tree fuel type or simulation change; no visual redesign or simulation logic changes made during closeout.
- Known issues: accepted non-blocking bundle-size warning remains visible with unchanged thresholds; narrow/short panels may require scrolling; long frame gaps intentionally discard excess time and can lengthen wall-clock runs. Full MVP performance is unmeasured: no 20-agent, repeatable 60-second performance scenario has run.
- Closeout review: Git status/diff contains only Increment 4 application, tests, and related documentation; preserve unrelated work. Latest automated results are 19 passing tests and the successful production build recorded above. No runtime code changes during closeout, so no additional build/test run required. User authorized commit `feat: add single-cell ignition and fire lifecycle`.
- Stopped only the existing FireFront development/preview execution sessions using Ctrl+C. Verified their project-specific Vite/npm processes ended and ports 5173/4173 have no listeners; unrelated Node processes were not terminated. No push or deployment.

Restart development in a fresh PowerShell terminal:

```powershell
Set-Location -LiteralPath 'C:\Users\karmv\Desktop\USA\Rutgers\Fall 2026\AI for Visual Compute\FireFront'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/`. Restart production preview in a separate fresh PowerShell terminal, rebuilding first:

```powershell
Set-Location -LiteralPath 'C:\Users\karmv\Desktop\USA\Rutgers\Fall 2026\AI for Visual Compute\FireFront'
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/`. Existing dependencies are installed; on a fresh checkout without `node_modules`, run `npm.cmd ci` before the commands above. Stop either server with Ctrl+C. Resume by reading AGENTS, requirements, this log, and Git status; proceed only with the next agreed neighboring-spread increment.

## 2026-10-07 — Increment 5: neighboring fire spread (human validation pending)

### Acceptance and implementation

- Read AGENTS.md, requirements, and this log; initial Git status was clean on main at `9daf155` (`feat: add single-cell ignition and fire lifecycle`). No unexpected work needed preservation or reset.
- Added deterministic four-edge-neighbor exposure to the independent simulation. Each burning neighbor contributes 1 exposure unit per simulated second; threshold is 1 unit. Incomplete exposure resets when no burning source remains. Fuel quantity affects burn duration only; grass and brush have the same ignition threshold. Only burning cells spread; nonfuel gaps, diagonals, hot/cooled cells, and exhausted fuel cannot transmit/reignite.
- Every 50 ms step snapshots burning sources before changing any states and applies new ignitions together after evaluation. Newly ignited cells keep full fuel and cannot spread until the next step. A source burning at step start contributes even if it exhausts during that step. Existing 250 ms frame contribution cap remains; long suspension discards excess time rather than making a large catch-up jump.
- Kept demonstration parameters together in fireConfig: grass 4 fuel, brush 6 fuel, consumption 1 per second, cooling 5 seconds, exposure rate 1 per neighbor per second, threshold 1. These simplified deterministic four-neighbor rules are not calibrated wildfire physics.
- Updated rendering to one shared instanced batch for all affected fire indicators, with partial tile/indicator/decoration buffer updates. Reset restores every affected cell, initial fuel, exposure, timers, selection, and placement-off state without changing the authoritative map or camera. Replaced obsolete single-cell UI wording. Status still reports the original selected cell, not completion of the entire fire.
- No map/layout, camera bindings/bounds, assets, dependencies, marker design, or Assignment 2 submission changed. Single user ignition remains the scope. No agents, weather, procedural generation, particles, or additional feature implemented.

### Actual automated and agent checks

- `npm.cmd test`: 27/27 passed. Added checks for delayed ignition and multiple sources, equal ignition delays for different fuel quantities, diagonal/nonfuel/row-edge barriers, incomplete exposure reset, no hot/cool spread or reignition, no same-step cascade, and full fuel on new ignition.
- Compared each step of a mixed-fuel grid with its reflection (reverse logical cell visitation) for 300 steps: identical results. Reset/replay matches at 20/30/60/144 FPS over ordinary intervals; exposure, timers, and states clear and map data remains unchanged. Existing long-gap, picking, controls, lifecycle, presentation, eligibility, and map connectivity tests pass. Indicator-position assertions allow normal float32 matrix precision.
- Fixed-map propagation test confirms both designated route sections become fully hazardous and all fuel eventually cools without modifying map data. Suggested ignition `(32,32)`: first neighbor at 1 simulated second; first hazardous cell in A's designated section at 7 seconds and B's at 10; complete designated sections hazardous at approximately 10.1 and 13.1 seconds. All 280 fuel cells are burned-cool by approximately 26.25 seconds. These are deterministic simulation timings, not performance measurements or evidence of agent rerouting.
- `npm.cmd run build`: passed (16 modules; JavaScript 579.33 kB minified / 145.34 kB gzip). Existing accepted bundle warning remains visible; thresholds unchanged and no suppression.
- Browser checks on development and rebuilt production preview: initial placement/start gating, picking central fuel `(32,34)`, visible propagation across the patch onto both route fuel areas, sequential orange/red/dark-gray states, original-cell status reaching burned-cool while other cells remain active, reset during spread restoring map/indicators/selection/off mode, and replay. Development reset preserved framing; camera-only R did not clear fire state. Console inspections in both tabs returned no warnings/errors.
- Production preview visually checked at 1280x720, 360x640, and 640x360: map and controls remain visible; short panels scroll. Temporary viewport override restored. This browser interface cannot perform wheel or physical right/middle drags, so fresh zoom/pan/orbit interaction checks remain on the human checklist; existing automated controls and mathematical picking tests passed. No claim of those physical checks in this increment.

### Handoff, known issues, and next task

- Increment 5 is implemented, **uncommitted and pending human validation**. Use the Increment 5 checklist in README: select `(32,32)`, observe propagation/burnout/cooling, check the single ignition restriction, reset/replay during spread with camera preservation, camera gestures/R, resizing, production preview, and console. Keep the tab active; background suspension can lengthen wall-clock timings.
- Deferred visual feedback retained: replace/refine the purple selection ring; distinguish grass, brush, and tree-covered fuel areas. Decorative gaps intentionally contain logical fuel, previously verified. No redesign or new tree fuel type implemented.
- Known limitations: simplified deterministic four-neighbor physics; original-selection status is not a global fire-completion indicator; narrow/short panels may scroll; long frame gaps intentionally drop excess time. Accepted bundle warning remains non-blocking. Full MVP performance remains unmeasured; no 20-agent, repeatable 60-second target scenario has run. No agents or rerouting implemented.
- Development server is running at `http://127.0.0.1:5173/`; rebuilt production preview at `http://127.0.0.1:4173/`. Restart from this project folder with `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`; production: `npm.cmd run build` then `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Stop each server with Ctrl+C. Exact folder-changing commands remain in the preceding session-break entry.
- Reviewed Git status, tracked diffs, and new spread tests; whitespace check passed. Only Increment 5 simulation/rendering/UI wording, tests, and related documentation changed. Nothing staged or committed; no push/deployment. Next task is human validation and requested fixes/closeout, not another feature.

### Increment 5 feedback — minimal fuel coverage clarification (visual recheck pending)

- User-reported feedback: the checklist mostly passed, but fuel appearance remained misleading. Specific passed checklist items were not identified; do not record all checks as passed. Increment 5 remains uncommitted and awaits the requested visual recheck.
- Ground treatment now follows each cell's fuelType rather than terrain alone: dark green for brush fuel, light green for grass fuel (including the entire route crossings), and yellow for nonfuel road. Coverage fills each logical cell even where no decorative model exists. Burning/hot/cooled colors still override the initial ground treatment; reset restores the correct fuel-based color for every affected tile.
- Clarified the visible legend with nonfuel road, grass-fuel crossings, and blocked brush; ground color indicates fuel coverage and decorative models do not define ignition boundaries. The expanded legend scrolls at narrow sizes so it does not obscure the route markers. Updated README accordingly.
- Added an actual Three.js rendering check comparing all 4096 tile colors and positions with the authored fuel classifications and simulation eligibility. Confirmed full cell-sized tile coverage and both crossing edges: X 26/37 remain nonfuel yellow; X 27/36 are grass green at Z 23 and 43. Existing reset/presentation checks confirm affected grass/brush tiles restore their fuel ground colors. Map data remains unchanged.
- `npm.cmd test`: 28/28 passed, including all existing spread, lifecycle, reset, timing, controls, picking, and connectivity regressions. `npm.cmd run build`: passed; final HTML 2.78 kB, CSS 3.04 kB, JavaScript 579.40 kB minified / 145.37 kB gzip. Existing accepted warning remains visible, with no threshold adjustment or suppression.
- Agent browser checks: development and rebuilt production preview show continuous light-green crossings between yellow road and dark-green brush, with the clarified legend. Checked the final 360x640 preview: route markers remain visible and the longer legend scrolls; restored temporary viewport override. Both console inspections returned no warnings/errors. These are agent checks, not further user validation.
- Follow-up changes are limited to rendering colors/reset restoration, HTML/CSS legend, presentation tests, and README/progress. Fuel data, walkability/connectivity, map layout, spread/lifecycle rules, camera controls, dependencies, and assets were not changed in this follow-up. Reviewed Git status/diff and passed whitespace checks; previous uncommitted Increment 5 work preserved.
- Purple selection-marker redesign remains deferred. Broader decorative fuel-model/tree-covered appearance refinement also remains deferred; this change only clarifies grass/brush ground coverage. No full MVP performance measurement claimed. No commit, push, or deployment.
- Short visual recheck at http://127.0.0.1:5173/ (or rebuilt preview http://127.0.0.1:4173/): identify continuous light-green grass crossings on both routes and dark-green brush; confirm yellow road rejects ignition while green gaps between models accept it; run fire/reset and confirm green coverage restores; check legend readability/scrolling at a narrow size. Await this feedback before closeout.

### Work-in-progress preservation before environment correction

- User requested preservation checkpoint `wip: preserve fire spread before environment correction`. Increment 5 implementation and minimal ground clarification are saved as work in progress, not fully user-validated. The user only reported that the checklist mostly passed; detailed validation and the latest visual recheck remain incomplete.
- The next authorized task corrects the artificial burnable road crossings and introduces separate nearby-burning navigation hazards, without agents or a visible hazard overlay. Historical results above describe the previous layout and must not be treated as validation of the upcoming correction. No push or deployment.

## 2026-10-07 — Environment correction and nearby-fire navigation hazards (human validation pending)

### Preservation, reason, and approved layout

- Read AGENTS, requirements and progress; initial changes were the known Increment 5 implementation/visual follow-up. Reviewed status/diff and saved only that work and related documentation as `f66a32a` — `wip: preserve fire spread before environment correction`. Increment 5 is not fully user-validated: the user reported only that the checklist mostly passed, with unspecified individual results. No push/deployment.
- Artificial grass road crossings were a test-layout shortcut, not the intended environment. Roads are now continuous bare nonfuel cells and cannot ignite/transmit spread. Ground uses one representative grass, brush or forest classification per cell, separate from walkability, with no layered simulation.
- Explained the geometric obstruction before changing the layout: a one-cell buffer cannot close a four-cell-wide road. The user explicitly approved two short local one-cell-wide passages. At X 30–33, A retains road at Z 24 and B at Z 43; grass sits on their inner side at Z 25 / 42, with blocked nonfuel shoulders outside. Other road corridors and start/safe locations remain. All off-path ground remains blocked; no escape shortcut or procedural generation.
- Connected fuel is X 27–36 / Z 26–41, with grass extensions X 30–33 at Z 25 and 42. Interior brush is X 27–30 / Z 28–39; forest X 31–36 / Z 28–39; remaining fuel is grass. The roads split no required fuel connection: this interior patch reaches both road-adjacent extensions from one ignition.

### Implementation and rule

- Added pure `src/simulation/getNavigationHazards.js`: burning and burned-hot cells are unsafe themselves; only burning cells mark their eight immediately surrounding cells unsafe, exactly one cell including diagonals. Recompute from current states so overlapping sources remain effective until all clear and reset cannot leave stale buffers. No mutation of fuel, exposure, fire state or authoritative map.
- Extended the existing BFS helper with an optional unsafe mask while always requiring base walkability. This is validation/data logic, not agents or A*. Cooling never opens blocked vegetation; a cooled cell may remain inside another burning source's buffer. Precautionary hazards do not imply death or loss conditions.
- Existing four-edge-neighbor snapshot/exposure spread is unchanged. Forest adds 10 fuel units versus existing grass 4 / brush 6. At consumption 1 per simulated second, burning lasts 4/6/10 seconds, followed by 5 seconds cooling. Higher fuel does not ignite faster: exposure rate 1 per burning neighbor per second and threshold 1 stay equal. Values are illustrative, not calibrated wildfire physics; fixed-step/long-gap handling retained.
- Rendering now distinguishes light-green grass/tufts, medium-green brush/low polyhedral shrubs, and dark-green forest-floor fuel with trunk/cone trees. Brush no longer uses tree-shaped cones. Trunks and crowns share instanced batches and both hide/restore with exhaustion/reset. Full ground tiles show coverage between models; no vegetation models on bare roads. Updated existing legend; cooled means no direct hazard, not immunity to neighboring buffers. No hazard overlay or extra UI added.
- Preserved ignition selection/start lock, UI isolation, camera controls and camera-only R. Simulation reset restores initial fuel, fire/exposure/timers and vegetation, clears derived hazards, and preserves camera. Purple-marker redesign and richer assets/effects remain deferred.

### Actual checks and useful scenarios

- Final `npm.cmd test`: 34/34 passed. Tests cover all road cells' nonignitability/zero fuel, ground colors/positions and shrub/tree classification, buffer boundaries/diagonals/corners without wrapping, hot-only hazard, overlapping source clearance, base walkability after cooling, reset/replay, initial two-route connectivity, no shortcut across both cuts, and hazard-dependent BFS. Existing spread iteration-order, fixed-step/render-rate, long-gap, lifecycle, picking, camera and UI regressions pass.
- Updated tests that depended on burnable road crossings. Initial run found one stale UI-test selection coordinate on a now-nonfuel road; changed the fixture to grass `(31,26)` and reran successfully. Actual Three.js presentation tests exercise grass/brush/forest through full lifecycle and verify all decoration matrices restore, including both forest components. Tests confirm map data is not mutated.
- Single ignition `(32,32)` (forest): at 7.5 simulated seconds, road passage cells X 30–33 / Z 24 are unsafe; BFS with A isolated is disconnected, B isolated is connected, and start-to-safety remains connected. At 10.5 seconds, X 30–33 at both Z 24 and Z 43 are unsafe; BFS confirms both routes unavailable and start disconnected from safety. All roads remain unburned with zero fuel/exposure throughout. A complete four-cell passage being unsafe is stronger than the single-cell cut needed to close these one-cell-wide roads.
- A 50 ms timing trace found the full designated A passage unsafe at 7.05 seconds and full B passage at 10.05 seconds. Global connectivity disappears at 10.0 seconds (a partial lengthwise cut already closes B) and returns at 11.1 seconds when A becomes usable again; the selected 7.5/10.5 snapshots explicitly verify the requested scenarios. Nearby hazards can also affect other road-edge cells; the stated passage coordinates are representative complete cuts, not the entire unsafe mask.
- Optional separate ignition `(32,25)` (grass) makes A's full designated passage unsafe at 1 second while B remains reachable. It need not close both simultaneously; reset before a new ignition. Both routes reconnect and all derived hazards are clear by the tested 45-second endpoint for the `(32,32)` run. All timings are simulated seconds, not calibrated physical times or measured performance.
- Final `npm.cmd run build`: passed (16 modules; HTML 2.85 kB, CSS 3.07 kB, JavaScript 580.02 kB minified / 145.59 kB gzip). Accepted bundle warning remains visible with unchanged threshold. No dependencies added.

### Validation and handoff

- New correction is uncommitted; human validation pending. Previous partial Increment 5 feedback is retained, not upgraded to full approval. No agents, death/loss, off-path escape, weather, procedural generation, particles or full MVP performance measurement implemented/claimed.
- Browser checks and final Git review are recorded below after verification. Next task is the corrected-environment manual checklist and any requested fixes/closeout; no next feature authorized here.
- Development remains at `http://127.0.0.1:5173/`; rebuilt production preview at `http://127.0.0.1:4173/`. Restart from this folder: `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`; production: `npm.cmd run build`, then `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Stop each with Ctrl+C. See the earlier session-break entry for exact Set-Location commands.
- Final agent browser verification on development and rebuilt preview: recognizable grass/low shrubs/forest trees, continuous yellow bare roads, road ignition rejection, grass `(32,26)` / brush `(29,32)` / forest `(32,32)` selection with a single movable marker, start locking, visible vegetation propagation followed by cooling while roads remain yellow, reset during active spread and after cooling, restoration of all vegetation, and replay. Wheel zoom worked; simulation reset preserved the zoomed camera, and R returned framing without clearing active fire. Existing automated UI-isolation/picking/control tests pass. Physical right/middle drags remain a human recheck; no claim of fresh physical pan/orbit validation.
- Checked desktop and final 360x640 production layout: route markers and controls visible, expanded legend scrolls; restored viewport override. Both browser consoles returned no warnings/errors. Hazard buffers intentionally have no visible overlay and were verified through simulation/BFS tests, not inferred from visuals. Screenshot saved outside the repository for handoff.
- Changed files for this correction: `src/world/createFixedMap.js`, `src/world/isConnected.js`, new `src/simulation/getNavigationHazards.js`, `src/simulation/fireConfig.js`, `src/rendering/createMapView.js`, `index.html`, `src/styles.css`; updated tests `firePresentation.test.js`, `fireSimulation.test.js`, `fireSpread.test.js`, `fixedMap.test.js`, `ignitionInteraction.test.js`, and new `navigationHazards.test.js`; plus README, requirements and this progress log. No changes to spread implementation, package manifests/dependencies, camera/UI implementation, or original assignment submission.
- Final review: Git diff/whitespace checks passed; only the authorized correction and related tests/docs remain unstaged and uncommitted on WIP checkpoint `f66a32a`. Prior work is preserved in that checkpoint. No push/deployment. Human approval of the corrected environment remains pending; full MVP performance is unmeasured.

## 2026-10-08 — Increment 5 closeout

- Final user-reported checks: bare yellow road rejects ignition; grass, brush and forest accept ignition; reset restores the scene; physical pan/orbit work. Earlier validation remains as recorded. Invisible safety-buffer/connectivity results were automated and are not claimed as user visual confirmation.
- User accepts the current layout for functional development, not as final visual design. Abrupt road-width changes near vegetation are deferred presentation feedback alongside purple-marker redesign and richer assets/effects.
- Reviewed Git status/diff: only the known Increment 5 environment correction, tests and related documentation. Latest automated verification remains 34 passing tests, successful production build and whitespace check; only closeout documentation changed since those checks. Authorized checkpoint: `feat: distinguish vegetation and nonburnable road hazards`. No push/deployment.
- Increment 5 is closed out with the above specific user validation and separately documented automated hazard checks. Next authorized task: Increment 6 basic evacuation agents; loss behavior remains a follow-up and full MVP performance unmeasured.

## 2026-10-08 — Increment 6: basic evacuation agents (human validation pending)

- Increment 5 checkpoint completed: `37adf4c` — `feat: distinguish vegetation and nonburnable road hazards`. The working tree was clean before Increment 6. No push/deployment.
- Acceptance for this increment: 20 visible waiting agents; Start fire starts evacuation; deterministic four-neighbor A* respects base walkability and current hazards; relevant route closures trigger replanning/turning back; trapped agents retry when hazards change; reset restores all agents/fire while preserving the camera. Four live counts must sum to 20. Increment 6 remains uncommitted pending human validation.

### Implementation and student explanation

- New `src/agents/findPath.js`, `createAgentSimulation.js`, and `agentConfig.js` keep navigation/state independent of Three.js/DOM. A* compares estimated total path cost, Manhattan distance, then cell index to resolve ties consistently. Normal paths never enter blocked, burning, hot or buffered cells. Illustrative speed is 2 cells per simulation second (1 world unit/second); this is not a measured human evacuation speed.
- Agents spawn at cell centers X 7–11 / Z 30–33 within START. Movement follows axis-aligned segments between centers; logical occupancy is the cell containing the continuous position, which rendering reads directly. A changed relevant hazard invalidates the remaining path. An agent partway through a segment centers inside its currently occupied cell before replanning, avoiding teleportation or blindly entering an unsafe next cell. Paths are not recomputed every rendered frame.
- An already-buffered occupant may use an emergency BFS exit through walkable buffer cells toward the nearest safe cell, excluding directly burning/hot cells. Normal evacuation then resumes with A*. This exception does not allow safe agents to plan through buffers. A directly burning/hot occupant temporarily stops as trapped and retries after clearance; this is an explicit interim behavior, not completed loss handling.
- States are waiting, evacuating, trapped and evacuated. Trapped agents retry on hazard changes; evacuated is terminal until reset. Agents may overlap and all finish at the existing safe-zone center. No crowd avoidance, collisions, off-path escape, abilities or death rule.
- New `src/simulation/createEvacuationSimulation.js` uses one 50 ms clock: fire update → derive navigation hazards → agent decisions/movement → rendering. Existing 250 ms frame cap remains. Reset clears paths, retry state and shared timing and restores initial agent/fire state without moving the camera; R stays camera-only.
- New `src/rendering/createAgentView.js` uses one shared box geometry/material and 20 instances; white waiting, blue evacuating, brown trapped, teal evacuated. New `src/ui/createAgentCounts.js` updates count text only when it changes. Integrated through main/scene, HTML/CSS; endpoint text moved below START/SAFE so it no longer hides the boxes. No map data, fire parameters/rules, hazard rules, dependencies or assets changed. README and requirements explain the approved increment.

### Actual checks and demonstrations

- `npm.cmd test`: **43/43 passed**. New tests cover deterministic valid/absent A* paths, blocked/hazard avoidance, mid-segment turn-back, trapped retry without planning every frame, buffered-occupant escape, direct hot-cell stop/recovery, terminal evacuation, population conservation, reset/replay, continuous render positions/counts, and equivalent fire/agent results at 20/30/60/144 FPS. Long-gap test caps a 120-second gap at 0.25 simulated seconds; reset clears partial accumulated time. Existing map/fire/picking/camera/UI regressions pass.
- Controlled tiny-map hazards test edge cases independently of the authored map. Separately, an integration test uses actual fire on the unchanged map: ignition **(32,32)** initially selects A; agent 0 turns west toward B at **7.1 simulated seconds**; all 20 are trapped at **10.0 seconds**, resume at **11.1 seconds**, and evacuate by 40 seconds. A finer trace measured the final arrival at approximately **39.55 seconds**. These are simulation results, not user-reported validation or full MVP performance measurements. Keep the browser tab active; suspension can extend wall-clock times.
- `npm.cmd run build`: passed (23 modules; HTML 3.33 kB, CSS 3.29 kB, JavaScript 585.24 kB minified / 147.49 kB gzip). Existing accepted build warning remains visible and unchanged in policy.
- Agent browser checks on development and rebuilt production preview: 20 visible waiting boxes; ignition (32,32) starts counts/movement; blue agents visibly follow roads during spread. Development reached Evacuated = 20, followed by reset to Waiting = 20. Production reset during an active evacuation restored fire/agents and retained a wheel-zoomed camera; R restored framing without clearing an active evacuation. No warnings/errors in either inspected browser console.
- Checked production resizing at 360×640 and 640×360: canvas followed viewport dimensions, no horizontal document overflow, count panel remained within viewport; restored temporary viewport override. Physical right/middle drags require human recheck for this increment (previous Increment 5 user validation is retained). The brief all-trapped interval was verified by automated integration, not captured visually in the browser. No additional human checks claimed.

### Pending validation, known issues and resume

- Human Increment 6 checklist: (1) identify 20 boxes in START and Waiting = 20; (2) ignite (32,32), watch departure/turn-back near 7 seconds, brief trapping near 10 seconds, recovery near 11 seconds and all 20 evacuated around 40 seconds; counts always total 20; (3) reset during movement and after completion, confirm restoration/replay and camera preservation; (4) check physical pan/orbit, wheel, camera-only R, resizing, both dev/preview and console. Simulation timings are approximate; invisible buffers have no overlay.
- Remaining required MVP work includes loss handling and further integration/acceptance/performance validation; no full repeatable 60-second performance target has been measured. Overlap at SAFE is expected in this bounded increment. Deferred visuals remain purple-marker replacement, richer assets/effects, and abrupt road-width transitions; the functional layout is not final visual design. No weather/procedural generation added.
- Development and production preview were restarted for this project and are running at `http://127.0.0.1:5173/` and `http://127.0.0.1:4173/`. From the FireFront folder, exact restart commands: `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`; production: `npm.cmd run build` then `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Stop each server with Ctrl+C.
- Reviewed tracked diffs and new agent/integration/test files; whitespace check passed. Only Increment 6 application/test/documentation changes remain unstaged and uncommitted. No push/deployment. Next task is human validation and requested fixes/closeout, not another feature.

## 2026-10-08 — Increment 6 closeout

- Increment 6 completed with user-reported manual validation. Passed: 20 waiting agents were present; ignition at (32,32) produced turn-back, trapping, recovery and evacuation as described; reset worked during movement and after completion, preserving the camera; pan/orbit, zoom, R, resizing and console checks passed. Earlier agent-browser and automated results remain separately recorded; no additional checks or precise user-measured timings are claimed.
- Pending pacing issue: the user finds fire progression too fast and wants a more gradual, readable demonstration. Schedule a focused tuning pass after loss handling, tuning spread, burn duration, cooling and agent speed together while preserving meaningful rerouting/trapping scenarios. No parameters, map data or simulation logic changed during this closeout.
- Loss handling remains required follow-up work; full MVP performance has not been measured. Deferred purple-marker, richer assets/effects and road-width presentation feedback remain recorded.
- Reviewed Git status, tracked diff and new agent/navigation/rendering/UI/integration/tests: only Increment 6 and related documentation are included. Latest verification remains 43/43 passing tests and successful production build; only documentation changed since those checks. Whitespace check passed. Authorized checkpoint: `feat: add hazard-aware agent evacuation and recovery`. No push/deployment or next feature started.
