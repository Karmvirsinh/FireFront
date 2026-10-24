import { createGeneratedMap } from '../world/generation/createGeneratedMap.js';
import { normalizeSeed } from '../world/generation/seed.js';

// One persistent form outside replaceable map sessions; no extra loop/listeners.
export function createGenerationControls(form, application, { generator = createGeneratedMap,
  lockedToFixture = false } = {}) {
  const input = form.querySelector('#seed-input');
  const button = form.querySelector('#generate-map');
  const active = form.querySelector('#active-seed');
  const status = form.querySelector('#generation-status');
  function refresh() {
    const session = application.current;
    input.disabled = button.disabled = lockedToFixture || !session || session.simulation.started;
    const generation = session?.map.generation;
    active.textContent = generation ? `Active seed ${generation.seed} · ${generation.version}`
      : 'Fixed regression fixture · no seed';
    if (lockedToFixture) status.textContent = 'Generation is disabled for the fixed benchmark workload.';
  }
  function submit(event) {
    event.preventDefault();
    if (button.disabled || lockedToFixture || !application.current || application.current.simulation.started) return;
    const previous = application.current;
    let validSeed = false;
    try {
      const seed = normalizeSeed(input.value);
      validSeed = true;
      // Complete generation/validation BEFORE retiring the usable session.
      const candidate = generator(seed);
      application.replaceMap(candidate);
      input.value = String(seed);
      input.setAttribute('aria-invalid', 'false');
      status.textContent = `Generated seed ${seed}. Select one ignition to begin.`;
    } catch (error) {
      // Generation errors leave the old session untouched. Recover its map if
      // constructing the new renderer failed after the lifecycle retired it.
      if (!application.current) {
        try { application.replaceMap(previous.map); }
        catch { status.textContent = 'Scene could not be restored. Reload the page.'; refresh(); return; }
      }
      input.setAttribute('aria-invalid', String(!validSeed));
      status.textContent = validSeed ? 'Generation failed; current map retained.' : error.message;
    }
    refresh();
  }
  form.addEventListener('submit', submit);
  refresh();
  return { refresh, dispose() { form.removeEventListener('submit', submit); } };
}
