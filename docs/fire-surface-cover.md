# Fire and exposed-surface agreement

## Validation record and scope

Subsequent user report (2026-11-12): the fire fix was manually validated with Codex. This supersedes the historical pending recheck below; no extra scenario timings are inferred.

The user reports the latest **v10 manual checklist passed**. This supersedes its earlier pending checklist status; it does not validate the new fire correction or infer extra scenario timings. Ground-patch, shrub-variety and trail-readability feedback remains pending. No work on those refinements or asset/fine-terrain trials begins during this correction.

Work remains uncommitted, now on `feature/beta-visual-integration` at38010a2. The preparation-only `codex/asset-terrain-comparison` branch, downloaded CC0 archive, baseline archive/manifest and comparison notes remain preserved. No imports or comparison implementation were made. No merge/push/deploy or human-validation claim for this fix.

## Reproduction and separate hypotheses

Known user case: **seed7, selected/ignited cell(37,80)**. No fire screenshot was attached to this supplied prompt, so findings are from the recorded coordinates, simulation traces and subsequent browser reproduction, not a claimed inspection of a missing image.

In v10, (37,80) is forest fuel on a roughly19° top/shoulder. Downhill(38–41,80) also contains forest fuel, at roughly39°,51°,55°,56°. The terrain shader painted those steep faces as rock/earth, and trees were omitted above35° as a render-placement choice. At15 simulated seconds after ignition, cells37 through41 on that row are all actually burning. Thus this is primarily a **fuel/material disagreement**, not only overhanging flame graphics.

Current terrain is a continuous shared-corner heightfield. Those neighboring triangles share their edges; there are no genuine vertical discontinuities, stacked surfaces or disconnected top/bottom meshes. Four-neighbor spread ignores slope/distance but followed a logically fuel-bearing continuous surface. No extra fire-edge barrier is required to fix this example: explicit nonfuel face cells stop the existing no-jump rule. Future true discontinuous cliff geometry would require its own tested surface/edge connectivity model; none is invented now.

## Small coherent correction

Current generation becomes **forest-composition-v11**, with **landform-cover-v1** surface/fuel data. Terrain remains simulator-composition-v2, with **identical heights, selected attempts, trails/bypasses, endpoints/spawns and physical walkability**. `createGeneratedMapV10` preserves the prior exact map/fuel/timing profile; older fixtures remain unchanged.

Explicit exposed substrate comes from existing landforms, not every steep cell:

- Tableland/terrace boundary risers near their polygon outlines, when actually contributing to the visible surface.
- A ridge's **narrow exposed flank**, distinct from its broader vegetated flank and optional branches.
- Existing dry-cut mineral beds and exposed cut banks.
- Previously nonfuel obstacles/clearings remain nonfuel.

A separate illustrative **32° minimum face-steepness setting** helps identify risers/flanks/banks; it is not the agent20° walking limit, and steepness alone never makes ground mineral. Hills, broad flanks and continuously vegetated slopes can retain fuel above35°. Dry mineral beds can be nonfuel while flat. Buried features do not strip fuel from another landform above them. Plateau tops retain their original fuel unless they were already nonfuel or contain an actual cut. No landforms, navigation rules, edge exposure model, timings, health/loss or weather behavior are changed.

Cells marked mineral get `fuelType: none`, `surfaceCover: mineral` and a reason; other fuel cells have `surfaceCover: vegetated`. Broad terrain and walkability fields are preserved independently. Protected trail/endpoint data is untouched. Generator validation rejects cover/fuel disagreement.

Rendering reads the same explicit cover. Mineral faces use the existing bare earth/stone finish. Corrected fuel cells no longer receive a bare rock coat from slope alone; steeper vegetated surfaces receive a restrained green-understory cue over existing regional/litter treatment. This is fuel-coverage clarity, not the deferred ground-patch redesign. Existing vegetation placement skips newly nonfuel cells automatically, so no tree/shrub/grass or charred remnant remains owned by a mineral cell. Remaining models retain their normal lifecycle and reset ownership.

The fire view rejects mineral-cell flames/embers even if given an inconsistent visual-state update. Neighboring fuel-cell flames retain their existing height/flicker but constrain lateral footprint beside mineral cells, reducing misleading overhang onto a nonburning face. Embers remain surface-conforming. No new fire animation is introduced.

Existing simulation selection/spread now naturally reject those cells because their initial fuel is zero. Burnout, cooling and reset use the corrected authoritative map. Fire's four-neighbor exposure formula, consumption/cooling values, fixed steps and agent behavior are unchanged. Fire may still reach lower ground by going around a face along another continuous vegetated connection; that is not a jump across mineral.

## Regression coverage

Fixtures cover a vegetated tableland top, explicit nonfuel riser and vegetated lower ground: direct ignition is rejected on the face and the lower ground remains unburned when the mineral band is the only connection. A continuous vegetated slope above the walking limit still spreads. Seed7/(37,80) keeps top fuel, strips the narrow exposed band(38–44,80), retains other steep vegetation and leaves the band unburned after15 s. Mineral-cell visual updates stay hidden, adjacent flame geometry remains in its fuel footprint, and reset/replay is exact. Seeds0/7/34/2026 preserve heights, all trails/spawns, terrain labels and physical walkability; only explicit substrate fuel is removed. Historical/fixed scenarios remain separate.

## Actual verification

- Full sequential suite: **174/174 passed** (~327 s), including historical/fixed-map regressions. After tightening the contributing-feature guard, the focused surface/fuel suite passed **5/5** again. Production build passed (84 modules); the existing chunk-size warning remains visible. No dependency or warning-policy change.
- Bounded 180-s traces conserve all20 agents. Seed7/(37,80), both Global and Local: v10 and v11 each evacuate20 at **110.70 s**, with0lost/0trapped. In v10 the exposed band burns and lower cell(45,80) ignites at16.00 s; in v11 the band and that lower cell remain unburned throughout180 s. Thus fire outcomes change intentionally, while this evacuation result does not. This is not a promise that fire cannot travel around another vegetated connection.
- Seed0/(44,7), both models: v11 evacuates20 at **110.00 s**, matching the recorded v10 result. Old seed7/(83,65) timings have not been remeasured for v11 and remain historical evidence only.
- Development and rebuilt production preview: generated seed7 identifies v11; bare-face picking rejects ignition; the top selects exactly(37,80); active fire stays on the vegetated side; burnout/cooling and reset restore the corrected surfaces/plants. Reset preserves the zoomed camera and restores20waiting. Production R/regeneration restores the overview/setup. Development's full run visibly reports20evacuated/0lost/0trapped at110.70 s. Both warning/error consoles were clear during these checks.
- Automated browser input is not a new physical-mouse pass. No new human validation or performance benchmark is claimed. The latest v10 user-reported passes remain separate from this pending v11 correction. Ground-patch, shrub-variety and trail-readability refinements remain deferred.

## Targeted human recheck

1. Generate7 and ignite(37,80). The top remains eligible; the bare narrow face downhill should reject selection and remain unburned. Follow any later lower-ground fire around its actual vegetated connection rather than assuming every lower cell must stay safe forever.
2. Inspect a continuously vegetated slope: it should still ignite/spread despite steepness. Continuous ground cover, not individual decorative tree gaps, defines fuel.
3. Inspect flames/embers against mineral boundaries, burnout and reset. Reset should restore the corrected map and all remaining vegetation, preserve the camera, and leave mineral faces bare/nonignitable.
