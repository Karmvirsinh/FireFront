import { MathUtils, MOUSE, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCameraControls(camera, canvas, keyboardTarget = window) {
  const controls = new OrbitControls(camera, canvas);
  controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN };
  // Pan parallel to the ground, so the target's height stays at zero.
  controls.screenSpacePanning = false;
  controls.minDistance = 6;
  controls.maxDistance = 22;
  controls.minPolarAngle = MathUtils.degToRad(15);
  controls.maxPolarAngle = MathUtils.degToRad(75);

  const correction = new Vector3();
  function boundTarget() {
    correction.set(
      MathUtils.clamp(controls.target.x, -3, 3) - controls.target.x,
      -controls.target.y,
      MathUtils.clamp(controls.target.z, -3, 3) - controls.target.z,
    );
    // Translate both equally: clamping must not change distance or orbit angle.
    controls.target.add(correction);
    camera.position.add(correction);
  }

  controls.addEventListener('change', boundTarget);
  controls.update();
  controls.saveState();

  function resetView(event) {
    if (event.key?.toLowerCase() !== 'r' || event.ctrlKey || event.altKey || event.metaKey
      || event.isComposing || event.defaultPrevented) return;

    // composedPath also covers editable fields inside a shadow root.
    const typing = event.composedPath().some((element) =>
      element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
    if (typing) return;

    event.preventDefault();
    controls.reset();
  }

  keyboardTarget.addEventListener('keydown', resetView);

  return {
    controls,
    update() {
      controls.update();
      boundTarget();
    },
    dispose() {
      keyboardTarget.removeEventListener('keydown', resetView);
      controls.removeEventListener('change', boundTarget);
      // OrbitControls also removes its canvas context-menu and pointer listeners.
      controls.dispose();
    },
  };
}
