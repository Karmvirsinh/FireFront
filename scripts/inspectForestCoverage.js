// Lightweight classification/canopy diagnostics; no renderer or benchmark.
import {createGeneratedMap} from '../src/world/generation/createGeneratedMap.js';
import {createCanopyLayout} from '../src/rendering/createCanopyLayout.js';
for(const seed of [0,7,34,2026]){
 const map=createGeneratedMap(seed),seen=new Set(),patches=[];
 const forest=map.cells.filter(c=>c.fuelType==='forest').length;
 const clearings=map.cells.filter(c=>c.terrain==='clearing').length;
 for(let i=0;i<map.cells.length;i++){
  if(seen.has(i)||map.cells[i].fuelType!=='forest')continue;
  const queue=[i];seen.add(i);
  for(let h=0;h<queue.length;h++){
   const p=queue[h],x=p%map.width;
   for(const n of [p-map.width,p+map.width,x?p-1:-1,x<map.width-1?p+1:-1]){
    if(n>=0&&n<map.cells.length&&!seen.has(n)&&map.cells[n].fuelType==='forest'){seen.add(n);queue.push(n);}
   }
  }
  patches.push(queue.length);
 }
 console.log(JSON.stringify({seed,version:map.generation.version,forestCells:forest,
  forestPercent:+(forest/map.cells.length*100).toFixed(2),clearingCells:clearings,
  clearingPercent:+(clearings/map.cells.length*100).toFixed(2),forestPatches:patches.length,
  largestForestPatch:Math.max(...patches),trees:createCanopyLayout(map).length}));
}
