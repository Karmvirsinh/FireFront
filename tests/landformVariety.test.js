import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createStudyMap,GALLERY} from '../src/prototype/createStudyMap.js';
import {createScanView} from '../src/prototype/createScanView.js';
import {inspectTraversal,scanEnvelope} from '../src/prototype/traversalScan.js';
import {sampleTerrainHeight,validateTerrain} from '../src/world/terrain.js';
import {validateTrailTerrain} from '../src/world/generation/trailTerrain.js';
import {createGroundPicker} from '../src/rendering/createGroundPicker.js';
import {createTerrainGeometry} from '../src/rendering/terrainGeometry.js';

test('twelve compositions vary operators, relief, terraces and boundary placement rather than only translating shapes',()=>{
 assert.equal(GALLERY.length,12);const signatures=new Set(),reliefs=[],shelfCounts=new Set();let edges=0,interiors=0,noCuts=0,branches=0;
 for(const {kind,seed}of GALLERY){
  const map=createStudyMap(kind,seed),p=map.prototype.plan;validateTerrain(map);validateTrailTerrain(map);assert.deepEqual(createStudyMap(kind,seed),map);
  signatures.add(p.raised.map(f=>f.type).sort().join('/')+`:${p.basins.length}:${p.flats.length}:${p.cuts.length}`);reliefs.push(Math.max(...map.elevation.cornerHeights));
  shelfCounts.add(p.raised.filter(f=>f.type==='terrace').length);edges+=p.raised.filter(f=>Math.abs(f.x)>=16||Math.abs(f.z)>=16).length;interiors+=p.raised.filter(f=>Math.abs(f.x)<10&&Math.abs(f.z)<10).length;
  noCuts+=p.cuts.length===0;branches+=p.cuts.some(c=>c.type==='tributary');
  const trail=new Set(map.pathNetwork.trailCells),queue=[[...trail][0]],seen=new Set(queue);
  for(let head=0;head<queue.length;head++)for(const j of [queue[head]-64,queue[head]+1,queue[head]+64,queue[head]-1])if(trail.has(j)&&!seen.has(j)&&Math.abs(j%64-queue[head]%64)+Math.abs(Math.floor(j/64)-Math.floor(queue[head]/64))===1){seen.add(j);queue.push(j);}
  assert.equal(trail.size,seen.size);assert.ok(map.prototype.quality.flatCells>100);
  for(const c of map.cells)if(c.slope>20)assert.equal(c.walkable,false);
  for(const cut of p.cuts){for(let i=1;i<cut.spine.length;i++)assert.ok(cut.spine[i].y<=cut.spine[i-1].y);assert.notEqual(cut.leftBank,cut.rightBank);}
 }
 assert.ok(signatures.size>=8);assert.ok(Math.min(...reliefs)<3&&Math.max(...reliefs)>8);assert.ok(shelfCounts.size>=3);assert.ok(edges&&interiors&&noCuts&&branches);
 // Generic seeds work too; the gallery is a review sample, not a seed-specific recipe switch.
 for(const seed of [0,1,99,4294967295])for(const kind of ['woodland','plateau','ridge'])validateTrailTerrain(createStudyMap(kind,seed));
});

test('varied surfaces retain triangle sampling and ground-only picking with page offsets',()=>{
 for(const {kind,seed}of GALLERY){
  const map=createStudyMap(kind,seed),g=createTerrainGeometry(map),positions=g.attributes.position;
  for(let i=0;i<positions.count;i++)assert.ok(Math.abs(positions.getY(i)-sampleTerrainHeight(map,positions.getX(i)/.5+32,positions.getZ(i)/.5+32))<1e-6);
  const camera=new PerspectiveCamera(43,1.5,.1,160);camera.position.set(0,50,0);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const pick=createGroundPicker(camera,{getBoundingClientRect:()=>({left:23,top:210,width:900,height:600})},map);
  for(const i of map.pathNetwork.trailCells.filter((_,j)=>j%15===0)){
   const gx=i%64+.5,gz=Math.floor(i/64)+.5,p=new Vector3((gx-32)*.5,sampleTerrainHeight(map,gx,gz),(gz-32)*.5).project(camera);
   assert.equal(pick(23+(p.x+1)*450,210+(1-p.y)*300),i);
  }
  pick.dispose();g.dispose();
 }
});

