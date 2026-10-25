import { isNavigable } from '../world/navigationPolicy.js';
import { observeHazards, rememberHazard, isObservedNow } from './observeHazards.js';
import { AGENT_CONFIG } from './agentConfig.js';
import { findPath, findBufferExit } from './findPath.js';

export function createAgentSimulation(map, config = AGENT_CONFIG) {
  let awareness = config.awareness ?? 'global';
  const detectionRadius = config.detectionRadius ?? 4;
  const retryDelay=config.retryDelaySeconds??5, retryInterval=config.retryIntervalSeconds??5;
  const memoryAge=config.hazardMemoryAgeSeconds??10;
  if(!Number.isFinite(retryDelay)||retryDelay<0||!Number.isFinite(retryInterval)||retryInterval<=0
    ||!Number.isFinite(memoryAge)||memoryAge<0) throw new Error('Invalid Local retry timing.');
  let elapsed=0;
  const validModel = value => ['global','local'].includes(value);
  if(!validModel(awareness)||!Number.isFinite(detectionRadius)||detectionRadius<0) {
    throw new Error('Invalid awareness model or detection radius.');
  }
  const goal = map.safeZone.z * map.width + map.safeZone.x;
  const spawns = config.spawnCells ?? map.spawnCells ?? Array.from({ length: config.population }, (_, i) =>
    (map.start.z - 2 + Math.floor(i / 5)) * map.width + map.start.x - 2 + i % 5);
  if (spawns.length !== config.population || spawns.some((index) => !isNavigable(map, index))) {
    throw new Error('Agent spawns must match the population and be walkable.');
  }
  const simulation = { agents: [], started: false, plans: 0, retries: 0 };
  let lastUnsafe = null;
  let lastDirect = null;
  function reset() {
    simulation.agents = spawns.map((cell, id) => ({ id, cell, x: cell % map.width + 0.5,
      z: Math.floor(cell / map.width) + 0.5, state: 'waiting', path: [], target: null,
      needsPlan: true, centering: false, escaping: false,
      observed: new Uint8Array(map.cells.length), observedUnsafe: new Uint8Array(map.cells.length),
      observedDirect: new Uint8Array(map.cells.length),
      lastObservedAt: new Float64Array(map.cells.length).fill(-Infinity),
      planningUnsafe: new Uint8Array(map.cells.length), planningDirect: new Uint8Array(map.cells.length),
      uncertain: new Set(), trappedSince: null, lastRetryAt: -Infinity, retryCount: 0 }));
    simulation.started = false;
    simulation.plans = simulation.retries = 0;
    elapsed=0;
    lastUnsafe = lastDirect = null;
  }
  reset();
  function counts() {
    const result = { waiting: 0, evacuating: 0, trapped: 0, evacuated: 0, lost: 0 };
    simulation.agents.forEach((agent) => { result[agent.state] += 1; });
    return result;
  }
  function atCenter(agent) {
    return Math.abs(agent.x - (agent.cell % map.width + 0.5)) < 1e-9
      && Math.abs(agent.z - (Math.floor(agent.cell / map.width) + 0.5)) < 1e-9;
  }
  function plan(agent, unsafe, direct) {
    simulation.plans += 1;
    agent.escaping = Boolean(unsafe[agent.cell]);
    const path = agent.escaping ? findBufferExit(map, agent.cell, unsafe, direct)
      : findPath(map, agent.cell, goal, unsafe);
    agent.path = path?.slice(1) ?? [];
    agent.target = null;
    agent.centering = false;
    agent.needsPlan = false;
    agent.state = path ? 'evacuating' : 'trapped';
  }
  function syncPlanningKnowledge(agent) {
    agent.planningUnsafe.set(agent.observedUnsafe);
    agent.planningDirect.set(agent.observedDirect);
    // Uncertain is persistent planning state, not a claim of observed clearance.
    for(const i of agent.uncertain) { agent.planningUnsafe[i]=0;agent.planningDirect[i]=0; }
  }
  function cautiousRetry(agent) {
    if(agent.state!=='trapped'||agent.trappedSince===null
      ||elapsed-agent.trappedSince+1e-9<retryDelay||elapsed-agent.lastRetryAt+1e-9<retryInterval) return;
    agent.lastRetryAt=elapsed;
    let changed=false;
    for(let i=0;i<map.cells.length;i++) {
      if(!isNavigable(map,i)||!agent.observedUnsafe[i]||agent.uncertain.has(i)
        ||elapsed-agent.lastObservedAt[i]+1e-9<memoryAge||isObservedNow(agent,map,i,detectionRadius)) continue;
      agent.uncertain.add(i);agent.planningUnsafe[i]=agent.planningDirect[i]=0;changed=true;
    }
    // If no belief changed, another identical A* search cannot help.
    if(changed) { agent.needsPlan=true;agent.retryCount++;simulation.retries++; }
  }
  function advance(seconds, unsafe, fireCells) {
    if (!simulation.started) return;
    elapsed+=Math.max(0,seconds);
    const direct = Uint8Array.from(fireCells, (cell) =>
      Number(cell.state === 'burning' || cell.state === 'burned-hot'));
    const changed = lastUnsafe === null || unsafe.some((value, i) => value !== lastUnsafe[i]
      || direct[i] !== lastDirect[i]);
    lastUnsafe = unsafe.slice();
    lastDirect = direct;
    for (const agent of simulation.agents) {
      if (agent.state === 'evacuated' || agent.state === 'lost') continue;
      // Fire/hazards have already updated. Occupancy follows the actual position,
      // not the last visited center: check before any centering or escape movement.
      if (fireCells[agent.cell].state === 'burning') {
        agent.state = 'lost';
        agent.path = [];
        agent.target = null;
        agent.needsPlan = agent.centering = agent.escaping = false;
        continue;
      }
      if(awareness==='local') syncPlanningKnowledge(agent);
      const observedChanged = awareness === 'local'
        ? observeHazards(agent,map,detectionRadius,unsafe,direct,elapsed) : changed;
      const knownUnsafe = awareness === 'local' ? agent.planningUnsafe : unsafe;
      const knownDirect = awareness === 'local' ? agent.planningDirect : direct;
      if(awareness==='local') cautiousRetry(agent);
      if (observedChanged && (agent.state === 'trapped' || agent.escaping || knownUnsafe[agent.cell]
        || (agent.target !== null && knownUnsafe[agent.target]) || agent.path.some((cell) => knownUnsafe[cell]))) {
        agent.needsPlan = true;
      }
      let budget = Math.max(0, seconds) * config.speedCellsPerSecond;
      // Decisions still run with zero elapsed time (immediately after Start fire).
      for (;;) {
        if (direct[agent.cell]) {
          // Hot ground blocks movement but does not cause direct-fire loss.
          agent.state = 'trapped';
          agent.path = [];
          agent.needsPlan = true;
          break;
        }
        if (agent.needsPlan) {
          if (!atCenter(agent)) {
            // Stay inside the occupied cell while returning to its center.
            // Never snap to an endpoint or continue blindly into an unsafe next cell.
            agent.target = agent.cell;
            agent.path = [];
            agent.centering = true;
            agent.state = 'evacuating';
          } else plan(agent, knownUnsafe, knownDirect);
        }
        if (agent.state === 'trapped') break;
        if (agent.cell === goal && atCenter(agent) && !unsafe[goal]) {
          agent.state = 'evacuated';
          agent.path = [];
          agent.target = null;
          break;
        }
        if (agent.target === null) {
          agent.target = agent.path.shift() ?? null;
          if (agent.target === null) { agent.needsPlan = true; continue; }
        }
        if (direct[agent.target] || (unsafe[agent.target] && !agent.escaping && !agent.centering)) {
          // Authoritative entry guard, independent of planning knowledge. An
          // unexpected blocked next step is a contact observation, never a tunnel.
          if(awareness==='local') rememberHazard(agent,agent.target,unsafe,direct,elapsed);
          agent.needsPlan = true;
          continue;
        }
        if (budget < 1e-9) break;
        const tx = agent.target % map.width + 0.5;
        const tz = Math.floor(agent.target / map.width) + 0.5;
        const distance = Math.hypot(tx - agent.x, tz - agent.z);
        const amount = Math.min(budget, distance);
        if (distance > 1e-9) {
          agent.x += (tx - agent.x) / distance * amount;
          agent.z += (tz - agent.z) / distance * amount;
        }
        budget -= amount;
        agent.cell = Math.floor(agent.z) * map.width + Math.floor(agent.x);
        if(awareness==='local') {
          // A long test interval may traverse several centers in one call.
          // Observe the updated continuous position before the next decision.
          if(observeHazards(agent,map,detectionRadius,unsafe,direct,elapsed)
            && (agent.escaping || knownUnsafe[agent.cell] || (agent.target!==null&&knownUnsafe[agent.target])
              || agent.path.some(i=>knownUnsafe[i]))) agent.needsPlan=true;
        }
        if (amount + 1e-9 < distance) break;
        agent.x = tx;
        agent.z = tz;
        agent.cell = agent.target;
        agent.target = null;
        if (agent.centering || (agent.escaping && !unsafe[agent.cell])) {
          agent.needsPlan = true;
          agent.centering = false;
        }
      }
      if(awareness==='local') {
        if(agent.state==='trapped') { if(agent.trappedSince===null) agent.trappedSince=elapsed; }
        else agent.trappedSince=null;
      }
    }
  }
  Object.defineProperties(simulation, {
    time: { get: () => elapsed },
    awareness: { get: () => awareness }, detectionRadius: { get: () => detectionRadius },
  });
  return Object.assign(simulation, { reset, counts, advance,
    setAwareness(value) {
      if(simulation.started||!validModel(value)) return false;
      awareness=value;reset();return true;
    },
    start() { simulation.started = true; } });
}
