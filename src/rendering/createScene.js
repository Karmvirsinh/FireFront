import * as THREE from 'three';
import { createCameraControls } from './createCameraControls.js';
import { createMapView } from './createMapView.js';
import { createGroundPicker } from './createGroundPicker.js';
import { createAgentView } from './createAgentView.js';
import { createViewportResize } from './createViewportResize.js';

export function createScene(canvas, map, onFrame = () => {}, agents = null) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce8ef);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(0, 40, 30);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // Frame the authored useful area, rather than the surrounding blocked border.
  // Extra space includes the endpoint text sprites and comfortable ground margins.
  const areas = [...Object.values(map.zones), map.vegetationPatch];
  const x0 = Math.min(...areas.map((area) => area.x0));
  const x1 = Math.max(...areas.map((area) => area.x1)) + 1;
  const z0 = Math.min(...areas.map((area) => area.z0));
  const z1 = Math.max(...areas.map((area) => area.z1)) + 1;
  const navigation = createCameraControls(camera, canvas, window, {
    worldWidth: map.width * map.cellSize, worldDepth: map.height * map.cellSize,
    framing: {
      width: (x1 - x0) * map.cellSize + 3,
      depth: (z1 - z0) * map.cellSize + 2,
      centerX: ((x0 + x1) / 2 - map.width / 2) * map.cellSize,
      centerZ: ((z0 + z1) / 2 - map.height / 2) * map.cellSize,
    },
  });
  const mapView = createMapView(map);
  scene.add(mapView.group);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const agentView = agents ? createAgentView(map, agents) : null;
  if (agentView) scene.add(agentView.mesh);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x526247, 2));
  const sunlight = new THREE.DirectionalLight(0xffffff, 3);
  sunlight.position.set(4, 8, 5);
  scene.add(sunlight);

  const stopResizing = createViewportResize(canvas.parentElement, renderer, camera, navigation);

  // The application owns simulation rules; rendering supplies elapsed wall time.
  renderer.setAnimationLoop((time) => {
    navigation.update();
    onFrame(time);
    mapView.animate(time / 1000, motionPreference.matches);
    renderer.render(scene, camera);
  });

  return {
    pickCell: createGroundPicker(camera, canvas, map),
    syncFire: mapView.syncFire,
    syncAgents: () => agentView?.sync(),
    dispose() {
      stopResizing();
      renderer.setAnimationLoop(null);
      navigation.dispose();
      mapView.dispose();
      agentView?.dispose();
      renderer.dispose();
    },
  };
}
