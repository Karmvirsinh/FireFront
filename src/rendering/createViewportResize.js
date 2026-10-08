// Observe the embedded viewport, including layout changes without window resizing.
// The canvas uses absolute CSS sizing so its drawing buffer cannot resize its parent.
export function createViewportResize(viewport, renderer, camera, navigation,
  host = window, Observer = ResizeObserver) {
  function resize() {
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    renderer.setPixelRatio(Math.min(host.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    navigation.frameMap(camera.aspect);
  }
  const observer = new Observer(resize);
  observer.observe(viewport);
  // A window resize can also change devicePixelRatio with no container size change.
  host.addEventListener('resize', resize);
  resize();
  return () => {
    observer.disconnect();
    host.removeEventListener('resize', resize);
  };
}
