import './styles.css';
import { createFixedMapDefinition } from './world/createFixedMapDefinition.js';
import { createApplication } from './app/createApplication.js';
import { createGeneratedMap } from './world/generation/createGeneratedMap.js';
import { createGenerationControls } from './ui/createGenerationControls.js';
import { startupOptions } from './app/startup.js';
import { createLifecycleUI } from './ui/createLifecycleUI.js';

const { benchmark, fixedFixture, seed, normalAnimation } = startupOptions(location.search);
let generationControls;
let lifecycle;
const application = createApplication({
  canvas: document.querySelector('#scene'), panel: document.querySelector('#simulation-panel'),
  fpsElement: document.querySelector('#fps-readout'),
  initialMap: fixedFixture ? createFixedMapDefinition() : createGeneratedMap(seed),
  buildInfo: __BUILD_INFO__, benchmark,
  normalAnimation,
  onStateChange: () => { generationControls?.refresh(); lifecycle?.refresh(); },
  onFrame: () => lifecycle?.refresh(),
});
generationControls = createGenerationControls(document.querySelector('#generation-form'), application,
  { lockedToFixture: benchmark });
if (!fixedFixture) document.querySelector('#seed-input').value = String(seed);
lifecycle = createLifecycleUI({ application, benchmark });

if (import.meta.hot) import.meta.hot.dispose(() => { lifecycle.dispose(); generationControls.dispose(); application.dispose(); });
