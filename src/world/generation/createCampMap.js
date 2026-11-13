import {GENERATOR_VERSION,GENERATOR_SETTINGS,seedStream} from './seed.js';
import {CAMP_RADIUS,CAMP_SETBACK_CELLS,campGrid,radialCells,campReservation,rectCells,campStructures} from './campLayout.js';
import {terrainTrailCell,validateTrailTerrain} from './trailTerrain.js';
import {sampleTerrainHeight} from '../terrain.js';
import {normalizeMap,getSafeCells} from '../mapContract.js';
import {neighbors} from '../../agents/findPath.js';

export function createCampMap(input,terrainBase,attempt=0,cache={}){
 const map=structuredClone(input),random=seedStream(input.generation.seed,'radial-camps-v1',attempt);
 // Retire obsolete safe huts/access spurs without leaving square bare stamps.
 for(const b of map.buildings.filter(b=>b.kind==='safe'))for(const i of [...b.cells,b.entrance]){
  map.cells[i]=structuredClone(terrainBase.cells[i]);map.navigation.allowedCells[i]=terrainBase.navigation.allowedCells[i];
  if(['start','safe'].includes(map.cells[i].terrain))map.cells[i].terrain='route';
 }
 const oldSafe=map.buildings.filter(b=>b.kind==='safe');map.buildings=map.buildings.filter(b=>b.kind==='origin');
 const protectedCells=new Set([...map.spawnCells,...map.buildings.flatMap(b=>[...b.cells,b.entrance])]);
 const originalNav=map.navigation.allowedCells.slice();
 const gentle=cache.gentle??=map.cells.map((_,i)=>terrainTrailCell(map,i));
 const heights=cache.heights??=map.cells.map((_,i)=>sampleTerrainHeight(map,i%104+.5,Math.floor(i/104)+.5));
 const used=new Set(),camps=[];
 for(let number=0;number<oldSafe.length;number++){
  const target=oldSafe[number],candidates=[];
  for(let e=0;e<map.cells.length;e++)if(originalNav[e]&&map.cells[e].terrain!=='start')for(const [dx,dz]of [[0,-1],[1,0],[0,1],[-1,0]]){
   const x=e%104+dx*6,z=Math.floor(e/104)+dz*6;
   if(x<8||z<8||x>=96||z>=96)continue;
   candidates.push({e,x,z,dx,dz,rank:Math.hypot(x-target.x,z-target.z)+random()*.5});
  }
  candidates.sort((a,b)=>a.rank-b.rank||a.e-b.e);let selected=null;const rejected={outer:0,relief:0,solid:0,connection:0,graph:0,fence:0};
  for(const site of candidates){
   const camp={id:`safe-${number+1}`,x:site.x,z:site.z,dx:site.dx,dz:site.dz,radius:CAMP_RADIUS,phase:random()*Math.PI*2,setbackWidthCells:CAMP_SETBACK_CELLS};
   const outer=campReservation(map,camp);
   if(outer.some(i=>used.has(i)||protectedCells.has(i)||!gentle[i])){rejected.outer++;continue;}
   camp.clearingCells=radialCells(map,camp);const body=new Set(camp.clearingCells);
   if(Math.max(...camp.clearingCells.map(i=>heights[i]))-Math.min(...camp.clearingCells.map(i=>heights[i]))>.65){rejected.relief++;continue;}
   camp.setbackCells=outer.filter(i=>!body.has(i));camp.structures=campStructures();
   camp.assemblyCells=[];
   for(let row=-2;row<=1;row++)for(let col=-2;col<=2;col++){const p=campGrid(map,camp,col*.5,row*.5);camp.assemblyCells.push(Math.round(p.z)*104+Math.round(p.x));}
   const assembly=new Set(camp.assemblyCells),blocked=new Set();let bad=false;
   for(const piece of camp.structures){
    if(piece.kind==='shelter')continue;
    piece.cells=rectCells(map,camp,piece);
    if(!piece.cells.length||piece.cells.some(i=>originalNav[i]||assembly.has(i))){bad=true;break;}
    piece.cells.forEach(i=>blocked.add(i));
   }
   if(bad||camp.assemblyCells.some(i=>!body.has(i)||blocked.has(i))){rejected.solid++;continue;}
   camp.connectionCells=[site.e,site.e+site.dx+104*site.dz,site.e+2*site.dx+208*site.dz];camp.entrance=camp.connectionCells.at(-1);
   if(camp.connectionCells.some(i=>!gentle[i]||blocked.has(i))){rejected.connection++;continue;}
   const connected=()=>{
    const pass=new Set([...camp.clearingCells.filter(i=>!blocked.has(i)),...camp.connectionCells]),seen=new Set([site.e]),q=[site.e];
    for(let h=0;h<q.length;h++){const i=q[h];for(const j of [i-104,i+104,i-1,i+1])if(pass.has(j)&&!seen.has(j)&&Math.abs(i%104-j%104)+Math.abs(Math.floor(i/104)-Math.floor(j/104))===1){seen.add(j);q.push(j);}}
    return [...pass].every(i=>seen.has(i));
   };
   if(!connected()){rejected.graph++;continue;}
   // Partial back/side fence; leave a generous front gap and every old route clear.
   for(const a of [.15,.55,1.0,1.45,1.9,2.35,2.8,3.25]){
    const piece={kind:'fence',x:Math.cos(a)*3.45,z:Math.sin(a)*3.45,width:.78,depth:.12,angle:Math.PI/2-a,height:.28};
    // Conservative axis-aligned box for the rotated short fence segment.
    const rect={...piece,width:Math.abs(Math.cos(piece.angle))*.78+Math.abs(Math.sin(piece.angle))*.12,depth:Math.abs(Math.sin(piece.angle))*.78+Math.abs(Math.cos(piece.angle))*.12};
    piece.cells=rectCells(map,camp,rect,outer);
    if(!piece.cells.length||piece.cells.some(i=>originalNav[i]||assembly.has(i)||blocked.has(i)))continue;
    piece.cells.forEach(i=>blocked.add(i));
    if(!connected()){piece.cells.forEach(i=>blocked.delete(i));continue;}
    camp.structures.push(piece);
   }
   if(camp.structures.filter(p=>p.kind==='fence').length<3){rejected.fence++;continue;}
   camp.blockedCells=[...blocked];
   selected=camp;break;
  }
  if(!selected)throw new Error(`No gentle, connected radial site for SAFE ${number+1}: ${JSON.stringify(rejected)}`);
  camps.push(selected);for(const i of [...selected.clearingCells,...selected.setbackCells])used.add(i);
 }
 for(const camp of camps){
  for(const i of camp.setbackCells){const old=map.cells[i],route=originalNav[i];map.cells[i]={terrain:route?old.terrain:old.terrain==='obstacle'?'obstacle':'clearing',fuelType:'none',walkable:old.terrain==='obstacle'?false:true,surfaceCover:'bare'};}
  for(const i of camp.clearingCells){map.cells[i]={terrain:'camp',fuelType:'none',walkable:true,surfaceCover:'bare'};map.navigation.allowedCells[i]=true;}
  for(const i of camp.blockedCells){map.cells[i]={terrain:'building',fuelType:'none',walkable:false,surfaceCover:'bare'};map.navigation.allowedCells[i]=false;}
  for(const i of camp.connectionCells)if(!camp.clearingCells.includes(i)){map.cells[i]={terrain:'route',fuelType:'none',walkable:true};map.navigation.allowedCells[i]=true;}
  map.buildings.push({id:camp.id,kind:'safe',campId:camp.id,cells:camp.blockedCells,entrance:camp.entrance,x:camp.x,z:camp.z,dx:camp.dx,dz:camp.dz,baseY:sampleTerrainHeight(map,camp.x+.5,camp.z+.5),nonburnable:true});
 }
 map.camps=camps;map.safeZones=camps.map(c=>({id:c.id,campId:c.id,x:c.x,z:c.z,arrivalCells:c.assemblyCells}));map.safeZone={x:camps[0].x,z:camps[0].z};
 map.pathNetwork.attachments=map.pathNetwork.attachments.filter(c=>c.id.startsWith('origin-')).concat(camps.map(c=>({id:c.id,from:c.connectionCells[0],to:c.entrance,cells:c.connectionCells})));
 map.pathNetwork.trailCells=map.cells.flatMap((c,i)=>['route','start'].includes(c.terrain)&&map.navigation.allowedCells[i]?[i]:[]);
 map.rendering.labels=map.rendering.labels.filter(l=>l.buildingId?.startsWith('origin-')).concat(camps.map((c,i)=>({text:`SAFE ${i+1}`,campId:c.id,x:c.x,z:c.z,width:2.0})));
 map.generation={...map.generation,version:GENERATOR_VERSION,campAttempt:attempt,settings:{...GENERATOR_SETTINGS}};return map;
}

