import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Vector3} from 'three';
import {createGeneratedMapV11 as createGeneratedMap} from '../src/world/generation/createGeneratedMap.js';
import {sampleTerrainHeight} from '../src/world/terrain.js';
import {createVegetationView} from '../src/rendering/createVegetationView.js';
import {createFireView} from '../src/rendering/createFireView.js';
import {createMapView} from '../src/rendering/createMapView.js';
import {createFireSimulation} from '../src/simulation/createFireSimulation.js';

function snapshot(group){return group.children.filter(m=>m.isInstancedMesh).map(m=>({name:m.name,matrix:m.instanceMatrix.array.slice(),color:m.instanceColor.array.slice()}));}

test('Beta vegetation is deterministic, terrain-anchored, fuel-owned and clear of protected paths/endpoints',()=>{
 for(const seed of [0,7,34,2026]){
  const map=createGeneratedMap(seed),before=structuredClone(map),a=createVegetationView(map),b=createVegetationView(map);
  try{
   assert.deepEqual(a.layout,b.layout);assert.deepEqual(snapshot(a.group),snapshot(b.group));assert.deepEqual(map,before);
   assert.ok(a.layout.trees.length>200&&a.layout.trees.length<map.cells.length/4);
   for(const [kind,items]of Object.entries(a.layout))for(const p of items){
    assert.equal(map.cells[p.cell].fuelType,kind==='trees'?'forest':kind);assert.equal(Math.floor(p.gz)*map.width+Math.floor(p.gx),p.cell);
    assert.equal(p.y,sampleTerrainHeight(map,p.gx,p.gz));
    const reach=Math.ceil(p.radius/map.cellSize)+1;
    for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){
     const x=Math.floor(p.gx)+dx,z=Math.floor(p.gz)+dz;if(x<0||z<0||x>=map.width||z>=map.height||!map.navigation.allowedCells[z*map.width+x])continue;
     assert.ok(Math.hypot(Math.max(x-p.gx,0,p.gx-x-1),Math.max(z-p.gz,0,p.gz-z-1))*map.cellSize>=p.radius+.039999);
    }
   }
   // The clearance radius contains the actual transformed artwork, not just its trunk.
   for(const mesh of a.group.children){const positions=mesh.geometry.attributes.position;let radius=0;for(let v=0;v<positions.count;v++)radius=Math.max(radius,Math.hypot(positions.getX(v),positions.getZ(v)));for(const p of mesh.userData.placements)assert.ok(radius*p.scale[0]<=p.radius+1e-6,mesh.name);}
  }finally{a.dispose();b.dispose();}
 }
});

test('standing trees darken until exhaustion, charred remnants persist after cooling, and all plant/reset transforms and resources restore',()=>{
 const map=createGeneratedMap(0),before=structuredClone(map),v=createVegetationView(map),initial=snapshot(v.group),matrix=new Matrix4();
 const tree=v.layout.trees[0],grass=v.layout.grass[0],brush=v.layout.brush[0];
 for(const p of [tree,grass,brush])v.sync(p.cell,'burning');
 for(const mesh of v.group.children.filter(m=>m.name.startsWith('tree-'))){const slot=mesh.userData.cells.indexOf(tree.cell);if(slot<0)continue;mesh.getMatrixAt(slot,matrix);const old=initial.find(s=>s.name===mesh.name);assert.deepEqual(matrix.elements,Array.from(new Matrix4().fromArray(old.matrix,slot*16).elements));assert.notDeepEqual(mesh.instanceColor.array,old.color);}
 const remnants=v.group.getObjectByName('charred-tree-remnants'),treeSlot=remnants.userData.cells.indexOf(tree.cell);
 for(const state of ['burned-hot','burned-cool']){
  for(const p of [tree,grass,brush])v.sync(p.cell,state);
  for(const mesh of v.group.children){const p=mesh.name==='grass-tufts'?grass:mesh.name==='brush-shrubs'?brush:tree,slot=mesh.userData.cells.indexOf(p.cell);if(slot<0)continue;mesh.getMatrixAt(slot,matrix);assert.equal(new Vector3().setFromMatrixScale(matrix).length()>0,mesh===remnants);}
 }
 for(const p of [tree,grass,brush])v.sync(p.cell,'unburned');assert.deepEqual(snapshot(v.group),initial);assert.deepEqual(map,before);
 const resources=new Set();v.group.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isInstancedMesh)resources.add(o);});
 const disposed=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>disposed.set(r,disposed.get(r)+1));v.dispose();v.dispose();assert.ok([...disposed.values()].every(n=>n===1));
});

test('flames follow actual tree, tuft and shrub bases and sizes; hot/cooled/reset remove active fire',()=>{
 const map=createGeneratedMap(34),v=createVegetationView(map),fire=createFireView(map,{treeCells:v.treeCells,treeHeight:1,vegetationPoses:v.firePoses}),matrix=new Matrix4();
 try{
  for(const p of [v.layout.trees[0],v.layout.grass[0],v.layout.brush[0]]){
   fire.sync(p.cell,'burning');const isTree=v.treeCells.has(p.cell),mesh=fire.group.getObjectByName(isTree?'tree-flames':'fire-flames'),slot=isTree?mesh.userData.cells.indexOf(p.cell):p.cell;
   mesh.getMatrixAt(slot,matrix);const at=new Vector3().setFromMatrixPosition(matrix);assert.ok(at.distanceTo(new Vector3(p.x,p.y,p.z))<1e-5);
   mesh.geometry.computeBoundingBox();const height=mesh.geometry.boundingBox.max.y*new Vector3().setFromMatrixScale(matrix).y;assert.ok(height>=v.firePoses.get(p.cell).height*.9&&height<v.firePoses.get(p.cell).height*1.3);
   for(const state of ['burned-hot','burned-cool','unburned']){fire.sync(p.cell,state);mesh.getMatrixAt(slot,matrix);assert.equal(new Vector3().setFromMatrixScale(matrix).length(),0);}
  }
 }finally{fire.dispose();v.dispose();}
});

test('normal map view uses Beta batches and real fire exhaustion/reset preserves every new vegetation instance',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const map=createGeneratedMap(0),before=structuredClone(map),view=createMapView(map),fire=createFireSimulation(map);
 try{
  const vegetation=view.group.getObjectByName('beta-vegetation');assert.ok(vegetation);assert.equal(view.group.getObjectByName('forest-crowns'),undefined);
  const initial=snapshot(vegetation),wood=vegetation.getObjectByName('tree-wood-0'),index=wood.userData.cells[0];assert.ok(fire.select(index));assert.ok(fire.start());
  view.syncFire(fire);for(let n=0;n<590;n++)fire.advance(.05);view.syncFire(fire);assert.equal(fire.cells[index].state,'burning');
  assert.deepEqual(wood.instanceMatrix.array,initial.find(s=>s.name===wood.name).matrix);
  for(let n=0;n<12;n++)fire.advance(.05);view.syncFire(fire);assert.equal(fire.cells[index].state,'burned-hot');
  fire.reset();view.syncFire(fire);assert.deepEqual(snapshot(vegetation),initial);assert.deepEqual(map,before);
 }finally{view.dispose();globalThis.document=previous;}
});
