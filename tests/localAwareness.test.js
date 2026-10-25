import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentSimulation } from '../src/agents/createAgentSimulation.js';
import { observeHazards } from '../src/agents/observeHazards.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { inspectRecovery } from '../scripts/inspectAwarenessRecovery.js';
import { findPath } from '../src/agents/findPath.js';

function corridor({awareness='local',radius=4,spawns=[16]}={}) {
  const map={width:15,height:3,start:{x:1,z:1},safeZone:{x:13,z:1},spawnCells:spawns,
    cells:Array.from({length:45},(_,i)=>({walkable:Math.floor(i/15)===1,fuelType:'none',terrain:'route'}))};
  const agents=createAgentSimulation(map,{...AGENT_CONFIG,population:spawns.length,awareness,detectionRadius:radius});
  const unsafe=new Uint8Array(45),fire=map.cells.map(()=>({state:'unburned'}));
  return {map,agents,unsafe,fire,agent:agents.agents[0]};
}
function step(f,n=1) {for(let i=0;i<n;i++)f.agents.advance(.05,f.unsafe,f.fire);}
function block(f,i){f.unsafe[i]=1;f.fire[i].state='burned-hot';}

test('distant complete-route blockage holds Global while Local advances, detects locally and waits without repeated identical plans',()=>{
  const g=corridor({awareness:'global'}),l=corridor();
  for(const f of [g,l]){block(f,25);f.agents.start();f.agents.advance(0,f.unsafe,f.fire);}
  assert.equal(g.agent.state,'trapped');assert.equal(l.agent.state,'evacuating');
  assert.equal(l.agent.observed[25],0);step(l);assert.ok(l.agent.x>1.5);
  for(let i=0;i<150;i++){step(l);assert.equal(l.unsafe[l.agent.cell],0);}
  assert.equal(l.agent.state,'trapped');assert.equal(l.agent.observedUnsafe[25],1);
  const plans=l.agents.plans;step(l,50);assert.equal(l.agents.plans,plans);
  // An off-trail changed observation is not a reason to rebuild the same path.
  l.unsafe[10]=1;l.fire[10].state='burned-hot';step(l);assert.equal(l.agents.plans,plans);
  l.unsafe[25]=0;l.fire[25].state='burned-cool';step(l);
  assert.equal(l.agent.observedUnsafe[25],0);assert.equal(l.agent.state,'evacuating');
  step(l,250);assert.equal(l.agent.state,'evacuated');
});

test('radius uses Euclidean cell-center distance from continuous position rather than occupied-cell index',()=>{
  const f=corridor(),a=f.agent;
  a.x=4.1;a.z=1.5;a.cell=19;f.unsafe[23]=1;
  observeHazards(a,f.map,4,f.unsafe,new Uint8Array(45));assert.equal(a.observed[23],0);
  a.x=4.9;observeHazards(a,f.map,4,f.unsafe,new Uint8Array(45));assert.equal(a.observedUnsafe[23],1);
  const m={width:12,height:12,cells:Array.from({length:144},()=>({walkable:true}))};
  const b={x:4.5,z:4.5,cell:52,observed:new Uint8Array(144),observedUnsafe:new Uint8Array(144),observedDirect:new Uint8Array(144)};
  const unsafe=new Uint8Array(144);unsafe[4*12+8]=unsafe[7*12+7]=1;
  observeHazards(b,m,4,unsafe,new Uint8Array(144));
  assert.equal(b.observedUnsafe[4*12+8],1,'exact radius included');
  assert.equal(b.observed[7*12+7],0,'diagonal beyond Euclidean radius excluded');
});

test('agents have independent conservative memory; distant cooling is unknown until re-observation',()=>{
  const f=corridor({spawns:[16,24]});block(f,25);f.agents.start();f.agents.advance(0,f.unsafe,f.fire);
  const [a,b]=f.agents.agents;assert.notEqual(a.observedUnsafe,b.observedUnsafe);
  assert.equal(a.observedUnsafe[25],0);assert.equal(b.observedUnsafe[25],1);
  // Move only the sensing fixture to exercise memory at different observation positions.
  b.x=1.5;b.z=1.5;b.cell=16;f.unsafe[25]=0;f.fire[25].state='burned-cool';
  observeHazards(b,f.map,4,f.unsafe,new Uint8Array(45));assert.equal(b.observedUnsafe[25],1);
  b.x=9.5;b.cell=24;observeHazards(b,f.map,4,f.unsafe,new Uint8Array(45));assert.equal(b.observedUnsafe[25],0);
  assert.equal(a.observed[25],0,'no shared cooling knowledge');
});

