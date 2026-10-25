// Setup-only selection changes agents, not the map, fire selection or camera.
export function createAwarenessControls(panel, simulation, onChange, { lockedToGlobal = false } = {}) {
  const select=panel.querySelector('#awareness-mode'), note=panel.querySelector('#awareness-note');
  function refresh() {
    select.value=simulation.agents.awareness;
    select.disabled=lockedToGlobal||simulation.started;
    note.textContent=lockedToGlobal ? 'Fixed regression / benchmark: Global Awareness.'
      : select.value==='local' ? `Local: ${simulation.agents.detectionRadius}-cell radius; cautious retries after 5 s trapped.`
        : 'Global: agents know all current hazards and wait for a complete safe route.';
  }
  function change() {
    if(select.disabled||lockedToGlobal||simulation.started||!simulation.setAwareness(select.value)) {refresh();return;}
    onChange();refresh();
  }
  select.addEventListener('change',change);refresh();
  return {refresh,dispose(){select.removeEventListener('change',change);}};
}
