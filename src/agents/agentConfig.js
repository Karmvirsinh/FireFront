// Illustrative walking speed: 1.5 logical cells (0.75 world units) per second.
export const AGENT_CONFIG = Object.freeze({ population: 20, speedCellsPerSecond: 1.5, awareness: 'global', detectionRadius: 4,
  retryDelaySeconds: 5, retryIntervalSeconds: 5, hazardMemoryAgeSeconds: 10 });
