import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {seedStream} from '../world/generation/seed.js';

// Original modular artwork: no downloaded meshes or runtime asset service.
function colorGeometry(geometry,hex,variation=.06){
 const g=geometry.index?geometry.toNonIndexed():geometry,c=new THREE.Color(hex),colors=[];
 if(g!==geometry)geometry.dispose();
 for(let i=0;i<g.attributes.position.count;i++){
  const v=1+Math.sin(Math.floor(i/3)*12.7)*variation;colors.push(c.r*v,c.g*v,c.b*v);
 }
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return g;
}
function segment(a,b,r1,r2,color){
 const direction=new THREE.Vector3().subVectors(b,a),g=new THREE.CylinderGeometry(r2,r1,direction.length(),5);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
 g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return colorGeometry(g,color);
}
function leaf(position,scale,color,rotation=0){
 const g=new THREE.IcosahedronGeometry(1,0);g.scale(...scale);g.rotateY(rotation);g.translate(...position);return colorGeometry(g,color,.1);
}
export function createTreeArtwork(species=0){
 const wood=[],foliage=[];
 wood.push(segment(new THREE.Vector3(0,0,0),new THREE.Vector3(.04,2.8,0),.11,.035,species?0x72604b:0x5f4832));
 if(!species){
  for(let i=0;i<7;i++){
   const angle=i*2.4,r=.35+(i%3)*.16,y=1.7+(i%3)*.36;
   const p=[Math.cos(angle)*r,y,Math.sin(angle)*r];
   wood.push(segment(new THREE.Vector3(0,1.1,0),new THREE.Vector3(...p),.045,.018,0x65503a));
   foliage.push(leaf([p[0],p[1]+.32,p[2]],[.65,.65,.57],[0x416444,0x557544,0x6c8547][i%3],angle));
  }
  foliage.push(leaf([0,2.65,0],[.6,.64,.56],0x6c874c));
 }else{
  // Layered bough clusters rather than the normal application's stacked cones.
  for(let ring=0;ring<4;ring++)for(let branch=0;branch<4;branch++){
   const angle=branch*Math.PI/2+ring*1.2,r=.57-ring*.10,y=1+ring*.50;
   const p=[Math.cos(angle)*r,y,Math.sin(angle)*r];
   wood.push(segment(new THREE.Vector3(0,y-.18,0),new THREE.Vector3(...p),.025,.008,0x6b533b));
   foliage.push(leaf([p[0],y+.15,p[2]],[r*.90,.37,r*.75],[0x345e4b,0x416f50,0x567d54][(ring+branch)%3],angle));
  }
  foliage.push(leaf([0,2.85,0],[.25,.48,.24],0x648558));
 }
 const merge=list=>{const result=mergeGeometries(list);list.forEach(g=>g.dispose());return result;};
 return {wood:merge(wood),foliage:merge(foliage)};
}
export function createGrassArtwork(){
 const positions=[],colors=[],random=seedStream(11,'art:grass');
 for(let i=0;i<9;i++){
  const angle=random()*Math.PI*2,x=(random()-.5)*.18,z=(random()-.5)*.18,h=.12+random()*.25;
  const dx=Math.cos(angle)*.025,dz=Math.sin(angle)*.025;
  positions.push(x-dx,0,z-dz,x+dx,0,z+dz,x+Math.cos(angle)*.10,h,z+Math.sin(angle)*.10);
  const c=new THREE.Color([0x8d9e60,0x71834b,0xa8ad70][i%3]);for(let v=0;v<3;v++)colors.push(c.r,c.g,c.b);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function createRockArtwork(variant){
 const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,random=seedStream(variant,'art:stone');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.86+.13*Math.sin(x*6+z*4+y*5+variant);
  p.setXYZ(i,x*r,Math.max(0,(y*.62+.43)*r),z*r*.78);
 }
 g.computeVertexNormals();return colorGeometry(g,[0x868373,0x77786c,0x99907b][variant%3],.10);
}

// Compact original broadleaf shrub: woody stems and clustered low foliage.
export function createBrushArtwork(){
 const pieces=[segment(new THREE.Vector3(0,0,0),new THREE.Vector3(.03,.32,0),.025,.012,0x71563a)];
 for(let i=0;i<5;i++){
  const a=i*2.4,x=Math.cos(a)*.13,z=Math.sin(a)*.13;
  pieces.push(segment(new THREE.Vector3(0,.08,0),new THREE.Vector3(x,.26,z),.014,.006,0x71563a));
  pieces.push(leaf([x,.27+(i%2)*.04,z],[.15,.15,.13],[0x547247,0x6c804a,0x75834d][i%3],a));
 }
 const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}
