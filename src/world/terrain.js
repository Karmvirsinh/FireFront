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
  if(e.surface){const s=e.surface;if(!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width<1||s.height<1||s.units!=='world'||s.triangulation!==TERRAIN_TRIANGULATION||!Array.isArray(s.cornerHeights)||s.cornerHeights.length!==(s.width+1)*(s.height+1)||!s.cornerHeights.every(Number.isFinite)||Math.abs(s.cellSize*s.width-map.width*map.cellSize)>1e-8||Math.abs(s.cellSize*s.height-map.height*map.cellSize)>1e-8)throw new Error('Invalid authoritative terrain surface');}
}

export function renderTerrainMap(map){const s=map.elevation?.surface;return s?{width:s.width,height:s.height,cellSize:s.cellSize,elevation:s}:map;}

// Continuous grid coordinates (agent positions already use this convention).
// Outside positions clamp to the nearest boundary, useful for offset labels.
export function sampleTerrainHeight(map, gridX, gridZ) {
  if (!Number.isFinite(gridX) || !Number.isFinite(gridZ)) throw new Error('Terrain coordinates must be finite');
  if (!map.elevation) return 0;
  if(map.elevation.surface){const s=map.elevation.surface;return sampleTerrainHeight({width:s.width,height:s.height,elevation:{cornerHeights:s.cornerHeights}},gridX*s.width/map.width,gridZ*s.height/map.height);}
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
  if(map.elevation.surface){
    const s=map.elevation.surface,rx=s.width/map.width,rz=s.height/map.height,x=index%map.width,z=Math.floor(index/map.width),surface={width:s.width,height:s.height,cellSize:s.cellSize,elevation:{cornerHeights:s.cornerHeights}};let max=0;
    // Conservative: every fine triangle whose cell intersects this logical cell.
    // The grids need not divide evenly (256surface cells vs104logical cells).
    for(let fz=Math.floor(z*rz);fz<Math.ceil((z+1)*rz-1e-10);fz++)for(let fx=Math.floor(x*rx);fx<Math.ceil((x+1)*rx-1e-10);fx++)max=Math.max(max,...terrainCellGradients(surface,fz*s.width+fx));
    return [max,max];
  }
  const x = index % map.width, z = Math.floor(index / map.width);
  const i = z * (map.width + 1) + x, stride = map.width + 1;
  const h = map.elevation.cornerHeights;
  return [Math.hypot(h[i + stride + 1] - h[i + stride], h[i + stride] - h[i]) / map.cellSize,
    Math.hypot(h[i + 1] - h[i], h[i + stride + 1] - h[i + 1]) / map.cellSize];
}
