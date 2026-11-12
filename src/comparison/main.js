import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStudyMap} from '../prototype/createStudyMap.js';
import {createGaeaStudyMap} from '../prototype/createGaeaStudyMap.js';
import {displayedSurface,sampleStudyHeight} from '../prototype/studySurface.js';
import {createCellOutline} from '../prototype/createCellOutline.js';
import {createSurfaceMaterials} from '../rendering/surfaceMaterials.js';
import {applyLandscapePresentation,applyComparisonCamera} from '../rendering/landscapePresentation.js';
import {refineStudySurface,createComparisonGeometry,inspectComparisonCell,comparisonTrailReport} from './fineSurface.js';
import {loadArtwork,createDressing,comparisonPlacements,disposeArtwork} from './artComparison.js';
import {createFpsSampler} from '../performance/frameMetrics.js';
import {prepareTerrainShading} from './terrainShading.js';
import {configureLandscapeShadows,setLandscapeShadowFlags} from '../rendering/landscapeShadows.js';
import './style.css';

const $=s=>document.querySelector(s),canvas=$('#comparison-canvas'),viewport=canvas.parentElement,scene=new THREE.Scene();
const matched=new URLSearchParams(location.search).has('comparison');
if(matched)document.body.classList.add('matched-comparison');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));const sun=applyLandscapePresentation(renderer,scene);
const camera=new THREE.PerspectiveCamera(43,1,.1,200),controls=new OrbitControls(camera,canvas);
controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};controls.screenSpacePanning=false;controls.minDistance=3;controls.maxDistance=110;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI*.46;
let active=null,artMode='original',disposed=false,busy=false,scanVisible=false,outline=null,currentView='overview',native=null;
const settings={woodland:{seed:7,corners:[65,129,257]},plateau:{seed:34,corners:[65,129,257]},ridge:{seed:913,corners:[65,129,257]},gaea:{seed:30085,corners:[129,257,513]}};
const stops=[];function on(target,event,fn){target.addEventListener(event,fn);stops.push(()=>target.removeEventListener(event,fn));}
function clearOutline(){if(!outline)return;scene.remove(outline.mesh);outline.dispose();outline=null;}
function setView(close=false){
 if(!active)return;currentView=close?'detail':'overview';const map=active.map;
 if(matched&&!close){applyComparisonCamera(camera,controls,viewport.clientHeight);$('#view-note').textContent='Matched gallery camera / lighting / color · shadows off';return;}
 // Camera/light never depends on artwork or surface resolution.
 const focus=close?map.prototype.detail:[0,0],height=close?sampleStudyHeight(map,focus[0]/map.cellSize+map.width/2,focus[1]/map.cellSize+map.height/2):2.2;
 controls.target.set(focus[0],height,focus[1]);camera.position.copy(controls.target).add(new THREE.Vector3(...(close?[13,8,14]:[30,34,36])).multiplyScalar(close?1:Math.max(1,1.2/camera.aspect)));camera.zoom=1;camera.updateProjectionMatrix();controls.update();$('#view-note').textContent=close?'Close-up · A/B and mesh switching preserve this camera':'Overview · identical camera and lighting for A/B and mesh switching';
}
function sideGeometry(map){
 const s=displayedSurface(map),positions=[],depth=[],bottom=s.elevation.cornerHeights.reduce((a,b)=>Math.min(a,b),Infinity)-.69;
 const point=(x,z,y)=>[(x-s.width/2)*s.cellSize,y,(z-s.height/2)*s.cellSize];
 const top=(x,z)=>sampleStudyHeight(map,x/s.width*map.width,z/s.height*map.height);
 function edge(x,z,nx,nz){const ah=top(x,z),bh=top(nx,nz),a=point(x,z,ah),b=point(nx,nz,bh),c=point(nx,nz,bottom),d=point(x,z,bottom);positions.push(...a,...b,...c,...a,...c,...d);depth.push(0,0,bh-bottom,0,bh-bottom,ah-bottom);}
 for(let x=0;x<s.width;x++){edge(x,0,x+1,0);edge(x+1,s.height,x,s.height);}for(let z=0;z<s.height;z++){edge(0,z+1,0,z);edge(s.width,z,s.width,z+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('studyDepth',new THREE.Float32BufferAttribute(depth,1));g.computeVertexNormals();g.setAttribute('studyBlendNormal',g.attributes.normal);return g;
}
function createScan(map){
 const buffers={dot:[],triangle:[],cross:[]},indices=new Set(map.pathNetwork.trailCells),stride=map.width===128?8:4;
 for(let z=0;z<map.height;z+=stride)for(let x=0;x<map.width;x+=stride)indices.add(z*map.width+x);
 function line(i,a,b){const result=inspectComparisonCell(map,i),x=i%map.width+.5,z=Math.floor(i/map.width)+.5;
  for(const [u,v]of [a,b])buffers[result.symbol].push((x+u-map.width/2)*map.cellSize,sampleStudyHeight(map,x+u,z+v)+.04,(z+v-map.height/2)*map.cellSize);
 }
 for(const i of indices){const r=inspectComparisonCell(map,i);if(r.symbol==='dot'){for(let n=0;n<8;n++)line(i,[Math.cos(n*Math.PI/4)*.16,Math.sin(n*Math.PI/4)*.16],[Math.cos((n+1)*Math.PI/4)*.16,Math.sin((n+1)*Math.PI/4)*.16]);}
  else if(r.symbol==='cross'){line(i,[-.18,-.18],[.18,.18]);line(i,[-.18,.18],[.18,-.18]);}
  else{line(i,[0,-.2],[.19,.17]);line(i,[.19,.17],[-.19,.17]);line(i,[-.19,.17],[0,-.2]);}}
 const group=new THREE.Group();for(const [kind,color]of Object.entries({dot:0xfff4d2,triangle:0xffb72d,cross:0xff5145})){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(buffers[kind],3));const m=new THREE.LineBasicMaterial({color,depthTest:false,depthWrite:false,toneMapped:false});const mesh=new THREE.LineSegments(g,m);mesh.renderOrder=20;group.add(mesh);}group.visible=scanVisible;return {group,dispose(){group.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});}};
}
function updateResolutions(){const kind=$('#landscape').value;$('#resolution').replaceChildren(...settings[kind].corners.map(n=>{const o=document.createElement('option');o.value=n;o.textContent=`${n}×${n} corners`;return o;}));}
async function replace(resetCamera=false){
 if(busy||disposed)return;busy=true;sampler.reset();$('#metrics').textContent='Waiting for a rendered sample of the new comparison…';$('#load-status').textContent='Loading one active comparison…';for(const b of document.querySelectorAll('button,select'))b.disabled=true;
 let next=null,art=null;
 try{
  const kind=$('#landscape').value,corners=Number($('#resolution').value),start=performance.now();
  // Release previous GPU resources BEFORE constructing the next scene. Only the
  // native height samples and small renderer program cache remain between views.
  clearOutline();if(active){scene.remove(active.group);active.dispose();active=null;}renderer.renderLists.dispose();
  if(kind==='gaea'&&!native){const response=await fetch(`${import.meta.env.BASE_URL}comparison/gaea-height.u16`);if(!response.ok)throw new Error('Native height source unavailable');const buffer=await response.arrayBuffer(),data=new DataView(buffer);native=Uint16Array.from({length:512*512},(_,i)=>data.getUint16(i*2,true));}
  const map=kind==='gaea'?createGaeaStudyMap():createStudyMap(kind,settings[kind].seed);refineStudySurface(map,corners,native);
  const group=new THREE.Group(),finish=createSurfaceMaterials(map),groundGeometry=createComparisonGeometry(map),side=sideGeometry(map),ground=new THREE.Mesh(groundGeometry,finish.ground);
  const boundary=new THREE.Mesh(side,finish.cutaway);group.add(ground,boundary);const shading=[ground,boundary].map(prepareTerrainShading);shading.forEach(set=>set($('#shading').value));
  next={map,group,ground,shading,dispose(){groundGeometry.dispose();side.dispose();finish.resources.forEach(r=>r.dispose());next.dressing?.dispose();next.scan?.dispose();next.shadows?.dispose();}};
  const placements=comparisonPlacements(map);art=await loadArtwork(artMode);
  if(disposed){disposeArtwork(art);art=null;next.dispose();return;}
  next.dressing=createDressing(map,art,placements);art=null;next.scan=createScan(map);group.add(next.dressing.group,next.scan.group);
  setLandscapeShadowFlags(group);next.shadows=configureLandscapeShadows(renderer,sun,map,{enabled:!matched});
  const report=comparisonTrailReport(map);$('#route-status').textContent=report.connected===null?'Authored Gaea comparison has no trail.':`Displayed-surface trail check: ${report.connected?'connected':'fine barriers present'}; ${report.blockedCells} blocked cells / ${report.blockedEdges} blocked edges. Trails are NOT rerouted for this comparison.`;
  next.buildMs=performance.now()-start;next.counts=Object.fromEntries(['tree','brush','grass','rock'].map(k=>[k,placements.filter(p=>p.kind===k).length]));
  const arrays=new Set();group.traverse(o=>{if(!o.geometry)return;for(const a of Object.values(o.geometry.attributes))arrays.add(a.array);if(o.geometry.index)arrays.add(o.geometry.index.array);if(o.instanceMatrix)arrays.add(o.instanceMatrix.array);});next.geometryBytes=[...arrays].reduce((n,a)=>n+a.byteLength,0);
  active=next;scene.add(group);if(resetCamera)setView();
  $('#gaea-note').hidden=kind!=='gaea';$('#surface-note').textContent=`${map.width}×${map.height} logical cells unchanged; ${corners}² surface corners. ${map.comparisonSurface?.source??'original129 mesh'}; ${map.comparisonSurface?.clamped??0} samples clamped to common original height range. All picking/placement/scan use this displayed mesh.`;
  $('#inspection').textContent='Click ground. Scan accounts for the maximum fine-face slope within each coarse cell; physical classifications and Path-first permission remain separate.';
  $('#load-status').textContent='Ready. Geometry cost and FPS below are local responsiveness observations, not a performance benchmark.';
  for(const mode of ['original','kenney'])$('#'+mode).setAttribute('aria-pressed',String(mode===artMode));
 }catch(error){next?.dispose();if(art)for(const list of Object.values(art))list.forEach(g=>g.dispose());$('#load-status').textContent=`Comparison unavailable: ${error.message}`;}
 finally{busy=false;for(const b of document.querySelectorAll('button,select'))b.disabled=false;}
}
for(const mode of ['original','kenney'])on($('#'+mode),'click',()=>{if(artMode===mode)return;artMode=mode;replace();});
on($('#landscape'),'change',()=>{updateResolutions();replace(true);});on($('#resolution'),'change',()=>replace());on($('#overview'),'click',()=>setView());on($('#detail'),'click',()=>setView(true));
on($('#shading'),'change',()=>active?.shading.forEach(set=>set($('#shading').value)));
on($('#scan'),'click',()=>{scanVisible=!scanVisible;if(active)active.scan.group.visible=scanVisible;$('#scan').setAttribute('aria-pressed',String(scanVisible));});
on(window,'keydown',e=>{if(!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.target.isContentEditable&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.key.toLowerCase()==='r')setView();});
on(controls,'start',()=>{currentView='custom';});on(canvas,'contextmenu',e=>e.preventDefault());
let press=null;on(canvas,'pointerdown',e=>{press=e.button===0?{x:e.clientX,y:e.clientY}:null;});on(canvas,'pointercancel',()=>{press=null;});on(window,'blur',()=>{press=null;});
on(canvas,'pointerup',e=>{if(!active||e.button!==0||!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>4){press=null;return;}press=null;
 const rect=canvas.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
 const hit=ray.intersectObject(active.ground)[0];if(!hit)return;const m=active.map,x=Math.min(m.width-1,Math.max(0,Math.floor(hit.point.x/m.cellSize+m.width/2))),z=Math.min(m.height-1,Math.max(0,Math.floor(hit.point.z/m.cellSize+m.height/2))),i=z*m.width+x;
 clearOutline();outline=createCellOutline(m,i);scene.add(outline.mesh);$('#inspection').textContent=inspectComparisonCell(m,i).reason;
});
function resize(){renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();if(active&&currentView==='overview')setView();}const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
const sampler=createFpsSampler(fps=>{if(!active)return;const a=active;$('#metrics').textContent=`FPS ${fps.toFixed(1)} · ${renderer.info.render.triangles.toLocaleString()} rendered triangles · ${renderer.info.render.calls} draws · ${(a.geometryBytes/1048576).toFixed(1)} MiB geometry arrays · ${a.buildMs.toFixed(0)} ms switch/build · GPU ${renderer.info.memory.geometries} geometries / ${renderer.info.memory.textures} textures · trees ${a.counts.tree}, shrubs ${a.counts.brush}, grass ${a.counts.grass}, rocks ${a.counts.rock}`;});
on(document,'visibilitychange',()=>sampler.reset());
renderer.setAnimationLoop(now=>{if(disposed)return;controls.update();renderer.render(scene,camera);if(document.hidden)sampler.reset();else sampler.frame(now);});
function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();stops.forEach(fn=>fn());controls.dispose();clearOutline();active?.dispose();renderer.dispose();native=null;}
on(window,'pagehide',dispose);if(import.meta.hot)import.meta.hot.dispose(dispose);updateResolutions();replace(true);
