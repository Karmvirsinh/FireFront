import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV6 as createGeneratedMap,buildV6Candidate as buildCandidate} from '../src/world/generation/createGeneratedMap.js';
import {validateGeneratedMap} from '../src/world/generation/validateGeneratedMap.js';
import {terrainCellGradients} from '../src/world/terrain.js';
import {createTerrain,constrainTerrain,validateTerrainSlopes,TERRAIN_SETTINGS} from '../src/world/generation/createTerrain.js';

test('landforms-v2 repeats without changing any v6 horizontal field, preserving every permitted face',()=>{
 for(const seed of [...Array.from({length:32},(_,i)=>i),34,2026]){
  const map=createGeneratedMap(seed),{elevation,...horizontal}=map;
  assert.deepEqual(horizontal,validateGeneratedMap(buildCandidate(seed,map.generation.attempt)));
  assert.deepEqual(createTerrain(horizontal,seed),elevation);
  assert.equal(elevation.generation.version,'landforms-v2');
  assert.ok(elevation.cornerHeights.every(Number.isFinite));validateTerrainSlopes(map);
  assert.ok(Math.max(...elevation.cornerHeights)<=7);
  if([0,7,34,2026].includes(seed)){
   let steep=0,flat=0;
   for(let i=0;i<map.cells.length;i++){
    const g=Math.max(...terrainCellGradients(map,i));
    if(g<Math.tan(5*Math.PI/180))flat++;
    if(!map.navigation.allowedCells[i]&&g>Math.tan(20*Math.PI/180))steep++;
   }
   assert.ok(flat>map.cells.length*.1,'broad flat stretches remain');assert.ok(steep>0,'non-trail hills may exceed twenty degrees');
   assert.ok(Math.max(...elevation.cornerHeights)>3,'not silently flattened');
  }
 }
});

test('local constraints preserve remote plateau, protect all permitted cells and reject invalid final slopes',()=>{
 const map={width:20,height:20,cellSize:.5,cells:Array.from({length:400},()=>({walkable:true})),
  navigation:{mode:'path-first',allowedCells:Array.from({length:400},(_,i)=>i%20===2)}};
 const raw=Array.from({length:441},(_,i)=>i%21<10?0:2);
 const result=constrainTerrain(map,raw);
 const elevated={...map,elevation:{units:'world',triangulation:'nw-se',cornerHeights:result.heights}};
 validateTerrainSlopes(elevated);
 assert.equal(result.heights[20],2,'unaffected distant plateau stays at authored elevation');
 assert.equal(result.heights[0],0);
 const bad=structuredClone(elevated);bad.elevation.cornerHeights[2]=10;
 assert.throws(()=>validateTerrainSlopes(bad),/slope/);
 assert.equal(result.passes,TERRAIN_SETTINGS.shoulderPasses);
});
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';
test('height-only refinement retains v6 seed-7 fire and Global/Local evacuation timings',()=>{
 for(const [awareness,expected] of [['global',173.5],['local',117.35]]){
  const map=createGeneratedMap(7),sim=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});
  sim.select(41*104+50);sim.start();
  for(let step=0;step<6000&&sim.agents.counts().evacuated<20;step++){
   sim.advance(.05);assert.equal(Object.values(sim.agents.counts()).reduce((a,b)=>a+b),20);
  }
  assert.equal(sim.agents.counts().evacuated,20);assert.equal(sim.agents.counts().lost,0);
  assert.ok(Math.abs(sim.time-expected)<1e-7);
 }
});
