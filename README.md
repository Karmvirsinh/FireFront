# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increments 1–4 established the application, camera navigation, fixed two-route map, and user-validated ignition/lifecycle/reset (`9daf155`). Increment 5 adds deterministic neighboring fire spread and awaits human validation. The canvas resizes with the browser window, with pixel ratio capped at 2. No agents, A*, procedural generation, or weather is implemented.

The intended stack is JavaScript, Three.js, Vite/npm, and HTML/CSS. FireFront is not a validated wildfire prediction tool.

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

- `src/main.js` initializes the map, independent fire simulation, UI, and renderer. Vite hot replacement disposes the previous scene and UI listeners.
- The **scene** contains the instanced map meshes, text markers, background, and lights. Built-in geometries require no external assets.
- The **camera** defines the viewing position and perspective. On resize, its aspect ratio and projection matrix are updated to keep objects proportional.
- The **renderer** draws the camera's view of the scene into the HTML canvas. Its drawing buffer follows the canvas size and uses at most 2 pixels per CSS pixel in each dimension.
- The **animation loop** requests repeated renders through Three.js and passes its timestamp to the application. The application advances the independent simulation in fixed steps and sends changed state to rendering. Cleanup stops the loop and releases geometry, material, and renderer resources.
- `src/rendering/createCameraControls.js` uses OrbitControls from the installed Three.js package. It updates before drawing and removes its pointer, context-menu, and reset-key listeners during cleanup.

## Fixed map data and layout

`src/world/createFixedMap.js` creates a fresh deterministic 64×64 logical grid. Each cell is a plain object with separate `terrain`, `fuelType`, and `walkable` fields; no cell holds a Three.js object. `src/rendering/createMapView.js` reads that data to create four instanced mesh batches (tiles, brush, grass, rocks) and four text sprites. It does not decide connectivity or modify the grid. Cell size is 0.5 world units, so the flat map spans 32×32 units and is centered at the origin.

Grid coordinates are zero-based `(x, z)`; Z increases toward the lower corridor in the initial view. Rectangle bounds below are inclusive:

| Area | Grid coordinates | Meaning |
| --- | --- | --- |
| Start | `(9, 32)`; area X 6–13, Z 28–35 | Blue, walkable, no fuel |
| Safe zone | `(54, 32)`; area X 50–57, Z 28–35 | Teal, walkable, no fuel |
| Route A | X 10–53, Z 22–25 | Upper, shorter corridor; tan except grass crossing |
| Route B | X 10–53, Z 42–45 | Lower alternative corridor; tan except grass crossing |
| Connecting stems | X 10–13 and 50–53, Z 22–45 | Join both corridors to endpoints |
| Vegetation patch | X 27–36, Z 20–47 | Continuous fuel band crossing both routes |
| Route A test section | X 30–33, Z 22–25 | Full corridor width, walkable grass fuel |
| Route B test section | X 30–33, Z 42–45 | Full corridor width, walkable grass fuel |

Only corridors and endpoint areas are walkable. Gray ground is blocked everywhere, even between the sparse rock meshes. Dark-green ground covers every brush-fuel cell; brush is blocked but can spread fire toward the walkable grass crossings. Light-green ground covers every grass-fuel cell across the full route width. Yellow road has no fuel and cannot ignite. The ground treatment follows `fuelType` independently of walkability and decorative model placement; gaps between sparse models are still fuel wherever the ground is green. The legend distinguishes grass crossings from brush and nonfuel road. Decorative geometry does not define fuel boundaries, collision, or walkability.

Future hazard cases: blocking A's designated section must leave B connected; blocking B must leave A connected; blocking both must disconnect start from safety. Reopening either section should restore connectivity. The central blocked area prevents unrestricted shortcuts. `src/world/isConnected.js` is a four-neighbor BFS validation helper, not agent pathfinding. All blocking tests use temporary cloned data; the displayed map remains initially open. Diagonal movement and physical collision are not implemented. Later navigation must honor base walkability and overlay changing hazards; cooling should not make permanently blocked brush/obstacle cells walkable.

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

Toggle **Place ignition** on for a crosshair cursor. An unmodified stationary left mouse click on green brush or grass-bearing route ground selects one fuel cell, shown with a purple ring. Clicking another eligible cell moves that ring before starting. Fuel-free ground is rejected without changing the cell or existing selection. Turning placement off retains the selection but disables picking. Panel interactions and left drags do not place ignition.

**Start fire** is enabled only after a valid selection. It ignites that cell, turns placement off, and locks selection until **Reset simulation**. Orange indicates burning, red burned-hot, and dark gray burned-cool; raised indicators and recolored ground distinguish every affected cell. Exhausted decorative fuel is hidden and restored on reset. The status text describes the original selected cell; neighbors can still burn after that cell has cooled.

Each unburned fuel cell accumulates exposure from its four edge-sharing burning neighbors: 1 exposure unit per neighbor per simulated second, with ignition at 1 unit. One burning neighbor takes 1 second; two take 0.5 seconds. Exposure returns to zero when no burning neighbor remains. Only burning cells contribute; hot/cooled cells do not. There is no diagonal spread or jumping across nonfuel gaps. Fuel quantity controls burn duration, independently of ignition delay and base walkability. Blocked brush and walkable grass both burn.

