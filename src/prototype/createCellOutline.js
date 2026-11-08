import * as THREE from 'three';
import {sampleStudyHeight,displayedSurface} from './studySurface.js';

// Persistent clicked logical footprint. Unlike background scan glyphs, this
// outline stays visible through decoration so its association is unambiguous.
export function createCellOutline(map,index){
 const positions=[],x=index%map.width,z=Math.floor(index/map.width),ratio=displayedSurface(map).width/map.width;
 function point(gx,gz){return [(gx-map.width/2)*map.cellSize,sampleStudyHeight(map,gx,gz)+.055,(gz-map.height/2)*map.cellSize];}
 const corners=[[x,z],[x+1,z],[x+1,z+1],[x,z+1]];
 for(let edge=0;edge<4;edge++){
  const a=corners[edge],b=corners[(edge+1)%4];
  for(let step=0;step<ratio*4;step++){
   const t=step/(ratio*4),u=(step+1)/(ratio*4);
   positions.push(...point(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),...point(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u));
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const material=new THREE.LineBasicMaterial({color:0xffd072,depthTest:false,depthWrite:false,toneMapped:false});
 const mesh=new THREE.LineSegments(geometry,material);mesh.renderOrder=15;mesh.name='inspected-logical-cell';let disposed=false;
 return {mesh,dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();}};
}
