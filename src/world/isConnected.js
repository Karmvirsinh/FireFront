import { cellAt } from './createFixedMap.js';

// Validation only: four-neighbor reachability, with no agent path selection/A*.
export function isConnected(map, from = map.start, to = map.safeZone, unsafe = null) {
  const usable = (x, z) => cellAt(map, x, z)?.walkable && !unsafe?.[z * map.width + x];
  if (!usable(from.x, from.z) || !usable(to.x, to.z)) return false;
  const queue = [from];
  const visited = new Set([from.z * map.width + from.x]);
  for (let head = 0; head < queue.length; head += 1) {
    const { x, z } = queue[head];
    if (x === to.x && z === to.z) return true;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextX = x + dx;
      const nextZ = z + dz;
      const index = nextZ * map.width + nextX;
      if (!visited.has(index) && usable(nextX, nextZ)) {
        visited.add(index);
        queue.push({ x: nextX, z: nextZ });
      }
    }
  }
  return false;
}
