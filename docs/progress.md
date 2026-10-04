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
