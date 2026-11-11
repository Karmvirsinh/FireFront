import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';

// Pure rendering data. Hashes do not consume generator/simulation random streams.
export function createVegetationLayout(map){
 const seed=map.generation?.seed??0,size=map.cellSize;
 function sample(i,salt){let h=(i^seed^salt)>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
 function clear(gx,gz,radius){
  const reach=Math.ceil(radius/size)+1,x=Math.floor(gx),z=Math.floor(gz);
  for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){
   const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=map.width||nz>=map.height)continue;
   if(!map.navigation?.allowedCells[nz*map.width+nx])continue;
   const distance=Math.hypot(Math.max(nx-gx,0,gx-nx-1),Math.max(nz-gz,0,gz-nz-1))*size;
   if(distance<radius+.04)return false;
  }
  return gx*size>=radius&&gz*size>=radius&&(map.width-gx)*size>=radius&&(map.height-gz)*size>=radius;
 }
 const trees=[],grass=[],brush=[],candidates=[],occupied=new Map(),bucket=.8;
 for(let i=0;i<map.cells.length;i++){
  const cell=map.cells[i];if(cell.fuelType==='none'||map.navigation?.allowedCells[i])continue;
  const gx=i%map.width+.5+(sample(i,31)-.5)*.42,gz=Math.floor(i/map.width)+.5+(sample(i,47)-.5)*.42;
  const base={cell:i,gx,gz,x:(gx-map.width/2)*size,z:(gz-map.height/2)*size,y:sampleTerrainHeight(map,gx,gz),angle:sample(i,91)*Math.PI*2};
  if(cell.fuelType==='forest'){
   if(sample(i,17)>(cell.canopyDensity??.65)*.78||terrainCellGradients(map,i).some(g=>g>Math.tan(35*Math.PI/180)))continue;
   const scale=.40+sample(i,73)*.14,wide=scale*(.86+sample(i,61)*.13),radius=wide*1.32;
   if(clear(gx,gz,radius))candidates.push({...base,species:sample(i,121)<.52?0:1,scale:[wide,scale,wide],radius,priority:sample(i,151)});
  }else{
   const isGrass=cell.fuelType==='grass';if(sample(i,163)>(isGrass?.62:.68))continue;
   const scale=isGrass?.62+sample(i,173)*.25:.75+sample(i,173)*.30,radius=scale*(isGrass?.23:.29);
   if(clear(gx,gz,radius))(isGrass?grass:brush).push({...base,scale:[scale,scale,scale],radius});
  }
 }
 candidates.sort((a,b)=>a.priority-b.priority||a.cell-b.cell);
 for(const tree of candidates){
  const bx=Math.floor(tree.x/bucket),bz=Math.floor(tree.z/bucket);let crowded=false;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)for(const p of occupied.get(`${bx+dx}:${bz+dz}`)??[])if(Math.hypot(tree.x-p.x,tree.z-p.z)<(tree.radius+p.radius)*.82)crowded=true;
  if(crowded)continue;trees.push(tree);const key=`${bx}:${bz}`;if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push(tree);
 }
 trees.sort((a,b)=>a.cell-b.cell);return {trees,grass,brush};
}
