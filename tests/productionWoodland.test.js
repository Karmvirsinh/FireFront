import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Vector3,PerspectiveCamera,Raycaster} from 'three';
import {createGeneratedMap,createGeneratedMapV11} from '../src/world/generation/createGeneratedMap.js';
import {sampleTerrainHeight,terrainCellGradients,validateTerrain} from '../src/world/terrain.js';
import {terrainTrailCell,validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {createTerrainGeometry} from '../src/rendering/terrainGeometry.js';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';
import {Mesh,MeshBasicMaterial} from 'three';
import {createVegetationView} from '../src/rendering/createVegetationView.js';
import {createFireView} from '../src/rendering/createFireView.js';
import {createWoodlandLayout} from '../src/rendering/woodlandComposition.js';
import {woodlandCharacter} from '../src/world/generation/woodlandCharacter.js';
import roster from '../src/rendering/data/natureRosterManifest.json' with {type:'json'};

test('nonaligned fine surface controls sampling, conservative20degree eligibility and actual ground picking',()=>{
 const heights=Array(36).fill(0);heights[3*6+3]=1;
 const map={width:2,height:2,cellSize:1,elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array(9).fill(0),surface:{width:5,height:5,cellSize:.4,units:'world',triangulation:'nw-se',cornerHeights:heights}}};
 validateTerrain(map);assert.equal(sampleTerrainHeight(map,1.2,1.2),1);assert.equal(terrainTrailCell(map,3),false);assert.ok(terrainCellGradients(map,3)[0]>Math.tan(20*Math.PI/180));
 const mesh=new Mesh(createTerrainGeometry(map),new MeshBasicMaterial()),camera=new PerspectiveCamera(45,1,.1,50);camera.position.set(.2,10,.2);camera.lookAt(.2,0,.2);camera.updateMatrixWorld();
 let disposed=0;mesh.geometry.addEventListener('dispose',()=>disposed++);
 const picker=createGroundPicker(camera,{getBoundingClientRect:()=>({left:10,top:20,width:400,height:400})},map,mesh);
 try{assert.equal(picker(210,220),3);const ray=new Raycaster(new Vector3(.2,10,.2),new Vector3(0,-1,0));assert.ok(Math.abs(ray.intersectObject(mesh)[0].point.y-1)<1e-6);picker.dispose();assert.equal(disposed,0);}finally{mesh.geometry.dispose();mesh.material.dispose();}
});

test('v12 maps are deterministic257corner continuous fields with every spawn/network slope safe; v11 retained',()=>{
 for(const seed of [0,2,7,34,2026]){
  const map=createGeneratedMap(seed);assert.equal(map.width,104);assert.equal(map.spawnCells.length,20);assert.equal(map.generation.version,'forest-woodland-v12');assert.equal(map.elevation.surface.cornerHeights.length,257*257);assert.deepEqual(createGeneratedMap(seed),map);validateTrailTerrain(map);
  assert.equal(map.elevation.generation.gradingMaxDisplacement,0);assert.equal(map.rendering.woodlandCharacter,woodlandCharacter(seed));
  assert.ok(map.cells.some(c=>c.fuelType!=='none'));assert.ok(map.cells.some(c=>c.surfaceCover==='mineral'));assert.ok(map.cells.some((c,i)=>c.fuelType!=='none'&&terrainCellGradients(map,i)[0]>Math.tan(20*Math.PI/180)),'vegetated slopes remain fuel-bearing');
  const coarse={...map,elevation:{...map.elevation,surface:undefined}};let added=0;for(let n=1;n<100;n++){const x=(n*13.17)%104,z=(n*7.31)%104;added=Math.max(added,Math.abs(sampleTerrainHeight(map,x,z)-sampleTerrainHeight(coarse,x,z)));}assert.ok(added>.001,'actual field detail, not subdivision');
 }
 const old=createGeneratedMapV11(7);assert.equal(old.generation.version,'forest-composition-v11');assert.equal(old.elevation.surface,undefined);assert.equal(old.cells[80*104+39].fuelType,'none');
});

const snapshot=v=>v.group.children.map(m=>[m.name,m.instanceMatrix.array.slice(),m.instanceColor.array.slice()]);
test('curated woodland themes/ownership are reproducible, radius-safe, fuel-independent and lifecycle/reset exact',()=>{
 assert.equal(roster.filter(m=>m.kind==='tree').length,16);assert.ok(roster.every(m=>!/(palm|cactus|_dark|_fall)/.test(m.name)));
 const themes=new Set();
 for(const seed of [0,2,7,34]){
  const map=createGeneratedMap(seed),before=structuredClone(map),layout=createWoodlandLayout(map);themes.add(layout.character);assert.deepEqual(createWoodlandLayout(map),layout);
  const view=createVegetationView(map),initial=snapshot(view),matrix=new Matrix4(),fire=createFireView(map,{treeCells:view.treeCells,treeHeight:1,vegetationPoses:view.firePoses});
  try{
   for(const items of [layout.trees,layout.brush,layout.grass])for(const p of items){assert.notEqual(map.cells[p.cell].fuelType,'none');assert.equal(Math.floor(p.gz)*104+Math.floor(p.gx),p.cell);assert.equal(p.y,sampleTerrainHeight(map,p.gx,p.gz));
    const reach=Math.ceil(p.radius/.5)+1;for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){const x=Math.floor(p.gx)+dx,z=Math.floor(p.gz)+dz;if(x<0||z<0||x>=104||z>=104||!map.navigation.allowedCells[z*104+x])continue;assert.ok(Math.hypot(Math.max(x-p.gx,0,p.gx-x-1),Math.max(z-p.gz,0,p.gz-z-1))*.5>=p.radius+.039999);}
   }
   for(const mesh of view.group.children){const a=mesh.geometry.attributes.position;let r=0;for(let n=0;n<a.count;n++)r=Math.max(r,Math.hypot(a.getX(n),a.getZ(n)));for(const p of mesh.userData.placements)assert.ok(r*p.scale[0]<=p.radius+1e-5);}
   const p=layout.trees[0];view.sync(p.cell,'burning');fire.sync(p.cell,'burning');
   for(const mesh of view.group.children.filter(m=>m.name.startsWith('tree-'))){const slot=mesh.userData.cells.indexOf(p.cell);if(slot<0)continue;mesh.getMatrixAt(slot,matrix);assert.deepEqual(Array.from(matrix.elements),Array.from(initial.find(a=>a[0]===mesh.name)[1].slice(slot*16,slot*16+16)));}
   const pose=view.firePoses.get(p.cell),flames=fire.group.getObjectByName('tree-flames');flames.getMatrixAt(flames.userData.cells.indexOf(p.cell),matrix);assert.ok(new Vector3().setFromMatrixPosition(matrix).distanceTo(new Vector3(p.x,p.y,p.z))<1e-5);assert.ok(pose.height>0);
   for(const state of ['burned-hot','burned-cool']){view.sync(p.cell,state);fire.sync(p.cell,state);flames.getMatrixAt(flames.userData.cells.indexOf(p.cell),matrix);assert.equal(new Vector3().setFromMatrixScale(matrix).length(),0);}
   view.sync(p.cell,'unburned');fire.sync(p.cell,'unburned');assert.deepEqual(snapshot(view),initial);assert.deepEqual(map,before);
  }finally{fire.dispose();view.dispose();view.dispose();}
 }
 assert.equal(themes.size,4);
});
