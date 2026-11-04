import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStudyMap,STUDIES} from './createStudyMap.js';
import {createStudyView} from './createStudyView.js';
import {createGroundPicker} from '../rendering/createGroundPicker.js';
import {sampleTerrainHeight} from '../world/terrain.js';
import './style.css';

const canvas=document.querySelector('#study-canvas'),viewport=canvas.parentElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.setClearColor(0xafb9a6);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xf4edd6,0x53624a,2));
const sun=new THREE.DirectionalLight(0xffebc5,3.2);sun.position.set(-16,27,14);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:80});sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;scene.add(sun);
const camera=new THREE.PerspectiveCamera(43,1,.1,160);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.screenSpacePanning=false;controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};controls.minDistance=4;controls.maxDistance=85;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.44;
let kind='woodland',seed=7,map,view,pick,disposed=false,currentView='overview';
function setView(close=false){
 const study=STUDIES[kind];currentView=close?'detail':'overview';
 if(close){
  const [x,z]=study.detail;controls.target.set(x,sampleTerrainHeight(map,x/.5+32,z/.5+32)+.7,z);
  camera.position.copy(controls.target).add(new THREE.Vector3(...study.look));
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
function replace(){
 if(view){scene.remove(view.group);view.dispose();pick.dispose();}
 map=createStudyMap(kind,seed);view=createStudyView(map);scene.add(view.group);pick=createGroundPicker(camera,canvas,map);
 view.overlay.visible=document.querySelector('#traversal').checked;
 document.querySelector('#study-title').textContent=STUDIES[kind].title;document.querySelector('#study-subtitle').textContent=STUDIES[kind].subtitle;
 const max=Math.max(...map.elevation.cornerHeights),trees=view.placements.trees.reduce((n,a)=>n+a.length,0);
 const facts={'Seed':seed,'Relief':max.toFixed(2)+' units','Trees':trees,'Trail cells':map.pathNetwork.trailCells.length,'Trail rise':map.prototype.trailRise.toFixed(2)+' units'};
 const dl=document.querySelector('#study-facts');dl.replaceChildren();for(const [name,value]of Object.entries(facts)){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;row.append(dt,dd);dl.append(row);}
 document.querySelector('#surface-status').textContent='Click terrain to inspect its slope and physical traversal.';
 setView();
}
const listeners=[];
function on(target,type,handler){target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));}
for(const button of document.querySelectorAll('[data-study]'))on(button,'click',()=>{kind=button.dataset.study;for(const b of document.querySelectorAll('[data-study]'))b.setAttribute('aria-pressed',String(b===button));replace();});
for(const button of document.querySelectorAll('[data-seed]'))on(button,'click',()=>{seed=Number(button.dataset.seed);for(const b of document.querySelectorAll('[data-seed]'))b.setAttribute('aria-pressed',String(b===button));replace();});
on(document.querySelector('#overview'),'click',()=>setView());on(document.querySelector('#detail'),'click',()=>setView(true));
on(document.querySelector('#traversal'),'change',event=>{view.overlay.visible=event.target.checked;});
on(controls,'start',()=>{currentView='custom';document.querySelector('#view-tag').textContent='Custom view';});
on(window,'keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key.toLowerCase()==='r')setView();});
let press=null;
on(canvas,'pointerdown',e=>{press=e.button===0?{x:e.clientX,y:e.clientY}:null;});
on(canvas,'pointerup',e=>{if(e.button!==0||!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>4){press=null;return;}press=null;const i=pick(e.clientX,e.clientY);if(i===null)return;const c=map.cells[i];document.querySelector('#surface-status').textContent=`Cell (${i%64}, ${Math.floor(i/64)}) · ${c.terrain} · ${c.slope.toFixed(1)}° · ${c.walkable?'physically walkable':'blocked'}${c.terrain==='trail'?' · verified trail':''}`;});
on(canvas,'pointercancel',()=>{press=null;});on(canvas,'contextmenu',e=>e.preventDefault());on(window,'blur',()=>{press=null;});
function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();if(view&&currentView==='overview')setView();}
const observer=new ResizeObserver(resize);observer.observe(viewport);replace();resize();
renderer.setAnimationLoop(()=>{if(disposed)return;controls.update();renderer.render(scene,camera);});
function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();listeners.forEach(stop=>stop());controls.dispose();pick?.dispose();view?.dispose();sun.shadow.map?.dispose();renderer.dispose();}
on(window,'pagehide',dispose);if(import.meta.hot)import.meta.hot.dispose(dispose);
