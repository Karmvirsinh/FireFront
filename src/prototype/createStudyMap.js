import {createNoise2D} from 'simplex-noise';
import {seedStream,normalizeSeed} from '../world/generation/seed.js';
import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';
import {createTerrainRouting,validateTrailTerrain} from '../world/generation/trailTerrain.js';
import {createLandformPlan,nearestOnLine} from './landformConstruction.js';

export const STUDIES=Object.freeze({
 woodland:{title:'Gentler ground',subtitle:'Broad hills and flatter stretches; other forms remain possible'},
 plateau:{title:'Mixed relief',subtitle:'Tablelands, shelves and cuts in compatible combinations'},
 ridge:{title:'Rugged ground',subtitle:'Asymmetric ridges, higher elevations and lower corridors'},
});
export const STUDY_SEEDS=[7,34,2026,913];
export const GALLERY=Object.keys(STUDIES).flatMap(kind=>STUDY_SEEDS.map(seed=>({kind,seed,id:`${kind}-${seed}`})));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createStudyMap(kind,value){
 if(!STUDIES[kind])throw new Error('Unknown prototype emphasis');
 const seed=normalizeSeed(value);let last;
 for(let attempt=0;attempt<8;attempt++)try{
  const {height,...plan}=createLandformPlan(kind,seed,attempt),heights=Array.from({length:65*65},(_,i)=>height(i%65*.5-16,Math.floor(i/65)*.5-16));
  const min=Math.min(...heights),max=Math.max(...heights);
  if(!heights.every(Number.isFinite)||max-min<.6||max-min>12)throw new Error('Landform relief outside study bounds');
  const map={width:64,height:64,cellSize:.5,name:STUDIES[kind].title,prototype:{version:'terrain-art-variety-v2',kind,seed,attempt,plan},
   elevation:{units:'world',triangulation:'nw-se',cornerHeights:heights.map(h=>h-min)}};
  const routing=createTerrainRouting(map),random=seedStream(seed,`study-trail-v2:${kind}`,attempt),angle=random()*Math.PI*2;
  const candidates=routing.allowed.map((allowed,i)=>allowed&&i%64>2&&i%64<61&&Math.floor(i/64)>2&&Math.floor(i/64)<61?i:-1).filter(i=>i>=0);
  if(candidates.length<200)throw new Error('Too little connected suitable ground');
  const projection=i=>(i%64-32)*Math.cos(angle)+(Math.floor(i/64)-32)*Math.sin(angle);
  candidates.sort((a,b)=>projection(a)-projection(b)||a-b);
  const a=candidates[0],b=candidates.at(-1),point=i=>({x:i%64,z:Math.floor(i/64)});
  const line=routing.route(point(a),point(b),new Set(),1.2);
  if(!line||line.length<20||line.length>240)throw new Error('No bounded useful demonstration trail');
  const trail=new Set(line.map(p=>p.z*64+p.x)),noise=createNoise2D(seedStream(seed,`art-study-forest:${kind}`));
  const flat=plan.flats[0];
  map.cells=Array.from({length:4096},(_,i)=>{
   const x=(i%64+.5)*.5-16,z=(Math.floor(i/64)+.5)*.5-16,slope=Math.atan(Math.max(...terrainCellGradients(map,i)))*180/Math.PI;
   const clearing=flat&&Math.hypot(x-flat.x,z-flat.z)<flat.radius*.8;
   const channel=plan.cuts.some(p=>nearestOnLine(x,z,p.spine).distance<Math.min(p.leftWidth,p.rightWidth)*.48);
   const surface=trail.has(i)?'trail':slope>28?'rock':channel?'dry-channel':noise(x*.095+7,z*.095-3)>-.2&&!clearing?'forest':'grass';
   return {terrain:surface,fuelType:['forest','grass'].includes(surface)?surface:'none',walkable:slope<=20&&surface!=='forest',slope};
  });
  map.navigation={mode:'path-first',allowedCells:map.cells.map((_,i)=>trail.has(i))};
  map.pathNetwork={centerlines:[line],trailCells:[...trail]};
  const focus=plan.raised.reduce((a,b)=>a.height>b.height?a:b);
  map.prototype.detail=[clamp(focus.x,-12,12),clamp(focus.z,-12,12)];
  const [fx,fz]=map.prototype.detail,edge=Math.abs(focus.x)>10||Math.abs(focus.z)>10;
  const viewAngle=edge?Math.atan2(-fz,-fx):focus.angle+.8;
  map.prototype.look=[Math.cos(viewAngle)*21,11,Math.sin(viewAngle)*21];
  map.prototype.trailRise=Math.abs(sampleTerrainHeight(map,line[0].x+.5,line[0].z+.5)-sampleTerrainHeight(map,line.at(-1).x+.5,line.at(-1).z+.5));
  map.prototype.summary=[...new Set(plan.raised.map(p=>p.type)),...(plan.basins.length?['basin']:[]),...(plan.flats.length?['flat blend']:[]),...(plan.cuts.length?['dry cut']:[]),...(plan.cuts.length>1?['tributaries']:[])].join(' · ');
  map.prototype.quality={flatCells:map.cells.filter(c=>c.slope<5).length,steepCells:map.cells.filter(c=>c.slope>40).length,
   boundaryRelief:Math.max(...heights.filter((_,i)=>i%65===0||i%65===64||i<65||i>=65*64))-min};
  validateTrailTerrain(map);return map;
 }catch(error){last=error;}
 throw new Error(`Landform composition exhausted eight attempts for ${kind}/${seed}`,{cause:last});
}
