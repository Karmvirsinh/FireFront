import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';

// Illustrative prototype capability only. Production construction/navigation
// retain their existing 20-degree rule; existing study trails are not redrawn.
export const PROTOTYPE_MAX_SLOPE_DEGREES=50;
export const PROTOTYPE_GENTLE_SLOPE_DEGREES=20;
export const prototypeSlopeLimit=map=>map.prototype?.maxSlopeDegrees??PROTOTYPE_MAX_SLOPE_DEGREES;
export function prototypeSlopeCell(map,index,maxDegrees=prototypeSlopeLimit(map)){
 return Number.isInteger(index)&&index>=0&&index<map.width*map.height
  &&terrainCellGradients(map,index).every(g=>g<=Math.tan(maxDegrees*Math.PI/180)+1e-8);
}
export function prototypePhysicalCell(map,index,maxDegrees=prototypeSlopeLimit(map)){
 const cell=map.cells[index];
 return Boolean(cell&&!['forest','rock'].includes(cell.terrain)
  &&(cell.baseWalkable??cell.walkable)&&prototypeSlopeCell(map,index,maxDegrees));
}
export function prototypeTraversalEdge(map,a,b,{pathFirst=true,maxDegrees=prototypeSlopeLimit(map)}={}){
 if(Math.abs(a%map.width-b%map.width)+Math.abs(Math.floor(a/map.width)-Math.floor(b/map.width))!==1
  ||!prototypePhysicalCell(map,a,maxDegrees)||!prototypePhysicalCell(map,b,maxDegrees))return false;
 if(pathFirst&&map.navigation?.mode==='path-first'&&(!map.navigation.allowedCells[a]||!map.navigation.allowedCells[b]))return false;
 const ax=a%map.width+.5,az=Math.floor(a/map.width)+.5,bx=b%map.width+.5,bz=Math.floor(b/map.width)+.5;
 const h=[sampleTerrainHeight(map,ax,az),sampleTerrainHeight(map,(ax+bx)/2,(az+bz)/2),sampleTerrainHeight(map,bx,bz)];
 const limit=Math.tan(maxDegrees*Math.PI/180)*map.cellSize/2+1e-8;
 return Math.abs(h[1]-h[0])<=limit&&Math.abs(h[2]-h[1])<=limit;
}
export function prototypeConnected(map,start,goal,options={}){
 const max=options.maxDegrees??prototypeSlopeLimit(map),pathFirst=options.pathFirst??true;
 if(!prototypePhysicalCell(map,start,max)||!prototypePhysicalCell(map,goal,max))return false;
 if(pathFirst&&map.navigation?.mode==='path-first'&&(!map.navigation.allowedCells[start]||!map.navigation.allowedCells[goal]))return false;
 const seen=new Set([start]),queue=[start];
 for(let n=0;n<queue.length;n++){
  const i=queue[n];if(i===goal)return true;
  for(const j of [i-map.width,i+1,i+map.width,i-1])if(!seen.has(j)&&prototypeTraversalEdge(map,i,j,options)){seen.add(j);queue.push(j);}
 }
 return false;
}
export function validatePrototypeTrails(map){
 for(let i=0;i<map.cells.length;i++)if(map.navigation?.allowedCells[i]){
  if(!prototypePhysicalCell(map,i))throw new Error(`Prototype trail cell blocked at ${i}`);
  for(const j of [i+1,i+map.width])if(j<map.cells.length&&map.navigation.allowedCells[j]
   &&(j!==i+1||j%map.width!==0)&&!prototypeTraversalEdge(map,i,j))throw new Error('Prototype trail edge exceeds capability');
 }
 const line=map.pathNetwork?.centerlines?.[0];
 if(line?.length){const a=line[0],b=line.at(-1);if(!prototypeConnected(map,a.z*map.width+a.x,b.z*map.width+b.x))throw new Error('Prototype trail is disconnected');}
}
