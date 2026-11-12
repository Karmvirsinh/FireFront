import {createLandformPlan} from './landformComposition.js';
import {seedStream} from './seed.js';
import {TERRAIN_TRIANGULATION,validateTerrain} from '../terrain.js';

export const COMPOSED_TERRAIN_VERSION='simulator-composition-v2';
// These are illustrative landscape proportions, not calibrated terrain physics.
export const COMPOSED_TERRAIN_SETTINGS=Object.freeze({maxRelief:12,trailSlopeDegrees:20,
  gradingMaxDisplacement:0,stream:'simulator-landform-composition-v1'});

export const createComposedTerrainV1=(map,seed,attempt=0)=>createComposedTerrain(map,seed,attempt,false);
export function createComposedTerrain(map,seed,attempt=0,refine=true){
  const random=seedStream(seed,'simulator-landform-family-v1');
  const emphasis=['woodland','plateau','ridge'][Math.floor(random()*3)];
  const plan=createLandformPlan(emphasis,seed,attempt,{extent:Math.max(map.width,map.height)*map.cellSize,
    fullMap:true,refine,stream:COMPOSED_TERRAIN_SETTINGS.stream});
  const cornerHeights=[];
  let min=Infinity,max=-Infinity;
  for(let z=0;z<=map.height;z++)for(let x=0;x<=map.width;x++){
    const h=plan.height((x-map.width/2)*map.cellSize,(z-map.height/2)*map.cellSize);
    if(!Number.isFinite(h))throw new Error('Non-finite composed terrain');
    cornerHeights.push(h);min=Math.min(min,h);max=Math.max(max,h);
  }
  if(max-min>COMPOSED_TERRAIN_SETTINGS.maxRelief||max-min<.5)throw new Error('Composed relief outside bounds');
  const {height,...composition}=plan; // Plain data only: never store the evaluator in a map.
  const elevation={units:'world',triangulation:TERRAIN_TRIANGULATION,cornerHeights:cornerHeights.map(h=>h-min),
    generation:{version:refine?COMPOSED_TERRAIN_VERSION:'simulator-composition-v1',parameters:refine?{...COMPOSED_TERRAIN_SETTINGS,morphologyStream:'landform-morphology-v3'}:COMPOSED_TERRAIN_SETTINGS,
      family:emphasis,composition,heightOffset:-min,relief:max-min,terrainAttempt:attempt,
      gradingMaxDisplacement:0}};
  validateTerrain({...map,elevation});
  return elevation;
}
