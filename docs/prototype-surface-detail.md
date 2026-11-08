# Prototype substrate detail refinement — 2026-11-08

## Preserved checkpoint and feedback

Slope trial checkpoint: **3b817a0 — feat: trial 50-degree terrain traversal in prototype** on `codex/terrain-art-prototype`. The user said the requested manual scan checklist was “all good”; this does not imply exact cell readings or additional checks. Future Flexible traversal of fully consumed, burned-and-cooled brush is recorded only, not implemented. Path-first remains trail-only. Higher mesh resolution had modest benefit; **129×129 remains default**, 257×257 optional. Materials were unaccepted for uniform spray/mottling.

## Technique and provenance

Only prototype `surfaceMaterials.js` changes presentation. Four distinct **original generated 256×256 RGBA textures** replace the three shared-grain textures. These are code-authored FireFront artwork, generated from existing simplex-noise/seed utilities with a private art stream; no imported texture, asset download, dependency or new license obligation. Existing Gaea terrain provenance and Community/EULA restrictions remain applicable to that comparison and are not a license for unrelated assets.

- **Trail:** compacted earth tones, a broad worn swath, sparse clusters of gravel, and small irregularities at the existing interpolated trail-mask edge. No new trail geometry or logical width.
- **Meadow:** broad, low-contrast tonal shifts and very restrained fine variation; no blanket scattered speckles.
- **Forest floor:** separate darker earth treatment and sparse, clustered leaf-shaped litter marks, softly blended using the existing woodland coverage weight.
- **Exposed faces:** warm weathered stone/earth mixes, sparse directional cracks and broken sediment lines, projected in world-space on three axes to avoid stretching. Large calm areas remain between details; actual silhouettes/facets are untouched.
- **Boundary cutaway:** variable soil depth over subsoil/bedrock, broken tonal lenses and sparse embedded stone marks. Depth bands vary along the boundary; grain is not sprayed over every band.

Small detail is texture/shader color, not added geometry. All textures use repeat wrapping, linear/trilinear filtering and generated mipmaps. Substrate scales differ; larger world-space fields modulate transitions. The four base texture arrays total **1 MiB before mipmaps/GPU overhead**, plus the existing coverage texture. No new draw call, light, animation or render loop. The optional fossil detail is **not included**: focus remains on substrate separation and restrained detail.

## Preserved behavior

No terrain heights, displayed meshes, vegetation/rocks/grass models or placements, classification/fuel data, 50° capability, scan/policy reasons, picking geometry, camera, simulation or normal-app source changed. The coarse traversal versus fine displayed-surface distinction remains. Surface finish is a visual blend, not an exact fuel/physical-eligibility mask: use cell inspection/scan for those independent answers. Gaea stays an authored comparison, not a seeded production generator.

## Actual checks

- **19/19 focused tests pass sequentially**: original/historical studies, Gaea import, displayed mesh/picking/outline agreement, scan coverage/boundaries, real 50° eligibility, deterministic distinct substrate artwork, small repeat seams and resource cleanup. Added the new forest texture to disposal coverage. Existing tests also assert map data/dressing preservation. A final standalone texture test rerun checks both repeat-edge directions.
- Production build passed: **Vite 8.3.3, 72 modules**, prototype entry **835.77 kB / 346.67 kB gzip**. Diff checks passed; existing build-warning policy unchanged. No full simulation suite or performance benchmark repeated for this material-only increment.
- Reused one browser tab and existing development/preview servers. Production: matched **Gaea/30085, 129×129**, Overview and Close-up at **1280×900**, same camera buttons, world size, geometry and lighting before/after. Saved screenshots outside the repository. Also reviewed Gaea 257, Mixed/34 close-up and Rugged/913 overview/cutaway; zoomed to inspect face projection and fine marks. No obvious repeating seams, stretching or shimmer noticed during these checks; this is not exhaustive hardware/motion validation.
- Picking/scan: Mixed/34 selected grass **(3,49), 0.6°**, physically suitable but off Path-first. Fine Gaea selected rock **(90,75), 36.7° coarse / 43.9° fine**, slope-permitted but rock-blocked/off-policy, with amber footprint and scan. These are browser observations, not user-reported readings.
- Switching procedural/Gaea/resolutions retained **one canvas**, with automated disposal checks. Development and preview warning/error logs were empty. Development at **390×740** retained **345-pixel canvas**, scrolling controls and no horizontal overflow. Temporary viewport override restored. No measured FPS/performance claim.

## Limits and review

Final material appearance, physical camera-motion shimmer and fine-detail density remain **pending human validation**. Patterns are finite reusable textures: close enough inspection can reveal repeated motifs. Detail intentionally fades at overview; no displacement or tiny geometric cracks. Gaea's existing coarse/fine landform facets and current vegetation density/geometry remain visible, not fixed by surface detail. No fossil dressing, new grass, wind, water, buildings or full-map adoption.

Preview: http://127.0.0.1:4178/FireFront/terrain-art.html

Development: http://127.0.0.1:5178/FireFront/terrain-art.html

Gaea: append `?study=gaea`; 129 remains default.

1. **Mixed/34:** compare brown trail, meadow and darker forest floor. Zoom/orbit to judge sparse gravel/litter, edge transitions and whether the spray appearance is gone.
2. **Gaea, 129 then 257:** inspect warm exposed faces at Close-up and Overview; check cracks/strata, tiling/stretching/shimmer and whether detail remains restrained. Compare the saved matching before/after views.
3. **Rugged/913:** inspect soil-over-bedrock cutaway bands and localized stones. Use T/clicks to confirm separate 50° slope/blocker/Path-first reasons and aligned selected cells.
4. Switch studies/mesh modes and try a narrow window; confirm readable controls, useful canvas and no new console errors.

All surface-refinement changes remain uncommitted on the prototype branch. No merge, push or deployment.
