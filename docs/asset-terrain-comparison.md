# Isolated asset and fine-surface comparison

## Initial comparison record (superseded by corrections below)

On `codex/asset-terrain-comparison`, HEAD38010a2, carrying all existing beta/v10/v11 work without a commit, merge, push or deployment. Before comparison edits, all34 pending files were archived with a SHA-256 manifest outside the repository. A final manifest comparison before documentation updates confirmed every preexisting pending file unchanged. Only isolated comparison modules/page, licensed subset/data, focused checks, documentation and an additional Vite HTML entry are added. Normal application and original prototype source are unchanged by these trials.

**Fire-fix status, separately:** the seed7/(37,80) correction is implemented and agent/automated checked as recorded in [fire/surface correction](fire-surface-cover.md). The user confirmed this was the intended defect, then authorized comparison work to resume. No new physical-mouse checklist pass or separate fire-fix checkpoint is inferred. Ground-patch/shrub/trail feedback is not marked resolved by a comparison.

## Verified asset candidate

- Pack: **Kenney Nature Kit**, downloaded archive's internal license names **Nature Kit (2.1)**. The website's update summary separately says1.0/2020; retain the archive identity rather than inventing a newer release.
- Official source: https://kenney.nl/assets/nature-kit
- License: CC0, https://creativecommons.org/publicdomain/zero/1.0/
- Official page and archive `License.txt` checked November12,2026. Archive explicitly permits personal, educational and commercial use, with credit optional. CC0 permits modification/redistribution; no attribution requirement. Retain source/license and a courtesy credit when a small subset is imported. No implied Kenney endorsement.
- Original archive SHA-256: `fa7974a0d342bfe63c38664ba9f8ec1a4aab8ea25f099bdc56870e33588c4d9d` (10,537,521 bytes). Downloaded through the official browser Download → Continue without donating flow; old static ZIP URL redirects to HTML, and the direct signed-link request did not work outside that flow. The full archive remains OUTSIDE project source. No catalogue has been imported.
- Candidate small selection to inspect: `tree_oak`, `tree_pineDefaultA`, `plant_bush`, `plant_bushLarge`, `grass`, `grass_large`, `rock_smallA`, `rock_largeA` in GLTF format. Final selection/scale needs actual silhouette review, especially low/spreading shrubs. Do not assume names establish suitability.

## Terrain preparation facts

The original512×512 PNG16 Gaea heightmap remains available under ignored `logs/gaea-gui-trial/export`, with provenance hashes in the existing comparison data. Existing Gaea comparison supports129/257 corners; the next trial should sample a still-finer mesh from that ORIGINAL export, retaining32-unit footprint and common height range. Procedural trial surfaces must evaluate original analytic functions at finer spacing, not resample coarse triangles. Logical dimensions remain unchanged. Active displayed surface must drive picking, placement and conservative fine-barrier inspection, with one active renderer/scene and explicit disposal/cost records.

Gaea's Community/bundled-example restrictions remain those in [Gaea trial](gaea-trial.md), separate from the Kenney CC0 license. No new Gaea export or authorization to redistribute its source graph is inferred.

## Implemented isolated page

Open `asset-terrain-comparison.html` through Vite/preview under `/FireFront/`. Links return to the normal simulator and original terrain studies. Four choices: Gentler/7, Mixed/34, Rugged/913 and authored Gaea. A/B changes artwork on the SAME map, placement manifest, camera, light, color pipeline and density; it does not compare two unrelated screenshots. Overview/Close-up and wheel/right-pan/middle-orbit/R remain available. Panel interactions never reach the canvas. Original and pack artwork are normalized with uniform scale into common height/radius envelopes, retaining individual proportions and the pack's cooler/brighter palette. Both use the same matte nonmetallic material instead of inheriting misleading metallic import defaults.

Eight GLBs and original license/source record are under `public/comparison/kenney`. GLB node transforms and material colors are baked into instanced geometry; no external texture requests. Low, spreading `plant_bush` and `plant_bushLarge` are visibly/automatically checked as shrubs, not miniature trees. Shared placement is seeded, associated with a logical cell, terrain anchored and conservatively clear of trail footprints. Gentler/7 has215trees,254shrubs,819grass placements in both choices; Rugged/913 also exposes the rock comparison. Actual geometry silhouettes/palettes differ intentionally. No pack models enter production.

