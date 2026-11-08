# Terrain/art prototype source record

| Item | Source | Use / terms |
| --- | --- | --- |
| Broadleaf trees, layered bough trees | Original FireFront modular geometry in src/prototype/artwork.js | Project-authored reusable geometry recipes; not downloaded models or recolored production cones. No third-party asset license introduced. |
| Blade grass clumps and faceted boulders | Original FireFront geometry in src/prototype/artwork.js | Deterministic instanced project artwork; not the production grass blocks. |
| Landforms and surface colors | Original bounded study recipes in src/prototype/createStudyMap.js and createStudyView.js | Seeded procedural data; no external heightmaps, textures or model training. |
| Rendering primitives / merging | Existing Three.js dependency and BufferGeometryUtils | Existing MIT-licensed dependency; no new package. |
| PRNG/noise | Existing Alea / simplex-noise dependencies | Existing project dependencies; no new package or random source. |
| Gaea Mesa.terrain and its thumbnail | QuadSpinner Gaea 2.3.1 installation, bundled Examples/Mesa files | External diagnostic/reference input only. Copied project and attempted outputs kept in ignored logs/gaea-experiment. No export succeeded; no Gaea terrain, screenshot, source graph or texture is distributed by this prototype. Installed Gaea terms apply to the tool and its bundled examples. |
| THREE.Terrain | https://github.com/IceCreamYou/THREE.Terrain | Evaluated documentation only; no code/package/assets imported. |
| Kenney Nature Kit | https://kenney.nl/assets/nature-kit (CC0 per official asset page) | Considered as a reusable external option; not downloaded/imported. The live studies use the smaller original modular art set above. |
| User-supplied landscape concepts | Reference images in the project discussion | Directional references only; no pixels/assets copied into the application. |

This record describes actual provenance and does not relicense the repository or change existing authorship. There are no externally downloaded visual assets in this increment.

## Composition-v2 follow-up

- Original reusable landform operators now live in src/prototype/landformConstruction.js; the original six-study factory is preserved in createStudyMapV1.js. Original asset geometry and baseline surface materials are retained.
- Shape research only: [NPS landforms](https://www.nps.gov/subjects/geology/landforms.htm), [plateaus and mesas](https://www.nps.gov/subjects/nnlandmarks/plateaus-and-mesas.htm), [fluvial landforms](https://www.nps.gov/subjects/geology/fluvial-landforms.htm), [USGS elevation products](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services). No source images, DEMs or text excerpts are shipped as assets. No real erosion/hydrology simulation is claimed.
- One subsequent GUI launch successfully opened Gaea 2.3.1 Community, Welcome and a blank editor. No successful export, Gaea-authored terrain or tool settings/license changes resulted. The prior no-export CLI evidence is retained as history, not superseded by GUI access.
- Scan glyphs are original simple procedural geometry/SVG: dot, triangle and X, with explicit text labels. No icon/asset package or dependency was added.

## Subsequent focused GUI export trial

The earlier no-export result remains historical. A new one-instance GUI trial successfully exported bundled **Sandstone Butte** with Sandstone height and Layers mask as 512-square PNG16. This is externally authored example terrain processed by Gaea, not original FireFront shaping. The project/raw exports stay in ignored logs; the isolated comparison includes resampled numeric data with source hashes. Community non-commercial restrictions and further interactive-product/redistribution considerations apply; no unrestricted asset license is inferred. See [Gaea trial provenance, scale, checks and restrictions](gaea-trial.md). Original project artwork dresses the imported surface; no external trees/textures or Gaea software are shipped.

## 2026-11-08 — Surface-detail refinement

Meadow/forest-floor, dirt/gravel and weathered-stone grain/crack textures are original deterministic DataTexture artwork in src/prototype/surfaceMaterials.js, using existing simplex-noise/Three.js. No downloaded texture pack, fossil image, external asset or dependency/license was added. World-space material blending and cutaway bands are original shader code. Fine Gaea corner data is resampled from the same recorded PNG16 export; provenance/restrictions remain unchanged. See [comparison semantics, checks and costs](terrain-detail-comparison.md).
