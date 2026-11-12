import { createTerrainGeometry } from './terrainGeometry.js';
import { Mesh, MeshBasicMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three';

export function createGroundPicker(camera, canvas, map, groundMesh=null) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  const surface = groundMesh??(map.elevation ? new Mesh(createTerrainGeometry(map),new MeshBasicMaterial()) : null);
  const pick = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.left + rect.width
      || clientY < rect.top || clientY >= rect.top + rect.height) return null;
    pointer.set((clientX - rect.left) / rect.width * 2 - 1,
      1 - (clientY - rect.top) / rect.height * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    // Hit logical ground, not decorative vegetation, sprites, or UI.
    if (surface) {
      const intersection=raycaster.intersectObject(surface,false)[0];
      if(!intersection) return null;
      hit.copy(intersection.point);
    } else if (!raycaster.ray.intersectPlane(ground, hit)) return null;
    const x = Math.floor(hit.x / map.cellSize + map.width / 2);
    const z = Math.floor(hit.z / map.cellSize + map.height / 2);
    return x >= 0 && x < map.width && z >= 0 && z < map.height ? z * map.width + x : null;
  };
  pick.dispose = () => { if(!groundMesh){surface?.geometry.dispose(); surface?.material.dispose();} };
  return pick;
}
