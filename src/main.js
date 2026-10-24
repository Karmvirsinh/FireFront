import './styles.css';
import { createFixedMapDefinition } from './world/createFixedMapDefinition.js';
import { createApplication } from './app/createApplication.js';
import { createGeneratedMap } from './world/generation/createGeneratedMap.js';
import { createGenerationControls } from './ui/createGenerationControls.js';

const query = new URLSearchParams(location.search);
const benchmark = query.get('benchmark') === '1';
const fixedFixture = benchmark || query.get('map') === 'fixed';
let generationControls;
const application = createApplication({
  canvas: document.querySelector('#scene'), panel: document.querySelector('#simulation-panel'),
  fpsElement: document.querySelector('#fps-readout'),
  initialMap: fixedFixture ? createFixedMapDefinition() : createGeneratedMap(42),
  buildInfo: __BUILD_INFO__, benchmark,
  normalAnimation: benchmark && query.get('animation') === 'normal',
  onStateChange: () => generationControls?.refresh(),
});
generationControls = createGenerationControls(document.querySelector('#generation-form'), application,
  { lockedToFixture: benchmark });

if (import.meta.hot) import.meta.hot.dispose(() => { generationControls.dispose(); application.dispose(); });
