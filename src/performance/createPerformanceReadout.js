import { createFpsSampler, createFrameCapture } from './frameMetrics.js';
import { benchmarkBlockers } from './benchmarkConditions.js';

export function createPerformanceReadout({ element, canvas, simulation, environment,
  benchmark = false, doc = document, host = window, clock = performance }) {
  let disposed = false;
  let warmup = null;
  let wasStarted = false;
  let active = null;
  let objectUrl = null;
  const report = { methodology: '60 foreground wall-clock seconds from ignition; repeat after reset; wait for evacuation.',
    environment: null, runs: [] };
  const link = benchmark ? doc.createElement('a') : null;
  const data = benchmark ? doc.createElement('script') : null;
  if (benchmark) {
    link.className = 'benchmark-report';
    link.download = 'firefront-performance.json';
    data.type = 'application/json';
    data.id = 'performance-report';
    element.parentElement.append(link, data);
  }
  function publish(status) {
    if (!benchmark) return;
    report.environment = environment();
    report.blockers = benchmarkBlockers(report.environment);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const json = JSON.stringify(report, (key, value) => key === 'capture' || key === 'start' ? undefined : value, 2);
    data.textContent = json;
    objectUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    link.href = objectUrl;
    link.textContent = `Benchmark: ${status} · JSON`;
  }
  function invalidate(reason) {
    if (active && !active.issues.includes(reason)) {
      active.issues.push(reason);
      active.valid = false;
      publish('interrupted');
    }
  }
  const sampler = createFpsSampler((fps) => {
    element.textContent = `FPS: ${fps.toFixed(1)}`;
    if (benchmark && !active) {
      publish(report.runs.length >= 2 ? 'two runs recorded'
        : warmup !== null && clock.now() - warmup >= 5000 ? 'ready' : 'warming up');
    }
    if (active) {
      const current = environment();
      benchmarkBlockers(current).forEach(invalidate);
      if (JSON.stringify(current.canvas) !== JSON.stringify(active.environment.canvas)
        || current.devicePixelRatio !== active.environment.devicePixelRatio) invalidate('Canvas or pixel ratio changed.');
    }
  });
  function visibility() {
    sampler.reset();
    warmup = null;
    element.textContent = doc.hidden ? 'FPS: paused' : 'FPS: …';
    if (doc.hidden) invalidate('Document became hidden; benchmark is invalid, not paused.');
  }
  function blur() { warmup = null; invalidate('Document lost foreground focus.'); }
  function resize() { invalidate('Viewport resized during the run.'); }
  function gesture(event) {
    if (event.type === 'wheel' || event.button === 1 || event.button === 2) invalidate('Camera gesture during the run.');
  }
  doc.addEventListener('visibilitychange', visibility);
  if (benchmark) {
    host.addEventListener('blur', blur);
    host.addEventListener('resize', resize);
    canvas.addEventListener('wheel', gesture);
    canvas.addEventListener('pointerdown', gesture);
  }
  visibility();
  return {
    changed() {
      if (!benchmark || disposed) return;
      if (simulation.started && !wasStarted && report.runs.length < 2) {
        const now = clock.now();
        const info = environment();
        const issues = benchmarkBlockers(info);
        if (warmup === null || now - warmup < 5000) issues.push('Less than five seconds of visible rendering warm-up.');
        if (simulation.selected !== 32 * 64 + 32) issues.push('Ignition must be (32,32).');
        active = { run: report.runs.length + 1, ignition: [simulation.selected % 64,
          Math.floor(simulation.selected / 64)], environment: info, valid: issues.length === 0, issues };
        report.runs.push(active);
        active.start = now;
        active.capture = createFrameCapture(now);
        publish(active.valid ? 'recording' : 'recording (invalid conditions)');
      } else if (!simulation.started && wasStarted && active) {
        invalidate('Simulation reset before measurement and evacuation completed.');
        active.capture = undefined;
        active = null;
        publish('reset; repeat a fresh run');
      }
      wasStarted = simulation.started;
    },
    frame(now) {
      if (disposed || doc.hidden) return;
      if (warmup === null) { warmup = now; publish('warming up'); }
      sampler.frame(now);
      if (!active) return;
      const counts = simulation.agents.counts();
      if (Object.values(counts).reduce((sum, count) => sum + count, 0) !== 20) invalidate('Population count is not conserved.');
      if (!active.metrics) {
        const metrics = active.capture.frame(now);
        if (metrics) {
          active.metrics = metrics;
          active.countsAt60Seconds = counts;
          active.simulationSecondsAt60 = simulation.time;
          active.capture = undefined;
          publish('60 s captured; wait for completion');
        }
      }
      if (active.metrics && counts.evacuated + counts.lost === 20) {
        active.finalCounts = counts;
        active.completionWallSeconds = (now - active.start) / 1000;
        active.completionSimulationSeconds = simulation.time;
        active = null;
        publish(report.runs.length === 2 ? 'two runs complete' : 'run complete; reset and repeat');
      }
    },
    dispose() {
      disposed = true;
      doc.removeEventListener('visibilitychange', visibility);
      if (benchmark) {
        host.removeEventListener('blur', blur);
        host.removeEventListener('resize', resize);
        canvas.removeEventListener('wheel', gesture);
        canvas.removeEventListener('pointerdown', gesture);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        link.remove();
        data.remove();
      }
    },
  };
}
