export const GRID_SIZE = 64;

export function cellAt(map, x, z) {
  if (!Number.isInteger(x) || !Number.isInteger(z)
    || x < 0 || z < 0 || x >= map.width || z >= map.height) return undefined;
  return map.cells[z * map.width + x];
}

export function createFixedMap() {
  const map = {
    width: GRID_SIZE,
    height: GRID_SIZE,
    cellSize: 0.5,
    cells: Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
      terrain: 'obstacle', fuelType: 'none', walkable: false,
    })),
    start: { x: 9, z: 32 },
    safeZone: { x: 54, z: 32 },
    zones: {
      start: { x0: 6, x1: 13, z0: 28, z1: 35 },
      safe: { x0: 50, x1: 57, z0: 28, z1: 35 },
    },
    vegetationPatch: { x0: 27, x1: 36, z0: 25, z1: 42 },
    routes: [
      { id: 'A', label: 'Route A', section: { x0: 30, x1: 33, z0: 24, z1: 24 } },
      { id: 'B', label: 'Route B', section: { x0: 30, x1: 33, z0: 43, z1: 43 } },
    ],
  };

  function paint(rect, values) {
    for (let z = rect.z0; z <= rect.z1; z += 1) {
      for (let x = rect.x0; x <= rect.x1; x += 1) Object.assign(cellAt(map, x, z), values);
    }
  }

  paint(map.vegetationPatch, { terrain: 'vegetation', fuelType: 'grass' });
  paint({ x0: 27, x1: 30, z0: 28, z1: 39 }, { fuelType: 'brush' });
  paint({ x0: 31, x1: 36, z0: 28, z1: 39 }, { fuelType: 'forest' });
  // Only these authored corridors and endpoint areas are walkable.
  const corridors = [
    { x0: 10, x1: 13, z0: 22, z1: 45 },
    { x0: 50, x1: 53, z0: 22, z1: 45 },
    { x0: 10, x1: 53, z0: 22, z1: 25 },
    { x0: 10, x1: 53, z0: 42, z1: 45 },
  ];
  for (const rect of corridors) paint(rect, { terrain: 'route', fuelType: 'none', walkable: true });
  // Approved local one-cell passages: the fixed one-cell safety buffer can
  // close these roads from the connected vegetation on their inner side.
  for (const [z0, z1] of [[22, 23], [44, 45]]) {
    paint({ x0: 30, x1: 33, z0, z1 }, { terrain: 'obstacle', fuelType: 'none', walkable: false });
  }
  for (const z of [25, 42]) {
    paint({ x0: 30, x1: 33, z0: z, z1: z },
      { terrain: 'vegetation', fuelType: 'grass', walkable: false });
  }
  paint(map.zones.start, { terrain: 'start', fuelType: 'none', walkable: true });
  paint(map.zones.safe, { terrain: 'safe', fuelType: 'none', walkable: true });
  return map;
}
