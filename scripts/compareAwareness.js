// Opt-in deterministic functional traces, not rendered FPS or wall-clock benchmarks.
// Run: node scripts/compareAwareness.js
import assert from 'node:assert/strict';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';
import { findPath } from '../src/agents/findPath.js';

const duration=300, stepSeconds=0.05;
for(const [seed,x,z] of [[7,40,34],[0,44,10],[2026,38,37]]) {
  const map=createGeneratedMap(seed);
  for(const awareness of ['global','local']) {
    const simulation=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness});
    simulation.select(z*map.width+x);simulation.start();
    let firstRetry=null;
    let firstMovement=null, firstTrapping=simulation.agents.counts().trapped?0:null;
    let previous=simulation.agents.agents.map(a=>({x:a.x,z:a.z}));
    let oldTrapped=simulation.agents.counts().trapped;
    const trappingChanges=[];
    for(let step=0;step<duration/stepSeconds;step++) {
      if(simulation.agents.counts().evacuated+simulation.agents.counts().lost===map.spawnCells.length) break;
      simulation.advance(stepSeconds);
      const counts=simulation.agents.counts(),time=+simulation.time.toFixed(2);
      assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),map.spawnCells.length);
      if(firstMovement===null&&simulation.agents.agents.some((a,i)=>a.x!==previous[i].x||a.z!==previous[i].z)) firstMovement=time;
      if(firstTrapping===null&&counts.trapped) firstTrapping=time;
      if(firstRetry===null&&simulation.agents.retries>0) firstRetry=time;
      if(counts.trapped!==oldTrapped) trappingChanges.push({time,trapped:counts.trapped,
        escaping:simulation.agents.agents.filter(a=>a.escaping&&a.state==='evacuating').length});
      oldTrapped=counts.trapped;previous=simulation.agents.agents.map(a=>({x:a.x,z:a.z}));
    }
    const goal=map.safeZone.z*map.width+map.safeZone.x;
    const waitingOnMemory=awareness==='local'?simulation.agents.agents.filter(a=>a.state==='trapped'
      &&findPath(map,a.cell,goal,simulation.hazards)&&!findPath(map,a.cell,goal,a.planningUnsafe)).length:0;
    console.log(JSON.stringify({seed,version:map.generation.version,ignition:[x,z],awareness,
      detectionRadius:simulation.agents.detectionRadius,boundSeconds:duration,firstMovement,firstTrapping,firstRetry,
      elapsedSimulationSeconds:+simulation.time.toFixed(2),counts:simulation.agents.counts(),
      plans:simulation.agents.plans,retryActivations:simulation.agents.retries,waitingOnMemory,trappingChanges}));
  }
}
