import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Vector3 } from 'three';
import { findPath, findBufferExit } from '../src/agents/findPath.js';
import { createAgentSimulation } from '../src/agents/createAgentSimulation.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createAgentView } from '../src/rendering/createAgentView.js';
import { createAgentCounts } from '../src/ui/createAgentCounts.js';

function fixture() {
  const rows = ['.......', '.#####.', '.#...#.', '.#####.', '.......'];
  return { width: 7, height: 5, cellSize: 0.5, start: { x: 1, z: 2 }, safeZone: { x: 5, z: 2 },
    cells: rows.join('').split('').map((c) => ({ walkable: c === '#', fuelType: 'none' })) };
}
function setup() {
  const map = fixture();
  const agents = createAgentSimulation(map, { ...AGENT_CONFIG, population: 1, spawnCells: [15] });
  const unsafe = new Uint8Array(map.cells.length);
  const fire = map.cells.map(() => ({ state: 'unburned' }));
  agents.start();
  agents.advance(0, unsafe, fire);
  return { map, agents, unsafe, fire, agent: agents.agents[0] };
}
function advance(f, seconds) {
  for (let i = 0; i < Math.round(seconds * 20); i += 1) {
    const before = { x: f.agent.x, z: f.agent.z };
    f.agents.advance(0.05, f.unsafe, f.fire);
    assert.ok(Math.hypot(f.agent.x - before.x, f.agent.z - before.z) <= 0.10000001);
    assert.equal(f.agent.cell, Math.floor(f.agent.z) * f.map.width + Math.floor(f.agent.x));
    assert.ok(f.map.cells[f.agent.cell].walkable);
  }
}

test('deterministic Manhattan A* finds edge-sharing shortest paths, avoids hazards and reports no route', () => {
  const map = fixture();
  const unsafe = new Uint8Array(map.cells.length);
  const path = findPath(map, 15, 19, unsafe);
  assert.equal(path.length, 7);
  assert.deepEqual(findPath(map, 15, 19, unsafe), path);
  assert.ok(path.some((index) => index === 10)); // Preferred upper route.
  unsafe[10] = 1;
  const alternative = findPath(map, 15, 19, unsafe);
  assert.ok(alternative.includes(24));
  for (let i = 0; i < alternative.length; i += 1) {
    assert.equal(unsafe[alternative[i]], 0);
    assert.ok(map.cells[alternative[i]].walkable);
    if (i) assert.equal(Math.abs(alternative[i] % 7 - alternative[i - 1] % 7)
      + Math.abs(Math.floor(alternative[i] / 7) - Math.floor(alternative[i - 1] / 7)), 1);
  }
  unsafe[24] = 1;
  assert.equal(findPath(map, 15, 19, unsafe), null);
  assert.equal(findPath(map, 0, 19, unsafe), null);
  unsafe[15] = 1;
  assert.equal(findPath(map, 15, 19, unsafe), null);
});

test('route closure reverses a partial segment without teleporting or entering the unsafe next cell', () => {
  const f = setup();
  advance(f, 0.6); // Center of (1,1) passed, only 0.2 cells toward (2,1).
  const x = f.agent.x;
  f.unsafe[9] = 1;
  advance(f, 0.05);
  assert.ok(f.agent.x < x, 'must reverse toward occupied safe cell center');
  advance(f, 4);
  assert.equal(f.agent.state, 'evacuated');
  assert.equal(f.agent.cell, 19);
});

test('trapped agents do not plan every frame and retry when a route reopens', () => {
  const f = setup();
  f.unsafe[10] = f.unsafe[24] = 1;
  advance(f, 0.05);
  assert.equal(f.agent.state, 'trapped');
  const plans = f.agents.plans;
  advance(f, 1);
  assert.equal(f.agents.plans, plans);
  f.unsafe[24] = 0;
  advance(f, 4);
  assert.equal(f.agent.state, 'evacuated');
});

test('already-buffered occupants exit buffered cells via walkable ground without direct hazards', () => {
  const f = setup();
  advance(f, 0.85); // In (2,1), past the cell boundary, short of its center.
  f.unsafe[8] = f.unsafe[9] = f.unsafe[10] = 1;
  const original = { x: f.agent.x, z: f.agent.z };
  advance(f, 0.05);
  assert.ok(f.agent.x > original.x, 'finish centering inside the occupied buffer cell');
  advance(f, 2);
  assert.equal(f.unsafe[f.agent.cell], 0);
  assert.notEqual(f.agent.state, 'trapped');
  assert.notEqual(f.agent.state, 'lost');
  const direct = new Uint8Array(f.map.cells.length);
  direct[10] = 1;
  const exit = findBufferExit(f.map, 9, f.unsafe, direct);
  assert.ok(exit && !exit.includes(10));
  assert.equal(f.unsafe[exit.at(-1)], 0);
});

