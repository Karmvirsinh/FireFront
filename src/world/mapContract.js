// Plain-data boundary shared by world factories, simulation and rendering.
const TERRAINS = ['obstacle', 'vegetation', 'clearing', 'route', 'start', 'safe'];
const FUELS = ['none', 'grass', 'brush', 'forest'];

export function getMapRendering(map) {
  const relevant = map.cells.flatMap((cell, i) => cell.walkable || cell.fuelType !== 'none'
    ? [{ x: i % map.width, z: Math.floor(i / map.width) }] : []);
  relevant.push(map.start, map.safeZone);
  for (const zone of Object.values(map.zones ?? {})) {
    relevant.push({ x: zone.x0, z: zone.z0 }, { x: zone.x1, z: zone.z1 });
  }
  const full = { x0: 0, x1: map.width - 1, z0: 0, z1: map.height - 1 };
  return {
    labels: [
      { text: 'START', x: map.start.x, z: (map.zones?.start?.z1 ?? map.start.z) + 2, width: 2.7 },
      { text: 'SAFE', x: map.safeZone.x, z: (map.zones?.safe?.z1 ?? map.safeZone.z) + 2, width: 2.7 },
      ...(map.routes ?? []).filter((route) => route.section).map((route) => ({ text: route.label ?? route.id,
        x: (route.section.x0 + route.section.x1) / 2,
        z: (route.section.z0 + route.section.z1) / 2, width: 3.2 })),
    ],
    decorationBounds: full,
    focusBounds: {
      x0: Math.min(...relevant.map((p) => p.x)), x1: Math.max(...relevant.map((p) => p.x)),
      z0: Math.min(...relevant.map((p) => p.z)), z1: Math.max(...relevant.map((p) => p.z)),
    },
    ...map.rendering,
  };
}

export function normalizeMap(input) {
  // Own a snapshot: caller changes must not alter a running map's reset baseline.
  const map = structuredClone(input);
  function require(condition, message) { if (!condition) throw new Error(`Invalid map: ${message}`); }
  require(Number.isInteger(map.width) && map.width > 0
    && Number.isInteger(map.height) && map.height > 0, 'positive integer dimensions required');
  require(Number.isFinite(map.cellSize) && map.cellSize > 0, 'positive cellSize required');
  require(Array.isArray(map.cells) && map.cells.length === map.width * map.height, 'cell count must match dimensions');
  require(Array.from(map.cells).every((cell) => cell && TERRAINS.includes(cell.terrain)
    && FUELS.includes(cell.fuelType) && typeof cell.walkable === 'boolean'), 'unsupported cell data');
  const validIndex = (i) => Number.isInteger(i) && i >= 0 && i < map.cells.length && map.cells[i].walkable;
  for (const name of ['start', 'safeZone']) {
    const p = map[name];
    require(p && Number.isInteger(p.x) && Number.isInteger(p.z) && p.x >= 0 && p.x < map.width
      && p.z >= 0 && p.z < map.height && validIndex(p.z * map.width + p.x), `${name} must be in bounds and walkable`);
  }
  require(Array.isArray(map.spawnCells) && map.spawnCells.length > 0
    && Array.from(map.spawnCells).every(validIndex), 'explicit walkable spawnCells required');
  if (map.navigation) {
    require(map.navigation.mode === 'path-first' && Array.isArray(map.navigation.allowedCells)
      && map.navigation.allowedCells.length === map.cells.length
      && Array.from(map.navigation.allowedCells).every((allowed, i) => typeof allowed === 'boolean'
        && (!allowed || map.cells[i].walkable)), 'invalid Path-first navigation mask');
    require([...map.spawnCells, map.start.z * map.width + map.start.x,
      map.safeZone.z * map.width + map.safeZone.x].every((i) => map.navigation.allowedCells[i]),
    'endpoints/spawns must be allowed by navigation policy');
  }
  for (const zone of Object.values(map.zones ?? {})) {
    require(zone && [zone.x0, zone.x1, zone.z0, zone.z1].every(Number.isInteger)
      && zone.x0 >= 0 && zone.z0 >= 0 && zone.x0 <= zone.x1 && zone.z0 <= zone.z1
      && zone.x1 < map.width && zone.z1 < map.height, 'zones must be inclusive grid rectangles');
  }
  map.rendering = getMapRendering(map);
  for (const name of ['focusBounds', 'decorationBounds']) {
    const b = map.rendering[name];
    require(b && [b.x0, b.x1, b.z0, b.z1].every(Number.isInteger)
      && b.x0 >= 0 && b.z0 >= 0 && b.x0 <= b.x1 && b.z0 <= b.z1
      && b.x1 < map.width && b.z1 < map.height, `${name} must be an inclusive grid rectangle`);
  }
  require(Array.isArray(map.rendering.labels) && Array.from(map.rendering.labels).every((label) =>
    label && typeof label.text === 'string' && label.text.length > 0 && Number.isFinite(label.x)
    && Number.isFinite(label.z) && Number.isFinite(label.width) && label.width > 0), 'invalid labels');
  return map;
}

export function getCameraBounds(map) {
  const { focusBounds: b, labels } = getMapRendering(map);
  // Include label footprints and endpoint/fuel/walkable extents, even at map edges.
  let x0 = (b.x0 - map.width / 2) * map.cellSize;
  let x1 = (b.x1 + 1 - map.width / 2) * map.cellSize;
  let z0 = (b.z0 - map.height / 2) * map.cellSize;
  let z1 = (b.z1 + 1 - map.height / 2) * map.cellSize;
  for (const label of labels) {
    const x = (label.x + 0.5 - map.width / 2) * map.cellSize;
    const z = (label.z + 0.5 - map.height / 2) * map.cellSize;
    x0 = Math.min(x0, x - label.width / 2); x1 = Math.max(x1, x + label.width / 2);
    z0 = Math.min(z0, z - label.width / 8); z1 = Math.max(z1, z + label.width / 8);
  }
  return { worldWidth: map.width * map.cellSize, worldDepth: map.height * map.cellSize,
    framing: { width: x1 - x0 + 3, depth: z1 - z0 + 2,
      centerX: (x0 + x1) / 2, centerZ: (z0 + z1) / 2 } };
}
