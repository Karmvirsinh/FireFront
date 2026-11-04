import { GENERATOR_SETTINGS, GENERATOR_VERSION, seedStream } from './seed.js';
import { createTerrainStructure } from './createTerrainStructure.js';
import { createTerrainRouting } from './trailTerrain.js';
import { placeEndpoints } from './placeEndpoints.js';
import { createPathNetwork } from './createPathNetwork.js';
import { createForestVegetation } from './createForestVegetation.js';

export function buildTerrainCandidate(seed,attempt) {
  const settings=GENERATOR_SETTINGS;
  // Terrain is selected before endpoints or network carving. No navigable mask
  // exists yet, so the terrain fitter applies only its natural-slope bound.
  const base={width:settings.width,height:settings.height,cellSize:settings.cellSize,
    cells:Array.from({length:settings.width*settings.height},()=>({walkable:false})),
    navigation:{mode:'path-first',allowedCells:Array(settings.width*settings.height).fill(false)}};
  // Four bounded terrain candidates, each with eight network attempts. Independent
  // terrain streams never consume vegetation/rock/path randomness.
  const terrainSeedAttempt=Math.floor(attempt/8);
  base.elevation=createTerrainStructure(base,seed,terrainSeedAttempt*12);
  base.elevation.generation={...base.elevation.generation,version:'terrain-routed-v4',terrainFirst:true,
    routingAttempt:terrainSeedAttempt,gradingMaxDisplacement:0};
  const routing=createTerrainRouting(base);
  const proposed=placeEndpoints(settings,seedStream(seed,'endpoints'));
  const fit=(point,spawn)=>{
    const candidates=[];
    for(let z=4;z<settings.height-4;z++)for(let x=4;x<settings.width-4;x++){
      const cells=spawn?Array.from({length:20},(_,i)=>(z-2+Math.floor(i/5))*settings.width+x-2+i%5):[z*settings.width+x];
      if(cells.every(i=>routing.allowed[i]))candidates.push({x,z});
    }
    candidates.sort((a,b)=>Math.hypot(a.x-point.x,a.z-point.z)-Math.hypot(b.x-point.x,b.z-point.z)||a.z-b.z||a.x-b.x);
    if(!candidates.length)throw new Error('No slope-safe endpoint footprint');
    return candidates[0];
  };
  const start=fit(proposed.start,true),safeZone=fit(proposed.safeZone,false);
  const endpoints={start,safeZone,zones:{start:{x0:start.x-2,x1:start.x+2,z0:start.z-2,z1:start.z+1},safe:{x0:safeZone.x,x1:safeZone.x,z0:safeZone.z,z1:safeZone.z}},
    spawnCells:Array.from({length:20},(_,i)=>(start.z-2+Math.floor(i/5))*settings.width+start.x-2+i%5)};
  const network=createPathNetwork(endpoints,settings,seedStream(seed,'terrain-paths-v8',attempt),routing);
  const cells=createForestVegetation(settings,seedStream(seed,'forest-regions-v2'),seedStream(seed,'rocks'));
  for(const i of network.cells)cells[i]={terrain:'route',fuelType:'none',walkable:true};
  for(const [name,zone] of Object.entries(endpoints.zones))for(let z=zone.z0;z<=zone.z1;z++)for(let x=zone.x0;x<=zone.x1;x++)
    cells[z*settings.width+x]={terrain:name==='start'?'start':'safe',fuelType:'none',walkable:true};
  return {...base,...endpoints,cells,name:`Seed ${seed}`,
    generation:{seed,version:GENERATOR_VERSION,settings:{...settings},attempt},
    pathNetwork:{widthCells:1,nodes:network.nodes,centerlines:network.centerlines,connections:network.connections,trailCells:[...network.cells].sort((a,b)=>a-b)},
    navigation:{mode:'path-first',allowedCells:cells.map(c=>['route','start','safe'].includes(c.terrain))},
    rendering:{canopyVersion:settings.canopyVersion,canopySeed:seed,compactEndpoints:true,terrainColors:{route:0x806247,clearing:0xc4b38b},labels:[
      {text:'START',x:start.x,z:start.z+2.5,width:2.7},{text:'SAFE',x:safeZone.x,z:safeZone.z+1.5,width:2.7}]}};
}
