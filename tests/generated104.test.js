import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV6 as createGeneratedMap,createGeneratedMapV5} from '../src/world/generation/createGeneratedMap.js';
import {findPath} from '../src/agents/findPath.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';
const seeds=[...Array.from({length:256},(_,i)=>i),2026,65535,2147483648,4294967295];
test('v6 covers 104x104 with sparse narrow connected networks and repeatable independent terrain',()=>{
 for(const seed of seeds){
  const m=createGeneratedMap(seed);assert.equal(m.width,104);assert.equal(m.height,104);assert.equal(m.cellSize,.5);
  assert.equal(m.spawnCells.length,20);assert.equal(m.generation.version,'forest-network-v6');
  assert.ok(m.pathNetwork.nodes.length>=14&&m.pathNetwork.nodes.length<=18);
  assert.equal(new Set(m.pathNetwork.nodes.map(p=>`${p.x<52}:${p.z<52}`)).size,4);
  const goal=m.safeZone.z*m.width+m.safeZone.x;
  for(const spawn of m.spawnCells) assert.ok(findPath(m,spawn,goal,new Uint8Array(m.cells.length)));
  assert.ok(m.pathNetwork.trailCells.length<=650);
  if([0,7,34,2026].includes(seed)) assert.deepEqual(createGeneratedMap(seed),m);
 }
 assert.equal(createGeneratedMapV5(7).width,64);
});
test('v6 Global/Local runs conserve counts, complete a remote ignition and reset deterministically',()=>{
 for(const awareness of ['global','local']){
  const map=createGeneratedMap(7), original=structuredClone(map);
  const goal=map.safeZone.z*104+map.safeZone.x;
  const paths=map.spawnCells.flatMap(i=>findPath(map,i,goal,new Uint8Array(map.cells.length)));
  const ignition=map.cells.map((c,i)=>({c,i,d:Math.min(...paths.map(p=>Math.abs(i%104-p%104)+Math.abs(Math.floor(i/104)-Math.floor(p/104))))}))
   .filter(p=>p.c.fuelType!=='none').sort((a,b)=>b.d-a.d)[0].i;
  const sim=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});sim.select(ignition);sim.start();
  for(let i=0;i<6000&&sim.agents.counts().evacuated<20;i++){sim.advance(.05);assert.equal(Object.values(sim.agents.counts()).reduce((a,b)=>a+b),20);}
  assert.equal(sim.agents.counts().evacuated,20);sim.reset();assert.equal(sim.agents.counts().waiting,20);assert.deepEqual(map,original);
 }
});
import {PerspectiveCamera,Vector3} from 'three';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';
import {sampleTerrainHeight} from '../src/world/terrain.js';
test('104-cell elevated picking preserves width indexing after camera changes and canvas offsets',()=>{
 const map=createGeneratedMap(7), camera=new PerspectiveCamera(45,1.6,.1,1600);
 const canvas={getBoundingClientRect:()=>({left:91,top:157,width:800,height:500})};
 const pick=createGroundPicker(camera,canvas,map);
 for(const eye of [[0,60,40],[-40,30,0],[25,40,-35]]){
  camera.position.set(...eye);camera.lookAt(0,1,0);camera.updateMatrixWorld();
  for(const [x,z] of [[50,41],[70,60],[20,20]]){
   const p=new Vector3((x+.5-52)*.5,sampleTerrainHeight(map,x+.5,z+.5),(z+.5-52)*.5).project(camera);
   assert.equal(pick(91+(p.x+1)*400,157+(1-p.y)*250),z*104+x);
  }
 }
 pick.dispose();
});
