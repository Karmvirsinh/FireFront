# Terrain detail, surface finish and scan refinement — 2026-11-08

Preservation checkpoint: **38a6046 — feat: expand terrain studies and add Gaea comparison** on codex/terrain-art-prototype. The user assessed both procedural studies and the Gaea landform positively. Surface-detail acceptance and scan validation remain pending. New refinement stays uncommitted; no normal-app adoption or publication.

## Compare detail without changing simulation cells

Open http://127.0.0.1:4178/FireFront/terrain-art.html?study=gaea (development uses port 5178). **129×129 / 257×257** buttons replace the surface while retaining the exact current camera/target/zoom and lighting. Compare at Overview, then Close-up and an orbit of your choice. `&mesh=257` opens directly with finer geometry; default stays 129. The gallery's procedural maps keep their original 65×65 corner surfaces.

Both Gaea meshes are independently sampled from the same original **512×512 PNG16 heightmap**, using the existing offline converter, not by subdividing the coarse triangles. No new Gaea authoring/export occurred. World extent stays **32×32 units**, nominal height scaling stays `raw / 65535 × 16`, and NW–SE triangulation is unchanged. Fine samples include every coarse corner exactly. Two fine-only extrema are clipped to the existing **0.008476–5.302378** comparison range, preserving the common range without per-mesh normalization or altered relief scale.

The logical/traversal map stays **128×128 cells, 0.25 world units/cell**. A separate plain displaySurface contains the **256×256 fine surface quads, 0.125 units/quad**. Normal FireFront's generated simulation grid is not involved. Picking raycasts the displayed surface and resolves that hit back to a coarse logical cell. Objects retain x/z positions, species, rotation and scale; their y positions use the displayed sampler. Rock selection remains based on coarse data so a tiny height change does not consume a different random sequence and move later grass/rocks.

Scan classification uses the existing coarse cell's complete-face slope, physical blocker and Path-first permission. On the fine mesh, inspection additionally reports the maximum displayed triangle slope inside that cell. Fine micro-slopes can be steeper than the coarse proxy; this is explicitly reported, not silently turned into a new navigation rule. No agents run in the Gaea study. Any future gameplay adoption would need a separate decision about subcell slope/collision safety. Selected boundaries and glyph vertices follow the displayed sampler, including fine edge samples.

### Cost and recommendation

| Ground surface | 129×129 corners | 257×257 corners |
| --- | ---: | ---: |
| Triangles | 32,768 | 131,072 |
| Nonindexed vertices | 98,304 | 393,216 |
| Ground attribute arrays | 3,932,160 bytes | 15,728,640 bytes |

Attribute bytes include position, normal, smoothed material-blend normal and cutaway-depth attribute; they exclude skirts, textures, models, JavaScript overhead and driver copies. The picking helper also keeps a separate CPU triangle surface, likewise four times as large in fine mode. Only one current view/picker is retained; previous geometry, textures, scan batches and outline resources are disposed on replacement.

**Recommendation: retain 129×129 as the default; keep 257×257 as an optional close-inspection comparison.** At matched close range the finer mesh resolves smaller cuts/notches and divides the conspicuous broad facets more finely. At overview the gain is modest, while ground triangle/attribute costs quadruple. Ordinary switching/zoom/scan stayed usable during this local review; this is an observation, not a measured FPS/performance guarantee. Included fine data also grows the isolated prototype entry from about 251 kB / 103 kB gzip to **831.30 kB / 344.74 kB gzip**. No quality limits or bundle warning thresholds were changed. No new benchmark tooling/capture or normal-app performance claim.

## Reusable material treatment

Original code-generated 128-square meadow/forest-floor, dirt/gravel and weathered-stone grain/crack textures use the existing seeded simplex-noise dependency. No external asset, new package, fossil decoration or model expansion. World-space triplanar sampling avoids stretching all detail down exposed sides. A smoothly filtered woodland coverage field, slope blend and restrained spatial weathering replace hard per-cell color patches; trails keep a darker local earth treatment. The exported Gaea Layers mask remains a subtle surface-only modulation.

Smoothed material-blend normals suppress categorical triangle color switches while the actual low-poly geometry/lighting retains facets. Warm soil, brown/weathered stone and darker rock vary across exposed surfaces. Boundary cutaways retain their exact geometry and use depth-below-surface bands for soil/subsoil/bedrock with slightly wandering texture boundaries. Grain and fine cracks are material details; silhouettes, cuts and shelves remain actual height geometry. No top caps/overlapping sheets, surface classification edits or new rock walkability rules were added.

