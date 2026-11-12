import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV9 as createGeneratedMap,createGeneratedMapV8} from '../src/world/generation/createGeneratedMap.js';
import {buildTerrainCandidateV9 as buildTerrainCandidate} from '../src/world/generation/buildTerrainCandidate.js';
import {createComposedTerrainV1 as createComposedTerrain} from '../src/world/generation/createComposedTerrain.js';
import {createLandformPlan as sharedPlan} from '../src/world/generation/landformComposition.js';
import {createLandformPlan as studyPlan} from '../src/prototype/landformConstruction.js';
import {validateGeneratedMap} from '../src/world/generation/validateGeneratedMap.js';
import {validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {createForestVegetation} from '../src/world/generation/createForestVegetation.js';
import {V9_SETTINGS as GENERATOR_SETTINGS,seedStream} from '../src/world/generation/seed.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';
import {createVegetationLayout} from '../src/rendering/createVegetationLayout.js';

test('simulator genuinely shares study operators, while historical v8 remains explicit',()=>{
 assert.equal(sharedPlan,studyPlan);
 const old=createGeneratedMapV8(7);assert.equal(old.generation.version,'forest-environment-v8');
 assert.equal(old.elevation.generation.version,'terrain-routed-v4');
 const map=createGeneratedMap(7);assert.equal(map.generation.version,'forest-composition-v9');
 assert.notDeepEqual(map.elevation.cornerHeights,old.elevation.cornerHeights);
 // Cached network retries must not change the selected surface or candidate.
 assert.deepEqual(validateGeneratedMap(buildTerrainCandidate(7,map.generation.attempt)),map);
});

test('full-map compositions are deterministic, ungraded, fuel-independent and slope/connectivity validated',t=>{
 const families=new Set(),operators=new Set();let loops=0;
 for(const seed of [...Array(24).keys(),34,2026,4294967295]){
  const map=createGeneratedMap(seed),g=map.elevation.generation;
  validateGeneratedMap(map);validateTrailTerrain(map);
  families.add(g.family);for(const p of g.composition.raised)operators.add(p.type);
  if(g.composition.basins.length)operators.add('basin');if(g.composition.cuts.length)operators.add('cut');
  loops+=map.pathNetwork.connections.filter(c=>c.kind==='loop').length;
  assert.equal(map.width,104);assert.equal(map.height,104);assert.equal(map.spawnCells.length,20);
  assert.equal(g.gradingMaxDisplacement,0);assert.ok(g.relief>=.5&&g.relief<=12);
  assert.ok(map.elevation.cornerHeights.every(Number.isFinite));
  const fuel=createForestVegetation(GENERATOR_SETTINGS,seedStream(seed,'forest-regions-v2'),seedStream(seed,'rocks'));
  for(let i=0;i<map.cells.length;i++)if(!map.navigation.allowedCells[i])assert.deepEqual(map.cells[i],fuel[i]);
  if([0,7,34,2026].includes(seed)){
   assert.deepEqual(createGeneratedMap(seed),map);
   assert.deepEqual(createComposedTerrain(map,seed,g.terrainAttempt).cornerHeights,map.elevation.cornerHeights);
   const before=structuredClone(map),layout=createVegetationLayout(map);
   assert.deepEqual(layout,createVegetationLayout(map));assert.deepEqual(map,before);
   t.diagnostic(JSON.stringify({seed,attempt:map.generation.attempt,family:g.family,relief:g.relief,
    trees:layout.trees.length,forestCells:map.cells.filter(c=>c.fuelType==='forest').length,
    clearingCells:map.cells.filter(c=>c.terrain==='clearing').length}));
  }
 }
 assert.equal(families.size,3);for(const kind of ['hill','ridge','tableland','terrace','basin','cut'])assert.ok(operators.has(kind),kind);
 assert.ok(loops>0,'optional safe alternatives survive final thinning');
});

test('new generated scenarios conserve counts, reset/replay exactly and do not change simulation rules',t=>{
 for(const seed of [0,7,34,2026])for(const awareness of ['global','local']){
  const map=createGeneratedMap(seed),sim=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});
  const ignition=map.cells.findIndex((c,i)=>c.fuelType!=='none'&&Math.hypot(i%map.width-map.start.x,Math.floor(i/map.width)-map.start.z)<8);
  assert.ok(ignition>=0);
  const run=()=>{
   assert.equal(sim.select(ignition),true);assert.equal(sim.start(),true);
   for(let n=0;n<3600&&sim.agents.counts().evacuated+sim.agents.counts().lost<20;n++){
    sim.advance(.05);assert.equal(Object.values(sim.agents.counts()).reduce((a,b)=>a+b),20);
   }
   return {time:sim.time,counts:sim.agents.counts()};
  };
  const first=run();sim.reset();assert.equal(sim.agents.counts().waiting,20);assert.deepEqual(run(),first);
  t.diagnostic(JSON.stringify({seed,awareness,ignition:[ignition%map.width,Math.floor(ignition/map.width)],...first}));
 }
});
