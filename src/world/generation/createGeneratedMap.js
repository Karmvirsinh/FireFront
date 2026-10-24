import { normalizeSeed, seedStream, GENERATOR_VERSION, GENERATOR_SETTINGS } from './seed.js';
import { placeEndpoints } from './placeEndpoints.js';
import { createPathNetwork } from './createPathNetwork.js';
import { createVegetation } from './createVegetation.js';
import { validateGeneratedMap } from './validateGeneratedMap.js';

function buildCandidate(seed, attempt) {
  const settings = GENERATOR_SETTINGS;
  const endpoints = placeEndpoints(settings, seedStream(seed, 'endpoints'));
  const network = createPathNetwork(endpoints, settings, seedStream(seed, 'paths', attempt));
  const cells = createVegetation(settings, seedStream(seed, 'vegetation'), seedStream(seed, 'rocks'));
  for (const index of network.cells) cells[index] = { terrain: 'route', fuelType: 'none', walkable: true };
  for (const [name, zone] of Object.entries(endpoints.zones)) {
    for (let z = zone.z0; z <= zone.z1; z += 1) for (let x = zone.x0; x <= zone.x1; x += 1) {
      cells[z * settings.width + x] = { terrain: name === 'start' ? 'start' : 'safe', fuelType: 'none', walkable: true };
    }
  }
  return { width: settings.width, height: settings.height, cellSize: settings.cellSize,
    ...endpoints, cells, name: `Seed ${seed}`,
    generation: { seed, version: GENERATOR_VERSION, settings: { ...settings }, attempt },
    pathNetwork: { widthCells: settings.pathWidth, nodes: network.nodes, centerlines: network.centerlines, connections: network.connections, trailCells: [...network.cells].sort((a, b) => a - b) },
    navigation: { mode: 'path-first', allowedCells: cells.map((cell) => ['route', 'start', 'safe'].includes(cell.terrain)) },
    rendering: { compactEndpoints: true, terrainColors: { route: 0x806247, clearing: 0xc4b38b }, labels: [
      { text: 'START', x: endpoints.start.x, z: endpoints.zones.start.z1 + 1.5, width: 2.7 },
      { text: 'SAFE', x: endpoints.safeZone.x, z: endpoints.zones.safe.z1 + 1.5, width: 2.7 },
    ] } };
}

// Bounded deterministic retries; caller installs only the validated result.
// The candidate seam permits controlled failure/retry tests, not a UI setting.
export function createGeneratedMap(value, candidateFactory = buildCandidate) {
  const seed = normalizeSeed(value);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const map = validateGeneratedMap(candidateFactory(seed, attempt));
      if (map.generation.seed !== seed || map.generation.attempt !== attempt) throw new Error('Candidate identity mismatch.');
      return map;
    }
    catch (error) { if (attempt === 3) throw new Error(`Could not generate seed ${seed} after 4 attempts. Current map retained.`, { cause: error }); }
  }
}
