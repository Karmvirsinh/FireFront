import { MathUtils, MOUSE, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCameraControls(camera, canvas, keyboardTarget = window, mapBounds = null) {
  const controls = new OrbitControls(camera, canvas);
  controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN };
  // Pan parallel to the ground, so the target's height stays at zero.
  controls.screenSpacePanning = false;
  const mapSpan = mapBounds ? Math.max(mapBounds.worldWidth, mapBounds.worldDepth) : 12;
  const panLimit = mapSpan / 4;
  controls.minDistance = mapSpan / 2;
  controls.maxDistance = 22;
  controls.minPolarAngle = MathUtils.degToRad(15);
  controls.maxPolarAngle = MathUtils.degToRad(75);

  const correction = new Vector3();
  function boundTarget() {
    correction.set(
      MathUtils.clamp(controls.target.x, Math.min(-panLimit, controls.target0.x),
        Math.max(panLimit, controls.target0.x)) - controls.target.x,
      -controls.target.y,
      MathUtils.clamp(controls.target.z, Math.min(-panLimit, controls.target0.z),
        Math.max(panLimit, controls.target0.z)) - controls.target.z,
    );
    // Translate both equally: clamping must not change distance or orbit angle.
    controls.target.add(correction);
    camera.position.add(correction);
  }

  controls.addEventListener('change', boundTarget);
  controls.update();
  controls.saveState();

  function resetView(event) {
    if (!controls.enabled || event.key?.toLowerCase() !== 'r' || event.ctrlKey || event.altKey || event.metaKey
      || event.isComposing || event.defaultPrevented) return;

    // composedPath also covers editable fields inside a shadow root.
    const typing = event.composedPath().some((element) =>
      element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
    if (typing) return;

    event.preventDefault();
    controls.reset();
  }

  keyboardTarget.addEventListener('keydown', resetView);

  // OrbitControls owns drags begun on the canvas, even outside its rectangle.
  // Its pointerup/cancel handlers handle normal completion; focus/capture loss
  // also needs to retire the gesture before a subsequent panel interaction.
  const doc = canvas.ownerDocument;
  const pointers = new Set();
  function begin(event) { if (controls.enabled) pointers.add(event.pointerId); }
  function finish(event) { pointers.delete(event.pointerId); }
  function cancelDrag() {
    if (!pointers.size) return;
    const captured = [...pointers];
    pointers.clear();
    // Public disconnect/connect clears the installed control's gesture state
    // and document handlers, while preserving camera/target/reset settings.
    controls.disconnect();
    for (const id of captured) {
      if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    }
    controls.connect(canvas);
    controls.dispatchEvent({ type: 'end' });
  }
  function visibility() { if (doc.hidden) cancelDrag(); }
  function noButtons(event) {
    if (event.pointerType === 'mouse' && event.buttons === 0) cancelDrag();
  }
  const gestureListeners = [[canvas, 'pointerdown', begin], [doc, 'pointerup', finish],
    [canvas, 'pointercancel', finish], [canvas, 'lostpointercapture', cancelDrag],
    [keyboardTarget, 'blur', cancelDrag], [doc, 'visibilitychange', visibility],
    [doc, 'pointermove', noButtons]];
  gestureListeners.forEach(([target, type, handler]) => target.addEventListener(type, handler));

  return {
    controls,
    setEnabled(enabled) {
      if (!enabled) cancelDrag();
      controls.enabled = enabled;
    },
    frameMap(aspect) {
      if (!mapBounds) return;
      const atInitialView = camera.position.distanceTo(controls.position0) < 1e-7
        && controls.target.distanceTo(controls.target0) < 1e-7 && camera.zoom === controls.zoom0;
      const halfFov = MathUtils.degToRad(camera.fov / 2);
      const limitingAngle = Math.min(halfFov, Math.atan(Math.tan(halfFov) * aspect));
      const radius = Math.hypot(mapBounds.worldWidth, mapBounds.worldDepth) / 2;
      const fullMapDistance = radius / Math.sin(limitingAngle) * 1.08;
      // Navigation limits still use the full map, independently of closer framing.
      controls.maxDistance = fullMapDistance * 1.5;
      const framing = mapBounds.framing;
      const frameRadius = framing ? Math.hypot(framing.width, framing.depth) / 2 : radius;
      const distance = Math.max(controls.minDistance, frameRadius / Math.sin(limitingAngle) * 1.08);
      // Fit the useful area's bounding sphere to both viewport axes. Save the responsive
      // reset view without disturbing an already navigated camera on resize.
      controls.target0.set(framing?.centerX ?? 0, 0, framing?.centerZ ?? 0);
      controls.position0.set(0, 1, 0.65).normalize().multiplyScalar(distance).add(controls.target0);
      controls.zoom0 = 1;
      if (atInitialView) controls.reset();
    },
    update() {
      controls.update();
      boundTarget();
    },
    dispose() {
      cancelDrag();
      gestureListeners.forEach(([target, type, handler]) => target.removeEventListener(type, handler));
      keyboardTarget.removeEventListener('keydown', resetView);
      controls.removeEventListener('change', boundTarget);
      // OrbitControls also removes its canvas context-menu and pointer listeners.
      controls.dispose();
    },
  };
}
