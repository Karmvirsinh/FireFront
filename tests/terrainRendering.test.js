import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { sampleTerrainHeight } from '../src/world/terrain.js';
import { createTerrainGeometry, createTerrainSkirt } from '../src/rendering/terrainGeometry.js';
import { createGroundPicker } from '../src/rendering/createGroundPicker.js';

test('terrain triangles match authoritative samples, exact cell boundaries and upright picking across views',()=>{
 const map=createGeneratedMap(34), geometry=createTerrainGeometry(map), positions=geometry.getAttribute('position');
 assert.equal(positions.count,map.cells.length*6);
 for(let v=0;v<positions.count;v++) {
  const x=positions.getX(v)/map.cellSize+map.width/2,z=positions.getZ(v)/map.cellSize+map.height/2;
  assert.ok(Math.abs(positions.getY(v)-sampleTerrainHeight(map,x,z))<1e-6);
 }
 const canvas={getBoundingClientRect:()=>({left:73,top:111,width:800,height:500})};
 const camera=new PerspectiveCamera(45,1.6,.1,500),pick=createGroundPicker(camera,canvas,map);
 for(const eye of [[0,35,25],[-25,24,0],[20,18,-20]]) {
  camera.position.set(...eye);camera.lookAt(0,1,0);camera.updateMatrixWorld();
  for(const [x,z] of [[23,35],[32,32],[14,23]]) {
   const point=new Vector3((x+.5-map.width/2)*map.cellSize,sampleTerrainHeight(map,x+.5,z+.5),(z+.5-map.height/2)*map.cellSize).project(camera);
   assert.equal(pick(73+(point.x+1)*400,111+(1-point.y)*250),z*map.width+x);
  }
 }
 let disposed=false;geometry.addEventListener('dispose',()=>disposed=true);geometry.dispose();assert.ok(disposed);
 pick.dispose();
 const skirt=createTerrainSkirt(map),p=skirt.geometry.getAttribute('position');
 for(let v=0;v<p.count;v++) assert.ok(Math.abs(p.getX(v))===16 || Math.abs(p.getZ(v))===16,'sides only; no hidden cap');
 skirt.geometry.dispose();skirt.material.dispose();
});
import { createFireView } from '../src/rendering/createFireView.js';
test('elevated ember vertices conform to terrain and cooling/reset remove them',()=>{
 const map=createGeneratedMap(34),view=createFireView(map,{treeCells:new Set(),treeHeight:1});
 const index=35*64+23,mesh=view.group.getObjectByName('fire-embers');
 view.sync(index,'burned-hot');
 const vertices=mesh.geometry.getAttribute('position'),start=index*vertices.count/map.cells.length;
 for(let v=start;v<start+vertices.count/map.cells.length;v++) {
  const x=vertices.getX(v)/map.cellSize+map.width/2,z=vertices.getZ(v)/map.cellSize+map.height/2;
  assert.ok(vertices.getY(v)>sampleTerrainHeight(map,x,z));
  assert.ok(vertices.getY(v)-sampleTerrainHeight(map,x,z)<.04);
 }
 for(const state of ['burned-cool','unburned']) {
  view.sync(index,state);
  for(let v=start;v<start+vertices.count/map.cells.length;v++) assert.equal(vertices.getY(v),0);
 }
 view.dispose();
});
