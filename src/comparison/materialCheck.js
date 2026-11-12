import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import './style.css';

document.querySelector('h1').textContent='Kenney · untouched GLB material check';
document.querySelector('aside').innerHTML=`<h2>Source diagnosis</h2><p>The oak below uses untouched imported materials: no color override, vertex bake, material replacement or tone mapping. Neutral white room lighting, sRGB output.</p><p>Bundled source preview:</p><img src="${import.meta.env.BASE_URL}comparison/kenney/tree_oak-preview.png" alt="Kenney's original turquoise oak preview" width="96"><p>The archive really uses turquoise foliage and salmon bark. This is not a missing natural-green texture.</p><p id="source-facts"></p><p>Its legacy exporter writes the preview's sRGB values directly into glTF's linear baseColorFactor. The instanced comparison decodes these channels once. It does not tint foliage green.</p><a href="asset-terrain-comparison.html">Return to corrected A/B</a><p>Kenney Nature Kit · CC0. Gaea is unrelated.</p>`;
const canvas=document.querySelector('canvas'),viewport=canvas.parentElement,renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x777777);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(43,1,.01,30),controls=new OrbitControls(camera,canvas);camera.position.set(2,1.4,2);controls.target.set(0,.55,0);controls.update();
let disposed=false,model;
try{
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}comparison/kenney/tree_oak.glb`);model=gltf.scene;scene.add(model);
 const facts=[];model.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])facts.push(`${m.name}: factor ${m.color.toArray().map(v=>v.toFixed(3)).join(',')}, metalness ${m.metalness}, map ${Boolean(m.map)}, vertex colors ${m.vertexColors}`);});
 document.querySelector('#source-facts').textContent=facts.join('. ');document.querySelector('#metrics').textContent='Untouched original materials; no palette texture or vertex colors in this GLB.';
}catch(error){document.querySelector('#metrics').textContent=error.message;}
function resize(){renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();model?.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});env.dispose();renderer.dispose();}
window.addEventListener('pagehide',dispose,{once:true});if(import.meta.hot)import.meta.hot.dispose(dispose);
