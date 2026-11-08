import data from './data/gaeaSandstone.json' with {type:'json'};
import {terrainCellGradients,validateTerrain} from '../world/terrain.js';
import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';

// Authored/exported comparison only. No Gaea runtime or production-map adoption.
export function createGaeaStudyMap(corners=129){
 if(![129,257].includes(corners))throw new Error('Supported Gaea mesh corners: 129 or 257');
 const width=data.gridCells,noise=createNoise2D(seedStream(30085,'gaea-trial-dressing'));
 const map={width,height:width,cellSize:data.worldWidth/width,name:'Gaea · Sandstone Butte',
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:[...data.heights]},
  prototype:{version:'gaea-sandstone-trial-v1',kind:'gaea',seed:30085,detail:[0,0],look:[18,12,18],
   summary:'Gaea export · irregular butte / exposed strata / lower cuts · surface study, no routed trail',trailRise:0,source:data.source},
  surfaceLayers:[...data.layers]};
 validateTerrain(map);
 map.cells=Array.from({length:width*width},(_,i)=>{
  const slope=Math.atan(Math.max(...terrainCellGradients(map,i)))*180/Math.PI;
  const forest=slope<18&&noise(i%width*.035,Math.floor(i/width)*.035)>0.25;
  const terrain=slope>20?'rock':forest?'forest':'grass';
  return {terrain,slope,fuelType:terrain==='rock'?'none':terrain,walkable:slope<=20&&!forest};
 });
 map.navigation={mode:'path-first',allowedCells:map.cells.map(()=>false)};
 map.pathNetwork={centerlines:[],trailCells:[]};
 if(corners===257)map.displaySurface={width:256,height:256,cellSize:.125,
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:[...data.detailHeights]}};
 map.prototype.meshCorners=corners;
 return map;
}
