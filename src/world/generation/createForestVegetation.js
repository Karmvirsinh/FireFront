import {createNoise2D} from 'simplex-noise';

// Region structure is independent of trails/terrain. Only fuel classification
// changes; trails and endpoint footprints are carved afterwards as before.
export function createForestVegetation(settings,random,rockRandom) {
  const broad=createNoise2D(random),detail=createNoise2D(random),rocks=createNoise2D(rockRandom);
  const bias=-.12+random()*.22;
  const anchors=Array.from({length:2+Math.floor(random()*3)},()=>({x:random()*settings.width,z:random()*settings.height,r:17+random()*11}));
  function distanceToSegment(x,z,a,b){
    const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
  }
  return Array.from({length:settings.width*settings.height},(_,i)=>{
    const x=i%settings.width,z=Math.floor(i/settings.width),small=detail(x*.09,z*.09);
    if(rocks(x*settings.rockScale+100,z*settings.rockScale+100)>settings.rockThreshold)
      return {terrain:'obstacle',fuelType:'none',walkable:false};
    let core=-Infinity;
    for(const a of anchors)core=Math.max(core,1-Math.hypot(x-a.x,z-a.z)/a.r);
    for(let n=1;n<anchors.length;n++)core=Math.max(core,.3-distanceToSegment(x,z,anchors[n-1],anchors[n])/18);
    const field=Math.max(broad(x*.018,z*.018)*.7+bias,core*.65)+small*.08;
    if(field>-.02){
      return {terrain:'vegetation',fuelType:'forest',walkable:false,
        canopyDensity:Math.max(.24,Math.min(.78,.32+field*1.1))};
    }
    // Openings are occasional, irregular and mostly grassy rather than bare.
    if(field<-.29&&small<-.30)return {terrain:'clearing',fuelType:'none',walkable:true};
    const fuelType=field>-.15?'brush':'grass';
    return {terrain:'vegetation',fuelType,walkable:fuelType==='grass'};
  });
}
