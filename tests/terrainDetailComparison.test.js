import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';
import {createStudyMap} from '../src/prototype/createStudyMap.js';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {sampleStudyHeight,displayedSurface,createStudyPicker} from '../src/prototype/studySurface.js';
import {createScanView,scanCellIndices} from '../src/prototype/createScanView.js';
import {createCellOutline} from '../src/prototype/createCellOutline.js';
import {inspectTraversal} from '../src/prototype/traversalScan.js';

test('fine exported mesh preserves world extent, coarse data and range; it is not coarse interpolation',()=>{
 const low=createGaeaStudyMap(129),high=createGaeaStudyMap(257),fine=displayedSurface(high);
 assert.deepEqual(high.cells,low.cells);assert.deepEqual(high.navigation,low.navigation);assert.deepEqual(high.elevation,low.elevation);
 assert.equal(fine.width*fine.cellSize,32);assert.equal(high.width,128);
 for(const name of ['min','max'])assert.equal(Math[name](...fine.elevation.cornerHeights),Math[name](...low.elevation.cornerHeights));
 for(let z=0;z<=128;z++)for(let x=0;x<=128;x++)assert.equal(fine.elevation.cornerHeights[z*2*257+x*2],low.elevation.cornerHeights[z*129+x]);
 assert.ok(Array.from({length:128},(_,i)=>Math.abs(sampleStudyHeight(high,i+.5,64.5)-sampleStudyHeight(low,i+.5,64.5))).some(d=>d>.01));
});

test('both displayed meshes drive geometry, placement, oblique offset picking and selected cell boundaries',()=>{
 const maps=[createGaeaStudyMap(129),createGaeaStudyMap(257)],views=maps.map(createStudyView);
 assert.equal(views[1].ground.geometry.attributes.position.count,views[0].ground.geometry.attributes.position.count*4);
 for(let n=0;n<2;n++){
  const map=maps[n],view=views[n],p=view.ground.geometry.attributes.position;
  for(let i=0;i<p.count;i+=11)assert.ok(Math.abs(p.getY(i)-sampleStudyHeight(map,p.getX(i)/.25+64,p.getZ(i)/.25+64))<1e-5);
  for(const items of [...view.placements.trees,view.placements.grass,...view.placements.rocks])for(const item of items)assert.equal(item.y,sampleStudyHeight(map,item.x/.25+64,item.z/.25+64));
  const camera=new PerspectiveCamera(43,1.5,.1,160);camera.position.set(14,37,21);camera.lookAt(0,1,0);camera.updateMatrixWorld();
  const picker=createStudyPicker(camera,{getBoundingClientRect:()=>({left:23,top:180,width:900,height:600})},map);
  for(const [x,z]of [[64,64],[80,70],[40,95]]){
   const point=new Vector3((x+.5-64)*.25,sampleStudyHeight(map,x+.5,z+.5),(z+.5-64)*.25).project(camera);
   assert.equal(picker(23+(point.x+1)*450,180+(1-point.y)*300),z*128+x);
  }
  const outline=createCellOutline(map,70*128+80),op=outline.mesh.geometry.attributes.position;
  for(let i=0;i<op.count;i++)assert.ok(Math.abs(op.getY(i)-sampleStudyHeight(map,op.getX(i)/.25+64,op.getZ(i)/.25+64)-.055)<1e-5);
  outline.dispose();outline.dispose();picker.dispose();view.dispose();
 }
 const withoutHeight=placements=>JSON.parse(JSON.stringify(placements,(key,value)=>key==='y'?undefined:value));
 assert.deepEqual(withoutHeight(views[0].placements),withoutHeight(views[1].placements));
});

test('Rugged/913 and Mixed/34 scans include every actual trail cell without canopy-based blocking',()=>{
 for(const [kind,seed]of [['ridge',913],['plateau',34]]){
  const map=createStudyMap(kind,seed),indices=new Set(scanCellIndices(map)),before=structuredClone(map);
  assert.ok(map.pathNetwork.trailCells.every(i=>indices.has(i)));
  assert.ok(map.pathNetwork.trailCells.every(i=>inspectTraversal(map,i).pathAllowed&&inspectTraversal(map,i).symbol!=='cross'));
  const scan=createScanView(map);assert.ok(scan.markers.length<1400);scan.dispose();assert.deepEqual(map,before);
 }
 const coarse=createGaeaStudyMap(129),fine=createGaeaStudyMap(257);
 for(let i=0;i<coarse.cells.length;i+=19){assert.equal(inspectTraversal(coarse,i).symbol,inspectTraversal(fine,i).symbol);assert.match(inspectTraversal(fine,i).reason,/Displayed fine-face maximum/);}
});

test('original material textures, boundary finish and all replacement resources dispose once',()=>{
 const map=createStudyMap('plateau',34),before=structuredClone(map),a=createStudyView(map),b=createStudyView(map);
 assert.deepEqual(a.placements,b.placements);assert.deepEqual(map,before);
 const observed=new Map();for(const group of [a.group])group.traverse(o=>{if(o.geometry)observed.set(o.geometry,0);if(o.material)observed.set(o.material,0);});
 for(const r of observed.keys())r.addEventListener('dispose',()=>observed.set(r,observed.get(r)+1));
 // Verify the shader owns deterministic reusable texture data without requiring WebGL in Node.
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};
 a.ground.material.onBeforeCompile(shader);
 for(const name of ['studyMeadow','studyDirt','studyForest','studyStone','studyCoverage']){const t=shader.uniforms[name].value;observed.set(t,0);t.addEventListener('dispose',()=>observed.set(t,observed.get(t)+1));assert.ok(t.image.data.some(v=>v>0));}
 a.dispose();a.dispose();b.dispose();assert.ok([...observed.values()].every(n=>n===1));
});