test('unexpected actual blocked next step reverses a partial segment before its boundary, even with contact-only sensing',()=>{
  const f=corridor({radius:0});f.agents.start();f.agents.advance(0,f.unsafe,f.fire);step(f,4);
  const before=f.agent.x;assert.ok(before>1.5&&before<2);assert.equal(f.agent.observed[17],0);
  block(f,17);step(f);assert.ok(f.agent.x<before);assert.equal(f.agent.observedUnsafe[17],1);
  for(let i=0;i<100;i++){step(f);assert.notEqual(f.agent.cell,17);assert.ok(f.agent.x<2);}
  assert.equal(f.agent.state,'trapped');
});

test('Local emergency buffer escape can cross existing buffers, but never hot/fire cells or off-policy ground',()=>{
  const f=corridor({radius:1,spawns:[19]});
  for(let x=2;x<=6;x++)f.unsafe[15+x]=1;
  f.agents.start();f.agents.advance(0,f.unsafe,f.fire);assert.equal(f.agent.escaping,true);
  let crossedBuffer=false;
  for(let i=0;i<250&&f.agent.state!=='evacuated';i++){
    step(f);assert.equal(f.fire[f.agent.cell].state,'unburned');
    assert.equal(f.map.cells[f.agent.cell].walkable,true);
    if(f.agent.cell!==19&&f.unsafe[f.agent.cell]){crossedBuffer=true;assert.equal(f.agent.escaping,true);}
  }
  assert.equal(crossedBuffer,true);assert.equal(f.agent.state,'evacuated');assert.equal(f.agents.counts().lost,0);
  const hot=corridor({radius:1,spawns:[19]});for(let x=2;x<=6;x++)hot.unsafe[15+x]=1;block(hot,20);
  hot.agents.start();for(let i=0;i<150;i++){step(hot);assert.notEqual(hot.agent.cell,20);}
  assert.equal(hot.agents.counts().lost,0);
  const policy=corridor({radius:1,spawns:[19]});policy.map.navigation={mode:'path-first',allowedCells:policy.map.cells.map(c=>c.walkable)};
  policy.map.navigation.allowedCells[18]=policy.map.navigation.allowedCells[20]=false;policy.unsafe[19]=1;
  policy.agents.start();step(policy);assert.equal(policy.agent.state,'trapped');assert.equal(policy.agent.cell,19);
});

test('Local direct-fire loss precedes movement; terminal states and counts survive cooling; reset clears all knowledge and navigation',()=>{
  const f=corridor({spawns:[16,28]});f.agents.start();f.agents.advance(0,f.unsafe,f.fire);
  assert.equal(f.agents.agents[1].state,'evacuated');const x=f.agent.x;
  f.fire[16].state='burning';f.unsafe[16]=1;step(f);assert.equal(f.agent.state,'lost');assert.equal(f.agent.x,x);
  f.fire[28].state='burning';f.unsafe[28]=1;step(f);assert.equal(f.agents.agents[1].state,'evacuated');
  f.fire[16].state='burned-cool';f.unsafe.fill(0);step(f,20);
  assert.deepEqual(f.agents.counts(),{waiting:0,evacuating:0,trapped:0,evacuated:1,lost:1});
  assert.equal(f.agents.setAwareness('global'),false);f.agents.reset();
  assert.equal(f.agents.awareness,'local');assert.equal(f.agents.counts().waiting,2);
  for(const a of f.agents.agents){assert.equal(a.path.length,0);assert.equal(a.target,null);assert.ok(a.observed.every(v=>v===0));assert.ok(a.observedUnsafe.every(v=>v===0));assert.ok(a.observedDirect.every(v=>v===0));}
});

