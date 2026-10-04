# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increment 1 established the Three.js application (`73d8ae7`); Increment 2 added validated camera navigation and controls hints (`7b4d189`). Increment 3 replaces the demonstration cube with an authored fixed MVP map: start area, safe zone, two routes, vegetation, and blocked ground. The user reported acceptable map validation, closer revised framing, working panning, and working resizing, and authorized the Increment 3 checkpoint. The canvas resizes with the browser window, with pixel ratio capped at 2. No ignition, fire behavior, moving agents, A*, procedural generation, or weather is implemented.

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

- `src/main.js` imports styling and starts the rendering module. Vite hot replacement disposes the previous scene.
- The **scene** contains the instanced map meshes, text markers, background, and lights. Built-in geometries require no external assets.
- The **camera** defines the viewing position and perspective. On resize, its aspect ratio and projection matrix are updated to keep objects proportional.
- The **renderer** draws the camera's view of the scene into the HTML canvas. Its drawing buffer follows the canvas size and uses at most 2 pixels per CSS pixel in each dimension.
- The **animation loop** requests repeated renders through Three.js. It does not update simulation state. Cleanup stops the loop and releases geometry, material, and renderer resources.
- `src/rendering/createCameraControls.js` uses OrbitControls from the installed Three.js package. It updates before drawing and removes its pointer, context-menu, and reset-key listeners during cleanup.

## Fixed map data and layout

`src/world/createFixedMap.js` creates a fresh deterministic 64×64 logical grid. Each cell is a plain object with separate `terrain`, `fuelType`, and `walkable` fields; no cell holds a Three.js object. `src/rendering/createMapView.js` reads that data to create four instanced mesh batches (tiles, brush, grass, rocks) and four text sprites. It does not decide connectivity or modify the grid. Cell size is 0.5 world units, so the flat map spans 32×32 units and is centered at the origin.

Grid coordinates are zero-based `(x, z)`; Z increases toward the lower corridor in the initial view. Rectangle bounds below are inclusive:

| Area | Grid coordinates | Meaning |
| --- | --- | --- |
| Start | `(9, 32)`; area X 6–13, Z 28–35 | Blue, walkable, no fuel |
| Safe zone | `(54, 32)`; area X 50–57, Z 28–35 | Teal, walkable, no fuel |
| Route A | X 10–53, Z 22–25 | Upper, shorter corridor; tan |
| Route B | X 10–53, Z 42–45 | Lower alternative corridor; tan |
| Connecting stems | X 10–13 and 50–53, Z 22–45 | Join both corridors to endpoints |
| Vegetation patch | X 27–36, Z 20–47 | Continuous fuel band crossing both routes |
| Route A test section | X 30–33, Z 22–25 | Full corridor width, walkable grass fuel |
| Route B test section | X 30–33, Z 42–45 | Full corridor width, walkable grass fuel |

Only corridors and endpoint areas are walkable. Gray ground is blocked everywhere, even between the sparse rock meshes. Green brush in the patch is also blocked; its fuel can later spread toward the walkable grass-bearing route cells. Fuel-free routes remain walkable: nonburnable does not mean blocked. A walkable cell can contain grass fuel. Sparse tufts on tan route sections show that fuel without hiding the corridor. Decorative geometry does not define collision or walkability.

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

Orbit angles remain limited to 15–75 degrees from vertical. For the 32×32 map, minimum camera-to-target distance is 16 units and target X/Z are limited to ±8, with Y kept at zero. Maximum distance remains 1.5 times the full-map fitted distance. Initial/reset framing instead fits the useful start/safe/routes/vegetation area with margins (29×16 world units, centered at X 0 / Z 1) to both viewport axes, including narrow windows. Resize updates the saved reset view; a camera still at its initial view refits automatically, while a navigated view is retained subject to movement limits. `R` returns to the same framing as initial load for the current window. When clamping the target, the camera receives the same correction to preserve viewing direction and distance. Camera behavior during future ignition mode remains undecided.

Run navigation and map checks with no additional test dependency:

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

## Intended organization

The current application uses `src/main.js`, `src/styles.css`, `src/rendering/`, `src/world/`, and `tests/`. Other directories will be created when first needed:

| Path | Purpose |
| --- | --- |
| `src/simulation/` | Fire state, rules, and simulation updates |
| `src/agents/` | Navigation and agent state machines |
| `src/world/` | Authored logical grid and BFS connectivity validation |
| `src/rendering/` | Three.js visualization |
| `src/ui/` | Ignition/reset controls and agent counts |
| `public/assets/` | Simple or licensed assets |
| `tests/` | Relevant automated checks |
| `docs/` | Requirements and progress |

Read [requirements](docs/requirements.md), [progress](docs/progress.md), and [working rules](AGENTS.md) before implementation.
