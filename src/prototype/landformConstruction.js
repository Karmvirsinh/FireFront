import {createNoise2D} from 'simplex-noise';
import {seedStream} from '../world/generation/seed.js';

export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function polygonDistance(x,z,points){
 let inside=false,distance=Infinity;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside?distance:-distance;
}
export function nearestOnLine(x,z,line){
 let best={distance:Infinity};
 for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/length2));
  const px=a.x+t*dx,pz=a.z+t*dz,distance=Math.hypot(x-px,z-pz);
  if(distance<best.distance)best={distance,side:Math.sign(dx*(z-pz)-dz*(x-px))||1,height:a.y+(b.y-a.y)*t,t:(i-1+t)/(line.length-1)};
 }
 return best;
}
function local(p,x,z){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);return [dx*c+dz*s,-dx*s+dz*c];}
function world(p,x,z){const c=Math.cos(p.angle),s=Math.sin(p.angle);return {x:p.x+x*c-z*s,z:p.z+x*s+z*c};}
export function tablelandHeight(p,x,z,noise){
 const d=polygonDistance(x,z,p.points)+noise(x*.22+p.x,z*.22+p.z)*p.warp;
 const [u,v]=local(p,x,z),a=p.approach;
 const soft=a?(1-smooth((Math.abs(-u*Math.sin(a.angle)+v*Math.cos(a.angle))-a.width)/2))*smooth((u*Math.cos(a.angle)+v*Math.sin(a.angle))/3):0;
 const width=p.riser+(a?a.length-p.riser:0)*soft;
 return p.height*smooth((d+width)/width);
}
export function positiveHeight(p,x,z,noise){
 if(p.type==='tableland'||p.type==='terrace')return tablelandHeight(p,x,z,noise);
 if(p.type==='ridge'){
  const closest=nearestOnLine(x,z,p.spine),width=closest.side<0?p.leftWidth:p.rightWidth;
  return closest.height*Math.exp(-((closest.distance/width)**2));
 }
 const [u,v]=local(p,x,z),r=Math.hypot(u/p.rx,v/p.rz);
 return p.height*Math.exp(-r*r*1.8)*(1+.10*noise(x*.12+p.x,z*.12+p.z));
}
export function cutHeight(height,p,x,z){
 const q=nearestOnLine(x,z,p.spine),width=q.side<0?p.leftWidth:p.rightWidth;
 const weight=1-smooth((q.distance/width-.55)/.45);
 if(!weight)return height;
 const bank=q.side<0?p.leftBank:p.rightBank;
 const target=q.height+bank*(q.distance/width)**2;
 return Math.min(height,height*(1-weight)+target*weight);
}

