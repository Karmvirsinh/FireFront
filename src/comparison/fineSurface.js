import * as THREE from 'three';
import {createLandformPlan} from '../prototype/landformConstruction.js';
import {createContinuousStudyPlan} from './continuousLandforms.js';
import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';
import {displayedSurface,sampleStudyHeight,displayedCellSlope} from '../prototype/studySurface.js';

export function nativeHeight(samples,u,v){
 const x=u*511,z=v*511,ix=Math.floor(x),iz=Math.floor(z),nx=Math.min(511,ix+1),nz=Math.min(511,iz+1),a=x-ix,b=z-iz;
 return ((samples[iz*512+ix]*(1-a)+samples[iz*512+nx]*a)*(1-b)+(samples[nz*512+ix]*(1-a)+samples[nz*512+nx]*a)*b)/65535*16;
}
// Same footprint, common height range, original functions/source at finer spacing.
// No triangle subdivision and no simulation-grid change.
export function refineStudySurface(map,corners,nativeSamples=null){
 const width=corners-1,world=map.width*map.cellSize;
 if(width%map.width!==0||width<map.width)throw new Error('Surface must contain complete logical-cell subdivisions');
 const low=Math.min(...map.elevation.cornerHeights),high=Math.max(...map.elevation.cornerHeights);
 let height;
 if(map.prototype.kind==='gaea'){
  if(corners===129){delete map.displaySurface;return map;}
  if(!nativeSamples||nativeSamples.length!==512*512)throw new Error('Native Gaea samples required');
  height=(x,z)=>nativeHeight(nativeSamples,x/width,z/width);
 }else{
  if(corners===map.width+1){delete map.displaySurface;map.comparisonSurface={corners,clamped:0,source:'exact historical gallery surface'};return map;}
  const legacy=createLandformPlan(map.prototype.kind,map.prototype.seed,map.prototype.attempt);
  const plan=createContinuousStudyPlan(map.prototype.kind,map.prototype.seed,map.prototype.attempt);
  // Recover exactly the original normalization offset, independently of resolution.
  let offset=Infinity;
  for(let z=0;z<=map.height;z++)for(let x=0;x<=map.width;x++)offset=Math.min(offset,legacy.height(x*map.cellSize-world/2,z*map.cellSize-world/2));
  height=(x,z)=>plan.height(x/width*world-world/2,z/width*world-world/2)-offset;
 }
 let clamped=0;
 const cornerHeights=Array.from({length:corners*corners},(_,i)=>{const h=height(i%corners,Math.floor(i/corners));if(h<low||h>high)clamped++;return Math.max(low,Math.min(high,h));});
 map.displaySurface={width,height:width,cellSize:world/width,elevation:{units:'world',triangulation:'nw-se',cornerHeights}};
 map.comparisonSurface={corners,clamped,source:map.prototype.kind==='gaea'?'native512 PNG16':'analytic functions · continuous cap/segment correction v1 (65 retains historical field)'};
 return map;
}

