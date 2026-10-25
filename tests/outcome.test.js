import test from 'node:test';
import assert from 'node:assert/strict';
import { createOutcomeTracker } from '../src/simulation/createOutcomeTracker.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { startupOptions, freshSeed } from '../src/app/startup.js';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';

function fixture() {
  const map = { width: 5, height: 1, start: {x:0,z:0}, safeZone:{x:4,z:0}, spawnCells:[0],
    cells: Array.from({length:5},()=>({walkable:true,fuelType:'none',terrain:'route'})) };
  let counts = {waiting:0,evacuating:0,trapped:1,evacuated:0,lost:0};
  const agent = {cell:0,state:'trapped'};
  const simulation = {started:true,time:40,agents:{counts:()=>counts,agents:[agent],awareness:'local'},
    cells:map.cells.map(()=>({state:'burned-cool'})),hazards:new Uint8Array(5)};
  return {map,simulation,agent,setCounts:value=>{counts=value;}};
}

test('terminal snapshot is immutable and recorded once even while remaining fire continues',()=>{
  const f=fixture(); f.simulation.cells[2].state='burning';
  f.agent.state='evacuated'; f.setCounts({waiting:0,evacuating:0,trapped:0,evacuated:1,lost:0});
  const tracker=createOutcomeTracker(f.map), snapshot=tracker.update(f.simulation);
  assert.equal(snapshot.kind,'terminal'); assert.equal(snapshot.time,40);
  f.simulation.time=80; f.simulation.cells[2].state='burned-cool';
  f.setCounts({waiting:0,evacuating:0,trapped:0,evacuated:0,lost:1});
  assert.equal(tracker.update(f.simulation),snapshot); assert.equal(snapshot.counts.evacuated,1);
  assert.throws(()=>{snapshot.counts.evacuated=99;}); tracker.reset(); assert.equal(tracker.outcome,null);
});

test('temporary trapping/hot ground never completes, and safe actual routes defeat stale Local memory',()=>{
  const f=fixture(),tracker=createOutcomeTracker(f.map);
  f.simulation.cells[2].state='burning'; assert.equal(tracker.update(f.simulation),null);
  f.simulation.cells[2].state='burned-hot'; assert.equal(tracker.update(f.simulation),null);
  f.simulation.cells[2].state='burned-cool';
  f.agent.observedUnsafe=new Uint8Array([0,0,1,0,0]);
  assert.equal(tracker.update(f.simulation),null); assert.equal(tracker.stalled,true);
  assert.equal(f.agent.observedUnsafe[2],1,'classification cannot clear agent memory');
  f.agent.state='evacuating'; tracker.update(f.simulation); assert.equal(tracker.stalled,false);
});

test('settled unreachable classification uses physical walkability AND Path-first policy, not timeout',()=>{
  const f=fixture(); f.map.navigation={mode:'path-first',allowedCells:[1,1,0,1,1]};
  const snapshot=createOutcomeTracker(f.map).update(f.simulation);
  assert.equal(snapshot.kind,'unreachable'); assert.equal(snapshot.remaining,1);
  delete f.map.navigation; f.map.cells[2].walkable=false;
  assert.equal(createOutcomeTracker(f.map).update(f.simulation).kind,'unreachable');
  f.simulation.started=false; assert.equal(createOutcomeTracker(f.map).update(f.simulation),null);
});

test('startup seed selection is fresh only for ordinary pages; explicit fixed/benchmark never calls random',()=>{
  let calls=0;const random=()=>++calls;
  assert.equal(startupOptions('',random).seed,1); assert.equal(startupOptions('',random).seed,2);
  assert.equal(startupOptions('?map=fixed',random).seed,null);
  assert.deepEqual(startupOptions('?benchmark=1&animation=normal',random),
    {benchmark:true,fixedFixture:true,seed:null,normalAnimation:true}); assert.equal(calls,2);
  assert.equal(freshSeed({getRandomValues:a=>{a[0]=4294967295;return a;}}),4294967295);
});

test('controlled disconnected simulation waits for cooling before unreachable result; reset clears it',()=>{
  const f=fixture();f.map.cells[2].walkable=false;f.map.cells[1].fuelType='grass';
  const sim=createEvacuationSimulation(f.map,{...AGENT_CONFIG,population:1,awareness:'local'});
  sim.select(1);sim.start();
  for(let i=0;i<399;i++)sim.advance(.05);
  assert.equal(sim.outcome,null,'hot ground still evolves, so trapping is temporary for classification');
  sim.advance(.05);assert.equal(sim.outcome.kind,'unreachable');
  assert.equal(sim.outcome.remaining,1);assert.equal(sim.outcome.counts.lost,0);
  assert.ok(Math.abs(sim.outcome.time-20)<1e-7);sim.reset();assert.equal(sim.outcome,null);
});

test('shared clock and remaining fire continue past terminal result without changing the snapshot',()=>{
  const map={width:12,height:2,start:{x:0,z:0},safeZone:{x:3,z:0},spawnCells:[0],
    cells:Array.from({length:24},(_,i)=>({walkable:i<12,terrain:i<12?'route':'vegetation',fuelType:i===23?'forest':'none'}))};
  const sim=createEvacuationSimulation(map,{...AGENT_CONFIG,population:1});sim.select(23);sim.start();
  for(let i=0;i<100&&!sim.outcome;i++)sim.advance(.05);
  const snapshot=sim.outcome;assert.equal(snapshot.counts.evacuated,1);assert.equal(sim.cells[23].state,'burning');
  for(let i=0;i<800;i++)sim.advance(.05);
  assert.equal(sim.cells[23].state,'burned-cool');assert.equal(sim.outcome,snapshot);
  assert.ok(sim.time>snapshot.time+39);assert.equal(snapshot.counts.evacuated,1);
});

test('real shared-clock result/reset/replay preserves deterministic generator and Global/Local completion',()=>{
  const map=createGeneratedMap(7);
  for(const awareness of ['global','local']) {
    const sim=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});
    function run() {
      assert.equal(sim.select(34*64+40),true); assert.equal(sim.start(),true);
      for(let i=0;i<6000&&!sim.outcome;i++)sim.advance(.05);
      assert.equal(sim.outcome.kind,'terminal');assert.equal(sim.outcome.counts.evacuated,20);
      return sim.outcome;
    }
    const first=run();assert.ok(Math.abs(first.time-(awareness==='local'?63.65:88.9))<1e-7);
    sim.advance(.2);assert.equal(sim.outcome,first);
    sim.reset();assert.equal(sim.outcome,null);assert.equal(sim.time,0);
    assert.equal(sim.agents.awareness,awareness);assert.equal(sim.agents.counts().waiting,20);
    assert.deepEqual(run(),first);
  }
});
