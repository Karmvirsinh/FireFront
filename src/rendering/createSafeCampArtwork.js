import * as THREE from 'three';
import data from './data/campArtwork.json' with {type:'json'};

// Visual-only compact camp. All solid dressing stays inside the already-blocked
// footprint. Arrival is the unchanged outside entrance; no camp interiors/routes.
export function createSafeCampArtwork({box,roof,roofMaterial}){
 const resources=[],models=new Map(),decode=s=>new Float32Array(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer);
 const material=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1});resources.push(m);return m;};
 const wood=material(0x705039),canvas=material(0xc5b68b),earth=material(0x8b7350),green=material(0x49724e),pale=material(0xeee3b9);
 const propMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});resources.push(propMaterial);
 for(const spec of data){const geometry=new THREE.BufferGeometry();for(const key of ['position','normal','color'])geometry.setAttribute(key,new THREE.BufferAttribute(decode(spec[key]),3));geometry.computeBoundingBox();resources.push(geometry);models.set(spec.name,{geometry,size:spec.size});}
 function addTo(house,width){
  const camp=new THREE.Group();camp.name='safe-camp';camp.scale.setScalar(width/1.5);house.add(camp);
  function mesh(name,g,m,x,y,z,sx,sy,sz,angle=0){const a=new THREE.Mesh(g,m);a.name=name;a.position.set(x,y,z);a.scale.set(sx,sy,sz);a.rotation.y=angle;camp.add(a);return a;}
  function prop(name,x,z,w,d,h,angle=0){const spec=models.get(name),s=Math.min(w/spec.size[0],h/spec.size[1],d/spec.size[2]);return mesh(`camp-${name}`,spec.geometry,propMaterial,x,.022,z,s,s,s,angle);}
  mesh('camp-earth-pad',box,earth,0,.012,0,1.48,.024,1.48);
  // Open-sided pavilion: posts, raised floor, roof and bench. Clear front gap.
  mesh('pavilion-deck',box,wood,-.28,.045,.25,.80,.06,.73);
  for(const x of [-.62,.06])for(const z of [-.055,.555])mesh('pavilion-post',box,wood,x,.46,z,.055,.86,.055);
  mesh('pavilion-roof',roof,roofMaterial,-.28,.90,.25,.90,.8,.83);
  mesh('pavilion-table',box,canvas,-.30,.28,.31,.38,.045,.22);
  mesh('pavilion-table-leg',box,wood,-.30,.16,.31,.06,.24,.06);
  mesh('pavilion-bench',box,wood,-.30,.17,.49,.49,.055,.10);
  prop('tent_smallOpen',.46,.27,.45,.60,.44,Math.PI);
  prop('campfire_stones',-.42,-.43,.31,.31,.08);
  prop('log',-.44,-.63,.12,.32,.12,Math.PI/2);
  const back=prop('fence_simpleLow',.30,.69,.66,.10,.20);back.scale.y*=1.55;
  const side=prop('fence_simpleLow',-.69,.17,.66,.10,.20,Math.PI/2);side.scale.y*=1.55;
  mesh('safe-marker-post',box,wood,.57,.34,-.55,.035,.66,.035);
  mesh('safe-marker-board',box,green,.49,.58,-.55,.33,.18,.035);
  mesh('safe-marker-cross',box,pale,.49,.58,-.574,.035,.12,.008);
  mesh('safe-marker-cross',box,pale,.49,.58,-.574,.12,.035,.008);
  return camp;
 }
 return {addTo,resources,models,propMaterial,palette:{wood,canvas,earth,green,pale}};
}
