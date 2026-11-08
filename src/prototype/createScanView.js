import * as THREE from 'three';
import {sampleTerrainHeight} from '../world/terrain.js';
import {inspectTraversal,scanEnvelope} from './traversalScan.js';

// Geometry lies on the sampled surface. Only these diagnostic glyphs ignore
// decorative occlusion, so forest blockers remain legible through tree crowns.
export function createScanView(map,stride=2){
 const group=new THREE.Group();group.name='terrain-scan';group.visible=false;
 const buffers={halo:[],dot:[],triangle:[],cross:[]},markers=[];
 function polygon(coords,index,name){
  const gx=index%map.width+.5,gz=Math.floor(index/map.width)+.5;
  const vertices=coords.map(([x,z])=>[(gx-map.width/2)*map.cellSize+x,sampleTerrainHeight(map,gx+x/map.cellSize,gz+z/map.cellSize)+.045,(gz-map.height/2)*map.cellSize+z]);
  for(let i=1;i<vertices.length-1;i++)buffers[name].push(...vertices[0],...vertices[i],...vertices[i+1]);
 }
 function bar(a,b,width,index,name){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),x=-dz/length*width/2,z=dx/length*width/2;
  polygon([[a[0]+x,a[1]+z],[b[0]+x,b[1]+z],[b[0]-x,b[1]-z],[a[0]-x,a[1]-z]],index,name);
 }
 for(let z=0;z<map.height;z+=stride)for(let x=0;x<map.width;x+=stride){
  const index=z*map.width+x,result=inspectTraversal(map,index);markers.push(result);
  for(const halo of [true,false]){
   const name=halo?'halo':result.symbol;
   if(result.symbol==='dot')polygon(Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*(halo?.083:.053),Math.sin(i*Math.PI/4)*(halo?.083:.053)]),index,name);
   else if(result.symbol==='triangle'){
    const points=[[0,-.14],[.125,.10],[-.125,.10]];
    for(let i=0;i<3;i++)bar(points[i],points[(i+1)%3],halo?.058:.028,index,name);
   }else{bar([-.10,-.10],[.10,.10],halo?.06:.03,index,name);bar([-.10,.10],[.10,-.10],halo?.06:.03,index,name);}
  }
 }
 const resources=[],materials=[];
 for(const [name,color]of Object.entries({halo:0x20281e,dot:0xf4efdf,triangle:0xffc148,cross:0xff5c4d})){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(buffers[name],3));
  const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,toneMapped:false,depthTest:false,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=name==='halo'?10:11;mesh.name=`scan-${name}`;group.add(mesh);resources.push(geometry,material);materials.push(material);
 }
 let start=-Infinity,reduced=false,disposed=false;
 return {group,markers,start(now,reducedMotion=false){start=now;reduced=reducedMotion;group.visible=true;materials.forEach(m=>m.opacity=1);},
  update(now){const state=scanEnvelope(now-start,reduced);group.visible=!disposed&&state.visible;materials.forEach(m=>m.opacity=state.opacity);return group.visible;},
  dispose(){if(disposed)return;disposed=true;group.visible=false;resources.forEach(r=>r.dispose());}};
}
