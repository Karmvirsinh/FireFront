import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudyMap} from '../src/prototype/createStudyMap.js';
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';
import {createSurfaceRegions} from '../src/prototype/surfaceRegions.js';

const maps=()=>[createStudyMap('woodland',7),createStudyMap('plateau',34),createStudyMap('ridge',913),createGaeaStudyMap(129),createGaeaStudyMap(257)];

test('seeded substrate regions are coherent, varied within woodland and independent of tree positions or mesh mode',()=>{
 for(const map of maps()){
  const before=structuredClone(map),a=createSurfaceRegions(map);assert.deepEqual(a,createSurfaceRegions(map));assert.deepEqual(map,before);
  const litter=map.cells.flatMap((c,i)=>c.terrain==='forest'?[a.data[i*4+1]]:[]);
  assert.ok(Math.min(...litter)<50);assert.ok(Math.max(...litter)>210);
  let change=0,n=0;for(let z=0;z<map.height;z++)for(let x=1;x<map.width;x++)for(let c=0;c<4;c++){const i=(z*map.width+x)*4+c;change+=Math.abs(a.data[i]-a.data[i-4]);n++;}
  assert.ok(change/n<20,'regional transitions, not independent per-cell colors');
  const other=structuredClone(map);other.prototype.seed++;assert.notDeepEqual(a.data,createSurfaceRegions(other).data);
 }
 assert.deepEqual(createSurfaceRegions(createGaeaStudyMap(129)),createSurfaceRegions(createGaeaStudyMap(257)));
});
