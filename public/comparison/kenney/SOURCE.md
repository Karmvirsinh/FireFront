# Kenney Nature Kit subset

Source: https://kenney.nl/assets/nature-kit (checked 2026-11-12).
License: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ .
See the original License.txt alongside these files. Redistribution, modification
and commercial use are permitted; attribution is optional. Courtesy credit:
Kenney (www.kenney.nl). No endorsement is implied.

Archive's internal title: Nature Kit (2.1); website update summary says1.0/2020.
Archive SHA256: fa7974a0d342bfe63c38664ba9f8ec1a4aab8ea25f099bdc56870e33588c4d9d.
Only eight original GLBs are included, unchanged: tree_oak,
tree_pineDefaultA, plant_bush, plant_bushLarge, grass, grass_large,
rock_smallA, rock_largeA. No entire catalogue or external texture downloads.

The isolated comparison bakes node transforms and original material/vertex
colors into instanced geometry. Both artwork choices use matte, nonmetallic
lighting and shared maximum size envelopes; imported files themselves are
unchanged. The pack's cooler/brighter palette is retained for evaluation.

Gaea-derived data in the parent directory have DIFFERENT provenance and
Community/noncommercial restrictions. This CC0 license does not cover them.


Correction diagnosis: GLBs have no images/material maps/vertex colors. Bundled
Side/tree_oak.png is retained as tree_oak-preview.png (same CC0 archive).
The source palette is turquoise/salmon. Legacy UniGLTF factors numerically match
its sRGB channels while glTF factor slots are linear. The isolated bake now
performs sRGB-to-linear decoding once; no arbitrary green tint. An untouched
GLB under neutral white lighting is available at ?modelCheck=1 for comparison.
Original GLBs remain unchanged. The earlier note about a raw palette bake is
historical; no production adoption is implied.

Approved presentation adaptation (2026-11-12): B defaults to an explicitly labelled FireFront palette, assigned by original material part (wood, broadleaf/conifer, grass/shrub, stone/moss), with bounded face/instance variation. This is original FireFront recoloring of CC0 geometry, not the untouched Kenney palette. Raw source GLBs, neutral source check and encoding correction are preserved.
