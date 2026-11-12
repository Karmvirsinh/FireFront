import * as THREE from 'three';
import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';
import {createGroundTreatment} from './groundTreatment.js';
import {createSurfaceRegions} from './surfaceRegions.js';

// Original generated artwork: no external textures or simulation random streams.
// Detail differs by substrate; fine marks are sparse, not full-surface spray.
export function createSurfaceArtwork(size=256){
 const noise=createNoise2D(seedStream(8173,'study-substrate-art-v2'));
 const mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
 function field(x,z,frequency){
  const u=x/size,v=z/size,a=noise(u*frequency,v*frequency),b=noise((u-1)*frequency,v*frequency);
  const c=noise(u*frequency,(v-1)*frequency),d=noise((u-1)*frequency,(v-1)*frequency);
  return mix(mix(a,b,smooth(u)),mix(c,d,smooth(u)),smooth(v));
 }
 const palettes={meadow:[110,126,67],dirt:[130,104,70],forest:[87,79,49],stone:[137,124,102],gravel:[132,122,100]},art={};
 for(const [kind,base]of Object.entries(palettes)){
  const bytes=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const broad=field(x,z,3),small=field(x,z,19);
   let variation=0;
   if(kind==='meadow')variation=broad*.085+small*.009;
   if(kind==='forest')variation=broad*.11+small*.014;
   if(kind==='dirt'){
    // Broad compacted/worn swath, not evenly distributed gravel.
    const wear=Math.exp(-Math.pow((z/size-.5-.06*Math.sin(x/size*6.283))/.22,2));
    variation=broad*.07+small*.012-wear*.055;
   }
   if(kind==='stone'){
    // Broken directional sediment lines, with large calm faces between them.
    const bend=.045*field(x,z,4),phase=(z/size+bend)*5;
    const seam=Math.exp(-Math.pow(Math.sin(phase*Math.PI)/.085,2));
    variation=broad*.095+small*.007-seam*(.025+.055*Math.max(0,broad+.3));
   }
   const i=(z*size+x)*4;for(let c=0;c<3;c++)bytes[i+c]=Math.round(base[c]*(1+variation));bytes[i+3]=255;
  }
  // Wrapped, seeded stamps remain sparse and mip-filterable, without seams.
  const random=seedStream(8173,`study-stamps-v2:${kind}`);
  function ellipse(cx,cz,rx,rz,angle,color,opacity){
   const r=Math.ceil(Math.max(rx,rz)),co=Math.cos(angle),si=Math.sin(angle);
   for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
    const q=Math.pow((dx*co+dz*si)/rx,2)+Math.pow((-dx*si+dz*co)/rz,2);if(q>=1)continue;
    const i=(((Math.round(cz)+dz+size)%size)*size+(Math.round(cx)+dx+size)%size)*4,a=opacity*Math.min(1,(1-q)*3);
    for(let c=0;c<3;c++)bytes[i+c]=Math.round(mix(bytes[i+c],color[c],a));
   }
  }
  if(kind==='dirt'||kind==='gravel')for(let cluster=0;cluster<(kind==='gravel'?34:9);cluster++){
   const x=random()*size,z=random()*size;
   for(let n=0;n<8;n++)ellipse(x+(random()-.5)*25,z+(random()-.5)*20,1+random()*1.5,.7+random(),random()*6.28,[151,139,113],.25+random()*.2);
  }
  if(kind==='forest')for(let cluster=0;cluster<14;cluster++){
   const x=random()*size,z=random()*size;
   for(let n=0;n<9;n++)ellipse(x+(random()-.5)*36,z+(random()-.5)*28,1+random()*2.5,.7+random(),random()*6.28,n%3?[110,89,51]:[62,61,40],.3);
  }
  if(kind==='stone')for(let crack=0;crack<8;crack++){
   let x=random()*size,z=random()*size,angle=-.8+random()*1.6;
   for(let n=0;n<20;n++){x+=Math.sin(angle)*1.6;z+=Math.cos(angle)*1.6;angle+=(random()-.5)*.12;ellipse(x,z,.55,1.4,-angle,[77,70,60],.22);}
  }
  art[kind]={data:bytes,size};
 }
 return art;
}

