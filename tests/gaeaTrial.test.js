import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import data from '../src/prototype/data/gaeaSandstone.json' with {type:'json'};
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {createScanView} from '../src/prototype/createScanView.js';
import {sampleTerrainHeight,validateTerrain} from '../src/world/terrain.js';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';

test('real Gaea export retains scaling, separate mask and shared-corner data without live generator adoption',()=>{
 const map=createGaeaStudyMap(),again=createGaeaStudyMap();validateTerrain(map);assert.deepEqual(map,again);
 assert.equal(map.width,128);assert.equal(map.width*map.cellSize,32);assert.equal(data.resolution,512);
 assert.deepEqual(data.files.map(f=>f.range16),[[0,21766],[0,29256]]);
 assert.equal(map.elevation.cornerHeights.length,129**2);assert.equal(map.surfaceLayers.length,128**2);
 assert.ok(Math.max(...map.elevation.cornerHeights)>5&&Math.max(...map.elevation.cornerHeights)<5.4);
 assert.ok(map.surfaceLayers.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
 assert.equal(map.pathNetwork.trailCells.length,0);assert.ok(map.navigation.allowedCells.every(x=>!x));
 map.elevation.cornerHeights[0]=99;assert.notEqual(again.elevation.cornerHeights[0],99);
});

test('imported surface, dressing, ground picking and scan use its actual 128-cell dimensions and dispose',()=>{
 const map=createGaeaStudyMap(),view=createStudyView(map),scan=createScanView(map,4);
 assert.equal(scan.markers.length,1024);
 const p=view.ground.geometry.attributes.position;
 for(let i=0;i<p.count;i+=29)assert.ok(Math.abs(p.getY(i)-sampleTerrainHeight(map,p.getX(i)/.25+64,p.getZ(i)/.25+64))<1e-5);
 for(const items of [...view.placements.trees,view.placements.grass,...view.placements.rocks])for(const item of items){
  assert.equal(Math.floor(item.z/.25+64)*128+Math.floor(item.x/.25+64),item.index);
  assert.ok(Math.abs(item.y-sampleTerrainHeight(map,item.x/.25+64,item.z/.25+64))<1e-6);
 }
 const camera=new PerspectiveCamera(45,1,.1,100);camera.position.set(0,45,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const picker=createGroundPicker(camera,{getBoundingClientRect:()=>({left:40,top:120,width:600,height:600})},map);
 const point=new Vector3((80.5-64)*.25,sampleTerrainHeight(map,80.5,70.5),(70.5-64)*.25).project(camera);
 assert.equal(picker(40+(point.x+1)*300,120+(1-point.y)*300),70*128+80);
 const resources=[];view.group.traverse(o=>{if(o.geometry)resources.push(o.geometry);if(o.material)resources.push(o.material);});
 const counts=[...new Set(resources)].map(r=>{let n=0;r.addEventListener('dispose',()=>n++);return ()=>n;});
 picker.dispose();scan.dispose();scan.dispose();view.dispose();view.dispose();assert.ok(counts.every(c=>c()===1));
});
