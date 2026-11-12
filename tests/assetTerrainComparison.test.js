import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Matrix4} from 'three';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {originalStudyPlacements} from '../src/comparison/originalStudyPlacements.js';
import {createStudyMap} from '../src/prototype/createStudyMap.js';
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';
import {sampleStudyHeight} from '../src/prototype/studySurface.js';
import {createTerrainGeometry} from '../src/rendering/terrainGeometry.js';
import {createLandformPlan} from '../src/prototype/landformConstruction.js';
import {createContinuousStudyPlan,continuousRidge} from '../src/comparison/continuousLandforms.js';
import {refineStudySurface,createComparisonGeometry,inspectComparisonCell,comparisonEdge,comparisonTrailReport,nativeHeight} from '../src/comparison/fineSurface.js';
import {comparisonPlacements,loadArtwork,createDressing,bakeScene} from '../src/comparison/artComparison.js';

test('procedural fine mesh samples original functions, retains logical data and differs from coarse interpolation',()=>{
 const map=createStudyMap('ridge',913),before=structuredClone(map),positions=comparisonPlacements(map);
 refineStudySurface(map,257);assert.deepEqual(map.cells,before.cells);assert.deepEqual(map.pathNetwork,before.pathNetwork);assert.deepEqual(map.elevation,before.elevation);
 const horizontal=items=>items.map(({y,...p})=>p);assert.deepEqual(horizontal(comparisonPlacements(map)),horizontal(positions));
 let difference=0;for(let z=0;z<64;z++)for(let x=0;x<64;x++)difference=Math.max(difference,Math.abs(sampleStudyHeight(map,x+.25,z+.25)-sampleStudyHeight(before,x+.25,z+.25)));
 assert.ok(difference>.02,'fine sampling must add actual analytic shape detail');
 const same=createStudyMap('ridge',913);refineStudySurface(same,257);assert.deepEqual(same.displaySurface,map.displaySurface);
 assert.deepEqual(comparisonTrailReport(map),{blockedCells:0,blockedEdges:0,connected:true});
 const geometry=createComparisonGeometry(map);
 try{assert.equal(geometry.attributes.position.count,257*257);assert.equal(geometry.index.count/3,256*256*2);
  const a=geometry.attributes.position;for(const i of [0,12345,50000,a.count-1])assert.ok(Math.abs(a.getY(i)-sampleStudyHeight(map,a.getX(i)/map.cellSize+32,a.getZ(i)/map.cellSize+32))<1e-5);
 }finally{geometry.dispose();}
});

test('Gaea finer surface uses native512 samples with preserved footprint, scaling, range and unchanged logical cells',async()=>{
 const bytes=await readFile(new URL('../public/comparison/gaea-height.u16',import.meta.url)),samples=new Uint16Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const map=createGaeaStudyMap(),before=structuredClone(map);refineStudySurface(map,513,samples);
 assert.equal(samples.length,512*512);assert.equal(map.displaySurface.width*map.displaySurface.cellSize,32);assert.equal(map.displaySurface.elevation.cornerHeights.length,513*513);
 assert.deepEqual(map.cells,before.cells);assert.deepEqual(map.elevation,before.elevation);assert.equal(nativeHeight(samples,0,0),samples[0]/65535*16);
 const min=Math.min(...before.elevation.cornerHeights),max=Math.max(...before.elevation.cornerHeights);
 assert.ok(map.displaySurface.elevation.cornerHeights.every(h=>Number.isFinite(h)&&h>=min&&h<=max));
 assert.ok(comparisonTrailReport(map).connected===null);
});

test('fine barriers affect comparison eligibility/edges; classifications and Path-first stay separate',()=>{
 const map={width:2,height:1,cellSize:1,prototype:{maxSlopeDegrees:50},elevation:{units:'world',triangulation:'nw-se',cornerHeights:[0,0,0,0,0,0]},cells:[{terrain:'trail',baseWalkable:true},{terrain:'grass',baseWalkable:true}],navigation:{allowedCells:[true,false]}};
 // A narrow subcell bump is invisible to the coarse corner sampler.
 map.displaySurface={width:4,height:2,cellSize:.5,elevation:{units:'world',triangulation:'nw-se',cornerHeights:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0]}};
 assert.equal(inspectComparisonCell(map,0).coarse,0);assert.equal(inspectComparisonCell(map,0).physical,false);assert.equal(comparisonEdge(map,0,1),false);
 assert.equal(inspectComparisonCell(map,1).physical,true);assert.equal(inspectComparisonCell(map,1).pathAllowed,false);
 map.cells[1].terrain='forest';assert.equal(inspectComparisonCell(map,1).physical,false);
});

