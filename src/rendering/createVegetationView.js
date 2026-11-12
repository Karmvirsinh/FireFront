import * as THREE from 'three';
import {createTreeArtwork,createGrassArtwork,createBrushArtwork} from './vegetationArtwork.js';
import {createVegetationLayout} from './createVegetationLayout.js';
import {createKenneyVegetationView} from './createKenneyVegetationView.js';

export function createVegetationView(map){
 if(map.rendering?.woodlandArtwork==='kenney-woodland-v1')return createKenneyVegetationView(map);
 const group=new THREE.Group();group.name='beta-vegetation';
 const resources=new Set(),meshes=[],byCell=new Map(),firePoses=new Map(),layout=createVegetationLayout(map);
 const artMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});resources.add(artMaterial);
 const grassMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});resources.add(grassMaterial);
 const charMaterial=new THREE.MeshStandardMaterial({color:0x302b29,roughness:1});resources.add(charMaterial);
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),position=new THREE.Vector3(),scale=new THREE.Vector3(),color=new THREE.Color();
 const hidden=new THREE.Matrix4().makeScale(0,0,0);
 function batch(name,geometry,items,kind,material=artMaterial){
  resources.add(geometry);const mesh=new THREE.InstancedMesh(geometry,material,items.length);mesh.name=name;mesh.userData.fuelDecoration=true;mesh.userData.cells=items.map(p=>p.cell);mesh.userData.placements=items;
  geometry.computeBoundingBox();
  items.forEach((p,i)=>{
   position.set(p.x,p.y,p.z);scale.fromArray(p.scale);rotation.setFromAxisAngle(up,p.angle);matrix.compose(position,rotation,scale);
   const original=matrix.clone();mesh.setMatrixAt(i,kind==='stump'?hidden:original);mesh.setColorAt(i,color.setHex(0xffffff));
   if(!byCell.has(p.cell))byCell.set(p.cell,[]);byCell.get(p.cell).push({mesh,slot:i,original,kind});
   if(kind==='crown'||kind==='grass'||kind==='brush')firePoses.set(p.cell,{gx:p.gx,gz:p.gz,height:geometry.boundingBox.max.y*p.scale[1],radius:p.radius,kind});
  });
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
  group.add(mesh);meshes.push(mesh);return mesh;
 }
 for(let species=0;species<2;species++){
  const items=layout.trees.filter(p=>p.species===species),art=createTreeArtwork(species);
  batch(`tree-wood-${species}`,art.wood,items,'wood');batch(`tree-crown-${species}`,art.foliage,items,'crown');
 }
 const stump=new THREE.CylinderGeometry(.055,.11,.58,5);stump.translate(0,.29,0);batch('charred-tree-remnants',stump,layout.trees,'stump',charMaterial);
 batch('grass-tufts',createGrassArtwork(),layout.grass,'grass',grassMaterial);batch('brush-shrubs',createBrushArtwork(),layout.brush,'brush');
 function sync(index,state){
  const burning=state==='burning',exhausted=state==='burned-hot'||state==='burned-cool';
  for(const item of byCell.get(index)??[]){
   const {mesh,slot,original,kind}=item;
   matrix.copy(original);
   if(kind==='stump'){if(!exhausted)matrix.copy(hidden);}
   else if(exhausted)matrix.copy(hidden);
   else if(burning&&(kind==='grass'||kind==='brush'))matrix.scale(new THREE.Vector3(.82,.65,.82));
   mesh.setMatrixAt(slot,matrix);mesh.instanceMatrix.addUpdateRange(slot*16,16);mesh.instanceMatrix.needsUpdate=true;
   mesh.setColorAt(slot,color.setHex(burning?0x89613f:0xffffff));mesh.instanceColor.addUpdateRange(slot*3,3);mesh.instanceColor.needsUpdate=true;
  }
 }
 let disposed=false;
 return {group,layout,firePoses,treeCells:new Set(layout.trees.map(p=>p.cell)),sync,dispose(){if(disposed)return;disposed=true;meshes.forEach(m=>m.dispose());resources.forEach(r=>r.dispose());}};
}
