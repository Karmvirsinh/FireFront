// Offline conversion of the curated CC0 subset; no new dependency or runtime
// loader required. Keep source GLBs/license alongside the manifest.
import {readFile,writeFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bakeScene} from '../src/comparison/artComparison.js';
import {fireFrontPartColor} from '../src/comparison/fireFrontPalette.js';
const roster=JSON.parse(await readFile(new URL('../src/rendering/data/natureRosterManifest.json',import.meta.url),'utf8')),loader=new GLTFLoader(),result=[];
const encode=array=>Buffer.from(new Float32Array(array).buffer).toString('base64');
for(const spec of roster){
 const b=await readFile(new URL(`../public/woodland/kenney/${spec.name}.glb`,import.meta.url));
 const gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const g=bakeScene(gltf.scene,{kind:spec.kind,adapt:true});g.computeBoundingBox();const box=g.boundingBox,p=g.attributes.position,n=g.attributes.normal,codes=g.attributes.artPart;
 const radius=Math.max(...Array.from({length:p.count},(_,i)=>Math.hypot(p.getX(i),p.getZ(i)))),scale=Math.min(spec.height/(box.max.y-box.min.y),spec.radius/radius),parts=[];
 for(const wood of spec.kind==='tree'?[true,false]:[false]){
  const positions=[],normals=[],colors=[];let base=null;
  for(let i=0;i<p.count;i++){
   const code=codes.getX(i);if(spec.kind==='tree'&&(code===0)!==wood)continue;
   positions.push(p.getX(i)*scale,(p.getY(i)-box.min.y)*scale,p.getZ(i)*scale);normals.push(n.getX(i),n.getY(i),n.getZ(i));
   const part=wood?'wood':spec.family==='conifer'?'conifer':spec.family==='broadleaf'?'broadleaf':spec.kind==='brush'?'shrub':'grass';
   const color=fireFrontPartColor(part,Math.floor(i/3));colors.push(...color.toArray());base=fireFrontPartColor(part,0).toArray();
  }
  parts.push({role:wood?'wood':spec.kind==='tree'?'crown':spec.kind,position:encode(positions),normal:encode(normals),color:encode(colors),base});
 }
 result.push({...spec,parts});g.dispose();
}
await writeFile(new URL('../src/rendering/data/natureRoster.json',import.meta.url),JSON.stringify(result)+'\n');
console.log(`Prepared ${result.length} curated models; separate trunk/crown parts retained.`);
