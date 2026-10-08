import assert from 'node:assert/strict';
import test from 'node:test';
import { getNavigationHazards } from '../src/simulation/getNavigationHazards.js';
import { createFireSimulation } from '../src/simulation/createFireSimulation.js';
import { FIRE_CONFIG } from '../src/simulation/fireConfig.js';
import { isConnected } from '../src/world/isConnected.js';
import { createFixedMap, cellAt } from '../src/world/createFixedMap.js';

function fixture(width = 5) {
  return { width, height: width, start: { x: 0, z: 2 }, safeZone: { x: 4, z: 2 },
    cells: Array.from({ length: width * width }, () => ({ fuelType: 'none', walkable: true })) };
}

test('burning projects exactly one cell including diagonals; hot projects none; edges never wrap', () => {
  const simulation = createFireSimulation(fixture());
  simulation.cells[12].state = 'burning';
  assert.deepEqual([...getNavigationHazards(simulation)].flatMap((value, i) => value ? [i] : []),
    [6, 7, 8, 11, 12, 13, 16, 17, 18]);
  simulation.cells[12].state = 'burned-hot';
  assert.equal(getNavigationHazards(simulation).reduce((sum, value) => sum + value), 1);
  simulation.cells[12].state = 'burned-cool';
  simulation.cells[0].state = 'burning';
  assert.deepEqual([...getNavigationHazards(simulation)].flatMap((value, i) => value ? [i] : []), [0, 1, 5, 6]);
  simulation.cells[0].state = 'burned-cool';
  simulation.cells[24].state = 'burning';
  assert.deepEqual([...getNavigationHazards(simulation)].flatMap((value, i) => value ? [i] : []), [18, 19, 23, 24]);
});

test('overlap remains until every burning source clears; hot cells stay unsafe themselves', () => {
  const simulation = createFireSimulation(fixture());
  simulation.cells[11].state = simulation.cells[13].state = 'burning';
  assert.equal(getNavigationHazards(simulation)[12], 1);
  simulation.cells[11].state = 'burned-hot';
  assert.equal(getNavigationHazards(simulation)[12], 1);
  simulation.cells[13].state = 'burned-hot';
  const hot = getNavigationHazards(simulation);
  assert.equal(hot[12], 0);
  assert.equal(hot[11], 1);
  assert.equal(hot[13], 1);
  simulation.cells[11].state = simulation.cells[13].state = 'burned-cool';
  assert.ok(getNavigationHazards(simulation).every((value) => value === 0));
});

test('buffer does not add fuel or spread to roads; reset/replay clears derived hazards and preserves base map', () => {
  const map = fixture();
  map.cells[12] = { fuelType: 'forest', walkable: false };
  const original = structuredClone(map);
  const simulation = createFireSimulation(map);
  assert.equal(simulation.select(12), true);
  simulation.start();
  const initialMask = getNavigationHazards(simulation);
  assert.equal(isConnected(map, map.start, map.safeZone, initialMask), true);
  for (let i = 0; i < 600; i += 1) simulation.advance(0.05);
  assert.equal(simulation.cells[12].state, 'burned-hot');
  assert.ok(simulation.cells.every((cell, i) => i === 12 || (cell.fuel === 0 && cell.state === 'unburned')));
  for (let i = 0; i < 160; i += 1) simulation.advance(0.05);
  assert.equal(simulation.cells[12].state, 'burned-cool');
  assert.equal(simulation.cells[12].walkable, false);
  assert.equal(map.cells[12].walkable && !getNavigationHazards(simulation)[12], false);
  simulation.reset();
  assert.ok(getNavigationHazards(simulation).every((value) => value === 0));
  assert.ok(simulation.cells.every((cell) => cell.exposure === 0 && cell.hotRemaining === 0));
  simulation.select(12);
  simulation.start();
  assert.deepEqual(getNavigationHazards(simulation), initialMask);
  assert.deepEqual(map, original);
});

