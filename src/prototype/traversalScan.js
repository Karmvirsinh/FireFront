import {TRAIL_SLOPE_DEGREES,terrainTrailCell} from '../world/generation/trailTerrain.js';
import {terrainCellGradients} from '../world/terrain.js';

export function inspectTraversal(map,index){
 const cell=map.cells[index];if(!cell)throw new Error('Invalid scan cell');
 const slope=Math.atan(Math.max(...terrainCellGradients(map,index)))*180/Math.PI;
 const slopeSuitable=terrainTrailCell(map,index),physicalWalkable=slopeSuitable&&cell.walkable;
 const policyAllowed=map.navigation?.mode!=='path-first'||Boolean(map.navigation.allowedCells[index]),pathAllowed=physicalWalkable&&policyAllowed;
 const nearLimit=slopeSuitable&&slope>=TRAIL_SLOPE_DEGREES*.8;
 const symbol=physicalWalkable?(nearLimit?'triangle':'dot'):'cross';
 const slopeText=slopeSuitable?`${slope.toFixed(1)}°: ${nearLimit?'near':'within'} the ${TRAIL_SLOPE_DEGREES}° limit`:`${slope.toFixed(1)}° exceeds the ${TRAIL_SLOPE_DEGREES}° limit`;
 const blocker=!slopeSuitable?'steep surface':!cell.walkable?(cell.terrain==='forest'?'forest-class ground':`${cell.terrain} classification`):null;
 return {index,slope,slopeSuitable,nearLimit,physicalWalkable,policyAllowed,pathAllowed,symbol,blocker,
  reason:`Slope ${slopeText}. ${physicalWalkable?'Physically walkable':`Blocked by ${blocker}`}. ${policyAllowed?'On the permitted Path-first trail':'Outside the Path-first trail policy'}. Red means blocked, not lethal.`};
}
export function scanEnvelope(elapsed,reducedMotion=false){
 if(elapsed<0||elapsed>=7.5)return {visible:false,opacity:0};
 return {visible:true,opacity:reducedMotion||elapsed<=6?1:1-(elapsed-6)/1.5};
}
