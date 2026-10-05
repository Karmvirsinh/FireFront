import './styles.css';
import { createScene } from './rendering/createScene.js';
import { createFixedMap } from './world/createFixedMap.js';
import { createFireSimulation } from './simulation/createFireSimulation.js';
import { createIgnitionControls } from './ui/createIgnitionControls.js';

const canvas = document.querySelector('#scene');
const map = createFixedMap();
const simulation = createFireSimulation(map);
let previousTime = null;
let previousState = null;
const sceneView = createScene(canvas, map, (time) => {
  if (previousTime !== null) simulation.advance((time - previousTime) / 1000);
  previousTime = time;
  sceneView.syncFire(simulation);
  const state = simulation.cells[simulation.selected]?.state;
  if (state !== previousState) {
    previousState = state;
    ignitionUI.refresh();
  }
});
const ignitionUI = createIgnitionControls(canvas, document.querySelector('#simulation-panel'),
  simulation, sceneView.pickCell, () => {
    previousTime = null;
    sceneView.syncFire(simulation);
  });

// Dispose the old scene when Vite replaces this module during development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => { ignitionUI.dispose(); sceneView.dispose(); });
}