test('comparison restores exact original gallery placement, scale and all three rock variants; resolution changes contact height only',()=>{
 for(const [kind,seed]of [['ridge',913],['woodland',7]]){
  const map=createStudyMap(kind,seed),view=createStudyView(map);
  try{
   const manifest=originalStudyPlacements(map);assert.deepEqual(manifest,view.placements);
   const a=comparisonPlacements(map),b=comparisonPlacements(map);assert.deepEqual(a,b);
   for(let variant=0;variant<3;variant++){
    const rock=a.filter(p=>p.kind==='rock'&&p.variant===variant);
    assert.equal(rock.length,manifest.rocks[variant].length);
    rock.forEach((p,i)=>{for(const key of ['x','z','y','s','angle','index'])assert.equal(p[key],manifest.rocks[variant][i][key]);});
   }
   for(const p of a)assert.notEqual(map.cells[p.index].terrain,'trail','no decorative base occupies a trail cell');
   if(kind==='ridge')assert.ok(manifest.rocks.flat().length>0);
  }finally{view.dispose();}
 }
});

test('small CC0 GLB subset loads with broad low shrubs and bounded artwork; dressing is instanced and terrain-anchored',async()=>{
 const loader=new GLTFLoader(),map=createStudyMap('woodland',7),placements=comparisonPlacements(map);
 for(const mode of ['original','kenney']){
  const art=await loadArtwork(mode,async name=>{const b=await readFile(new URL(`../public/comparison/kenney/${name}.glb`,import.meta.url));return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');});
  assert.equal(art.tree.length,2);for(const g of art.brush){g.computeBoundingBox();const b=g.boundingBox;assert.ok(b.max.y-b.min.y<Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*1.2,'shrub must not resemble a narrow tree');}
  const dressing=createDressing(map,art,placements);const meshes=dressing.group.children;assert.ok(meshes.every(m=>m.isInstancedMesh));assert.equal(meshes.reduce((n,m)=>n+m.count,0),placements.length);
  for(const mesh of meshes)for(let i=0;i<mesh.count;i++){const p=mesh.userData.placements[i],matrix=new Matrix4();mesh.getMatrixAt(i,matrix);assert.ok(Math.abs(matrix.elements[13]-sampleStudyHeight(map,p.gx,p.gz))<1e-5);}
  let disposed=0;for(const variants of Object.values(art))for(const geometry of variants)geometry.addEventListener('dispose',()=>disposed++);
  const expected=Object.values(art).reduce((n,variants)=>n+variants.length,0);
  dressing.dispose();dressing.dispose();assert.equal(disposed,expected,'shared geometry disposed exactly once');
 }
});


test('65 baseline matches original gallery positions, winding and face normals exactly',()=>{
 const map=createStudyMap('ridge',913),old=createTerrainGeometry(map);refineStudySurface(map,65);const current=createComparisonGeometry(map);
 try{for(const name of ['position','normal'])assert.deepEqual(current.attributes[name].array,old.attributes[name].array);}finally{old.dispose();current.dispose();}
});

test('ridge endpoint/segment correction removes discontinuities instead of smoothing intended tableland cliffs',()=>{
 const legacy=createLandformPlan('ridge',913,0),fixed=createContinuousStudyPlan('ridge',913,0),x=-13.25,z=-11.5;
 assert.ok(Math.abs(legacy.height(x+.001,z)-legacy.height(x,z))>.9,'confirmed original jump');
 assert.ok(Math.abs(fixed.height(x+.001,z)-fixed.height(x,z))<.01,'continuous corrected cap');
 const ridge=legacy.raised[0],a=ridge.spine[0],b=ridge.spine[1],dx=a.x-b.x,dz=a.z-b.z,len=Math.hypot(dx,dz),px=a.x+dx/len*3,pz=a.z+dz/len*3;
 const epsilon=1e-6,left=continuousRidge(ridge,px-dz/len*epsilon,pz+dx/len*epsilon),right=continuousRidge(ridge,px+dz/len*epsilon,pz-dx/len*epsilon);
 assert.ok(Math.abs(left-right)<1e-5,'no width-side jump along spine extension');
 assert.deepEqual(fixed.raised,legacy.raised,'all authored operators/parameters retained');
});

test('Kenney legacy palette factors decode sRGB once, retaining source hue rather than a green tint',async()=>{
 const b=await readFile(new URL('../public/comparison/kenney/tree_oak.glb',import.meta.url)),loader=new GLTFLoader(),gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const materials=[];gltf.scene.traverse(o=>{if(o.isMesh)materials.push(...(Array.isArray(o.material)?o.material:[o.material]));});
 const leaf=materials.find(m=>m.name==='leafsGreen');assert.equal(leaf.map,null);assert.equal(leaf.vertexColors,false);assert.ok(Math.abs(leaf.color.g-201/255)<1e-6);
 const expected=leaf.color.clone().convertSRGBToLinear(),g=bakeScene(gltf.scene),colors=g.attributes.color;
 try{let found=false;for(let i=0;i<colors.count;i++)if(Math.abs(colors.getX(i)-expected.r)<1e-6&&Math.abs(colors.getY(i)-expected.g)<1e-6&&Math.abs(colors.getZ(i)-expected.b)<1e-6)found=true;assert.ok(found,'exact source-palette decode, no arbitrary recolor');}finally{g.dispose();}
});
