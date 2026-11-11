# Beta integration 1 — simulator surfaces (2026-11-11)

## Scope and architecture

Base checkpoint **87e2eb7**, branch **feature/beta-visual-integration**, initially clean. This increment integrates surfaces only. Generator remains **forest-environment-v8 / terrain-routed-v4**, 104×104 cells, 0.5-unit cells and 20 agents. Exact layouts, heights, fuel/walkability, original vegetation placements/models, agents/awareness, fire timings, camera and navigation are unchanged. Production trails remain 20-degree constrained; no prototype 50-degree trial or Flexible navigation is adopted. The rejected rock fragments stay removed.

Prototype material/region code is now shared in `src/rendering/surfaceMaterials.js` and `surfaceRegions.js`. The old prototype module paths re-export the same functions in prototype presentation mode; terrain-art.html and authored Gaea remain separate comparisons. No Gaea heightmap enters the seeded simulator. All artwork remains original generated code; no external asset, license or dependency change.

The simulator adapter reads existing fuel types and terrain categories, rather than renaming map cells or treating visual brown/gray as blocked/nonfuel data. Seeded metre-scale fields retain green-dominant, mixed and earthy/litter woodland, calmer meadow detail, dirt/gravel/worn trails, weathered earth/stone slopes and layered cutaway sides. `prepareSurfaceGeometry.js` adds shader-only blend-normal/depth attributes to the existing geometry; no vertex positions, triangle layout, picking surface or sampler change.

Nearest-filtered logical category masks keep exact trail and fuel footprints. Fuel-free clearings remain sandy; obstacles use rock/earth; existing compact START and SAFE cell colors remain. Regional/woodland weights are interpolated only for visual finish. Brown woodland and exposed slopes may contain fuel; the updated legend note and existing torch eligibility feedback explain this. The flat authored fixture and historical fixed benchmark retain their existing rendering path.

## Fire, reset and ownership

A separate one-pixel-per-cell, nearest-filtered state texture represents unburned/burning/burned-hot/burned-cool. Existing `takeChanges()` drives state writes and at most one texture upload per `syncFire` batch; unchanged frames request no new state upload. The shader overrides regional ground finish with the existing burning brown, hot charcoal and cooled gray palette. Existing flames, red embers, vegetation charring and ash/stumps still distinguish the states beyond color alone. Cutaway soil below the surface stays layered.

Reset sends existing unburned changes and restores the original regional surface; it neither rebuilds random fields nor changes camera/authoritative map. Regeneration owns fresh deterministic masks for its seed. All added textures/materials are included exactly once in existing map-session cleanup. No new renderer, animation loop, listeners, user controls or live simulation state is added by materials.

## Automated checks

- `npm test -- --test-concurrency=1`: **158/158 passed**, approximately 139 seconds, sequential. Includes fixed-map exact scenario timing, current/historical generation, 20-agent Global/Local replay/count conservation/loss, terrain/picking/camera, replacement cleanup, ignition/reset and prototype/Gaea regressions.
- Two new Beta tests verify real 104-square view integration and exact nonfuel/fuel/endpoint categories, lifecycle texture transitions 1→2→3, reset to initial bytes, stable regional bytes, no redundant unchanged upload, deterministic rebuilds, unchanged map/terrain vertices, valid shader attributes and one-time texture disposal.
- `npm run build`: passed, **75 modules**. Main entry 74.73 kB / 28.13 gzip; shared chunk 617.67 kB / 157.69 gzip; prototype 829.64 kB / 344.09 gzip. Existing bundle warning remains visible/unsuppressed. `git diff --check` passed.
- Existing current-v8 scenario traces are regression evidence, not new benchmark results: seed 0 ignition (46,9) completed at 84.7 simulation seconds with 20 evacuated in both models. Seeds 7 and 2026 were still moving at the test's 120-second bound; this increment does not claim every scenario completed or change their outcomes.

## Browser checks and limitations

Reused existing dev 5178/preview 4178 servers and one browser tab at a time. The earlier browser tab was no longer available, so one replacement tab was used. Development entry/tour Skip, seeded regeneration 0→34→0, ignition workflow/lock, road rejection **(49,16)**, fuel selection **(46,9)**, neighboring spread, selected burned-cool state and reset during active fire checked. Reset restored 20 waiting agents, setup controls and regional surfaces while retaining the zoomed view.

Rebuilt production preview used seed 0/Local with the same ignition. Observed burning, burned-hot and burned-cool status, flame/char/ash ground and moving-agent counts. Responsive checks at **390×740** (349×382 canvas, page width375; no horizontal overflow) and **1280×600**, restoring the viewport afterward. Production then completed with **20 evacuated, 0 lost, 0 trapped at 84.70 simulation seconds** in the results popup. Inspect/reset restored 20 waiting agents and the original finish; regeneration 0→34→0 and one-canvas replacement were checked again. Gaea 129/257 comparison also loaded without warning/error logs. Development also passed the 390×740 and 1280×600 layout smoke checks (349-pixel narrow canvas), using an ordinary generated setup. Both development and preview warning/error logs were clear during inspection. Browser observations are not user-reported passes or physical-mouse validation.

Human review remains pending for surface balance/readability, zoom/pan/orbit interactions and the full manual checklist. Detail is deliberately subtle at overview. Existing cone/shrub/grass artwork and placement have not yet been improved, and the prototype's lighting is not copied: visual matching is limited to surface treatment. No full MVP performance benchmark or new performance target claim.

## Review URLs and checklist

- Development: http://127.0.0.1:5178/FireFront/
- Production preview: http://127.0.0.1:4178/FireFront/
- Prototype/Gaea comparison remains at `/FireFront/terrain-art.html` (append `?study=gaea` for Gaea).

1. Generate seeds 0 and 34. Inspect green/mixed/earthy woodland, meadow, dirt/gravel trails, sandy nonfuel clearings and layered sides at overview and closer range; no added rock fragments.
2. Seed 0: ignite **(46,9)**. With one source, forest burns about 30 s and cools for 8 s; neighboring propagation overlaps. Observe flames, hot embers/char, then cooled ash. Bare trails must reject ignition.
3. Follow evacuation/counts, then reset during or after fire: 20 waiting, restored regional surfaces, unlocked setup and camera preserved. R resets only the camera.
4. Regenerate the same seed and compare; try zoom/pan/orbit, narrow/short windows and both consoles. Report readability or visual mismatches without assuming a fuel rule changed.

Leave changes uncommitted for human validation. Next separately authorized increment: improved vegetation artwork with cell ownership and lifecycle support. Validation/deployment/submission follow later; no merge/push/deploy in this increment.

## User validation / checkpoint

The user reports all four surface-integration checklist items passed. No exact timings or additional checks are inferred. Save the validated surface increment as `feat: integrate regional terrain materials with fire lifecycle`. Vegetation integration is a separate increment and does not retroactively alter these results.

The surface implementation is now checkpointed as **9439bd6** after the user-reported checklist passes. Its earlier uncommitted handoff is historical. Subsequent vegetation work is documented separately in [Beta vegetation](beta-vegetation.md).
