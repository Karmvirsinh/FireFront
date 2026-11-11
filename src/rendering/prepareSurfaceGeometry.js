import {Float32BufferAttribute} from 'three';
import {sampleTerrainHeight} from '../world/terrain.js';

// Shader attributes only: authoritative vertices and picking geometry stay intact.
export function prepareSurfaceGeometry(map,geometry,{cutaway=false}={}){
 const p=geometry.getAttribute('position'),depth=[],normals=[];
 for(let i=0;i<p.count;i++){
  const gx=p.getX(i)/map.cellSize+map.width/2,gz=p.getZ(i)/map.cellSize+map.height/2;
  depth.push(cutaway?sampleTerrainHeight(map,gx,gz)-p.getY(i):0);
  if(cutaway){const n=geometry.getAttribute('normal');normals.push(n.getX(i),n.getY(i),n.getZ(i));continue;}
  const step=.5/map.cellSize,x0=Math.max(0,gx-step),x1=Math.min(map.width,gx+step),z0=Math.max(0,gz-step),z1=Math.min(map.height,gz+step);
  const nx=-(sampleTerrainHeight(map,x1,gz)-sampleTerrainHeight(map,x0,gz))/((x1-x0)*map.cellSize),nz=-(sampleTerrainHeight(map,gx,z1)-sampleTerrainHeight(map,gx,z0))/((z1-z0)*map.cellSize),length=Math.hypot(nx,1,nz);
  normals.push(nx/length,1/length,nz/length);
 }
 geometry.setAttribute('studyDepth',new Float32BufferAttribute(depth,1));geometry.setAttribute('studyBlendNormal',new Float32BufferAttribute(normals,3));
}
