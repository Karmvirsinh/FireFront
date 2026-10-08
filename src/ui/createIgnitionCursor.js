// Native cursor artwork never intercepts input. Both variants share a 4,4 hotspot.
export function createIgnitionCursor(canvas, pickCell, eligible) {
  let enabled = false;
  let pointer = null;
  let dragging = false;
  function refresh() {
    let cursor = 'auto';
    if (enabled && pointer && !dragging) {
      const index = pickCell(pointer.x, pointer.y);
      cursor = index !== null && eligible(index)
        ? 'var(--torch-cursor, crosshair)' : 'var(--torch-blocked-cursor, not-allowed)';
    }
    if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  }
  function move(event) {
    pointer = event.pointerType === 'mouse' ? { x: event.clientX, y: event.clientY } : null;
    dragging = Boolean(event.buttons & 6); // Middle/right camera gestures only.
    refresh();
  }
  function down(event) { move(event); }
  function up(event) { move(event); }
  function leave() { pointer = null; dragging = false; refresh(); }
  const listeners = [['pointerenter', move], ['pointermove', move], ['pointerdown', down],
    ['pointerup', up], ['pointerleave', leave], ['pointercancel', leave]];
  listeners.forEach(([type, listener]) => canvas.addEventListener(type, listener));
  refresh();
  return {
    setEnabled(value) { enabled = value; refresh(); },
    refresh,
    dispose() {
      listeners.forEach(([type, listener]) => canvas.removeEventListener(type, listener));
      canvas.style.cursor = 'auto';
    },
  };
}
