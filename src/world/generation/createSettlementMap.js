import {seedStream,V14_SETTINGS as GENERATOR_SETTINGS,V14_VERSION as GENERATOR_VERSION,V13_SETTINGS,V13_VERSION} from './seed.js';
import {normalizeMap,getSafeCells} from '../mapContract.js';
import {neighbors} from '../../agents/findPath.js';
import {sampleTerrainHeight} from '../terrain.js';
import {terrainTrailCell,terrainTrailEdge,validateTrailTerrain} from './trailTerrain.js';

export const SETTLEMENT_VERSION=GENERATOR_VERSION;
const directions=[[0,-1],[1,0],[0,1],[-1,0]];

export function settlementCounts(random,{legacy=false}={}){
 const origins=2+Number(random()<.5),drawnSafe=2+Number(random()<.5);
 return {origins,safe:legacy?drawnSafe:Math.min(origins,drawnSafe)};
}

// Add small facilities beside the selected, validated terrain-first network.
// No existing trail is removed, widened, or routed through a building.
export function createSettlementMap(base,attempt=0,{legacy=false}={}){
 const map=structuredClone(base),random=seedStream(base.generation.seed,'settlements-v1',attempt);
 const {origins:countOrigins,safe:countSafe}=settlementCounts(random,{legacy});
 const sites=[];
 for(let e=0;e<map.cells.length;e++)if(map.navigation.allowedCells[e]){
  const x=e%map.width,z=Math.floor(e/map.width);
  for(const [dx,dz]of directions){
   const door=(z+dz)*map.width+x+dx,cells=[];
   if(x<5||z<5||x>=map.width-5||z>=map.height-5||!terrainTrailCell(map,door)||!terrainTrailEdge(map,e,door))continue;
   for(let along=2;along<=4;along++)for(let side=-1;side<=1;side++)cells.push((z+dz*along+dx*side)*map.width+x+dx*along-dz*side);
   if(cells.some(i=>map.navigation.allowedCells[i]))continue;
   const heights=cells.flatMap(i=>[[0,0],[1,0],[0,1],[1,1]].map(([u,v])=>sampleTerrainHeight(map,i%map.width+u,Math.floor(i/map.width)+v)));
   if(Math.max(...heights)-Math.min(...heights)>.45)continue;
   sites.push({e,entrance:door,cells,dx,dz,x:x+dx*3,z:z+dz*3,baseY:Math.max(...heights)+.015,tie:random()});
  }
 }
 const selected=[],used=new Set();
 for(let n=0;n<countOrigins+countSafe;n++){
  const target=n===0?base.start:n===countOrigins?base.safeZone:null;
  const available=sites.filter(s=>!used.has(s.e)&&selected.every(p=>Math.hypot(s.x-p.x,s.z-p.z)>=20)&&s.cells.every(i=>!used.has(i))&&!used.has(s.entrance));
  available.sort((a,b)=>{
   const rank=s=>target?-Math.hypot(s.x-target.x,s.z-target.z):Math.min(...selected.map(p=>Math.hypot(s.x-p.x,s.z-p.z)))+s.tie*8;
   return rank(b)-rank(a)||a.e-b.e;
  });
  if(!available.length)throw new Error('Not enough separated, terrain-suitable building sites');
  const s=available[0];selected.push(s);for(const i of [s.e,s.entrance,...s.cells])used.add(i);
 }
 // Legacy endpoint assemblies remain navigable; only new door/arrival indicators
 // are colored. No old connector or bypass is removed.
 for(const c of map.cells)if(['start','safe'].includes(c.terrain))c.terrain='route';
 map.origins=[];map.safeZones=[];map.buildings=[];map.spawnCells=[];
 map.pathNetwork.attachments=[];
 for(const [n,s]of selected.entries()){
  const kind=n<countOrigins?'origin':'safe',number=kind==='origin'?n+1:n-countOrigins+1,id=`${kind}-${number}`;
  for(const i of s.cells){map.cells[i]={terrain:'building',fuelType:'none',walkable:false,surfaceCover:'bare'};map.navigation.allowedCells[i]=false;}
  map.cells[s.entrance]={terrain:kind==='origin'?'start':'safe',fuelType:'none',walkable:true};map.navigation.allowedCells[s.entrance]=true;
  const point={id,x:s.entrance%map.width,z:Math.floor(s.entrance/map.width),buildingId:id};
  (kind==='origin'?map.origins:map.safeZones).push(point);
  if(kind==='safe')point.arrivalCells=[s.entrance];
  map.buildings.push({id,kind,cells:s.cells,entrance:s.entrance,x:s.x,z:s.z,dx:s.dx,dz:s.dz,baseY:s.baseY,nonburnable:true});
  map.pathNetwork.attachments.push({id,from:s.e,to:s.entrance,cells:[s.e,s.entrance]});
 }
 const goals=new Set(getSafeCells(map)),occupied=new Set();
 for(const [n,o]of map.origins.entries()){
  const amount=Math.floor(20/countOrigins)+Number(n<20%countOrigins),start=o.z*map.width+o.x,queue=[start],seen=new Set(queue);o.spawnCells=[];
  for(let h=0;h<queue.length&&o.spawnCells.length<amount;h++){
   const i=queue[h];if(!occupied.has(i)&&!goals.has(i)){o.spawnCells.push(i);occupied.add(i);}
   for(const j of neighbors(map,i))if(!seen.has(j)){seen.add(j);queue.push(j);}
  }
  if(o.spawnCells.length!==amount)throw new Error('Insufficient connected assembly space');
  map.spawnCells.push(...o.spawnCells);
 }
 map.start={x:map.origins[0].x,z:map.origins[0].z};map.safeZone={x:map.safeZones[0].x,z:map.safeZones[0].z};
 delete map.zones;
 map.pathNetwork.trailCells=map.navigation.allowedCells.flatMap((allowed,i)=>allowed?[i]:[]);
 map.rendering.labels=[...map.origins.map((p,i)=>({...p,text:`ORIGIN ${i+1}`,z:p.z+2.5,width:2.8})),...map.safeZones.map((p,i)=>({...p,text:`SAFE ${i+1}`,z:p.z+2.5,width:2.7}))];
 map.generation={...map.generation,version:legacy?V13_VERSION:SETTLEMENT_VERSION,baseVersion:base.generation.version,settlementAttempt:attempt,settings:{...(legacy?V13_SETTINGS:GENERATOR_SETTINGS)}};
 return map;
}