## Real geometry refinement

- Procedural: **65 /129 /257 corners**, same32-unit study footprint and unchanged64×64 logical cells. Re-evaluate the original landform functions at1/2/4 subdivisions per cell, using the original selected attempt and normalization offset. Do not subdivide already sampled triangles.
- Gaea: **129 /257 /513 corners**, same32-unit footprint and128×128 logical cells. `scripts/exportComparisonHeight.py` extracts the ORIGINAL512² PNG16 samples to a524288-byte little-endian uint16 file; source hash/encoding are alongside it. No new Gaea session/export. Bilinear native-height sampling uses sample/65535×16.513 corners align4subcells with each logical cell; this resamples512source samples rather than claiming513independent source samples.
- Every mode retains the same original observed height range. At Gaea257/513,4/12samples respectively are clamped to that common range, not independently normalized. Rugged/913 at257 clamps23samples. Gaea's source remains the same restricted educational authored comparison; Kenney CC0 does not cover it.
- Indexed geometry avoids large duplicate vertex buffers. Surface sampling, ground-only raycasting, upright object bases, scan markers and selected logical-cell outlines use the ACTIVE displayed triangles. No raycast copy of the large terrain mesh is created. Geometry resolution is independent of simulation resolution; no normal-app grid or production20° rule changes.

## Fine barriers are not ignored

Comparison eligibility uses the maximum actual fine-triangle slope in each logical cell and sampled center-to-center edge segments. Keep physical classification and Path-first permission separate. This is still the isolated illustrative50° prototype capability, never adopted by production. Forest/rock classifications block independently; decorative canopy does not block a trail.

At Rugged/913,257corners reveals **1blocked trail cell /2blocked edges** missed by the coarse mesh. The page reports the route as having fine barriers; it does not reroute it, weaken the slope test or silently claim a valid fine route. Mixed/34 at129 remains connected in the inspected case. Gaea has no routed trail. Fine geometry adoption would require routing/construction to use the same finer constraints; that is a concrete future integration blocker, not a change made during these trials.

## Actual checks and ordinary costs

Focused comparison, historical material and50° tests: **11/11 passed**; the final comparison-only5/5 also pass after adding exact-once resource-disposal assertions. The earlier fire task's174/174 suite is retained as separate evidence, not relabeled a full run after this comparison. Production build passes with the additional HTML entry and existing visible chunk warning. No dependency/version changes or performance capture/tooling.

Development and rebuilt preview checks used one reused automated IAB tab. Both had clear warning/error logs. Inspected all four landscape choices, A/B, every Gaea resolution, procedural65/129/257, overview/close-up, wheel/R, ground picking/selected outline, scan and repeated replacement. Narrow390×740 layout stacks/scrolls with no horizontal overflow; overview framing adapts to aspect. Returning to the normal development app verifies entry/Skip, seed7/v11 setup and20waiting. Physical pan/orbit and final art acceptance remain human review, not claimed passes.

Cost observations used viewport1280×800, DPR1, same active lighting/camera. Observed production values with original artwork (includes terrain/dressing):

| Gaea corners | Rendered triangles in inspected view | Approx geometry arrays | Switch/build observed | Settled readout |
| --- | ---: | ---: | ---: | ---: |
|129|129564|1.2MiB|151–243ms|144FPS|
|257|228892|4.5MiB|135–258ms|144FPS|
|513|624156|16.6MiB|236–382ms|144FPS|

These are lightweight local readouts, not controlled benchmark averages, GPU-memory measurements or promises on other hardware. Switch intervals briefly lowered the one-second readout (e.g.84.7FPS during513loading); it recovered after settling. Geometry bytes count unique retained attribute/index/instance arrays and exclude textures/driver overhead. The existing FPS sampler is reused; there is no capture/export/debug dashboard. One renderer/loop, previous GPU scene disposed before next construction, only native height samples retained for reuse. Hidden-tab sampling resets.

