# Assignment 4 alpha lifecycle

Validated increment: checkpointed on `feature/alpha-lifecycle`, from validated Local Awareness `74db471` (including generator `1949f12`). Main, previous branches, generator version/layouts and deployed baseline are unchanged.

## Opening and setup

Each ordinary page opening/reload chooses a numeric uint32 seed with browser crypto. This chooses the seed only; forest-network-v4 generation from that seed remains deterministic. The displayed seed input and installed seed agree. The entry screen appears once in this page session, without persistent preferences. Begin simulation opens a six-step optional tour; Skip, Back, Next and Finish need no simulated actions. Help / Tour reopens it only in setup. Native modal interaction prevents ignition, generation and camera shortcuts during guidance. Highlight targets scroll into view; short tour cards scroll internally. There are no new controls for simulation policy or speed.

The existing dashboard is reused: 20 waiting agents, Local awareness, placement off. Enter a seed and Generate to reproduce a map. Generation reframes the replacement map; reset replays the same map/model and preserves the camera. Start fire still requires one eligible selection and locks generation, awareness and placement. Help is disabled during a run. Camera, FPS, counts and reset remain available outside modals.

`?map=fixed` explicitly loads the authored fixture with Global awareness, without choosing a random seed. `?benchmark=1` also fixes Global/map, bypasses entry/tour, and disables New scenario to preserve its workload. Earlier FPS measurements are fixed-map/Global evidence, not measurements of this generated alpha or its overlays.

## Outcome classification

`createOutcomeTracker` is plain simulation code. After each existing fixed step it records the first outcome when either:

1. All agents are evacuated or lost (terminal).
2. No burning or burned-hot cells remain, and **all** remaining agents lack a physically reachable SAFE route under the actual hazards, base walkability and Path-first mask.

A reverse flood-fill from SAFE classifies settled connectivity independently of agent beliefs; it never writes to observations or pathfinding. It is cached only after fire/hot ground finishes, when hazards can no longer evolve in this run. Reset discards it. Temporary trapping, remembered Local hazards and elapsed time alone cannot cause completion. When fire has settled and all remaining agents are trapped despite actual connectivity, a status message reports the condition; cautious retries continue. Persistent reachable stalling is a defect to investigate, not a result hidden behind a timeout. This is not a guarantee of evacuation on every seed.

An immutable snapshot records counts, remaining agents, seed/model and simulation time at that first outcome. Remaining fire/cooling and the simulation clock continue; opening or inspecting results does not pause/reset anything. Terminal results with losses retain explicit lost counts. Direct-active-fire-only loss, emergency buffer escape, all awareness rules and all timings are unchanged.

## Results and resource ownership

The centered modal keeps the scene visible under gentle dimming. Inspect scene dismisses it and restores interaction; View results reopens the same snapshot. Replay same map invokes the existing Reset simulation action. New scenario generates/validates a fresh seed before replacement, retains awareness and frames the new map. Reset or generation clears old results; auto-open occurs once per run. Entry does not recur on these actions.

One UI controller lives outside map sessions. Native dialog modality, an explicit Tab boundary, keyboard containment and suspended/cancelled camera drags prevent background actions. Focus returns to a usable trigger/control. Tour resize/scroll and UI listeners are removed at disposal, as are its two DOM nodes. There is no second animation loop or tour dependency. The application calls a lightweight lifecycle refresh from its existing loop; DOM writes occur only when lifecycle state changes.

## Human recheck (workflow passed according to the user)

The user reports all four checklist items below passed and accepts the corrected outcome icons (person reaching an exit, skull, person enclosed by barriers) for now. More colorful, lively icons are deferred feedback; no further redesign was made. Exact timings remain automated evidence, not additional human measurements.

1. Reload: fresh displayed seed, entry once; Begin, Back/Next, Skip, reopen Help and Finish. Test keyboard focus, narrow/short tour targets, no click-through or I/R activity behind dialogs.
2. Generate seed **7**, Local, ignite **(40,34)**. Expect initial movement, retreat/reassessment, and eventual results (automated completion about **63.65 simulation seconds**). Locks and counts should remain correct. Inspect, pan/zoom/R, View results; snapshot values stay fixed.
3. Replay during/after a run: 20 waiting, same map/model/camera, setup unlocked, no entry screen or old result. Repeat with Global on the same seed (automated completion about **88.9 s**); reset still works during temporary trapping.
4. New scenario: fresh displayed seed, same awareness, 20 waiting and sensible framing. Repeat Generate/replay/new scenario, resize desktop/narrow/short and check both development/preview consoles. Benchmark/fixed fixture defaults remain explicit Global.

Automated checks and browser observations are recorded in progress separately. The lifecycle workflow passes are explicitly user-reported for this increment, not inferred from prior increments.