test('fuel quantity sets duration at the same consumption rate, not ignition exposure', () => {
  assert.deepEqual(FIRE_CONFIG.fuelByType, { none: 0, grass: 4, brush: 6, forest: 10 });
  for (const fuelType of ['grass', 'brush', 'forest']) {
    const map = { width: 2, cells: [{ fuelType: 'forest', walkable: false }, { fuelType, walkable: true }] };
    const simulation = createFireSimulation(map);
    simulation.select(0);
    simulation.start();
    for (let i = 0; i < 39; i += 1) simulation.advance(0.05);
    assert.equal(simulation.cells[1].state, 'unburned');
    simulation.advance(0.05);
    assert.equal(simulation.cells[1].state, 'burning');
    assert.equal(simulation.cells[1].fuel, FIRE_CONFIG.fuelByType[fuelType]);
    for (let i = 0; i < FIRE_CONFIG.fuelByType[fuelType] / FIRE_CONFIG.fuelPerSecond * 20; i += 1) simulation.advance(0.05);
    assert.equal(simulation.cells[1].state, 'burned-hot');
  }
});

test('cooling preserves blocked and walkable fuel eligibility; buffers cannot override base walkability', () => {
  for (const walkable of [false, true]) {
    const map = fixture();
    map.cells[12] = { fuelType: 'grass', walkable };
    const simulation = createFireSimulation(map);
    simulation.select(12);
    simulation.start();
    assert.equal(walkable && !getNavigationHazards(simulation)[12], false);
    for (let i = 0; i < 400; i += 1) simulation.advance(0.05);
    assert.equal(simulation.cells[12].state, 'burned-cool');
    assert.equal(simulation.cells[12].walkable && !getNavigationHazards(simulation)[12], walkable);
  }
});

function routeAvailable(map, unsafe, routeIndex) {
  // Close the other route on a temporary copy to test this route specifically.
  const copy = structuredClone(map);
  const section = copy.routes[1 - routeIndex].section;
  for (let z = section.z0; z <= section.z1; z += 1) {
    for (let x = section.x0; x <= section.x1; x += 1) cellAt(copy, x, z).walkable = false;
  }
  return isConnected(copy, copy.start, copy.safeZone, unsafe);
}

test('one forest ignition closes A with B available, then both routes, while every road remains unburned', () => {
  const map = createFixedMap();
  const original = structuredClone(map);
  const simulation = createFireSimulation(map);
  const initial = getNavigationHazards(simulation);
  assert.equal(routeAvailable(map, initial, 0), true);
  assert.equal(routeAvailable(map, initial, 1), true);
  for (const [i, cell] of map.cells.entries()) {
    if (cell.terrain === 'route') assert.equal(simulation.select(i), false);
  }
  const outcomes = [];
  for (let replay = 0; replay < 2; replay += 1) {
    simulation.reset();
    assert.deepEqual(getNavigationHazards(simulation), initial);
    simulation.select(32 * 64 + 32);
    simulation.start();
    for (let i = 0; i < 300; i += 1) simulation.advance(0.05); // 15 seconds: A closed, B open
    let unsafe = getNavigationHazards(simulation);
    assert.equal(routeAvailable(map, unsafe, 0), false);
    assert.equal(routeAvailable(map, unsafe, 1), true);
    assert.equal(isConnected(map, map.start, map.safeZone, unsafe), true);
    for (let x = 30; x <= 33; x += 1) assert.equal(unsafe[24 * 64 + x], 1);
    for (let i = 0; i < 120; i += 1) simulation.advance(0.05); // 21 seconds: both closed
    unsafe = getNavigationHazards(simulation);
    assert.equal(routeAvailable(map, unsafe, 0), false);
    assert.equal(routeAvailable(map, unsafe, 1), false);
    assert.equal(isConnected(map, map.start, map.safeZone, unsafe), false);
    for (const z of [24, 43]) for (let x = 30; x <= 33; x += 1) assert.equal(unsafe[z * 64 + x], 1);
    outcomes.push({ cells: structuredClone(simulation.cells), unsafe });
    for (let i = 0; i < 780; i += 1) simulation.advance(0.05); // 60 seconds total: all fuel cooled
    assert.ok(getNavigationHazards(simulation).every((value) => value === 0));
    assert.equal(isConnected(map, map.start, map.safeZone, getNavigationHazards(simulation)), true);
    for (const [i, cell] of map.cells.entries()) if (cell.terrain === 'route') {
      assert.equal(simulation.cells[i].state, 'unburned');
      assert.equal(simulation.cells[i].fuel, 0);
      assert.equal(simulation.cells[i].exposure, 0);
    }
  }
  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.deepEqual(map, original);
});
