import './styles.css';
import { createFixedMapDefinition } from './world/createFixedMapDefinition.js';
import { createApplication } from './app/createApplication.js';

const query = new URLSearchParams(location.search);
const benchmark = query.get('benchmark') === '1';
const application = createApplication({
  canvas: document.querySelector('#scene'), panel: document.querySelector('#simulation-panel'),
  fpsElement: document.querySelector('#fps-readout'), initialMap: createFixedMapDefinition(),
  buildInfo: __BUILD_INFO__, benchmark,
  normalAnimation: benchmark && query.get('animation') === 'normal',
});

if (import.meta.hot) import.meta.hot.dispose(() => application.dispose());
