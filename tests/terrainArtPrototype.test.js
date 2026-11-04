import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createStudyMap,STUDIES,STUDY_SEEDS} from '../src/prototype/createStudyMap.js';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {sampleTerrainHeight,validateTerrain} from '../src/world/terrain.js';
import {validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {createTerrainGeometry} from '../src/rendering/terrainGeometry.js';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';

const examples=Object.keys(STUDIES).flatMap(kind=>STUDY_SEEDS.map(seed=>[kind,seed]));
test('six study maps are repeatable, terrain-feasible and connected; steep faces are actually blocked',()=>{
 for(const [kind,seed]of examples){
  const map=createStudyMap(kind,seed);assert.deepEqual(createStudyMap(kind,seed),map);validateTerrain(map);validateTrailTerrain(map);
  assert.equal(map.width,64);assert.equal(map.height,64);assert.ok(map.elevation.cornerHeights.every(Number.isFinite));
  const trail=new Set(map.pathNetwork.trailCells),queue=[[...trail][0]],seen=new Set(queue);
  for(let h=0;h<queue.length;h++)for(const j of [queue[h]-64,queue[h]+1,queue[h]+64,queue[h]-1])if(trail.has(j)&&!seen.has(j)
    &&Math.abs(queue[h]%64-j%64)+Math.abs(Math.floor(queue[h]/64)-Math.floor(j/64))===1){seen.add(j);queue.push(j);}
  assert.equal(seen.size,trail.size);
  for(const [i,c]of map.cells.entries()){
   if(c.slope>20)assert.equal(c.walkable,false);
   if(c.terrain==='rock')assert.equal(c.fuelType,'none');
   if(trail.has(i))assert.deepEqual([c.terrain,c.fuelType,c.walkable],['trail','none',true]);
  }
  if(kind==='plateau'){assert.ok(map.prototype.trailRise>2.5);assert.ok(map.cells.some(c=>c.slope>55));}
  if(kind==='ridge'){assert.ok(map.cells.some(c=>c.slope>40));assert.ok(map.cells.some(c=>c.terrain==='dry-channel'));}
  if(kind==='woodland')assert.ok(map.cells.filter(c=>c.terrain==='grass'&&c.slope<5).length>100);
 }
 for(const kind of Object.keys(STUDIES))assert.notDeepEqual(createStudyMap(kind,7).elevation.cornerHeights,createStudyMap(kind,2026).elevation.cornerHeights);
});

test('study geometry and offset picking agree with the authoritative shared heights',()=>{
 for(const [kind,seed]of examples){
  const map=createStudyMap(kind,seed),g=createTerrainGeometry(map),p=g.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-sampleTerrainHeight(map,p.getX(i)/.5+32,p.getZ(i)/.5+32))<1e-6);
  const camera=new PerspectiveCamera(43,1.5,.1,160);camera.position.set(0,50,0);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const picker=createGroundPicker(camera,{getBoundingClientRect:()=>({left:20,top:170,width:900,height:600})},map);
  for(const i of map.pathNetwork.trailCells.filter((_,n)=>n%12===0)){
   const x=i%64+.5,z=Math.floor(i/64)+.5,point=new Vector3((x-32)*.5,sampleTerrainHeight(map,x,z),(z-32)*.5).project(camera);
   assert.equal(picker(20+(point.x+1)*450,170+(1-point.y)*300),i);
  }
  assert.equal(picker(10,180),null);picker.dispose();g.dispose();
 }
});

test('original modular dressing follows its own classified cell; replacement resources dispose once',()=>{
 for(const [kind,seed]of examples){
  const map=createStudyMap(kind,seed),before=structuredClone(map),view=createStudyView(map),again=createStudyView(map);
  assert.deepEqual(view.placements,again.placements);assert.ok(view.placements.trees.flat().length>80);
  for(const [name,items]of [['forest',view.placements.trees.flat()],['grass',view.placements.grass],['rock',view.placements.rocks.flat()]])for(const p of items){
   assert.equal(map.cells[p.index].terrain,name);assert.equal(p.y,sampleTerrainHeight(map,p.x/.5+32,p.z/.5+32));
   assert.notEqual(map.cells[p.index].terrain,'trail');
  }
  const resources=new Set();view.group.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);});
  const disposed=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>disposed.set(r,disposed.get(r)+1));
  view.dispose();view.dispose();again.dispose();for(const count of disposed.values())assert.equal(count,1);
  assert.deepEqual(map,before);
 }
});
