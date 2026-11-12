import {createNoise2D} from 'simplex-noise';
import {createLandformPlan} from './landformComposition.js';
import {seedStream} from './seed.js';
import {continuousPlan} from './continuousLandforms.js';
import {validateTerrain} from '../terrain.js';

export function createFineComposedTerrain(map,seed,attempt=0){
 const emphasis=['woodland','plateau','ridge'][Math.floor(seedStream(seed,'simulator-landform-family-v1')()*3)],stream='simulator-landform-composition-v1';
 const raw=createLandformPlan(emphasis,seed,attempt,{extent:map.width*map.cellSize,fullMap:true,refine:true,stream});
 const plan=continuousPlan(raw,createNoise2D(seedStream(seed,`${stream}:${emphasis}`,attempt))),world=map.width*map.cellSize;
 const sample=(x,z)=>plan.height(x-world/2,z-world/2),fine=[];let low=Infinity,high=-Infinity;
 for(let z=0;z<=256;z++)for(let x=0;x<=256;x++){const h=sample(x/256*world,z/256*world);if(!Number.isFinite(h))throw new Error('Non-finite fine terrain');fine.push(h);low=Math.min(low,h);high=Math.max(high,h);}
 if(high-low>12||high-low<.5)throw new Error('Fine relief outside bounds');
 const corners=[];for(let z=0;z<=map.height;z++)for(let x=0;x<=map.width;x++)corners.push(sample(x*map.cellSize,z*map.cellSize)-low);
 const {height,...composition}=raw;
 const elevation={units:'world',triangulation:'nw-se',cornerHeights:corners,surface:{width:256,height:256,cellSize:world/256,units:'world',triangulation:'nw-se',cornerHeights:fine.map(h=>h-low)},
  generation:{version:'simulator-continuous-surface-v3',family:emphasis,composition,parameters:{stream,surfaceCorners:257,trailSlopeDegrees:20,continuity:'continuous-caps-v1'},heightOffset:-low,relief:high-low,terrainAttempt:attempt,gradingMaxDisplacement:0}};
 validateTerrain({...map,elevation});return elevation;
}
