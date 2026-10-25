# Historical pre-retry Local Awareness recovery investigation

**Superseded policy record:** the bounded retry was subsequently approved and implemented, uncommitted. See [current awareness rules/results](awareness.md). The stalls, raw-memory audit and proposal below describe the earlier conservative-only implementation; they are preserved as historical evidence. The boundary fix remains active. Current sampled Local 0/2026 runs now finish at 114.65/142.75 s. Subsequent reported retreat/reassessment/evacuation/reset validation is recorded in progress; optional scenarios/exact timings are not inferred.

2026-10-25. Manual validation is **unresolved**, not fully passed. The user reports early movement/detection/retreat, persistent trapping after visible clearing, and sometimes partial recovery. These reports do not approve a memory-policy change. All Local changes remain uncommitted on feature/local-awareness; generator checkpoint 1949f12 is unchanged.

## Inspection and the bounded implementation fix

Every nonterminal Local agent observes before movement on every fixed step, including Trapped agents. Current safe observations write both observedUnsafe and observedDirect back to zero. A navigable-cell change sets observedChanged; a trapped agent then requests a plan. If it is between centers it first centers safely; at a center it calls the same A*. No unchanged-information per-frame retry is required.

Found one genuine numerical defect: the observation bounding rectangle used ceil/floor without the small tolerance already used by the circular distance test. A continuous position such as 31.49999999999997 could exclude an intended exactly-four-cell target. Added matching tolerance to all four bounds; the circular predicate still enforces radius four. This corrects edge refresh, not distant knowledge or the memory policy. A new fixture preloads a safe-at-present boundary hazard for two trapped agents: the agent at the four-cell floating boundary clears it and replans; another five cells away retains its memory and stays trapped. This also demonstrates that partial recovery can be correct under independent sensing.

## Actual-map audit, without long browser waits

Run:

```sh
node scripts/inspectAwarenessRecovery.js
```

The script creates fresh Local simulations for seed **0 / ignition (44,10)** and seed **2026 / ignition (38,37)**, advances 300 seconds with fixed 50 ms inputs, and prints **each remaining trapped agent individually**. It checks observed safe/unsafe/direct state against every currently in-radius cell for every active/trapped agent, tracks last observations/actual clear times, and reports positions, remembered blockers/distances, actual-versus-known A* routes and navigation flags. It does not change production knowledge, maps or running browser sessions. Its counterfactual mask is an isolated diagnostic copy, never supplied back to agents.

After the fix:

| Case | In-radius cell checks | Mismatches | Navigable safe refreshes | While previously trapped |
| --- | ---: | ---: | ---: | ---: |
| Seed 0, (44,10) | 5,874,610 | 0 | 100 | 100 |
| Seed 2026, (38,37) | 5,872,405 | 0 | 440 | 300 |

All **40 agent records** are verified separately in a regression. The grouping below summarizes their common final position/state; it does not assume shared knowledge. Individual observation histories remain available in the script's records.

| Case | Agent IDs | Occupied cell | Continuous position | Actual safe route | Remembered safe route |
| --- | --- | --- | --- | --- | --- |
| Seed 0 | 0-19 (all 20) | (41,12) | (41.5,12.5) | Yes | No |
| Seed 2026 | 0-19 (all 20) | (45,44) | (45.5,44.5) | Yes | No |

For every record: atCenter=true, centering=false, escaping=false, target=null, path length=0 and needsPlan=false. These are stationary completed planning decisions with unchanged blocked knowledge, not stuck centering/escape operations. On a diagnostic knowledge copy, removing only actually-safe stale memories restores A* for **every** agent. The real agents' memories are not remotely cleared.

### Seed 0

All agents retain route cell **(45,11)**, distance **4.1231** cells, outside the four-cell radius. For agent 0 it was last observed at **20.8 s**, and last became actually safe at **34 s**, after it was outside view. Its own cell/route are physically safe at 300 s; no observation is entitled to clear that remote memory under the current rule.

### Seed 2026

All remaining remembered navigable blockers are actually safe and outside radius. The following distances are from the common final position. Observation/clear times below are agent 0's audit history; the script retains each agent's own history.

| Remembered cell | Distance | On current actual A* route | Last observed / last actual clear (s) |
| --- | ---: | --- | --- |
| (40,39) | 7.0711 | Yes | 14.8 / 106.6 |
| (40,40) | 6.4031 | Yes | 15.45 / 106.6 |
| (41,40) | 5.6569 | Yes | 17.35 / 104.5 |
| (41,41) | 5.0000 | Yes | 18 / 104.5 |
| (42,41) | 4.2426 | Yes | 19.85 / 90.45 |
| (50,47) | 5.8310 | No | 57.2 / 63.1 |
| (46,48) | 4.1231 | No | 63.4 / 71.1 |
| (50,48) | 6.4031 | No | 55.3 / 65.1 |
| (46,49) | 5.0990 | No | 61.6 / 69.1 |
| (46,50) | 6.0828 | No | 59.6 / 67.1 |
| (47,50) | 6.3246 | No | 57.75 / 65.1 |
| (48,50) | 6.7082 | No | 57.5 / 65.1 |
| (49,50) | 7.2111 | No | 55.7 / 71.1 |

Thus nearby-looking cleared terrain does not establish sensed clearing: even 4.12 or 4.24 cells is outside this model's radius. Other unreported seed/ignition combinations cannot be diagnosed from appearance alone; the same audit can inspect them.

## Verification

**94/94 tests and production build pass** after the boundary fix. New tests cover exact-edge safe refresh/replanning, independent mixed recovery and every remaining agent/in-radius observation in the two real failure cases. Existing partial-segment safety, hot/fire loss/escape, reset/replay, count conservation, fixed-map timelines, generator digest and both-awareness comparisons pass unchanged. Seed 7 remains Global 88.9 s / Local 153.85 s; seeds 0/2026 remain Local unfinished at 300 s (20 trapped, zero lost). No new browser stopwatch or human pass is claimed; no long manual rerun is required for this diagnosis.

## Proposed bounded retry - not implemented or approved

A separate policy could treat **old unobserved blockage as uncertain**, not safe. Initial illustrative proposal:

1. After five continuous simulation seconds trapped, permit a retry at most once per five seconds.
2. Only reconsider remembered hazards currently outside sensing radius and not observed for at least ten seconds. Select candidates from age/distance alone, never hidden actual cooling or global route availability.
3. Retain the last blocked observation/history, but allow an optimistic planning copy to treat eligible cells as uncertain. Current sensed hazards remain blocked and observation refresh resets their age. Do not label a remotely remembered cell safe.
4. Re-observe on approach and keep authoritative next-step/hot/fire checks and current buffer-escape/loss rules. Reconfirmed blockage causes stopping/replanning; repeated failed probes could back off to a capped longer interval.

This can prevent permanent waiting on stale memory, but may cause cautious revisits/backtracking, more A* calls and delays near hazards that are still present. It does not guarantee evacuation. Five/ten-second values and any backoff are proposed tuning choices requiring approval, not new current requirements. No retry timer, forgetting, uncertain state, remote clearing or radius increase was implemented.

## Short recheck

- No additional long runs are needed to establish these known causes. Review the retry proposal before changing policy.
- Reset/mode lock should still work. The known 0/2026 stalls are expected to persist with the unchanged conservative policy; they are **not marked passed/resolved** by the numerical fix.
