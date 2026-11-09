# Regional surface refinement — current selective correction

## 2026-11-08 — Targeted feedback, not full acceptance

The user requests removal of the newly added angular face formations/fragments. The earlier brown/earthy woodland in the trail comparison is preferred, while green-dominant, mixed and brown/litter-dominant regional outcomes should all remain. This is targeted visual feedback, not a full checklist pass or final appearance acceptance.

## Current implementation

- **Removed:** the uncommitted `rockFormations.js` batch, its view/resource integration, dedicated owned-fragment picker and two formation-specific tests. `createStudyView.js`, `main.js` and `studySurface.js` now match **1bf0c42** exactly. Exposed geometry, older boulders and ground-only picking are restored; earlier fine-surface/page-offset picking fixes remain.
- **Retained:** exposed rock/earth and cutaway materials, exact terrain heights/shapes, models/placements, regional green/earth/litter fields, trail wear/gravel, 50-degree scan and traversal rules, normal application and all unrelated work.
- **Woodland parameters unchanged:** the range was not lost. The actual material blend already allows approximately 91% litter weighting in dense forest at the earthy end of its regional field, and green-dominant regions at the other end. Coverage is driven by seeded metre-scale fields, not tree-centered circles or a compulsory patch for each tree.

Diagnostic forest-cell counts evaluated from the current material weights (green <0.30 litter weight; litter-dominant >0.65; mixed between):

| Study | Green-dominant | Mixed | Litter-dominant |
| --- | ---: | ---: | ---: |
| Gentler/7 | 988 | 281 | 1,097 |
| Mixed/34 | 737 | 292 | 894 |
| Rugged/913 | 972 | 273 | 585 |

These are implementation diagnostics, not a claim of visual acceptance. Lighting/shadows and exposed-earth blending also affect the final appearance.

## Actual verification

**20/20 focused tests passed sequentially**, retaining regional coherence/determinism, material seams and disposal, original/historical studies, Gaea 129/257 surface geometry, offset ground picking, cell outlines, scan and 50-degree capability checks. Only the two now-obsolete formation tests were removed. Production build passed: **73 modules**, prototype **836.97 kB / 347.06 kB gzip**. Diff checks passed; no new benchmark or full simulation-suite repeat.

Production preview reviewed Mixed/34 Close-up with the same camera, lighting, gallery state and canvas framing as the prior formation screenshot: the added gray angular slabs/fragments are gone, original face facets and older boulders remain. Gentler/7 matched Close-up confirms retained green/earth/litter variation and trail finish. Browser warning/error logs clear; temporary viewport override restored. Images saved outside the repository; matched comparison uses the same left-hand crop because the prior capture clipped the side panel.

All substrate artwork remains original procedural code using existing dependencies; no imported asset/license change. Existing Gaea source/restrictions remain unchanged. No new visual experiment or parameter tuning in this correction.

Preview: http://127.0.0.1:4178/FireFront/terrain-art.html

Development: http://127.0.0.1:5178/FireFront/terrain-art.html

Short recheck: inspect **Mixed/34 Close-up** for restored faces; inspect **Gentler/7** for retained brown/green woodland and readable worn trails. Session closeout: preserve this corrected material/region refinement as `feat: vary woodland ground and trail surfaces` on `codex/terrain-art-prototype`. Overall visual acceptance and remaining human checks are pending. Next session: review the corrected preview, then address grass/vegetation variety and plan full-simulator integration. No merge, push or deployment.

<details>
<summary>Superseded formation attempt and its evidence — historical only</summary>

# Regional cover and exposed-face dressing — 2026-11-08

## Checkpoint and feedback

**1bf0c42 — feat: add distinct terrain surface materials** preserves the previous material increment. User feedback: more polished and natural, but repeated brown tree-floor patches, limited green/trail variation and unfinished rocky faces remain. This is not acceptance of the whole manual checklist or final appearance. Continue uncommitted on `codex/terrain-art-prototype`.

## Implementation

`surfaceRegions.js` creates coherent seeded appearance fields using a separate `art:surface-regions:<kind>` stream. Metre-scale noise with restrained warping controls green tone, earth/litter, gravel and wear. It consumes none of the terrain/layout/vegetation random streams and does not edit map data. A forest cell no longer automatically forces a brown floor: regional cover can retain green under trees, blend green/litter or expose more earth. Existing forest coverage only modulates that regional treatment. Blended appearance is not a fuel or traversal map; inspection remains authoritative.

Trails keep the exact existing coverage mask. Earth stays dominant while spatially varying gravel and wear create gradual lighter/darker sections. Gravel uses an additional original sparse-stamp texture. No logical widening, status/policy or geometry change to the trail.

`rockFormations.js` constructs **one fitted, non-indexed batch** of angular, inclined ribs/fragments across clustered eligible faces. Selection uses its own seeded art stream. Only already-blocked **rock-class** cells with displayed face slopes of at least 32° qualify, excluding boundary cells and any cell within a one-cell neighborhood of a permitted trail. Some faces remain earth banks/mixed soil/stone. Natural faces are separate from the existing soil-over-bedrock boundary cutaway.