export function createSurfaceMaterials(map,{simulator=false}={}){
 const resources=[],art=createSurfaceArtwork();
 const textures=Object.fromEntries(Object.entries(art).map(([name,{data,size}])=>{
  const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;resources.push(t);return [name,t];
 }));
 const weights=new Uint8Array(map.width*map.height*4),at=(x,z)=>map.cells[Math.max(0,Math.min(map.height-1,z))*map.width+Math.max(0,Math.min(map.width-1,x))];
 for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
  let forest=0,total=0;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const w=Math.exp(-(dx*dx+dz*dz)/3);forest+=(simulator?(at(x+dx,z+dz).fuelType==='forest'?1:at(x+dx,z+dz).fuelType==='brush'?.45:0):(at(x+dx,z+dz).terrain==='forest'?1:0))*w;total+=w;}
  const i=(z*map.width+x)*4;weights[i]=forest/total*255;weights[i+1]=(simulator?['route','start','safe'].includes(at(x,z).terrain):at(x,z).terrain==='trail')?255:0;weights[i+2]=at(x,z).terrain==='dry-channel'?255:0;weights[i+3]=(map.surfaceLayers?.[z*map.width+x]??.5)*255;
 }
 const coverage=new THREE.DataTexture(weights,map.width,map.height);coverage.magFilter=THREE.LinearFilter;coverage.minFilter=THREE.LinearFilter;coverage.needsUpdate=true;resources.push(coverage);
 const regionData=createSurfaceRegions(map),regions=new THREE.DataTexture(regionData.data,regionData.width,regionData.height);
 regions.magFilter=THREE.LinearFilter;regions.minFilter=THREE.LinearFilter;regions.needsUpdate=true;resources.push(regions);
 // Nearest-filtered logical masks keep fuel, path and fire boundaries exact.
 const states=new Uint8Array(map.cells.length*4),kinds=new Uint8Array(map.cells.length*4);
 const stateCodes={unburned:0,burning:1,'burned-hot':2,'burned-cool':3};
 let dirty=false;
 let fireTexture=null,logicalTexture=null;
 if(simulator){
  map.cells.forEach((cell,i)=>{
   const compactStart=cell.terrain==='start'&&i!==map.start.z*map.width+map.start.x;
   kinds[i*4]=cell.terrain==='safe'?5:cell.terrain==='start'&&!compactStart?4:cell.fuelType!=='none'?0:['route','start'].includes(cell.terrain)?1:cell.terrain==='obstacle'||cell.surfaceCover==='mineral'?3:2;
   kinds[i*4+3]=states[i*4+3]=255;
  });
  for(const [name,bytes] of [['fire',states],['logical',kinds]]){
   const t=new THREE.DataTexture(bytes,map.width,map.height);t.magFilter=t.minFilter=THREE.NearestFilter;t.needsUpdate=true;resources.push(t);
   if(name==='fire')fireTexture=t;else logicalTexture=t;
  }
 }
 const treatment=new THREE.DataTexture(createGroundTreatment(map),map.width,map.height);
 treatment.magFilter=treatment.minFilter=THREE.LinearFilter;treatment.needsUpdate=true;resources.push(treatment);
 const common=`varying vec3 vStudyPosition; varying vec3 vStudyNormal; varying float vStudyDepth;`;
 const definitions=`${common}
 uniform sampler2D studyMeadow,studyDirt,studyForest,studyStone,studyGravel,studyCoverage,studyRegions,studyFire,studyLogical,studyTreatment;
 uniform vec2 studySize; uniform float studyCut,studySimulation;
 float artHash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
 float artField(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.0-2.0*f);return mix(mix(artHash(i),artHash(i+vec2(1,0)),f.x),mix(artHash(i+vec2(0,1)),artHash(i+vec2(1)),f.x),f.y);}
 // World-space triplanar projection avoids stretching on steep surfaces. Rock
 // uses vertical texture coordinates on faces, preserving directional strata.
 vec3 studyTri(sampler2D tex,vec3 p,vec3 n,float scale){vec3 w=pow(abs(n),vec3(4.0));w/=max(.0001,w.x+w.y+w.z);return texture2D(tex,p.zy*scale).rgb*w.x+texture2D(tex,p.xz*scale).rgb*w.y+texture2D(tex,p.xy*scale).rgb*w.z;}
 `;
 function material(cut=false){
  const m=new THREE.MeshStandardMaterial({roughness:.96,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,{studyMeadow:{value:textures.meadow},studyDirt:{value:textures.dirt},studyForest:{value:textures.forest},studyStone:{value:textures.stone},studyCoverage:{value:coverage},studyRegions:{value:regions},studyGravel:{value:textures.gravel},studySize:{value:new THREE.Vector2(map.width*map.cellSize,map.height*map.cellSize)},studyCut:{value:cut?1:0},studySimulation:{value:simulator?1:0},studyFire:{value:fireTexture??coverage},studyLogical:{value:logicalTexture??coverage},studyTreatment:{value:treatment}});
   shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\n${common}\nattribute float studyDepth; attribute vec3 studyBlendNormal;`).replace('#include <begin_vertex>',`#include <begin_vertex>\nvStudyPosition=(modelMatrix*vec4(position,1.0)).xyz;vStudyNormal=normalize(mat3(modelMatrix)*studyBlendNormal);vStudyDepth=studyDepth;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${definitions}`).replace('#include <color_fragment>',`
    vec3 p=vStudyPosition,n=normalize(vStudyNormal);
    vec4 cover=texture2D(studyCoverage,p.xz/studySize+.5);
    vec4 region=texture2D(studyRegions,p.xz/studySize+.5);
    float broad=artField(p.xz*.17),regional=artField(p.xz*.065+12.0);
    vec3 grass=studyTri(studyMeadow,p,n,.12),dirt=studyTri(studyDirt,p,n,.23),forest=studyTri(studyForest,p,n,.21),stone=studyTri(studyStone,p,n,.18);
    vec3 meadow=grass*mix(vec3(.76,.89,.72),vec3(1.10,1.07,.98),smoothstep(.12,.86,region.r));
    // Forest classification no longer stamps a brown patch under each grove.
    float litter=smoothstep(.30,.76,region.g)*mix(.32,.91,cover.r);
    vec3 floorColor=mix(meadow,forest,litter);
    floorColor=mix(floorColor,dirt*.92,smoothstep(.72,.94,region.g)*.32);
    float rock=smoothstep(.04,.32,1.0-abs(n.y));
    // Soil pockets and weathered warm/cool stone vary over metres, not pixels.
    vec3 rockColor=mix(stone*vec3(.91,.94,.98),dirt*.91,smoothstep(.4,.85,regional)*.55)*(.96+cover.a*.08);
    vec3 surface=mix(floorColor,rockColor,rock);
    float edge=cover.g+(artField(p.xz*1.4)-.5)*.10;
    vec3 gravel=studyTri(studyGravel,p,n,.38);
    float gravelSection=smoothstep(.55,.83,region.b)*.48;
    vec3 trail=mix(dirt*mix(.80,1.04,region.a),gravel,gravelSection);
    surface=mix(surface,trail,smoothstep(.12,.7,edge));
    surface=mix(surface,dirt*.84,cover.b*.65);
    // Cutaway-only depth bands: changing soil thickness, broken bedrock lenses
    // and sparse embedded stones. No identical contour stripes on every side.
    float along=p.x+p.z,soil=.19+.22*artField(vec2(along*.3,4.0));
    float band=vStudyDepth+.07*(artField(vec2(along*.7,2.0))-.5);
    vec3 cutColor=mix(forest*.67,dirt*.78,smoothstep(soil*.5,soil+.18,band));
    cutColor=mix(cutColor,rockColor*.76,smoothstep(soil+.32,soil+.95,band));
    float lens=artField(vec2(along*.22,band*1.8)+6.0);
    cutColor*=mix(.91,1.04,lens);
    vec2 q=vec2(along*3.0,band*4.5),cell=floor(q),local=fract(q)-.5;
    float stoneMask=(1.0-smoothstep(.11,.23,length(local*vec2(1.0,1.5))))*step(.84,artHash(cell))*smoothstep(.15,.4,band);
    cutColor=mix(cutColor,stone*.68,stoneMask*.65);
    if(studySimulation>.5&&studyCut<.5){
     vec2 uv=p.xz/studySize+.5;
     float kind=floor(texture2D(studyLogical,uv).r*255.0+.5);
     // Logical category/fire masks stay nearest-filtered. Only substrate shoulders
     // blend spatially; all nonfuel interiors stay bare, with no meadow substitution.
     vec2 shoulder=texture2D(studyTreatment,uv).rg;
     float bare=smoothstep(.025,.5,shoulder.r+(broad-.5)*.035);
     float bed=smoothstep(.03,.5,shoulder.g+(regional-.5)*.03);
     vec3 bareFloor=mix(dirt*vec3(1.0,.98,.92),forest*1.08,.18+region.g*.18);
     vec3 bedrock=mix(bareFloor,rockColor,.28+.32*regional);
     vec3 habitat=mix(floorColor,bareFloor,bare*.88);
     habitat=mix(habitat,bedrock,bed*.8);
     habitat=mix(habitat,rockColor,rock);

     // Fuel must read as continuous vegetated/leaf-litter cover, never bare rock.
     if(kind<.5)surface=${map.generation?.settings?.surfaceFuelVersion ? 'mix(floorColor,meadow,rock*.55)' : 'habitat'};
     else if(kind<1.5)surface=trail;
     else if(kind<2.5)surface=mix(bareFloor,gravel*.87,.10+region.b*.08);
     else if(kind<3.5)surface=mix(bedrock,rockColor,rock);
     else if(kind<4.5)surface=vec3(.278,.557,.796);
     else surface=vec3(.333,.714,.608);
     float fire=floor(texture2D(studyFire,uv).r*255.0+.5);
     if(fire>.5&&fire<1.5)surface=vec3(.404,.282,.184);
     else if(fire<2.5&&fire>1.5)surface=vec3(.200,.165,.161);
     else if(fire>2.5)surface=vec3(.306,.337,.388);
    }
    diffuseColor.rgb=pow(mix(surface,cutColor,studyCut),vec3(2.2));
   `);
  };
  m.customProgramCacheKey=()=>`study-material-v5-${cut}-${simulator}`;resources.push(m);return m;
 }
 return {ground:material(),cutaway:material(true),resources,
  setFireState(index,state){
   if(!simulator)return;
   const code=stateCodes[state];if(code===undefined||!Number.isInteger(index)||index<0||index>=map.cells.length)throw new Error('Invalid visual fire state');
   if(states[index*4]!==code){states[index*4]=code;dirty=true;}
  },
  flush(){if(dirty){fireTexture.needsUpdate=true;dirty=false;}}
 };
}
