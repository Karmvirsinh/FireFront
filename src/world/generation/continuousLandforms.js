import {createNoise2D} from 'simplex-noise';
import {seedStream} from './seed.js';
import {createLandformPlan,positiveHeight,smooth} from './landformComposition.js';

// Comparison-only correction. Legacy gallery/production operators stay intact.
// Nearest-segment side selection used the WHOLE radial distance with one side's
// width, even past an endpoint. Crossing its extension then jumped between two
// different heights. Evaluate continuous elliptical segment caps instead and
// combine their envelopes. Max/min creates honest creases, never height jumps.
export function segmentProfile(p,x,z,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),u=((x-a.x)*dx+(z-a.z)*dz)/length;
 const v=(dx*(z-a.z)-dz*(x-a.x))/length,t=Math.max(0,Math.min(1,u/length)),end=u-t*length;
 const width=v<0?p.leftWidth:p.rightWidth,cap=(p.leftWidth+p.rightWidth)/2;
 return {height:a.y+(b.y-a.y)*t,lateral:v/width,axial:end/cap,side:v<0?-1:1};
}
export function continuousRidge(p,x,z){
 let h=0;
 for(let i=1;i<p.spine.length;i++){
  const q=segmentProfile(p,x,z,p.spine[i-1],p.spine[i]);
  h=Math.max(h,q.height*Math.exp(-(Math.hypot(q.lateral,q.axial)**(p.profile??2))));
 }
 for(const b of p.branches??[])h=Math.max(h,continuousRidge({...b,leftWidth:b.width,rightWidth:b.width},x,z));
 return h;
}
export function continuousCut(h,p,x,z){
 let result=h;
 for(let i=1;i<p.spine.length;i++){
  const q=segmentProfile(p,x,z,p.spine[i-1],p.spine[i]),r=Math.hypot(q.lateral,q.axial),w=1-smooth((r-.55)/.45);
  const bank=q.side<0?p.leftBank:p.rightBank,target=q.height+bank*q.lateral**2+(p.leftBank+p.rightBank)/2*q.axial**2;
  result=Math.min(result,h*(1-w)+target*w);
 }
 return result;
}
export function createContinuousStudyPlan(kind,seed,attempt){
 const plan=createLandformPlan(kind,seed,attempt),noise=createNoise2D(seedStream(seed,`landform-composition-v2:${kind}`,attempt));
 return continuousPlan(plan,noise);
}
export function continuousPlan(plan,noise){
 const base=(x,z)=>{
  let h=Math.max(.08*noise(x*.09,z*.09),...plan.raised.map(p=>p.type==='ridge'?continuousRidge(p,x,z):positiveHeight(p,x,z,noise)));
  for(const p of plan.basins){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle),u=dx*c+dz*s,v=-dx*s+dz*c;h-=p.depth*(1-smooth((Math.hypot(u/p.rx,v/p.rz)-.18)/.82));}
  return h;
 };
 const flats=plan.flats.map(p=>({...p,height:base(p.x,p.z)}));
 const height=(x,z)=>{
  let h=base(x,z);for(const p of flats){const w=1-smooth((Math.hypot(x-p.x,z-p.z)-p.radius*.55)/p.blend);h=h*(1-w)+p.height*w;}
  h+=noise(x*.6,z*.6)*.022;for(const p of plan.cuts)h=continuousCut(h,p,x,z);return h;
 };
 return {...plan,height,version:'comparison-continuous-caps-v1'};
}
