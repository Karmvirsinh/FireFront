import { createFixedMap } from './createFixedMap.js';
import { normalizeMap } from './mapContract.js';

// Preserve the authored fixture verbatim; presentation/spawns live in its adapter.
export function createFixedMapDefinition() {
  const map = createFixedMap();
  return normalizeMap({ ...map, name: 'Fixed MVP map',
    spawnCells: Array.from({ length: 20 }, (_, i) =>
      (map.start.z - 2 + Math.floor(i / 5)) * map.width + map.start.x - 2 + i % 5),
    rendering: {
      decorationBounds: { x0: 6, x1: 57, z0: 18, z1: 49 },
      labels: [
        { text: 'START', x: map.start.x, z: map.zones.start.z1 + 2, width: 2.7 },
        { text: 'SAFE', x: map.safeZone.x, z: map.zones.safe.z1 + 2, width: 2.7 },
        { text: 'ROUTE A', x: 21, z: 20, width: 3.2 },
        { text: 'ROUTE B', x: 21, z: 46, width: 3.2 },
      ],
    },
  });
}
