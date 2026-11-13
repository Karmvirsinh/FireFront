import roster from './data/natureRosterManifest.json' with {type:'json'};
import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';
import {woodlandCharacter} from '../world/generation/woodlandCharacter.js';
import {createVegetationLayout} from './createVegetationLayout.js';

export function createWoodlandLayout(map){
 const seed=map.generation.seed,character=woodlandCharacter(seed),noise=createNoise2D(seedStream(seed,'woodland-regions-v1')),base=createVegetationLayout(map);
 const broad=roster.filter(s=>s.family==='broadleaf'),conifer=roster.filter(s=>s.family==='conifer'),brush=roster.filter(s=>s.kind==='brush'),grass=roster.filter(s=>s.kind==='grass');
 const sample=(cell,salt)=>seedStream(seed,`woodland-pose:${cell}:${salt}`)();
 const campReservations=new Set(map.camps?.flatMap(c=>[...c.clearingCells,...c.setbackCells])??[]);
 const clear=p=>{
  const r=p.radius/map.cellSize,x=Math.floor(p.gx),z=Math.floor(p.gz),reach=Math.ceil(r)+1;
  for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=map.width||nz>=map.height)continue;if(!map.navigation.allowedCells[nz*map.width+nx]&&map.cells[nz*map.width+nx].terrain!=='building'&&!campReservations.has(nz*map.width+nx))continue;if(Math.hypot(Math.max(nx-p.gx,0,p.gx-nx-1),Math.max(nz-p.gz,0,p.gz-nz-1))*map.cellSize<p.radius+.04)return false;}
  return p.gx*map.cellSize>=p.radius&&p.gz*map.cellSize>=p.radius&&(map.width-p.gx)*map.cellSize>=p.radius&&(map.height-p.gz)*map.cellSize>=p.radius;
 };
 const assign=(p,kind)=>{
  const regional=noise(p.x*.075,p.z*.075),prefer={broadleaf:.82,conifer:.20,mixed:.52,autumn:.74}[character]+regional*.27;
  const list=kind==='tree'?(sample(p.cell,'family')<prefer?broad:conifer):kind==='brush'?brush:grass;
  const model=list[Math.floor(sample(p.cell,'species')*list.length)],age=kind==='tree'?.87+sample(p.cell,'age')*.25:1;
  const scale=p.scale.map(v=>v*age),radius=model.radius*Math.max(scale[0],scale[2]);
  const season=character==='autumn'&&model.family==='broadleaf'?Math.max(0,Math.min(1,(noise(p.x*.09+18,p.z*.09-7)+.25)*1.2)):0;
  return {...p,scale,radius,model:model.name,family:model.family,season,age};
 };
 return {character,trees:base.trees.map(p=>assign(p,'tree')).filter(clear),brush:base.brush.map(p=>assign(p,'brush')).filter(clear),grass:base.grass.map(p=>assign(p,'grass')).filter(clear)};
}
