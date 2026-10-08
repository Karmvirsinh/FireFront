import * as THREE from 'three';

const COLORS = { waiting: 0xffffff, evacuating: 0x2962ff, trapped: 0xb25f00, evacuated: 0x00b8a9, lost: 0xd90040 };

export function createAgentView(map, simulation) {
  const geometry = new THREE.BoxGeometry(0.16, 0.42, 0.16);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.InstancedMesh(geometry, material, simulation.agents.length);
  mesh.frustumCulled = false;
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  function sync() {
    for (const agent of simulation.agents) {
      matrix.makeTranslation((agent.x - map.width / 2) * map.cellSize, 0.21,
        (agent.z - map.height / 2) * map.cellSize);
      mesh.setMatrixAt(agent.id, matrix);
      mesh.setColorAt(agent.id, color.setHex(COLORS[agent.state]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }
  sync();
  return { mesh, sync, dispose() { mesh.dispose(); geometry.dispose(); material.dispose(); } };
}
