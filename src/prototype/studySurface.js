import {sampleTerrainHeight,terrainCellGradients} from '../world/terrain.js';
import {createGroundPicker} from '../rendering/createGroundPicker.js';

export const displayedSurface=map=>map.displaySurface??map;
export function sampleStudyHeight(map,gx,gz){
 const surface=displayedSurface(map);
 return sampleTerrainHeight(surface,gx*surface.width/map.width,gz*surface.height/map.height);
}
export function displayedCellSlope(map,index){
 const surface=displayedSurface(map),ratio=surface.width/map.width;
 let gradient=0;
 for(let z=0;z<ratio;z++)for(let x=0;x<ratio;x++){
  const fine=(Math.floor(index/map.width)*ratio+z)*surface.width+(index%map.width*ratio+x);
  gradient=Math.max(gradient,...terrainCellGradients(surface,fine));
 }
 return Math.atan(gradient)*180/Math.PI;
}
export function createStudyPicker(camera,canvas,map){
 const surface=displayedSurface(map),picker=createGroundPicker(camera,canvas,surface),ratio=surface.width/map.width;
 const pick=(x,y)=>{const index=picker(x,y);return index===null?null:Math.floor(Math.floor(index/surface.width)/ratio)*map.width+Math.floor(index%surface.width/ratio);};
 pick.dispose=picker.dispose;return pick;
}
