import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV14 as createGeneratedMap,createGeneratedMapV13,createGeneratedMapV12} from '../src/world/generation/createGeneratedMap.js';
import {settlementCounts,validateSettlementMap} from '../src/world/generation/createSettlementMap.js';
import {V14_SETTINGS as GENERATOR_SETTINGS,V14_VERSION as GENERATOR_VERSION} from '../src/world/generation/seed.js';
import {getSafeCells} from '../src/world/mapContract.js';
import {neighbors} from '../src/agents/findPath.js';
import {validateTrailTerrain} from '../src/world/generation/trailTerrain.js';

test('all count draws produce only 2/2,3/2,3/3; consume identical random draws for historical replay',()=>{
 const results=new Set();
 for(const a of [.25,.75])for(const b of [.25,.75]){
  let calls=0;const count=settlementCounts(()=>[a,b][calls++]);assert.equal(calls,2);
  results.add(`${count.origins}/${count.safe}`);assert.ok(count.origins>=count.safe);
  let oldCalls=0;const old=settlementCounts(()=>[a,b][oldCalls++],{legacy:true});assert.equal(oldCalls,2);
  assert.equal(count.origins,old.origins);assert.equal(count.safe,Math.min(old.origins,old.safe));
 }
 assert.deepEqual([...results].sort(),['2/2','3/2','3/3']);
});

test('v14 deterministic count correction keeps twenty reachable agents, terrain and historical v13 layouts',()=>{
 for(const seed of [0,2,7,34,2026]){
  const map=createGeneratedMap(seed),old=createGeneratedMapV13(seed);
  assert.equal(map.generation.version,'forest-settlements-v14');assert.equal(old.generation.version,'forest-settlements-v13');
  assert.ok(map.origins.length>=map.safeZones.length);assert.ok([2,3].includes(map.origins.length));assert.ok([2,3].includes(map.safeZones.length));
  assert.equal(map.spawnCells.length,20);assert.equal(new Set(map.spawnCells).size,20);assert.equal(map.origins.flatMap(o=>o.spawnCells).length,20);
  assert.deepEqual(createGeneratedMap(seed),map);assert.deepEqual(map.elevation,old.elevation);validateTrailTerrain(map);
  const seen=new Set(getSafeCells(map)),queue=[...seen];
  for(let h=0;h<queue.length;h++)for(const j of neighbors(map,queue[h]))if(!seen.has(j)){seen.add(j);queue.push(j);}
  assert.ok(map.spawnCells.every(i=>seen.has(i)));assert.ok(map.origins.every(o=>seen.has(o.z*104+o.x)));
  if(old.origins.length>=old.safeZones.length){
   const adjusted=structuredClone(old);adjusted.generation.version=GENERATOR_VERSION;adjusted.generation.settings={...GENERATOR_SETTINGS};
   assert.deepEqual(map,adjusted,'already-allowed layouts remain exact except version/settings');
  }
  if(seed===2){
   assert.equal(old.origins.length,2);assert.equal(old.safeZones.length,3);assert.equal(map.origins.length,2);assert.equal(map.safeZones.length,2);
   const invalid=structuredClone(old);invalid.generation.version=GENERATOR_VERSION;invalid.generation.settings={...GENERATOR_SETTINGS};
   assert.throws(()=>validateSettlementMap(invalid),/origins must be at least/);
   const base=createGeneratedMapV12(seed);assert.deepEqual(map.pathNetwork.centerlines,base.pathNetwork.centerlines);
  }
 }
});