export function validateSettlementMap(candidate){
 const map=normalizeMap(candidate),fail=s=>{throw new Error(`Invalid settlements: ${s}`);};
 const legacy=map.generation?.version===V13_VERSION;
 if(Object.entries(legacy?V13_SETTINGS:GENERATOR_SETTINGS).some(([k,v])=>map.generation?.settings?.[k]!==v))fail('settings');
 if(![SETTLEMENT_VERSION,V13_VERSION].includes(map.generation?.version)||map.width!==104||map.height!==104||map.cellSize!==.5||map.spawnCells.length!==20||new Set(map.spawnCells).size!==20)fail('profile/population');
 if(![2,3].includes(map.origins?.length)||![2,3].includes(map.safeZones?.length)||map.buildings.length!==map.origins.length+map.safeZones.length)fail('endpoint counts');
 if(!legacy&&map.origins.length<map.safeZones.length)fail('origins must be at least safe destinations');
 const goals=getSafeCells(map),seen=new Set(goals),queue=[...goals];
 for(let h=0;h<queue.length;h++)for(const j of neighbors(map,queue[h]))if(!seen.has(j)){seen.add(j);queue.push(j);}
 if([...map.spawnCells,...map.origins.map(o=>o.z*map.width+o.x)].some(i=>!seen.has(i))||map.navigation.allowedCells.some((v,i)=>v&&!seen.has(i)))fail('unreachable assembly/network');
 for(const b of map.buildings){if(!b.nonburnable||b.cells.includes(b.entrance)||!neighbors(map,b.entrance).length)fail('blocked entrance');}
 validateTrailTerrain(map);return map;
}
