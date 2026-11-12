// Visual substrate neighborhoods only. Never changes cells or navigation masks.
export function createGroundTreatment(map){
 const data=new Uint8Array(map.cells.length*4);
 for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
  let bare=0,stone=0;
  for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
   const nx=Math.max(0,Math.min(map.width-1,x+dx)),nz=Math.max(0,Math.min(map.height-1,z+dz));
   const cell=map.cells[nz*map.width+nx],distance2=dx*dx+dz*dz;
   if(cell.terrain==='clearing')bare=Math.max(bare,Math.exp(-distance2/2));
   if(cell.terrain==='obstacle')stone=Math.max(stone,Math.exp(-distance2/3.5));
  }
  const i=(z*map.width+x)*4;data[i]=Math.round(255*bare);data[i+1]=Math.round(255*stone);data[i+3]=255;
 }
 return data;
}
