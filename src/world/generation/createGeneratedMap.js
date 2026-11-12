import { buildTerrainCandidate, buildTerrainCandidateV8, buildTerrainCandidateV9, buildTerrainCandidateV10 } from './buildTerrainCandidate.js';
import { createTerrainStructure } from './createTerrainStructure.js';
import { createForestVegetation } from './createForestVegetation.js';
import { createTerrainV1 } from './createTerrainV1.js';
import { normalizeSeed, seedStream, GENERATOR_SETTINGS, V8_SETTINGS, V9_SETTINGS, V10_SETTINGS, V5_SETTINGS, V5_VERSION, V6_SETTINGS, V6_VERSION, V7_SETTINGS, V7_VERSION } from './seed.js';
import { placeEndpoints } from './placeEndpoints.js';
import { createPathNetwork } from './createPathNetwork.js';
import { createVegetation } from './createVegetation.js';
import { validateGeneratedMap } from './validateGeneratedMap.js';
import { createTerrain } from './createTerrain.js';

// Explicit candidate construction also lets regressions replay a previously
// selected attempt when improved validation accepts an earlier one. Install only
// through createGeneratedMap / validateGeneratedMap.
export function buildCandidate(seed, attempt, settings = V7_SETTINGS) {
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
    generation: { seed, version: settings === V5_SETTINGS ? V5_VERSION : settings === V6_SETTINGS ? V6_VERSION : V7_VERSION, settings: { ...settings }, attempt },
    pathNetwork: { widthCells: settings.pathWidth, nodes: network.nodes, centerlines: network.centerlines, connections: network.connections, trailCells: [...network.cells].sort((a, b) => a - b) },
    navigation: { mode: 'path-first', allowedCells: cells.map((cell) => ['route', 'start', 'safe'].includes(cell.terrain)) },
    rendering: { ...(settings.canopyVersion ? {canopyVersion:settings.canopyVersion,canopySeed:seed} : {}), compactEndpoints: true, terrainColors: { route: 0x806247, clearing: 0xc4b38b }, labels: [
      { text: 'START', x: endpoints.start.x, z: endpoints.zones.start.z1 + 1.5, width: 2.7 },
      { text: 'SAFE', x: endpoints.safeZone.x, z: endpoints.zones.safe.z1 + 1.5, width: 2.7 },
    ] } };
}

const settingsCandidate = (seed, attempt) => buildTerrainCandidate(seed, attempt);

// Bounded deterministic retries; caller installs only the validated result.
// The candidate seam permits controlled failure/retry tests, not a UI setting.
export function createGeneratedMap(value, candidateFactory = settingsCandidate, settings = GENERATOR_SETTINGS, terrainFactory = settings === V5_SETTINGS ? createTerrainV1 : settings === V6_SETTINGS ? createTerrain : createTerrainStructure) {
  const seed = normalizeSeed(value);
  // Reuse read-only terrain/routing across network attempts in this call only.
  // No global cache, retained old maps or cross-regeneration ownership.
  if(candidateFactory===settingsCandidate){const cache=new Map();candidateFactory=(seed,attempt)=>buildTerrainCandidate(seed,attempt,settings,cache);}
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
  // Historical layout-first profiles attach terrain only after horizontal selection.
  // Terrain-first candidates already carry their validated authoritative surface.
  return selected.elevation ? selected : { ...selected, elevation: terrainFactory(selected, seed) };
}

// Explicit historical profile: never reconstruct old scenarios with current rules.
export const buildV5Candidate = (seed, attempt) => buildCandidate(seed, attempt, V5_SETTINGS);
export const createGeneratedMapV5 = (value, factory = buildV5Candidate) => createGeneratedMap(value, factory, V5_SETTINGS);

export const buildV6Candidate = (seed, attempt) => buildCandidate(seed, attempt, V6_SETTINGS);
export const createGeneratedMapV6 = (value, factory = buildV6Candidate) => createGeneratedMap(value, factory, V6_SETTINGS);

// Frozen pre-structure v7 terrain, for exact forest-checkpoint comparisons.
export const createGeneratedMapV7Baseline = value => createGeneratedMap(value, buildCandidate, V7_SETTINGS, createTerrain);
export const createGeneratedMapV7 = value => createGeneratedMap(value, buildCandidate, V7_SETTINGS, createTerrainStructure);

// Exact terrain-first alpha profile, including original terrain and named streams.
export const createGeneratedMapV8 = value => createGeneratedMap(value, buildTerrainCandidateV8, V8_SETTINGS);

export const createGeneratedMapV9=value=>createGeneratedMap(value,buildTerrainCandidateV9,V9_SETTINGS);

export const createGeneratedMapV10=(value,factory=buildTerrainCandidateV10)=>createGeneratedMap(value,factory,V10_SETTINGS);
