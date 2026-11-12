# Beta terrain refinement — November 12

Validation update: the user subsequently reported all latest v10 checklist items passed. The earlier pending statements below are historical. This does not validate the separate [v11 fire/surface correction](fire-surface-cover.md); ground-patch, shrub-variety and trail-readability feedback remains pending.

Status: uncommitted on `feature/beta-visual-integration`, HEAD38010a2. All earlier integration work is preserved. The user has observed meaningful variation across seeds: this is not evidence of a seed-generation bug. Familiar landform types are acceptable; repeated silhouettes and surface presentation remain refinement concerns. The earlier vegetation checklist passed; the latest terrain-integration checklist is **not fully confirmed**. No additional human passes or overall acceptance are inferred.

## Visual corrections independent of generation

The abrupt rectangular bare areas come from `clearing` cells (nonfuel, physically walkable, excluded by Path-first). Scattered flat gray stamps come from `obstacle` cells (nonfuel, physically blocked), produced by the existing rock-noise classification. The shader's nearest-cell switch had overridden all regional treatment with a single clearing or rock finish. Older polygon boulder meshes are separate and remain unchanged.

A small deterministic substrate-neighborhood texture supplies smooth bare-earth and bedrock shoulders over three cells, with restrained spatial irregularity in the existing shader. Clearing interiors remain earth/litter/gravel, never lush meadow. Adjacent fuel may have an earthy forest-floor finish; it remains ignitable. Obstacle interiors mix surrounding earth with weathered stone and slope-based rock treatment, rather than stamping flat gray squares. Actual steep faces retain triplanar stone/earth strata and cracks. Trails and endpoint indicators retain exact footprints, and nearest-filtered fuel/category/fire masks remain authoritative. Fire states override substrate; reset restores the original finish. No geometry, classifications, old boulders, picking targets or traversal rules change for this correction. Rejected rock-fragment formations remain removed.

Material shoulders deliberately do not advertise exact hazard or walkability boundaries: the torch checks ignition and Path-first remains trail-only. Any future physical-rock relocation/classification change needs separate approval; none occurs here.

## Silhouette refinement

Current **forest-composition-v10**, terrain **simulator-composition-v2**, retains the previous composition architecture and 104×104 layout scale. A separate `landform-morphology-v3` stream extends the same operators:

- Hills vary elongation and nonlinear lateral skew.
- Polygon tablelands/shelves vary stretch, asymmetric multi-lobed indentations and shoulder profile/riser width.
- Existing optional terraces keep varying count/width; their outlines now vary independently.
- Ridges vary cross-sectional falloff, unequal shoulders and optional tapering branches joining their existing spine.
- Existing optional basin, flat blend and branching descending-cut combinations remain; no feature is compulsory in every seed.

The original feature-selection stream is preserved; morphology is additional shape variation, not a catalogue of fixed maps. Terrain still comes before endpoint fitting and final trails. Production20° full-face/cardinal-edge limits, gradual preferred routing, compact trails, all-spawn reachability, optional alternatives and bypass protection remain. Zero grading; no routing redesign or lost features flattened to fit trails. Generation remains bounded to96 attempts and retains the previous usable map on failure.

`createGeneratedMapV9` and `createComposedTerrainV1` preserve the preceding v9 composition, layouts and recorded timings. The existing beta-landform scenario suite explicitly uses that historical profile. V8/V7/V6/V5 and fixed fixtures remain. Current 0/7/34/2026 heights all change; seed7 selects attempt18 instead of17 and seed34 selects3 instead of42. Their prior layouts/timings are not automatically current evidence. Vegetation/fuel streams and artwork, agents, awareness/hazards/loss and fire timing are unchanged; different trails can legitimately alter fuel carving and outcomes.

## Presentation and matched inspection

Generated production maps now use the prototype's shared warm lighting, green-gray background, ACES tone mapping/exposure1.25 and explicit sRGB output. The flat fixed-map scene retains its previous presentation. Ordinary production does not incur a new shadow pass; ordinary prototype retains its existing shadows.

For an actually matched comparison, append **`?comparison=1`** to either page. This opt-in inspection view uses the same43° FOV,0.1/500 near/far clipping, normalized(0,1,0.65) direction, world target(0,4,0), and **0.12 world units per CSS pixel at the target plane**, computed from the real canvas height. Both disable shadows and share light colors/intensities/direction, output color space and exposure. At a desktop browser width of at least998 pixels, comparison-only CSS fixes BOTH canvas content sizes at640×480, making camera position and aspect identical too. Both distances are73.113 world units (computed from480 pixels and0.12 units/pixel). Smaller widths may clip differently and are not claimed as matched captures. No second render loop/debug global is added. Production R restores this inspection framing, and normal URLs retain normal camera behavior. Changing views/zoom/orbit invalidates the matched-camera comparison; prototype Close-up is intentionally a custom view. Use Overview/R to restore the matched framing.

The32-unit prototype and52-unit simulator use different composition profiles/streams, so matched cameras do **not** imply identical terrain, canopy density or layouts. Gaea remains an isolated authored comparison with unchanged source/license records; no new export.

## Reproducible review sample

Sequential seeds0–7 plus34,2026. Scattered seeds are generated with `seedStream(9973,'silhouette-review-v1')`, taking eight unsigned32-bit values:
4016071232,3734182606,2992480150,1164920610,737253803,3500804708,2599641472,3749864590.
All18 initial generation checks succeeded, with all final permitted cells/connections slope-safe and every spawn connected. Families include woodland, plateau and ridge; sample relief approximately3.12–8.91 units. This diagnostic is not visual acceptance or a performance benchmark. Difficult seeds can still exhaust the bounded search; safe failure remains supported.

