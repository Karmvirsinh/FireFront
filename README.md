# FireFront

FireFront is an educational 3D wildfire and evacuation simulator for a university project. It explores how changing fire hazards affect navigation through two routes. It uses JavaScript, Three.js, Vite/npm and HTML/CSS, with no runtime AI service or external assets.

## Current fixed-map MVP

The validated application is on `main` at `34c9ddd`. It contains one authored, flat **64×64 logical grid**, a vegetation patch, START and SAFE areas, two roads and **20 agents**. One user-selected ignition spreads through adjacent fuel, burns out and cools. Agents automatically evacuate, reroute, become trapped when no route is safe, and retry when hazards clear. The forest-themed dashboard shows ignition/reset controls, five agent counts, status, legends, camera hints and FPS.

This is the Assignment 3 fixed-map MVP, not the complete semester feature set or a validated wildfire prediction tool. The requirements and historical development/validation record are preserved in [docs/requirements.md](docs/requirements.md) and [docs/progress.md](docs/progress.md).

## Prerequisites and installation

- Node.js satisfying `^20.19.0 || >=22.12.0`, with npm. Verification used regular Windows Node.js **24.21.0** and npm **11.19.0**.
- A current desktop browser supporting **WebGL2**. Physical right/middle mouse buttons are useful for camera navigation.
- Git is useful for checking out source, but is not needed to run a downloaded source archive. GitHub CLI is not required.

Open a terminal in the project folder containing `package.json` and run:

```sh
npm ci
```

This installs the exact lockfile versions: Three.js **0.186.1** and Vite **8.3.2**, plus their dependencies. Do not omit development dependencies: Vite is needed for both development and production builds.

