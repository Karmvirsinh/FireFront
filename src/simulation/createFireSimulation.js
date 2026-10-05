import { FIRE_CONFIG } from './fireConfig.js';

export function isHazardous(cell) {
  return cell.state === 'burning' || cell.state === 'burned-hot';
}

export function createFireSimulation(map, config = FIRE_CONFIG) {
  // Own copies: reset never changes the authoritative authored map.
  const initial = map.cells.map((cell) => ({
    state: 'unburned', fuel: config.fuelByType[cell.fuelType] ?? 0,
    hotRemaining: 0, walkable: cell.walkable,
  }));
  const simulation = { width: map.width, cells: [], selected: null, started: false };
  let accumulator = 0;
  const dirty = new Set();

  function reset() {
    if (simulation.selected !== null) dirty.add(simulation.selected);
    simulation.cells = initial.map((cell) => ({ ...cell }));
    simulation.selected = null;
    simulation.started = false;
    accumulator = 0;
  }
  reset();

  function eligible(index) {
    const cell = simulation.cells[index];
    return Number.isInteger(index) && cell?.state === 'unburned' && cell.fuel > 0;
  }
  function select(index) {
    if (simulation.started || !eligible(index)) return false;
    simulation.selected = index;
    return true;
  }
  function start() {
    if (simulation.started || !eligible(simulation.selected)) return false;
    simulation.started = true;
    simulation.cells[simulation.selected].state = 'burning';
    dirty.add(simulation.selected);
    accumulator = 0;
    return true;
  }
  function step() {
    // Only the selected cell evolves in this increment. No neighboring spread.
    const cell = simulation.cells[simulation.selected];
    if (cell.state === 'burning') {
      cell.fuel = Math.max(0, cell.fuel - config.fuelPerSecond * config.stepSeconds);
      if (cell.fuel < 1e-9) {
        cell.fuel = 0;
        cell.state = 'burned-hot';
        cell.hotRemaining = config.coolingSeconds;
        dirty.add(simulation.selected);
      }
    } else if (cell.state === 'burned-hot') {
      cell.hotRemaining = Math.max(0, cell.hotRemaining - config.stepSeconds);
      if (cell.hotRemaining < 1e-9) {
        cell.hotRemaining = 0;
        cell.state = 'burned-cool';
        dirty.add(simulation.selected);
      }
    }
  }
  function advance(frameSeconds) {
    if (!simulation.started || !Number.isFinite(frameSeconds) || frameSeconds <= 0) return;
    // Drop excess wall time after suspension; at most five 50ms steps per frame.
    accumulator += Math.min(frameSeconds, config.maxFrameSeconds);
    while (accumulator + 1e-9 >= config.stepSeconds) {
      step();
      accumulator = Math.max(0, accumulator - config.stepSeconds);
    }
  }
  function takeChanges() {
    const result = [...dirty];
    dirty.clear();
    return result;
  }
  return Object.assign(simulation, { eligible, select, start, advance, reset, takeChanges });
}
