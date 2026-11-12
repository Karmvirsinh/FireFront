import {seedStream} from '../world/generation/seed.js';
import {sampleTerrainHeight} from '../world/terrain.js';
import {sampleStudyHeight} from '../prototype/studySurface.js';

// Verbatim original gallery rules; regression compares the actual gallery output.
// Fine modes update ground contact only, never random placement/scale/selection.
export function originalStudyPlacements(map){
 const random=seedStream(map.prototype.seed,`art:dressing:${map.prototype.kind}`);
 const placements={trees:[[],[]],grass:[],rocks:[[],[],[]]};
 const relief=Math.max(...map.elevation.cornerHeights);
 const isTrail=i=>map.cells[i]?.terrain==='trail';
 const nearTrail=i=>[i,i-1,i+1,i-map.width,i+map.width].some(isTrail);
 // Off-grid jitter, spatial exclusion and a seeded forest edge break model rows.
 const treePoints=[];
 for(let attempt=0;attempt<1000;attempt++){
  const gx=1+random()*(map.width-2),gz=1+random()*(map.height-2),index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  if(cell.terrain!=='forest'||cell.slope>24||nearTrail(index))continue;
  const x=(gx-map.width/2)*map.cellSize,z=(gz-map.height/2)*map.cellSize;
  if(treePoints.some(p=>Math.hypot(p.x-x,p.z-z)<.86))continue;
  const p={x,z,y:sampleStudyHeight(map,gx,gz),s:.70+random()*.40,angle:random()*6.28,index};
  treePoints.push(p);placements.trees[random()<.55?0:1].push(p);
 }
 for(let attempt=0;attempt<2600;attempt++){
  const gx=random()*map.width,gz=random()*map.height,index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  const p={x:(gx-map.width/2)*map.cellSize,z:(gz-map.height/2)*map.cellSize,y:sampleStudyHeight(map,gx,gz),s:.65+random()*.75,angle:random()*6.28,index};
  if(cell.terrain==='grass'&&cell.slope<20&&random()<.80)placements.grass.push(p);
  else if(cell.terrain==='rock'&&(sampleTerrainHeight(map,gx,gz)/relief<.35||sampleTerrainHeight(map,gx,gz)/relief>.80)&&random()<.13){p.s=.2+random()*.65;placements.rocks[attempt%3].push(p);}
 }
 return placements;
}
