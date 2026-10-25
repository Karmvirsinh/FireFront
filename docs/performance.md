# Local MVP performance verification

## Status and measured workload — 2026-10-11

Two fresh, complete production-preview runs met the 30 FPS criterion on this local setup: both averages and every complete approximately one-second window exceeded 30 FPS. This is an automated, visible local-browser result, optional manual reproduction **not performed**; it is not a guarantee for other hardware or a complete MVP acceptance sign-off. The interrupted earlier capture was discarded as evidence.

The requested baseline is a **1280×720 browser viewport**, containing a **922×555 CSS-pixel canvas**, with a **922×555 drawing buffer** at device pixel ratio **1** (existing cap remains 2). Project requirements do not specify a separate canvas interpretation. This measurement does not establish performance with a full 1280×720 drawing surface.

Built production code: commit `387f42eb5ee8b059d329e5b3edbcf6f179b601d7` on `feature/performance-validation`, built at `2026-10-11T17:38:32.578Z`. Instrumentation was uncommitted: index.html, src/main.js, src/rendering/createScene.js, src/styles.css, src/performance/, tests/performance.test.js and vite.config.js. Documentation/results were added afterward without runtime changes. At measurement time main was at the adopted scene-readability checkpoint `387f42e`. The validated instrumentation was subsequently committed as `34c9ddd` and fast-forward adopted on main; branches and comparison tags are retained. These historical measurements retain their original build metadata.

| Environment | Recorded value |
| --- | --- |
| Browser | Codex in-app browser, automated through browser UI tools, visible foreground; not headless, not a physical-mouse browser test |
| Browser engine | User-agent reports Chrome/155.0.0.0; exact unreduced patch version unknown |
| OS | Microsoft Windows 11 Home, 10.0.26200 |
| CPU | AMD Ryzen 7 8845HS w/ Radeon 780M Graphics; 8 cores / 16 logical processors |
| RAM | 15.26 GiB OS-visible; exact installed capacity unknown |
| GPU used by WebGL | NVIDIA GeForce RTX 4060 Laptop GPU, ANGLE / Direct3D11 |
| Drivers | NVIDIA 32.0.16.1656; additional AMD Radeon graphics 32.0.11020.6003 |
| WebGL | WebGL 2.0 (OpenGL ES 3.0 Chromium) |
| Acceleration | Renderer names the hardware NVIDIA GPU, with no software-renderer indication; independent browser acceleration-setting inspection unavailable |
| Scene | Unchanged 64×64 grid, 20 agents, default overview, ignition (32,32) |
| Motion | Normal animation explicitly enabled with benchmark-only URL option; system reduced-motion preference was true |

Reported renderer: `ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028A0) Direct3D11 vs_5_0 ps_5_0, D3D11)`. The device-model identifier in this renderer string is not a unique machine identifier. No machine names, serial numbers, accounts or unrelated personal data were collected. Hardware specifications were obtained separately from OS queries; the browser export leaves unavailable fields marked unknown.

## Method and results

Fresh production build; at least five seconds of visible rendering warm-up. Start measurement when **Start fire** ignites (32,32), continue for 60 seconds of actual foreground wall time, then wait for evacuation completion. Reset and repeat in the same tab without changing camera, viewport or animation. Neither run recorded hidden-tab, focus, resizing, camera-gesture or population-conservation interruptions.

| Run | Duration (s) | Frames | Average FPS | Lowest 1 s FPS | p95 interval (ms) | Windows below 30 | Final evacuated / lost | Completion wall time (s) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | 60.0009 | 8,639 | 143.98 | 142.02 | 7.5 | 0 / 59 | 20 / 0 | 60.7995 |
| 2 | 60.0069 | 8,641 | 144.00 | 143.00 | 7.5 | 0 / 59 | 20 / 0 | 60.8058 |

At capture end, simulation time was 60.0 s in both runs; completion simulation time was 60.8 s. Final waiting/evacuating/trapped were all zero. The benchmark checks count conservation on every rendered frame. Existing scenario tests verify the intermediate reroute, trapping and recovery behavior; these captures do not export an event trace for every agent decision.

Raw results, conditions and individual window samples: [performance-results.json](performance-results.json).

