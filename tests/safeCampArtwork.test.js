import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createBuildingView} from '../src/rendering/createBuildingView.js';
import {createMapView} from '../src/rendering/createMapView.js';
import {createEvacuationSimulation} from '../src/simulation/createEvacuationSimulation.js';
import {AGENT_CONFIG} from '../src/agents/agentConfig.js';

function fixture(){
 const map={width:16,height:12,cellSize:.5,start:{x:12,z:9},safeZone:{x:2,z:4},spawnCells:[156],cells:Array.from({length:192},()=>({terrain:'route',fuelType:'none',walkable:true})),buildings:[]};
 for(const [kind,x,z,entrance]of [['safe',2,2,66],['origin',12,7,156]]){
  const cells=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const i=(z+dz)*16+x+dx;cells.push(i);map.cells[i]={terrain:'building',fuelType:'none',walkable:false};}
  map.buildings.push({id:kind,kind,x,z,dx:0,dz:-1,baseY:.015,cells,entrance,nonburnable:true});
 }
 map.cells[0]={terrain:'vegetation',fuelType:'grass',walkable:false};
 map.rendering={labels:[{text:'SAFE 1',buildingId:'safe',x:2,z:6.5,width:2.7}]};return map;
}

test('safe camp uses four curated props, keeps the outside arrival clear and all dressing inside blocked footprint',()=>{
 const map=fixture(),before=structuredClone(map),view=createBuildingView(map);view.group.updateMatrixWorld(true);
 try{
  const camp=view.group.getObjectByName('safe-camp');assert.ok(camp);assert.equal(view.group.getObjectByName('origin').getObjectByName('safe-camp'),undefined);
  for(const name of ['tent_smallOpen','campfire_stones','log','fence_simpleLow'])assert.ok(camp.children.some(m=>m.name===`camp-${name}`));
  const b=map.buildings[0],xs=b.cells.map(i=>i%16),zs=b.cells.map(i=>Math.floor(i/16));
  const minX=(Math.min(...xs)-8)*.5,maxX=(Math.max(...xs)+1-8)*.5,minZ=(Math.min(...zs)-6)*.5,maxZ=(Math.max(...zs)+1-6)*.5;
  camp.traverse(mesh=>{if(!mesh.isMesh)return;assert.equal(mesh.material.emissive.getHex(),0,'no decorative flames/heat');const p=mesh.geometry.attributes.position;
   for(let i=0;i<p.count;i++){const v=new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);assert.ok(v.x>=minX-1e-6&&v.x<=maxX+1e-6&&v.z>=minZ-1e-6&&v.z<=maxZ+1e-6,`${mesh.name} escapes footprint`);}
  });
  assert.ok(map.cells[b.entrance].walkable);assert.ok(!b.cells.includes(b.entrance));assert.deepEqual(map,before);
 }finally{view.dispose();}
});

test('fire/reset keep camp geometry and shared resource ownership intact without changing map or arrival semantics',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const map=fixture(),before=structuredClone(map),view=createMapView(map),sim=createEvacuationSimulation(map,{...AGENT_CONFIG,population:1});
 try{
  const camps=view.group.getObjectByName('safe-camp'),snapshot=()=>camps.children.map(m=>[m.name,m.position.toArray(),m.scale.toArray(),m.geometry.attributes.position.array.slice()]),initial=snapshot();
  const label=view.group.getObjectByName('map-label');assert.equal(label.scale.x,1.8);assert.ok(Math.abs(label.position.y-1.665)<1e-9);assert.equal(label.position.z,-.75,'label sits over outside arrival instead of inside pavilion');
  assert.equal(sim.eligible(map.buildings[0].cells[0]),false);sim.select(0);sim.start();sim.advance(.1);view.syncFire(sim.fire);sim.reset();view.syncFire(sim.fire);
  assert.deepEqual(snapshot(),initial);assert.deepEqual(map,before);assert.equal(sim.agents.counts().waiting,1);
  const seen=new Set();let disposed=0;camps.traverse(m=>{for(const r of [m.geometry,m.material])if(r&&!seen.has(r)){seen.add(r);r.addEventListener('dispose',()=>disposed++);}});
  view.dispose();assert.equal(disposed,seen.size,'each shared camp geometry/material disposed once');
 }finally{globalThis.document=previous;}
});
