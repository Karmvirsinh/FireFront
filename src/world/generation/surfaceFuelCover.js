import {createNoise2D} from 'simplex-noise';
import {seedStream} from './seed.js';
import {sampleTerrainHeight,terrainCellGradients} from '../terrain.js';
import {nearestOnLine,polygonDistance,positiveHeight} from './landformComposition.js';

export const SURFACE_FUEL_VERSION='landform-cover-v1';
// This independent substrate setting is NOT the agent walking limit. A slope
// alone never declares mineral ground: an exposed landform feature is required.
export const MINERAL_FACE_MIN_DEGREES=32;
export function mineralFaceReason(map,index,noise=()=>0){
 const g=map.elevation?.generation,plan=g?.composition;
 if(!plan)return null;
 const x=(index%map.width+.5-map.width/2)*map.cellSize;
 const z=(Math.floor(index/map.width)+.5-map.height/2)*map.cellSize;
 const height=sampleTerrainHeight(map,index%map.width+.5,Math.floor(index/map.width)+.5)-(g.heightOffset??0);
 const slope=Math.atan(Math.max(...terrainCellGradients(map,index)))*180/Math.PI;
 for(const cut of plan.cuts??[]){
  const q=nearestOnLine(x,z,cut.spine),width=q.side<0?cut.leftWidth:cut.rightWidth,bank=q.side<0?cut.leftBank:cut.rightBank;
  const bed=q.height+bank*(q.distance/width)**2;
  if(q.distance<width*.45&&Math.abs(height-bed)<.25)return 'exposed-dry-cut-bed';
  if(slope>MINERAL_FACE_MIN_DEGREES&&q.distance>width*.45&&q.distance<width*1.05&&height<bed+.6)return 'exposed-cut-bank';
 }
 if(slope<=MINERAL_FACE_MIN_DEGREES)return null;
 const contributions=(plan.raised??[]).map(p=>positiveHeight(p,x,z,noise));
 const highest=Math.max(0,...contributions);
 for(const [feature,p] of (plan.raised??[]).entries()){
  // A buried feature must not strip vegetation from another landform above it.
  if(contributions[feature]<highest-.05||Math.abs(height-contributions[feature])>.5)continue;
  if(p.type==='tableland'||p.type==='terrace'){
   const d=polygonDistance(x,z,p.points),margin=(p.warp??0)+map.cellSize;
   if(d>=-p.riser-margin&&d<=margin)return 'exposed-tableland-riser';
  }
  if(p.type==='ridge'){
   const q=nearestOnLine(x,z,p.spine),width=q.side<0?p.leftWidth:p.rightWidth,other=q.side<0?p.rightWidth:p.leftWidth;
   // Only the narrow, exposed flank. Broad vegetated flanks, hills and ridge
   // branches can remain fuel-bearing even when steeper than this setting.
   if(width<other*.85&&q.distance>width*.25&&q.distance<width*1.6)return 'exposed-narrow-ridge-flank';
  }
 }
 return null;
}

export function applySurfaceFuelCover(map){
 const g=map.elevation?.generation,plan=g?.composition;
 const noise=plan?createNoise2D(seedStream(map.generation.seed,`${g.parameters.stream}:${plan.emphasis}`,plan.attempt)):()=>0;
 map.cells=map.cells.map((cell,index)=>{
  if(['route','start','safe'].includes(cell.terrain))return cell;
  if(cell.fuelType==='none')return {...cell,surfaceCover:cell.terrain==='obstacle'?'mineral':'bare'};
  const reason=mineralFaceReason(map,index,noise);
  return reason?{...cell,fuelType:'none',surfaceCover:'mineral',surfaceReason:reason}:{...cell,surfaceCover:'vegetated'};
 });
 return map;
}
