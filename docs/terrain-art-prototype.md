# Terrain and art prototype

Visual exploration on **codex/terrain-art-prototype**: original studies checkpointed at **a894d9b**, followed by the uncommitted composition-v2 refinement. Parent **65e1fce — wip: preserve terrain-aware trails pending human validation** remains preserved. The user approved the original low-poly art direction and controls/layout, not final terrain variety/surface detail or the unclear old overlay. Normal FireFront remains unchanged at the root URL. Neither this prototype nor its parent terrain work is merged or deployed.

## Review the examples

Existing servers:

- Development: http://127.0.0.1:5178/FireFront/terrain-art.html
- Built preview: http://127.0.0.1:4178/FireFront/terrain-art.html
- Normal comparison: http://127.0.0.1:4178/FireFront/

If servers are stopped, use two terminals in the project root:

```sh
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
```

Current controls: select any of the **12 gallery buttons**, then use **Overview/R** or **Close-up**. Wheel zooms, middle drag orbits, right drag pans. **T / Scan terrain** starts the brief diagnostic scan; left-click ground for the exact cell and reason. Panel actions do not inspect terrain. The sections below preserve the original six-study implementation as history; the current composition-v2 refinement is documented at the end.

The old mint/terracotta surface overlay described in the historical record is superseded by the current glyph scan. Forest classifications remain blocked even between decorative tree trunks. All bare trail cells and their connections pass the shared 20-degree rule. Physical walkability is separate from the selected trail mask. Dry channel is a terrain shape/material only, with no water or hydrology.

## Original six-study implementation (checkpoint a894d9b)

Each example is a 64×64 shared-corner heightfield, 0.5 world-unit cells (32×32 specimen), using the existing NW–SE triangulation, sampler, terrain geometry, ground picker, construction routing and trail-slope validation. This does not reduce or replace the normal 104×104 environment. Separate art-study random streams do not consume the normal generator streams. Only the two exposed study seeds are supported; this is not a production generator rewrite.

- **Rolling woodland:** broad anisotropic folds, a depressed valley and a smoothly blended flatter clearing. Forest edge/classification and decoration vary with the seed.
- **Irregular plateau:** a seeded, rotated/stretched 12-point broken polygon, narrow finite rock risers, a broad top and a genuine southern heightfield ramp with blended shoulders. The ramp joins through the rim rather than laying a road over a steep wall. Trail climbs approximately 3.2–3.4 world units. No concentric shelf construction.
- **Rugged ridge:** a wandering asymmetric spine with unequal flank widths, variable crest heights/saddles and localized ribs; a lower dry channel lies beside the gentler side. It is not a repeated radial mound.

Rock/earth is selected from actual triangle slopes. Faces above the walkability threshold are blocked; steep rock cells are nonfuel within these isolated study maps. Grass/trees/loose boulders follow the same sampler. Boulders are sparse toward low/high portions of exposed rock rather than uniformly covering every slope. The specimen uses original instanced modular tree/grass/stone geometry, flat-faced canopy variation, vertex surface mottling/strata and one shadow-casting directional light. Asset source records are in [terrain-art-sources.md](terrain-art-sources.md).

All faces are finite heightfield slopes. There are no true vertical discontinuities, overhangs, tunnels or stacked navigable surfaces. Steep appearance does not imply a traversable green ramp. The prototype's rock/fuel/physical classifications are explicit choices for these studies, not silent changes to production simulation rules.

One renderer/loop/ResizeObserver serves the current specimen. Replacing a study or seed disposes the old geometry/materials/instances/picker; leaving the page or HMR disposes controls, listeners, shadow target and renderer. Normal application comparison is a full-page navigation, not two simultaneous live simulations.

## Original tool assessment and Gaea experiment (historical)

Installed **Gaea 2.3.1.0** was located through its Desktop shortcut. Desktop automation launch reported that its accessibility window-opened handler did not become ready; a subsequent window inventory contained no Gaea window. No successful GUI control is claimed.

