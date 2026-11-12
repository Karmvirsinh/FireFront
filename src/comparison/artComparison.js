import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createTreeArtwork,createBrushArtwork,createGrassArtwork,createRockArtwork} from '../rendering/vegetationArtwork.js';
import {seedStream} from '../world/generation/seed.js';
import {sampleStudyHeight} from '../prototype/studySurface.js';
import {originalStudyPlacements} from './originalStudyPlacements.js';
import {palettePart,fireFrontPartColor} from './fireFrontPalette.js';

export const PACK_NAMES=['tree_oak','tree_pineDefaultA','plant_bush','plant_bushLarge','grass','grass_large','rock_smallA','rock_largeA'];
const specifications={tree:{height:3.3,radius:1.08},brush:{height:.45,radius:.42},grass:{height:.32,radius:.29},rock:{height:.55,radius:.65}};
function normalize(g,kind){
 g.computeBoundingBox();const b=g.boundingBox,center=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3()),spec=specifications[kind];
 g.translate(-center.x,-b.min.y,-center.z);const factor=Math.min(spec.height/size.y,spec.radius/(Math.hypot(size.x,size.z)/2));g.scale(factor,factor,factor);g.computeBoundingBox();return g;
}
function combine(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;}
export function bakeScene(scene,{kind='tree',adapt=false}={}){
 scene.updateMatrixWorld(true);const parts=[];
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const source=mesh.geometry,index=source.index,positions=source.attributes.position,normal=source.attributes.normal,vertex=source.attributes.color;
  const pos=[],norm=[],colors=[],partCodes=[],point=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(let i=0;i<(index?.count??positions.count);i++){
   const j=index?index.getX(i):i,group=source.groups.find(g=>i>=g.start&&i<g.start+g.count),mat=materials[group?.materialIndex??0],c=mat.color.clone().convertSRGBToLinear();
   // This legacy UniGLTF subset stores the palette's sRGB channel values directly
   // in glTF's LINEAR factor slot (also matches OBJ Kd and supplied PNG pixels).
   // Decode exactly once, not an artistic green tint. GLBs stay untouched.
   const part=palettePart(kind,mat.name),codes=['wood','broadleaf','conifer','shrub','grass','stone','moss'];
   if(adapt)c.copy(fireFrontPartColor(part,Math.floor(i/3)));
   if(vertex)c.multiply(new THREE.Color().fromBufferAttribute(vertex,j));partCodes.push(codes.indexOf(part));
   point.fromBufferAttribute(positions,j).applyMatrix4(mesh.matrixWorld);pos.push(...point.toArray());
   if(normal){n.fromBufferAttribute(normal,j).applyMatrix3(normalMatrix).normalize();norm.push(...n.toArray());}
   colors.push(c.r,c.g,c.b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('artPart',new THREE.Float32BufferAttribute(partCodes,1));
  if(norm.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));else g.computeVertexNormals();parts.push(g);
 });
 const g=combine(parts),resources=new Set();scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])resources.add(m);});resources.forEach(r=>r.dispose());return g;
}
export async function loadArtwork(mode,loadModel=null){
 if(mode==='original'){
  const trees=[0,1].map(i=>{const a=createTreeArtwork(i);return combine([a.wood,a.foliage]);});
  return {tree:trees,brush:[normalize(createBrushArtwork(),'brush')],grass:[createGrassArtwork()],rock:[0,1,2].map(i=>createRockArtwork(i))};
 }
 const loader=new GLTFLoader(),art={tree:[],brush:[],grass:[],rock:[]},reference=await loadArtwork('original');
 const fit=(g,kind,variant)=>{
  const target=reference[kind][variant%reference[kind].length];target.computeBoundingBox();g.computeBoundingBox();
  const b=g.boundingBox,t=target.boundingBox,sz=b.getSize(new THREE.Vector3()),ts=t.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  g.translate(-center.x,-b.min.y,-center.z);
  const scale=Math.min(ts.y/sz.y,Math.hypot(ts.x,ts.z)/Math.hypot(sz.x,sz.z));g.scale(scale,scale,scale);g.computeBoundingBox();return g;
 };
 try{
  // Sequential small subset, embedded geometry/colors only; no texture requests.
  for(const [i,name]of PACK_NAMES.entries()){
   const gltf=loadModel?await loadModel(name):await loader.loadAsync(`${import.meta.env.BASE_URL}comparison/kenney/${name}.glb`),kind=['tree','brush','grass','rock'][Math.floor(i/2)];
   art[kind].push(fit(bakeScene(gltf.scene,{kind,adapt:true}),kind,i%2));
  }
  art.rock.push(fit(art.rock[0].clone(),'rock',2));
  Object.defineProperty(art,'palette',{value:'firefront'});
  return art;
 }catch(error){disposeArtwork(art);throw error;}finally{disposeArtwork(reference);}
}
export function disposeArtwork(art){for(const items of Object.values(art))for(const g of items)g.dispose();}

