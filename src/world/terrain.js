// Shared corners use grid-edge coordinates: (0,0) is the map's NW corner.
// Cell (x,z) is split NW--SE: triangles NW/SW/SE and NW/SE/NE.
export const TERRAIN_TRIANGULATION = 'nw-se';

export function validateTerrain(map) {
  if (map.elevation === undefined) return;
  const e = map.elevation;
  if (!e || e.triangulation !== TERRAIN_TRIANGULATION || e.units !== 'world'
    || !Array.isArray(e.cornerHeights)
    || e.cornerHeights.length !== (map.width + 1) * (map.height + 1)
    || !Array.from(e.cornerHeights).every(Number.isFinite)) {
    throw new Error('Invalid map: elevation requires finite shared world-unit corner heights and nw-se triangulation');
  }
}

// Continuous grid coordinates (agent positions already use this convention).
// Outside positions clamp to the nearest boundary, useful for offset labels.
export function sampleTerrainHeight(map, gridX, gridZ) {
  if (!Number.isFinite(gridX) || !Number.isFinite(gridZ)) throw new Error('Terrain coordinates must be finite');
  if (!map.elevation) return 0;
  const gx = Math.max(0, Math.min(map.width, gridX));
  const gz = Math.max(0, Math.min(map.height, gridZ));
  const x = Math.min(map.width - 1, Math.floor(gx));
  const z = Math.min(map.height - 1, Math.floor(gz));
  const u = gx - x, v = gz - z;
  const i = z * (map.width + 1) + x;
  const h = map.elevation.cornerHeights, stride = map.width + 1;
  const nw = h[i], ne = h[i + 1], sw = h[i + stride], se = h[i + stride + 1];
  return v >= u ? nw + (se - sw) * u + (sw - nw) * v
    : nw + (ne - nw) * u + (se - ne) * v;
}

// Magnitudes of both planar triangle gradients: rise / horizontal world run.
// atan(gradient) gives the steepest slope, not just a center-to-center estimate.
export function terrainCellGradients(map, index) {
  if (!map.elevation) return [0, 0];
  const x = index % map.width, z = Math.floor(index / map.width);
  const i = z * (map.width + 1) + x, stride = map.width + 1;
  const h = map.elevation.cornerHeights;
  return [Math.hypot(h[i + stride + 1] - h[i + stride], h[i + stride] - h[i]) / map.cellSize,
    Math.hypot(h[i + 1] - h[i], h[i + stride + 1] - h[i + 1]) / map.cellSize];
}
