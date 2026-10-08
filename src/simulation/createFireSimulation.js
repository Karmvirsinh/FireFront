import { FIRE_CONFIG } from './fireConfig.js';

export function isHazardous(cell) {
  return cell.state === 'burning' || cell.state === 'burned-hot';
}

export function createFireSimulation(map, config = FIRE_CONFIG) {
  // Own copies: reset never changes the authoritative authored map.
  const initial = map.cells.map((cell) => ({
    state: 'unburned', fuel: config.fuelByType[cell.fuelType] ?? 0,
    hotRemaining: 0, exposure: 0, walkable: cell.walkable,
  }));
  const simulation = { width: map.width, cells: [], selected: null, started: false };
  let accumulator = 0;
  const dirty = new Set();

  function reset() {
    simulation.cells.forEach((cell, index) => {
      if (cell.state !== 'unburned') dirty.add(index);
    });
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
    // Freeze the sources before consuming fuel or changing states. A source that
    // burns out this step still contributes for this step; new fires start next step.
    const burning = simulation.cells.map((cell) => cell.state === 'burning');
    const ignitions = [];
    simulation.cells.forEach((cell, index) => {
      if (cell.state === 'burning') {
        cell.fuel = Math.max(0, cell.fuel - config.fuelPerSecond * config.stepSeconds);
        if (cell.fuel < 1e-9) {
          cell.fuel = 0;
          cell.state = 'burned-hot';
          cell.hotRemaining = config.coolingSeconds;
          dirty.add(index);
        }
      } else if (cell.state === 'burned-hot') {
        cell.hotRemaining = Math.max(0, cell.hotRemaining - config.stepSeconds);
        if (cell.hotRemaining < 1e-9) {
          cell.hotRemaining = 0;
          cell.state = 'burned-cool';
          dirty.add(index);
        }
      } else if (cell.state === 'unburned' && cell.fuel > 0) {
        const x = index % map.width;
        // Row guards prevent the right edge wrapping around to the next row.
        const neighbors = Number(x > 0 && burning[index - 1])
          + Number(x < map.width - 1 && burning[index + 1])
          + Number(index >= map.width && burning[index - map.width])
          + Number(index + map.width < burning.length && burning[index + map.width]);
        cell.exposure = neighbors === 0 ? 0 : cell.exposure
          + neighbors * config.exposurePerNeighborPerSecond * config.stepSeconds;
        if (cell.exposure + 1e-9 >= config.ignitionExposure) ignitions.push(index);
      }
    });
    // Apply together after every target was evaluated: no same-step cascade.
    for (const index of ignitions) {
      simulation.cells[index].state = 'burning';
      simulation.cells[index].exposure = 0;
      dirty.add(index);
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