Gentler/7 A/B: roughly180k/212k rendered triangles,6/8draws, same215trees/254shrubs/819grass. The imported cooler/brighter palette is a visible art-direction difference, not a lighting mismatch. Repeated switching returns to stable resource counts (e.g.8geometries/9textures for original active art without visible scan; scan/outline adds its own bounded resources).

**Recommendation:**129corners remains the inexpensive baseline; Gaea257 is a balanced ordinary detail option, while513 gives visibly sharper small ledges/cuts and is worth retaining for the requested close inspection. It is not silently removed or downgraded. Procedural129 is a useful first fine candidate;257adds less visible improvement for these analytic shapes and exposes the routing issue above. No resolution is automatically adopted into the simulator.

## Human review (pending)

1. Gentler/7: use Close-up, switch A/B without moving the camera. Compare forest edge, meadow, low shrubs and visible trail; inspect Rugged/913 for rocks. Choose preferred art, not a claimed automatic winner.
2. Gaea: compare129→257→513 at the same close view, then Overview. Inspect sharper cuts/shelves versus cost; ground clicks/outline must remain on the displayed terrain.
3. Rugged/913: compare65→257 and enable scan. Inspect the reported fine barrier, cell reason and trail continuity; pan/orbit/zoom, then R. Check narrow layout/scroll, switching and console.

No human pass or final art acceptance is inferred. Gaea remains optional authored terrain; procedural studies remain seeded. Neither is a full simulator replacement.



## 2026-11-12 — Bounded comparison corrections (current)

**User-reported validation:** the user manually validated the fire fix with Codex; other comparison checklist interactions passed. Kenney color and procedural mesh appearance remain unresolved. The user particularly likes the ORIGINAL12-study gallery stones/boulders and their Rugged/913 placement. This does not accept the rejected rock-face fragments; those remain removed. No new appearance acceptance or exact timing is inferred.

### Palette diagnosis and correction

The eight selected GLBs have **no images/palette texture, no texture URI, no material map and no vertex colors**. UVs exist but have no active texture to orient/flip. `leafsGreen` has factor(0.160784319,0.7882353,0.670588255), numerically the sRGB bytes(41,201,171)/255; the archive OBJ material and bundled Side/tree_oak.png confirm the same turquoise palette. Bark is salmon/copper, not dark natural brown. The archive lists KHR_materials_unlit globally but these materials do not actually attach that extension; metallicFactor is1.

`?modelCheck=1` displays ONE untouched imported oak material under neutral white room illumination, NoToneMapping and sRGB output, next to its bundled source PNG. Materials are not overwritten in this diagnostic. The GLB is pale even there: this legacy UniGLTF export stores source-preview sRGB channels in glTF's linear factor slot. The earlier bake copied them verbatim as linear vertex color, producing a brighter/double-encoded palette; strong landscape lighting/ACES then further altered brightness. The isolated importer now decodes those source channels **once**, before the shared matte instanced comparison. This is a documented subset-specific encoding correction, not a green tint or a new palette. Raw GLBs remain byte-identical. Truly natural green is NOT present in this selected source palette: that would require a later deliberate art/pack choice, not an importer invention.

CC0 source/license records and bundled preview provenance remain retained, separately from Gaea restrictions. The neutral PMREM diagnostic produced one driver shader-precision warning in the browser (tiny double constants); no red errors. Do not claim that every warning log was empty.

### Original65 baseline

The original gallery uses unindexed vertices with independent triangle normals. The initial comparison indexed shared vertices and called computeVertexNormals(), averaging them; this substantially smoothed the lighting. Its65corner heights, coordinate origin,32-unit footprint, NW–SE winding and topology were already the same: this part was a **shading regression**, not new landform geometry.

The corrected65baseline now uses the exact historical height array and unindexed face normals; tests compare position and normal buffers exactly against the actual gallery geometry. Fine meshes retain indexing but explicitly use flat face lighting. Material substrate-blend normals remain the same deliberately smoother field as the gallery; they are not the lighting normals. The gallery is not edited to hide the regression.