function scanFixture(degrees){
 const rise=Math.tan(degrees*Math.PI/180)*.5;
 return {width:4,height:1,cellSize:.5,elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array.from({length:10},(_,i)=>i%5*rise)},
  cells:[{terrain:'grass',walkable:true},{terrain:'forest',walkable:false},{terrain:'rock',walkable:false},{terrain:'trail',walkable:true}],navigation:{mode:'path-first',allowedCells:[false,false,false,true]}};
}
test('scan separates physical blockers, warning slopes and Path-first policy without lethal semantics',()=>{
 const flat=scanFixture(0),near=scanFixture(18),steep=scanFixture(24);
 assert.deepEqual([inspectTraversal(flat,0).symbol,inspectTraversal(flat,0).physicalWalkable,inspectTraversal(flat,0).pathAllowed],['dot',true,false]);
 assert.match(inspectTraversal(flat,0).reason,/Outside the Path-first/);
 assert.deepEqual([inspectTraversal(near,0).symbol,inspectTraversal(near,3).pathAllowed],['triangle',true]);
 assert.match(inspectTraversal(near,1).reason,/forest-class/);assert.equal(inspectTraversal(near,1).slopeSuitable,true);assert.equal(inspectTraversal(near,1).symbol,'cross');
 assert.match(inspectTraversal(near,2).reason,/rock classification/);
 assert.equal(inspectTraversal(steep,3).slopeSuitable,false);assert.equal(inspectTraversal(steep,3).policyAllowed,true);assert.equal(inspectTraversal(steep,3).pathAllowed,false);assert.match(inspectTraversal(steep,3).reason,/steep surface/);
 assert.match(inspectTraversal(steep,3).reason,/not lethal/);
});

test('scan glyphs conform to terrain, use the actual cell rules and dispose exactly once',()=>{
 for(const {kind,seed}of GALLERY){
  const map=createStudyMap(kind,seed),before=structuredClone(map),scan=createScanView(map);
  assert.ok(scan.markers.length<=1024+map.pathNetwork.trailCells.length);for(const m of scan.markers)assert.deepEqual(m,inspectTraversal(map,m.index));
  const marked=new Set(scan.markers.map(m=>m.index));assert.ok(map.pathNetwork.trailCells.every(i=>marked.has(i)));
  const counts=[];scan.group.traverse(o=>{if(!o.geometry)return;const p=o.geometry.attributes.position;
   for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-sampleTerrainHeight(map,p.getX(i)/.5+32,p.getZ(i)/.5+32)-.045)<1e-5);
   for(const r of [o.geometry,o.material]){const count={value:0};counts.push(count);r.addEventListener('dispose',()=>count.value++);}
  });
  scan.start(10);assert.equal(scan.update(11),true);assert.equal(scan.update(18),false);scan.start(20,true);assert.equal(scan.update(27),true);scan.dispose();scan.dispose();assert.ok(counts.every(c=>c.value===1));assert.deepEqual(map,before);
 }
});
test('scan clock holds, fades once and respects reduced motion; restart does not need another loop or timer',()=>{
 assert.deepEqual(scanEnvelope(0),{visible:true,opacity:1});assert.deepEqual(scanEnvelope(6),{visible:true,opacity:1});assert.deepEqual(scanEnvelope(6.75),{visible:true,opacity:.5});assert.deepEqual(scanEnvelope(7.5),{visible:false,opacity:0});
 assert.deepEqual(scanEnvelope(7,true),{visible:true,opacity:1});assert.deepEqual(scanEnvelope(7.5,true),{visible:false,opacity:0});
});
