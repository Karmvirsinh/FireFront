import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';

// Appearance-only fields: no classification or dressing-stream consumption.
export function createSurfaceRegions(map){
 const noise=createNoise2D(seedStream(map.prototype?.seed??map.generation?.seed??0,`art:surface-regions:${map.prototype?.kind??'simulator'}`));
 const data=new Uint8Array(map.width*map.height*4),clamp=v=>Math.max(0,Math.min(1,v));
 for(let z=0;z<map.height;z++)for(let x=0;x<map.width;x++){
  const wx=(x+.5-map.width/2)*map.cellSize,wz=(z+.5-map.height/2)*map.cellSize;
  const warp=noise(wx*.09+9,wz*.09)*.55,i=(z*map.width+x)*4;
  // Metre-scale regions with irregular shoulders, independent of tree centers.
  data[i]=clamp(.5+noise(wx*.11,wz*.11)*.65)*255;
  data[i+1]=clamp(.5+noise(wx*.075+warp+31,wz*.075-17)*.8)*255;
  data[i+2]=clamp(.5+noise(wx*.105+51,wz*.105+warp)*.7)*255;
  data[i+3]=clamp(.5+noise(wx*.11-41,wz*.11+11)*.65)*255;
 }
 return {data,width:map.width,height:map.height};
}
