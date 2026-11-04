import {placeEndpoints} from '../src/world/generation/placeEndpoints.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMap,createGeneratedMapV7} from '../src/world/generation/createGeneratedMap.js';
import {validateGeneratedMap} from '../src/world/generation/validateGeneratedMap.js';
import {createTerrainStructure,inspectStructure} from '../src/world/generation/createTerrainStructure.js';
import {createForestVegetation} from '../src/world/generation/createForestVegetation.js';
import {GENERATOR_SETTINGS,seedStream} from '../src/world/generation/seed.js';
import {terrainTrailCell,terrainTrailEdge,createTerrainRouting,validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {neighbors} from '../src/agents/findPath.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';

function reachable(map,start,blocked=-1){const queue=[start],seen=new Set(queue);for(let h=0;h<queue.length;h++)for(const j of neighbors(map,queue[h]))if(j!==blocked&&!seen.has(j)){seen.add(j);queue.push(j);}return seen;}

test('terrain-first v8 sample preserves terrain features, narrow metadata, safe footprints and independent fuel streams',()=>{
 let loops=0,moved=false;const families=new Set();
 for(const seed of [...Array.from({length:64},(_,i)=>i),2026,4294967295]){
  const map=createGeneratedMap(seed);validateGeneratedMap(map);validateTrailTerrain(map);
  if(seed===0){const missing=structuredClone(map);delete missing.elevation;assert.throws(()=>validateGeneratedMap(missing),/missing terrain-first/);}
  assert.equal(map.generation.version,'forest-environment-v8');assert.equal(map.elevation.generation.version,'terrain-routed-v4');
  families.add(map.elevation.generation.family);
  moved ||= JSON.stringify(map.start)!==JSON.stringify(placeEndpoints(GENERATOR_SETTINGS,seedStream(seed,'endpoints')).start);
  const reached=reachable(map,map.safeZone.z*104+map.safeZone.x);
  for(const i of map.spawnCells)assert.ok(reached.has(i)&&terrainTrailCell(map,i));
  assert.ok(map.navigation.allowedCells.every((v,i)=>!v||reached.has(i)));
  const raw=createForestVegetation(GENERATOR_SETTINGS,seedStream(seed,'forest-regions-v2'),seedStream(seed,'rocks'));
  for(let i=0;i<map.cells.length;i++){
   if(map.navigation.allowedCells[i])assert.deepEqual(Object.keys(map.cells[i]).sort(),['fuelType','terrain','walkable']);
   else assert.deepEqual(map.cells[i],raw[i]);
  }
  for(const [n,c] of map.pathNetwork.connections.entries())if(c.kind==='loop'){
   loops++;
   const line=map.pathNetwork.centerlines[n],middle=line[Math.floor(line.length/2)];
   const from=c.from.z*104+c.from.x,to=c.to.z*104+c.to.x;
   assert.ok(reachable(map,from,middle.z*104+middle.x).has(to),'real alternate remains after thinning');
  }
  assert.deepEqual(inspectStructure(map,map.elevation.generation.landforms,-map.elevation.generation.heightOffset),map.elevation.generation.quality);
  if([0,7,34,2026].includes(seed)){
   assert.deepEqual(createGeneratedMap(seed),map);
   const base={...map,cells:map.cells.map(()=>({walkable:false})),navigation:{mode:'path-first',allowedCells:map.cells.map(()=>false)}};
   const original=createTerrainStructure(base,seed,map.elevation.generation.routingAttempt*12);
   assert.deepEqual(map.elevation.cornerHeights,original.cornerHeights,'routing never grades away terrain');
   assert.equal(createGeneratedMapV7(seed).generation.version,'forest-environment-v7');
  }
 }
 assert.equal(families.size,3);assert.ok(loops>0);assert.ok(moved);
});

test('construction and final validation share complete-face and four-edge slope rules',t=>{
 const map={width:5,height:3,cellSize:.5,cells:Array(15).fill({walkable:true}),navigation:{allowedCells:Array(15).fill(true)},
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array.from({length:24},(_,i)=>i%6===3&&Math.floor(i/6)===1?1:0)}};
 assert.equal(terrainTrailCell(map,2),false);assert.equal(terrainTrailEdge(map,1,2),false);assert.equal(terrainTrailEdge(map,0,6),false);
 assert.throws(()=>validateTrailTerrain(map),/slope|20 degrees/);
 const routing=createTerrainRouting(map),line=routing.route({x:0,z:0},{x:4,z:2},new Set());
 assert.ok(line);for(let n=1;n<line.length;n++)assert.ok(terrainTrailEdge(map,line[n-1].z*5+line[n-1].x,line[n].z*5+line[n].x));
});

test('current terrain-first scenarios conserve counts and replay without changing movement/fire rules',t=>{
 for(const seed of [0,7,34,2026])for(const awareness of ['global','local']){
  const map=createGeneratedMap(seed),sim=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});
  // Deterministic fuel cell beside the origin connector; not a guaranteed trap.
  const index=map.cells.findIndex((c,i)=>c.fuelType!=='none'&&Math.hypot(i%104-map.start.x,Math.floor(i/104)-map.start.z)<8);
  assert.ok(index>=0);sim.select(index);sim.start();
  const run=()=>{for(let n=0;n<2400&&sim.agents.counts().evacuated<20;n++){sim.advance(.05);assert.equal(Object.values(sim.agents.counts()).reduce((a,b)=>a+b),20);}return {time:sim.time,counts:sim.agents.counts()};};
  const first=run();t.diagnostic(JSON.stringify({seed,awareness,ignition:[index%104,Math.floor(index/104)],...first}));sim.reset();sim.select(index);sim.start();assert.deepEqual(run(),first);
 }
});


test('flat-ground corridor preference avoids a long rectangular dogleg without diagonal movement',()=>{
 const map={width:24,height:24,cellSize:.5},routing=createTerrainRouting(map);
 const a={x:2,z:2},b={x:20,z:17},line=routing.route(a,b,new Set());
 assert.ok(line);
 for(const p of line)assert.ok(Math.abs(-(p.x-a.x)*(b.z-a.z)+(p.z-a.z)*(b.x-a.x))/Math.hypot(b.x-a.x,b.z-a.z)<3);
 for(let n=1;n<line.length;n++)assert.ok(terrainTrailEdge(map,line[n-1].z*24+line[n-1].x,line[n].z*24+line[n].x));
 assert.equal(routing.route({x:-1,z:0},b,new Set()),null);
});