For matched diagnosis, append `?comparison=1` on both pages. Both verified640×480 CSS/drawing buffers at DPR1,43° FOV, aspect4:3, target(0,4,0), clipping0.1/500, distance73.1130594/direction(0,1,.65), identical warm lights, ACES/exposure1.25/sRGB and shadows OFF. Matched cropped captures saved externally. Extra comparison shrubs remain a stated decoration difference, so no pixel-identical entire-scene claim.

### Fine jaggedness

A real discontinuity existed in the ORIGINAL analytic ridge/cut rules, not trail grading, rounding, UVs, mesh seams or height clamping. Nearest-segment side sign chose a narrow/wide profile using the whole radial distance, including beyond endpoints; crossing the extended spine could abruptly swap widths at nonzero distance. Nearest-segment height selection could also jump at segment boundaries. Rugged/913 at(-13.25,-11.5) changes approximately0.949world units over a0.001horizontal probe. More vertices exposed these unintended jumps as curtains/serrations. Actual terrain is a continuous heightfield, not intentional vertical cliff geometry.

The comparison-only **comparison-continuous-caps-v1** evaluator uses continuous lateral/axial elliptical end caps and max/min envelopes of segment contributions. It retains all seeded operator parameters, genuine steep banks/tablelands, basins/flats/noise, common normalization/range and triangulation. It does not blanket-smooth slopes or add detail. **65 deliberately retains the exact historical field;129/257 use the corrected analytic field**, labeled explicitly in the page. Consequently that change is a source-function correction as well as resolution comparison, not a claim that all samples differ only in tessellation. Historical gallery and production generation remain unchanged. Gaea resampling is untouched and does not use these operators.

The existing fine-face/edge checks remain intact. Rugged/913 now has0blocked trail cells/0blocked edges at65/129/257; prior1/2barriers were consequences of the defective field, not removed by relaxing the test. Gentler/7 and Mixed/34 also show0/0 in all three bounded checks. Synthetic subcell barriers still fail eligibility as before. This does not promise every seed stays connected at higher resolution; the page continues to report any real barrier.

### Original rocks restored

The earlier comparison did inadvertently replace the gallery's scatter: different RNG stream,2200attempts,7%rockchance, two variants and0.60–0.95scale, versus the original2600shared plant/rock attempts,13%conditional chance, THREE variants and0.20–0.85rockscale. It also lost the original low/high-relative-elevation selection. This changed counts/positions/group character.

`originalStudyPlacements` now preserves the actual original rules, random consumption, spacing, species, scale and rotation. Regression compares its manifest directly with createStudyView(map).placements. Rugged/913 restores **183trees,545grass and30rocks (12/9/9 variants)**, compared with the initial comparison's162trees/21rocks. Original rock geometry and its native scaling are restored, without fragments, walls or stamps. A/B uses those same owners/positions/rotations/scales, with imported models fitted to original envelopes; only ground-contact y follows the active surface. Additional low shrub samples have their own independent stream and cannot perturb original rock/tree/grass placement.

All bases remain outside logical trail cells. A conservative circle flags one possible Rugged/913rock overhang, but actual transformed projected rock hulls do NOT overlap any of its122trail footprints; no random repositioning/filtering was applied. Bases follow the same authoritative displayed height; these remain upright decorative rocks, not collision geometry or a new conforming-rock physics system.

### Verification and review

Focused comparison/material/slope/historical-gallery checks pass14/14; tests include exact baseline normals/positions, gallery placement, surface grounding, palette decode without hue override, continuity probes, genuine fine barriers, determinism and disposal. Production build and diff checks pass; the normal simulator/fire sources remain preserved. Current browser and final review evidence are recorded in the progress log. Earlier cost tables describe the INITIAL comparison, not revised scene counts; no new benchmark or full-MVP performance claim.

Recheck: (1) original Rugged/913 vs corrected65, especially stones and faceting; (2) same camera65→129→257, picking/scan/rock grounding; (3) untouched-material source check and corrected A/B colors; (4) Gaea129/257/513 plus switching/narrow layout. Appearance acceptance remains pending.

