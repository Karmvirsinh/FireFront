import test from 'node:test';
import assert from 'node:assert/strict';
import {prototypeSlopeCell,prototypePhysicalCell,prototypeTraversalEdge,prototypeConnected,validatePrototypeTrails} from '../src/prototype/prototypeTraversal.js';
import {inspectTraversal} from '../src/prototype/traversalScan.js';
import {createStudyMap,GALLERY} from '../src/prototype/createStudyMap.js';
import {createGaeaStudyMap} from '../src/prototype/createGaeaStudyMap.js';
import {createStudyView} from '../src/prototype/createStudyView.js';
import {TRAIL_SLOPE_DEGREES} from '../src/world/generation/trailTerrain.js';

function fixture(degrees){
 const rise=Math.tan(degrees*Math.PI/180)*.5;
 return {width:3,height:1,cellSize:.5,prototype:{maxSlopeDegrees:50},
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array.from({length:8},(_,i)=>i%4*rise)},
  cells:Array.from({length:3},()=>({terrain:'grass',baseWalkable:true,walkable:true})),
  navigation:{mode:'path-first',allowedCells:[true,true,true]}};
}
test('inclusive 20/50 degree bands use real full-face eligibility, edge safety and connectivity',()=>{
 for(const [degrees,symbol]of [[0,'dot'],[19.999,'dot'],[20,'dot'],[20.001,'triangle'],[49.999,'triangle'],[50,'triangle'],[50.001,'cross']]){
  const map=fixture(degrees),allowed=degrees<=50;
  assert.equal(inspectTraversal(map,1).symbol,symbol,`${degrees} band`);
  assert.equal(prototypeSlopeCell(map,1),allowed);assert.equal(prototypePhysicalCell(map,1),allowed);
  assert.equal(prototypeTraversalEdge(map,0,1),allowed);assert.equal(prototypeConnected(map,0,2),allowed);
 }
 assert.equal(TRAIL_SLOPE_DEGREES,20,'production rule stays at 20');
});
test('forest, rock, explicit blockers and path-only policy stay independent of terrain capability',()=>{
 const map=fixture(35);assert.equal(prototypeConnected(map,0,2),true);
 for(const terrain of ['forest','rock']){
  map.cells[1].terrain=terrain;assert.equal(inspectTraversal(map,1).slopeSuitable,true);
  assert.equal(inspectTraversal(map,1).symbol,'cross');assert.equal(prototypeConnected(map,0,2),false);
  assert.match(inspectTraversal(map,1).reason,new RegExp(terrain));
 }
 map.cells[1].terrain='grass';map.cells[1].baseWalkable=false;assert.equal(prototypePhysicalCell(map,1),false);
 map.cells[1].baseWalkable=true;map.navigation.allowedCells[1]=false;
 assert.equal(inspectTraversal(map,1).symbol,'triangle');assert.equal(inspectTraversal(map,1).pathAllowed,false);
 assert.equal(prototypeConnected(map,0,2),false);assert.equal(prototypeConnected(map,0,2,{pathFirst:false}),true);
 assert.equal(prototypeTraversalEdge(map,0,2),false,'no diagonal/jumping connections');
});
test('capability trial preserves every gallery layout, classification, gentle trail and original art placement',()=>{
 let newlyEligible=0;
 for(const {kind,seed}of GALLERY){
  const old=createStudyMap(kind,seed,{maxSlopeDegrees:20}),trial=createStudyMap(kind,seed);
  assert.deepEqual(trial.elevation,old.elevation);assert.deepEqual(trial.pathNetwork,old.pathNetwork);assert.deepEqual(trial.navigation,old.navigation);
  assert.deepEqual(trial.prototype.plan,old.prototype.plan);
  for(let i=0;i<old.cells.length;i++){
   const a=old.cells[i],b=trial.cells[i];assert.equal(b.terrain,a.terrain);assert.equal(b.fuelType,a.fuelType);assert.equal(b.slope,a.slope);
   if(b.walkable&&!a.walkable)newlyEligible++;
  }
  validatePrototypeTrails(trial);
  if(kind==='ridge'&&seed===913){const a=createStudyView(old),b=createStudyView(trial);assert.deepEqual(a.placements,b.placements);a.dispose();b.dispose();}
 }
 assert.ok(newlyEligible>0,'real eligibility changes on non-rock/nonforest cells, not just colors');
 for(const corners of [129,257]){
  const a=createGaeaStudyMap(corners,{maxSlopeDegrees:20}),b=createGaeaStudyMap(corners);
  assert.deepEqual(b.elevation,a.elevation);assert.deepEqual(b.displaySurface,a.displaySurface);
  assert.deepEqual(b.cells,a.cells,'existing Gaea >20 rock classification remains blocked');
  for(let i=0;i<b.cells.length;i+=7)assert.equal(inspectTraversal(b,i).physicalWalkable,prototypePhysicalCell(b,i));
 }
});
