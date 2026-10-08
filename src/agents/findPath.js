export function neighbors(map, index) {
  const x = index % map.width;
  return [index - map.width, x < map.width - 1 ? index + 1 : -1,
    index + map.width, x > 0 ? index - 1 : -1]
    .filter((next) => next >= 0 && next < map.cells.length && map.cells[next].walkable);
}

// Four-neighbor A*: Manhattan distance and stable f/h/index tie-breaking.
// Normal planning never permits an unsafe start, destination or intermediate cell.
export function findPath(map, start, goal, unsafe) {
  if (!map.cells[start]?.walkable || !map.cells[goal]?.walkable || unsafe[start] || unsafe[goal]) return null;
  const heuristic = (index) => Math.abs(index % map.width - goal % map.width)
    + Math.abs(Math.floor(index / map.width) - Math.floor(goal / map.width));
  const open = new Set([start]);
  const cost = new Map([[start, 0]]);
  const parent = new Map();
  while (open.size) {
    let current = null;
    for (const index of open) {
      const h = heuristic(index);
      const bestH = current === null ? Infinity : heuristic(current);
      const f = cost.get(index) + h;
      const bestF = current === null ? Infinity : cost.get(current) + bestH;
      if (f < bestF || (f === bestF && (h < bestH || (h === bestH && index < current)))) current = index;
    }
    if (current === goal) {
      const path = [goal];
      while (parent.has(path[0])) path.unshift(parent.get(path[0]));
      return path;
    }
    open.delete(current);
    for (const next of neighbors(map, current)) {
      const nextCost = cost.get(current) + 1;
      if (unsafe[next] || nextCost >= (cost.get(next) ?? Infinity)) continue;
      cost.set(next, nextCost);
      parent.set(next, current);
      open.add(next);
    }
  }
  return null;
}

// Emergency exit only for an already-buffered occupant. BFS finds the nearest
// safe cell through walkable buffer cells, never burning/hot cells. This is not
// permission for normal evacuation paths to enter buffers from safe ground.
export function findBufferExit(map, start, unsafe, direct) {
  if (!map.cells[start]?.walkable || direct[start]) return null;
  const queue = [start];
  const parent = new Map([[start, null]]);
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    if (!unsafe[current]) {
      const path = [current];
      while (parent.get(path[0]) !== null) path.unshift(parent.get(path[0]));
      return path;
    }
    for (const next of neighbors(map, current)) {
      if (direct[next] || parent.has(next)) continue;
      parent.set(next, current);
      queue.push(next);
    }
  }
  return null;
}
