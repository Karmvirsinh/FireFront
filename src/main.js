import './styles.css';
import { createScene } from './rendering/createScene.js';
import { createFixedMap } from './world/createFixedMap.js';

const canvas = document.querySelector('#scene');
const sceneView = createScene(canvas, createFixedMap());

// Dispose the old scene when Vite replaces this module during development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => sceneView.dispose());
}