test('Local reset/replay is identical across ordinary rendering intervals and does not mutate the generator map',()=>{
  const m=createGeneratedMap(7),original=structuredClone(m),s=createEvacuationSimulation(m,{...AGENT_CONFIG,awareness:'local'});
  function run(fps){s.select(34*64+40);s.start();for(let i=0;i<fps*40;i++){s.advance(1/fps);assert.equal(Object.values(s.agents.counts()).reduce((a,b)=>a+b,0),20);}assert.ok(s.agents.retries>0);return structuredClone({agents:s.agents.agents,cells:s.cells,time:s.time,retries:s.agents.retries});}
  const first=run(30);s.reset();assert.ok(s.agents.agents.every(a=>a.observed.every(v=>!v)));assert.equal(s.agents.awareness,'local');
  assert.deepEqual(run(60),first);assert.deepEqual(m,original);
});

test('bounded same-map comparisons preserve Global completion and measure cautious Local recovery',()=>{
  for(const [seed,x,z,globalEnd] of [[7,40,34,88.9],[0,44,10,190.25],[2026,38,37,255.45]]) {
    const m=createGeneratedMap(seed);
    for(const awareness of ['global','local']) {
      const s=createEvacuationSimulation(m,{...AGENT_CONFIG,awareness});s.select(z*64+x);s.start();
      let first=null,last=s.agents.agents.map(a=>[a.x,a.z]);
      for(let step=0;step<6000&&s.agents.counts().evacuated<20;step++) {
        s.advance(.05);assert.equal(Object.values(s.agents.counts()).reduce((a,b)=>a+b,0),20);
        if(first===null&&s.agents.agents.some((a,i)=>a.x!==last[i][0]||a.z!==last[i][1]))first=s.time;
        last=s.agents.agents.map(a=>[a.x,a.z]);
      }
      assert.equal(s.agents.counts().lost,0);
      if(awareness==='global'){assert.equal(s.agents.counts().evacuated,20);assert.ok(Math.abs(s.time-globalEnd)<1e-7);}
      else {
        assert.ok(Math.abs(first-.05)<1e-8);
        const expected={7:63.65,0:114.65,2026:142.75}[seed];
        assert.equal(s.agents.counts().evacuated,20);assert.ok(Math.abs(s.time-expected)<1e-7);
      }
    }
  }
});


test('trapped agents clear safe observations at the four-cell floating-point boundary and replan independently',()=>{
  const f=corridor({spawns:[21,20]});f.agents.start();
  const [near,far]=f.agents.agents;
  // A tiny center-rounding error must not exclude the exactly-four-cell target.
  near.x=6.5-3e-14;
  for(const a of [near,far]) {
    a.observed[25]=a.observedUnsafe[25]=a.observedDirect[25]=1;
    a.state='trapped';a.needsPlan=false;a.path=[];a.target=null;
  }
  f.agents.advance(0,f.unsafe,f.fire);
  assert.equal(near.observedUnsafe[25],0);assert.equal(near.observedDirect[25],0);
  assert.equal(near.state,'evacuating');assert.equal(f.agents.plans,1);
  assert.equal(far.observedUnsafe[25],1);assert.equal(far.state,'trapped','five-cell distance retains memory');
  assert.equal(near.centering,false);assert.equal(near.escaping,false);
  for(let i=0;i<10;i++)step(f);
  assert.equal(far.state,'trapped');assert.equal(f.agents.plans,1,'no unchanged-knowledge retry loop');
});


test('formerly stalled cases retain complete in-radius observation refresh and recover with cautious retries',()=>{
  for(const [seed,x,z] of [[0,44,10],[2026,38,37]]) {
    const report=inspectRecovery(seed,x,z);
    assert.deepEqual(report.audit.failures,[],'every active/trapped in-radius cell matches current hazards');
    assert.ok(report.audit.checks>0);assert.ok(report.audit.trappedSafeRefreshes>0);
    assert.equal(report.counts.evacuated,20);assert.equal(report.counts.lost,0);assert.equal(report.agents.length,0);
  }
});
