// Offline CC0 subset conversion. Source files remain untouched; no runtime loader.
import {readFile,writeFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3,Matrix3,Color} from 'three';
const names=['tent_smallOpen','campfire_stones','log','fence_simpleLow'];
const palette={colorRed:0xb68a52,colorRedDark:0x796544,wood:0x745235,woodBark:0x654932,woodInner:0xb69a6d,stone:0x858277};
const result=[],encode=a=>Buffer.from(new Float32Array(a).buffer).toString('base64');
for(const name of names){
 const bytes=await readFile(new URL(`../public/camp/kenney/${name}.glb`,import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');scene.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(scene),center=bounds.getCenter(new Vector3()),position=[],normal=[],color=[];
 scene.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material],nm=new Matrix3().getNormalMatrix(mesh.matrixWorld),v=new Vector3(),nv=new Vector3();
  for(let k=0;k<(index?.count??p.count);k++){
   const i=index?index.getX(k):k,group=g.groups.find(q=>k>=q.start&&k<q.start+q.count),m=materials[group?.materialIndex??0];
   if(!(m.name in palette))throw new Error(`Unmapped camp material: ${m.name}`);
   v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);position.push(v.x-center.x,v.y-bounds.min.y,v.z-center.z);
   nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();normal.push(...nv.toArray());
   color.push(...new Color(palette[m.name]).multiplyScalar(1+Math.sin(Math.floor(k/3)*2.7)*.025).toArray());
  }
 });
 result.push({name,size:bounds.getSize(new Vector3()).toArray(),position:encode(position),normal:encode(normal),color:encode(color)});
}
await writeFile(new URL('../src/rendering/data/campArtwork.json',import.meta.url),JSON.stringify(result)+'\n');
console.log(`Prepared ${result.length} camp props with named-part FireFront colors.`);
