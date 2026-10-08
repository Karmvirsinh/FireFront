// Illustrative demonstration values, not calibrated wildfire physics.
export const FIRE_CONFIG = Object.freeze({
  stepSeconds: 0.05,
  maxFrameSeconds: 0.25,
  fuelByType: Object.freeze({ none: 0, grass: 4, brush: 6, forest: 10 }),
  fuelPerSecond: 1,
  coolingSeconds: 5,
  exposurePerNeighborPerSecond: 1,
  ignitionExposure: 1,
});
