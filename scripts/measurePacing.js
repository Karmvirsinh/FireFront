import { pathToFileURL } from 'node:url';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { isConnected } from '../src/world/isConnected.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { FIRE_CONFIG } from '../src/simulation/fireConfig.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';

// Exercise the real shared clock. Times are simulation seconds, not a benchmark.
export function measureScenario(simulation, map, ignition, maxSeconds = 120) {
  const routeMaps = map.routes.map((_, routeIndex) => {
    const copy = structuredClone(map);
    const section = map.routes[1 - routeIndex].section;
    for (let z = section.z0; z <= section.z1; z += 1) {
      for (let x = section.x0; x <= section.x1; x += 1) copy.cells[z * map.width + x].walkable = false;
    }
    return copy;
  });
  const lower = map.routes[1].section;
  const usesB = (agent) => [agent.target, ...agent.path].some((index) => index !== null
    && index % map.width >= lower.x0 && index % map.width <= lower.x1
    && Math.floor(index / map.width) >= lower.z0 && Math.floor(index / map.width) <= lower.z1);
  simulation.reset();
  if (!simulation.select(ignition[1] * map.width + ignition[0]) || !simulation.start()) {
    throw new Error('Scenario requires an eligible ignition.');
  }
  const population = simulation.agents.agents.length;
  const events = { ignition, routes: [], firstSpread: null, firstBurnout: null,
    agent0PlansB: null, agent0TurnsWest: null, firstTrapped: null, allTrapped: null,
    firstRecovery: null, allRecovered: null, evacuationComplete: null, allFuelCool: null,
    initialAllPlanB: simulation.agents.agents.every(usesB), allAgentsCrossedB: null };
  const crossedB = new Set();
  let available = [null, null];
  let previousUnsafe = null;
  let previousAgents = simulation.agents.agents.map(({ x, state }) => ({ x, state }));
  for (let step = 0; step <= Math.round(maxSeconds / FIRE_CONFIG.stepSeconds); step += 1) {
    if (step) simulation.advance(FIRE_CONFIG.stepSeconds);
    const time = Number(simulation.time.toFixed(2));
    const counts = simulation.agents.counts();
    if (Object.values(counts).reduce((sum, n) => sum + n, 0) !== population) {
      throw new Error(`Population not conserved at ${time}`);
    }
    const agents = simulation.agents.agents;
    agents.forEach((agent) => {
      if (agent.x >= lower.x1 + 1 && agent.z >= lower.z0 && agent.z < lower.z1 + 1) crossedB.add(agent.id);
    });
    if (crossedB.size === population) events.allAgentsCrossedB ??= time;
    if (!previousUnsafe || simulation.hazards.some((v, i) => v !== previousUnsafe[i])) {
      routeMaps.forEach((routeMap, i) => {
        const open = isConnected(routeMap, map.start, map.safeZone, simulation.hazards);
        if (open !== available[i]) events.routes.push({ route: map.routes[i].id, open, time });
        available[i] = open;
      });
      previousUnsafe = simulation.hazards.slice();
    }
    if (simulation.cells.filter((cell) => cell.state !== 'unburned').length > 1) events.firstSpread ??= time;
    if (simulation.cells.some((cell) => cell.state === 'burned-hot')) events.firstBurnout ??= time;
    if (usesB(agents[0])) events.agent0PlansB ??= time;
    if (usesB(agents[0]) && agents[0].x < previousAgents[0].x - 1e-9) events.agent0TurnsWest ??= time;
    if (counts.trapped > 0) events.firstTrapped ??= time;
    if (counts.trapped === population) events.allTrapped ??= time;
    if (agents.some((agent, i) => previousAgents[i].state === 'trapped' && agent.state === 'evacuating')) {
      events.firstRecovery ??= time;
    }
    if (events.firstTrapped !== null && counts.trapped === 0) events.allRecovered ??= time;
    if (counts.evacuated === population) events.evacuationComplete ??= time;
    if (simulation.cells.every((cell, i) => map.cells[i].fuelType === 'none' || cell.state === 'burned-cool')) {
      events.allFuelCool ??= time;
    }
    previousAgents = agents.map(({ x, state }) => ({ x, state }));
    if (events.evacuationComplete !== null && events.allFuelCool !== null) break;
  }
  return { ...events, finalCounts: simulation.agents.counts() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const map = createFixedMap();
  const simulation = createEvacuationSimulation(map);
  console.log(JSON.stringify({ fire: FIRE_CONFIG, agents: AGENT_CONFIG,
    scenarios: [[32, 32], [32, 25]].map((point) => measureScenario(simulation, map, point)) }, null, 2));
}
