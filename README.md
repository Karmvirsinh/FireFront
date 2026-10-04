# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increment 1 provides the ground plane, orange cube, lighting, and FireFront label; it passed user-reported manual validation and was committed as `73d8ae7`. Increment 2 adds approved zoom, pan, orbit, reset-view, and a compact controls panel. The user reported passing all Increment 2 manual checks on 2026-10-04 and authorized its checkpoint. The canvas resizes with the browser window, with pixel ratio capped at 2. No fire, agents, procedural generation, or weather is implemented.

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
- The **scene** contains the ground mesh, cube mesh, background, and lights. Built-in geometries require no external assets.
- The **camera** defines the viewing position and perspective. On resize, its aspect ratio and projection matrix are updated to keep objects proportional.
- The **renderer** draws the camera's view of the scene into the HTML canvas. Its drawing buffer follows the canvas size and uses at most 2 pixels per CSS pixel in each dimension.
- The **animation loop** requests repeated renders through Three.js. It does not update simulation state. Cleanup stops the loop and releases geometry, material, and renderer resources.
- `src/rendering/createCameraControls.js` uses OrbitControls from the installed Three.js package. It updates before drawing and removes its pointer, context-menu, and reset-key listeners during cleanup.

## Camera navigation

Use these bindings over the scene; the compact “Camera controls” panel lists them:

| Action | Binding |
| --- | --- |
| Zoom | Mouse wheel |
| Pan | Right-button drag |
| Orbit | Middle-button drag |
| Reset view | `R` key |

Left-button drag is unassigned to camera movement. Right-click context menus are suppressed over the canvas. Pointer interactions starting over the panel do not control the camera. `R` restores only the camera position, target, and zoom; it does not reset any simulation. The shortcut is ignored while typing in editable fields, composing text, or using Ctrl/Alt/Meta shortcuts.

Orbit angles are limited to 15–75 degrees from vertical to keep the camera above the ground. Camera-to-target distance is limited to 6–22 world units. Panning stays on the ground plane, with target X/Z limited to ±3 inside the 12×12 ground. When clamping the target, the camera receives the same correction: this preserves the viewing direction and distance instead of unexpectedly changing zoom or orbit. The original initial view is saved for reset. Camera behavior during future ignition mode remains undecided.

Run navigation checks with no additional test dependency:

```powershell
npm test
```

## Manual validation

The user reported passing these checks on 2026-10-04, including wide/narrow and tall/short resizing, readable labeling, no red console errors, and matching development/production-preview appearance. The checklist remains available for repeat checks:

1. Open the development URL and confirm the green ground, orange cube with visibly lit faces, and the label “FireFront / Initial scene setup.”
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

## Intended organization

Only `src/main.js`, `src/styles.css`, and `src/rendering/` are needed for the current application. Other directories will be created when first needed:

| Path | Purpose |
| --- | --- |
| `src/simulation/` | Fire state, rules, and simulation updates |
| `src/agents/` | Navigation and agent state machines |
| `src/world/` | Fixed scene layout and world data |
| `src/rendering/` | Three.js visualization |
| `src/ui/` | Ignition/reset controls and agent counts |
| `public/assets/` | Simple or licensed assets |
| `tests/` | Relevant automated checks |
| `docs/` | Requirements and progress |

Read [requirements](docs/requirements.md), [progress](docs/progress.md), and [working rules](AGENTS.md) before implementation.
