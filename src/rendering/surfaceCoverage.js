// Material coverage, not fuel data. The nonfuel union stays completely bare;
// shoulders extend into adjacent litter/vegetated ground, never the reverse.
// Distances are to cell rectangles, not blurred category codes or cell centres.
export function createSurfaceCoverage(map, samplesPerCell=4) {
  const width=map.width*samplesPerCell,height=map.height*samplesPerCell;
  const data=new Uint8Array(width*height*4),radius=2.4,reach=Math.ceil(radius)+1;
  const sources=Uint8Array.from(map.cells,c=>c.fuelType==='none'&&!['route','start','safe'].includes(c.terrain)?(c.surfaceReason?3:1):0);
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const gx=(x+.5)/samplesPerCell,gz=(z+.5)/samplesPerCell;
    let bare=radius,mineral=radius;
    for(let nz=Math.max(0,Math.floor(gz)-reach);nz<=Math.min(map.height-1,Math.floor(gz)+reach);nz++)
      for(let nx=Math.max(0,Math.floor(gx)-reach);nx<=Math.min(map.width-1,Math.floor(gx)+reach);nx++){
        const source=sources[nz*map.width+nx];
        if(!source)continue;
        const d=Math.hypot(Math.max(nx-gx,0,gx-nx-1),Math.max(nz-gz,0,gz-nz-1));
        bare=Math.min(bare,d);
        // Loose boulder classifications do not stamp gray bedrock onto soil.
        if(source&2)mineral=Math.min(mineral,d);
      }
    const i=(z*width+x)*4;
    // A flat top at distance zero avoids a seam at the authoritative boundary.
    data[i]=Math.round(255*(1-smooth((bare-.18)/(radius-.18))));
    data[i+1]=Math.round(255*(1-smooth((mineral-.18)/(radius-.18))));
    data[i+3]=255;
  }
  return {data,width,height};
}