Surface finish is deliberately blended and is **not an exact fuel/traversal boundary display**. Clicked cell information and the diagnostic scan report the unchanged logical classifications. Material/landscape acceptance still requires human review; repeated texture tiling, stylized faceting and canopy obscuration remain limitations.

## Scan diagnosis and correction

The old stride-two background grid skipped **85 of Rugged/913's 122 trail cells** and **90 of Mixed/34's 112 trail cells**. All trail cells now get their own glyph; background samples stay sparse and immediate background neighbors are reduced to avoid crowding the trail. Final counts are **1,063 / 1,047** markers respectively, not an unreadable 4,096-cell blanket. No trail is made walkable to satisfy the display.

An X belongs to a logical blocked cell, not a decorative trunk. Forest classification remains blocked even between models, and off-grid canopy/trunk placement does not define that footprint. The earlier glyph rendering also ignored depth, allowing marks to appear over crowns or intervening terrain. No sampler/cell-coordinate mismatch was found in the targeted geometry/picking checks. Gaea glyph size is now scaled to its smaller logical cells, preventing symbols from unnecessarily extending into neighbors.

The current brief scan renders glyphs against a **ground-only depth mask**, after the normal scene, so they remain visible through decorative canopy but are hidden by intervening terrain. Normal tree/rock depth behavior is retained; no global depth disabling or changed model artwork. This costs one extra ground depth draw plus batched glyph draws while the scan is active, within the existing loop. The former four batches are split into background/trail batches (at most eight); trail dots are a little larger. There is no second animation loop or per-frame pathfinding/DOM update.

Click any ground cell to retain an **amber, surface-following boundary** and concise slope, physical blocker and Path-first reasons. The boundary is a diagnostic selection, not ignition, danger or permission. It stays visible through decoration; replacing/clicking another map disposes the previous outline. A trail next to trees remains permitted when its actual cell is permitted. All markers are nonlethal. T/button timing remains six seconds plus 1.5-second fade, static under reduced motion.

## Actual checks and remaining human review

**14/14 focused tests passed sequentially**, covering both mesh ranges/shared coarse vertices, fine detail beyond interpolation, unchanged cells/navigation/x-z dressing, both displayed samplers/geometry, oblique offset picking, selected-boundary samples, full trail marker inclusion on the reported seeds, classification agreement and exactly-once geometry/material/texture disposal. Historical six-study and composition checks remain covered. Existing full simulation evidence is retained; no unnecessary full-suite or benchmark repeat for this rendering-only refinement. Build/diff checks pass.

Development and rebuilt production reviewed Gaea at matched overview and close range for both resolutions, procedural Mixed/34 and Rugged/913, terrain cutaway/rock finish, T scan and clicked footprints. Production Mixed/34 **(15,13)** reported trail, **14.7°**, physically walkable and permitted; nearby **(24,23)** reported grass, **3.1°**, walkable but outside Path-first. Fine Gaea **(89,80)** reported coarse **51.8°**, displayed fine-face **60.9°**, steep-blocked/off-policy, with a matching amber outline after scrolling. Three rounds of procedural/Gaea/129/257 replacement retained one canvas and clear warning/error logs. Narrow 390×740 retained a roughly 345-pixel-wide canvas and no horizontal overflow; override restored. No normal application source, rules, dependencies or generator streams changed. Physical camera gestures, reduced-motion appearance and final material/scan acceptance remain human checks.

Manual checklist:

1. At Gaea Close-up, toggle both mesh buttons without moving the camera; compare notches/facets versus overview benefit. Judge whether fine mode is useful enough for its cost.
2. Compare warm exposed rock, forest-floor/trail transitions and layered boundary sides across Gaea, Mixed/34 and Rugged/913. Report surface-detail feedback separately.
3. On the two procedural examples, press T and follow the dotted trail through trees. Click trail, forest and off-trail ground; judge boundary placement and independent reasons.
4. Pan/orbit/zoom, select after moving/scrolling, use R, switch studies/resolutions repeatedly and try a narrow window. Confirm scan ending/reduced motion and normal comparison remain understandable.
