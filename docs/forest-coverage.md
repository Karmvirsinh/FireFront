# Forest coverage and canopy refinement

Review work on feature/terrain-elevation after landforms preservation checkpoint **f1da2a6**. Overall landscape/forest appearance awaits human acceptance. Dimensions remain 104×104, cell size 0.5, population 20.

## Identity and preserved comparison

Normal generation is **forest-environment-v7**, with separate **forest-regions-v2** classification and **woodland-v2** canopy presentation. Frozen V6_SETTINGS/V6_VERSION and explicit createGeneratedMapV6/buildV6Candidate factories preserve v6 alongside existing v5. Shared endpoint/path/rock streams are unchanged. V7 uses a separate forest-regions-v2 stream rather than consuming old vegetation randomness. Exact landforms-v2 heights, endpoint/spawn cells, final trails, bypasses and navigation mask are verified against v6.

## Coverage

Low-frequency structure (0.018 per grid cell), 2–4 broad seeded forest cores, connecting narrower belts and smaller edge noise create large regions rather than independent small patches. Core radii are 17–28 grid cells; seed-dependent bias varies coverage. Brush and grass surround forest edges; bare clearings require both low forest influence and local noise. Existing rock classifications are reproduced with the original rock stream, then original trails/endpoints are carved. This is not a guarantee of one uninterrupted forest: roads, rocks and open areas can split components.

Forest cells have the existing forest fuel and blocked physical walkability; brush/grass retain their existing meanings. Optional canopyDensity is a visual density factor, 0.24–0.78, for forest cells; it does not change fuel quantity. All forest-floor cells remain ignitable even without a tree model. Changing classification changes fuel connectivity and burn durations, so old evacuation/spread outcomes are not current v7 predictions. No fire/agent/hazard/loss rules, speed, A*, detection radius or timing parameters changed.

## Canopy

At most one candidate tree per forest cell, selected by deterministic cell/seed hashes using canopyDensity. Within-cell offset is at most 0.29 grid cells on either axis; a deterministic spacing filter rejects centers within 0.5 grid cells of an installed neighbor. Trunks remain fully inside their own cell and never move into trail/start/SAFE cells. Width varies 0.78–0.96 of the original geometry, reduced to 0.64–0.76 beside a navigable trail; height varies 0.85–1.10. Minor canopy overhang is possible, but footprints and agents remain readable for review. Canopy is instanced, with no per-tree object/light/particle system or external assets.

Every slot records its logical fuel cell. Its saved matrix retains jitter and scale through standing burning, charred stump conversion, cooling and reset. Terrain samples use the jittered tree position. The ignition marker still marks the logical cell; tree fire slots use the same cell association, not nearest visual-model picking. The old fixed/v5/v6 models retain their original spacing and scale.

## Representative diagnostics

Run `node scripts/inspectForestCoverage.js` (lightweight data diagnostics, no graphics or benchmark).

| Seed | Forest cells (%) | Bare clearing cells (%) | Largest forest patch | Forest patches | Trees |
| --- | --- | --- | --- | --- | --- |
| 0 | 6,643 (61.42%) | 341 (3.15%) | 3,725 | 7 | 3,926 |
| 7 | 6,817 (63.03%) | 343 (3.17%) | 5,158 | 17 | 4,183 |
| 34 | 7,370 (68.14%) | 175 (1.62%) | 6,730 | 12 | 4,547 |
| 2026 | 6,966 (64.40%) | 273 (2.52%) | 1,934 | 11 | 4,233 |

Patches use four-edge forest-class connectivity after carving, not all-fuel connectivity. Prior v6 forest coverage was about 24%, bare clearings about 17%, largest forest patch 142–193 cells and about 644–650 tree models. These diagnostics do not replace visual acceptance. Forest mass and canopy still use simple cone models, not the detailed assets in the concepts.

## Review checklist

1. Compare seeds 0/7/34/2026: broad cores, thinner edges/narrow stretches, irregular openings and seed variation.
2. Zoom/orbit: no obvious tree rows, readable trails/agents and clear endpoint footprints.
3. Select forest fuel, start fire, inspect standing burning/charred/cool trees, then reset: positions/scales restore and camera stays put.
4. Regenerate/replay and inspect ordinary responsiveness/FPS and console. No performance benchmark is required or claimed.
