import * as THREE from 'three';

// Original compact shelter artwork, no imported assets/interiors. Footprints,
// entrances and nonburnability come from plain map data, not visual meshes.
export function createBuildingView(map){
 const group=new THREE.Group(),resources=[];group.name='functional-buildings';
 const box=new THREE.BoxGeometry(1,1,1);resources.push(box);
 const roof=new THREE.BufferGeometry(),p=[];
 const v=[[-.5,0,-.5],[.5,0,-.5],[0,.36,-.5],[-.5,0,.5],[.5,0,.5],[0,.36,.5]];
 for(const f of [[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4],[0,1,4],[0,4,3]])for(const i of f)p.push(...v[i]);
 roof.setAttribute('position',new THREE.Float32BufferAttribute(p,3));roof.computeVertexNormals();resources.push(roof);
 const material=hex=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness:1});resources.push(m);return m;};
 const wall=material(0xc5b68b),base=material(0x676557),origin=material(0x9a623b),safe=material(0x3c604b),door=material(0x362e22),blue=material(0x478ecb),green=material(0x55b69b);
 for(const b of map.buildings??[]){
  const house=new THREE.Group();house.name=b.id;house.userData.building=b;
  house.position.set((b.x+.5-map.width/2)*map.cellSize,b.baseY,(b.z+.5-map.height/2)*map.cellSize);house.rotation.y=Math.atan2(b.dx,b.dz);
  const mesh=(g,m,x,y,z,sx,sy,sz)=>{const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);house.add(a);};
  const width=3*map.cellSize;
  mesh(box,base,0,-.29,0,width,.6,width);
  mesh(box,wall,0,.43,0,width,.86,width);
  mesh(roof,b.kind==='origin'?origin:safe,0,.86,0,width+.08,1,width+.08);
  mesh(box,door,0,.30,-width/2-.006,.34,.6,.012);
  mesh(box,b.kind==='origin'?blue:green,0,.75,-width/2-.012,.42,.12,.016);
  group.add(house);
 }
 return {group,dispose(){resources.forEach(r=>r.dispose());}};
}
