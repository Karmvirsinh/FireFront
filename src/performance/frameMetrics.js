// Wall-clock rendering measurements, deliberately independent of simulation time.
export function createFpsSampler(publish) {
  let start = null;
  let frames = 0;
  return {
    reset() { start = null; frames = 0; },
    frame(now) {
      if (start === null) { start = now; return; }
      frames += 1;
      if (now - start >= 1000) {
        publish(frames * 1000 / (now - start));
        start = now;
        frames = 0;
      }
    },
  };
}

export function createFrameCapture(start, durationMs = 60000) {
  let last = start;
  let windowStart = start;
  let windowFrames = 0;
  const intervals = [];
  const windows = [];
  let result = null;
  return {
    frame(now) {
      if (result || now <= last) return result;
      intervals.push(now - last);
      last = now;
      windowFrames += 1;
      if (now - windowStart >= 1000) {
        windows.push({ seconds: (now - windowStart) / 1000,
          frames: windowFrames, fps: windowFrames * 1000 / (now - windowStart) });
        windowStart = now;
        windowFrames = 0;
      }
      if (now - start < durationMs) return null;
      const sorted = [...intervals].sort((a, b) => a - b);
      const seconds = (now - start) / 1000;
      result = { durationSeconds: seconds, renderedFrames: intervals.length,
        averageFps: intervals.length / seconds,
        lowestOneSecondFps: windows.length ? Math.min(...windows.map((sample) => sample.fps)) : null,
        p95FrameTimeMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
        windowsBelow30: windows.filter((sample) => sample.fps < 30 - 1e-9).length,
        windows, trailingPartialWindow: { seconds: (now - windowStart) / 1000, frames: windowFrames } };
      return result;
    },
  };
}
