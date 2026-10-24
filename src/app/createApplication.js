import { normalizeMap } from '../world/mapContract.js';
import { createScene } from '../rendering/createScene.js';
import { createEvacuationSimulation } from '../simulation/createEvacuationSimulation.js';
import { createIgnitionControls } from '../ui/createIgnitionControls.js';
import { createAgentCounts } from '../ui/createAgentCounts.js';
import { createPerformanceReadout } from '../performance/createPerformanceReadout.js';

// Own exactly one map session. Replacement is an internal API, not a new UI control.
export function createApplication({ canvas, panel, fpsElement, initialMap, buildInfo,
  benchmark = false, normalAnimation = false, host = window, doc = document, onStateChange = () => {} },
{ sceneFactory = createScene } = {}) {
  let current = null;
  let disposed = false;
  doc.documentElement.classList.toggle('benchmark-normal-animation', normalAnimation);

  function createSession(map) {
    const simulation = createEvacuationSimulation(map);
    const refreshCounts = createAgentCounts(panel, simulation.agents);
    let view = null;
    let ignition = null;
    let readout = null;
    let closed = false;
    let previousTime = null;
    let previousState = null;
    function dispose() {
      if (closed) return;
      closed = true;
      ignition?.dispose();
      readout?.dispose();
      view?.dispose();
    }
    try {
      refreshCounts();
      view = sceneFactory(canvas, map, (time) => {
        if (closed || !ignition) return;
        if (previousTime !== null) simulation.advance((time - previousTime) / 1000);
        previousTime = time;
        view.syncFire(simulation.fire);
        view.syncAgents();
        refreshCounts();
        ignition.updateCursor();
        const state = simulation.cells[simulation.selected]?.state;
        if (state !== previousState) { previousState = state; ignition.refresh(); }
      }, simulation.agents, (now) => readout?.frame(now), { normalAnimation });
      readout = createPerformanceReadout({ element: fpsElement, canvas, simulation, benchmark, doc, host,
        environment: () => ({ ...view.performanceInfo(), build: buildInfo,
          viewport: { width: host.innerWidth, height: host.innerHeight }, devicePixelRatio: host.devicePixelRatio,
          visible: !doc.hidden, focused: doc.hasFocus(), browser: host.navigator.userAgent,
          os: host.navigator.platform, automationHint: host.navigator.webdriver,
          cpu: 'unknown', gpu: 'see WebGL renderer', ram: 'unknown',
          browserType: 'unknown; operator must record physical/automated/headless status',
          grid: { width: map.width, height: map.height }, population: map.spawnCells.length,
        }),
      });
      ignition = createIgnitionControls(canvas, panel, simulation, view.pickCell, () => {
        readout.changed();
        previousTime = null;
        view.syncFire(simulation.fire);
        view.syncAgents();
        refreshCounts();
        onStateChange(current);
      }, host);
      const text = (selector, value) => {
        const node = doc.querySelector(selector);
        if (node) node.textContent = value;
      };
      const count = map.spawnCells.length;
      const routeHint = map.navigation?.mode === 'path-first' ? 'Path-first · '
        : map.routes?.length === 2 ? 'Two routes · '
        : map.routes?.length ? `${map.routes.length} routes · ` : '';
      text('#map-summary', `· ${map.name ?? 'Map'} · ${map.width}×${map.height} grid`);
      text('#population-summary', `${count} agents · ${routeHint}One ignition`);
      text('#population-detail', `${count} agents`);
      doc.documentElement.classList.toggle('generated-environment', Boolean(map.generation));
      text('#navigation-note', map.navigation?.mode === 'path-first'
        ? 'Ground color shows fuel coverage. Grass/clearings may be walkable; Path-first agents stay on paths and endpoint areas.'
        : 'Ground color shows fuel coverage. Models do not mark fuel boundaries. Off-path vegetation is blocked.');
      canvas.setAttribute('aria-label', `${map.name ?? 'Map'} with a start area, safe zone, vegetation and blocked ground`);
      return { map, simulation, view, dispose };
    } catch (error) { dispose(); throw error; }
  }

  function replaceMap(input) {
    if (disposed) throw new Error('Application is disposed.');
    // Validation can fail without interrupting the active session.
    const map = normalizeMap(input);
    current?.dispose();
    current = null;
    current = createSession(map);
    onStateChange(current);
    return current;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    current?.dispose();
    current = null;
    doc.documentElement.classList.remove('benchmark-normal-animation');
    doc.documentElement.classList.remove('generated-environment');
  }
  try { replaceMap(initialMap); } catch (error) { dispose(); throw error; }
  return { replaceMap, dispose, get current() { return current; } };
}
