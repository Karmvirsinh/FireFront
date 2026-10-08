import assert from 'node:assert/strict';
import test from 'node:test';
import { measureScenario } from '../scripts/measurePacing.js';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';

const complete = { waiting: 0, evacuating: 0, trapped: 0, evacuated: 20, lost: 0 };

test('central ignition preserves observable reroute, six-second trapping, recovery and deterministic completion', () => {
  const map = createFixedMap();
  const original = structuredClone(map);
  const simulation = createEvacuationSimulation(map);
  const measured = measureScenario(simulation, map, [32, 32]);
  assert.equal(measured.firstSpread, 2);
  assert.equal(measured.agent0PlansB, 14);
  assert.equal(measured.agent0TurnsWest, 14);
  assert.deepEqual(measured.routes, [
    { route: 'A', open: true, time: 0 }, { route: 'B', open: true, time: 0 },
    { route: 'A', open: false, time: 14 }, { route: 'B', open: false, time: 20 },
    { route: 'A', open: true, time: 26.15 }, { route: 'B', open: true, time: 32.1 },
  ]);
  assert.equal(measured.allTrapped, 20.2);
  assert.equal(measured.firstRecovery, 26.15);
  assert.ok(measured.firstRecovery - measured.allTrapped >= 5.9, 'visible all-agent trapping interval');
  assert.equal(measured.allRecovered, 26.15);
  assert.equal(measured.allFuelCool, 52.7);
  assert.equal(measured.evacuationComplete, 60.8);
  assert.deepEqual(measured.finalCounts, complete);
  const final = { cells: structuredClone(simulation.cells), agents: structuredClone(simulation.agents.agents) };
  assert.deepEqual(measureScenario(simulation, map, [32, 32]), measured);
  assert.deepEqual({ cells: simulation.cells, agents: simulation.agents.agents }, final);
  assert.deepEqual(map, original);
});

test('near-A ignition takes available B and crosses it before its later closure, without trapping or loss', () => {
  const map = createFixedMap();
  const simulation = createEvacuationSimulation(map);
  const measured = measureScenario(simulation, map, [32, 25]);
  assert.equal(measured.initialAllPlanB, true);
  assert.equal(measured.firstSpread, 2);
  assert.deepEqual(measured.routes, [
    { route: 'A', open: false, time: 0 }, { route: 'B', open: true, time: 0 },
    { route: 'A', open: true, time: 16 }, { route: 'B', open: false, time: 34 },
    { route: 'B', open: true, time: 46.1 },
  ]);
  assert.notEqual(measured.allAgentsCrossedB, null);
  assert.ok(measured.allAgentsCrossedB < 34, 'all agents must cross B before its hazard closure');
  assert.equal(measured.firstTrapped, null);
  assert.equal(measured.firstRecovery, null);
  assert.equal(measured.evacuationComplete, 47.35);
  assert.equal(measured.allFuelCool, 66.2);
  assert.deepEqual(measured.finalCounts, complete);
  assert.deepEqual(measureScenario(simulation, map, [32, 25]), measured);
});
