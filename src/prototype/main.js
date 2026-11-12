import * as THREE from 'three';
import {applyLandscapePresentation,applyComparisonCamera} from '../rendering/landscapePresentation.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStudyMap,STUDIES,GALLERY} from './createStudyMap.js';
import {createGaeaStudyMap} from './createGaeaStudyMap.js';
import {createStudyView} from './createStudyView.js';
import {createScanView} from './createScanView.js';
import {inspectTraversal} from './traversalScan.js';
import {createStudyPicker,sampleStudyHeight,displayedSurface} from './studySurface.js';
import {createCellOutline} from './createCellOutline.js';
import './style.css';
import '../rendering/comparison.css';

const canvas=document.querySelector('#study-canvas'),viewport=canvas.parentElement;
const comparison=new URLSearchParams(location.search).has('comparison');
if(comparison)document.body.classList.add('terrain-comparison');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=!comparison;renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.setClearColor(0xafb9a6);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scanLayer=new THREE.Scene(),scanDepthMaterial=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:THREE.DoubleSide});let scanOccluder;
const scene=new THREE.Scene();const sun=applyLandscapePresentation(renderer,scene);sun.castShadow=!comparison;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:80});sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;scene.add(sun);
const camera=new THREE.PerspectiveCamera(43,1,.1,160);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.screenSpacePanning=false;controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};controls.minDistance=4;controls.maxDistance=110;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.44;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let kind=new URLSearchParams(location.search).get('study')==='gaea'?'gaea':'woodland',seed=kind==='gaea'?30085:7,map,view,pick,scan,outline,scanning=false,disposed=false,currentView='overview';
let meshCorners=new URLSearchParams(location.search).get('mesh')==='257'?257:129;
function setView(close=false){
 currentView=close?'detail':'overview';
 if(comparison&&!close){applyComparisonCamera(camera,controls,viewport.clientHeight);document.querySelector('#view-tag').textContent='Matched camera/light/color · 0.12 units per CSS pixel · no shadows';return;}
 if(close){
  const [x,z]=map.prototype.detail;controls.target.set(x,sampleStudyHeight(map,x/map.cellSize+map.width/2,z/map.cellSize+map.height/2)+.7,z);
  camera.position.copy(controls.target).add(new THREE.Vector3(...map.prototype.look));
 }else{
  const box=new THREE.Box3().setFromObject(view.group),center=box.getCenter(new THREE.Vector3());
  const direction=new THREE.Vector3(kind==='ridge'?-24:24,27,28).normalize();
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  let distance=0;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const p=new THREE.Vector3(x,y,z).sub(center),toward=p.dot(direction);
   distance=Math.max(distance,toward+Math.abs(p.dot(up))/tan,toward+Math.abs(p.dot(right))/(tan*camera.aspect));
  }
  controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance*1.08);
 }
 camera.zoom=1;camera.updateProjectionMatrix();controls.update();
 document.querySelector('#view-tag').textContent=close?'Close-up · freely orbit':'Overview · freely orbit';
}
function replace(preserveCamera=false){
 let nextView,nextScan,nextPick,nextMap;
 try{nextMap=kind==='gaea'?createGaeaStudyMap(meshCorners):createStudyMap(kind,seed);nextView=createStudyView(nextMap);nextScan=createScanView(nextMap,kind==='gaea'?4:2);nextPick=createStudyPicker(camera,canvas,nextMap);}
 catch(error){nextView?.dispose();nextScan?.dispose();nextPick?.dispose();document.querySelector('#surface-status').textContent=`Could not build composition: ${error.message}`;return;}
 if(outline){scene.remove(outline.mesh);outline.dispose();outline=null;}
 if(view){scene.remove(view.group);scanLayer.remove(scan.group,scanOccluder);view.dispose();scan.dispose();pick.dispose();}
 map=nextMap;view=nextView;scan=nextScan;pick=nextPick;scene.add(view.group);scanOccluder=new THREE.Mesh(view.ground.geometry,scanDepthMaterial);scanLayer.add(scanOccluder,scan.group);scanning=false;
 document.querySelector('#study-title').textContent=kind==='gaea'?'Gaea · Sandstone Butte export':`${STUDIES[kind].title} · seed ${seed}`;
 document.querySelector('#study-subtitle').textContent=map.prototype.summary;
 for(const button of document.querySelectorAll('[data-example]'))button.setAttribute('aria-pressed',String(button.dataset.example===`${kind}-${seed}`));
 document.querySelector('#gaea-study').setAttribute('aria-pressed',String(kind==='gaea'));
 document.querySelector('#gaea-note').hidden=kind!=='gaea';
 document.querySelector('#mesh-options').hidden=kind!=='gaea';
 for(const b of document.querySelectorAll('[data-mesh]'))b.setAttribute('aria-pressed',String(Number(b.dataset.mesh)===meshCorners));
 document.querySelector('#scan-coverage').textContent=kind==='gaea'?'fourth':'second';
 document.querySelector('#study-grid').textContent=`${map.width}×${map.height} cells · ${map.cellSize} world units per cell`;
 const facts={'Seed':seed,'Mesh':`${displayedSurface(map).width+1}² corners / ${view.ground.geometry.attributes.position.count/3} triangles`,'Traversal':`${map.width}² cells`,'Relief':Math.max(...map.elevation.cornerHeights).toFixed(2)+' units','Trees':view.placements.trees.reduce((n,a)=>n+a.length,0),'Trail cells':map.pathNetwork.trailCells.length,'Trail rise':map.prototype.trailRise.toFixed(2)+' units'};
 const dl=document.querySelector('#study-facts');dl.replaceChildren();for(const [name,value]of Object.entries(facts)){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;row.append(dt,dd);dl.append(row);}
 document.querySelector('#surface-status').textContent='Click any cell for slope suitability, physical blockers and Path-first policy.';
 document.querySelector('#scan-status').textContent='Press T or Scan terrain. Hold 6 s, then fade 1.5 s; reduced motion stays static.';
 if(!preserveCamera)setView();
}
const listeners=[];
function on(target,type,handler){target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));}
on(document.querySelector('#gaea-study'),'click',()=>{kind='gaea';seed=30085;replace();});
for(const b of document.querySelectorAll('[data-mesh]'))on(b,'click',()=>{const value=Number(b.dataset.mesh);if(value===meshCorners)return;meshCorners=value;replace(true);});
for(const [i,example]of GALLERY.entries()){
 const button=document.createElement('button');button.dataset.example=example.id;button.setAttribute('aria-pressed',String(i===0));
 button.textContent=`${String(i+1).padStart(2,'0')} · ${STUDIES[example.kind].title} / ${example.seed}`;
 on(button,'click',()=>{kind=example.kind;seed=example.seed;replace();});document.querySelector('#gallery').append(button);
}
if(window.matchMedia('(max-width: 820px)').matches)document.querySelector('.gallery-panel').open=false;
function startScan(){scan.start(performance.now()/1000,reducedMotion.matches);scanning=true;document.querySelector('#scan-status').textContent='Scan visible. Click a cell for its actual reason. Red is blocked, not lethal.';}
on(document.querySelector('#overview'),'click',()=>setView());on(document.querySelector('#detail'),'click',()=>setView(true));on(document.querySelector('#scan'),'click',startScan);
on(controls,'start',()=>{currentView='custom';document.querySelector('#view-tag').textContent='Custom view';});
on(window,'keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key.toLowerCase()==='r')setView();if(e.key.toLowerCase()==='t')startScan();});
let press=null;
on(canvas,'pointerdown',e=>{press=e.button===0?{x:e.clientX,y:e.clientY}:null;});
on(canvas,'pointerup',e=>{if(e.button!==0||!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>4){press=null;return;}press=null;const i=pick(e.clientX,e.clientY);if(i===null)return;if(outline){scene.remove(outline.mesh);outline.dispose();}outline=createCellOutline(map,i);scene.add(outline.mesh);document.querySelector('#surface-status').textContent=`Cell (${i%map.width}, ${Math.floor(i/map.width)}) · ${map.cells[i].terrain}. ${inspectTraversal(map,i).reason}`;});
on(canvas,'pointercancel',()=>{press=null;});on(canvas,'contextmenu',e=>e.preventDefault());on(window,'blur',()=>{press=null;});
function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(Math.max(1,viewport.clientWidth),Math.max(1,viewport.clientHeight),false);camera.aspect=viewport.clientWidth/Math.max(1,viewport.clientHeight);camera.updateProjectionMatrix();if(view&&currentView==='overview')setView();}
const observer=new ResizeObserver(resize);observer.observe(viewport);replace();resize();
renderer.setAnimationLoop(time=>{if(disposed)return;controls.update();if(scanning&&!scan.update(time/1000)){scanning=false;document.querySelector('#scan-status').textContent='Scan ended. Press T to repeat; cell inspection remains available.';}renderer.render(scene,camera);if(scanning){renderer.autoClear=false;renderer.clearDepth();renderer.render(scanLayer,camera);renderer.autoClear=true;}});
function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();listeners.forEach(stop=>stop());controls.dispose();pick?.dispose();view?.dispose();scan?.dispose();outline?.dispose();sun.shadow.map?.dispose();scanDepthMaterial.dispose();renderer.dispose();}
on(window,'pagehide',dispose);if(import.meta.hot)import.meta.hot.dispose(dispose);
