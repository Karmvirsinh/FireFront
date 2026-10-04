# FireFront requirements

FireFront is an educational wildfire/evacuation simulator. Mentor: Danrui Li.
The priority is simulation behavior supported by clear, stylized low-poly / voxel-inspired 3D. This is not a validated wildfire prediction tool.

## Midterm MVP

- One small fixed 3D scene with a vegetation patch, one agent starting area, one safe zone, and two possible routes.
- Single ignition; simplified fuel-grid spread, burnout, and cooling.
- Automatic evacuation; agents avoid burning/hot ground and reroute when hazards invalidate their route.
- If no safe route exists, surviving agents become trapped and retry when cooled ground becomes walkable. Lost agents remain lost.
- Only ignition/reset controls and basic agent counts are required.

## Core technical challenge

Keep navigation synchronized with changing fire hazards.

## Acceptance scenarios

- Fire closes the preferred route; agents use the alternative.
- Both routes become blocked; surviving agents become trapped and can retry after cooling.
- Agents avoid burning/hot ground.
- State counts always sum to the initial population.
- Reset reproduces the initial scenario.

## Performance target — not yet achieved

At least 30 FPS at 1280x720 with 20 agents and an initial 64x64 fire grid.
Measure a repeatable 60-second scenario after loading; record the test computer's CPU, GPU, RAM, and browser version. No performance measurement has been performed yet.

## Broader semester scope — excluded from this MVP

Seeded procedural terrain/vegetation; buildings and reachable safe zones; water/bridges; generation controls; simplified wind, humidity, temperature and slope effects; comparison of Path-first and Flexible movement.
Potential later features include watchtower alerts and burning bridges. These are not tasks to implement now.

## Implementation direction

- Custom JavaScript fire grid, A* navigation, and an agent state machine.
- JavaScript, Three.js, Vite/npm, HTML/CSS.
- `simplex-noise` and `alea` are planned for later procedural generation.
- Use simple or licensed assets; Blender can support asset editing.
- AI supports coding and concept/asset exploration. Optional generated meshes are not a dependency. No runtime ML or LLM API is planned.
- The separate exploratory hosted demo is not the authoritative MVP or an approved code baseline; reuse requires review.

## Assignment 3 deliverables

- Running MVP/live web URL.
- Public GitHub source repository with README build instructions.
- 2–3 minute video with walkthrough and performance stress test.
- 1–2 page PDF report: plan versus reality, AI utility, roadmap to final.

These are future deliverables. Publishing, pushing, and deployment require explicit instruction.
