import * as THREE from 'three';
import { createCameraControls } from './createCameraControls.js';

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce8ef);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(7, 6, 9);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const navigation = createCameraControls(camera, canvas);

  const groundGeometry = new THREE.PlaneGeometry(12, 12);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x718d66 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  // PlaneGeometry starts in XY; rotate it onto the world's XZ ground surface.
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xe87932 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.y = 0.75;
  cube.rotation.y = Math.PI / 6;
  scene.add(cube);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x526247, 2));
  const sunlight = new THREE.DirectionalLight(0xffffff, 3);
  sunlight.position.set(4, 8, 5);
  scene.add(sunlight);

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    // Cap GPU work on high-density displays while preserving CSS layout size.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();

  // Only draw here. Future simulation updates belong outside the renderer.
  renderer.setAnimationLoop(() => {
    navigation.update();
    renderer.render(scene, camera);
  });

  return {
    dispose() {
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      navigation.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      cubeGeometry.dispose();
      cubeMaterial.dispose();
      renderer.dispose();
    },
  };
}
