import {prototypeSlopeLimit,prototypeSlopeCell,prototypePhysicalCell,PROTOTYPE_GENTLE_SLOPE_DEGREES} from './prototypeTraversal.js';
import {terrainCellGradients} from '../world/terrain.js';
import {displayedCellSlope} from './studySurface.js';

export function inspectTraversal(map,index){
 const cell=map.cells[index];if(!cell)throw new Error('Invalid scan cell');
 const slope=Math.atan(Math.max(...terrainCellGradients(map,index)))*180/Math.PI;
 const max=prototypeSlopeLimit(map),slopeSuitable=prototypeSlopeCell(map,index),physicalWalkable=prototypePhysicalCell(map,index);
 const policyAllowed=map.navigation?.mode!=='path-first'||Boolean(map.navigation.allowedCells[index]),pathAllowed=physicalWalkable&&policyAllowed;
 const nearLimit=slopeSuitable&&!prototypeSlopeCell(map,index,PROTOTYPE_GENTLE_SLOPE_DEGREES);
 const symbol=physicalWalkable?(nearLimit?'triangle':'dot'):'cross';
 const slopeText=slopeSuitable?`${slope.toFixed(1)}°: ${nearLimit?'steep but slope-permitted':'gentle'} under the ${max}° prototype trial`:`${slope.toFixed(1)}° exceeds the ${max}° prototype trial`;
 const blocker=!slopeSuitable?'steep surface':!physicalWalkable?(cell.terrain==='forest'?'forest-class ground':`${cell.terrain} classification / physical blocker`):null;
 const detailSlope=displayedCellSlope(map,index);
 return {index,slope,detailSlope,slopeSuitable,nearLimit,physicalWalkable,policyAllowed,pathAllowed,symbol,blocker,
  reason:`${map.displaySurface?'Coarse traversal slope':'Slope'} ${slopeText}. ${physicalWalkable?'Physically walkable':`Blocked by ${blocker}`}. ${policyAllowed?'On the permitted Path-first trail':'Outside the Path-first trail policy'}.${map.displaySurface?` Displayed fine-face maximum ${detailSlope.toFixed(1)}° within this cell; detail does not redefine coarse navigation.`:''} Red means blocked, not lethal.`};
}
export function scanEnvelope(elapsed,reducedMotion=false){
 if(elapsed<0||elapsed>=7.5)return {visible:false,opacity:0};
 return {visible:true,opacity:reducedMotion||elapsed<=6?1:1-(elapsed-6)/1.5};
}
