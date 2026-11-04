import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV7 as createGeneratedMap,createGeneratedMapV7Baseline} from '../src/world/generation/createGeneratedMap.js';
import {validateTerrainSlopes} from '../src/world/generation/createTerrain.js';
import {STRUCTURE_SETTINGS,inspectStructure} from '../src/world/generation/createTerrainStructure.js';
import {terrainCellGradients,sampleTerrainHeight} from '../src/world/terrain.js';
import {createTerrainTiles,createTerrainGeometry} from '../src/rendering/terrainGeometry.js';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';
import {Color,PerspectiveCamera,Vector3} from 'three';

test('terrain structure families preserve exact v7 forests, endpoints and full trail network; quality survives fitting',()=>{
 const families=new Set();let boundary=false,retried=false;
 for(const seed of [...Array.from({length:64},(_,i)=>i),2026,4294967295]){
  const map=createGeneratedMap(seed),g=map.elevation.generation;families.add(g.family);retried||=g.attempt>0;
  assert.equal(g.version,'terrain-structure-v3');validateTerrainSlopes(map,STRUCTURE_SETTINGS);
  assert.deepEqual(inspectStructure(map,g.landforms,-g.heightOffset),g.quality);
  const old=createGeneratedMapV7Baseline(seed);
  for(const key of ['cells','pathNetwork','navigation','start','safeZone','spawnCells','rendering'])assert.deepEqual(map[key],old[key]);
  assert.ok(map.elevation.cornerHeights.every(Number.isFinite));
  assert.ok(Math.max(...map.elevation.cornerHeights)<=9);
  if(g.family==='lowland')assert.ok(Math.max(...map.elevation.cornerHeights)<2);
  else{
   for(let i=0;i<g.landforms.plateaus.length;i++){
    const q=g.quality.plateaus[i];assert.ok(q.topCells>=40&&q.riserCells>=10);
    if(g.landforms.plateaus[i].terraced)assert.ok(q.shelfCells>=15);
   }
   boundary||=g.landforms.plateaus.some(p=>p.x-p.rx<0||p.z-p.rz<0||p.x+p.rx>52||p.z+p.rz>52);
  }
  if([0,7,34,2026].includes(seed))assert.deepEqual(createGeneratedMap(seed),map);
 }
 assert.equal(families.size,3);assert.ok(boundary);assert.ok(retried);
});

test('steep rock/earth finish is surface-only, fire colors override it and reset restores it',()=>{
 const map=createGeneratedMap(0),before=structuredClone(map),mesh=createTerrainTiles(map),green=new Color(0x345b44),actual=new Color();
 const index=map.cells.findIndex((c,i)=>c.fuelType==='forest'&&terrainCellGradients(map,i)[0]>Math.tan(40*Math.PI/180));
 assert.ok(index>=0);mesh.setColorAt(index,green);mesh.getColorAt(index,actual);assert.notEqual(actual.getHex(),green.getHex());
 mesh.setColorAt(index,new Color(0x332a29),false);mesh.getColorAt(index,actual);assert.equal(actual.getHex(),0x332a29);
 mesh.setColorAt(index,green);mesh.getColorAt(index,actual);assert.notEqual(actual.getHex(),green.getHex());
 assert.deepEqual(map,before);mesh.geometry.dispose();mesh.material.dispose();
});

test('plateau and riser sampling agree with rendered geometry and ground-only picking at oblique views',()=>{
 const map=createGeneratedMap(0),geometry=createTerrainGeometry(map),positions=geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++)assert.ok(Math.abs(positions.getY(i)-sampleTerrainHeight(map,positions.getX(i)/.5+52,positions.getZ(i)/.5+52))<1e-6);
 const camera=new PerspectiveCamera(45,1.6,.1,1500),canvas={getBoundingClientRect:()=>({left:10,top:90,width:800,height:500})};
 const picker=createGroundPicker(camera,canvas,map);
 camera.position.set(0,65,40);camera.lookAt(0,3,0);camera.updateMatrixWorld();
 for(const [x,z] of [[30,30],[70,60],[90,90]]){
  const p=new Vector3((x+.5-52)*.5,sampleTerrainHeight(map,x+.5,z+.5),(z+.5-52)*.5).project(camera);
  assert.equal(picker(10+(p.x+1)*400,90+(1-p.y)*250),z*104+x);
 }
 picker.dispose();geometry.dispose();
});
