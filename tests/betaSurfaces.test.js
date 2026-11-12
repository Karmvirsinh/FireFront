import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV11 as createGeneratedMap} from '../src/world/generation/createGeneratedMap.js';
import {createMapView} from '../src/rendering/createMapView.js';
import {createFireSimulation} from '../src/simulation/createFireSimulation.js';
import {createSurfaceMaterials} from '../src/rendering/surfaceMaterials.js';
import {createTerrainGeometry} from '../src/rendering/terrainGeometry.js';
import {sampleTerrainHeight} from '../src/world/terrain.js';
import {prepareSurfaceGeometry} from '../src/rendering/prepareSurfaceGeometry.js';

function compile(material){const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};material.onBeforeCompile(shader);return shader;}

test('104-square surface adapter preserves map and exact categories, updates lifecycle without rebuilding regions, and restores on reset',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const map=createGeneratedMap(7),before=structuredClone(map),view=createMapView(map),fire=createFireSimulation(map);
 try{
  const ground=view.group.getObjectByName('ground-tiles'),shader=compile(ground.material),u=shader.uniforms;
  assert.equal(map.width,104);assert.equal(u.studySimulation.value,1);
  const state=u.studyFire.value,logical=u.studyLogical.value,region=u.studyRegions.value,initialRegions=region.image.data.slice(),initialState=state.image.data.slice();
  for(let i=0;i<map.cells.length;i++){
   const cell=map.cells[i],code=logical.image.data[i*4];
   if(cell.fuelType!=='none')assert.equal(code,0);
   if(cell.terrain==='route')assert.equal(code,1);
   if(cell.terrain==='clearing'&&cell.fuelType==='none')assert.equal(code,2);
   if(cell.terrain==='obstacle'&&cell.fuelType==='none')assert.equal(code,3);
  }
  const index=map.cells.findIndex(c=>c.fuelType==='grass');assert.ok(index>=0);assert.equal(fire.select(index),true);assert.equal(fire.start(),true);
  const observed=new Set();for(let step=0;step<900;step++){
   view.syncFire(fire);const code=state.image.data[index*4];observed.add(code);
   if(fire.cells[index].state==='burned-cool')break;fire.advance(.05);
  }
  assert.deepEqual([...observed].sort(),[1,2,3]);assert.deepEqual(region.image.data,initialRegions);
  fire.reset();view.syncFire(fire);assert.deepEqual(state.image.data,initialState);assert.deepEqual(region.image.data,initialRegions);
  const version=state.version;view.syncFire(fire);assert.equal(state.version,version,'no texture upload for an unchanged frame');
  assert.deepEqual(map,before);
  const counts=new Map();for(const name of ['studyMeadow','studyDirt','studyForest','studyStone','studyGravel','studyCoverage','studyRegions','studyFire','studyLogical']){const texture=u[name].value;counts.set(texture,0);texture.addEventListener('dispose',()=>counts.set(texture,counts.get(texture)+1));}
  view.dispose();assert.ok([...counts.values()].every(n=>n===1));
 }finally{globalThis.document=previous;}
});

test('regional material regeneration is deterministic and shader preparation does not move terrain or consume map data',()=>{
 const map=createGeneratedMap(34),before=structuredClone(map),a=createSurfaceMaterials(map,{simulator:true}),b=createSurfaceMaterials(map,{simulator:true});
 try{
  const sa=compile(a.ground),sb=compile(b.ground);
  for(const name of ['studyCoverage','studyRegions','studyLogical'])assert.deepEqual(sa.uniforms[name].value.image.data,sb.uniforms[name].value.image.data);
  const g=createTerrainGeometry(map),positions=g.attributes.position.array.slice();prepareSurfaceGeometry(map,g);assert.deepEqual(g.attributes.position.array,positions);
  for(let v=0;v<g.attributes.position.count;v+=7){const p=g.attributes.position;assert.ok(Math.abs(p.getY(v)-sampleTerrainHeight(map,p.getX(v)/map.cellSize+map.width/2,p.getZ(v)/map.cellSize+map.height/2))<1e-5);}
  assert.ok(g.attributes.studyBlendNormal.array.every(Number.isFinite));assert.deepEqual(map,before);g.dispose();
 }finally{a.resources.forEach(r=>r.dispose());b.resources.forEach(r=>r.dispose());}
});
