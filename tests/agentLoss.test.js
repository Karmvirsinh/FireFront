import assert from 'node:assert/strict';
import test from 'node:test';
import { Color, Matrix4, Vector3 } from 'three';
import { createAgentSimulation } from '../src/agents/createAgentSimulation.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { getNavigationHazards } from '../src/simulation/getNavigationHazards.js';
import { createAgentView } from '../src/rendering/createAgentView.js';
import { createAgentCounts } from '../src/ui/createAgentCounts.js';

// Controlled fuel-bearing walkable cells only; the authored road map is untouched.
function fixture(connected = true) {
  return { width: 5, height: 3, cellSize: 0.5,
    start: { x: 1, z: 1 }, safeZone: { x: 4, z: 1 },
    cells: Array.from({ length: 15 }, (_, i) => ({
      walkable: connected ? i >= 5 && i <= 9 : i === 6 || i === 9,
      fuelType: i === 1 ? 'forest' : i === 6 || i === 7 ? 'grass' : 'none',
    })) };
}
const config = (population) => ({ population, speedCellsPerSecond: 2,
  spawnCells: Array(population).fill(6) });

test('direct ignition checks occupied cells before movement, conserving simultaneous losses and terminal states', () => {
  const map = fixture();
  const original = structuredClone(map);
  const sim = createEvacuationSimulation(map, config(20));
  const initial = structuredClone(sim.agents.agents);
  // Include all nonterminal states and both terminal states at the same cell.
  sim.agents.agents[0].state = 'evacuated';
  sim.agents.agents[1].state = 'lost';
  sim.agents.agents[2].state = 'trapped';
  sim.agents.agents[3].state = 'evacuating';
  assert.ok(sim.select(6));
  assert.ok(sim.start()); // Immediate ignition, agents.advance(0), no escape first.
  assert.deepEqual(sim.agents.counts(), { waiting: 0, evacuating: 0,
    trapped: 0, evacuated: 1, lost: 19 });
  for (const agent of sim.agents.agents.slice(2)) {
    assert.equal(agent.x, initial[agent.id].x);
    assert.equal(agent.z, initial[agent.id].z);
    assert.deepEqual(agent.path, []);
    assert.equal(agent.target, null);
    assert.equal(agent.needsPlan || agent.centering || agent.escaping, false);
  }
  const terminal = structuredClone(sim.agents.agents);
  for (let i = 0; i < 400; i += 1) {
    sim.advance(0.05);
    assert.equal(Object.values(sim.agents.counts()).reduce((a, b) => a + b), 20);
  }
  assert.equal(sim.cells[6].state, 'burned-cool');
  assert.deepEqual(sim.agents.agents, terminal);
  sim.reset();
  assert.deepEqual(sim.agents.agents, initial);
  assert.deepEqual(sim.agents.counts(), { waiting: 20, evacuating: 0, trapped: 0, evacuated: 0, lost: 0 });
  assert.equal(sim.started, false);
  assert.equal(sim.selected, null);
  assert.ok(sim.cells.every((cell) => cell.state === 'unburned'));
  assert.deepEqual(map, original);
  sim.select(6);
  sim.start();
  assert.equal(sim.agents.counts().lost, 20);
});

test('trapping and a burning neighbor buffer cause no loss until actual spread ignites occupied fuel', () => {
  const sim = createEvacuationSimulation(fixture(false), config(3));
  sim.select(1); // Neighbor above the occupied cell; blocked forest can burn.
  sim.start();
  assert.equal(sim.hazards[6], 1);
  assert.deepEqual(sim.agents.counts(), { waiting: 0, evacuating: 0, trapped: 3, evacuated: 0, lost: 0 });
  const positions = sim.agents.agents.map(({ x, z }) => ({ x, z }));
  for (let i = 0; i < 39; i += 1) sim.advance(0.05);
  assert.equal(sim.cells[6].state, 'unburned');
  assert.equal(sim.agents.counts().lost, 0);
  sim.advance(0.05); // Fire ignites fuel, then loss runs, before any movement.
  assert.equal(sim.cells[6].state, 'burning');
  assert.equal(sim.agents.counts().lost, 3);
  assert.deepEqual(sim.agents.agents.map(({ x, z }) => ({ x, z })), positions);
});

test('mid-segment occupancy, lost appearance/counts, cooling and reset agree with continuous positions', () => {
  const map = fixture();
  const agents = createAgentSimulation(map, config(1));
  const fire = { width: 5, cells: map.cells.map(() => ({ state: 'unburned' })) };
  agents.start();
  agents.advance(0.3, getNavigationHazards(fire), fire.cells);
  const agent = agents.agents[0];
  assert.equal(agent.cell, 7); // Crossed boundary, not yet at target center (7.5).
  assert.ok(agent.x > 2 && agent.x < 2.5);
  assert.equal(agent.cell, Math.floor(agent.z) * map.width + Math.floor(agent.x));
  const before = { x: agent.x, z: agent.z };
  fire.cells[7].state = 'burning';
  agents.advance(0.05, getNavigationHazards(fire), fire.cells);
  assert.equal(agent.state, 'lost');
  assert.deepEqual({ x: agent.x, z: agent.z }, before);
  const view = createAgentView(map, agents);
  const nodes = Object.fromEntries(['waiting', 'evacuating', 'trapped', 'evacuated', 'lost']
    .map((state) => [state, {}]));
  const refresh = createAgentCounts({ querySelector: (id) => nodes[id.slice(7)] }, agents);
  try {
    refresh();
    assert.equal(nodes.lost.textContent, '1');
    const color = new Color();
    view.mesh.getColorAt(0, color);
    assert.equal(color.getHex(), 0xd90040); // Instance colors use Float32 storage.
    const matrix = new Matrix4();
    view.mesh.getMatrixAt(0, matrix);
    const position = new Vector3().setFromMatrixPosition(matrix);
    assert.ok(Math.abs(position.x - (before.x - 2.5) * 0.5) < 1e-6);
    for (const state of ['burned-hot', 'burned-cool']) {
      fire.cells[7].state = state;
      agents.advance(1, getNavigationHazards(fire), fire.cells);
      assert.equal(agent.state, 'lost');
      assert.deepEqual({ x: agent.x, z: agent.z }, before);
    }
    agents.reset();
    view.sync();
    refresh();
    view.mesh.getColorAt(0, color);
    assert.equal(color.getHex(), 0xffffff);
    assert.equal(nodes.waiting.textContent, '1');
    assert.equal(nodes.lost.textContent, '0');
  } finally { view.dispose(); }
});
