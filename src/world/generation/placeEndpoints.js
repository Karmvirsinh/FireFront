export function placeEndpoints(settings, random) {
  const angle = random() * Math.PI * 2;
  const radius = () => 21 + random() * 4;
  function point(theta) {
    const r = radius();
    return { x: Math.round(settings.width / 2 + Math.cos(theta) * r),
      z: Math.round(settings.height / 2 + Math.sin(theta) * r) };
  }
  const start = point(angle);
  const safeZone = point(angle + Math.PI + (random() - 0.5) * 0.4);
  // Exactly twenty distinct spawn cells; safety remains one destination cell.
  return { start, safeZone, zones: {
    start: { x0: start.x - 2, x1: start.x + 2, z0: start.z - 2, z1: start.z + 1 },
    safe: { x0: safeZone.x, x1: safeZone.x, z0: safeZone.z, z1: safeZone.z },
  },
    spawnCells: Array.from({ length: settings.population }, (_, i) =>
      (start.z - 2 + Math.floor(i / 5)) * settings.width + start.x - 2 + i % 5) };
}
