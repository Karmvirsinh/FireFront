import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Vector3, PerspectiveCamera, Color } from 'three';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createMapView } from '../src/rendering/createMapView.js';
import { createGroundPicker } from '../src/rendering/createGroundPicker.js';
import { createFireSimulation } from '../src/simulation/createFireSimulation.js';

test('render-only flicker, vegetation charring and reset leave map/fire state unchanged', () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }) };
  const map = createFixedMap();
  const originalMap = structuredClone(map);
  const fire = createFireSimulation(map);
  const view = createMapView(map);
  try {
    const index = 32 * 64 + 32;
    const flames = view.group.getObjectByName('tree-flames');
    const treeSlot = flames.userData.cells.indexOf(index);
    assert.ok(treeSlot >= 0);
    const floorFlames = view.group.getObjectByName('fire-flames');
    const cores = view.group.getObjectByName('tree-cores');
    const crowns = view.group.getObjectByName('forest-crowns');
    const trunks = view.group.getObjectByName('forest-trunks');
    const originalCrowns = crowns.instanceMatrix.array.slice();
    const originalColors = crowns.instanceColor.array.slice();
    const originalTrunks = trunks.instanceMatrix.array.slice();
    const originalTrunkColors = trunks.instanceColor.array.slice();
    fire.select(index); fire.start(); view.syncFire(fire);
    assert.deepEqual(crowns.instanceMatrix.array, originalCrowns);
    assert.deepEqual(trunks.instanceMatrix.array, originalTrunks);
    assert.notDeepEqual(crowns.instanceColor.array, originalColors);
    const snapshot = structuredClone(fire.cells);
    view.animate(1, false);
    const animated = flames.instanceMatrix.array.slice();
    view.animate(1.2, false);
    assert.notDeepEqual(flames.instanceMatrix.array, animated);
    view.animate(2, true);
    const staticFlames = flames.instanceMatrix.array.slice();
    view.animate(10, true);
    assert.deepEqual(flames.instanceMatrix.array, staticFlames);
    assert.deepEqual(fire.cells, snapshot);
    assert.deepEqual(map, originalMap);
    const matrix = new Matrix4();
    flames.getMatrixAt(treeSlot, matrix);
    flames.geometry.computeBoundingBox();
    crowns.geometry.computeBoundingBox();
    const scale = new Vector3().setFromMatrixScale(matrix);
    assert.equal(scale.x, 1);
    assert.equal(scale.z, 1);
    assert.ok(Math.abs(flames.geometry.boundingBox.max.y * scale.y
      / crowns.geometry.boundingBox.max.y - 1.05) < 1e-6);
    floorFlames.geometry.computeBoundingBox();
    assert.ok(Math.abs(floorFlames.geometry.boundingBox.max.y - 0.335) < 1e-6);
    assert.ok(floorFlames.geometry.boundingBox.max.x > 0.17, 'restore full compact bush/grass cluster');
    assert.equal(flames.count, crowns.count, 'tree-only batch contains decorative tree cells, not every floor cell');
    floorFlames.getMatrixAt(index, matrix);
    assert.equal(new Vector3().setFromMatrixScale(matrix).length(), 0, 'no duplicate low flame at tree cell');
    assert.ok(flames.geometry.boundingBox.max.x < map.cellSize / 2);
    const treeInstance = Array.from({ length: crowns.count }, (_, i) => i).find((i) => {
      matrix.fromArray(originalCrowns, i * 16);
      return new Vector3().setFromMatrixPosition(matrix).equals(new Vector3(0.25, 0, 0.25));
    });
    assert.notEqual(treeInstance, undefined);
    for (let i = 0; i < 40; i += 1) fire.advance(0.05);
    view.syncFire(fire);
    const floorNeighbor = index + 1;
    assert.equal(map.cells[floorNeighbor].fuelType, 'forest');
    assert.equal(fire.cells[floorNeighbor].state, 'burning');
    floorFlames.getMatrixAt(floorNeighbor, matrix);
    assert.deepEqual(new Vector3().setFromMatrixScale(matrix).toArray(), [1, 1, 1],
      'forest-floor cell without a tree model retains low flames');
    for (let i = 0; i < 559; i += 1) fire.advance(0.05);
    view.syncFire(fire);
    assert.equal(fire.cells[index].state, 'burning');
    // Even nearly exhausted trees retain their exact original standing transforms.
    for (const mesh of [crowns, trunks]) {
      mesh.getMatrixAt(treeInstance, matrix);
      assert.deepEqual(new Vector3().setFromMatrixScale(matrix).toArray(), [1, 1, 1]);
    }
    for (let i = 0; i < 2; i += 1) fire.advance(0.05);
    view.syncFire(fire);
    assert.equal(fire.cells[index].state, 'burned-hot');
    assert.equal(fire.cells[index].fuel, 0);
    for (const state of ['burned-hot', 'burned-cool']) {
      if (state === 'burned-cool') {
        for (let i = 0; i < 160; i += 1) fire.advance(0.05);
        view.syncFire(fire);
      }
      assert.equal(fire.cells[index].state, state);
      crowns.getMatrixAt(treeInstance, matrix);
      assert.equal(new Vector3().setFromMatrixScale(matrix).length(), 0);
      trunks.getMatrixAt(treeInstance, matrix);
      assert.ok(Math.abs(new Vector3().setFromMatrixScale(matrix).y - 0.35) < 1e-6);
      const charColor = new Color();
      trunks.getColorAt(treeInstance, charColor);
      assert.equal(charColor.getHex(), 0x302b29);
      for (const mesh of [flames, cores]) {
        mesh.getMatrixAt(treeSlot, matrix);
        assert.equal(new Vector3().setFromMatrixScale(matrix).length(), 0);
      }
      view.group.getObjectByName('fire-embers').getMatrixAt(index, matrix);
      assert.equal(new Vector3().setFromMatrixScale(matrix).length() > 0, state === 'burned-hot');
    }
    fire.reset(); view.syncFire(fire); view.animate(11, false);
    assert.deepEqual(crowns.instanceMatrix.array, originalCrowns);
    assert.deepEqual(crowns.instanceColor.array, originalColors);
    assert.deepEqual(trunks.instanceMatrix.array, originalTrunks);
    assert.deepEqual(trunks.instanceColor.array, originalTrunkColors);
    for (const mesh of [flames, cores, view.group.getObjectByName('fire-embers')]) {
      mesh.getMatrixAt(mesh.userData.cells ? treeSlot : index, matrix);
      assert.equal(new Vector3().setFromMatrixScale(matrix).length(), 0);
    }
    // Ground stays exactly at y=0; the aligned visual base is strictly underneath.
    const bases = view.group.children.filter((child) => child.name === 'terrain-base');
    assert.equal(bases.length, 2);
    for (const base of bases) {
      assert.equal(base.geometry.parameters.width, map.width * map.cellSize);
      assert.equal(base.geometry.parameters.depth, map.height * map.cellSize);
      assert.ok(base.position.y + base.geometry.parameters.height / 2 < 0);
    }
    const labels = view.group.children.filter((child) => child.isSprite);
    assert.equal(labels.length, 4);
    assert.ok(labels.every((label) => label.scale.x <= 3.2));
    const marker = view.group.getObjectByName('ignition-selection');
    assert.equal(marker.material.depthTest, false, 'ground outline remains visible through sparse tree models');
    marker.geometry.computeBoundingBox();
    assert.ok(Math.abs(marker.geometry.boundingBox.max.x - map.cellSize / 2) < 1e-6);
    assert.equal(marker.children[0].material.color.getHex(), new Color(0xffbf54).getHex());
  } finally {
    view.dispose();
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test('ground-only picking rejects visible front/side soil faces and preserves road eligibility', () => {
  const map = createFixedMap();
  const fire = createFireSimulation(map);
  const rect = { left: 37, top: -80, width: 900, height: 600 };
  const camera = new PerspectiveCamera(45, rect.width / rect.height, 0.1, 500);
  camera.position.set(25, 30, 35); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const picker = createGroundPicker(camera, { getBoundingClientRect: () => rect }, map);
  function pick(point) {
    const projected = point.project(camera);
    return picker(rect.left + (projected.x + 1) * rect.width / 2,
      rect.top + (1 - projected.y) * rect.height / 2);
  }
  assert.equal(pick(new Vector3(0, -0.3, 16)), null);
  assert.equal(pick(new Vector3(16, -0.3, 0)), null);
  const road = 24 * 64 + 32;
  assert.equal(pick(new Vector3(0.25, 0, -3.75)), road);
  assert.equal(fire.eligible(road), false);
  assert.equal(pick(new Vector3(0.25, 0, 0.25)), 32 * 64 + 32);
});
