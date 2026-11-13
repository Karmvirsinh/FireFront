import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath,neighbors} from '../src/agents/findPath.js';
import {createAgentSimulation} from '../src/agents/createAgentSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';
import {createGeneratedMapV13 as createGeneratedMap,createGeneratedMapV12} from '../src/world/generation/createGeneratedMap.js';
import {normalizeMap,getSafeCells} from '../src/world/mapContract.js';
import {validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {createPlannerControls} from '../src/ui/createPlannerControls.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {createBuildingView} from '../src/rendering/createBuildingView.js';
import {createOutcomeTracker} from '../src/simulation/createOutcomeTracker.js';
import {createWoodlandLayout} from '../src/rendering/woodlandComposition.js';

function graph(width=25,height=3){return {width,height,cellSize:.5,cells:Array.from({length:width*height},()=>({terrain:'route',fuelType:'none',walkable:true})),start:{x:0,z:1},safeZone:{x:8,z:1},safeZones:[{id:'a',x:8,z:1},{id:'b',x:24,z:1}],spawnCells:[width]};}
function bfs(map,start,goals,unsafe){const q=[[start,0]],seen=new Set([start]);for(let h=0;h<q.length;h++){const [i,d]=q[h];if(goals.includes(i)&&!unsafe[i])return d;for(const j of neighbors(map,i))if(!unsafe[j]&&!seen.has(j)){seen.add(j);q.push([j,d+1]);}}return null;}

test('A* and zero-heuristic Dijkstra match an independent BFS optimum with multiple goals/obstacles/hazards',()=>{
 const map=graph(),goals=getSafeCells(map);
 for(let n=0;n<16;n++){
  const unsafe=new Uint8Array(map.cells.length);
  for(let i=0;i<map.cells.length;i++)if(i!==25&&(i*17+n*13)%23<5)unsafe[i]=1;
  if(n%3===0)unsafe[goals[0]]=1;
  const optimum=bfs(map,25,goals,unsafe);
  for(const planner of ['astar','dijkstra']){
   const path=findPath(map,25,goals,unsafe,planner);assert.equal(path?path.length-1:null,optimum);
   if(path){assert.ok(goals.includes(path.at(-1)));for(let k=1;k<path.length;k++){assert.ok(neighbors(map,path[k-1]).includes(path[k]));assert.equal(unsafe[path[k]],0);}}
  }
 }
 const unsafe=new Uint8Array(map.cells.length);assert.deepEqual(findPath(map,25,33,unsafe),findPath(map,25,[33],unsafe,'astar'));
});

test('both planners reconsider blocked goals; Local initially plans without distant hidden hazard knowledge',()=>{
 for(const planner of ['astar','dijkstra']){
  const map=graph(),fire=map.cells.map(()=>({state:'unburned'})),unsafe=new Uint8Array(map.cells.length);unsafe[33]=1;
  const make=awareness=>createAgentSimulation(map,{...AGENT_CONFIG,population:1,planner,awareness});
  const global=make('global'),local=make('local');global.start();local.start();global.advance(0,unsafe,fire);local.advance(0,unsafe,fire);
  assert.equal(global.agents[0].destination,49);assert.equal(local.agents[0].destination,33);
  assert.equal(local.agents[0].observed[33],0,'no remote goal safety knowledge');
  let discovered=false;
  for(let n=0;n<500;n++){local.advance(.05,unsafe,fire);const a=local.agents[0];assert.notEqual(a.cell,33,'authoritative unsafe entry blocked');if(a.observedUnsafe[33]){discovered=true;assert.notEqual(a.destination,33);}if(a.state==='evacuated')break;}
  assert.ok(discovered);assert.equal(local.agents[0].state,'evacuated');assert.equal(local.agents[0].cell,49);
  local.reset();assert.equal(local.planner,planner);assert.equal(local.counts().waiting,1);assert.ok(local.agents[0].observed.every(v=>v===0));
  const changing=make('global');changing.start();const clear=new Uint8Array(map.cells.length);changing.advance(.05,clear,fire);assert.equal(changing.agents[0].destination,33);
  for(let n=0;n<20&&changing.agents[0].destination===33;n++)changing.advance(.05,unsafe,fire);
  assert.equal(changing.agents[0].destination,49);
 }
});

test('versioned settlements preserve base surface/bypasses, connect every spawn/entrance and block nonburnable footprints',()=>{
 for(const seed of [0,7,34,2026]){
  const map=createGeneratedMap(seed),base=createGeneratedMapV12(seed);assert.deepEqual(createGeneratedMap(seed),map);
  assert.equal(map.generation.version,'forest-settlements-v13');assert.equal(base.generation.version,'forest-woodland-v12');
  assert.deepEqual(map.elevation,base.elevation);assert.equal(map.spawnCells.length,20);assert.equal(new Set(map.spawnCells).size,20);
  assert.ok([2,3].includes(map.origins.length));assert.ok([2,3].includes(map.safeZones.length));
  assert.deepEqual(map.pathNetwork.centerlines,base.pathNetwork.centerlines);assert.deepEqual(map.pathNetwork.connections,base.pathNetwork.connections);
  base.navigation.allowedCells.forEach((v,i)=>{if(v)assert.ok(map.navigation.allowedCells[i]);});validateTrailTerrain(map);
  const unsafe=new Uint8Array(map.cells.length),goals=getSafeCells(map);
  for(const o of map.origins){assert.ok(o.spawnCells.length>=6);for(const i of o.spawnCells)assert.ok(findPath(map,i,goals,unsafe));}
  for(const b of map.buildings){assert.ok(findPath(map,b.entrance,goals,unsafe));for(const i of b.cells){assert.equal(map.cells[i].fuelType,'none');assert.equal(map.cells[i].walkable,false);assert.equal(map.navigation.allowedCells[i],false);}}
  const layout=createWoodlandLayout(map);
  for(const p of [...layout.trees,...layout.brush,...layout.grass])for(const b of map.buildings)for(const i of b.cells){
   const x=i%104,z=Math.floor(i/104);assert.ok(Math.hypot(Math.max(x-p.gx,0,p.gx-x-1),Math.max(z-p.gz,0,p.gz-z-1))*.5>=p.radius+.039999,'dressing stays outside building footprint');
  }
  const view=createBuildingView(map),before=structuredClone(map);let disposed=0;
  const resources=new Set();view.group.traverse(o=>{for(const r of [o.geometry,o.material])if(r&&!resources.has(r)){resources.add(r);r.addEventListener('dispose',()=>disposed++);}});
  assert.equal(view.group.children.length,map.buildings.length);view.dispose();assert.equal(disposed,resources.size);assert.deepEqual(map,before);
  const invalid=structuredClone(map);invalid.cells[map.buildings[0].entrance].walkable=false;assert.throws(()=>normalizeMap(invalid));
 }
});

test('any safe arrival finishes evacuation and outcome reachability includes secondary destinations',()=>{
 const map=graph(),unsafe=new Uint8Array(map.cells.length);unsafe[33]=1;
 const sim=createAgentSimulation(map,{...AGENT_CONFIG,population:1,planner:'dijkstra'}),fire=map.cells.map(()=>({state:'unburned'}));
 sim.start();sim.advance(0,unsafe,fire);assert.equal(sim.agents[0].destination,49);
 const tracker=createOutcomeTracker(map);assert.equal(tracker.update({started:true,agents:{counts:()=>({waiting:0,evacuating:0,trapped:1,evacuated:0,lost:0}),agents:sim.agents},cells:fire,hazards:unsafe,time:0}),null);
 for(let n=0;n<500&&sim.agents[0].state!=='evacuated';n++){sim.advance(.05,unsafe,fire);assert.equal(Object.values(sim.counts()).reduce((a,b)=>a+b),1);}
 assert.equal(sim.agents[0].cell,49);assert.equal(sim.counts().evacuated,1);
 sim.reset();assert.equal(sim.agents[0].cell,map.spawnCells[0]);assert.equal(sim.counts().waiting,1);
});

test('planner selector preserves setup fire/map, locks during run, resets and disposes its listener',()=>{
 const map=graph();map.cells[0]={terrain:'vegetation',fuelType:'grass',walkable:false};
 const simulation=createEvacuationSimulation(map,{...AGENT_CONFIG,population:1,awareness:'local'}),select=new EventTarget(),note={};
 const ui=createPlannerControls({querySelector:s=>s==='#planner-mode'?select:note},simulation,()=>{});
 try{
  simulation.select(0);select.value='dijkstra';select.dispatchEvent(new Event('change'));assert.equal(simulation.agents.planner,'dijkstra');assert.equal(simulation.selected,0);
  simulation.start();ui.refresh();assert.equal(select.disabled,true);select.value='astar';select.dispatchEvent(new Event('change'));assert.equal(simulation.agents.planner,'dijkstra');
  simulation.reset();ui.refresh();assert.equal(select.disabled,false);assert.equal(select.value,'dijkstra');assert.equal(simulation.agents.counts().waiting,1);
  ui.dispose();select.value='astar';select.dispatchEvent(new Event('change'));assert.equal(simulation.agents.planner,'dijkstra');
 }finally{ui.dispose();}
});
