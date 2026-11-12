import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurfaceCoverage} from '../src/rendering/surfaceCoverage.js';
import {createSurfaceMaterials} from '../src/rendering/surfaceMaterials.js';
import {createGeneratedMap} from '../src/world/generation/createGeneratedMap.js';

function sample(t,x,z,channel=0){
 const px=x*t.width/t.logicalWidth-.5,pz=z*t.height/t.logicalHeight-.5;
 const ix=Math.floor(px),iz=Math.floor(pz),u=px-ix,v=pz-iz;
 const at=(x,z)=>t.data[(Math.max(0,Math.min(t.height-1,z))*t.width+Math.max(0,Math.min(t.width-1,x)))*4+channel]/255;
 return (at(ix,iz)*(1-u)+at(ix+1,iz)*u)*(1-v)+(at(ix,iz+1)*(1-u)+at(ix+1,iz+1)*u)*v;
}
const compile=m=>{const s={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};m.onBeforeCompile(s);return s;};

test('bare union interiors and boundaries stay bare, shoulders are continuous, distant fuel stays regional',()=>{
 const map={width:12,height:10,cells:Array.from({length:120},()=>({terrain:'vegetation',fuelType:'grass'}))};
 map.cells[4*12+4]={terrain:'clearing',fuelType:'none'};
 map.cells[4*12+5]={terrain:'obstacle',fuelType:'none'};
 map.cells[4*12+8]={terrain:'vegetation',fuelType:'none',surfaceReason:'exposed-tableland-riser'};
 const before=structuredClone(map),t={...createSurfaceCoverage(map),logicalWidth:12,logicalHeight:10};
 // Include corners/edges, not only texel centres: no green leaks into nonfuel.
 for(let x=4;x<=6;x+=.05)for(let z=4;z<=5;z+=.05)assert.equal(sample(t,x,z),1);
 assert.equal(sample(t,4.5,4.5,1),0,'scattered blockers do not stamp rock');
 assert.equal(sample(t,8.5,4.5,1),1,'explicit mineral face owns rock coverage');
 assert.equal(sample(t,.5,.5),0);
 let previous=1;
 for(let x=3.99;x>=1.5;x-=.01){const s=sample(t,x,4.5);assert.ok(s<=previous+1e-8);assert.ok(Math.abs(s-previous)<.015,'no categorical seam');previous=s;}
 assert.deepEqual(map,before);assert.deepEqual(createSurfaceCoverage(map).data,t.data);
});

test('current production uses shared continuous surface, exact safety masks and stable reset without map changes',()=>{
 const map=createGeneratedMap(34),before=structuredClone(map),finish=createSurfaceMaterials(map,{simulator:true});
 try{
  const shader=compile(finish.ground),u=shader.uniforms,t=u.studyTreatment.value.image;
  assert.equal(t.width,416);assert.equal(t.height,416);
  const data={...t,logicalWidth:104,logicalHeight:104};
  for(let i=0;i<map.cells.length;i++){
   const c=map.cells[i];if(c.fuelType==='none'&&!['route','start','safe'].includes(c.terrain))assert.equal(sample(data,i%104+.5,Math.floor(i/104)+.5),1);
  }
  const original=t.data.slice(),fire=u.studyFire.value.image.data,regions=u.studyRegions.value.image.data.slice();
  const i=map.cells.findIndex(c=>c.fuelType!=='none');
  for(const state of ['burning','burned-hot','burned-cool']){finish.setFireState(i,state);finish.flush();assert.ok(fire[i*4]>0);}
  finish.setFireState(i,'unburned');finish.flush();assert.equal(fire[i*4],0);
  assert.deepEqual(t.data,original);assert.deepEqual(u.studyRegions.value.image.data,regions);assert.deepEqual(map,before);
  // Comparison shader remains its accepted branch; production keeps the same
  // rock/floor/triplanar expressions, with bare coverage rather than kind paint.
  assert.ok(shader.fragmentShader.includes('continuousFloor'));
  assert.ok(shader.fragmentShader.includes('shoulder.g*bareCover*(.18+.82*rock)'));
 }finally{finish.resources.forEach(r=>r.dispose());}
});
