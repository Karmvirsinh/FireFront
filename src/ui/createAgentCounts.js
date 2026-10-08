export function createAgentCounts(panel, simulation) {
  const nodes = Object.fromEntries(['waiting', 'evacuating', 'trapped', 'evacuated']
    .map((state) => [state, panel.querySelector(`#count-${state}`)]));
  let previous = '';
  return function refresh() {
    const counts = simulation.counts();
    const signature = JSON.stringify(counts);
    if (signature === previous) return;
    Object.entries(counts).forEach(([state, count]) => { nodes[state].textContent = String(count); });
    previous = signature;
  };
}
