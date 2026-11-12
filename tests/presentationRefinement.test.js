import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createStudyMap} from '../src/prototype/createStudyMap.js';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {createComparisonGeometry,refineStudySurface,comparisonTrailReport} from '../src/comparison/fineSurface.js';
import {prepareTerrainShading} from '../src/comparison/terrainShading.js';
import {loadArtwork,createDressing,comparisonPlacements} from '../src/comparison/artComparison.js';
import {configureLandscapeShadows,setLandscapeShadowFlags} from '../src/rendering/landscapeShadows.js';

test('Smooth/Faceted changes only terrain lighting, never geometry, picking, substrate normals or traversal',()=>{
 for(const corners of [65,129,257]){
  const map=createStudyMap('ridge',913);refineStudySurface(map,corners);const logical=JSON.stringify(map),route=comparisonTrailReport(map);
  const geometry=createComparisonGeometry(map),position=geometry.attributes.position.array.slice(),index=geometry.index?.array.slice(),substrate=geometry.attributes.studyBlendNormal.array.slice();
  const material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(geometry,material),set=prepareTerrainShading(mesh);
  try{
   const ray=new THREE.Raycaster(new THREE.Vector3(0,30,0),new THREE.Vector3(0,-1,0)),before=ray.intersectObject(mesh).map(h=>h.point.toArray());
   for(const mode of ['faceted','smooth','faceted','smooth']){set(mode);assert.equal(material.flatShading,mode==='faceted');assert.deepEqual(ray.intersectObject(mesh).map(h=>h.point.toArray()),before);}
   assert.deepEqual(geometry.attributes.position.array,position);assert.deepEqual(geometry.index?.array,index);assert.deepEqual(geometry.attributes.studyBlendNormal.array,substrate);assert.equal(JSON.stringify(map),logical);assert.deepEqual(comparisonTrailReport(map),route);assert.equal(mesh.material,material);
  }finally{geometry.dispose();material.dispose();}
 }
});

test('Mixed34 original trees match gallery transforms, variants, native bounds and final world bounds, not just221 count',async()=>{
 const map=createStudyMap('plateau',34),gallery=createStudyView(map),art=await loadArtwork('original'),dressing=createDressing(map,art,comparisonPlacements(map));
 try{
  let count=0,maxMatrixError=0,maxBoundError=0;
  for(let species=0;species<2;species++){
   const merged=dressing.group.getObjectByName(`comparison-tree-${species}`),wood=gallery.group.getObjectByName(`tree-wood-${species}`),foliage=gallery.group.getObjectByName(`tree-foliage-${species}`);
   assert.equal(merged.count,wood.count);count+=merged.count;
   for(const m of [merged,wood,foliage])m.geometry.computeBoundingBox();
   const native=wood.geometry.boundingBox.clone().union(foliage.geometry.boundingBox);assert.deepEqual(merged.geometry.boundingBox,native);
   for(let i=0;i<merged.count;i++){
    const a=new THREE.Matrix4(),b=new THREE.Matrix4();merged.getMatrixAt(i,a);wood.getMatrixAt(i,b);
    a.elements.forEach((v,j)=>maxMatrixError=Math.max(maxMatrixError,Math.abs(v-b.elements[j])));
    const boundA=merged.geometry.boundingBox.clone().applyMatrix4(a),boundB=native.clone().applyMatrix4(b);
    for(const key of ['min','max'])for(const axis of ['x','y','z'])maxBoundError=Math.max(maxBoundError,Math.abs(boundA[key][axis]-boundB[key][axis]));
   }
  }
  assert.equal(count,221);assert.ok(maxMatrixError<1e-6);assert.ok(maxBoundError<1e-6);
  console.log(`Mixed34 measured maximum matrix error=${maxMatrixError}; world-bound error=${maxBoundError}`);
 }finally{gallery.dispose();dressing.dispose();}
});

test('Kenney FireFront palette retains named bark/leaf/stone ownership and natural green/earth colors',async()=>{
 const loader=new GLTFLoader(),art=await loadArtwork('kenney',async name=>{const b=await readFile(new URL(`../public/comparison/kenney/${name}.glb`,import.meta.url));return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');});
 try{
  assert.equal(art.palette,'firefront');
  for(const [kind,variants]of Object.entries(art))for(const g of variants){const parts=g.attributes.artPart,colors=g.attributes.color,seen=new Set();assert.ok(parts);
   for(let i=0;i<parts.count;i++){const part=parts.getX(i),r=colors.getX(i),green=colors.getY(i),b=colors.getZ(i);seen.add(part);
    if([1,2,3,4,6].includes(part))assert.ok(green>b*1.15,'no turquoise plant parts');
    if(part===0)assert.ok(r>green&&green>b,'earthy bark');
   }
   if(kind==='tree')assert.ok(seen.has(0)&&([...seen].some(p=>p===1||p===2)),'distinct wood and foliage retained');
  }
 }finally{for(const items of Object.values(art))items.forEach(g=>g.dispose());}
});

test('map-fitted shadow camera includes boundary/canopy heights, scales resolution and disposes once',()=>{
 for(const width of [64,104]){
  const renderer={shadowMap:{}},sun=new THREE.DirectionalLight(),scene=new THREE.Scene();scene.add(sun);
  const map={width,height:width,cellSize:.5,elevation:{cornerHeights:[-.5,8]}};
  const setup=configureLandscapeShadows(renderer,sun,map);assert.equal(renderer.shadowMap.enabled,true);assert.equal(sun.castShadow,true);assert.equal(setup.size,width===104?2048:1024);
  for(const x of [setup.box.min.x,setup.box.max.x])for(const y of [setup.box.min.y,setup.box.max.y])for(const z of [setup.box.min.z,setup.box.max.z]){const p=new THREE.Vector3(x,y,z).project(sun.shadow.camera);assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&Math.abs(p.z)<=1);}
  let disposed=0;sun.shadow.map={dispose(){disposed++;}};setup.dispose();setup.dispose();assert.equal(disposed,1);assert.equal(sun.shadow.map,null);
 }
 const group=new THREE.Group(),tree=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()),fire=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),grass=tree.clone();grass.name='grass';group.add(tree,grass,fire);setLandscapeShadowFlags(group);assert.equal(tree.castShadow,true);assert.equal(grass.castShadow,false);assert.equal(grass.receiveShadow,true);assert.equal(fire.castShadow,false);tree.geometry.dispose();tree.material.dispose();fire.geometry.dispose();fire.material.dispose();
});
