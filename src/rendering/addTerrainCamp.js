import * as THREE from 'three';
import {campGrid} from '../world/generation/campLayout.js';
import {sampleTerrainHeight} from '../world/terrain.js';

// Individual human-scaled props on authoritative terrain, never a giant scaled
// miniature or a flat circular/square floor covering the logical map.
export function addTerrainCamp(map,camp,house,art,{box,roof,roofMaterial}){
 const group=new THREE.Group(),resources=[];group.name='terrain-safe-camp';house.add(group);
 const {wood,canvas,green,pale}=art.palette;
 const ground=(x,z)=>{const p=campGrid(map,camp,x,z);return sampleTerrainHeight(map,p.x+.5,p.z+.5)-house.position.y;};
 const mesh=(name,g,m,x,y,z,sx,sy,sz,angle=0)=>{const a=new THREE.Mesh(g,m);a.name=name;a.position.set(x,y,z);a.scale.set(sx,sy,sz);a.rotation.y=angle;group.add(a);return a;};
 const foundation=(p)=>{
  const ys=[];for(const x of [-.5,0,.5])for(const z of [-.5,0,.5])ys.push(ground(p.x+x*p.width,p.z+z*p.depth));
  const top=Math.max(...ys)+.012,bottom=Math.min(...ys)-.015;
  if(top-bottom>.025)mesh('camp-prop-support',box,wood,p.x,(top+bottom)/2,p.z,p.width,top-bottom,p.depth);
  return top;
 };
 function prop(name,p,w,d,h){
  const spec=art.models.get(name),s=Math.min(w/spec.size[0],h/spec.size[1],d/spec.size[2]),conform=p.kind==='ring'||p.kind==='fence',sy=p.kind==='fence'?p.height/spec.size[1]:s;
  const y=conform?ground(p.x,p.z)+.012:foundation(p),g=conform?spec.geometry.clone():spec.geometry;
  if(conform){
   const a=p.angle??0,co=Math.cos(a),si=Math.sin(a),position=g.attributes.position;
   for(let i=0;i<position.count;i++){const x=position.getX(i)*s,z=position.getZ(i)*s;position.setY(i,position.getY(i)+(ground(p.x+x*co+z*si,p.z-x*si+z*co)-ground(p.x,p.z))/sy);}
   g.computeVertexNormals();g.computeBoundingBox();resources.push(g);
  }
  return mesh(`camp-${name}`,g,art.propMaterial,p.x,y,p.z,s,sy,s,p.angle??0);
 }
 const shelter=camp.structures.find(p=>p.kind==='shelter');
 let roofY=-Infinity;for(const x of [-.85,0,.85])for(const z of [shelter.z-.55,shelter.z,shelter.z+.55])roofY=Math.max(roofY,ground(x,z));roofY+=shelter.clearance;
 for(const p of camp.structures){
  if(p.kind==='post'){const y=ground(p.x,p.z);mesh('camp-shelter-post',box,wood,p.x,(y+roofY)/2,p.z,.07,roofY-y,.07);}
  if(p.kind==='tent')prop('tent_smallOpen',p,.94,1.15,p.height);
  if(p.kind==='seat')prop('log',p,.27,.8,.20);
  if(p.kind==='ring')prop('campfire_stones',p,.55,.55,.10);
  if(p.kind==='fence'){
   prop('fence_simpleLow',p,.78,.12,.28);
  }
 }
 mesh('camp-shelter-roof',roof,roofMaterial,0,roofY,shelter.z,1.8,1.0,1.1);
 const tableY=ground(0,1.45);mesh('camp-table',box,canvas,0,tableY+.31,1.45,.70,.045,.35);mesh('camp-table-leg',box,wood,0,tableY+.15,1.45,.07,.30,.07);
 const y=ground(.95,-2.1);mesh('camp-safe-post',box,wood,.95,y+.45,-2.1,.055,.90,.055);
 mesh('camp-safe-marker',box,green,.75,y+.78,-2.1,.45,.24,.04);
 mesh('camp-safe-cross',box,pale,.75,y+.78,-2.125,.045,.17,.008);mesh('camp-safe-cross',box,pale,.75,y+.78,-2.125,.17,.045,.008);
 return {group,resources};
}
