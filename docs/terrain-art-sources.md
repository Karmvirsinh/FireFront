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
