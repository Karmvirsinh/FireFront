import * as THREE from 'three';
import {createTerrainGeometry,createTerrainSkirt} from '../rendering/terrainGeometry.js';
import {sampleTerrainHeight} from '../world/terrain.js';
import {seedStream} from '../world/generation/seed.js';
import {createTreeArtwork,createRockArtwork,createGrassArtwork} from './artwork.js';

export function createStudyView(map){
 const group=new THREE.Group(),resources=new Set(),meshes=[];
 const keep=o=>{resources.add(o);return o;};
 const material=options=>keep(new THREE.MeshStandardMaterial(options));
 const groundGeometry=keep(createTerrainGeometry(map)),colors=[];
 const pos=groundGeometry.attributes.position,normals=groundGeometry.attributes.normal;
 const palette={forest:0x5e7043,grass:0x899657,trail:0x9b7850,rock:0x858375,'dry-channel':0x8c8168};
 const color=new THREE.Color(),shade=new THREE.Color();
 for(let i=0;i<pos.count;i++){
  const cell=map.cells[Math.floor(i/6)],slope=Math.acos(Math.max(-1,Math.min(1,normals.getY(i))))*180/Math.PI;
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  color.setHex(palette[cell.terrain]);
  const grain=Math.sin(x*24+z*17)*Math.sin(z*29-x*11)*.025;
  const mottling=Math.sin(x*.74+Math.sin(z*.47))*Math.cos(z*.63)*.055;
  color.multiplyScalar(1+grain+mottling);
  // Only the imported study uses Gaea's exported layer mask, as surface detail.
  // It does not control fuel, walkability or any production classification.
  if(map.surfaceLayers&&cell.terrain==='rock')color.multiplyScalar(.86+map.surfaceLayers[Math.floor(i/6)]*.5);
  if(slope>20){
   const strata=.88+.12*Math.sin(y*11+Math.sin(x*1.4+z*.7)*.6);
   shade.setHex(slope>38?0x898878:0x827359).multiplyScalar(strata);
   color.lerp(shade,Math.min(1,(slope-20)/12));
  }
  colors.push(color.r,color.g,color.b);
 }
 groundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const ground=new THREE.Mesh(groundGeometry,material({vertexColors:true,roughness:1}));ground.receiveShadow=true;ground.name='study-ground';group.add(ground);
 const skirt=createTerrainSkirt(map);keep(skirt.geometry);keep(skirt.material);skirt.material.color.setHex(0x64533d);skirt.receiveShadow=true;group.add(skirt);
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
  const p={x,z,y:sampleTerrainHeight(map,gx,gz),s:.70+random()*.40,angle:random()*6.28,index};
  treePoints.push(p);placements.trees[random()<.55?0:1].push(p);
 }
 for(let attempt=0;attempt<2600;attempt++){
  const gx=random()*map.width,gz=random()*map.height,index=Math.floor(gz)*map.width+Math.floor(gx),cell=map.cells[index];
  const p={x:(gx-map.width/2)*map.cellSize,z:(gz-map.height/2)*map.cellSize,y:sampleTerrainHeight(map,gx,gz),s:.65+random()*.75,angle:random()*6.28,index};
  if(cell.terrain==='grass'&&cell.slope<20&&random()<.80)placements.grass.push(p);
  else if(cell.terrain==='rock'&&(p.y/relief<.35||p.y/relief>.80)&&random()<.13){p.s=.2+random()*.65;placements.rocks[attempt%3].push(p);}
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
