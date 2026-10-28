import { readFileSync } from 'node:fs';
import { normalizeMap } from '../../src/world/mapContract.js';
import { createVegetation } from '../../src/world/generation/createVegetation.js';
import { placeEndpoints } from '../../src/world/generation/placeEndpoints.js';
import { GENERATOR_SETTINGS, seedStream } from '../../src/world/generation/seed.js';

// Compact logical fixtures captured from e8ff7bf before the thinning correction.
// Keep formerly stalled Local scenarios even when a new generator opens bypasses.
const historical = JSON.parse(readFileSync(new URL('./awareness-v4-trails.json', import.meta.url), 'utf8'));
export function createAwarenessV4Fixture(seed) {
  const fixture = historical.scenarios.find(s => s.seed === seed);
  if (!fixture) throw new Error('No historical awareness fixture for this seed.');
  const endpoints = placeEndpoints(GENERATOR_SETTINGS, seedStream(seed, 'endpoints'));
  const cells = createVegetation(GENERATOR_SETTINGS, seedStream(seed, 'vegetation'), seedStream(seed, 'rocks'));
  for (const i of fixture.trailCells) cells[i] = { terrain: 'route', fuelType: 'none', walkable: true };
  for (const [name, zone] of Object.entries(endpoints.zones)) {
    for (let z = zone.z0; z <= zone.z1; z++) for (let x = zone.x0; x <= zone.x1; x++) {
      cells[z * 64 + x] = { terrain: name === 'start' ? 'start' : 'safe', fuelType: 'none', walkable: true };
    }
  }
  return normalizeMap({ width: 64, height: 64, cellSize: .5, ...endpoints, cells,
    generation: { seed, version: historical.version, attempt: fixture.attempt },
    navigation: { mode: 'path-first', allowedCells: cells.map(c => ['route', 'start', 'safe'].includes(c.terrain)) } });
}
