# Focused Gaea GUI export trial — 2026-11-04

Assets created with QuadSpinner Gaea.

## Actual result and provenance

**A real export succeeded.** Gaea **2.3.1.0 Community** loaded its bundled **Sandstone Butte** example. It uses Plates → RadialGradient → GraphicEQ → Crumble → Sandstone → SatMap. A separate project copy was saved under ignored logs/gaea-gui-trial; installed examples were not overwritten. Plates seed **54877**, Sandstone seed **30085**; the latter is the comparison's displayed node seed, not a FireFront world seed.

One GUI-initiated build executed six nodes at **512×512**, reporting Success in **4.643 seconds**. Only Sandstone was marked for export, with its height and Layers ports. No repeated command-line/Mesa migration experiment was run. The supported GUI itself invokes Build Swarm; the resulting build report and actual outputs agree. UI setup required using the full Build Settings window: the example initially retained an unsupported 2048 build definition despite the compact panel showing 1K. That was corrected to 512 before the one actual build.

| Export | Encoding | Bytes | Decoded range |
| --- | --- | ---: | --- |
| Sandstone_Out.png | PNG16, grayscale, 512×512 | 319,561 | 0–21,766 of 65,535 |
| Sandstone_Layers.png | PNG16, grayscale, 512×512 | 259,165 | 0–29,256 of 65,535 |

Both files were decoded, checked for dimensions/precision/nonconstant values and hashed. Exact SHA-256 provenance is stored in src/prototype/data/gaeaSandstone.json. Raw PNGs, the copied graph and machine-specific reports remain in ignored logs/gaea-gui-trial/export. No source graph, tool binaries, credentials or machine paths were added to the comparison data. The Layers output is a surface-detail mask, not fuel, walkability, water or navigation data.

## Local comparison and scale

- Development: http://127.0.0.1:5178/FireFront/terrain-art.html?study=gaea
- Production preview: http://127.0.0.1:4178/FireFront/terrain-art.html?study=gaea
- Alternatively choose **Gaea comparison · exported Sandstone Butte** below the existing 12-button gallery.

The existing terrain contract, NW–SE triangulation, geometry, surface sampler, ground picker, artwork, camera and resource lifecycle are reused. There was no raster file importer in the project, so a small isolated offline conversion creates plain corner/mask arrays. scripts/convertGaeaTrial.py uses the already available Python/Pillow installation; it starts no Gaea process and adds no npm dependency. Normal installation/build/run needs no Python or Gaea.

The source graph declares **5,000 m horizontal width / 2,500 m nominal height range**. The comparison maps width to **32 world units**, so `height = PNG16 / 65535 × 16` preserves that declared aspect. It does **not** stretch the observed height range to fill the nominal range. Bilinear resampling produces **129×129 shared corners / 128×128 cells**, at **0.25 world units/cell**, with actual sampled heights **0.008476–5.302378**. This is an isolated specimen, not a change to ordinary generated dimensions/cell size. Image first row maps to grid z=0; no geographic north is asserted.

The Layers mask is sampled at cell centers and subtly modulates rock finish only. Existing original trees/grass/rocks are placed using the imported surface and explicit prototype classifications. No SatMap color texture was exported or copied; the low-poly material baseline remains. The Gaea comparison has **no routed trail, endpoints, agents or simulation**. All Path-first permissions are false; scan describes physical suitability separately. Scan samples every fourth cell, maintaining 1,024 glyphs. Ordinary studies retain their original dimensions and every-second-cell scan.

## What it demonstrates and limits

Observed in development/preview: a broken raised butte with exposed stratified bands, smaller incised cuts and lower surrounding terrain. These surface-scale irregularities are more elaborate than the current analytic landform operators. Resampling to 129 corners and the current cell-based finish soften detail and can produce faceted striping; this is not a reproduction of Gaea's high-resolution preview shading. Canopy can obscure small features. No visual acceptance is inferred.

This trial is an **authored/exported terrain**. Seeded nodes could be rebuilt with different seeds offline, then validated/imported, but no new-seed batch or Gaea-in-browser runtime was implemented or demonstrated. Adopting such outputs would still require terrain-aware networks, all-spawn reachability, fuel assignment and scale/slope validation. Gaea exports do not provide those gameplay guarantees. No erosion algorithm was copied or recreated from the output.

## Usage restrictions

The installed edition is Community. The [official FAQ](https://www.quadspinner.com/FAQ) and [current EULA](https://www.quadspinner.com/PDF/Gaea2-2025-07.pdf) restrict Community software/assets to non-commercial use. The UI permits up to 1K export; this trial uses 512. The bundled example remains QuadSpinner's source material, not claimed as original FireFront artwork or relicensed as unrestricted assets. This is a local educational evaluation, not a redistribution approval.

EULA section 1.2 separately restricts interactive products primarily/prominently devoted to terrain generation/modification, with an exception for games/visualizations where it is incidental; any later generator/tool distribution needs a scope/license review. Sections 1.3 and 1.8 cover AI-training/competitive uses and asset retail/attribution conditions. This trial uses ordinary rendering/asset integration, no model training or retail sale. Attribution is retained visibly even though it is not a retail product. No license acceptance, activation or purchase was automated. No deployment or publication is authorized by this trial.

## Checks and manual review

Two focused imported-terrain checks cover actual export metadata/ranges/scaling, finite deterministic clone data, independent mask, 128-cell geometry/sampling, classified dressing, offset picking, bounded scan and disposal. The eight existing historical/composition prototype checks remain relevant; actual final results are recorded in progress.md. This small trial does not warrant a new full simulation benchmark.

Review the Gaea option at Overview and Close-up, orbit to inspect the broken top/exposed slopes/lower cuts, then switch back to several existing gallery entries. T/click may inspect physical slope, but there is intentionally no traversable trail in this comparison. Judge what Gaea adds separately from the retained material/canopy limitations.

## Subsequent mesh comparison (2026-11-08)

The same original export now supplies optional 257×257 surface corners alongside 129×129, retaining 128×128 logical cells, exact original coarse corners and common comparison height range. No further Gaea authoring or export occurred. Original provenance/licenses above continue to apply. Current rendering uses coherent original texture blends rather than the earlier cell finish; the Layers mask remains a subtle material-only modulation. See [detail/refinement findings and costs](terrain-detail-comparison.md). Earlier verification numbers above describe the preserved trial; current targeted verification is 14/14 tests plus build/diff/browser checks, with human detail/scan validation pending.
