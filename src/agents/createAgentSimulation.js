import { AGENT_CONFIG } from './agentConfig.js';
import { findPath, findBufferExit } from './findPath.js';

export function createAgentSimulation(map, config = AGENT_CONFIG) {
  const goal = map.safeZone.z * map.width + map.safeZone.x;
  const spawns = config.spawnCells ?? Array.from({ length: config.population }, (_, i) =>
    (map.start.z - 2 + Math.floor(i / 5)) * map.width + map.start.x - 2 + i % 5);
  if (spawns.length !== config.population || spawns.some((index) => !map.cells[index]?.walkable)) {
    throw new Error('Agent spawns must match the population and be walkable.');
  }
  const simulation = { agents: [], started: false, plans: 0 };
  let lastUnsafe = null;
  let lastDirect = null;
  function reset() {
    simulation.agents = spawns.map((cell, id) => ({ id, cell, x: cell % map.width + 0.5,
      z: Math.floor(cell / map.width) + 0.5, state: 'waiting', path: [], target: null,
      needsPlan: true, centering: false, escaping: false }));
    simulation.started = false;
    simulation.plans = 0;
    lastUnsafe = lastDirect = null;
  }
  reset();
  function counts() {
    const result = { waiting: 0, evacuating: 0, trapped: 0, evacuated: 0 };
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
  function advance(seconds, unsafe, fireCells) {
    if (!simulation.started) return;
    const direct = Uint8Array.from(fireCells, (cell) =>
      Number(cell.state === 'burning' || cell.state === 'burned-hot'));
    const changed = lastUnsafe === null || unsafe.some((value, i) => value !== lastUnsafe[i]
      || direct[i] !== lastDirect[i]);
    lastUnsafe = unsafe.slice();
    lastDirect = direct;
    for (const agent of simulation.agents) {
      if (agent.state === 'evacuated') continue;
      if (changed && (agent.state === 'trapped' || agent.escaping || unsafe[agent.cell]
        || (agent.target !== null && unsafe[agent.target]) || agent.path.some((cell) => unsafe[cell]))) {
        agent.needsPlan = true;
      }
      let budget = Math.max(0, seconds) * config.speedCellsPerSecond;
      // Decisions still run with zero elapsed time (immediately after Start fire).
      for (;;) {
        if (direct[agent.cell]) {
          // No loss rule yet: stop in place and retry on hazard changes.
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
          } else plan(agent, unsafe, direct);
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
    }
  }
  return Object.assign(simulation, { reset, counts, advance,
    start() { simulation.started = true; } });
}
