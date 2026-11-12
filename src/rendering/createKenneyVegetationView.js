import * as THREE from 'three';
import data from './data/natureRoster.json' with {type:'json'};
import {createWoodlandLayout} from './woodlandComposition.js';

const decode=text=>new Float32Array(Uint8Array.from(atob(text),c=>c.charCodeAt(0)).buffer);
export function createKenneyVegetationView(map){
 const layout=createWoodlandLayout(map),group=new THREE.Group(),resources=new Set(),meshes=[],byCell=new Map(),firePoses=new Map();group.name='kenney-woodland';
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),plantMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),charMaterial=new THREE.MeshStandardMaterial({color:0x302b29,roughness:1});resources.add(material);resources.add(plantMaterial);resources.add(charMaterial);
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),white=new THREE.Color(0xffffff),burnTint=new THREE.Color(0x89613f),hidden=new THREE.Matrix4().makeScale(0,0,0);
 function batch(name,g,items,role,mat=material,base=null){
  resources.add(g);g.computeBoundingBox();const mesh=new THREE.InstancedMesh(g,mat,items.length);mesh.name=name;mesh.userData.fuelDecoration=true;mesh.userData.cells=items.map(p=>p.cell);mesh.userData.placements=items;mesh.frustumCulled=false;
  items.forEach((p,i)=>{
   position.set(p.x,p.y,p.z);scale.fromArray(p.scale);q.setFromAxisAngle(up,p.angle);matrix.compose(position,q,scale);
   const original=matrix.clone(),tint=white.clone();
   if(role==='crown'&&base){
    if(p.season>0){const target=new THREE.Color(p.season>.65?0xa95c32:0xb0a14c),green=new THREE.Color().fromArray(base);green.lerp(target,p.season);tint.setRGB(green.r/base[0],green.g/base[1],green.b/base[2]);}
    const v=Math.sin(p.cell*12.79)*.025;tint.multiply(new THREE.Color().setRGB(1+v,1,1-v));
   }
   mesh.setMatrixAt(i,role==='stump'?hidden:original);mesh.setColorAt(i,tint);
   if(!byCell.has(p.cell))byCell.set(p.cell,[]);byCell.get(p.cell).push({mesh,slot:i,original,tint,role});
   if(['crown','grass','brush'].includes(role))firePoses.set(p.cell,{gx:p.gx,gz:p.gz,height:g.boundingBox.max.y*p.scale[1],radius:p.radius,kind:role});
  });
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);if(mesh.instanceColor)mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);group.add(mesh);meshes.push(mesh);
 }
 for(const model of data){const items=(model.kind==='tree'?layout.trees:layout[model.kind]).filter(p=>p.model===model.name);if(!items.length)continue;
  for(const part of model.parts){const g=new THREE.BufferGeometry();for(const key of ['position','normal','color'])g.setAttribute(key,new THREE.BufferAttribute(decode(part[key]),3));batch(`${model.kind}-${model.name}-${part.role}`,g,items,part.role,model.kind==='grass'?plantMaterial:material,part.base);}
 }
 const stump=new THREE.CylinderGeometry(.055,.11,.58,5);stump.translate(0,.29,0);batch('charred-tree-remnants',stump,layout.trees,'stump',charMaterial);
 const color=new THREE.Color();
 function sync(index,state){const burning=state==='burning',exhausted=state==='burned-hot'||state==='burned-cool';
  for(const item of byCell.get(index)??[]){const {mesh,slot,original,tint,role}=item;matrix.copy(original);if(role==='stump'){if(!exhausted)matrix.copy(hidden);}else if(exhausted)matrix.copy(hidden);else if(burning&&(role==='grass'||role==='brush'))matrix.scale(new THREE.Vector3(.82,.65,.82));mesh.setMatrixAt(slot,matrix);mesh.instanceMatrix.addUpdateRange(slot*16,16);mesh.instanceMatrix.needsUpdate=true;color.copy(tint);if(burning)color.multiply(burnTint);mesh.setColorAt(slot,color);mesh.instanceColor.addUpdateRange(slot*3,3);mesh.instanceColor.needsUpdate=true;}
 }
 let disposed=false;return {group,layout,firePoses,treeCells:new Set(layout.trees.map(p=>p.cell)),sync,dispose(){if(disposed)return;disposed=true;meshes.forEach(m=>m.dispose());resources.forEach(r=>r.dispose());}};
}
