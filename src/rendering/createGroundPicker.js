import { Plane, Raycaster, Vector2, Vector3 } from 'three';

export function createGroundPicker(camera, canvas, map) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  return (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.left + rect.width
      || clientY < rect.top || clientY >= rect.top + rect.height) return null;
    pointer.set((clientX - rect.left) / rect.width * 2 - 1,
      1 - (clientY - rect.top) / rect.height * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    // Hit logical ground, not decorative vegetation, sprites, or UI.
    if (!raycaster.ray.intersectPlane(ground, hit)) return null;
    const x = Math.floor(hit.x / map.cellSize + map.width / 2);
    const z = Math.floor(hit.z / map.cellSize + map.height / 2);
    return x >= 0 && x < map.width && z >= 0 && z < map.height ? z * map.width + x : null;
  };
}
