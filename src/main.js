import './styles.css';
import { createScene } from './rendering/createScene.js';
import { createFixedMap } from './world/createFixedMap.js';
import { createEvacuationSimulation } from './simulation/createEvacuationSimulation.js';
import { createIgnitionControls } from './ui/createIgnitionControls.js';
import { createAgentCounts } from './ui/createAgentCounts.js';
import { createPerformanceReadout } from './performance/createPerformanceReadout.js';

const canvas = document.querySelector('#scene');
const map = createFixedMap();
const simulation = createEvacuationSimulation(map);
const panel = document.querySelector('#simulation-panel');
const refreshCounts = createAgentCounts(panel, simulation.agents);
refreshCounts();
let previousTime = null;
let previousState = null;
const query = new URLSearchParams(location.search);
const benchmark = query.get('benchmark') === '1';
const normalAnimation = benchmark && query.get('animation') === 'normal';
document.documentElement.classList.toggle('benchmark-normal-animation', normalAnimation);
const performanceReadout = createPerformanceReadout({
  element: document.querySelector('#fps-readout'), canvas, simulation,
  benchmark,
  environment: () => ({ ...sceneView.performanceInfo(), build: __BUILD_INFO__,
    viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio,
    visible: !document.hidden, focused: document.hasFocus(),
    browser: navigator.userAgent, os: navigator.platform,
    automationHint: navigator.webdriver,
    cpu: 'unknown', gpu: 'see WebGL renderer', ram: 'unknown',
    browserType: 'unknown; operator must record physical/automated/headless status',
    grid: { width: map.width, height: map.height }, population: simulation.agents.agents.length,
  }),
});
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
}, simulation.agents, performanceReadout.frame, { normalAnimation });
const ignitionUI = createIgnitionControls(canvas, panel,
  simulation, sceneView.pickCell, () => {
    performanceReadout.changed();
    previousTime = null;
    sceneView.syncFire(simulation.fire);
    sceneView.syncAgents();
    refreshCounts();
  });

// Dispose the old scene when Vite replaces this module during development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => { ignitionUI.dispose(); performanceReadout.dispose(); sceneView.dispose();
    document.documentElement.classList.remove('benchmark-normal-animation'); });
}