Measurements use timestamps immediately after the existing renderer draws; there is no second render loop. Average FPS is rendered-frame count / actual elapsed seconds. Frame intervals include scheduling delays and stalls, without the simulation's 250 ms cap. p95 uses the nearest-rank 95th percentile of these intervals, not a GPU timer or certified display-presentation latency. The first interval is from ignition to the first rendered frame. Capture ends at the first rendered frame at or beyond 60 seconds, hence slight overshoot.

One-second windows end on a rendered frame at or beyond one second, using actual elapsed time. Each run has 59 complete windows and a trailing partial window (0.7713 / 0.7977 s respectively). Partial windows contribute to overall average and p95 but are excluded from the minimum/window-below-30 statistic. Thus the reported floor describes these complete windows, not every possible sliding window or every individual frame. Approximately 144 FPS likely reflects a local scheduling/display ceiling; it is not a hardware capacity estimate. No concrete bottleneck was observed, and no quality, timing, map, population, dependencies or pixel-ratio settings were reduced to obtain these results.

## Counter and opt-in capture

`FPS: …` is always present in the viewport header and updates roughly once per second from actual elapsed render time. Hidden time is excluded; returning resets the baseline, so suspended time is not averaged into the next sample. Simulation reset does not reset the independent FPS clock. Cleanup removes listeners and revokes export URLs.

Only `?benchmark=1` enables the small JSON export link and read-only report element. No permanent window debug API is exposed. `&animation=normal` explicitly restores the existing normal scene/button animations for the benchmark, even if reduced motion is enabled; ordinary URLs retain accessibility preferences. Invalid conditions are recorded, not silently corrected. Hidden/focus changes invalidate a run rather than pausing it. Two runs are retained per page load; reload for a fresh set. Export after both have final counts.

## Reproduce in a physical browser

1. From the project folder, run `npm.cmd run build`, then `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Use an existing running preview instead of starting a duplicate. Open `http://127.0.0.1:4173/FireFront/?benchmark=1&animation=normal`.
2. Set the browser's **content viewport** to 1280×720 CSS pixels; outer window dimensions include browser chrome and do not suffice. Preserve normal device pixel ratio and the application's cap. Confirm exported viewport/canvas/buffer sizes, default overview (R), visible foreground focus, normal animation and no blockers. Reload after sizing, then wait until “ready” (at least five seconds warm-up). Record full browser version and hardware acceleration status from browser settings where available, plus OS/CPU/GPU/RAM without identifiers. Record whether measurement used responsive emulation, ordinary physical browser, automation, headless or software rendering.
3. Use I/button and select (32,32), checking the status text. Press Start fire. Leave tab and camera untouched for at least 60 seconds and until all agents finish. Do not open other tabs, resize, scroll/zoom the scene or change camera during capture. Reset, select the same cell and repeat. Download JSON after both runs complete.
4. Compare averages **and** lowest windows, p95 and below-30 counts; inspect valid/issue flags and final counts. An interrupted/invalid run is not evidence: reload and repeat both. Report dimensions and any software/acceleration uncertainty alongside the result. A separate full-canvas test or other machine requires a separately described measurement.

## Verification and user-reported closeout

Current automated suite: **60/60 passed**, including FPS math, actual stalls, invalid conditions, hidden/return sampling, reset independence, capture/export/cleanup, two-run completion and all prior simulation/navigation/loss/camera/rendering regressions. Production build passed (30 modules). `git diff --check` passed.

Agent-browser observations: production captures above, post-run reset to 20 waiting, readable updating FPS at desktop / 360×640 / 1280×360 with no horizontal overflow. Development ignition, wheel zoom, reset and R worked with the FPS present; no benchmark UI appears at the ordinary development URL. Both inspected consoles had no warnings/errors. Switching automation tabs did not make the earlier document hidden, so genuine tab-hide/return behavior was initially fixture-verified. The user subsequently confirmed FPS readability across window sizes, sampling returning after minimizing, navigation, ignition, reset and camera preservation, and no red errors in both development and preview consoles. These are user-reported checks, not additional automated observations. Optional manual benchmark reproduction was explicitly skipped: **not performed**, not passed. Direct-fire loss remains fixture-verified, not visibly demonstrated by these nonfuel-road runs.

## Awareness provenance

The recorded fixed-map captures above used the original **Global Awareness** behavior. Fixed-map/benchmark entry points continue to force Global after adding the Local setup option. Local Awareness and generated-map functional traces are not new FPS measurements and do not replace or relabel these results.