// Independent deterministic placement manifest shared by A and B. Common maximum
// envelopes protect trails, while every stem/base retains a logical fuel owner.
export function comparisonPlacements(map){
 const original=originalStudyPlacements(map),items=[];
 const convert=(p,kind,variant)=>({...p,kind,variant,gx:p.x/map.cellSize+map.width/2,gz:p.z/map.cellSize+map.height/2});
 original.trees.forEach((group,variant)=>group.forEach(p=>items.push(convert(p,'tree',variant))));
 original.grass.forEach(p=>items.push(convert(p,'grass',0)));
 original.rocks.forEach((group,variant)=>group.forEach(p=>items.push(convert(p,'rock',variant))));
 // Shrubs alone are an additive comparison sample on their own stream. Never
 // consume the original tree/grass/rock stream or replace its scatter rules.
 const random=seedStream(map.prototype.seed,`comparison-shrubs:${map.prototype.kind}`);
 const protectedCells=map.cells.map((c,i)=>c.terrain==='trail'?i:-1).filter(i=>i>=0);
 const intersectsTrail=(gx,gz,radius)=>protectedCells.some(i=>{
  const x=i%map.width,z=Math.floor(i/map.width),dx=Math.max(x-gx,0,gx-x-1)*map.cellSize,dz=Math.max(z-gz,0,gz-z-1)*map.cellSize;
  return Math.hypot(dx,dz)<radius+.04;
 });
 function add(kind,gx,gz,s,index){
  if(intersectsTrail(gx,gz,specifications[kind].radius*s))return;
  items.push({kind,gx,gz,index,s,angle:random()*Math.PI*2,variant:Math.floor(random()*2)});
 }
 for(let attempt=0;attempt<900;attempt++){
  const gx=random()*map.width,gz=random()*map.height,index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  if(cell.terrain==='forest'&&cell.slope<24&&random()<.22)add('brush',gx,gz,.70+random()*.30,index);
 }
 return items;
}
export function createDressing(map,art,placements){
 const group=new THREE.Group(),materials=new Map(),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),point=new THREE.Vector3(),size=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),meshes=[];
 for(const [kind,variants]of Object.entries(art))variants.forEach((geometry,variant)=>{
  if(!materials.has(kind))materials.set(kind,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,side:['grass','brush'].includes(kind)?THREE.DoubleSide:THREE.FrontSide}));const material=materials.get(kind);
  const items=placements.filter(p=>p.kind===kind&&p.variant%variants.length===variant),mesh=new THREE.InstancedMesh(geometry,material,items.length);
  items.forEach((p,i)=>{point.set((p.gx-map.width/2)*map.cellSize,sampleStudyHeight(map,p.gx,p.gz),(p.gz-map.height/2)*map.cellSize);q.setFromAxisAngle(up,p.angle);size.setScalar(p.s);matrix.compose(point,q,size);mesh.setMatrixAt(i,matrix);if(art.palette==='firefront'){const t=Math.sin(p.index*13.7)*.035;mesh.setColorAt(i,new THREE.Color().setRGB(1+t,1,1-t));}});
  mesh.castShadow=kind!=='grass';mesh.receiveShadow=true;
  mesh.name=`comparison-${kind}-${variant}`;mesh.userData.placements=items;group.add(mesh);meshes.push(mesh);
 });
 let disposed=false;return {group,dispose(){if(disposed)return;disposed=true;meshes.forEach(m=>m.dispose());materials.forEach(m=>m.dispose());disposeArtwork(art);}};
}
