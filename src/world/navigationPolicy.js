// Physical traversability is map data; the selected navigation policy is separate.
// Legacy/fixed fixtures have no mask and retain exactly their previous behavior.
export function isNavigable(map, index) {
  return Boolean(map.cells[index]?.walkable
    && (map.navigation?.mode !== 'path-first' || map.navigation.allowedCells[index]));
}
