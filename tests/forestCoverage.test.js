import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneratedMapV7Baseline as createGeneratedMap,createGeneratedMapV6,createGeneratedMapV5} from '../src/world/generation/createGeneratedMap.js';
import {createCanopyLayout} from '../src/rendering/createCanopyLayout.js';
import {createMapView} from '../src/rendering/createMapView.js';
import {createFireSimulation} from '../src/simulation/createFireSimulation.js';
import {Matrix4,Vector3} from 'three';

test('v7 forests repeat while exact v6 terrain, network, rocks, endpoints and navigation remain unchanged',()=>{
 for(const seed of [...Array.from({length:16},(_,i)=>i),34,2026]){
  const map=createGeneratedMap(seed),old=createGeneratedMapV6(seed);
  assert.equal(map.generation.version,'forest-environment-v7');
  for(const key of ['elevation','pathNetwork','start','safeZone','spawnCells','zones','navigation'])assert.deepEqual(map[key],old[key]);
  map.cells.forEach((c,i)=>{
   if(old.cells[i].terrain==='obstacle'||old.navigation.allowedCells[i])assert.deepEqual(c,old.cells[i]);
  });
  assert.deepEqual(createGeneratedMap(seed),map);
  const forest=map.cells.filter(c=>c.fuelType==='forest').length;
  assert.ok(forest>map.cells.length*.3&&forest<map.cells.length*.9);
  assert.ok(map.cells.filter(c=>c.terrain==='clearing').length<old.cells.filter(c=>c.terrain==='clearing').length);
  if([0,7,34,2026].includes(seed)) {
    const seen=new Set();let largest=0;
    for(let i=0;i<map.cells.length;i++){
      if(seen.has(i)||map.cells[i].fuelType!=='forest')continue;
      const queue=[i];seen.add(i);
      for(let head=0;head<queue.length;head++){
        const index=queue[head],x=index%map.width;
        for(const n of [index-map.width,index+map.width,x?index-1:-1,x<map.width-1?index+1:-1])
          if(n>=0&&n<map.cells.length&&!seen.has(n)&&map.cells[n].fuelType==='forest'){seen.add(n);queue.push(n);}
      }
      largest=Math.max(largest,queue.length);
    }
    assert.ok(largest>1000,'a broad connected core remains after rock/trail carving');
  }
  const canopy=createCanopyLayout(map);assert.deepEqual(createCanopyLayout(map),canopy);
  assert.ok(canopy.length<=map.cells.length&&canopy.length>forest*.2);
  for(const t of canopy){
   assert.equal(map.cells[t.cell].fuelType,'forest');assert.equal(Math.floor(t.z)*map.width+Math.floor(t.x),t.cell);
   assert.equal(map.navigation.allowedCells[t.cell],false);
   assert.ok(Math.abs(t.x%1-.5)*map.cellSize+.06*t.width<map.cellSize/2);
   assert.ok(Math.abs(t.z%1-.5)*map.cellSize+.06*t.width<map.cellSize/2);
  }
 }
 assert.equal(createGeneratedMapV6(7).generation.version,'forest-network-v6');
 assert.equal(createGeneratedMapV5(7).generation.version,'forest-network-v5');
});

test('irregular canopy instances stay tied to fuel cells through burning, burnout and reset',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const map=createGeneratedMap(7),view=createMapView(map),fire=createFireSimulation(map);
 try{
  const crowns=view.group.getObjectByName('forest-crowns'),trunks=view.group.getObjectByName('forest-trunks');
  const cells=crowns.userData.cells,index=cells[0],matrix=new Matrix4(),position=new Vector3();
  const original=crowns.instanceMatrix.array.slice();
  crowns.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);
  assert.equal(Math.floor(position.z/map.cellSize+map.height/2)*map.width+Math.floor(position.x/map.cellSize+map.width/2),index);
  fire.select(index);view.syncFire(fire);fire.start();view.syncFire(fire);
  assert.deepEqual(crowns.instanceMatrix.array,original,'standing during burning');
  fire.cells[index].state='burned-hot';fire.cells[index].fuel=0;
  const fixture={cells:fire.cells,selected:index,started:true,takeChanges:()=>[index]};view.syncFire(fixture);
  crowns.getMatrixAt(0,matrix);assert.equal(matrix.elements[0],0);
  trunks.getMatrixAt(0,matrix);assert.ok(matrix.elements[5]>0);
  fire.cells[index].state='burned-cool';view.syncFire(fixture);
  fire.reset();view.syncFire(fire);view.syncFire({...fixture,started:false,cells:fire.cells});
  assert.deepEqual(crowns.instanceMatrix.array,original,'reset restores per-tree variation');
 }finally{view.dispose();globalThis.document=previous;}
});
