import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createGeneratedMap,createGeneratedMapV14,createGeneratedMapV12} from '../src/world/generation/createGeneratedMap.js';
import {campReservation} from '../src/world/generation/campLayout.js';
import {validateCampMap,createCampMap} from '../src/world/generation/createCampMap.js';
import {getSafeCells} from '../src/world/mapContract.js';
import {findPath} from '../src/agents/findPath.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {getNavigationHazards} from '../src/simulation/getNavigationHazards.js';
import {createWoodlandLayout} from '../src/rendering/woodlandComposition.js';
import {createBuildingView} from '../src/rendering/createBuildingView.js';
import {sampleTerrainHeight} from '../src/world/terrain.js';

test('radial camps are repeatable, slope-safe real clearings with 20 reachable assembly cells and two complete setback cells',()=>{
 for(const seed of [8,0,2,34]){
  const map=createGeneratedMap(seed),old=createGeneratedMapV14(seed);assert.deepEqual(createGeneratedMap(seed),map);
  assert.equal(map.generation.version,'forest-camps-v15');assert.ok(map.origins.length>=map.safeZones.length);assert.deepEqual(map.origins,old.origins);assert.deepEqual(map.spawnCells,old.spawnCells);assert.deepEqual(map.elevation,old.elevation);
  const occupied=new Set(),unsafe=new Uint8Array(map.cells.length),goals=getSafeCells(map);
  for(const camp of map.camps){
   assert.equal(camp.radius,2.7);assert.equal(camp.assemblyCells.length,20);const reserved=campReservation(map,camp);
   assert.ok(camp.clearingCells.length>=100);assert.ok(camp.structures.filter(p=>p.kind==='fence').length>=3);
   reserved.forEach(i=>{assert.ok(!occupied.has(i),'camp reservations cannot intersect');occupied.add(i);assert.equal(map.cells[i].fuelType,'none');});
   for(const i of camp.clearingCells)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const j=i+dz*104+dx;assert.equal(map.cells[j].fuelType,'none','entire two-cell buffer');}
   for(const i of camp.assemblyCells){assert.equal(map.cells[i].walkable,true);assert.ok(!camp.blockedCells.includes(i));}
   const xs=camp.clearingCells.map(i=>i%104),zs=camp.clearingCells.map(i=>Math.floor(i/104));
   assert.ok(camp.clearingCells.length<(Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...zs)-Math.min(...zs)+1),'not a square pad');
  }
  // Controlled worst-case hazard fixture: every remaining fuel cell burns.
  const mask=getNavigationHazards({width:104,cells:map.cells.map(c=>({state:c.fuelType==='none'?'unburned':'burning'}))});
  assert.ok(map.camps.every(c=>c.clearingCells.every(i=>!mask[i])));
  for(const i of map.spawnCells){const a=findPath(map,i,goals,unsafe,'astar'),d=findPath(map,i,goals,unsafe,'dijkstra');assert.ok(a&&d);assert.equal(a.length,d.length);}
  const invalid=structuredClone(map);invalid.cells[map.camps[0].setbackCells[0]].fuelType='grass';assert.throws(()=>validateCampMap(invalid),/fuel/);
 }
});

test('unsuitable terrain rejects camp placement without modifying the previous usable map',()=>{
 const previous=createGeneratedMapV14(8),before=structuredClone(previous),terrain=createGeneratedMapV12(8);
 assert.throws(()=>createCampMap(previous,terrain,0,{gentle:Array(104*104).fill(false),heights:Array(104*104).fill(0)}),/No gentle, connected radial site/);
 assert.deepEqual(previous,before);
});

test('reservation excludes plant/crown footprints, ignition/reset retain nonfuel and origin ownership',()=>{
 const map=createGeneratedMap(8),before=structuredClone(map),layout=createWoodlandLayout(map),reservation=new Set(map.camps.flatMap(c=>campReservation(map,c))),sim=createEvacuationSimulation(map);
 for(const p of [...layout.trees,...layout.brush,...layout.grass]){
  const r=Math.ceil(p.radius/.5)+1,x=Math.floor(p.gx),z=Math.floor(p.gz);
  for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,nz=z+dz,i=nz*104+nx;if(nx<0||nz<0||nx>=104||nz>=104||!reservation.has(i))continue;assert.ok(Math.hypot(Math.max(nx-p.gx,0,p.gx-nx-1),Math.max(nz-p.gz,0,p.gz-nz-1))*.5>=p.radius+.039999);}
 }
 for(const i of reservation)assert.equal(sim.eligible(i),false);
 const fuel=map.cells.findIndex(c=>c.fuelType!=='none');sim.select(fuel);sim.start();sim.advance(.1);sim.reset();assert.equal(sim.agents.counts().waiting,20);assert.deepEqual(sim.agents.agents.map(a=>a.cell),map.spawnCells);assert.deepEqual(map,before);
});

test('human-scaled props respect physical blockers, actual terrain, open assembly and shared cleanup',()=>{
 const map=createGeneratedMap(8),view=createBuildingView(map);view.group.updateMatrixWorld(true);const v=new Vector3();
 try{
  for(const c of map.camps){const house=view.group.getObjectByName(c.id),group=house.getObjectByName('terrain-safe-camp');assert.ok(group);assert.equal(group.getObjectByName('camp-earth-pad'),undefined);
   for(const mesh of group.children){
    if(mesh.name==='camp-shelter-roof'||mesh.name==='camp-safe-marker'||mesh.name==='camp-safe-cross')continue;
    const positions=mesh.geometry.attributes.position;
    for(let n=0;n<positions.count;n++){v.fromBufferAttribute(positions,n).applyMatrix4(mesh.matrixWorld);const x=Math.floor(v.x/.5+52),z=Math.floor(v.z/.5+52),i=z*104+x;assert.ok(c.blockedCells.includes(i),`${mesh.name} outside collision reservation`);}
   }
   for(const tent of group.children.filter(m=>m.name==='camp-tent_smallOpen')){
    const opening=.444*tent.scale.y,width=.274*tent.scale.x;assert.ok(opening>.42);assert.ok(width*(1-.42/opening)>.16,'opening fits full agent at head height');
   }
   const roof=group.getObjectByName('camp-shelter-roof');roof.getWorldPosition(v);const surface=sampleTerrainHeight(map,v.x/.5+52,v.z/.5+52);assert.ok(v.y-surface>=.95);
  }
  const seen=new Set();let disposed=0;view.group.traverse(m=>{for(const r of [m.geometry,m.material])if(r&&!seen.has(r)){seen.add(r);r.addEventListener('dispose',()=>disposed++);}});view.dispose();assert.equal(disposed,seen.size);
 }catch(e){view.dispose();throw e;}
});
