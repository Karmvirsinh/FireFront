# FireFront

An educational wildfire/evacuation simulator for a university project, mentored by Danrui Li. The midterm MVP focuses on agents navigating two routes while simplified fire hazards change, presented in stylized low-poly / voxel-inspired 3D.

## Current status

Setup only: project scope, development workflow, progress documentation, and local version control. The application has not been scaffolded, no project dependencies are installed, and no simulation runs yet. Build/run commands will be documented when implemented and verified.

The intended stack is JavaScript, Three.js, Vite/npm, and HTML/CSS. FireFront is not a validated wildfire prediction tool.

## Intended organization

Directories will be created when first needed:

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
