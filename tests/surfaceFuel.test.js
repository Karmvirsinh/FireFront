import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Vector3} from 'three';
import {applySurfaceFuelCover} from '../src/world/generation/surfaceFuelCover.js';
import {createGeneratedMap,createGeneratedMapV10} from '../src/world/generation/createGeneratedMap.js';
import {FIRE_CONFIG} from '../src/simulation/fireConfig.js';
import {createFireSimulation} from '../src/simulation/createFireSimulation.js';
import {createFireView} from '../src/rendering/createFireView.js';
import {createVegetationLayout} from '../src/rendering/createVegetationLayout.js';
import {terrainCellGradients} from '../src/world/terrain.js';
import {validateGeneratedMap} from '../src/world/generation/validateGeneratedMap.js';

function fixture(vegetatedSlope=false){
 const corners=vegetatedSlope?[2,1.4,.8,.2,-.4,-1]:[2,2,2,0,0,0];
 const map={width:5,height:3,cellSize:1,generation:{seed:7},
  cells:Array.from({length:15},()=>({terrain:'vegetation',fuelType:'grass',walkable:true})),
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array.from({length:4},()=>corners).flat(),
   generation:{heightOffset:0,parameters:{stream:'simulator-landform-composition-v1'},composition:{attempt:0,emphasis:'plateau',cuts:[],raised:vegetatedSlope?[]:[{
    type:'tableland',x:-1,z:0,angle:0,height:2,riser:1,warp:0,approach:null,
    points:[[-2.5,-1.5],[-.5,-1.5],[-.5,1.5],[-2.5,1.5]]}]}}}};
 return applySurfaceFuelCover(map);
}

test('vegetated top / explicit bare face / vegetated lower ground agree with fuel and stop direct spread',()=>{
 const map=fixture(),initial=structuredClone(map),sim=createFireSimulation(map);
 for(let z=0;z<3;z++){
  assert.equal(map.cells[z*5+1].fuelType,'grass');assert.equal(map.cells[z*5+2].surfaceReason,'exposed-tableland-riser');
  assert.equal(map.cells[z*5+2].fuelType,'none');assert.equal(map.cells[z*5+3].fuelType,'grass');
  assert.ok(map.cells[z*5+2].walkable,'fuel cover does not silently alter physical walkability');
 }
 assert.equal(sim.select(7),false);assert.equal(sim.select(6),true);sim.start();
 const run=()=>{for(let n=0;n<1200;n++)sim.advance(.05);return structuredClone(sim.cells);};
 const first=run();for(let z=0;z<3;z++){assert.equal(sim.cells[z*5+2].state,'unburned');assert.equal(sim.cells[z*5+3].state,'unburned');}
 sim.reset();assert.equal(sim.cells[6].fuel,FIRE_CONFIG.fuelByType.grass);sim.select(6);sim.start();assert.deepEqual(run(),first);assert.deepEqual(map,initial);
});

test('continuous vegetated slope spreads above the walking limit without a blanket slope barrier',()=>{
 const map=fixture(true),sim=createFireSimulation(map);
 assert.ok(terrainCellGradients(map,6).every(g=>Math.atan(g)*180/Math.PI>20));
 assert.ok(map.cells.every(c=>c.fuelType==='grass'&&c.surfaceCover==='vegetated'));
 sim.select(6);sim.start();for(let n=0;n<160;n++)sim.advance(.05);
 assert.equal(sim.cells[8].state,'burning');
});

test('seed7 reported top stays fuel-bearing, narrow exposed flank becomes nonfuel; wider steep vegetation survives',()=>{
 const map=createGeneratedMap(7),old=createGeneratedMapV10(7),sim=createFireSimulation(map);
 assert.equal(map.generation.version,'forest-composition-v11');assert.deepEqual(createGeneratedMap(7),map);
 assert.deepEqual(map.elevation,old.elevation);assert.deepEqual(map.pathNetwork,old.pathNetwork);
 assert.deepEqual(map.spawnCells,old.spawnCells);assert.deepEqual(map.navigation,old.navigation);
 assert.deepEqual(map.cells.map(c=>c.walkable),old.cells.map(c=>c.walkable));
 assert.equal(map.cells[80*104+37].fuelType,'forest');
 for(let x=38;x<=44;x++){assert.equal(map.cells[80*104+x].fuelType,'none');assert.equal(sim.eligible(80*104+x),false);}
 assert.ok(map.cells.some((c,i)=>c.fuelType!=='none'&&Math.atan(Math.max(...terrainCellGradients(map,i)))*180/Math.PI>35));
 const layout=createVegetationLayout(map);for(const items of Object.values(layout))for(const p of items)assert.notEqual(map.cells[p.cell].surfaceCover,'mineral');
 sim.select(80*104+37);sim.start();for(let n=0;n<300;n++)sim.advance(.05);
 for(let x=38;x<=44;x++)assert.equal(sim.cells[80*104+x].state,'unburned');
 const invalid=structuredClone(map);invalid.cells[80*104+39].fuelType='forest';assert.throws(()=>validateGeneratedMap(invalid),/surface cover disagrees/);
});

test('nonburning mineral faces never display flames/embers, neighboring flames stay inside the fuel footprint',()=>{
 const map=fixture(),index=6,pose={gx:1.85,gz:1.5,height:3,radius:1,kind:'crown'};
 const view=createFireView(map,{treeCells:new Set([index]),treeHeight:1,vegetationPoses:new Map([[index,pose]])});
 try{
  for(const state of ['burning','burned-hot','burned-cool']){
   view.sync(7,state);view.animate(1,false);
   const flame=view.group.getObjectByName('fire-flames'),m=new Matrix4();flame.getMatrixAt(7,m);assert.equal(new Vector3().setFromMatrixScale(m).length(),0);
   const ember=view.group.getObjectByName('fire-embers'),vertices=ember.geometry.attributes.position,per=vertices.count/15;
   for(let v=7*per;v<8*per;v++)assert.equal(vertices.getY(v),0);
  }
  view.sync(index,'burning');view.animate(1,false);
  const mesh=view.group.getObjectByName('tree-flames'),matrix=new Matrix4();mesh.getMatrixAt(0,matrix);
  const position=mesh.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
   const p=new Vector3().fromBufferAttribute(position,i).applyMatrix4(matrix);
   assert.ok(p.x>=-1.5&&p.x<=-.5);assert.ok(p.z>=-.5&&p.z<=.5);
  }
  view.sync(index,'unburned');mesh.getMatrixAt(0,matrix);assert.equal(new Vector3().setFromMatrixScale(matrix).length(),0);
 }finally{view.dispose();}
});

test('surface cover is deterministic and preserves heights, every trail/spawn and physical walkability across current examples',()=>{
 for(const seed of [0,7,34,2026]){
  const map=createGeneratedMap(seed),old=createGeneratedMapV10(seed);
  validateGeneratedMap(map);assert.deepEqual(createGeneratedMap(seed),map);
  for(const key of ['elevation','pathNetwork','navigation','start','safeZone','spawnCells'])assert.deepEqual(map[key],old[key]);
  assert.ok(map.cells.some(c=>c.surfaceReason));
  map.cells.forEach((cell,index)=>{
   assert.equal(cell.walkable,old.cells[index].walkable);assert.equal(cell.terrain,old.cells[index].terrain);
   if(cell.fuelType!==old.cells[index].fuelType){assert.equal(cell.fuelType,'none');assert.equal(cell.surfaceCover,'mineral');assert.ok(cell.surfaceReason);}
   if(map.navigation.allowedCells[index])assert.equal(cell.fuelType,'none');
  });
 }
});
