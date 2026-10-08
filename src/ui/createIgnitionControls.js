export function createIgnitionControls(canvas, panel, simulation, pickCell, onChange, keyboardTarget = window) {
  const place = panel.querySelector('#place-ignition');
  const start = panel.querySelector('#start-fire');
  const reset = panel.querySelector('#reset-simulation');
  const status = panel.querySelector('#fire-status');
  let placing = false;
  let gesture = null;
  let message = '';

  function refresh() {
    place.disabled = simulation.started;
    place.setAttribute('aria-pressed', String(placing));
    canvas.classList.toggle('placing-ignition', placing);
    // OrbitControls initializes an inline cursor, so update that same property.
    canvas.style.cursor = placing ? 'crosshair' : 'auto';
    start.disabled = simulation.started || simulation.selected === null;
    if (message) status.textContent = message;
    else if (simulation.selected === null) status.textContent = placing
      ? 'Left-click vegetation to select one cell.' : 'Enable Place ignition to select fuel.';
    else {
      const index = simulation.selected;
      const cell = simulation.cells[index];
      status.textContent = `Cell (${index % simulation.width}, ${Math.floor(index / simulation.width)}): ${simulation.started
        ? cell.state : 'selected — ready to start'}.`;
    }
  }
  function toggle() {
    if (place.disabled || simulation.started) return;
    placing = !placing;
    gesture = null;
    message = '';
    refresh();
  }
  function shortcut(event) {
    if (event.key?.toLowerCase() !== 'i' || event.repeat || event.isComposing
      || event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented
      || place.disabled || simulation.started) return;
    const typing = event.composedPath().some((element) => element.isContentEditable
      || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
    if (typing) return;
    event.preventDefault();
    toggle();
  }
  function startFire() {
    if (!simulation.start()) return;
    placing = false;
    gesture = null;
    message = '';
    onChange();
    refresh();
  }
  function resetSimulation() {
    simulation.reset();
    placing = false;
    gesture = null;
    message = '';
    onChange();
    refresh();
  }
  function down(event) {
    gesture = null;
    if (placing && !simulation.started && event.button === 0 && event.isPrimary
      && event.pointerType === 'mouse' && !event.ctrlKey && !event.altKey && !event.metaKey
      && !event.shiftKey && event.buttons === 1) {
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  }
  function move(event) {
    if (gesture && (event.buttons !== 1 || Math.hypot(event.clientX - gesture.x,
      event.clientY - gesture.y) > 5)) gesture = null;
  }
  function up(event) {
    const click = gesture;
    gesture = null;
    if (!click || click.id !== event.pointerId || event.button !== 0 || !placing
      || Math.hypot(event.clientX - click.x, event.clientY - click.y) > 5) return;
    const index = pickCell(event.clientX, event.clientY);
    if (index !== null && simulation.select(index)) {
      message = '';
      onChange();
    } else message = 'Choose unburned vegetation with fuel; selection unchanged.';
    refresh();
  }
  function cancel() { gesture = null; }
  const listeners = [[place, 'click', toggle], [keyboardTarget, 'keydown', shortcut], [start, 'click', startFire],
    [reset, 'click', resetSimulation], [canvas, 'pointerdown', down],
    [canvas, 'pointermove', move], [canvas, 'pointerup', up],
    [canvas, 'wheel', cancel],
    [canvas, 'pointercancel', cancel], [canvas, 'pointerleave', cancel]];
  listeners.forEach(([target, type, handler]) => target.addEventListener(type, handler));
  refresh();
  return { refresh, dispose() {
    listeners.forEach(([target, type, handler]) => target.removeEventListener(type, handler));
    canvas.classList.remove('placing-ignition');
    canvas.style.cursor = 'auto';
  } };
}
