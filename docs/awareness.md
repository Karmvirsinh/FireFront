# Local Awareness with cautious retries

Validated reported workflow on feature/local-awareness; prepared for the requested Local Awareness checkpoint. Generator checkpoint **1949f12** remains unchanged. Main/remote/deployment are unchanged. Four-cell boundary fix is preserved. No new dependencies, terrain, exits, fire/fuel/speed/hazard/loss rules, generator version or UI redesign.

## Observation and planning

Global remains the complete-current-hazard baseline; fixed/benchmark sessions force it and keep the selector locked. The ordinary generated-map experience defaults to Local, with setup Global/Local selection on the same map. Both use A* and Path-first static traversal. No shared knowledge or line-of-sight. Radius four is an illustrative logical-cell setting, not calibrated vision.

Local agents know terrain and SAFE, and continuously observe cell centers within Euclidean distance four of continuous position. The exact-boundary tolerance is applied consistently to bounds/circle tests. Occupied/attempted next-step contact also counts as local observation. Each actual observation records **simulation time**, even if the hazard value did not change. A safe observation clears blocked/direct memory; a dangerous observation blocks the cell and cancels any uncertain assumption.

## Cautious retry rules

- Start a continuous-wait timer when an agent becomes Trapped. After **5 s**, check retry eligibility no more often than once per **5 s**. Leaving Trapped resets the continuous-wait timer. Local observations can still trigger ordinary reactive planning sooner; those are not timed cautious retries.
- A remembered blocked cell can become uncertain only if it is **currently outside sensing radius** and its latest actual observation is at least **10 s old**. Eligibility uses age/distance, never actual remote clearance or route availability.
- Keep the blocked observation/history. A separate uncertain set and effective planning masks optimistically allow those cells in A*/buffer-exit planning. Uncertain does not mean known-safe. Persist these masks during subsequent path checks/replanning/movement; the same old blocked record must not immediately cancel its retry route.
- Re-observation cancels uncertainty and refreshes its timestamp. Persistent danger becomes blocked again before normal entry; observed clearance updates real memory. Currently sensed hazards are never demoted. If a timed eligibility check changes no beliefs, skip another identical A* search.
- Actual next-step safety is independent and applies between centers; unexpected blockage becomes a contact observation and triggers replanning/centering/waiting. Direct active fire on the occupied cell still causes loss before movement. Hot/buffers remain nonlethal. Existing already-buffered escape may cross buffer-only policy-allowed cells, never actual fire/hot/off-policy cells.

`AGENT_CONFIG` contains retryDelaySeconds=5, retryIntervalSeconds=5, hazardMemoryAgeSeconds=10, plus unchanged detectionRadius=4 and speed 1.5 cells/s. The agent clock advances only by fixed-step simulation input; no Date/timeouts/browser timers. Raw observations, lastObservedAt, uncertain/effective masks, trappedSince, lastRetryAt, counters/clock and all navigation reset together. The chosen model/map/camera remain; seed/model controls unlock. R stays camera-only. Setup mode changes preserve map/seed/camera/ignition marker. The generation selector/seed logic is unchanged.

This rate limit bounds forced probes and avoids per-frame identical searches. Dynamic observations can still cause retreat/replanning, and no rule guarantees evacuation or eliminates oscillation on every map. Old records may remain blocked while uncertain for planning; they are marked safe only through actual local observation.

## Current reproducible comparisons

Run `node scripts/compareAwareness.js`. The script uses the SAME forest-network-v4 map per seed, fixed 50 ms inputs, identical ignition per model, count assertions and a **300 simulated-second bound**. It stops at terminal completion. These are functional traces, not rendered FPS/wall-clock benchmarks. Prior Local comparisons below used indefinite planning blockage and are historical.

| Seed / ignition | Global completion | Local completion | First Local trap | First cautious retry |
| --- | ---: | ---: | ---: | ---: |
| 0 / (44,10) | 190.25 s | **114.65 s** | 8.7 s | 30.9 s |
| 2026 / (38,37) | 255.45 s | **142.75 s** | 6 s | 32.55 s |
| 7 / (40,34) | 88.9 s | **63.65 s** | 7.6 s | 17.6 s |

Every row/model completed **20 evacuated / zero lost** within the bound. Local first movement is 0.05 s for all three. Global first movements remain 62.95 / 26.4 / 21.25 s (initial buffer escape), with seed-7 sustained ordinary recovery still 42.25 s. Fixed authored 60.8/47.35-second scenarios and generator digest/layout tests remain unchanged.

Seed 0: all initially trapped by 13.35 s; some observation-driven escape/retrap continues. The previously permanent memory gate first gets cautiously probed at 30.9 s, is rejected again when danger is seen, then movement resumes around 41.05 s after a later reconsideration. More real hazard stops occur, then all finish near 115 s. Seed 2026 first cautious activation is 32.55 s; visible ordinary movement resumes around 44.4 s with further stops, finishing near 143 s. Seed 7 probes around 18-28 s and finishes near 64 s. Do not interpret every Evacuating state as an already globally clear complete route.