Reference for linear material-factor semantics: [Khronos glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials). This supports the color-space rule; the legacy-export diagnosis comes from the actual archive factors/OBJ/PNG and neutral render, not an assumption that every glTF needs conversion.

Final observed checks: development matched original/corrected65 and same-camera65/129/257 close views; production Gaea129/257/513, picking/scan, reset-to-overview, narrow390×740 and final Rugged913/65 restored-rock view.14/14focused + separate5/5fire regressions pass; build97modules and diff checks pass. No red errors; the neutral diagnostic PMREM precision warning remains documented. Human visual recheck of these corrections is pending.


## Current presentation pass — 2026-11-12

Smooth/Faceted is now independent of every mesh choice, defaults to Smooth and changes terrain lighting normals only. Substrate material/blending normals, heights, topology, logical/picking data, object placement and scan results remain fixed; vegetation is untouched by this control. Choose Faceted to inspect the preserved original-gallery appearance. Historical65versus corrected fine-field sampling is a DIFFERENT distinction, explicitly labeled; the ridge repair is retained.

Mixed/34 A matches all221original gallery trees, not merely their count: model variants, rotations, native vertex dimensions and final transforms/bounds were measured. Max matrix/world-bound error0; native broadleaf/conifer box heights3.294417/3.259807, scales0.701259–1.099935. No arbitrary density/size reduction. Original30Rugged913rocks remain under the original manifest/rules.

B defaults to a clearly labelled **Kenney · FireFront palette**. Natural varied broadleaf green, darker conifers, earthy bark, coordinated shrub/grass and natural stone/moss colors replace source turquoise/salmon. Source parts retain per-vertex ownership codes; restrained facet and per-instance variation preserve readable form. This is an expressly approved artwork adaptation, not a claim that the original pack was naturally green. The original GLBs/neutral check/source encoding correction and CC0 records remain preserved. No production asset adoption.

Normal comparison now has restrained shadows, like the gallery and generated simulator. A shared shadow camera fits actual map bounds and height/canopy range:1024for32-world-unit studies,2048for52-world-unit simulator. Renderer PCF, mesh cast/receive and sun shadow settings are now wired; these were absent in the simulator. Terrain/trees/shrubs/rocks/agents cast/receive, grass receives only, fire indicators/labels remain noncasters. Back-face depth rendering and modest bias address inspected grazing bands; no material/fuel/grid change. One shadow pass, no per-cell lights or new dependency. Matched `?comparison=1` retains identical640×480camera/light/color with shadows OFF in BOTH gallery and comparison for controlled inspection; normal pages have shadows ON.

Review Mixed34andRugged913at a fixed camera: switch Smooth/Faceted at65/129/257; the scan/cell/plant positions must not change from shading alone. Compare A native vegetation, B adapted palette and neutral source check. Inspect Gaea129/257/513, then simulator shadows at overview/close-up, camera motion/reset/regeneration. New human visual acceptance remains pending.


Final current presentation verification:28/28focused tests passed sequentially, build100modules and diff/UTF-8 checks pass. Browser proof includes matched Mixed34gallery/A at640×480with original Facetedreference; maximum221treeinstance/native/world-bound differences remain0. Both shading modes reviewed for Mixed34/Rugged913at65/129/257and Gaea129/257/513. Re-clicking Mixed34cell(12,49) has identical selection/slope/policy under both modes. Default comparison and generated simulator shadows are ON; matched diagnostic shadows remain OFF on both pages. Finalbias−0.0004/normalBias0.04and back-face depth culling address inspected grazing bands. Dev/preview seed7overview/close, ignition(34,73), readable fire/ash/agents, in-run reset/zoom preservation, R and seed34regeneration checked. No full run timing or new performance benchmark claimed; local settled readout144FPS. Current consoles clear; historical neutral-diagnostic warning remains historical. Physical pan/orbit/new visual acceptance are pending. No production asset/terrain/shading-control adoption; only the expressly authorized shadow restoration affects the simulator.
