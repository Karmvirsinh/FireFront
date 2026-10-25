import { isNavigable } from '../world/navigationPolicy.js';

// Cell centers are sensed from the agent's continuous grid position. Unknown
// hazards are optimistic for planning; blocked records persist; old unseen cells may be uncertain for planning.
export function isObservedNow(agent, map, index, radius) {
  return index===agent.cell || (index%map.width+0.5-agent.x)**2
    +(Math.floor(index/map.width)+0.5-agent.z)**2<=radius*radius+1e-9;
}

export function rememberHazard(agent, index, unsafe, direct, time = 0) {
  const changed = agent.observedUnsafe[index] !== unsafe[index]
    || agent.observedDirect[index] !== direct[index]
    || Boolean(agent.uncertain?.has(index) && (unsafe[index] || direct[index]));
  agent.observed[index] = 1;
  // Repeated sightings refresh time even when the hazard value is unchanged.
  if(agent.lastObservedAt) agent.lastObservedAt[index]=time;
  agent.uncertain?.delete(index);
  agent.observedUnsafe[index] = unsafe[index];
  agent.observedDirect[index] = direct[index];
  if(agent.planningUnsafe) agent.planningUnsafe[index]=unsafe[index];
  if(agent.planningDirect) agent.planningDirect[index]=direct[index];
  return changed;
}

export function observeHazards(agent, map, radius, unsafe, direct, time = 0) {
  let changed = false;
  // Bounds must include the same floating-point boundary tolerance as the
  // circular test below (e.g. 31.49999999999997 is an intended cell center).
  const tolerance=1e-9;
  const x0=Math.max(0,Math.ceil(agent.x-radius-0.5-tolerance));
  const x1=Math.min(map.width-1,Math.floor(agent.x+radius-0.5+tolerance));
  const z0=Math.max(0,Math.ceil(agent.z-radius-0.5-tolerance));
  const z1=Math.min(map.height-1,Math.floor(agent.z+radius-0.5+tolerance));
  for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) {
    if((x+0.5-agent.x)**2+(z+0.5-agent.z)**2>radius*radius+1e-9) continue;
    const i=z*map.width+x, altered=rememberHazard(agent,i,unsafe,direct,time);
    changed=(altered&&isNavigable(map,i))||changed;
  }
  // Occupancy/contact is always local, even for a configured sub-cell radius.
  return rememberHazard(agent,agent.cell,unsafe,direct,time)||changed;
}
