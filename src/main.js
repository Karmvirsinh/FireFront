import './styles.css';
import './rendering/comparison.css';
if(new URLSearchParams(location.search).has('comparison'))document.body.classList.add('terrain-comparison');
import { createFixedMapDefinition } from './world/createFixedMapDefinition.js';
import { createApplication } from './app/createApplication.js';
import { createGeneratedMap } from './world/generation/createGeneratedMap.js';
import { createGenerationControls } from './ui/createGenerationControls.js';
import { startupOptions,generateInitialEnvironment } from './app/startup.js';
import { createLifecycleUI } from './ui/createLifecycleUI.js';

const { benchmark, fixedFixture, seed, normalAnimation } = startupOptions(location.search);
const initial=fixedFixture?{map:createFixedMapDefinition(),notice:''}:generateInitialEnvironment(seed,createGeneratedMap);
let generationControls;
let lifecycle;
const application = createApplication({
  canvas: document.querySelector('#scene'), panel: document.querySelector('#simulation-panel'),
  fpsElement: document.querySelector('#fps-readout'),
  initialMap: initial.map,
  buildInfo: __BUILD_INFO__, benchmark,
  normalAnimation,
  onStateChange: () => { generationControls?.refresh(); lifecycle?.refresh(); },
  onFrame: () => lifecycle?.refresh(),
});
generationControls = createGenerationControls(document.querySelector('#generation-form'), application,
  { lockedToFixture: benchmark });
if (!fixedFixture) document.querySelector('#seed-input').value = String(initial.map.generation.seed);
if(initial.notice)document.querySelector('#generation-status').textContent=initial.notice;
lifecycle = createLifecycleUI({ application, benchmark });

if (import.meta.hot) import.meta.hot.dispose(() => { lifecycle.dispose(); generationControls.dispose(); application.dispose(); });
