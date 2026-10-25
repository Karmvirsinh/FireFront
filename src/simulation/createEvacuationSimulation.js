import { createFireSimulation } from './createFireSimulation.js';
import { getNavigationHazards } from './getNavigationHazards.js';
import { FIRE_CONFIG } from './fireConfig.js';
import { createAgentSimulation } from '../agents/createAgentSimulation.js';
import { AGENT_CONFIG } from '../agents/agentConfig.js';

// One clock for fire and movement: fire -> hazards -> agents on every fixed step.
export function createEvacuationSimulation(map, agentConfig = { ...AGENT_CONFIG, population: map.spawnCells?.length ?? AGENT_CONFIG.population }) {
  const fire = createFireSimulation(map);
  const agents = createAgentSimulation(map, agentConfig);
  let accumulator = 0;
  let time = 0;
  let hazards = getNavigationHazards(fire);
  return {
    fire, agents,
    get width() { return fire.width; },
    get cells() { return fire.cells; },
    get selected() { return fire.selected; },
    get started() { return fire.started; },
    get time() { return time; },
    get hazards() { return hazards; },
    setAwareness(model) { return !fire.started && agents.setAwareness(model); },
    select: fire.select,
    eligible: fire.eligible,
    start() {
      if (!fire.start()) return false;
      agents.start();
      accumulator = 0;
      hazards = getNavigationHazards(fire);
      agents.advance(0, hazards, fire.cells);
      return true;
    },
    reset() {
      fire.reset();
      agents.reset();
      accumulator = time = 0;
      hazards = getNavigationHazards(fire);
    },
    advance(seconds) {
      if (!fire.started || !Number.isFinite(seconds) || seconds <= 0) return;
      accumulator += Math.min(seconds, FIRE_CONFIG.maxFrameSeconds);
      while (accumulator + 1e-9 >= FIRE_CONFIG.stepSeconds) {
        fire.advance(FIRE_CONFIG.stepSeconds);
        hazards = getNavigationHazards(fire);
        agents.advance(FIRE_CONFIG.stepSeconds, hazards, fire.cells);
        time += FIRE_CONFIG.stepSeconds;
        accumulator = Math.max(0, accumulator - FIRE_CONFIG.stepSeconds);
      }
    },
  };
}