Every fixed step snapshots the burning sources, evaluates targets, and applies new ignitions together. A newly ignited cell contributes only in the next step and retains full fuel until then; a source burning at the start of a step contributes even if it burns out during that step. This avoids iteration-order effects and same-step cascades. This simplified deterministic four-neighbor rule is **not calibrated wildfire physics**; wind, moisture, slope, stochastic behavior, and agents are absent.

`src/simulation/createFireSimulation.js` owns plain fire-state copies independent of Three.js and DOM. The lifecycle is `unburned → burning → burned-hot → burned-cool`. Burning/hot cells are hazardous. Cooled cells are no longer hazardous, but retain their original base walkability: burned brush stays blocked, and cooled grass on routes retains walkability. Exhausted fuel cannot reignite. The single-run ignition lock also remains in force after cooling.

Demonstration configuration lives in `src/simulation/fireConfig.js`: grass starts with 4 fuel units, brush with 6, consumption is 1 unit per simulated second, and cooling lasts 5 simulated seconds. Thus grass burns for 4 seconds and brush for 6 before cooling. These are illustrative values, **not calibrated wildfire physics**. A 50 ms fixed-step accumulator produces the same results at ordinary frame rates; each frame contributes at most 250 ms. Excess time from long frame gaps/background suspension is discarded, so resuming cannot skip the whole lifecycle in one catch-up jump. Simulation time may consequently lag wall time after suspension.

**Reset simulation** restores initial fuel, unburned states, exposure, timers, and selection, turns placement off, and allows a repeatable new run. It preserves the current camera. `R` resets only the camera. Neither operation changes the authoritative map. `src/rendering/createGroundPicker.js` raycasts from current pointer/camera coordinates onto the ground plane and resolves grid coordinates; vegetation and text sprites cannot intercept picking. Rendering updates affected tile/decoration instances and one shared fire-indicator batch on state changes, with partial instance-buffer updates rather than rebuilding the map each frame.

Suggested demonstration: select **(32, 32)** near the center of the vegetation band. At approximately 1 simulated second its first neighbors ignite; Route A's designated section first becomes hazardous at 7 seconds and Route B's at 10. Their complete designated sections become hazardous at about 10.1 and 13.1 seconds respectively. All 280 fuel cells cool by about 26.25 seconds. These timings were checked in the independent simulation; background suspension can extend wall-clock time. The authored map is unchanged. Route hazards are verified, but agent rerouting is not implemented.

Run navigation, map, fire lifecycle, and interaction checks with no additional test dependency:

```powershell
npm test
```

## Manual validation

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

Increment 5 feedback: the user reports the checklist mostly passed, but fuel appearance was misleading. Individual checklist results were not specified; full validation is **not recorded as passed**. A minimal ground-color/legend clarification is now pending visual recheck:

1. Select `(32, 32)` near the middle of the green patch (the status confirms coordinates), then start. Check a delayed advancing orange front, followed by red and dark gray cells; both route sections should be reached. Keep the tab active for about 27 seconds.
2. Verify only one user ignition can be selected, selection locks after starting, and nonfuel areas never burn. Decorative gaps inside the fuel band can burn.
3. During spread, zoom/pan/orbit and press `R`; fire must continue. Reset simulation while spread is active: all fuel/indicators/selection restore, placement turns off, and the camera stays put. Re-select the same coordinate to replay.
4. Resize wide/narrow and tall/short; check labels and controls. Repeat on production preview and inspect the console. Physical right/middle drag checks remain human checks. No full MVP performance result is claimed.

Visual recheck: compare both light-green crossings with the yellow road, try selecting fuel between decorative models, confirm yellow road rejects ignition, then burn/reset and confirm the original green coverage returns. Check the updated legend at desktop and narrow sizes.

Deferred visual refinements: improve/replace the purple selection ring and further distinguish grass, brush, and tree-covered decorative models. Grass/brush ground coverage is now clarified; broader asset refinement and tree-covered appearance remain deferred. Decorative gaps intentionally can contain logical fuel; tests verified picking, positions, lifecycle colors, and hazard flags agree. No purple-marker redesign or new tree fuel type is included.

## Intended organization

The current application uses `src/main.js`, `src/styles.css`, `src/rendering/`, `src/world/`, `src/simulation/`, `src/ui/`, and `tests/`. Other directories will be created when first needed:

| Path | Purpose |
| --- | --- |
| `src/simulation/` | Independent fire state, fixed-step spread/lifecycle, and demonstration configuration |
| `src/agents/` | Navigation and agent state machines |
| `src/world/` | Authored logical grid and BFS connectivity validation |
| `src/rendering/` | Three.js visualization |
| `src/ui/` | Ignition placement, Start fire, and simulation reset controls |
| `public/assets/` | Simple or licensed assets |
| `tests/` | Relevant automated checks |
| `docs/` | Requirements and progress |

Read [requirements](docs/requirements.md), [progress](docs/progress.md), and [working rules](AGENTS.md) before implementation.
