# Beta integration 2 — vegetation and lifecycle (2026-11-11)

## Surface checkpoint

**9439bd6 — feat: integrate regional terrain materials with fire lifecycle** saves the preceding surface increment on feature/beta-visual-integration. The user reports all four surface checklist items passed. No exact timing or additional scenario is inferred from that validation. Earlier timing evidence remains automated evidence only.

## Rendering changes

The original prototype tree/grass artwork is shared in `src/rendering/vegetationArtwork.js`; its old prototype entry re-exports the same factories. Two accepted full low-poly tree shapes are reused: broadleaf clustered canopy and layered conifer boughs. A compact original woody, multi-leaf shrub is added for brush. No downloaded asset, new dependency or license change. Original boulders and prototype comparisons are preserved; rejected rock fragments stay removed.

Current terrain-first environments use `createVegetationLayout.js` / `createVegetationView.js`. Fixed and historical rendering fixtures keep their original decoration path for comparison; their simulation regressions and benchmark are untouched. No map/generator version, cells, heights, fuel, routes, endpoints/spawns, physics, navigation or timing changes.

Placement uses stable per-cell hashes from the existing map seed, separate from every generator/simulation stream. Each model base stays within its owning fuel cell and samples the authoritative triangular surface; models remain upright. Tree candidates are priority-ordered before a small spatial hash limits crowding, with restrained jitter/rotation/scale. Render-only trees omit faces steeper than 35° to avoid burying the full canopy; this does not block, remove fuel from or reclassify any cell. Tree height is approximately 1.3–1.8 world units, suitable for the 52-unit map and existing 0.42-unit agents.

Actual transformed-artwork bounds fit conservative clearance circles. Circles avoid all permitted trail and endpoint cells by 0.04 world units and stay within map edges. Canopies may overlap other fuel cells, but cannot overhang the protected footprints. Reduced model density is not reduced fuel: ground between decorative models remains eligible according to existing data. Grass and shrubs use their own scale/probability/radius, one model per accepted cell. All are instanced/shared by shape/material, without a mesh per plant, extra renderer, light or loop.

Diagnostic instance counts (not visual acceptance or performance results):

| Seed | Trees | Grass tufts | Shrubs |
| --- | ---: | ---: | ---: |
| 0 | 803 | 1,041 | 797 |
| 7 | 912 | 953 | 771 |
| 34 | 992 | 719 | 647 |
| 2026 | 889 | 777 | 874 |

## Lifecycle and fire alignment

Each trunk, crown, tuft, shrub and remnant instance retains its logical fuel-cell ID, initial matrix and initial color. Fire state changes drive rendering only:

- **Unburned:** original standing geometry/colors; charred remnants hidden.
- **Burning:** trees darken with their exact standing transforms preserved. Grass/shrubs darken and contract modestly. Fire still consumes fuel using unchanged fixed-step rules.
- **Burned-hot:** original tree wood/crowns hide and compact charred trunk remnants appear; exhausted grass/shrubs hide. Existing hot ground/red embers remain.
- **Burned-cool:** remnants/ash remain, with no active flames/embers.
- **Reset:** matrices/colors/visibility return exactly, including hidden remnants; no reseeding or camera reset.

`createFireView` accepts optional per-cell vegetation poses for current Beta scenery. Flames sample the actual model base and use its canopy/plant height and radius; rendering flicker remains a deterministic sine, independent of simulation randomness/time. Fuel cells without a decorative model retain existing cell-centered low flames. Embers still follow exact logical ground-cell coverage. The legacy path is unchanged when no poses are supplied. Ground-only picking is unchanged and does not intersect foliage.

Owned geometry/materials and all instance batches are disposed through the existing map session. The vegetation view is idempotently disposable; no new listeners or timers exist. Regeneration recreates deterministic placements and reset does not rebuild them.

## Automated checks

`npm test -- --test-concurrency=1`: **162/162 pass**, approximately 152 s, sequential. Four new tests cover deterministic placements across 0/7/34/2026, unchanged maps, own-cell bases/heights, actual artwork bounds and protected-footprint clearance; standing/darkening vs exhaustion/remnants; grass/brush burnout; flame base/height alignment; exact reset matrices/colors; one-time cleanup; and a real current-map fire lifecycle. All prior surfaces, fixed/current/historical timelines, loss/awareness/counts, camera/picking, terrain, resource and prototype/Gaea checks pass. Standard seed 0 (46,9) remains 84.7 s in automated Global/Local traces; unfinished seed 7/2026 outcomes at 120 s remain honestly bounded, not newly claimed complete.

Production build passed: **78 modules**, main 78.85 kB / 29.58 gzip, shared 620.15 kB / 158.67 gzip, prototype 827.53 kB / 343.19 gzip. Diff checks passed; existing warning remains unsuppressed. No new benchmark/full-MVP performance claim.

## Browser checks (actual observations)

One reused browser and existing dev 5178/preview 4178 servers. Development: entry/tour Skip, seed 0, road (49,16) rejection, direct tree ignition (45,9), model-aligned flames and standing darkened trees, spread and exhausted/cool charred remnants inspected. Local evacuation completed with 20 evacuated, 0 lost, 0 trapped at 84.70 simulation seconds in the results popup. This is browser evidence, not a user timing claim. Inspect/reset restored full foliage/grass/shrubs/colors and 20 waiting agents while keeping zoom; regenerated 0→34→0. Development console warning/error logs clear. Production preview repeated seed 0/Local with ignition (46,9): 20 evacuated, 0 lost, 0 trapped at 84.70 s in its results popup; burned-cool ground/remnants inspected, then reset restored plants and 20 waiting with view retained. Regeneration 0→34→0 kept one canvas. Development and preview passed 390×740 and 1280×600 layout smoke checks (349-pixel narrow canvas, no horizontal overflow), with viewport restored; both warning/error logs clear. Zoom/R were exercised in-browser; pan/orbit bindings remain covered by regressions and physical mouse validation is pending. No observed ordinary responsiveness interruption; this is not a benchmark. Saved a production vegetation screenshot outside the repository. Physical mouse and final scale/density/readability remain pending human validation.

## Review

- Development: http://127.0.0.1:5178/FireFront/
- Production preview: http://127.0.0.1:4178/FireFront/
- Separate prototype: `/FireFront/terrain-art.html`; Gaea stays optional authored comparison.

1. Generate 0 and 34. Zoom in: compare both full tree shapes, grass tufts and rounded shrubs, base anchoring and density. Confirm paths, agents and START/SAFE stay readable.
2. Seed 0: ignite **(45,9)**, a tree location. Trees remain standing/darkened through the approximately 30-second forest burn; only exhaustion shows remnants, followed by 8 seconds cooling. Also inspect grass/brush burning and burnout; no active flames/embers on cooled cells.
3. Reset during burning and after exhaustion: all original geometry/colors/placement and 20 waiting agents return; view stays unchanged. R resets only the camera.
4. Regenerate the same seed, test picking/road rejection after camera movement, pan/orbit/zoom, narrow/short layouts and both consoles.

New vegetation work remains uncommitted for human validation. No claim of final visual acceptance or full MVP performance. Validation/release/deployment/submission require separate authorization; no merge/push/deploy or next feature here.

## User validation and checkpoint

All four manual checklist items passed according to the user, without inferred exact timings. Separate unresolved visual feedback: sparse forests, pale clearings and production terrain differing from prototype. These passes do not establish overall visual acceptance. Checkpoint this vegetation increment as `feat: integrate stylized vegetation with fire lifecycle`; terrain integration follows separately.