A* calls on 0/2026/7 Local runs are 500/951/104; uncertainty activations are 80/80/24 across the population. Uncertainty activations are policy changes that request planning, not every timer check. Current Global counts remain 30105/47991/5116. These are functional counters, not performance claims. No broader-seed evacuation guarantee or new Local FPS benchmark.

## Checks and human validation

The **100-test suite** and production build pass. Tests retain all original Local sensing/entry/escape/loss/reset, exact-boundary observation and Global/fixed-map/generator regressions. New focused cases verify 5/5/10 timing, repeated-sighting timestamps, sensed-danger protection, persistent uncertain route masks, actual unsafe entry with both normal and contact-only sensing, rate-limited activation/no identical unchanged A*, state clearing on reset and deterministic reset/replay over 40 s including active retries. The real-map observer audit still checks every active/trapped in-radius cell; previously stalled scenarios now recover rather than asserting historical deadlock.

Latest browser evidence is in progress. The user reports retreat, reassessment and successful evacuation, with reset restoring 20 waiting agents, preserved camera/model and unlocked selectors. Optional scenarios and exact timing checks are not inferred. Earlier generator passes and unresolved pre-retry feedback remain historical; the requested Local Awareness checkpoint covers the reported validated workflow.

## Short manual checklist

1. Local, **seed 0 / (44,10)**: starts moving immediately, later stops/retreats, cautiously probes around **31-41 s**, and may have further stops before the measured **115 s** completion. Keep counts totaling 20; current danger must still stop approach. Seed 2026 / (38,37) is a second example, measured completion about **143 s**.
2. Check that seed/model selectors lock after Start fire. Reset during activity and after completion: 20 waiting, no marker/fire, same seed/model and preserved camera; setup unlocks. R is camera-only.
3. Compare seed 7 / (40,34) if desired: Local measured completion about **64 s**, Global remains about **89 s**. Check physical navigation/picking and both consoles. Times are automated references, not stopwatch requirements or promises for every run/environment.

## Historical pre-retry Local Awareness (superseded semantics and results)

The following record preserves original conservative-only behavior and the feedback that motivated cautious retry. Its no-expiry planning description and stalled/153.85-second results are historical; use current rules/results above.


Generator checkpoint **1949f12** is validated and preserved on feature/seeded-environment. Local Awareness is uncommitted on feature/local-awareness, pending human validation. Main/remote/deployment were not changed. Generator version remains forest-network-v4; no map/fuel/timing/agent-speed/hazard/loss/dependency changes.

### Models and setup

- **Global:** current baseline, with authoritative current hazards across the whole known static map. Normal A* needs a complete currently safe path to SAFE; it does not predict future fire. Fixed-map sessions (`?map=fixed`) and benchmark entry points explicitly force this model and disable the selector.
- **Local:** default for the ordinary generated-map experience. Static terrain, trail policy and SAFE are known everywhere; only hazards are limited. A* uses each agent's own observations and optimistically treats unseen hazards as absent. No line-of-sight, shared knowledge or different pathfinding algorithm.

Use **Awareness: Global / Local** during setup. A mode change resets waiting agents/knowledge without regenerating the map, replacing the scene, moving the camera or removing an ignition marker. Start fire locks both mode and seed controls; reset unlocks them, preserves map/camera/selected model and clears observations, paths, fire and run timers. A new generated map retains the chosen model. R remains camera-only. Keyboard typing guards already include SELECT elements.

The pure simulation API defaults to Global for regression compatibility; comparison callers request Local explicitly through `AGENT_CONFIG`. The application chooses Local for generated sessions. `AGENT_CONFIG.detectionRadius` defaults to **4 logical cells**: cell centers within Euclidean distance 4 of the agent's continuous grid position are observed, including the boundary. This is an illustrative awareness setting, not human vision calibration. The occupied cell and an unexpectedly blocked attempted next step are also local contact observations.

### Memory, planning and safety

Every agent has separate observed/blocked/direct-hazard arrays. Unknown cells are known terrain with no observed hazard, not undiscovered terrain. Observations refresh at every fixed step and after position updates; only relevant navigable-cell changes trigger replanning. A valid unaffected route is retained. Trapped agents continue sensing; if relevant knowledge does not change they do not rebuild the same path every frame.

Blocked observations outside the radius persist **conservatively, with no expiry**. They clear only when that agent re-observes the cell safe. There are no remote cooling updates. This can delay route reuse or keep an agent waiting indefinitely if it cannot approach/re-observe an old blocked cell. This implements the approved conservative rule; no exploration, forgetting, shared sensing or rescue policy was added to force successful evacuation.

Planning knowledge is separate from authoritative movement safety. Each normal next step checks actual burning/hot/buffer hazards even during movement between centers; an unexpected block is remembered and causes replanning/centering/waiting, never tunneling. Direct active fire on the occupied logical cell causes loss before movement, regardless of perception. Hot ground alone and proximity buffers remain nonlethal. Existing occupancy conventions and speed are unchanged.

