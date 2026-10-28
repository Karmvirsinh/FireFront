import assert from 'node:assert/strict';
import test from 'node:test';
import { createGeneratedMap, buildCandidate } from '../src/world/generation/createGeneratedMap.js';
import { validateGeneratedMap } from '../src/world/generation/validateGeneratedMap.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';
import { findPath } from '../src/agents/findPath.js';

// v4 selected attempt 1; v5 can accept attempt 0's protected compact junction.
// Retest the actual diagnosed network, not just the newly selected default.
const diagnosedMap = () => validateGeneratedMap(buildCandidate(34, 1));

test('diagnosed seed-34 attempt retains its upper bypass after thinning and Global takes it immediately', () => {
  const map = diagnosedMap(), original = structuredClone(map);
  const goal = map.safeZone.z * map.width + map.safeZone.x;
  const simulation = createEvacuationSimulation(map, { ...AGENT_CONFIG, awareness: 'global' });
  assert.equal(simulation.select(35 * 64 + 23), true);
  assert.equal(simulation.start(), true);
  assert.equal(simulation.hazards[34 * 64 + 23], 1, 'lower trail really is buffered');
  assert.equal(map.cells[36 * 64 + 44].terrain, 'route', 'upper junction survives');
  for (const agent of simulation.agents.agents) {
    const path = findPath(map, agent.cell, goal, simulation.hazards);
    assert.ok(path?.includes(10 * 64 + 45), 'safe route uses the northern loop');
    assert.ok(path.includes(36 * 64 + 44), 'right-hand junction is edge-connected');
    assert.equal(agent.state, 'evacuating');
    assert.deepEqual(agent.path, path.slice(2), 'first path cell is already the movement target');
  }
  simulation.advance(.05);
  assert.ok(simulation.agents.agents.every((a, i) =>
    a.x !== map.spawnCells[i] % 64 + .5 || a.z !== Math.floor(map.spawnCells[i] / 64) + .5));
  for (let step = 1; step < 2000 && simulation.agents.counts().evacuated < 20; step++) {
    simulation.advance(.05);
    assert.equal(simulation.agents.counts().trapped, 0);
    assert.equal(Object.values(simulation.agents.counts()).reduce((a, b) => a + b), 20);
  }
  assert.equal(simulation.agents.counts().evacuated, 20);
  assert.ok(Math.abs(simulation.time - 66) < 1e-7);
  assert.deepEqual(map, original);
});

test('diagnosed seed-34 Local initially knows no distant fire, then observes and follows the upper bypass; replay is deterministic', () => {
  const map = diagnosedMap();
  const simulation = createEvacuationSimulation(map, { ...AGENT_CONFIG, awareness: 'local' });
  function run() {
    simulation.select(35 * 64 + 23); simulation.start();
    for (const a of simulation.agents.agents) {
      assert.equal(a.observed[35 * 64 + 23], 0);
      assert.ok(!a.path.includes(10 * 64 + 45), 'initial optimistic route is the shorter lower trail');
    }
    let observedBlock = false, replannedUpper = false;
    for (let step = 0; step < 2000 && simulation.agents.counts().evacuated < 20; step++) {
      simulation.advance(.05);
      for (const a of simulation.agents.agents) {
        observedBlock ||= a.observedUnsafe.some(Boolean);
        replannedUpper ||= a.path.includes(10 * 64 + 45);
        assert.notEqual(simulation.cells[a.cell].state, 'burning');
        assert.notEqual(simulation.cells[a.cell].state, 'burned-hot');
      }
      assert.equal(Object.values(simulation.agents.counts()).reduce((a, b) => a + b), 20);
    }
    assert.ok(observedBlock && replannedUpper);
    assert.equal(simulation.agents.counts().evacuated, 20);
    assert.equal(simulation.agents.retries, 0, 'no cautious retry is needed when a known bypass is available');
    assert.ok(Math.abs(simulation.time - 74.7) < 1e-7);
    return structuredClone({ cells: simulation.cells, agents: simulation.agents.agents, time: simulation.time });
  }
  const first = run(); simulation.reset();
  assert.equal(simulation.agents.counts().waiting, 20);
  assert.deepEqual(run(), first);
});

test('final connection metadata rejects diagonal jumps and incorrect retained raster lengths', () => {
  const jump = createGeneratedMap(34);
  jump.pathNetwork.centerlines[0].splice(1, 1);
  assert.throws(() => validateGeneratedMap(jump), /nonadjacent path trace/);
  const stale = createGeneratedMap(34);
  stale.pathNetwork.connections[0].rasterSteps += 2;
  assert.throws(() => validateGeneratedMap(stale), /connection geometry/);
});

test('default v5 seed 34 gives every Global spawn a safe initial plan and both models complete', () => {
  const map = createGeneratedMap(34), goal = map.safeZone.z * map.width + map.safeZone.x;
  assert.equal(map.generation.attempt, 0);
  for (const awareness of ['global', 'local']) {
    const s = createEvacuationSimulation(map, { ...AGENT_CONFIG, awareness });
    s.select(35 * 64 + 23); s.start();
    for (const a of s.agents.agents) {
      assert.equal(a.state, 'evacuating');
      assert.ok(findPath(map, a.cell, goal, s.hazards));
    }
    for (let step = 0; step < 6000 && s.agents.counts().evacuated < 20; step++) {
      s.advance(.05);
      assert.equal(Object.values(s.agents.counts()).reduce((a, b) => a + b), 20);
    }
    assert.equal(s.agents.counts().evacuated, 20);
    assert.equal(s.agents.counts().lost, 0);
    assert.ok(Math.abs(s.time - (awareness === 'global' ? 90.9 : 74)) < 1e-7);
  }
});
