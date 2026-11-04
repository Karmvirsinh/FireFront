# Terrain and art prototype

Uncommitted visual exploration on **codex/terrain-art-prototype**, from **65e1fce — wip: preserve terrain-aware trails pending human validation**. The WIP checkpoint preserves passed automated evidence, not human acceptance. Normal FireFront remains unchanged at the root URL. Neither this prototype nor its parent terrain work is merged or deployed.

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

Select one of three study tabs, then Seed 7 or Seed 2026. **Overview** fits the whole specimen; **Close-up** uses a deliberately closer oblique inspection view. Wheel zooms, middle drag orbits, right drag pans, R restores overview. Left-click ground to inspect the exact logical cell, steepest face slope and physical walkability. Panel clicks do not inspect terrain. No fire/evacuation controls are present here.

The optional traversal overlay uses mint for physically walkable cells and terracotta for blocked cells. Forest classifications remain blocked even between decorative tree trunks. All bare trail cells and their connections pass the shared 20-degree rule. Physical walkability is shown separately from the selected trail mask. Dry channel is a terrain shape/material only, with no water or hydrology.

## Bounded implementation

Each example is a 64×64 shared-corner heightfield, 0.5 world-unit cells (32×32 specimen), using the existing NW–SE triangulation, sampler, terrain geometry, ground picker, construction routing and trail-slope validation. This does not reduce or replace the normal 104×104 environment. Separate art-study random streams do not consume the normal generator streams. Only the two exposed study seeds are supported; this is not a production generator rewrite.

- **Rolling woodland:** broad anisotropic folds, a depressed valley and a smoothly blended flatter clearing. Forest edge/classification and decoration vary with the seed.
- **Irregular plateau:** a seeded, rotated/stretched 12-point broken polygon, narrow finite rock risers, a broad top and a genuine southern heightfield ramp with blended shoulders. The ramp joins through the rim rather than laying a road over a steep wall. Trail climbs approximately 3.2–3.4 world units. No concentric shelf construction.
- **Rugged ridge:** a wandering asymmetric spine with unequal flank widths, variable crest heights/saddles and localized ribs; a lower dry channel lies beside the gentler side. It is not a repeated radial mound.

Rock/earth is selected from actual triangle slopes. Faces above the walkability threshold are blocked; steep rock cells are nonfuel within these isolated study maps. Grass/trees/loose boulders follow the same sampler. Boulders are sparse toward low/high portions of exposed rock rather than uniformly covering every slope. The specimen uses original instanced modular tree/grass/stone geometry, flat-faced canopy variation, vertex surface mottling/strata and one shadow-casting directional light. Asset source records are in [terrain-art-sources.md](terrain-art-sources.md).

All faces are finite heightfield slopes. There are no true vertical discontinuities, overhangs, tunnels or stacked navigable surfaces. Steep appearance does not imply a traversable green ramp. The prototype's rock/fuel/physical classifications are explicit choices for these studies, not silent changes to production simulation rules.

One renderer/loop/ResizeObserver serves the current specimen. Replacing a study or seed disposes the old geometry/materials/instances/picker; leaving the page or HMR disposes controls, listeners, shadow target and renderer. Normal application comparison is a full-page navigation, not two simultaneous live simulations.

## Tool assessment and Gaea experiment

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
