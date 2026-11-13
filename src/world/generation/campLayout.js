// World-unit camp contract shared by generation, collision reservations and art.
export const CAMP_RADIUS=2.7, CAMP_SETBACK_CELLS=2;
export function campRadius(camp,angle){return camp.radius*(1+.04*Math.sin(3*angle+camp.phase)+.025*Math.sin(5*angle-camp.phase));}
export function campLocal(map,camp,x,z){const dx=(x-camp.x)*map.cellSize,dz=(z-camp.z)*map.cellSize;return {x:dx*camp.dz-dz*camp.dx,z:dx*camp.dx+dz*camp.dz};}
export function campGrid(map,camp,x,z){return {x:camp.x+(x*camp.dz+z*camp.dx)/map.cellSize,z:camp.z+(-x*camp.dx+z*camp.dz)/map.cellSize};}
export function campDistance(map,camp,x,z){const p=campLocal(map,camp,x,z);return Math.hypot(p.x,p.z)-campRadius(camp,Math.atan2(p.z,p.x));}
export function radialCells(map,camp,extra=0){
 const result=[],reach=Math.ceil((camp.radius*1.065+extra)/map.cellSize)+1;
 for(let z=Math.max(0,camp.z-reach);z<=Math.min(map.height-1,camp.z+reach);z++)for(let x=Math.max(0,camp.x-reach);x<=Math.min(map.width-1,camp.x+reach);x++)
  // Conservative cell intersection: shared boundary cannot retain a fuel sliver.
  if(campDistance(map,camp,x,z)<=extra+map.cellSize*Math.SQRT1_2*1.1)result.push(z*map.width+x);
 return result;
}
export function rectCells(map,camp,rect,cells=camp.clearingCells){
 const out=[];for(const i of cells){const p=campLocal(map,camp,i%map.width,Math.floor(i/map.width));
  if(Math.abs(p.x-rect.x)<rect.width/2+map.cellSize/2-1e-6&&Math.abs(p.z-rect.z)<rect.depth/2+map.cellSize/2-1e-6)out.push(i);
 }return out;
}
export function campReservation(map,camp){
 const cells=new Set(radialCells(map,camp,CAMP_SETBACK_CELLS*map.cellSize));
 // Guarantee two complete logical cells even beside diagonal raster boundaries.
 for(const i of radialCells(map,camp))for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
  const x=i%map.width+dx,z=Math.floor(i/map.width)+dz;
  if(x>=0&&z>=0&&x<map.width&&z<map.height)cells.add(z*map.width+x);
 }
 return [...cells].sort((a,b)=>a-b);
}
export function campStructures(){
 const pieces=[{kind:'shelter',x:0,z:1.45,width:1.6,depth:.9,clearance:1.0},
  {kind:'tent',x:-1.85,z:-.2,width:1.14,depth:.94,height:.95,angle:-Math.PI/2},
  {kind:'tent',x:1.85,z:-.2,width:1.14,depth:.94,height:.95,angle:Math.PI/2},
  {kind:'seat',x:.95,z:-1.5,width:.8,depth:.27,height:.20,angle:Math.PI/2},
  {kind:'seat',x:0,z:.9,width:.8,depth:.27,height:.20,angle:Math.PI/2},
  {kind:'ring',x:-.75,z:-1.65,width:.55,depth:.55,height:.10},
  {kind:'table',x:0,z:1.45,width:.7,depth:.35},
  {kind:'marker',x:.95,z:-2.1,width:.08,depth:.08}];
 for(const x of [-.7,.7])for(const z of [1.05,1.85])pieces.push({kind:'post',x,z,width:.08,depth:.08});
 return pieces;
}
