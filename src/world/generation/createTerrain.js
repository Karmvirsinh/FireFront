import { createNoise2D } from 'simplex-noise';
import { seedStream } from './seed.js';
import { isNavigable } from '../navigationPolicy.js';
import { TERRAIN_TRIANGULATION, terrainCellGradients, validateTerrain } from '../terrain.js';

export const TERRAIN_VERSION = 'landforms-v2';
export const TERRAIN_SETTINGS = Object.freeze({ maxTrailSlopeDegrees:20, maxNaturalSlopeDegrees:38,
  maxRelief:7, noiseAmplitude:.10, noiseScale:.055, shoulderPasses:5,
  maxAttempts:3 });
const smooth = t => { t=Math.max(0,Math.min(1,t));return t*t*(3-2*t); };

// All distances below are world units, independent from the trail random streams.
function landforms(map,random) {
  const width=map.width*map.cellSize,depth=map.height*map.cellSize;
  const point=()=>({x:(.15+random()*.7)*width,z:(.15+random()*.7)*depth});
  const hills=Array.from({length:2+Math.floor(random()*2)},()=>({...point(),
    rx:9+random()*7,rz:7+random()*6,angle:random()*Math.PI,amplitude:2.5+random()*2}));
  const raised={...point(),rx:5+random()*2,rz:5+random()*2,angle:random()*Math.PI,amplitude:1.8+random()*1.2};
  const valley={...point(),angle:random()*Math.PI,width:5+random()*3,amplitude:1.2+random()};
  const flats=Array.from({length:3},()=>({...point(),radius:5+random()*3}));
  return {hills,raised,valley,flats};
}
function bump(p,x,z) {
  const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);
  const radius=Math.hypot((dx*c+dz*s)/p.rx,(-dx*s+dz*c)/p.rz);
  return p.amplitude*(1-smooth(radius));
}

export function validateTerrainSlopes(map,settings=TERRAIN_SETTINGS) {
  validateTerrain(map);
  for(let i=0;i<map.cells.length;i++) {
    const limit=Math.tan((isNavigable(map,i)?settings.maxTrailSlopeDegrees:settings.maxNaturalSlopeDegrees)*Math.PI/180);
    if(terrainCellGradients(map,i).some(g=>g>limit+1e-6)) throw new Error(`Terrain slope exceeds limit at cell ${i}`);
  }
}

// Bound local height differences, then diffuse their displacement into broad
// shoulders. Never edit map cells or scale the whole landscape to fix a trail.
export function constrainTerrain(map,raw,settings=TERRAIN_SETTINGS) {
  const h=raw.slice(),stride=map.width+1;
  const edgeLimits=new Map();
  const add=(a,b,limit)=>{const key=`${a}:${b}`;edgeLimits.set(key,Math.min(edgeLimits.get(key)??Infinity,limit));};
  for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
    const i=z*stride+x,cell=z*map.width+x;
    // Component-wise bound guarantees both triangle gradient magnitudes. Shared
    // edges use the stricter adjacent-cell limit, including every spawn footprint.
    const limit=map.cellSize*Math.tan((isNavigable(map,cell)?settings.maxTrailSlopeDegrees:settings.maxNaturalSlopeDegrees)*Math.PI/180)/Math.SQRT2*.995;
    add(i,i+1,limit);add(i+stride,i+stride+1,limit);add(i,i+stride,limit);add(i+1,i+stride+1,limit);
  }
  const edges=[...edgeLimits].map(([key,limit])=>[...key.split(':').map(Number),limit]);
  const adjacency=Array.from({length:h.length},()=>[]);
  for(const [a,b,limit] of edges){adjacency[a].push([b,limit]);adjacency[b].push([a,limit]);}
  function envelope(values) {
    const distance=values.slice(),heap=[];
    function push(item){let i=heap.length;heap.push(item);while(i){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p;}heap[i]=item;}
    function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
    distance.forEach((value,i)=>push([value,i]));
    while(heap.length){const [value,i]=pop();if(value!==distance[i])continue;
      for(const [next,limit] of adjacency[i])if(value+limit<distance[next]){distance[next]=value+limit;push([distance[next],next]);}
    }
    return distance;
  }
  // Two shortest-distance envelopes bound local rise in both directions. Their
  // midpoint balances peak lowering with valley raising, rather than cutting a
  // trail trench. Edge bounds imply both triangle slopes without global scaling.
  const upper=envelope(raw),negativeLower=envelope(raw.map(v=>-v));
  for(let i=0;i<h.length;i++)h[i]=(upper[i]-negativeLower[i])/2;
  // Broadly blend the displacement into shoulders, then re-project. The number
  // of smoothing passes is fixed; final envelopes enforce the bounds exactly.
  for(let pass=0;pass<settings.shoulderPasses;pass++){
    const old=h.slice();
    for(let z=1;z<map.height;z++)for(let x=1;x<map.width;x++){
      const i=z*stride+x;
      h[i]=raw[i]+.5*(old[i]-raw[i])+.125*((old[i-1]-raw[i-1])+(old[i+1]-raw[i+1])+(old[i-stride]-raw[i-stride])+(old[i+stride]-raw[i+stride]));
    }
  }
  const finalUpper=envelope(h),finalNegativeLower=envelope(h.map(v=>-v));
  return {heights:h.map((_,i)=>(finalUpper[i]-finalNegativeLower[i])/2),passes:settings.shoulderPasses};
}

export function createTerrain(map,seed) {
  const settings={...TERRAIN_SETTINGS};
  for(let attempt=0;attempt<settings.maxAttempts;attempt++){
    const random=seedStream(seed,'terrain:landforms-v2',attempt),forms=landforms(map,random);
    const noise=createNoise2D(random);
    const base=(x,z)=>{
      const v=forms.valley,c=Math.cos(v.angle),s=Math.sin(v.angle);
      const across=-(x-v.x)*s+(z-v.z)*c;
      return Math.max(...forms.hills.map(p=>bump(p,x,z)),bump(forms.raised,x,z))
        -v.amplitude*Math.exp(-across*across/(v.width*v.width));
    };
    const raw=Array.from({length:(map.width+1)*(map.height+1)},(_,i)=>{
      const x=i%(map.width+1)*map.cellSize,z=Math.floor(i/(map.width+1))*map.cellSize;
      let height=base(x,z),weight=0;
      for(const flat of forms.flats){
        const w=1-smooth((Math.hypot(x-flat.x,z-flat.z)-flat.radius*.45)/(flat.radius*.55));
        if(w>weight){height=height*(1-w)+base(flat.x,flat.z)*w;weight=w;}
      }
      return height+settings.noiseAmplitude*(1-weight*.9)*noise(x*settings.noiseScale,z*settings.noiseScale);
    });
    const result=constrainTerrain(map,raw,settings);
    const min=Math.min(...result.heights);
    const cornerHeights=result.heights.map(h=>h-min);
    const elevation={units:'world',triangulation:TERRAIN_TRIANGULATION,cornerHeights,
      generation:{version:TERRAIN_VERSION,seed,stream:'terrain:landforms-v2',settings,attempt,
        adjustmentPasses:result.passes,landforms:forms}};
    try {
      validateTerrainSlopes({...map,elevation},settings);
      if(Math.max(...cornerHeights)>settings.maxRelief)throw new Error('Terrain relief exceeds bound');
      return elevation;
    } catch(error) { if(attempt===settings.maxAttempts-1)throw new Error('Terrain-only retries exhausted; horizontal layout retained',{cause:error}); }
  }
}
