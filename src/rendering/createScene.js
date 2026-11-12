import * as THREE from 'three';
import {applyLandscapePresentation,applyComparisonCamera} from './landscapePresentation.js';
import {configureLandscapeShadows,setLandscapeShadowFlags} from './landscapeShadows.js';
import { createCameraControls } from './createCameraControls.js';
import { createMapView } from './createMapView.js';
import { createGroundPicker } from './createGroundPicker.js';
import { createAgentView } from './createAgentView.js';
import { createViewportResize } from './createViewportResize.js';
import { getCameraBounds } from '../world/mapContract.js';

export function createScene(canvas, map, onFrame = () => {}, agents = null, onRendered = () => {},
  { normalAnimation = false, createRenderer = (options) => new THREE.WebGLRenderer(options) } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce8ef);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, Math.max(map.width,map.height)>64 ? Math.max(500, Math.hypot(map.width,map.height)*map.cellSize*20) : 500);
  camera.position.set(0, 40, 30);
  camera.lookAt(0, 0, 0);

  const renderer = createRenderer({ canvas, antialias: true });
  const comparison=new URLSearchParams(window.location?.search??'').has('comparison');
  const bounds=getCameraBounds(map);
  const navigation = createCameraControls(camera, canvas, window, comparison?{...bounds,centerY:4}:bounds);
  if(comparison){const frame=navigation.frameMap;navigation.frameMap=aspect=>{frame(aspect);applyComparisonCamera(camera,navigation.controls,canvas.parentElement.clientHeight);};}
  const mapView = createMapView(map);
  scene.add(mapView.group);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const agentView = agents ? createAgentView(map, agents) : null;
  if (agentView) scene.add(agentView.mesh);

  let shadowSetup=null;
  if(map.generation?.settings?.terrainFirst){const sun=applyLandscapePresentation(renderer,scene);setLandscapeShadowFlags(mapView.group);if(agentView)setLandscapeShadowFlags(agentView.mesh);shadowSetup=configureLandscapeShadows(renderer,sun,map,{enabled:!comparison});}else{
  scene.add(new THREE.HemisphereLight(0xffffff, 0x526247, 2));
  const sunlight = new THREE.DirectionalLight(0xffffff, 3);
  sunlight.position.set(4, 8, 5);
  scene.add(sunlight);
  }

  const stopResizing = createViewportResize(canvas.parentElement, renderer, camera, navigation);

  // The application owns simulation rules; rendering supplies elapsed wall time.
  let disposed = false;
  renderer.setAnimationLoop((time) => {
    if (disposed) return;
    navigation.update();
    onFrame(time);
    mapView.animate(time / 1000, motionPreference.matches && !normalAnimation);
    renderer.render(scene, camera);
    onRendered(performance.now());
  });

  const pickCell = createGroundPicker(camera, canvas, map,map.elevation?.surface?mapView.ground:null);
  return {
    setInteractionEnabled: navigation.setEnabled,
    performanceInfo() {
      const gl = renderer.getContext();
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const rect = canvas.getBoundingClientRect();
      return {
        canvas: { cssWidth: rect.width, cssHeight: rect.height,
          bufferWidth: canvas.width, bufferHeight: canvas.height },
        cameraDefault: camera.position.distanceTo(navigation.controls.position0) < 1e-7
          && navigation.controls.target.distanceTo(navigation.controls.target0) < 1e-7
          && camera.zoom === navigation.controls.zoom0,
        reducedMotion: motionPreference.matches && !normalAnimation,
        systemReducedMotion: motionPreference.matches, normalAnimationOverride: normalAnimation,
        graphics: { version: gl.getParameter(gl.VERSION),
          vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
          renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
          hardwareAcceleration: 'unknown; renderer string alone is not proof' },
      };
    },
    pickCell,
    syncFire: mapView.syncFire,
    syncAgents: () => agentView?.sync(),
    dispose() {
      if (disposed) return;
      disposed = true;
      stopResizing();
      renderer.setAnimationLoop(null);
      navigation.dispose();
      pickCell.dispose();
      mapView.dispose();
      agentView?.dispose();
      shadowSetup?.dispose();
      renderer.dispose();
    },
  };
}