**Emergency exception:** an agent already inside a buffer may search for the nearest believed-safe cell through policy-allowed non-burning/non-hot buffer cells, even without a route to SAFE. Local sensing/contact updates its knowledge while it moves; actual fire/hot entry is always rejected. Upon reaching actual safe ground it attempts normal A* again and may become trapped. This is the existing limited buffer escape, not permission for normal agents to enter buffers. No off-path escape, collisions, health or exposure damage. Lost/evacuated are terminal until reset.

### Reproducible functional comparison

Run:

```sh
node scripts/compareAwareness.js
```

This opt-in script generates each v4 map once, runs both models on it with identical ignition and fixed **0.05-second** inputs, conserves all 20 counts, and stops at terminal completion or **300 simulation seconds**. Output is six JSON records with first movement/trapping, trap-count transitions, plan calls, final counts and actual-route versus remembered-route diagnostics. It does not add a browser debug global, UI dashboard or another loop. It is not a render/wall-clock/FPS benchmark.

| Seed / ignition | Model | First movement | First agent trapped | Result within 300 s |
| --- | --- | --- | --- | --- |
| 7 / (40,34) | Global | 21.25 s, buffer escape | 0 s | 20 evacuated, 0 lost at 88.9 s |
| 7 / (40,34) | Local | 0.05 s | 7.6 s | 20 evacuated, 0 lost at 153.85 s |
| 0 / (44,10) | Global | 62.95 s, buffer escape | 0 s | 20 evacuated, 0 lost at 190.25 s |
| 0 / (44,10) | Local | 0.05 s | 8.7 s | Unfinished: 20 trapped, 0 evacuated, 0 lost at 300 s |
| 2026 / (38,37) | Global | 26.4 s, buffer escape | 0 s | 20 evacuated, 0 lost at 255.45 s |
| 2026 / (38,37) | Local | 0.05 s | 6.0 s | Unfinished: 20 trapped, 0 evacuated, 0 lost at 300 s |

Seed 7 Global: 21.25 s is local escape, not full-route recovery; ordinary evacuation resumes at **42.25 s**. Local: all agents are trapped by **11.6 s**. They escape buffers again at **102.9 s**, with further stops at 112.4/114.1/127.8 s and renewed escape at 113.45/115.3 s. At **135.9 s**, all resume ordinary evacuation with escaping=false, then finish at 153.85 s. Local begins sooner but finishes later in this case.

At the bound, seed 0's Local agents have an actual safe route but remember blocked cell **(45,11)**, about **4.12 cells** from their final position. Seed 2026 similarly retains cleared cells beyond sensing distance. Both have 20 agents with an actual route but no route through remembered hazards. No remote clearing was granted and no completion time is invented.

Global plan-call counts on 7/0/2026 are 5116/30105/47991; Local counts are 840/200/951. These are functional counters, not a pathfinding-speed benchmark or a claim that fewer plans always improve outcomes.

### Verification and limits

The 94-test suite and production build pass after the observation-boundary correction. Focused coverage includes Euclidean/continuous sensing, separate memory, cooling through re-observation, no repeated identical plans on unchanged information, unseen blockage versus Global waiting, actual entry safety with a partial segment/contact-only fixture, buffer escape/hot/off-policy exclusion, direct-fire loss/terminal states, reset/replay across ordinary frame intervals, count conservation and same-map comparisons. Application fixtures verify setup selection preserves map/seed/camera/marker, run lock/forged-event rejection, reset memory clearing, model persistence, explicit fixed/benchmark Global and listener cleanup. Existing fixed-map 60.8/47.35-second scenario traces remain unchanged. Generator digest/1,029-seed regressions remain unchanged.

Latest actual browser checks and production build details are recorded in progress. New human validation is pending; generator manual passes are not Local Awareness passes. Historical performance captures remain Global/fixed-map evidence. The existing Vite advisory remains a separate focused assessment; no upgrade was made here.

### Human checklist

1. Generate seed **7**. Local should be selected. Toggle Global/Local in setup: map/seed/marker/camera stay the same; zoom/pan/orbit remain available.
2. Select **(40,34)**, then Start fire. Local begins moving immediately and later detects/traps; Global initially reports all trapped. Mode and seed controls must lock. All five counts must total 20. Exact times above are automated simulation references, not a requirement to time by hand.
3. Reset during activity: restore 20 waiting/no selection, retain map/camera/model, unlock selector. Switch model and repeat the same ignition. R changes only the camera. Check both consoles.
4. Optional longer observation: Local seed 7 may finish around 154 simulation seconds; sampled Local seed 0/2026 runs can remain waiting on conservative memory. Reset remains available; do not interpret this as guaranteed Local success or tune other rules to force it.

### Manual recovery feedback (unresolved)

The user reports persistent trapping and partial recovery after visible clearing; the Local checklist is not fully passed. [Recovery investigation](awareness-recovery.md) audits all remaining agents for seed 0 / (44,10) and seed 2026 / (38,37). A small exact-radius floating-bound omission is fixed and tested. The known persistent cases remain caused by out-of-range conservative memory, with actual routes available and no stuck centering/escape flags. A bounded uncertainty/retry policy is proposed there but is not approved or implemented. No new human validation is claimed.
