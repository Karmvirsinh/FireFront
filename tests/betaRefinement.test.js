import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Scene,Vector3,ACESFilmicToneMapping} from 'three';
import {createGeneratedMapV10 as createGeneratedMap,createGeneratedMapV9} from '../src/world/generation/createGeneratedMap.js';
import {seedStream} from '../src/world/generation/seed.js';
import {validateGeneratedMap} from '../src/world/generation/validateGeneratedMap.js';
import {createGroundTreatment} from '../src/rendering/groundTreatment.js';
import {applyLandscapePresentation,applyComparisonCamera} from '../src/rendering/landscapePresentation.js';
import {generateInitialEnvironment} from '../src/app/startup.js';

test('initial bounded-generation failure recovers visibly without relaxing the generator',()=>{
 const calls=[],fallback={generation:{seed:0}};
 const result=generateInitialEnvironment(2127148330,seed=>{calls.push(seed);if(seed!==0)throw Error('bounded failure');return fallback;});
 assert.deepEqual(calls,[2127148330,0]);assert.equal(result.map,fallback);assert.match(result.notice,/could not generate; loaded seed 0/);
 assert.deepEqual(generateInitialEnvironment(7,seed=>({seed})),{map:{seed:7},notice:''});
 assert.throws(()=>generateInitialEnvironment(0,()=>{throw Error('broken fallback');}),/broken fallback/);
});

test('substrate neighborhoods soften isolated clearing/bedrock edges without mutating classifications',()=>{
 const map={width:11,height:11,cells:Array.from({length:121},()=>({terrain:'vegetation',fuelType:'forest',walkable:false}))};
 map.cells[5*11+5]={terrain:'clearing',fuelType:'none',walkable:true};
 map.cells[2*11+2]={terrain:'obstacle',fuelType:'none',walkable:false};
 const before=structuredClone(map),a=createGroundTreatment(map);
 assert.deepEqual(a,createGroundTreatment(map));assert.deepEqual(map,before);
 assert.ok(a[(5*11+5)*4]>a[(5*11+6)*4]);assert.ok(a[(5*11+6)*4]>0);assert.equal(a[10*4],0);
 assert.ok(a[(2*11+2)*4+1]>a[(2*11+3)*4+1]);assert.ok(a[(2*11+3)*4+1]>0);
});

test('matched presentation uses identical color/light and pixel scale, not just similar screenshots',()=>{
 for(const height of [459,548]){
  const scene=new Scene(),renderer={};applyLandscapePresentation(renderer,scene);
  assert.equal(renderer.toneMapping,ACESFilmicToneMapping);assert.equal(renderer.toneMappingExposure,1.25);
  assert.equal(scene.children[0].intensity,2);assert.equal(scene.children[1].intensity,3.2);
  const camera=new PerspectiveCamera(),controls={target:new Vector3(),update(){},saveState(){this.saved=true;}};
  applyComparisonCamera(camera,controls,height);
  const distance=camera.position.distanceTo(controls.target);
  assert.ok(Math.abs(2*distance*Math.tan(camera.fov*Math.PI/360)/height-.12)<1e-12);
  assert.equal(camera.near,.1);assert.equal(camera.far,500);assert.deepEqual(controls.target.toArray(),[0,4,0]);assert.ok(controls.saved);
 }
});

test('v10 morphology varies shape controls and retains safe networks across sequential/scattered sample',t=>{
 const random=seedStream(9973,'silhouette-review-v1');
 const seeds=[...Array(8).keys(),34,2026,...Array.from({length:8},()=>Math.floor(random()*4294967296))];
 const signatures=new Set();let branches=0,changed=0;
 for(const seed of seeds){
  const map=createGeneratedMap(seed);validateGeneratedMap(map);
  assert.equal(map.generation.version,'forest-composition-v10');assert.equal(map.elevation.generation.version,'simulator-composition-v2');
  const p=map.elevation.generation.composition;
  signatures.add(JSON.stringify(p.raised.map(f=>[f.type,f.shoulder,f.profile,f.skew,f.points?.length,f.branches?.length])));
  branches+=p.raised.reduce((n,f)=>n+(f.branches?.length??0),0);
  if([0,7,34,2026].includes(seed)){
   assert.deepEqual(createGeneratedMap(seed),map);
   const old=createGeneratedMapV9(seed);assert.equal(old.generation.version,'forest-composition-v9');
   assert.equal(old.elevation.generation.version,'simulator-composition-v1');
   if(JSON.stringify(old.elevation.cornerHeights)!==JSON.stringify(map.elevation.cornerHeights))changed++;
  }
  t.diagnostic(JSON.stringify({seed,attempt:map.generation.attempt,family:map.elevation.generation.family,relief:map.elevation.generation.relief}));
 }
 assert.equal(changed,4);assert.ok(signatures.size>8);assert.ok(branches>0);
 let calls=0;assert.throws(()=>createGeneratedMap(0,()=>{calls++;throw new Error('controlled failure');}),/Current map retained/);assert.equal(calls,96);
});
