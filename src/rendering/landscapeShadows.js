import {Box3,Vector3,PCFShadowMap,BackSide} from 'three';

export function setLandscapeShadowFlags(group){
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(!mats.some(m=>m?.isMeshStandardMaterial))return; // flames/embers/labels excluded
  // Double-sided terrain otherwise writes its receiving face into the same
  // shadow depth pass, causing grazing-angle bands. Back-face depth casting
  // preserves occlusion while leaving visible/picking material sides unchanged.
  mats.forEach(m=>{if(m?.isMeshStandardMaterial)m.shadowSide=BackSide;});
  mesh.receiveShadow=true;mesh.castShadow=!mesh.name.toLowerCase().includes('grass');
 });
}
export function configureLandscapeShadows(renderer,sun,map,{enabled=true}={}){
 if(renderer.shadowMap){renderer.shadowMap.enabled=enabled;renderer.shadowMap.type=PCFShadowMap;}
 sun.castShadow=enabled;
 if(!enabled)return {dispose(){}};
 const heights=map.elevation?.surface?.cornerHeights??map.displaySurface?.elevation?.cornerHeights??map.elevation?.cornerHeights??[0];
 let low=Infinity,high=-Infinity;for(const h of heights){low=Math.min(low,h);high=Math.max(high,h);}
 const halfX=map.width*map.cellSize/2,halfZ=map.height*map.cellSize/2;
 // Full static map and upright canopy, rather than a camera-following crop.
 const box=new Box3(new Vector3(-halfX-1.5,low-1,-halfZ-1.5),new Vector3(halfX+1.5,high+4.5,halfZ+1.5));
 const center=box.getCenter(new Vector3()),direction=new Vector3(-16,27,14).normalize(),distance=box.getSize(new Vector3()).length()+10;
 sun.target.position.copy(center);sun.position.copy(center).addScaledVector(direction,distance);sun.updateMatrixWorld(true);sun.target.updateMatrixWorld(true);
 sun.shadow.updateMatrices(sun);
 const camera=sun.shadow.camera,lightBox=new Box3();
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])lightBox.expandByPoint(new Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 Object.assign(camera,{left:lightBox.min.x-1,right:lightBox.max.x+1,bottom:lightBox.min.y-1,top:lightBox.max.y+1,near:Math.max(.1,-lightBox.max.z-2),far:-lightBox.min.z+2});camera.updateProjectionMatrix();
 const size=Math.max(map.width,map.height)*map.cellSize>32?2048:1024;sun.shadow.mapSize.set(size,size);
 sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;sun.shadow.radius=1;sun.shadow.needsUpdate=true;
 let disposed=false;return {box,size,dispose(){if(disposed)return;disposed=true;sun.shadow.map?.dispose();sun.shadow.mapPass?.dispose();sun.shadow.map=null;sun.shadow.mapPass=null;}};
}
