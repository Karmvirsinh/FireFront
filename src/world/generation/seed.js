import alea from 'alea';

export const GENERATOR_VERSION='forest-camps-v15';
export const V14_VERSION='forest-settlements-v14';
export const V13_VERSION='forest-settlements-v13';
export const V12_VERSION='forest-woodland-v12';
export const V11_VERSION='forest-composition-v11';
export const V10_VERSION='forest-composition-v10';
export const V9_VERSION = 'forest-composition-v9';
export const V8_VERSION = 'forest-environment-v8';
export const V7_VERSION = 'forest-environment-v7';
export const V6_VERSION = 'forest-network-v6';
export const V5_VERSION = 'forest-network-v5';
export const V5_SETTINGS = Object.freeze({ width: 64, height: 64, cellSize: 0.5,
  population: 20, pathWidth: 1, noiseScale: 0.075, randomStreamVersion: 'forest-paths-v1',
  clearingThreshold: -0.45, grassThreshold: -0.05, brushThreshold: 0.35,
  rockScale: 0.13, rockThreshold: 0.68, nodeMin: 6, nodeMax: 9, nodeSpacing: 11, maxLoopConnections: 2, loopProbability: 0.45 });

export const V6_SETTINGS = Object.freeze({ ...V5_SETTINGS, width:104, height:104,
  nodeMin:14,nodeMax:18,nodeSpacing:15,nodeMargin:10,minNetworkSpan:58,
  maxCarvedCells:650, endpointRadiusMin:35,endpointRadiusRange:6,minEndpointSeparation:56,
  maxAttempts:16 });

export const V7_SETTINGS = Object.freeze({ ...V6_SETTINGS, vegetationVersion:'forest-regions-v2', canopyVersion:'woodland-v2' });

export const V8_SETTINGS = Object.freeze({ ...V7_SETTINGS, terrainFirst:true, maxAttempts:32 });
export const V9_SETTINGS = Object.freeze({ ...V8_SETTINGS, terrainVersion:'simulator-composition-v1', canopyVersion:'woodland-v3', maxAttempts:96 });
export const V10_SETTINGS=Object.freeze({...V9_SETTINGS,terrainVersion:'simulator-composition-v2'});
export const V11_SETTINGS=Object.freeze({...V10_SETTINGS,surfaceFuelVersion:'landform-cover-v1'});
export const V12_SETTINGS=Object.freeze({...V11_SETTINGS,terrainVersion:'simulator-continuous-surface-v3',surfaceCorners:257,woodlandArtwork:'kenney-woodland-v1'});

export const V13_SETTINGS=Object.freeze({...V12_SETTINGS,settlements:'connected-buildings-v1'});
export const V14_SETTINGS=Object.freeze({...V13_SETTINGS,endpointCounts:'origins-at-least-safe-v1'});
export const GENERATOR_SETTINGS=Object.freeze({...V14_SETTINGS,camps:'radial-camps-v1'});

// Decimal spelling only: no rounding, wrapping, exponent notation or random fallback.
export function normalizeSeed(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) throw new Error('Seed must be a whole decimal number from 0 to 4294967295.');
  const seed = Number(text);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new Error('Seed must be a whole decimal number from 0 to 4294967295.');
  }
  return seed;
}

export function seedStream(seed, component, attempt = 0) {
  return alea(`${GENERATOR_SETTINGS.randomStreamVersion}:${seed}:${attempt}:${component}`);
}
