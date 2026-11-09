import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurfaceArtwork,createStudyMaterials} from '../src/prototype/surfaceMaterials.js';
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';

test('substrates have reproducible distinct artwork, restrained fine detail and unobtrusive repeat seams',()=>{
 const a=createSurfaceArtwork(),b=createSurfaceArtwork();assert.deepEqual(a,b);
 const gradients={};
 for(const [name,{data,size}]of Object.entries(a)){
  let local=0,seam=0,verticalSeam=0;
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const i=(z*size+x)*4;assert.equal(data[i+3],255);
   if(x)local+=Math.abs(data[i]-data[i-4]);
   else seam+=Math.abs(data[i]-data[(z*size+size-1)*4]);
   if(z===0)verticalSeam+=Math.abs(data[i]-data[((size-1)*size+x)*4]);
  }
  gradients[name]=local/(size*(size-1));
  // No high-contrast repeating edge; average adjacent-pixel change remains
  // below one 8-bit level rather than spray-like contrast across every pixel.
  assert.ok(seam/size<1,name);assert.ok(verticalSeam/size<1,name);assert.ok(gradients[name]<1,name);
 }
 assert.ok(gradients.meadow<gradients.forest);assert.ok(gradients.meadow<gradients.stone);
 for(const x of Object.keys(a))for(const y of Object.keys(a))if(x!==y)assert.notDeepEqual(a[x].data,a[y].data);
});

test('shared surface artwork is independent of displayed mesh resolution and leaves logical maps unchanged',()=>{
 const maps=[createGaeaStudyMap(129),createGaeaStudyMap(257)],before=maps.map(m=>structuredClone(m)),finishes=maps.map(createStudyMaterials);
 const shaders=finishes.map(f=>{const s={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};f.ground.onBeforeCompile(s);return s;});
 for(const name of ['studyMeadow','studyDirt','studyForest','studyStone','studyGravel','studyCoverage','studyRegions'])assert.deepEqual(shaders[0].uniforms[name].value.image.data,shaders[1].uniforms[name].value.image.data);
 assert.deepEqual(maps,before);
 for(const finish of finishes){let count=0;finish.resources.forEach(r=>r.addEventListener('dispose',()=>count++));finish.resources.forEach(r=>r.dispose());assert.equal(count,finish.resources.length);}
});