export function validateCampMap(input){
 const map=normalizeMap(input),fail=s=>{throw new Error(`Invalid camps: ${s}`);};
 if(map.generation?.version!==GENERATOR_VERSION||map.width!==104||map.height!==104||map.cellSize!==.5||Object.entries(GENERATOR_SETTINGS).some(([k,v])=>map.generation.settings[k]!==v)||!map.camps?.length||map.camps.length!==map.safeZones.length||map.origins.length<map.safeZones.length||![2,3].includes(map.origins.length)||![2,3].includes(map.safeZones.length)||map.spawnCells.length!==20||new Set(map.spawnCells).size!==20)fail('counts/profile');
 const all=new Set();
 for(const camp of map.camps){
  if(camp.radius!==CAMP_RADIUS||camp.setbackWidthCells!==CAMP_SETBACK_CELLS||!Number.isFinite(camp.phase))fail('radial boundary');
  const expected=campReservation(map,camp);
  const actual=new Set([...camp.clearingCells,...camp.setbackCells]);
  if(actual.size!==expected.length||expected.some(i=>!actual.has(i))||JSON.stringify(camp.clearingCells)!==JSON.stringify(radialCells(map,camp)))fail('incomplete clearing/setback');
  if(expected.some(i=>all.has(i)))fail('intersecting camp reservations');expected.forEach(i=>all.add(i));
  if(expected.some(i=>map.cells[i].fuelType!=='none'))fail('fuel in clearing/setback');
  if(expected.some(i=>!terrainTrailCell(map,i)))fail('unsuitable reserved terrain');
  if(Math.max(...camp.clearingCells.map(i=>sampleTerrainHeight(map,i%104+.5,Math.floor(i/104)+.5)))-Math.min(...camp.clearingCells.map(i=>sampleTerrainHeight(map,i%104+.5,Math.floor(i/104)+.5)))>.65)fail('excessive clearing relief');
  const solid=new Set(camp.blockedCells);
  if(camp.clearingCells.some(i=>!solid.has(i)&&(!map.navigation.allowedCells[i]||!map.cells[i].walkable)))fail('inaccessible clear ground');
  if(camp.structures.filter(p=>p.kind==='fence').length<3)fail('missing perimeter composition');
  if(camp.assemblyCells.length!==20||new Set(camp.assemblyCells).size!==20||camp.assemblyCells.some(i=>!camp.clearingCells.includes(i)||!map.navigation.allowedCells[i]||!map.cells[i].walkable||camp.blockedCells.includes(i)))fail('invalid assembly');
  const endpoint=map.safeZones.find(p=>p.campId===camp.id);
  if(!endpoint||JSON.stringify(endpoint.arrivalCells)!==JSON.stringify(camp.assemblyCells)||camp.blockedCells.some(i=>map.navigation.allowedCells[i]||map.cells[i].walkable))fail('invalid arrival/blockers');
 }
 for(const line of map.pathNetwork.centerlines)if(line.some(p=>!map.navigation.allowedCells[p.z*104+p.x]))fail('blocked original trail/bypass');
 const q=getSafeCells(map),seen=new Set(q);
 for(let h=0;h<q.length;h++)for(const j of neighbors(map,q[h]))if(!seen.has(j)){seen.add(j);q.push(j);}
 if(map.spawnCells.some(i=>!seen.has(i))||map.navigation.allowedCells.some((v,i)=>v&&!seen.has(i)))fail('disconnected spawn/camp/network');
 validateTrailTerrain(map);return map;
}
