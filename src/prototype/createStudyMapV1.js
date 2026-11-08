import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';
import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';
import {createTerrainRouting,validateTrailTerrain} from '../world/generation/trailTerrain.js';

export const STUDIES=Object.freeze({
 woodland:{title:'Rolling woodland',subtitle:'Broad folds, a lower valley and a quiet clearing',detail:[-5,3],look:[-12,8,15]},
 plateau:{title:'Irregular plateau',subtitle:'Broken rim, exposed stone and a gradual southern approach',detail:[0,-2],look:[15,10,18]},
 ridge:{title:'Rugged ridge',subtitle:'An asymmetric spine beside a dry lower channel',detail:[-3,0],look:[-18,11,14]},
});
export const STUDY_SEEDS=[7,2026];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function polygonDistance(x,z,points){
 let inside=false,distance=Infinity;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside?distance:-distance;
}

// Bounded visual recipes, isolated from the production generator and its streams.
export function createStudyMap(kind,seed){
 if(!STUDIES[kind]||!STUDY_SEEDS.includes(seed))throw new Error('Unknown prototype study/seed');
 const random=seedStream(seed,`art-study:${kind}`),noise=createNoise2D(random);
 const phase=random()*6.28,flip=seed===7?1:-1;
 const plateauHeight=3.2+random()*.35;
 const rim=[[-9,-7],[-5,-10],[2,-9],[4,-7],[9,-7],[10,-3],[7,0],[4,0],[2,2],[-3,1],[-5,-2],[-9,-2]]
  .map(([x,z])=>{
   const angle=seed===7?-.08:.20,stretch=seed===7?1.05:.88;
   const px=x*stretch+(random()-.5)*1.5,pz=z+(random()-.5)*1.1;
   return [px*Math.cos(angle)-pz*Math.sin(angle),px*Math.sin(angle)+pz*Math.cos(angle)];
  });
 const rampX=1.5+random()*.7;
 function height(x,z){
  const detail=noise(x*.5,z*.5)*.045;
  if(kind==='woodland'){
   const along=z*.075+Math.sin(x*.10+phase)*.26;
   const ridge=1.9*Math.exp(-((x+5+flip*3*Math.sin(z*.09))**2)/75)*(.7+.3*Math.cos(along));
   const second=1.1*Math.exp(-((x-10)**2+(z+8)**2)/90);
   const valley=.8*Math.exp(-((x-3-flip*Math.sin(z*.14)*2)**2)/17);
   const base=ridge+second-valley;
   const flat=1-smooth((Math.hypot(x+6,z-5)-2.2)/3.8);
   return base*(1-flat)+.75*flat+detail*(1-flat*.7);
  }
  if(kind==='plateau'){
   const warp=noise(x*.28,z*.28)*.32;
   const signed=polygonDistance(x,z,rim)+warp;
   const top=plateauHeight*smooth((signed+1.1)/1.6);
   // A real broad shoulder/ramp in the heightfield, not a road mesh over a cliff.
   const center=rampX+.22*Math.sin(z*.13+phase);
   const ramp=plateauHeight*(1-smooth((z+3)/18))*(1-smooth((Math.abs(x-center)-1.7)/3.5));
   const approach=ramp*smooth((z+10)/4);
   const shoulder=(1-smooth((Math.abs(x-center)-1.6)/2))*smooth((z+5)/2);
   const joinedTop=top*(1-shoulder)+Math.min(top,ramp)*shoulder;
   return Math.max(joinedTop,approach)+detail;
  }
  const crest=-4+Math.sin(z*.16+phase)*1.1+flip*z*.04;
  const across=x-crest,width=across<0?2.2+.35*Math.sin(z*.44):7.3+1.1*Math.sin(z*.18+phase);
  const spine=(4.2+1.4*Math.sin(z*.28+phase)+.45*Math.sin(z*.65-phase))*Math.exp(-((across/width)**2));
  const shoulder=1.25*Math.exp(-((x+11)**2+(z-7)**2)/85);
  const channel=.6*Math.exp(-((x-7-flip*Math.sin(z*.13))**2)/7);
  const ribs=.34*Math.sin(z*.85+noise(z*.11,phase)*1.7)*Math.exp(-(((across+1.4)/2.7)**2));
  return spine+shoulder-channel+ribs+detail;
 }
 const map={width:64,height:64,cellSize:.5,name:STUDIES[kind].title,
  prototype:{version:'terrain-art-study-v1',kind,seed,plateauHeight,rampX,rim},
  elevation:{units:'world',triangulation:'nw-se',cornerHeights:Array.from({length:65*65},(_,i)=>height(i%65*.5-16,Math.floor(i/65)*.5-16))}};
 const min=Math.min(...map.elevation.cornerHeights);map.elevation.cornerHeights=map.elevation.cornerHeights.map(h=>h-min);
 const worldCell=([x,z])=>({x:Math.max(0,Math.min(63,Math.floor((x+16)/.5))),z:Math.max(0,Math.min(63,Math.floor((z+16)/.5)))});
 const desired=kind==='plateau'?[[rampX,13],[rampX,-5],[-4,-5]]:kind==='ridge'?[[9,13],[8,2],[9,-12]]:[[-12,11],[-6,5],[9,-11]];
 const routing=createTerrainRouting(map);
 const nearest=p=>{
  const q=worldCell(p);let best=null,distance=Infinity;
  for(let i=0;i<routing.allowed.length;i++)if(routing.allowed[i]){const d=Math.hypot(i%64-q.x,Math.floor(i/64)-q.z);if(d<distance){distance=d;best={x:i%64,z:Math.floor(i/64)};}}
  if(!best||distance>4)throw new Error(`Study waypoint ${q.x},${q.z} has no nearby slope-safe ground (${distance.toFixed(1)} cells)`);return best;
 };
 const waypoints=desired.map(nearest),trail=new Set(),centerlines=[];
 for(let i=1;i<waypoints.length;i++){
  const line=routing.route(waypoints[i-1],waypoints[i],new Set(),.8);
  if(!line)throw new Error('Study trail approach is disconnected');
  centerlines.push(line);for(const p of line)trail.add(p.z*64+p.x);
 }
 map.cells=Array.from({length:4096},(_,i)=>{
  const x=(i%64+.5)*.5-16,z=(Math.floor(i/64)+.5)*.5-16;
  const slope=Math.atan(Math.max(...terrainCellGradients(map,i)))*180/Math.PI;
  const forestField=noise(x*.095+7,z*.095-3)+.28*Math.sin(x*.12+phase);
  const clearing=Math.hypot(x+6,z-5)<4.4;
  const channel=kind==='ridge'&&Math.abs(x-7-flip*Math.sin(z*.13))<1.3;
  const surface=slope>28?'rock':channel?'dry-channel':trail.has(i)?'trail':forestField>-.2&&!clearing?'forest':'grass';
  return {terrain:surface,fuelType:['forest','grass'].includes(surface)?surface:'none',walkable:slope<=20&&surface!=='forest',slope};
 });
 // Trail classification is authoritative, after decoration decisions.
 for(const i of trail)map.cells[i]={terrain:'trail',fuelType:'none',walkable:true,slope:map.cells[i].slope};
 map.navigation={mode:'path-first',allowedCells:map.cells.map((c,i)=>trail.has(i))};
 map.pathNetwork={centerlines,trailCells:[...trail]};
 map.prototype.waypoints=waypoints;map.prototype.trailRise=Math.abs(sampleTerrainHeight(map,waypoints[1].x+.5,waypoints[1].z+.5)-sampleTerrainHeight(map,waypoints[0].x+.5,waypoints[0].z+.5));
 validateTrailTerrain(map);return map;
}