// Indexed terrain: a 513-corner trial need not keep 1.57M duplicate vertices.
export function createComparisonGeometry(map){
 const surface=displayedSurface(map),w=surface.width,h=surface.height,count=(w+1)*(h+1),positions=new Float32Array(count*3),normals=new Float32Array(count*3),indices=[];
 const span=map.width*map.cellSize,step=.5;
 for(let z=0;z<=h;z++)for(let x=0;x<=w;x++){
  const i=z*(w+1)+x,wx=x*surface.cellSize-span/2,wz=z*surface.cellSize-span/2;
  positions.set([wx,sampleTerrainHeight(surface,x,z),wz],i*3);
  const x0=Math.max(-span/2,wx-step),x1=Math.min(span/2,wx+step),z0=Math.max(-span/2,wz-step),z1=Math.min(span/2,wz+step);
  const at=(a,b)=>sampleStudyHeight(map,a/map.cellSize+map.width/2,b/map.cellSize+map.height/2);
  const n=new THREE.Vector3(-(at(x1,wz)-at(x0,wz))/(x1-x0),1,-(at(wx,z1)-at(wx,z0))/(z1-z0)).normalize();normals.set(n.toArray(),i*3);
 }
 for(let z=0;z<h;z++)for(let x=0;x<w;x++){const a=z*(w+1)+x,b=a+w+1;indices.push(a,b,b+1,a,b+1,a+1);}
 let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(indices);
 if(w===map.width){const indexed=g;g=g.toNonIndexed();indexed.dispose();}
 g.computeVertexNormals();
 if(w===map.width){
  const blended=new Float32Array(g.attributes.position.count*3);for(let i=0;i<indices.length;i++)blended.set(normals.subarray(indices[i]*3,indices[i]*3+3),i*3);
  g.setAttribute('studyBlendNormal',new THREE.BufferAttribute(blended,3));g.setAttribute('studyDepth',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count),1));return g;
 }
 g.setAttribute('studyBlendNormal',new THREE.BufferAttribute(normals,3));g.setAttribute('studyDepth',new THREE.BufferAttribute(new Float32Array(count),1));return g;
}

export function inspectComparisonCell(map,index){
 const cell=map.cells[index],fine=displayedCellSlope(map,index),coarse=Math.atan(Math.max(...terrainCellGradients(map,index)))*180/Math.PI;
 const limit=map.prototype.maxSlopeDegrees,blocker=['forest','rock'].includes(cell.terrain)||!(cell.baseWalkable??cell.walkable);
 const slopeOK=fine<=limit+1e-7,physical=!blocker&&slopeOK,policy=Boolean(map.navigation.allowedCells[index]);
 return {index,fine,coarse,physical,policy,pathAllowed:physical&&policy,symbol:!physical?'cross':fine>20?'triangle':'dot',
  reason:`Cell (${index%map.width}, ${Math.floor(index/map.width)}) · ${cell.terrain}. Coarse ${coarse.toFixed(1)}°; displayed maximum ${fine.toFixed(1)}°. ${blocker?'Physical classification blocks movement.':slopeOK?'Surface slope permitted.':`Fine surface exceeds ${limit}° prototype capability.`} ${policy?'Inside':'Outside'} Path-first trail. Red = blocked, not lethal. No simulator navigation change.`};
}
export function comparisonEdge(map,a,b){
 if(Math.abs(a%map.width-b%map.width)+Math.abs(Math.floor(a/map.width)-Math.floor(b/map.width))!==1)return false;
 if(!inspectComparisonCell(map,a).pathAllowed||!inspectComparisonCell(map,b).pathAllowed)return false;
 const ratio=displayedSurface(map).width/map.width,steps=ratio*4,ax=a%map.width+.5,az=Math.floor(a/map.width)+.5,bx=b%map.width+.5,bz=Math.floor(b/map.width)+.5;
 let previous=sampleStudyHeight(map,ax,az);
 for(let s=1;s<=steps;s++){const h=sampleStudyHeight(map,ax+(bx-ax)*s/steps,az+(bz-az)*s/steps);if(Math.abs(h-previous)>Math.tan(map.prototype.maxSlopeDegrees*Math.PI/180)*map.cellSize/steps+1e-7)return false;previous=h;}
 return true;
}
export function comparisonTrailReport(map){
 const line=map.pathNetwork.centerlines[0];if(!line?.length)return {blockedCells:0,blockedEdges:0,connected:null};
 const cells=map.pathNetwork.trailCells,blockedCells=cells.filter(i=>!inspectComparisonCell(map,i).pathAllowed).length;
 let blockedEdges=0;for(let n=1;n<line.length;n++)if(!comparisonEdge(map,line[n-1].z*map.width+line[n-1].x,line[n].z*map.width+line[n].x))blockedEdges++;
 return {blockedCells,blockedEdges,connected:blockedCells===0&&blockedEdges===0};
}
