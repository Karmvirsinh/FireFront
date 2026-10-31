import { createNoise2D } from 'simplex-noise';
import { seedStream } from './seed.js';
import { TERRAIN_TRIANGULATION, terrainCellGradients } from '../terrain.js';

export const TERRAIN_VERSION = 'gentle-hills-v1';
export const TERRAIN_SETTINGS = Object.freeze({ noiseScale: 0.025, maxRelief: 2,
  maxTrailSlopeDegrees: 20 });

// Run only after layout selection. Never consumes a layout stream or retries it.
export function createTerrainV1(map, seed, overrides = {}) {
  const settings = { ...TERRAIN_SETTINGS, ...overrides };
  if (!Number.isFinite(settings.noiseScale) || settings.noiseScale <= 0
    || !Number.isFinite(settings.maxRelief) || settings.maxRelief < 0
    || !Number.isFinite(settings.maxTrailSlopeDegrees)
    || settings.maxTrailSlopeDegrees <= 0 || settings.maxTrailSlopeDegrees >= 90) {
    throw new Error('Invalid terrain settings');
  }
  const noise = createNoise2D(seedStream(seed, 'terrain:gentle-hills-v1'));
  const cornerHeights = Array.from({ length: (map.width + 1) * (map.height + 1) }, (_, i) => {
    const value = noise((i % (map.width + 1)) * settings.noiseScale,
      Math.floor(i / (map.width + 1)) * settings.noiseScale);
    // Smoothly flatten near-zero regions without terraces or discontinuities.
    return value * value * value;
  });
  const min = Math.min(...cornerHeights), max = Math.max(...cornerHeights);
  const reliefScale = max > min ? settings.maxRelief / (max - min) : 0;
  for (let i = 0; i < cornerHeights.length; i++) cornerHeights[i] = (cornerHeights[i] - min) * reliefScale;
  const elevation = { units: 'world', triangulation: TERRAIN_TRIANGULATION, cornerHeights,
    generation: { version: TERRAIN_VERSION, seed, stream: 'terrain:gentle-hills-v1', settings } };
  const candidate = { ...map, elevation };
  let steepest = 0;
  for (let i = 0; i < map.cells.length; i++) steepest = Math.max(steepest, ...terrainCellGradients(candidate, i));
  const limit = Math.tan(settings.maxTrailSlopeDegrees * Math.PI / 180);
  const slopeScale = steepest > limit ? limit / steepest * (1 - 1e-12) : 1;
  // A global bound is stronger than trail-only constraints and avoids seams at
  // trail shoulders. No cells/edges are removed and no local terraces are cut.
  for (let i = 0; i < cornerHeights.length; i++) cornerHeights[i] *= slopeScale;
  elevation.generation.slopeScale = slopeScale;
  return elevation;
}
