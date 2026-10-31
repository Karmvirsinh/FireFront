import { createTerrainStructure } from './createTerrainStructure.js';
import { createForestVegetation } from './createForestVegetation.js';
import { createTerrainV1 } from './createTerrainV1.js';
import { normalizeSeed, seedStream, GENERATOR_VERSION, GENERATOR_SETTINGS, V5_SETTINGS, V5_VERSION, V6_SETTINGS, V6_VERSION } from './seed.js';
import { placeEndpoints } from './placeEndpoints.js';
import { createPathNetwork } from './createPathNetwork.js';
import { createVegetation } from './createVegetation.js';
import { validateGeneratedMap } from './validateGeneratedMap.js';
import { createTerrain } from './createTerrain.js';

// Explicit candidate construction also lets regressions replay a previously
// selected attempt when improved validation accepts an earlier one. Install only
// through createGeneratedMap / validateGeneratedMap.
export function buildCandidate(seed, attempt, settings = GENERATOR_SETTINGS) {
  const endpoints = placeEndpoints(settings, seedStream(seed, 'endpoints'));
  const network = createPathNetwork(endpoints, settings, seedStream(seed, 'paths', attempt));
  const cells = settings.vegetationVersion ? createForestVegetation(settings, seedStream(seed,'forest-regions-v2'), seedStream(seed,'rocks'))
    : createVegetation(settings, seedStream(seed, 'vegetation'), seedStream(seed, 'rocks'));
  for (const index of network.cells) cells[index] = { terrain: 'route', fuelType: 'none', walkable: true };
  for (const [name, zone] of Object.entries(endpoints.zones)) {
    for (let z = zone.z0; z <= zone.z1; z += 1) for (let x = zone.x0; x <= zone.x1; x += 1) {
      cells[z * settings.width + x] = { terrain: name === 'start' ? 'start' : 'safe', fuelType: 'none', walkable: true };
    }
  }
  return { width: settings.width, height: settings.height, cellSize: settings.cellSize,
    ...endpoints, cells, name: `Seed ${seed}`,
    generation: { seed, version: settings === V5_SETTINGS ? V5_VERSION : settings === V6_SETTINGS ? V6_VERSION : GENERATOR_VERSION, settings: { ...settings }, attempt },
    pathNetwork: { widthCells: settings.pathWidth, nodes: network.nodes, centerlines: network.centerlines, connections: network.connections, trailCells: [...network.cells].sort((a, b) => a - b) },
    navigation: { mode: 'path-first', allowedCells: cells.map((cell) => ['route', 'start', 'safe'].includes(cell.terrain)) },
    rendering: { ...(settings.canopyVersion ? {canopyVersion:settings.canopyVersion,canopySeed:seed} : {}), compactEndpoints: true, terrainColors: { route: 0x806247, clearing: 0xc4b38b }, labels: [
      { text: 'START', x: endpoints.start.x, z: endpoints.zones.start.z1 + 1.5, width: 2.7 },
      { text: 'SAFE', x: endpoints.safeZone.x, z: endpoints.zones.safe.z1 + 1.5, width: 2.7 },
    ] } };
}

// Bounded deterministic retries; caller installs only the validated result.
// The candidate seam permits controlled failure/retry tests, not a UI setting.
export function createGeneratedMap(value, candidateFactory = buildCandidate, settings = GENERATOR_SETTINGS, terrainFactory = settings === V5_SETTINGS ? createTerrainV1 : settings === V6_SETTINGS ? createTerrain : createTerrainStructure) {
  const seed = normalizeSeed(value);
  let selected;
  for (let attempt = 0; attempt < (settings.maxAttempts ?? 4); attempt += 1) {
    try {
      const map = validateGeneratedMap(candidateFactory(seed, attempt));
      if (map.generation.seed !== seed || map.generation.attempt !== attempt) throw new Error('Candidate identity mismatch.');
      selected = map;
      break;
    }
    catch (error) { if (attempt === (settings.maxAttempts ?? 4)-1) throw new Error(`Could not generate seed ${seed} after ${settings.maxAttempts ?? 4} attempts. Current map retained.`, { cause: error }); }
  }
  // Terrain failure must not select a different horizontal layout candidate.
  return { ...selected, elevation: terrainFactory(selected, seed) };
}

// Explicit historical profile: never reconstruct old scenarios with current rules.
export const buildV5Candidate = (seed, attempt) => buildCandidate(seed, attempt, V5_SETTINGS);
export const createGeneratedMapV5 = (value, factory = buildV5Candidate) => createGeneratedMap(value, factory, V5_SETTINGS);

export const buildV6Candidate = (seed, attempt) => buildCandidate(seed, attempt, V6_SETTINGS);
export const createGeneratedMapV6 = (value, factory = buildV6Candidate) => createGeneratedMap(value, factory, V6_SETTINGS);

// Frozen pre-structure v7 terrain, for exact forest-checkpoint comparisons.
export const createGeneratedMapV7Baseline = value => createGeneratedMap(value, buildCandidate, GENERATOR_SETTINGS, createTerrain);
