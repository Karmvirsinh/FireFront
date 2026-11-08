import * as THREE from 'three';
import {sampleStudyHeight} from './studySurface.js';
import {inspectTraversal,scanEnvelope} from './traversalScan.js';

// Background samples stay sparse; every logical trail cell is sampled.
export function scanCellIndices(map,stride=2){
 const trail=new Set(map.pathNetwork?.trailCells??[]),indices=new Set(trail);
 for(let z=0;z<map.height;z+=stride)for(let x=0;x<map.width;x+=stride){
  const i=z*map.width+x;
  const nearTrail=[i-1,i+1,i-map.width,i+map.width].some(n=>trail.has(n));
  if(!nearTrail||trail.has(i))indices.add(i);
 }
 return [...indices].sort((a,b)=>a-b);
}
export function createScanView(map,stride=2){
 const group=new THREE.Group();group.name='terrain-scan';group.visible=false;
 const buffers={halo:[],dot:[],triangle:[],cross:[],trailHalo:[],trailDot:[],trailTriangle:[],trailCross:[]},markers=[];
 function polygon(coords,index,name){
  const gx=index%map.width+.5,gz=Math.floor(index/map.width)+.5;
  const size=map.cellSize/.5;
  const vertices=coords.map(([x,z])=>[(gx-map.width/2)*map.cellSize+x*size,sampleStudyHeight(map,gx+x*size/map.cellSize,gz+z*size/map.cellSize)+.045,(gz-map.height/2)*map.cellSize+z*size]);
  for(let i=1;i<vertices.length-1;i++)buffers[name].push(...vertices[0],...vertices[i],...vertices[i+1]);
 }
 function bar(a,b,width,index,name){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),x=-dz/length*width/2,z=dx/length*width/2;
  polygon([[a[0]+x,a[1]+z],[b[0]+x,b[1]+z],[b[0]-x,b[1]-z],[a[0]-x,a[1]-z]],index,name);
 }
 for(const index of scanCellIndices(map,stride)){
  const result=inspectTraversal(map,index);markers.push(result);
  for(const halo of [true,false]){
   const trail=map.cells[index].terrain==='trail';
   const base=halo?'halo':result.symbol,name=trail?`trail${base[0].toUpperCase()}${base.slice(1)}`:base;
   if(result.symbol==='dot')polygon(Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*(trail?(halo?.12:.085):(halo?.083:.053)),Math.sin(i*Math.PI/4)*(trail?(halo?.12:.085):(halo?.083:.053))]),index,name);
   else if(result.symbol==='triangle'){
    const points=[[0,-.14],[.125,.10],[-.125,.10]];
    for(let i=0;i<3;i++)bar(points[i],points[(i+1)%3],halo?.058:.028,index,name);
   }else{bar([-.10,-.10],[.10,.10],halo?.06:.03,index,name);bar([-.10,.10],[.10,-.10],halo?.06:.03,index,name);}
  }
 }
 const resources=[],materials=[];
 for(const [name,color]of Object.entries({halo:0x20281e,dot:0xf4efdf,triangle:0xffc148,cross:0xff5c4d,trailHalo:0x20281e,trailDot:0xfff9dc,trailTriangle:0xffc148,trailCross:0xff5c4d})){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(buffers[name],3));
  const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,toneMapped:false,depthTest:true,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=name.toLowerCase().includes('halo')?10:11;mesh.name=`scan-${name}`;group.add(mesh);resources.push(geometry,material);materials.push(material);
 }
 let start=-Infinity,reduced=false,disposed=false;
 return {group,markers,start(now,reducedMotion=false){start=now;reduced=reducedMotion;group.visible=true;materials.forEach(m=>m.opacity=1);},
  update(now){const state=scanEnvelope(now-start,reduced);group.visible=!disposed&&state.visible;materials.forEach(m=>m.opacity=state.opacity);return group.visible;},
  dispose(){if(disposed)return;disposed=true;group.visible=false;resources.forEach(r=>r.dispose());}};
}
