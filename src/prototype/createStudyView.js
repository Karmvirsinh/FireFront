import * as THREE from 'three';
import {createTerrainGeometry,createTerrainSkirt} from '../rendering/terrainGeometry.js';
import {sampleStudyHeight,displayedSurface} from './studySurface.js';
import {sampleTerrainHeight} from '../world/terrain.js';
import {createStudyMaterials} from './surfaceMaterials.js';
import {seedStream} from '../world/generation/seed.js';
import {createTreeArtwork,createRockArtwork,createGrassArtwork} from './artwork.js';

export function createStudyView(map){
 const group=new THREE.Group(),resources=new Set(),meshes=[];
 const keep=o=>{resources.add(o);return o;};
 const material=options=>keep(new THREE.MeshStandardMaterial(options));
 const surface=displayedSurface(map),finish=createStudyMaterials(map);finish.resources.forEach(keep);
 const groundGeometry=keep(createTerrainGeometry(surface));
 groundGeometry.setAttribute('studyDepth',new THREE.Float32BufferAttribute(new Float32Array(groundGeometry.attributes.position.count),1));
 const vertices=groundGeometry.attributes.position,blendNormals=[],blendNormal=new THREE.Vector3(),step=.5/map.cellSize;
 for(let i=0;i<vertices.count;i++){
  const gx=vertices.getX(i)/map.cellSize+map.width/2,gz=vertices.getZ(i)/map.cellSize+map.height/2;
  const x0=Math.max(0,gx-step),x1=Math.min(map.width,gx+step),z0=Math.max(0,gz-step),z1=Math.min(map.height,gz+step);
  blendNormal.set(-(sampleStudyHeight(map,x1,gz)-sampleStudyHeight(map,x0,gz))/((x1-x0)*map.cellSize),1,-(sampleStudyHeight(map,gx,z1)-sampleStudyHeight(map,gx,z0))/((z1-z0)*map.cellSize)).normalize();
  blendNormals.push(blendNormal.x,blendNormal.y,blendNormal.z);
 }
 groundGeometry.setAttribute('studyBlendNormal',new THREE.Float32BufferAttribute(blendNormals,3));
 const ground=new THREE.Mesh(groundGeometry,finish.ground);ground.receiveShadow=true;ground.name='study-ground';group.add(ground);
 const skirt=createTerrainSkirt(surface);keep(skirt.geometry);skirt.material.dispose();skirt.material=finish.cutaway;
 const sides=skirt.geometry.attributes.position,depth=[];
 for(let i=0;i<sides.count;i++)depth.push(sampleStudyHeight(map,sides.getX(i)/map.cellSize+map.width/2,sides.getZ(i)/map.cellSize+map.height/2)-sides.getY(i));
 skirt.geometry.setAttribute('studyDepth',new THREE.Float32BufferAttribute(depth,1));skirt.receiveShadow=true;group.add(skirt);
 skirt.geometry.setAttribute('studyBlendNormal',skirt.geometry.attributes.normal);
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),point=new THREE.Vector3(),scale=new THREE.Vector3();
 const random=seedStream(map.prototype.seed,`art:dressing:${map.prototype.kind}`);
 const placements={trees:[[],[]],grass:[],rocks:[[],[],[]]};
 const relief=Math.max(...map.elevation.cornerHeights);
 const isTrail=i=>map.cells[i]?.terrain==='trail';
 const nearTrail=i=>[i,i-1,i+1,i-map.width,i+map.width].some(isTrail);
 // Off-grid jitter, spatial exclusion and a seeded forest edge break model rows.
 const treePoints=[];
 for(let attempt=0;attempt<1000;attempt++){
  const gx=1+random()*(map.width-2),gz=1+random()*(map.height-2),index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  if(cell.terrain!=='forest'||cell.slope>24||nearTrail(index))continue;
  const x=(gx-map.width/2)*map.cellSize,z=(gz-map.height/2)*map.cellSize;
  if(treePoints.some(p=>Math.hypot(p.x-x,p.z-z)<.86))continue;
  const p={x,z,y:sampleStudyHeight(map,gx,gz),s:.70+random()*.40,angle:random()*6.28,index};
  treePoints.push(p);placements.trees[random()<.55?0:1].push(p);
 }
 for(let attempt=0;attempt<2600;attempt++){
  const gx=random()*map.width,gz=random()*map.height,index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  const p={x:(gx-map.width/2)*map.cellSize,z:(gz-map.height/2)*map.cellSize,y:sampleStudyHeight(map,gx,gz),s:.65+random()*.75,angle:random()*6.28,index};
  if(cell.terrain==='grass'&&cell.slope<20&&random()<.80)placements.grass.push(p);
  else if(cell.terrain==='rock'&&(sampleTerrainHeight(map,gx,gz)/relief<.35||sampleTerrainHeight(map,gx,gz)/relief>.80)&&random()<.13){p.s=.2+random()*.65;placements.rocks[attempt%3].push(p);}
 }
 function instances(geometry,mat,items,name){
  keep(geometry);const mesh=new THREE.InstancedMesh(geometry,mat,items.length);mesh.name=name;
  items.forEach((p,i)=>{point.set(p.x,p.y,p.z);rotation.setFromAxisAngle(up,p.angle);scale.set(p.s,p.s,p.s);matrix.compose(point,rotation,scale);mesh.setMatrixAt(i,matrix);});
  mesh.castShadow=name!=='grass';mesh.receiveShadow=true;mesh.userData.placements=items;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);meshes.push(mesh);return mesh;
 }
 const artMaterial=material({vertexColors:true,roughness:1});
 for(let species=0;species<2;species++){
  const art=createTreeArtwork(species);instances(art.wood,artMaterial,placements.trees[species],`tree-wood-${species}`);instances(art.foliage,artMaterial,placements.trees[species],`tree-foliage-${species}`);
 }
 instances(createGrassArtwork(),material({vertexColors:true,side:THREE.DoubleSide,roughness:1}),placements.grass,'grass');
 for(let i=0;i<3;i++)instances(createRockArtwork(i),artMaterial,placements.rocks[i],`boulders-${i}`);
 let disposed=false;
 return {group,ground,placements,dispose(){if(disposed)return;disposed=true;meshes.forEach(m=>m.dispose());resources.forEach(r=>r.dispose());}};
}