Development:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/**.

Production build and local preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open **http://127.0.0.1:4173/**. Preview serves the existing `dist/`; rebuild after source edits. Stop each server with Ctrl+C. These URLs are local to your computer, not a deployed submission site. If a port is occupied, stop the existing project server or choose another port.

On Windows PowerShell, replace `npm` with `npm.cmd` if execution policy blocks the npm PowerShell launcher. Restart the terminal after installing Node or changing PATH. No machine-specific installation path is required.

## Controls and interaction workflow

The three interaction stages are **inspect the fixed environment**, **select one ignition**, and **start/observe the simulation, then reset for another run**. They are user actions, separate from the five technical pillars listed below.

| Action | Control |
| --- | --- |
| Toggle placement | **Place ignition** button or **I** |
| Select ignition | Stationary left-click on grass, brush or forest fuel while placement is enabled |
| Start simulation | **Start fire**, enabled after a valid selection |
| Reset simulation | **Reset simulation** restores fire, selection, fuel and all agents; preserves camera |
| Zoom | Mouse wheel over the scene |
| Pan | Right-button drag over the scene |
| Orbit | Middle-button drag over the scene |
| Reset camera only | **R** |

The torch cursor shows blocked feedback over nonignitable ground. The amber hollow cell outline identifies the selection. Selecting another eligible cell before starting moves the single marker; bare roads and terrain sides reject ignition. Starting locks placement until simulation reset. I never selects a cell or starts fire. Left drag does not move the camera; camera gestures and panel interactions do not place ignition. Keyboard shortcuts ignore editable fields and Ctrl/Alt/Meta combinations; I also ignores held-key repeats.

Ground treatment defines fuel coverage, including gaps between decorative trees. Full-cell scorched/ash ground and flame/ember geometry distinguish burning, hot and cool states. Burning trees remain standing until exhaustion; charred stumps remain afterward. Placement-button flames indicate placement/ignition usage, independently of whether cells are still burning. Ordinary pages respect reduced-motion preferences.

## Demonstration scenarios

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
| **Procedural Generation** | Deferred; current layout is fixed and authored, not seeded/procedural |
| **Pathfinding & Navigation** | Four-neighbor Manhattan A*, changing hazard checks, rerouting and recovery |
| **NPC AI / Behavior Trees** | Implemented agent **state machine**: waiting, evacuating, trapped, evacuated, lost; no behavior tree implementation |
| **Rendering** | Three.js instanced map/agents/fire, compact labels, shallow visual terrain base, responsive dashboard and camera navigation |

Only edge-sharing burning neighbors contribute exposure; new ignitions are applied together after evaluation so they cannot cascade further within that same step. One burning neighbor takes 2 simulated seconds to ignite adjacent fuel. Grass/brush/forest burn for 12/18/30 seconds respectively, followed by 8 seconds cooling. Agents move at 1.5 cells/second. A shared 50 ms fixed step keeps simulation independent of ordinary rendering rates; excess elapsed time beyond a 250 ms frame cap is discarded rather than fast-forwarding after long gaps.

Fuel and base walkability are independent. Burning/hot cells are navigation hazards; burning additionally creates a one-cell eight-neighbor safety buffer. Nonfuel roads can be unsafe near fire but cannot ignite. Cooling does not make blocked off-path terrain walkable.

An agent becomes **lost only when its occupied logical cell is actively burning**, checked after fire/hazard updates and before movement. Occupancy is the cell containing its continuous rendered position, including between cell centers. Nearby buffers, hot ground and trapping alone do not cause loss. Evacuated/lost states are terminal until reset. Counts always total the initial 20 agents.

## Tests and measurements

```sh
npm test
node scripts/measurePacing.js
npm run build
```

The current **60-test** suite covers fire spread/lifecycle, snapshot ordering, fixed-step replay, map connectivity, hazards, pathfinding, agent loss/count conservation/reset, camera/ignition guards, rendering lifecycle, viewport picking/resizing and FPS capture. The pacing helper reproduces both scenario timelines; it is not an FPS benchmark.

Two automated, visible production-preview measurements recorded approximately **144 FPS average**, lowest complete one-second windows **142.02 / 143.00 FPS**, p95 intervals **7.5 ms**, and **zero complete windows below 30 FPS**. Both captured 60 seconds and completed evacuation. Baseline was a **1280×720 browser viewport**, with a smaller **922×555 embedded canvas/drawing buffer**, DPR 1, on the documented local NVIDIA RTX 4060 setup. This is a local result, not a full-size-canvas or other-hardware guarantee; independent browser acceleration-setting confirmation was unavailable.

See [performance methodology, environment, limitations and reproduction](docs/performance.md) and [raw two-run evidence](docs/performance-results.json). Optional manual benchmark reproduction was **not performed**, not passed. The compact FPS counter updates roughly once per second; hidden time is excluded and sampling restarts on return.

For the existing opt-in capture, open `http://127.0.0.1:4173/?benchmark=1&animation=normal`. This enables a small JSON download and explicitly uses normal animation even with reduced motion enabled. Ordinary URLs retain reduced motion. Follow the performance document for warm-up, baseline sizing, (32,32), 60-second capture and reset/repeat; there is no separate benchmark dashboard or stress mode.

## Known limitations

- Fire settings are demonstration values, not calibrated wildfire physics. No wind, moisture, slope, diagonal fire spread, smoke or predictive accuracy claim.
- Agents may overlap. No crowd avoidance, off-path escape, health/exposure accumulation or random mortality.
- Direct-active-fire loss is verified through **controlled automated fixtures**, not a visible loss demonstration on the current nonfuel-road scenarios.
- Procedural generation, configurable/multiple ignitions, buildings/interiors, water/bridges, weather controls and semester-wide movement comparisons are deferred.
- Small labels may require zoom on very narrow overviews. Richer assets, road-width presentation and improved ignition-button flame animation remain deferred.
- Source archives without `.git` build successfully, but the optional build-metadata probe prints Git diagnostics and records unknown commit/branch metadata. A Git checkout supplies those values.
- Production build reports the accepted >500 kB chunk warning. Warning thresholds are unchanged; no code/quality tuning was performed to silence it.
- Assignment 3 deployment, public repository, video and PDF deliverables are separate work; this source preparation does not claim those are completed.

## AI assistance and human validation

FireFront was developed incrementally with Codex assistance for implementation, documentation, regression tests and browser checks under human-approved scope. This is development assistance; FireFront does not call an LLM or use runtime machine learning. Tests provide automated evidence, not proof of physical wildfire accuracy.

FireFront has human-reported validation for the map/camera, ignition/fire lifecycle, agent evacuation/recovery/reset, forest UI, scene readability and FPS behavior, as recorded in progress. Latest reported checks include FPS readability across sizes, sampling returning after minimizing, navigation/ignition/reset/camera preservation, and no red errors in both development and production-preview consoles. Automated benchmark captures remain distinct from manual validation; optional manual reproduction was skipped. Exact scenario timelines and direct-fire loss tests are automated evidence, not additional claimed human measurements.

## Source organization and documentation

| Path | Responsibility |
| --- | --- |
| `src/world/` | Plain logical map data and BFS connectivity checks |
| `src/simulation/` | Fire state, hazards, configuration and shared clock |
| `src/agents/` | A*, continuous movement and agent state machine |
| `src/rendering/` | Three.js map/fire/agent visuals, camera, resize and picking |
| `src/ui/` | Ignition/reset workflow, counts, cursor feedback |
| `src/performance/` | Render-time FPS sampling and opt-in capture/export |
| `tests/`, `scripts/` | Regression tests and deterministic pacing measurement |
| `docs/` | Requirements, historical progress and performance evidence |

Read [AGENTS.md](AGENTS.md), [requirements](docs/requirements.md) and [progress](docs/progress.md) before development. Existing experiment branches and annotated layout snapshots are retained locally. Compare versions only with a clean working tree; rebuild preview after switching because ignored dist output does not switch with Git.
