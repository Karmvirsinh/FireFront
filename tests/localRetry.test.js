import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentSimulation } from '../src/agents/createAgentSimulation.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';

function fixture({radius=4,speed=1.5}={}) {
  const map={width:20,height:3,start:{x:1,z:1},safeZone:{x:18,z:1},spawnCells:[21],
    cells:Array.from({length:60},(_,i)=>({walkable:Math.floor(i/20)===1,fuelType:'none',terrain:'route'}))};
  const agents=createAgentSimulation(map,{...AGENT_CONFIG,population:1,awareness:'local',detectionRadius:radius,speedCellsPerSecond:speed});
  const unsafe=new Uint8Array(60),fire=map.cells.map(()=>({state:'unburned'}));agents.start();
  return {map,agents,unsafe,fire,a:agents.agents[0]};
}
function remember(f,index,at=0) {
  f.a.observed[index]=f.a.observedUnsafe[index]=1;f.a.lastObservedAt[index]=at;
}
function tick(f,n=1) {for(let i=0;i<n;i++)f.agents.advance(.05,f.unsafe,f.fire);}

test('five-second trapped delay and ten-second sighting age enable uncertainty without remotely clearing memory',()=>{
  const f=fixture();remember(f,30,0);f.agents.advance(0,f.unsafe,f.fire);
  assert.equal(f.a.state,'trapped');assert.equal(f.a.trappedSince,0);
  tick(f,100);assert.equal(f.a.retryCount,0);assert.equal(f.agents.plans,1,'no eligible old belief, no identical search');
  tick(f,99);assert.equal(f.a.state,'trapped');assert.equal(f.a.uncertain.size,0);
  tick(f);assert.equal(f.a.state,'evacuating');assert.equal(f.a.retryCount,1);
  assert.equal(f.a.observedUnsafe[30],1,'record remains blocked, not falsely observed safe');
  assert.equal(f.a.uncertain.has(30),true);assert.equal(f.a.planningUnsafe[30],0);
  const plans=f.agents.plans;tick(f,10);assert.equal(f.agents.plans,plans,'moving retry route is not invalidated by the same stale record');
  tick(f,250);assert.equal(f.a.state,'evacuated');assert.equal(f.a.observedUnsafe[30],0,'actual re-observation later clears the record');
});

test('continuous danger observations refresh timestamps; currently sensed danger never becomes uncertain',()=>{
  const f=fixture();f.unsafe[24]=1;f.fire[24].state='burned-hot';
  f.agents.advance(0,f.unsafe,f.fire);assert.equal(f.a.state,'trapped');tick(f,500);
  assert.ok(Math.abs(f.a.lastObservedAt[24]-25)<1e-8);assert.equal(f.a.uncertain.has(24),false);
  assert.equal(f.a.planningUnsafe[24],1);assert.equal(f.agents.plans,1);assert.equal(f.a.retryCount,0);
  // Leaving sensing range does not make a freshly seen hazard ten seconds old.
  f.a.x=.1;f.a.cell=20;f.agents.advance(0,f.unsafe,f.fire);
  tick(f,199);assert.equal(f.a.uncertain.has(24),false,'fresh sighting has not reached ten-second age');
  assert.ok(Math.abs(f.a.lastObservedAt[24]-25)<1e-8);
});

test('retry activation is rate-limited and does not repeat an unchanged failing A* every frame',()=>{
  const f=fixture();f.unsafe[24]=1;f.fire[24].state='burned-hot';
  remember(f,30,-20);f.agents.advance(0,f.unsafe,f.fire);tick(f,100);
  assert.equal(f.a.retryCount,1);assert.equal(f.a.state,'trapped','currently sensed gate still blocks');
  const plans=f.agents.plans;
  remember(f,31,-20);tick(f,99);assert.equal(f.a.retryCount,1);assert.equal(f.agents.plans,plans);
  tick(f);assert.equal(f.a.retryCount,2);assert.equal(f.agents.plans,plans+1);
  tick(f,200);assert.equal(f.a.retryCount,2);assert.equal(f.agents.plans,plans+1,'uncertainty already applied, no repeated identical searches');
});

test('approaching persistent danger revokes uncertainty before entry; direct-fire loss still precedes movement',()=>{
  const f=fixture();remember(f,30,-20);f.unsafe[30]=1;f.fire[30].state='burned-hot';
  f.agents.advance(0,f.unsafe,f.fire);tick(f,100);assert.equal(f.a.uncertain.has(30),true);
  for(let i=0;i<250;i++){tick(f);assert.notEqual(f.a.cell,30);assert.ok(f.a.x<10);}
  assert.equal(f.a.state,'trapped');assert.equal(f.a.uncertain.has(30),false);assert.equal(f.a.planningUnsafe[30],1);
  assert.ok(Math.abs(f.a.lastObservedAt[30]-f.agents.time)<1e-8);
  const x=f.a.x;f.fire[f.a.cell].state='burning';f.unsafe[f.a.cell]=1;tick(f);
  assert.equal(f.a.state,'lost');assert.equal(f.a.x,x);
});

test('contact entry guard overrides uncertain knowledge even with a radius too small to see the next center',()=>{
  const f=fixture({radius:0});remember(f,30,-20);f.unsafe[30]=1;f.fire[30].state='burned-hot';
  f.agents.advance(0,f.unsafe,f.fire);tick(f,100);assert.equal(f.a.uncertain.has(30),true);
  for(let i=0;i<200;i++){tick(f);assert.notEqual(f.a.cell,30);assert.ok(f.a.x<10);}
  assert.equal(f.a.state,'trapped');assert.equal(f.a.planningUnsafe[30],1);
});

test('reset clears observations, uncertainty, timestamps, retry timing and simulation time for deterministic replay',()=>{
  const f=fixture();remember(f,30,-20);f.agents.advance(0,f.unsafe,f.fire);tick(f,100);
  assert.equal(f.a.retryCount,1);assert.ok(f.a.uncertain.size);
  f.agents.reset();const a=f.agents.agents[0];assert.equal(f.agents.time,0);assert.equal(f.agents.retries,0);
  assert.equal(a.trappedSince,null);assert.equal(a.lastRetryAt,-Infinity);assert.equal(a.retryCount,0);
  assert.equal(a.uncertain.size,0);assert.ok(a.lastObservedAt.every(t=>t===-Infinity));
  assert.ok(a.observed.every(v=>!v));assert.ok(a.observedUnsafe.every(v=>!v));assert.ok(a.planningUnsafe.every(v=>!v));assert.ok(a.planningDirect.every(v=>!v));
  assert.equal(a.target,null);assert.equal(a.path.length,0);assert.equal(f.agents.awareness,'local');
});
