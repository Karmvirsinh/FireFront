import {createNoise2D} from 'simplex-noise';
import {seedStream} from './seed.js';
import {constrainTerrain,validateTerrainSlopes} from './createTerrain.js';
import {sampleTerrainHeight,terrainCellGradients,TERRAIN_TRIANGULATION} from '../terrain.js';

export const STRUCTURE_VERSION='terrain-structure-v3';
export const STRUCTURE_SETTINGS=Object.freeze({maxTrailSlopeDegrees:20,maxNaturalSlopeDegrees:55,
 maxRelief:9,shoulderPasses:5,maxAttempts:12,noiseAmplitude:.035});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function radius(p,x,z){return Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz);}
function plateau(p,x,z){
 const r=radius(p,x,z);
 if(p.terraced)return p.height*((1-smooth((r-.47)/.14))*.55+(1-smooth((r-.84)/.18))*.45);
 return p.height*(1-smooth((r-.65)/.4));
}
function createForms(map,random,family){
 const w=map.width*map.cellSize,d=map.height*map.cellSize;
 const point=()=>({x:(random()*1.2-.1)*w,z:(random()*1.2-.1)*d});
 const hills=Array.from({length:family==='lowland'?1:2},()=>({...point(),rx:10+random()*10,rz:10+random()*9,
  height:(family==='lowland'?.5:1.2)+random()*(family==='lowland'?.7:1.8)}));
 const plateaus=[];
 if(family!=='lowland'){
  const p={...point(),rx:9+random()*5,rz:9+random()*5,height:family==='plateau-country'?4+random()*2:2.5+random()*1.5,terraced:true};
  // A seeded edge feature may be clipped; do not reserve an empty border ring.
  if(random()<.55){const side=Math.floor(random()*4);if(side<2)p.x=side===0?0:w;else p.z=side===2?0:d;}
  p.x=Math.max(0,Math.min(w,p.x));p.z=Math.max(0,Math.min(d,p.z));
  plateaus.push(p);
  if(family==='plateau-country'){
   for(let n=0;n<12;n++){
    const q={...point(),rx:8+random()*4,rz:8+random()*4,height:2+random()*2,terraced:false};
    q.x=Math.max(0,Math.min(w,q.x));q.z=Math.max(0,Math.min(d,q.z));
    if(Math.hypot(q.x-p.x,q.z-p.z)>.85*(Math.max(p.rx,p.rz)+Math.max(q.rx,q.rz))){plateaus.push(q);break;}
   }
  }
 }
 return {hills,plateaus,valley:{...point(),angle:random()*Math.PI,width:6+random()*5,depth:family==='lowland'?.4:1+random()*1.2}};
}

// Require geometric evidence after fitting, not merely a requested plateau in metadata.
export function inspectStructure(map,forms,offset=0){
 const plateaus=forms.plateaus.map(p=>{
  let topCells=0,shelfCells=0,riserCells=0;
  for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
   const wx=(x+.5)*map.cellSize,wz=(z+.5)*map.cellSize,r=radius(p,wx,wz);
   if(r>1.12)continue;
   const y=sampleTerrainHeight(map,x+.5,z+.5)+offset;
   const slope=Math.atan(Math.max(...terrainCellGradients(map,z*map.width+x)))*180/Math.PI;
   if(r<.42&&slope<5&&y>=p.height*.7)topCells++;
   if(p.terraced&&r>.65&&r<.78&&slope<8&&y>=p.height*.25)shelfCells++;
   if(r>.45&&slope>28&&!map.navigation.allowedCells[z*map.width+x])riserCells++;
  }
  return {topCells,shelfCells,riserCells};
 });
 return {plateaus};
}

export function createTerrainStructure(map,seed){
 const settings={...STRUCTURE_SETTINGS};
 const familyRandom=seedStream(seed,'terrain:structure-family-v3');
 const draw=familyRandom();
 const family=draw<.25?'lowland':draw<.65?'plateau-country':'ridge-valley';
 let last;
 for(let attempt=0;attempt<settings.maxAttempts;attempt++){
  const random=seedStream(seed,'terrain:structure-v3',attempt),forms=createForms(map,random,family),noise=createNoise2D(random);
  const raw=Array.from({length:(map.width+1)*(map.height+1)},(_,i)=>{
   const x=i%(map.width+1)*map.cellSize,z=Math.floor(i/(map.width+1))*map.cellSize;
   let y=0;
   for(const h of forms.hills)y=Math.max(y,h.height*(1-smooth(radius(h,x,z))));
   for(const p of forms.plateaus)y=Math.max(y,plateau(p,x,z));
   const v=forms.valley,across=-(x-v.x)*Math.sin(v.angle)+(z-v.z)*Math.cos(v.angle);
   // Valley is strongest outside plateau tops, avoiding accidental bowl-shaped tops.
   const plateauWeight=Math.max(0,...forms.plateaus.map(p=>1-smooth((radius(p,x,z)-.8)/.3)));
   y-=v.depth*Math.exp(-across*across/(v.width*v.width))*(1-plateauWeight);
   return y+noise(x*.05,z*.05)*settings.noiseAmplitude;
  });
  const result=constrainTerrain(map,raw,settings),min=Math.min(...result.heights);
  const elevation={units:'world',triangulation:TERRAIN_TRIANGULATION,
   cornerHeights:result.heights.map(y=>y-min),generation:{version:STRUCTURE_VERSION,seed,family,
    stream:'terrain:structure-v3',settings,attempt,heightOffset:-min,landforms:forms}};
  try{
   const candidate={...map,elevation};validateTerrainSlopes(candidate,settings);
   if(Math.max(...elevation.cornerHeights)>settings.maxRelief)throw new Error('Relief limit');
   const quality=inspectStructure(candidate,forms,min);
   if(forms.plateaus.length&& !quality.plateaus.every((p,i)=>p.topCells>=40&&p.riserCells>=10&&(!forms.plateaus[i].terraced||p.shelfCells>=15)))
    throw new Error('Existing trails or boundary clipping erased usable plateau/terrace evidence');
   elevation.generation.quality=quality;return elevation;
  }catch(error){last=error;}
 }
 throw new Error(`Terrain-only ${family} candidates exhausted; existing horizontal map retained`,{cause:last});
}
