# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Increment 1 provides a minimal working 3D application: a green ground plane, an orange cube, a fixed camera, basic lighting, and a FireFront label. The canvas resizes with the browser window, with pixel ratio capped at 2. No fire, agents, procedural generation, or weather is implemented. The user reported successful manual visual validation on 2026-10-04 and authorized the Increment 1 Git checkpoint.

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

## Manual validation

The user reported passing these checks on 2026-10-04, including wide/narrow and tall/short resizing, readable labeling, no red console errors, and matching development/production-preview appearance. The checklist remains available for repeat checks:

1. Open the development URL and confirm the green ground, orange cube with visibly lit faces, and the label “FireFront / Initial scene setup.”
2. Resize the window wide, narrow, and tall. Confirm the cube keeps its proportions, the canvas fills the window, and the label stays readable.
3. Open browser developer tools and check for console errors.
4. Build and open the production-preview URL; confirm the same scene and resize behavior.

Automated/agent checks are recorded in [progress](docs/progress.md). The production build succeeds but emits a non-blocking warning for a JavaScript chunk above 500 kB (about 529 kB minified, 131 kB gzip). No performance target has been measured.

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
