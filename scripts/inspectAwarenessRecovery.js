// Inspection only: no production policy changes, remote clearing or map mutation.
// node scripts/inspectAwarenessRecovery.js prints every remaining trapped agent.
import { pathToFileURL } from 'node:url';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { AGENT_CONFIG } from '../src/agents/agentConfig.js';
import { findPath } from '../src/agents/findPath.js';
import { isNavigable } from '../src/world/navigationPolicy.js';

export function inspectRecovery(seed,x,z,duration=300) {
  const map=createGeneratedMap(seed),s=createEvacuationSimulation(map,{...AGENT_CONFIG,awareness:'local'});
  const radius=s.agents.detectionRadius,goal=map.safeZone.z*map.width+map.safeZone.x;
  const lastClear=new Float64Array(map.cells.length).fill(-1);
  const failures=[];let checks=0,safeRefreshes=0,trappedSafeRefreshes=0;
  const round=n=>+n.toFixed(4), xy=i=>[i%map.width,Math.floor(i/map.width)];
  function visibleAt(a,i) { return i===a.cell || (i%map.width+0.5-a.x)**2+(Math.floor(i/map.width)+0.5-a.z)**2<=radius*radius+1e-9; }
  function audit(previous) {
    for(const a of s.agents.agents) {
      if(a.state==='lost'||a.state==='evacuated')continue;
      const before=previous?.[a.id];
      for(let dz=-5;dz<=5;dz++)for(let dx=-5;dx<=5;dx++) {
        const cx=Math.floor(a.x)+dx,cz=Math.floor(a.z)+dz;
        if(cx<0||cx>=map.width||cz<0||cz>=map.height)continue;
        const i=cz*map.width+cx;
        if(visibleAt(a,i)) {
          checks++;
          const direct=Number(s.cells[i].state==='burning'||s.cells[i].state==='burned-hot');
          if(!a.observed[i]||a.observedUnsafe[i]!==s.hazards[i]||a.observedDirect[i]!==direct) {
            if(failures.length<20)failures.push({time:round(s.time),agent:a.id,cell:xy(i)});
          }
        }
        if(before?.blocked[i]&&!a.observedUnsafe[i]&&isNavigable(map,i)) {
          safeRefreshes++;if(before.state==='trapped')trappedSafeRefreshes++;
        }
      }
    }
  }
  s.select(z*map.width+x);s.start();audit(null);
  for(let step=0;step<duration/.05;step++) {
    const previous=s.agents.agents.map(a=>({x:a.x,z:a.z,cell:a.cell,state:a.state,blocked:a.observedUnsafe.slice()}));
    const old=s.hazards;s.advance(.05);
    for(let i=0;i<old.length;i++)if(old[i]&&!s.hazards[i])lastClear[i]=s.time;
    audit(previous);
  }
  const agents=s.agents.agents.filter(a=>a.state==='trapped').map(a=>{
    const actualPath=findPath(map,a.cell,goal,s.hazards),actualSet=new Set(actualPath??[]);
    const stale=[];const counterfactual=a.observedUnsafe.slice();
    for(let i=0;i<counterfactual.length;i++) {
      if(!isNavigable(map,i)||!counterfactual[i])continue;
      const isStale=!s.hazards[i];if(isStale)counterfactual[i]=0;
      stale.push({cell:xy(i),distance:round(Math.hypot(i%map.width+.5-a.x,Math.floor(i/map.width)+.5-a.z)),
        inRadius:visibleAt(a,i),actualUnsafe:Boolean(s.hazards[i]),actualState:s.cells[i].state,
        onActualRoute:actualSet.has(i),uncertain:a.uncertain.has(i),lastObserved:round(a.lastObservedAt[i]),lastActualClear:round(lastClear[i])});
    }
    return {id:a.id,cell:xy(a.cell),position:[round(a.x),round(a.z)],actualRoute:Boolean(actualPath),
      rememberedRoute:Boolean(findPath(map,a.cell,goal,a.observedUnsafe)),
      planningRoute:Boolean(findPath(map,a.cell,goal,a.planningUnsafe)),
      uncertainCells:[...a.uncertain].map(xy),
      routeWithOnlyStaleMemoryRemoved:Boolean(findPath(map,a.cell,goal,counterfactual)),
      state:{needsPlan:a.needsPlan,centering:a.centering,escaping:a.escaping,target:a.target,
        pathLength:a.path.length,atCenter:Math.hypot(a.x-(a.cell%map.width+.5),a.z-(Math.floor(a.cell/map.width)+.5))<1e-9},
      rememberedBlocked:stale};
  });
  return {seed,ignition:[x,z],duration:round(s.time),radius,counts:s.agents.counts(),
    audit:{checks,failures,safeRefreshes,trappedSafeRefreshes},agents};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url) {
  for(const [seed,x,z]of [[0,44,10],[2026,38,37]])console.log(JSON.stringify(inspectRecovery(seed,x,z)));
}
