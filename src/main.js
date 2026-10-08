import './styles.css';
import { createScene } from './rendering/createScene.js';
import { createFixedMap } from './world/createFixedMap.js';
import { createEvacuationSimulation } from './simulation/createEvacuationSimulation.js';
import { createIgnitionControls } from './ui/createIgnitionControls.js';
import { createAgentCounts } from './ui/createAgentCounts.js';

const canvas = document.querySelector('#scene');
const map = createFixedMap();
const simulation = createEvacuationSimulation(map);
const panel = document.querySelector('#simulation-panel');
const refreshCounts = createAgentCounts(panel, simulation.agents);
refreshCounts();
let previousTime = null;
let previousState = null;
const sceneView = createScene(canvas, map, (time) => {
  if (previousTime !== null) simulation.advance((time - previousTime) / 1000);
  previousTime = time;
  sceneView.syncFire(simulation.fire);
  sceneView.syncAgents();
  refreshCounts();
  ignitionUI.updateCursor();
  const state = simulation.cells[simulation.selected]?.state;
  if (state !== previousState) {
    previousState = state;
    ignitionUI.refresh();
  }
}, simulation.agents);
const ignitionUI = createIgnitionControls(canvas, panel,
  simulation, sceneView.pickCell, () => {
    previousTime = null;
    sceneView.syncFire(simulation.fire);
    sceneView.syncAgents();
    refreshCounts();
  });

// Dispose the old scene when Vite replaces this module during development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => { ignitionUI.dispose(); sceneView.dispose(); });
}