Every triangle stays within its owning blocked cell. Vertices sample the displayed surface plus bounded shallow relief (less than 0.26 world units), tapering onto ground at cluster edges. Broad decorative flat treads are rejected: triangle slopes must remain at least 27°. This creates localized angular face detail without changing shared heights, navigation or presenting a new walkable ledge. It cannot bridge a gap or extend into a trail. These are fitted decorative surfaces, not new collision platforms, genuine vertical cliffs, large standalone outcrops or overhangs; those would require a separate authoritative-geometry/traversal decision. Fine Gaea can select different existing blocked faces because its displayed slopes differ.

Picking includes only the displayed ground and explicitly owned formation triangles, selecting the nearest hit and resolving each fragment to its logical owner. This avoids selecting an adjacent cell behind a raised fragment. Trees, loose boulders, cutaway sides and UI remain excluded. Ground sampling, selected-cell boundaries and scan heights remain authoritative; the boundary remains visible through decorative geometry. Production picking/navigation are untouched.

Everything here is **original code-generated artwork** using existing Three.js/simplex-noise/seed utilities. No imported asset, new dependency or inferred license from Gaea. Existing Gaea export provenance/restrictions remain intact. Five 256-square base textures use 1.25 MiB before mipmaps/driver overhead, plus the coverage/regional masks. Geometry is fitted and batched rather than spawning a mesh per fragment; no new animation, light or render loop.

## Actual verification

**22/22 focused tests passed sequentially**, covering existing historical/Gaea meshes, sampling, picking, scan/50° capability, generation/dressing preservation, deterministic artwork, seams/disposal, and three new regional/formation tests. New checks assert seeded coherent fields, varied cover within woodland, identical region fields across Gaea resolutions, blocked-cell bounds, trail clearance, bounded displacement, no flat treads, deterministic geometry, and visible-fragment picking with page offsets. A first regional test caught overly rapid variation; frequencies/warp were reduced rather than weakening that assertion. Following temporary comparison captures, refinement source was restored, comparison-only camera code removed and nine material/formation/mesh tests rechecked successfully.

Production build passed: **Vite 8.3.3, 74 modules**, prototype **839.27 kB / 347.95 kB gzip**. Diff checks pass. Existing warning policy unchanged. No full simulation suite or benchmark repeated for this isolated art increment; no performance-target claim.

Diagnostic counts (not visual acceptance):

| Study | Qualified blocked face cells | Added triangles |
| --- | ---: | ---: |
| Gentler/7 | 1 | 7 |
| Mixed/34 | 197 | 1,311 |
| Rugged/913 | 354 | 2,588 |
| Gaea 129 | 1,338 | 9,242 |
| Gaea 257 | 1,874 | 12,587 |

One reused browser tab, existing servers; heavy checks sequential. Final production reviewed procedural cover/trails/rock and both Gaea meshes, picking and scan. Mixed/34 **(18,58)** remained a physically walkable permitted trail, **2.6°**. Gaea coarse click **(92,76), 57.6°**, then the same screen point in fine mode resolved **(92,75), 59.7° coarse / 68.7° fine**, correctly blocked: changed displayed geometry can change the visible cell at a screen coordinate. These are browser observations, not user readings. Switching retained one canvas. Warning/error logs clear in development and preview. Narrow development **390×740**, approximately **346-pixel canvas**, no horizontal overflow. No observed responsiveness interruption; not a benchmark or exhaustive motion/shimmer check.

## Matched visual evidence

Screenshots saved outside the repository, before/after using the same 1280×1000 viewport, study, geometry, lighting and camera:

- Forest: **Gentler/7, Close-up**, gallery collapsed.
- Trail: **Gentler/7**, camera targets the middle centerline cell at surface height, eye offset **(3.5, 5, 4.5)** world units. A temporary capture-only camera override was removed afterward; no new camera control or permanent view option.
- Exposed face: **Mixed/34, Close-up**, approximately **28° low-oblique** direction, gallery collapsed. Ordinary Close-up pose is unchanged.

Actual screenshots compare regional cover and fitted geometry, not edited concept mockups. Overall appearance, rock density/scale, regional transitions, physical-camera motion and final material detail remain pending human acceptance. No inferred manual passes.

## Local review

- Preview: http://127.0.0.1:4178/FireFront/terrain-art.html
- Development: http://127.0.0.1:5178/FireFront/terrain-art.html
- Gaea: append `?study=gaea`; default 129, optional 257.

1. **Gentler/7:** look for green woodland, mixed litter/earth and irregular transitions, rather than a brown patch for every tree. Follow the trail through earth/gravel/worn sections; confirm it stays coherent.
2. **Mixed/34 and Rugged/913:** inspect fractured faces from Close-up and Overview, remaining earth banks and distinct map-cutaway layers. Reject any formation that visually suggests a usable ledge or obscures a permitted trail.
3. **Gaea 129/257:** zoom/orbit, click fragments and press T. Inspect cell association, silhouette/fragment density, tiling, shimmer and transitions. Rock remains blocked even when below the 50° capability.
4. Switch studies/resolutions and try a narrow window; inspect controls, console and ordinary responsiveness.

No heightfield, landform recipe, classification, trail, vegetation-placement, 50° rule, simulation or normal-application change. No fossils, model expansion, wind, water, buildings, full-map adoption, merge, push or deployment.

</details>
