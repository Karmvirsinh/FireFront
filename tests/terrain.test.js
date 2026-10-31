import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeneratedMapV5 as createGeneratedMap, buildV5Candidate as buildCandidate } from '../src/world/generation/createGeneratedMap.js';
import { validateGeneratedMap } from '../src/world/generation/validateGeneratedMap.js';
import { createTerrain } from '../src/world/generation/createTerrain.js';
import { normalizeMap } from '../src/world/mapContract.js';
import { sampleTerrainHeight, terrainCellGradients } from '../src/world/terrain.js';
import { createFixedMapDefinition } from '../src/world/createFixedMapDefinition.js';

const seeds = [...Array.from({ length: 64 }, (_, i) => i), 2026, 65535, 2147483648, 4294967295];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('terrain preserves all v5 horizontal data and selected attempts across 68 seeds', () => {
  for (const seed of seeds) {
    let baseline;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { baseline = validateGeneratedMap(buildCandidate(seed, attempt)); break; } catch {}
    }
    assert.ok(baseline);
    const { elevation, ...horizontal } = createGeneratedMap(seed);
    assert.deepEqual(horizontal, baseline);
    assert.deepEqual(createGeneratedMap(seed).elevation, elevation);
    assert.equal(horizontal.generation.version, 'forest-network-v5');
    assert.equal(elevation.generation.version, 'gentle-hills-v1');
    normalizeMap({ ...horizontal, elevation });
    assert.ok(Math.min(...elevation.cornerHeights) >= 0);
    assert.ok(Math.max(...elevation.cornerHeights) <= 2 + 1e-9);
    assert.ok(Math.max(...elevation.cornerHeights) > 0);
    const map = { ...horizontal, elevation };
    for (let i = 0; i < map.cells.length; i++) {
      // Stronger than checking one route: BOTH faces of EVERY cell comply.
      for (const g of terrainCellGradients(map, i)) assert.ok(g <= Math.tan(Math.PI / 9) + 1e-10);
      if (!map.navigation.allowedCells[i]) continue;
      const x = i % map.width, z = Math.floor(i / map.width);
      for (const [nx, nz] of [[x + 1, z], [x, z + 1]]) {
        if (nx >= map.width || nz >= map.height || !map.navigation.allowedCells[nz * map.width + nx]) continue;
        let previous = sampleTerrainHeight(map, x + .5, z + .5);
        for (let step = 1; step <= 10; step++) {
          const h = sampleTerrainHeight(map, x + .5 + (nx-x)*step/10, z + .5 + (nz-z)*step/10);
          assert.ok(Math.abs(h - previous) / (map.cellSize / 10) <= Math.tan(Math.PI / 9) + 1e-9);
          previous = h;
        }
      }
    }
  }
});

test('sampler matches explicit triangles, diagonal, shared edges and boundary corners', () => {
  const map = { width: 2, height: 1, cellSize: .5, elevation: {
    cornerHeights: [0, 2, 4, 4, 8, 6] } };
  near(sampleTerrainHeight(map, .75, .25), 3);
  near(sampleTerrainHeight(map, .25, .75), 4);
  near(sampleTerrainHeight(map, .5, .5), 4);
  near(sampleTerrainHeight(map, 1, .4), 4.4);
  near(sampleTerrainHeight(map, 1-1e-12, .4), sampleTerrainHeight(map, 1+1e-12, .4));
  near(sampleTerrainHeight(map, 2, 1), 6);
  near(sampleTerrainHeight(map, -1, 2), 4);
  near(terrainCellGradients(map, 0)[0], Math.hypot(4, 4)/.5);
  near(terrainCellGradients(map, 0)[1], Math.hypot(2, 6)/.5);
  assert.throws(() => sampleTerrainHeight(map, NaN, 0), /finite/);
});

test('contract rejects invalid elevation, clones heights and retains flat fallback', () => {
  const fixed = createFixedMapDefinition();
  assert.equal(fixed.elevation, undefined);
  near(sampleTerrainHeight(fixed, 32.5, 32.5), 0);
  assert.deepEqual(terrainCellGradients(fixed, 0), [0, 0]);
  const map = createGeneratedMap(7), copy = normalizeMap(map);
  copy.elevation.cornerHeights[0] += 1;
  assert.notEqual(copy.elevation.cornerHeights[0], map.elevation.cornerHeights[0]);
  for (const change of [e => e.cornerHeights.pop(), e => e.cornerHeights[0] = Infinity,
    e => delete e.cornerHeights[0], e => e.units = 'cells', e => e.triangulation = 'bilinear']) {
    const broken = structuredClone(map); change(broken.elevation);
    assert.throws(() => normalizeMap(broken), /elevation/);
  }
});

test('slope constraint scales relief without modifying original bypass or drawing on other streams', () => {
  const map = validateGeneratedMap(buildCandidate(34, 1)), before = structuredClone(map);
  const elevation = createTerrain(map, 34, { maxTrailSlopeDegrees: 5 });
  assert.ok(elevation.generation.slopeScale < 1);
  assert.deepEqual(map, before);
  assert.equal(map.cells[36 * 64 + 44].terrain, 'route');
  for (let i = 0; i < map.cells.length; i++) for (const g of terrainCellGradients({ ...map, elevation }, i)) {
    assert.ok(g <= Math.tan(5 * Math.PI / 180) + 1e-10);
  }
  assert.notDeepEqual(createTerrain(map, 34), createTerrain(map, 7));
  assert.throws(() => createTerrain(map, 34, { maxTrailSlopeDegrees: 0 }), /settings/);
});
