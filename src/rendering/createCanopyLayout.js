// Stable per-cell hashes avoid consuming generation or simulation randomness.
export function createCanopyLayout(map) {
  const seed=map.rendering?.canopySeed??0;
  function sample(index,salt){let h=(index^seed^salt)>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
  const trees=[];
  const occupied=new Map();
  for(let i=0;i<map.cells.length;i++){
    const cell=map.cells[i];if(cell.fuelType!=='forest'||sample(i,17)>cell.canopyDensity)continue;
    const x=i%map.width,z=Math.floor(i/map.width);
    const nearTrail=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz])=>{
      const nx=x+dx,nz=z+dz;return nx>=0&&nz>=0&&nx<map.width&&nz<map.height&&map.navigation?.allowedCells[nz*map.width+nx];
    });
    const px=x+.5+(sample(i,31)-.5)*.58,pz=z+.5+(sample(i,47)-.5)*.58;
    let crowded=false;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const other=occupied.get(`${x+dx}:${z+dz}`);
      if(other&&Math.hypot(px-other.x,pz-other.z)<.5)crowded=true;
    }
    if(crowded)continue;
    const tree={cell:i,x:px,z:pz,
      width: nearTrail ? .64+sample(i,61)*.12 : .78+sample(i,61)*.18,
      height:.85+sample(i,73)*.25};
    trees.push(tree);occupied.set(`${x}:${z}`,tree);
  }
  return trees;
}
