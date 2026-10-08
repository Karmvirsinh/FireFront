import assert from 'node:assert/strict';
import test from 'node:test';
import { createFixedMap, cellAt } from '../src/world/createFixedMap.js';
import { isConnected } from '../src/world/isConnected.js';

function blockSection(map, routeIndex) {
  const { section } = map.routes[routeIndex];
  for (let z = section.z0; z <= section.z1; z += 1) {
    for (let x = section.x0; x <= section.x1; x += 1) cellAt(map, x, z).walkable = false;
  }
}

test('64x64 authored layout is deterministic, independent, and has valid endpoints', () => {
  const a = createFixedMap();
  const b = createFixedMap();
  assert.equal(a.width, 64);
  assert.equal(a.height, 64);
  assert.equal(a.cells.length, 4096);
  assert.deepEqual(a, b);
  for (const [location, terrain] of [[a.start, 'start'], [a.safeZone, 'safe']]) {
    const cell = cellAt(a, location.x, location.z);
    assert.equal(cell.walkable, true);
    assert.equal(cell.terrain, terrain);
    assert.equal(cell.fuelType, 'none');
  }
  assert.equal(cellAt(a, -1, 0), undefined);
  assert.equal(cellAt(a, 64, 0), undefined);
  assert.equal(cellAt(a, 0, 64), undefined);
  a.cells[0].walkable = true;
  assert.equal(b.cells[0].walkable, false);
  assert.equal(a.cells[1].walkable, false);
});

test('roads stay fuel-free and each passage has adjacent fuel without off-path escape', () => {
  const map = createFixedMap();
  for (const [walkable, fuel] of [[true, false], [false, true], [false, false]]) {
    assert.ok(map.cells.some((cell) => cell.walkable === walkable
      && (cell.fuelType !== 'none') === fuel));
  }
  for (const { section } of map.routes) {
    for (let z = section.z0; z <= section.z1; z += 1) {
      for (let x = section.x0; x <= section.x1; x += 1) {
        assert.deepEqual(cellAt(map, x, z), { terrain: 'route', fuelType: 'none', walkable: true });
        assert.equal(cellAt(map, x, z === 24 ? 25 : 42).fuelType, 'grass');
      }
    }
  }
  assert.ok(map.cells.filter((cell) => cell.terrain === 'route').every((cell) => cell.fuelType === 'none'));
  assert.ok(map.cells.filter((cell) => cell.fuelType !== 'none').every((cell) => !cell.walkable));
  for (const fuelType of ['grass', 'brush', 'forest']) assert.ok(map.cells.some((cell) => cell.fuelType === fuelType));
});

test('both routes initially connect; either full-width cut leaves the other connected', () => {
  const original = createFixedMap();
  assert.equal(isConnected(original), true);
  for (const routeIndex of [0, 1]) {
    const copy = structuredClone(original);
    blockSection(copy, routeIndex);
    assert.equal(isConnected(copy), true, `route ${routeIndex} must have an alternative`);
  }
  assert.deepEqual(original, createFixedMap());
});

test('two route cuts disconnect safety; reopening either restores connectivity', () => {
  const original = createFixedMap();
  const copy = structuredClone(original);
  blockSection(copy, 0);
  blockSection(copy, 1);
  assert.equal(isConnected(copy), false, 'no shortcut may bypass both cuts');
  for (const routeIndex of [0, 1]) {
    const restored = structuredClone(copy);
    const { section } = restored.routes[routeIndex];
    for (let z = section.z0; z <= section.z1; z += 1) {
      for (let x = section.x0; x <= section.x1; x += 1) cellAt(restored, x, z).walkable = true;
    }
    assert.equal(isConnected(restored), true);
  }
  assert.equal(isConnected(original), true);
});

test('BFS rejects blocked endpoints and traverses nonburnable walkable ground', () => {
  const map = createFixedMap();
  map.cells.forEach((cell) => { cell.fuelType = 'none'; });
  assert.equal(isConnected(map), true);
  cellAt(map, map.start.x, map.start.z).walkable = false;
  assert.equal(isConnected(map), false);
  cellAt(map, map.start.x, map.start.z).walkable = true;
  cellAt(map, map.safeZone.x, map.safeZone.z).walkable = false;
  assert.equal(isConnected(map), false);
});
