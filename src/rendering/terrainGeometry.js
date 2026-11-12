import * as THREE from 'three';
import { sampleTerrainHeight,renderTerrainMap } from '../world/terrain.js';

export function createTerrainGeometry(map) {
  if(map.elevation?.surface){
    const s=renderTerrainMap(map),positions=[],indices=[];
    for(let z=0;z<=s.height;z++)for(let x=0;x<=s.width;x++)positions.push((x-s.width/2)*s.cellSize,sampleTerrainHeight(s,x,z),(z-s.height/2)*s.cellSize);
    for(let z=0;z<s.height;z++)for(let x=0;x<s.width;x++){const a=z*(s.width+1)+x,b=a+s.width+1;indices.push(a,b,b+1,a,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const positions = [];
  for (let z = 0; z < map.height; z++) for (let x = 0; x < map.width; x++) {
    for (const [dx,dz] of [[0,0],[0,1],[1,1],[0,0],[1,1],[1,0]]) {
      positions.push((x+dx-map.width/2)*map.cellSize,
        sampleTerrainHeight(map,x+dx,z+dz),(z+dz-map.height/2)*map.cellSize);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createTerrainTiles(map) {
  const geometry = createTerrainGeometry(map);
  if(map.elevation?.surface){
    // Fine vertices do not align with104logical cells. Category/fire colors are
    // authoritative nearest-filtered shader textures, not per-vertex painting.
    const logical=new Float32Array(map.cells.length*3),mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
    mesh.setColorAt=(i,c)=>{logical.set(c.toArray(),i*3);};mesh.getColorAt=(i,c)=>c.fromArray(logical,i*3);
    mesh.instanceColor={addUpdateRange(){},set needsUpdate(v){}};return mesh;
  }
  const colors = new THREE.Float32BufferAttribute(new Float32Array(map.cells.length*18),3);
  geometry.setAttribute('color',colors);
  const mesh = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true}));
  const normals=geometry.getAttribute('normal');
  const shade=new THREE.Color(),earth=new THREE.Color(0x80654d),rock=new THREE.Color(0x85867b);
  mesh.setColorAt = (index,color,surface=true) => {
    for(let face=0;face<2;face++){
      const slope=Math.acos(Math.max(-1,Math.min(1,normals.getY(index*6+face*3))))*180/Math.PI;
      shade.copy(color);
      if(surface&&['terrain-structure-v3','terrain-routed-v4','simulator-composition-v1','simulator-composition-v2'].includes(map.elevation?.generation?.version)&&slope>28){
        shade.lerp(slope>40?rock:earth,Math.min(.85,(slope-28)/18));
      }
      for(let v=0;v<3;v++)colors.setXYZ(index*6+face*3+v,shade.r,shade.g,shade.b);
    }
  };
  mesh.getColorAt = (index,color) => color.fromBufferAttribute(colors,index*6);
  // Callers mark logical cells; upload the batched color buffer after changes.
  mesh.instanceColor = { addUpdateRange() {}, set needsUpdate(value) { colors.needsUpdate=value; } };
  return mesh;
}

export function createTerrainSkirt(map) {
  map=renderTerrainMap(map);
  const positions=[];
  const bottom=Math.min(...map.elevation.cornerHeights)-.69;
  const point=(x,z,y)=>[(x-map.width/2)*map.cellSize,y,(z-map.height/2)*map.cellSize];
  const edge=(x,z,nx,nz)=>{
    const a=point(x,z,sampleTerrainHeight(map,x,z)),b=point(nx,nz,sampleTerrainHeight(map,nx,nz));
    const c=point(nx,nz,bottom),d=point(x,z,bottom);
    positions.push(...a,...b,...c,...a,...c,...d);
  };
  for(let x=0;x<map.width;x++){edge(x,0,x+1,0);edge(x+1,map.height,x,map.height);}
  for(let z=0;z<map.height;z++){edge(0,z+1,0,z);edge(map.width,z,map.width,z+1);}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x735338,side:THREE.DoubleSide}));
  mesh.name='terrain-base';return mesh;
}
