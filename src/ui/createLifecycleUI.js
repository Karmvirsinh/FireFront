import { createGeneratedMap } from '../world/generation/createGeneratedMap.js';
import { freshSeed } from '../app/startup.js';

export const TOUR_STEPS = [
  ['.camera-hints', 'Camera controls', 'Wheel to zoom, right-drag to pan, middle-drag to orbit. R resets only the camera.'],
  ['.generation-actions', 'Environment', 'Enter a seed and Generate a forest. The same seed gives the same map. Reset replays the current map instead.'],
  ['.awareness-setting', 'Awareness', 'Local agents discover nearby hazards and cautiously reassess old observations. Global agents know all current hazards.'],
  ['.simulation-actions', 'Fire', 'Place ignition or I enables selection. Click vegetation, then use the separate Start fire button. Bare trails cannot ignite.'],
  ['.agent-counts', 'Evacuation counts', 'Follow waiting, evacuating, trapped, evacuated and lost agents. Temporary trapping can recover.'],
  ['#reset-simulation', 'Reset and results', 'Reset preserves your camera and awareness choice. Results let you replay, generate a new scenario or inspect the scene.'],
];

// A single modal owner outside replaceable map sessions. No animation/timer loop.
export function createLifecycleUI({ application, doc = document, host = window, benchmark = false,
  generator = createGeneratedMap, randomSeed = freshSeed }) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'lifecycle-dialog';
  dialog.setAttribute('aria-labelledby', 'lifecycle-title');
  dialog.innerHTML = `
    <section data-screen="entry">
      <p class="eyebrow">Forest evacuation simulator</p><h2 id="entry-title">FireFront</h2>
      <p>Generate a forest environment and explore how wildfire affects evacuation.</p>
      <button type="button" data-action="begin">Begin simulation</button>
    </section>
    <section data-screen="tour" hidden>
      <p id="tour-progress" class="eyebrow"></p><h2 id="tour-title"></h2><p id="tour-text"></p>
      <div class="dialog-actions"><button type="button" data-action="back">Back</button>
      <button type="button" data-action="next">Next</button><button type="button" data-action="skip">Skip tour</button></div>
    </section>
    <section data-screen="results" hidden>
      <h2 id="results-title"></h2>
      <dl class="result-stats">
        <div><dt><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><path d="M6 9v6m-3 6 3-6 4 6M2 12l4-3 4 3h6m-3-3 3 3-3 3M14 3h7v18h-7"/></svg>Evacuated</dt><dd id="result-evacuated"></dd></div>
        <div><dt><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M8 18v3h8v-3l3-2v-6a7 7 0 0 0-14 0v6Zm2 0v3m4-3v3m-3-6 1-2 1 2"/><circle cx="9" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/></svg>Lost</dt><dd id="result-lost"></dd></div>
        <div><dt><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="7" r="2"/><path d="M12 11v6m-3 4 3-4 3 4M8 14l4-3 4 3M3 3v18M1 3h4M1 21h4M21 3v18m-2-18h4m-4 18h4"/></svg>Remaining trapped</dt><dd id="result-remaining"></dd></div>
        <div><dt>Elapsed simulation time</dt><dd id="result-time"></dd></div>
        <div><dt>Seed</dt><dd id="result-seed"></dd></div><div><dt>Awareness</dt><dd id="result-awareness"></dd></div>
      </dl>
      <p class="note">Recorded at outcome. Remaining fire and cooling may continue.</p>
      <div class="dialog-actions"><button type="button" data-action="replay">Replay same map</button>
      <button type="button" data-action="new">New scenario</button><button type="button" data-action="inspect">Inspect scene</button></div>
      <p id="result-error" role="status"></p>
    </section>`;
  const highlight = doc.createElement('div');
  highlight.className = 'tour-highlight'; highlight.hidden = true;
  highlight.setAttribute('aria-hidden', 'true');
  doc.body.append(highlight, dialog);
  const help = doc.querySelector('#help-tour');
  const viewResults = doc.querySelector('#view-results');
  const warning = doc.querySelector('#lifecycle-status');
  const reset = doc.querySelector('#reset-simulation');
  const input = doc.querySelector('#seed-input');
  const q = selector => dialog.querySelector(selector);
  const action = name => q(`[data-action="${name}"]`);
  let screen = null, step = 0, entered = benchmark, shownOutcome = null, returnFocus = null;
  let closed = false;
  let lastUIState = null;
  const listeners = [];
  function listen(target, type, fn, options) {
    target.addEventListener(type, fn, options); listeners.push(() => target.removeEventListener(type, fn, options));
  }
  function close(restore = true) {
    screen = null; highlight.hidden = true;
    application.current?.view?.setInteractionEnabled?.(true);
    if (dialog.open) dialog.close();
    if (restore) {
      const destination = returnFocus?.isConnected && returnFocus.tabIndex >= 0 && !returnFocus.disabled ? returnFocus
        : !viewResults.hidden ? viewResults : !help.disabled ? help : reset;
      destination.focus();
    }
  }
  function show(name, title) {
    if (!dialog.open) returnFocus = doc.activeElement;
    application.current?.view?.setInteractionEnabled?.(false);
    screen = name; dialog.dataset.screen = name;
    for (const section of dialog.querySelectorAll('[data-screen]')) section.hidden = section.dataset.screen !== name;
    dialog.setAttribute('aria-labelledby', title);
    highlight.hidden = name !== 'tour';
    dialog.style.removeProperty('top'); dialog.style.removeProperty('left');
    if (!dialog.open) dialog.showModal();
  }
  function positionTour(scroll = false) {
    if (screen !== 'tour') return;
    const target = doc.querySelector(TOUR_STEPS[step][0]);
    if (scroll) target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    const r = target.getBoundingClientRect();
    const width = host.innerWidth, height = host.innerHeight;
    Object.assign(highlight.style, { left: `${r.left - 5}px`, top: `${r.top - 5}px`,
      width: `${r.width + 10}px`, height: `${r.height + 10}px` });
    const box = dialog.getBoundingClientRect();
    const below = r.bottom + 16;
    const top = below + box.height < height - 12 ? below : Math.max(12, r.top - box.height - 16);
    dialog.style.top = `${Math.min(top, Math.max(12, height - box.height - 12))}px`;
    dialog.style.left = `${Math.max(12, Math.min(r.left, width - box.width - 12))}px`;
  }
  function tour() {
    if (application.current?.simulation.started) return;
    show('tour', 'tour-title');
    q('#tour-progress').textContent = `Guide ${step + 1} of ${TOUR_STEPS.length}`;
    q('#tour-title').textContent = TOUR_STEPS[step][1]; q('#tour-text').textContent = TOUR_STEPS[step][2];
    action('back').disabled = step === 0;
    action('next').textContent = step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next';
    positionTour(true); action('next').focus();
  }
  function results() {
    const outcome = application.current?.simulation.outcome;
    if (!outcome) return;
    show('results', 'results-title');
    q('#results-title').textContent = outcome.kind === 'terminal' ? 'Evacuation complete' : 'No reachable evacuation route';
    for (const [name, value] of Object.entries({ evacuated: outcome.counts.evacuated, lost: outcome.counts.lost,
      remaining: outcome.remaining, time: `${outcome.time.toFixed(2)} s`, seed: outcome.seed ?? 'Fixed fixture',
      awareness: outcome.awareness === 'local' ? 'Local' : 'Global' })) q(`#result-${name}`).textContent = value;
    action('new').disabled = benchmark;
    q('#result-error').textContent = '';
    action('inspect').focus();
  }
  function refresh() {
    if (closed) return;
    const simulation = application.current?.simulation;
    const uiState = [simulation, simulation?.started, simulation?.outcome, simulation?.stalledAfterFire];
    if (lastUIState && uiState.every((value, i) => value === lastUIState[i])) return;
    lastUIState = uiState;
    help.disabled = benchmark || !simulation || simulation.started;
    viewResults.hidden = !simulation?.outcome;
    warning.textContent = simulation?.stalledAfterFire
      ? 'An actual route exists, but agents are waiting. Local reassessment continues; no completion is recorded. Report persistent stalling.' : '';
    if (!simulation?.outcome) {
      shownOutcome = null;
      if (screen === 'results') close();
    } else if (simulation.outcome !== shownOutcome && entered) {
      shownOutcome = simulation.outcome; results();
    }
  }
  listen(action('begin'), 'click', () => { entered = true; step = 0; tour(); });
  listen(help, 'click', () => { step = 0; tour(); });
  listen(action('back'), 'click', () => { if (step > 0) { step--; tour(); } });
  listen(action('next'), 'click', () => { if (step === TOUR_STEPS.length - 1) close(); else { step++; tour(); } });
  listen(action('skip'), 'click', () => close());
  listen(action('inspect'), 'click', () => close());
  listen(viewResults, 'click', results);
  listen(action('replay'), 'click', () => { close(false); reset.click(); reset.focus(); refresh(); });
  listen(action('new'), 'click', () => {
    if (benchmark) return;
    try {
      // Build/validate before replacing. Retain the old run if generation fails.
      const seed = randomSeed(); const map = generator(seed);
      const awareness = application.current.simulation.agents.awareness;
      application.replaceMap(map, { awareness });
      input.value = String(seed); input.removeAttribute('aria-invalid');
      doc.querySelector('#generation-status').textContent = 'New scenario ready. Select one ignition to begin.';
      close(false); input.focus(); refresh();
    } catch { q('#result-error').textContent = 'New scenario could not be created. Please retry or inspect the scene.'; }
  });
  listen(dialog, 'cancel', event => { event.preventDefault(); if (screen !== 'entry') close(); });
  listen(dialog, 'keydown', event => {
    // Contain I/R and all other keys before they reach scene/window shortcuts.
    event.stopPropagation();
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button')].filter(b => !b.disabled && !b.closest('[hidden]'));
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  listen(host, 'keydown', event => {
    if (dialog.open && !dialog.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  listen(host, 'resize', () => positionTour(true));
  listen(doc, 'scroll', () => positionTour(), true);
  refresh();
  if (!benchmark) { show('entry', 'entry-title'); action('begin').focus(); }
  return { refresh, dispose() {
    closed = true; listeners.forEach(remove => remove()); close(false); dialog.remove(); highlight.remove();
  } };
}