test('occupied hot cells stop without loss, then retry after hazards clear', () => {
  const f = setup();
  advance(f, 0.85);
  const stopped = { x: f.agent.x, z: f.agent.z };
  f.unsafe[f.agent.cell] = 1;
  f.fire[f.agent.cell].state = 'burned-hot';
  advance(f, 1);
  assert.equal(f.agent.state, 'trapped');
  assert.deepEqual({ x: f.agent.x, z: f.agent.z }, stopped);
  f.fire[f.agent.cell].state = 'burned-cool';
  f.unsafe.fill(0);
  advance(f, 4);
  assert.equal(f.agent.state, 'evacuated');
});

test('evacuated is terminal even if the safe cell later becomes hazardous', () => {
  const f = setup();
  advance(f, 4);
  const final = structuredClone(f.agent);
  f.unsafe.fill(1);
  f.fire[19].state = 'burning';
  advance(f, 1);
  assert.deepEqual(f.agent, final);
});

test('20-agent reset/replay, population conservation and shared timing match ordinary rendering intervals', () => {
  const map = createFixedMap();
  const original = structuredClone(map);
  const simulation = createEvacuationSimulation(map);
  const initial = structuredClone(simulation.agents.agents);
  assert.deepEqual(simulation.agents.counts(), { waiting: 20, evacuating: 0, trapped: 0, evacuated: 0, lost: 0 });
  for (const agent of initial) assert.ok(agent.x >= 6 && agent.x < 14 && agent.z >= 28 && agent.z < 36);
  const outcomes = [];
  for (const fps of [20, 30, 60, 144]) {
    simulation.reset();
    assert.deepEqual(simulation.agents.agents, initial);
    simulation.select(32 * 64 + 32);
    simulation.start();
    for (let frame = 0; frame < 20 * fps; frame += 1) {
      simulation.advance(1 / fps);
      assert.equal(Object.values(simulation.agents.counts()).reduce((sum, count) => sum + count), 20);
    }
    outcomes.push({ agents: structuredClone(simulation.agents.agents), fire: structuredClone(simulation.cells),
      plans: simulation.agents.plans });
  }
  for (const outcome of outcomes) assert.deepEqual(outcome, outcomes[0]);
  simulation.reset();
  simulation.select(32 * 64 + 32);
  simulation.start();
  simulation.advance(120);
  assert.ok(Math.abs(simulation.time - 0.25) < 1e-9);
  assert.ok(simulation.agents.agents.every((agent, i) =>
    Math.hypot(agent.x - initial[i].x, agent.z - initial[i].z) <= 0.500001));
  simulation.advance(0.049);
  simulation.reset();
  simulation.select(32 * 64 + 32);
  simulation.start();
  simulation.advance(0.001);
  assert.equal(simulation.time, 0);
  assert.deepEqual(map, original);
});

test('visible instances follow continuous positions and counts UI follows the five conserved states', () => {
  const map = createFixedMap();
  const simulation = createEvacuationSimulation(map);
  const view = createAgentView(map, simulation.agents);
  const nodes = Object.fromEntries(['waiting', 'evacuating', 'trapped', 'evacuated', 'lost'].map((state) => [state, {}]));
  const refresh = createAgentCounts({ querySelector: (id) => nodes[id.slice(7)] }, simulation.agents);
  const matrix = new Matrix4();
  try {
    assert.equal(view.mesh.count, 20);
    simulation.select(32 * 64 + 32);
    simulation.start();
    simulation.advance(0.15);
    view.sync();
    refresh();
    assert.equal(Number(nodes.evacuating.textContent), 20);
    for (const agent of simulation.agents.agents) {
      view.mesh.getMatrixAt(agent.id, matrix);
      const position = new Vector3().setFromMatrixPosition(matrix);
      assert.ok(position.distanceTo(new Vector3((agent.x - 32) * 0.5, 0.21, (agent.z - 32) * 0.5)) < 1e-6);
    }
    simulation.reset();
    refresh();
    assert.equal(nodes.waiting.textContent, '20');
    assert.equal(Object.values(nodes).reduce((sum, node) => sum + Number(node.textContent), 0), 20);
  } finally { view.dispose(); }
});

test('actual forest ignition reroutes toward B, traps all 20, resumes, then evacuates everyone', () => {
  const simulation = createEvacuationSimulation(createFixedMap());
  simulation.select(32 * 64 + 32);
  simulation.start();
  const routeCells = (z) => [30, 31, 32, 33].map((x) => z * 64 + x);
  assert.ok(simulation.agents.agents[0].path.some((cell) => routeCells(24).includes(cell)));
  for (let i = 0; i < 142; i += 1) simulation.advance(0.05); // 7.1 seconds
  const agent = simulation.agents.agents[0];
  assert.ok(agent.path.some((cell) => routeCells(43).includes(cell)));
  assert.ok(agent.target % 64 < agent.cell % 64, 'turn back west toward the B connector');
  for (let i = 142; i < 200; i += 1) simulation.advance(0.05);
  assert.equal(simulation.agents.counts().trapped, 20);
  for (let i = 200; i < 222; i += 1) simulation.advance(0.05);
  assert.equal(simulation.agents.counts().evacuating, 20);
  for (let i = 222; i < 800; i += 1) simulation.advance(0.05);
  assert.equal(simulation.agents.counts().evacuated, 20);
  assert.equal(simulation.agents.counts().lost, 0);
});
