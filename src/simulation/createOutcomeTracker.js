import { isNavigable } from '../world/navigationPolicy.js';
import { neighbors } from '../agents/findPath.js';

// Classification only: this connectivity mask never enters agent planning.
export function createOutcomeTracker(map) {
  let outcome = null;
  let settledReachable = null;
  let stalled = false;
  function update(simulation) {
    if (outcome || !simulation.started) return outcome;
    const counts = simulation.agents.counts();
    const remaining = counts.waiting + counts.evacuating + counts.trapped;
    let kind = remaining === 0 ? 'terminal' : null;
    if (!kind && !simulation.cells.some(c => c.state === 'burning' || c.state === 'burned-hot')) {
      // Once fire has settled, the actual map/hazards cannot change until reset.
      if (!settledReachable) {
        settledReachable = new Uint8Array(map.cells.length);
        const goal = map.safeZone.z * map.width + map.safeZone.x;
        const queue = [];
        if (isNavigable(map, goal) && !simulation.hazards[goal]) {
          queue.push(goal); settledReachable[goal] = 1;
        }
        for (let head = 0; head < queue.length; head++) {
          for (const next of neighbors(map, queue[head])) {
            if (!simulation.hazards[next] && !settledReachable[next]) {
              settledReachable[next] = 1; queue.push(next);
            }
          }
        }
      }
      const active = simulation.agents.agents.filter(a => !['evacuated', 'lost'].includes(a.state));
      const reachable = active.some(a => settledReachable[a.cell]);
      if (!reachable) kind = 'unreachable';
      // Diagnostic, never a timeout or a result: Local retries may still recover.
      stalled = reachable && active.every(a => a.state === 'trapped');
    }
    if (kind) {
      stalled = false;
      outcome = Object.freeze({ kind, time: simulation.time,
        counts: Object.freeze({ ...counts }), remaining,
        seed: map.generation?.seed ?? null, awareness: simulation.agents.awareness });
    }
    return outcome;
  }
  return { update, get outcome() { return outcome; }, get stalled() { return stalled; },
    reset() { outcome = settledReachable = null; stalled = false; } };
}
