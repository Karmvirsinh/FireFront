import './styles.css';
import { createScene } from './rendering/createScene.js';

const canvas = document.querySelector('#scene');
const sceneView = createScene(canvas);

// Dispose the old scene when Vite replaces this module during development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => sceneView.dispose());
}
