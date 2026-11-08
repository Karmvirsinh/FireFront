import * as THREE from 'three';
import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';

// Original repeatable material artwork. Textures describe grain/cracks, never geometry.
export function createStudyMaterials(map){
 const resources=[],noise=createNoise2D(seedStream(8173,'study-surface-art'));
 function texture(size,pixel){
  const bytes=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const rgb=pixel(x,z);for(let c=0;c<3;c++)bytes[(z*size+x)*4+c]=Math.round(Math.max(0,Math.min(255,rgb[c])));bytes[(z*size+x)*4+3]=255;
  }
  const t=new THREE.DataTexture(bytes,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;resources.push(t);return t;
 }
 const palettes={meadow:[105,121,65],dirt:[130,105,70],stone:[116,105,86]};
 const textures=Object.fromEntries(Object.entries(palettes).map(([name,base])=>[name,texture(128,(x,z)=>{
  const grain=noise(x*.73,z*.73)*.07,cloud=noise(x*.055,z*.055)*.1;
  const crack=name==='stone'?Math.pow(Math.max(0,1-Math.abs(noise(x*.08,z*.08))/.045),3)*.19:0;
  const grit=name==='dirt'&&noise(x*.9,z*.9)>.55?.13:0;
  return base.map(c=>c*(1+grain+cloud-crack+grit));
 })]));
 // A blurred woodland weight removes categorical square color patches. Trail
 // weight stays local; this finish is not an ignition/traversal classification.
 const weights=new Uint8Array(map.width*map.height*4),at=(x,z)=>map.cells[Math.max(0,Math.min(map.height-1,z))*map.width+Math.max(0,Math.min(map.width-1,x))];
 for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
  let forest=0,total=0;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const w=Math.exp(-(dx*dx+dz*dz)/3);forest+=(at(x+dx,z+dz).terrain==='forest'?1:0)*w;total+=w;}
  const i=(z*map.width+x)*4;weights[i]=forest/total*255;weights[i+1]=at(x,z).terrain==='trail'?255:0;weights[i+2]=at(x,z).terrain==='dry-channel'?255:0;weights[i+3]=(map.surfaceLayers?.[z*map.width+x]??.5)*255;
 }
 const coverage=new THREE.DataTexture(weights,map.width,map.height);coverage.magFilter=THREE.LinearFilter;coverage.minFilter=THREE.LinearFilter;coverage.needsUpdate=true;resources.push(coverage);
 const common=`varying vec3 vStudyPosition; varying vec3 vStudyNormal; varying float vStudyDepth;`;
 const definitions=`${common}
 uniform sampler2D studyMeadow,studyDirt,studyStone,studyCoverage;
 uniform vec2 studySize; uniform float studyCut;
 vec3 studyTri(sampler2D tex,vec3 p,vec3 n){vec3 w=pow(abs(n),vec3(4.0));w/=max(.0001,w.x+w.y+w.z);return texture2D(tex,p.zy*.44).rgb*w.x+texture2D(tex,p.xz*.44).rgb*w.y+texture2D(tex,p.xy*.44).rgb*w.z;}
 `;
 function material(cut=false){
  const m=new THREE.MeshStandardMaterial({roughness:.96,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,{studyMeadow:{value:textures.meadow},studyDirt:{value:textures.dirt},studyStone:{value:textures.stone},studyCoverage:{value:coverage},studySize:{value:new THREE.Vector2(map.width*map.cellSize,map.height*map.cellSize)},studyCut:{value:cut?1:0}});
   shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\n${common}\nattribute float studyDepth; attribute vec3 studyBlendNormal;`).replace('#include <begin_vertex>',`#include <begin_vertex>\nvStudyPosition=(modelMatrix*vec4(position,1.0)).xyz;vStudyNormal=normalize(mat3(modelMatrix)*studyBlendNormal);vStudyDepth=studyDepth;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${definitions}`).replace('#include <color_fragment>',`
    vec3 p=vStudyPosition,n=normalize(vStudyNormal);
    vec4 cover=texture2D(studyCoverage,p.xz/studySize+.5);
    vec3 grass=studyTri(studyMeadow,p,n),dirt=studyTri(studyDirt,p,n),stone=studyTri(studyStone,p,n);
    float weather=.5+.5*sin(p.x*.38+sin(p.z*.24)+p.y*.31);
    vec3 floorColor=mix(grass,mix(grass*.76,dirt,.38),cover.r);
    float rock=smoothstep(.04,.32,1.0-abs(n.y));
    vec3 rockColor=mix(dirt*.87,stone,weather*.72+.18)*(.94+cover.a*.12);
    vec3 surface=mix(floorColor,rockColor,rock);
    surface=mix(surface,dirt*.74,smoothstep(.18,.72,cover.g));
    surface=mix(surface,dirt*.88,cover.b*.6);
    // Unequal, mildly wandering soil and bedrock bands on the boundary only.
    float band=vStudyDepth+.05*sin(p.x*1.1+p.z*.7)+.02*sin(p.x*3.3-p.z*2.0);
    vec3 cutColor=mix(dirt*.66,mix(stone*.72,dirt,.3),smoothstep(.18,.4,band));
    cutColor=mix(cutColor,stone*.53,smoothstep(.85,1.3,band));
    cutColor*=.94+.06*sin(band*19.0+sin(p.x*.5+p.z*.8));
    diffuseColor.rgb=pow(mix(surface,cutColor,studyCut),vec3(2.2));
   `);
  };
  m.customProgramCacheKey=()=>`study-material-v1-${cut}`;resources.push(m);return m;
 }
 return {ground:material(),cutaway:material(true),resources};
}