The supported **Gaea.Swarm** CLI is accessible outside the sandbox. Its help confirmed filename/buildpath/resolution/seed switches. A copied bundled **Mesa.terrain** was run at **512** resolution with a dedicated local output directory, then retried once with verbose logging. Both attempts loaded the CPU device and began opening the file, then exited with code zero **without exported files**. The application log ends at old Erosion2/TextureBase migration warnings; there was no confirmed completed build. The exact underlying reason is unresolved; no license/activation diagnosis is inferred. The copied example remains under ignored logs/gaea-experiment, not in submission/public assets.

The installed Mesa thumbnail was inspected: useful broken rims, striated rock and eroded transitions show potential for an offline authoring pipeline. That thumbnail is not an export produced by this experiment, not imported into Three.js, and not redistributed. A future successful heightmap export could be resampled into shared corners with explicit scale and slope validation. That integration is not demonstrated here. Official references: [Gaea automation](https://docs.gaea.app/developers/automation/index.html), [Build Swarm command line](https://docs.gaea.app/developers/automation/cli/command-line-automation.html).

[THREE.Terrain](https://github.com/IceCreamYou/THREE.Terrain) offers generators, material blending and scatter helpers. Those would still need adaptation to FireFront's authoritative height/slope contract and do not supply an art direction or genuine cliffs. Existing sampling/instancing plus original modular geometry are smaller for six controlled specimens. No competing terrain libraries, tools, asset packages or npm dependencies were installed.

## Reuse and limitations

Reusable candidates: polygon-based plateau/ramp shaping, asymmetric ridge profiles, shared slope-aware surface classification, tree/grass/stone artwork constructors, instanced placement and the camera fit calculation. All require deliberate review before adoption into the normal seeded generator. The six studies are partly authored recipes with seeded variations, not proof of broad production seed diversity.

No externally authored terrain/model is used in the live prototype. Gaea's bundled Mesa example is an external diagnostic input only. Prototype assets are not yet integrated with per-cell burning/charring/reset, agents, hazard buffers or loss rules. Full 104×104 performance and canopy readability during fire remain unmeasured. Finite slopes and faceted stone are stylized approximations, not a promise of concept-image quality. Overall appearance remains pending human review.

## Verification record

See progress.md for actual completed automated/browser checks. Checks cover deterministic heights/variation, finite shared surfaces, safe connected trails, blocked steep cells, sampler/geometry/offset-picking agreement, classified decoration placement, deterministic instancing and idempotent resource disposal. Visual tests do not establish human acceptance or a full MVP performance result.

Manual review:

1. Compare all three studies with both seeds using Overview and Close-up; judge landform proportions and whether the palette/trees/grass/rocks form a coherent direction.
2. Inspect the plateau ramp versus exposed sides; toggle traversal and click both to confirm blocked steep ground and safe trail.
3. Check the ridge's steep/gentle flanks and lower dry channel; orbit/zoom and switch seeds repeatedly.
4. Open normal comparison, then return to the prototype; check narrow-screen scrolling and console. Report appearance feedback separately from functional passes.

Completed verification on 2026-11-04: **139/139 full tests passed sequentially**, production build (both HTML entries) and diff checks passed. Development review covered all six specimens at overview/close range. Built preview checked study/seed replacement, both camera buttons/R, overlay, actual surface inspection and the normal application comparison (seed 0, 104×104, 20 waiting). Narrow 390×740 layout stacked/scrolled without horizontal overflow. The obsolete shadow-mode warning was corrected; no new production warnings/errors were observed afterward. Existing warning history was retained. Physical pan/orbit and human appearance acceptance remain pending; no benchmark or full-scale art/fire integration result is claimed.

## Current composition-v2 refinement — awaiting human review

The gallery combines **seeds 7, 34, 2026, 913** with gentle/mixed/rugged selection biases. These biases affect probabilities/relief, not three fixed shape recipes. The factory also accepts other normalized seeds, with up to eight bounded terrain/routing attempts. Only one current scene, picker and scan are retained, using one renderer, animation loop and resize observer. Original six-study generation is preserved in createStudyMapV1.js and explicit historical tests; artwork.js and baseline surface materials remain unchanged.

Reusable operators in landformConstruction.js:

- Rotated anisotropic hill envelopes and wandering ridges with variable crest heights and unequal flank widths.
- Irregular 8–14-vertex tableland outlines, finite risers and optional directional gradual approaches. Optional 1–3 independent side-shelf polygons vary their outline, width, level and orientation; they are not concentric circular rings.
- Smooth basin depressions and local flatter blends. Raised forms use maximum envelopes rather than unbounded additive stacking; subtle noise breaks regularity.
- Optional winding dry trunks with unequal bank widths/heights and zero to two tributaries. Target bed elevations descend and meet at junctions. These are shape operators, not erosion, drainage or fluid simulation; overlap/interpolation can still create locally imperfect profiles.
- Interior, edge and corner placement, including partially clipped features. Not every seed receives every operator. Final relief in this gallery spans approximately **2.09–8.95 world units** on 32×32-unit specimens.

Terrain is constructed before a single illustrative trail through suitable connected ground. The trail uses the existing complete-face and edge 20-degree construction/validation rules; no hill is flattened to force access. It need not reach every raised top or cross every channel. Forest remains a physical blocker even between models; steep prototype rock is nonfuel. These isolated classifications are not adopted into the production app.

### Reading the scan

Press **T** or **Scan terrain**: glyphs remain full strength for six seconds, then fade over 1.5 seconds. Reduced motion uses a static 7.5-second display followed by removal. Repeating the action restarts the same scan; scene replacement clears it. R still restores overview only.

- Pale dot: physically suitable ground, under 16 degrees.
- Yellow/orange triangle: physically suitable ground at 16–20 degrees, approaching the permitted limit.
- Red X: actual physical blocker, such as a slope over 20 degrees or forest classification. **Blocked is not lethal.**

Markers sample every second logical cell in each direction (1,024 glyphs); each describes its own sampled cell, not a four-cell aggregate. Click any ground cell, including unsampled cells, for its full measured reason. A suitable off-trail cell does not become accessible under Path-first: the inspection reports policy access separately from slope and physical walkability. A forest blocker can therefore be red despite a gentle slope; off-trail policy alone does not make a pale dot red.

All glyph vertices follow authoritative NW–SE surface samples with a small height offset. Four batched meshes include a dark outline for contrast. Only the diagnostic glyphs bypass decorative occlusion, deliberately staying visible through tree crowns; terrain/material depth testing is unchanged. Distant/low-angle glyphs remain small, so use Close-up and exact inspection rather than treating the overview as a movement guarantee. No health, balance, stamina, damage or death mechanic is added.

### Research and tool follow-up

The user's brief remains primary. [NPS landform references](https://www.nps.gov/subjects/geology/landforms.htm) informed variety; [plateaus/mesas](https://www.nps.gov/subjects/nnlandmarks/plateaus-and-mesas.htm) informed raised tops and dissected outlines; [fluvial landforms](https://www.nps.gov/subjects/geology/fluvial-landforms.htm) informed trunks, tributaries and unequal banks. [USGS 3DEP](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services) distinguishes elevation products and terrain visualization. No elevation dataset, texture or external artwork was imported, and no geologically calibrated process is claimed.

A single new supported desktop launch opened installed **Gaea 2.3.1 Community** with a Welcome window and an empty Untitled editor. GUI access is now confirmed, superseding the earlier launch limitation. No nodes, build, export or license changes were attempted; the prior CLI produced no exports and remains unresolved. Closing Welcome succeeded; desktop close requests for the blank editor did not remove its window. If still open, the one user step is to close **Gaea — Untitled** with its top-right X. No duplicate Gaea launch or competing toolchain installation was made.

### Reuse, remaining limits and review

Pure landform plans, signed polygon outlines, asymmetric spine profiles, flat/basin blending, tributary cuts and truthful scan classification are reusable candidates for later full-map generation. Adoption would need deliberate 104×104 scale/coverage tuning, endpoint/network integration and fire-aware asset bindings. This page does not do that work. Shelves can merge with neighboring forms or be partly buried; canopy can obscure a top, and finite heightfield slopes cannot create overhangs or true vertical discontinuities. Surface detail/vegetation refinement is the next separately bounded checkpoint, not part of this change. No new benchmark or performance acceptance is claimed.

Targeted human review:

1. Compare the 12 buttons at Overview and selected Close-up views. Judge gentle versus rugged relief, irregular tops/shelves, valleys and edge features; identify any remaining repeated shapes.
2. Inspect **Mixed/34** and **Rugged/7** for broken raised areas, side shelves and cuts; compare **Rugged/913**, which has no forced channel. Judge transitions, not just the feature-name list.
3. Press T/button, inspect pale/triangle/X cells, and check physical reasons versus separate Path-first access. Confirm scan fade and the static reduced-motion treatment are clear.
4. Switch examples repeatedly, use physical pan/orbit/zoom and R, check narrow scrolling, then open normal comparison. Report terrain acceptance separately from functional passes.

Current verification: **144/144 sequential tests**, production build and diff checks passed. Development reviewed all 12 combinations; production exercised all 12 replacements, representative overview/detail, R/T, scan ending, offset picking and physical-versus-policy inspection. Narrow 390×740 stacked/scrolled without horizontal overflow. Normal comparison opened entry/Skip and a generated 104×104 scene with 20 waiting; production warning/error logs were clear. Reduced-motion behavior has automated coverage; human scan clarity, physical gestures and landscape acceptance remain pending. Detailed actual results are in progress.md. No new performance benchmark was run.

## Subsequent real Gaea export comparison

A separately authorized focused GUI trial now succeeds with bundled Sandstone Butte: 512×512 PNG16 height and Layers mask. This supersedes the earlier no-export limitation for this example, without claiming that the old Mesa CLI failure was diagnosed. Choose **Gaea comparison** or add `?study=gaea` to either prototype URL. The original 12 compositions are retained; the imported surface is a 128-cell specimen with no routed trail/simulation. Baseline modular dressing and shared sampler/picking are reused. See [actual export checks, scaling, visual tradeoffs and non-commercial usage restrictions](gaea-trial.md). Ten focused checks and the rebuilt production entry pass; development/preview show the imported terrain and clear consoles. No new human acceptance is recorded.

## Current detail/material/scan refinement (2026-11-08)

The expanded studies/export are preserved in 38a6046 with positive user assessment; final surface-detail/scan acceptance remains pending. New uncommitted work adds the 129/257 matched Gaea mesh comparison, reusable coherent surface materials/layered cutaway finish, full trail glyph coverage and clicked cell outlines. It supersedes the earlier sparse scan/material behavior described above; historical records are retained. Ground-only scan depth now hides intervening terrain while keeping decoration readable. Geometry resolution is separate from logical traversal resolution, and fine slopes are explicitly reported. [Full semantics, diagnosis, actual verification, recommendation and checklist](terrain-detail-comparison.md).

The detail refinement is now saved at98b1bec. User feedback retains129 as default and notes improved trail scan coverage; uniformly mottled materials remain unaccepted. Current uncommitted work is a separate [prototype-only50° slope trial](prototype-slope-trial.md), with20° gentle scan band, unchanged physical classifications/Path-first policy and no change to production rules or existing trail construction. Earlier20° capability descriptions above are historical; source/license and mesh-sampling evidence remains valid.
