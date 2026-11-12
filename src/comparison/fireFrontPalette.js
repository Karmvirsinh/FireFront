import {Color} from 'three';

// Explicitly adapted comparison artwork, not a correction to Kenney's source.
// Original GLBs and the neutral untouched-material diagnostic remain unchanged.
export function palettePart(kind,name){
 const n=name.toLowerCase();if(kind==='rock')return n.includes('grass')?'moss':'stone';
 if(n.includes('wood')||n.includes('bark'))return 'wood';
 if(kind==='tree')return n.includes('dark')?'conifer':'broadleaf';
 return kind==='brush'?'shrub':'grass';
}
const colors={wood:0x73604b,broadleaf:0x5f7c42,conifer:0x315741,shrub:0x5c7845,grass:0x819550,stone:0x8d887c,moss:0x647450};
export function fireFrontPartColor(part,triangle=0){
 if(!(part in colors))throw new Error('Unknown artwork part');
 const c=new Color(colors[part]),hash=Math.sin(triangle*12.79+3.1)*43758.5,shade=.94+.12*(hash-Math.floor(hash));
 // Bounded face shade variation; separate bark/foliage/stone parts retained.
 return c.multiplyScalar(Math.max(.91,Math.min(1.07,shade)));
}
