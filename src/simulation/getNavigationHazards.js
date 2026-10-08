// Derived navigation data only: no fuel, spread, rendering, or death rules.
// Recompute from current states so overlapping sources clear correctly and
// reset cannot leave a stale safety buffer behind.
export function getNavigationHazards({ width, cells }) {
  const unsafe = new Uint8Array(cells.length);
  const height = cells.length / width;
  cells.forEach((cell, index) => {
    if (cell.state === 'burned-hot') unsafe[index] = 1;
    if (cell.state !== 'burning') return;
    const x = index % width;
    const z = Math.floor(index / width);
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        const nz = z + dz;
        if (nx >= 0 && nx < width && nz >= 0 && nz < height) unsafe[nz * width + nx] = 1;
      }
    }
  });
  return unsafe;
}
