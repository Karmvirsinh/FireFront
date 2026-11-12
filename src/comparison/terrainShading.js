import {Vector3} from 'three';

// Lighting normals only. Position/index buffers, substrate-blend normals, logical
// data and picking geometry are invariant. Vegetation never enters this helper.
export function prepareTerrainShading(mesh){
 const g=mesh.geometry,normal=g.attributes.normal;
 if(g.attributes.studyBlendNormal===normal)g.setAttribute('studyBlendNormal',normal.clone());
 if(g.index)g.computeVertexNormals();
 else{
  const p=g.attributes.position,sums=new Map(),keys=[],a=new Vector3(),b=new Vector3(),c=new Vector3(),face=new Vector3();
  for(let i=0;i<p.count;i++){const key=`${p.getX(i)},${p.getY(i)},${p.getZ(i)}`;keys.push(key);if(!sums.has(key))sums.set(key,new Vector3());}
  for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);face.crossVectors(b.sub(a),c.sub(a));for(let v=0;v<3;v++)sums.get(keys[i+v]).add(face);}
  sums.forEach(n=>n.normalize());const values=new Float32Array(p.count*3);keys.forEach((key,i)=>values.set(sums.get(key).toArray(),i*3));normal.array.set(values);normal.needsUpdate=true;
 }
 return mode=>{if(!['smooth','faceted'].includes(mode))throw new Error('Unknown terrain shading');const flat=mode==='faceted';if(mesh.material.flatShading!==flat){mesh.material.flatShading=flat;mesh.material.needsUpdate=true;}};
}