Sequential full suite: **168/168 passed** (about260 s), including historical v9 exact scenarios, fixed fixtures, current18-seed determinism/connectivity, reset/lifecycle, loss/awareness, picking and cleanup. Subsequent comparison framing refinements and a startup recovery were checked with **4/4 focused tests**, followed by3/3 focused presentation/substrate/startup checks after final camera clipping alignment. This is not a claim that the later169-test tree was run in one full invocation.

Final production build passes:83 modules, main81.75 kB /30.63 gzip, shared628.28 kB /161.91 gzip, prototype822.96 kB /340.74 gzip. Existing chunk warnings stay visible. Diff checks pass. No new dependencies, assets or benchmark tooling.

Fresh **v10** fixed-step traces (180-s maximum) conserve all20 agents:

| Seed | Ignition | Global completion | Local completion |
| --- | --- | --- | --- |
| 0 | (44,7) | 20 evacuated,110.00 s | 20 evacuated,110.00 s |
| 7 | (83,65) | 20 evacuated,116.00 s | 20 evacuated,128.50 s |

No losses in these cases. These are simulation traces, not user timing reports, not a guarantee for other maps, and not a claim that Local always finishes sooner. Historical v9 results remain separate.

## Concrete startup/failure finding

Browser inspection drew random seed**2127148330**, outside the18-seed review sample. It exhausts96 attempts. The generator correctly rejects it; the previously uncaught FIRST-load error left the entry/lifecycle initialization incomplete because no previous map existed to retain. This is distinct from the user's clarified silhouette feedback, not a diagnosis of repeated seeds or a routing redesign.

Small recovery: initial random-seed failure loads validated seed0 and visibly reports the failed seed and fallback in setup. It does not retry indefinitely, relax constraints or silently alter the requested generator. Seed0 failure still surfaces as an error rather than recursively falling back. Successful initial seeds and fixed/benchmark entries are unchanged. A controlled fixture verifies both recovery and the unrecoverable fallback case. Browser submission of the real failing seed AFTER a live seed0 run/reset confirms “Generation failed; current map retained”,20 waiting agents and intact camera/session. The old pre-fix console error is retained as diagnosis evidence; it is not described as a clear historical console.

This generation remains synchronous; difficult/failed seeds briefly pause rendering. The18 reviewed successful seeds do not establish universal seed validity or a new performance result. A broader async-generation/routing redesign is outside this increment.

## Actual browser evidence

Reused one tab and existing dev5178/preview4178 servers, with heavy checks sequential. Development visually inspected0,2,7,34,2026 and3500804708, overview/closer zoom, and the retained Rugged/7 prototype. The new earth/bedrock transitions compile and appear softer; older gray boulders remain. This is agent inspection, not human appearance approval.

Normal dev and rebuilt production selected seed0/(44,7), rejected bare route(47,16) and a nonfuel clearing near(69,4), and both Local results popups reported **20 evacuated/0lost/0trapped at110.00 s**. Development visibly inspected standing/darkened burning trees, exhausted/remnant surfaces and burned-cool status. Inspect/reset in development and Replay in production restored plants/ground/20 waiting; camera-preservation and lifecycle regression tests also pass. Regeneration retained one canvas. R/wheel and panel isolation were exercised; physical pan/orbit and precise post-movement human picking remain pending.

Production normal-layout smoke checks passed at390×740 (375-pixel page,349-pixel canvas, no horizontal overflow) and1280×600. Temporary viewport sizing was cleared. Production warning/error logs since loading the corrected build were empty. Development retains the earlier **pre-fix startup error** in tool log history; no subsequent new error was observed. No errors were hidden or warning thresholds changed. The existing FPS readout was around144 during ordinary desktop activity, with a brief pause/readout dip during difficult synchronous generation. No benchmark or full-MVP performance claim.

Final matched screenshots use **production preview**, seed7 normal map and Rugged/7 study, identical640×480 CSS AND drawing buffers,43° FOV, aspect4:3, clipping0.1/500, world target(0,4,0), direction(0,1,0.65), distance73.1130594, zoom1, shared lighting/ACES1.25/sRGB and shadows off. Both source camera presets and measured canvas dimensions agree. The pictures differ in terrain, vegetation density and prototype inspection overlays; those are not camera/light differences. Original gallery silhouettes remain the historical study profile; normal generation opts into the added morphology. Saved cropped640×480 review images outside source. Current normal preview is left on seed0 setup.

Review links: [Development](http://127.0.0.1:5178/FireFront/), [Production](http://127.0.0.1:4178/FireFront/), [matched simulator](http://127.0.0.1:4178/FireFront/?comparison=1), [matched prototype](http://127.0.0.1:4178/FireFront/terrain-art.html?comparison=1). Use seed7/Rugged7 and Overview/R without custom camera movement for the documented match. No new human passes inferred; all work remains uncommitted at38010a2 on feature/beta-visual-integration. No merge/push/deploy.

## Manual review

1. Inspect seeds0,7,34,2026 and scattered seed3500804708. Judge silhouettes and compatible feature transitions separately from whether terrain types are familiar.
2. Inspect nonfuel earth clearings and blocked bedrock near vegetation: quieter boundaries, no lush nonfuel cover, readable exact trails and retained old boulders.
3. Compare normal/prototype using `?comparison=1`, Overview/R and the same browser viewport. Judge shared color/light settings; custom camera movement is no longer a matched view.
4. Verify elevated fuel selection, nonfuel rejection, lifecycle/evacuation, reset/camera preservation, regeneration, physical navigation and consoles. No new human check is marked passed yet.