// A small set of reusable operators, not a catalogue of named fixed maps.
export function createLandformPlan(emphasis,seed,attempt=0){
 const random=seedStream(seed,`landform-composition-v2:${emphasis}`,attempt),noise=createNoise2D(random);
 const range=(a,b)=>a+random()*(b-a),chance=p=>random()<p;
 const site=(edge=false)=>{
  let x=range(-12,12),z=range(-12,12);
  if(edge){if(chance(.5))x=chance(.5)?-16:16;else z=chance(.5)?-16:16;if(chance(.3)){x=Math.sign(x||1)*16;z=Math.sign(z||1)*16;}}
  return {x,z,angle:range(-Math.PI,Math.PI)};
 };
 const raised=[],basins=[],flats=[],cuts=[];
 const addHill=(height,edge=false)=>raised.push({type:'hill',...site(edge),height,rx:range(5,12),rz:range(4,10)});
 const addRidge=(height,edge=false)=>{
  const p={type:'ridge',...site(edge),height,leftWidth:range(1.5,3.6),rightWidth:range(5,9),spine:[]},length=range(17,29);
  if(chance(.5))[p.leftWidth,p.rightWidth]=[p.rightWidth,p.leftWidth];
  for(let i=0;i<5;i++){const q=world(p,(i/4-.5)*length,range(-2,2));p.spine.push({...q,y:height*range(.55,1)});}
  raised.push(p);
 };
 function polygon(p,rx,rz,count){
  return Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2,r=range(.70,1.16);const q=world(p,Math.cos(a)*rx*r,Math.sin(a)*rz*r);return [q.x,q.z];});
 }
 const addTableland=(height,edge=false)=>{
  const p={type:'tableland',...site(edge),height,riser:range(.7,1.6),warp:range(.10,.5),points:[],approach:null};
  const rx=range(6,11),rz=range(3.2,6);p.points=polygon(p,rx,rz,8+Math.floor(range(0,7)));
  if(chance(.65))p.approach={angle:range(-Math.PI,Math.PI),width:range(2,4),length:height*range(4.8,6)};
  raised.push(p);
  if(chance(.7)){
   const count=1+Math.floor(range(0,3)),side=chance(.5)?1:-1;
   for(let i=0;i<count;i++){
    const q=world(p,range(-rx*.5,rx*.5),side*(rz+range(.8,3.5)));
    const shelf={type:'terrace',...q,angle:p.angle+range(-.5,.5),height:height*(.23+(i+1)/(count+1)*.5),riser:range(.6,1.5),warp:range(.1,.4),approach:null};
    shelf.points=polygon(shelf,range(3.5,7),range(1.3,3),7+Math.floor(range(0,4)));raised.push(shelf);
   }
  }
 };
 // Emphasis changes probabilities and relief, not a fixed choice of shape recipe.
 const draw=random();
 if(emphasis==='woodland'){
  addHill(range(1,2.6),chance(.45));if(chance(.65))addHill(range(.7,2));
  if(draw<.30)addTableland(range(1.8,3),chance(.5));else if(draw>.72)addRidge(range(2,3.5),chance(.4));
 }else if(emphasis==='plateau'){
  if(draw<.72)addTableland(range(3,5.5),chance(.65));else{addRidge(range(3.5,6),chance(.6));addHill(range(1,2.5));}
  if(chance(.4))addTableland(range(1.5,3),chance(.6));if(chance(.55))addHill(range(.8,2.2));
 }else{
  addRidge(range(4.5,8.5),chance(.6));if(draw<.32)addTableland(range(2.5,4.5),chance(.7));else if(draw>.65)addRidge(range(2.5,5),chance(.5));
  if(chance(.45))addHill(range(.7,2.3));
 }
 if(chance(.65))basins.push({...site(chance(.3)),depth:range(.5,emphasis==='ridge'?2:1.4),rx:range(4,9),rz:range(3,7)});
 if(chance(emphasis==='woodland'?.90:.4))flats.push({...site(),radius:range(3,6),blend:range(2,4)});
 const base=(x,z)=>{
  // Max envelopes retain coherent landforms; low-frequency modulation is subordinate.
  let h=Math.max(.08*noise(x*.09,z*.09),...raised.map(p=>positiveHeight(p,x,z,noise)));
  for(const p of basins){const [u,v]=local(p,x,z);h-=p.depth*(1-smooth((Math.hypot(u/p.rx,v/p.rz)-.18)/.82));}
  return h;
 };
 flats.forEach(p=>{p.height=base(p.x,p.z);});
 const uncut=(x,z)=>{
  let h=base(x,z);for(const p of flats){const w=1-smooth((Math.hypot(x-p.x,z-p.z)-p.radius*.55)/p.blend);h=h*(1-w)+p.height*w;}
  return h+noise(x*.6,z*.6)*.022;
 };
 let min=Infinity;for(let z=-16;z<=16;z+=.5)for(let x=-16;x<=16;x+=.5)min=Math.min(min,uncut(x,z));
 if(chance(emphasis==='woodland'?.55:.8)){
  const p={type:'cut',...site(),spine:[],leftWidth:range(1.5,3.5),rightWidth:range(2,5),leftBank:range(.5,1.5),rightBank:range(1.8,4.8)};
  const length=range(35,43),start=min-.12,end=start-range(.5,1.8);
  // A trunk and optional tributaries share descending bed elevations at junctions.
  p.x*=.45;p.z*=.45;
  for(let i=0;i<5;i++){const q=world(p,(i/4-.5)*length,Math.sin(i*1.4+seed)*range(.4,2));p.spine.push({...q,y:start+(end-start)*i/4});}
  cuts.push(p);
  if(chance(.7))for(let i=0;i<1+Math.floor(range(0,2));i++){
   const join=p.spine[1+i],q=world(p,(i/4-.25)*length,range(11,19)*(chance(.5)?1:-1));
   cuts.push({type:'tributary',spine:[{...q,y:Math.min(min-.04,join.y+.4)},{x:(q.x+join.x)/2+range(-2,2),z:(q.z+join.z)/2+range(-2,2),y:(Math.min(min-.04,join.y+.4)+join.y)/2},{...join}],leftWidth:range(.8,1.5),rightWidth:range(1,2),leftBank:range(.4,1),rightBank:range(1.5,3)});
  }
 }
 const height=(x,z)=>{let h=uncut(x,z);for(const p of cuts)h=cutHeight(h,p,x,z);return h;};
 return {version:'landform-composition-v2',emphasis,seed,attempt,raised,basins,flats,cuts,height};
}
