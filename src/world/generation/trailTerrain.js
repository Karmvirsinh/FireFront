import { sampleTerrainHeight, terrainCellGradients } from '../terrain.js';

export const TRAIL_SLOPE_DEGREES = 20;
const limit = Math.tan(TRAIL_SLOPE_DEGREES * Math.PI / 180);
// Both complete triangle footprints, not only their centers, must be suitable.
export function terrainTrailCell(map, index) {
  return Number.isInteger(index) && index >= 0 && index < map.width * map.height
    && terrainCellGradients(map,index).every(g => g <= limit + 1e-8);
}
export function terrainTrailEdge(map, from, to) {
  if (Math.abs(from%map.width-to%map.width)+Math.abs(Math.floor(from/map.width)-Math.floor(to/map.width)) !== 1
    || !terrainTrailCell(map,from) || !terrainTrailCell(map,to)) return false;
  // The shared-edge crossing and both half-cell segments use the same sampler
  // as rendering/agents. Complete face bounds also protect every intermediate point.
  const ax=from%map.width+.5, az=Math.floor(from/map.width)+.5;
  const bx=to%map.width+.5, bz=Math.floor(to/map.width)+.5;
  const heights=[sampleTerrainHeight(map,ax,az),sampleTerrainHeight(map,(ax+bx)/2,(az+bz)/2),sampleTerrainHeight(map,bx,bz)];
  return Math.abs(heights[1]-heights[0]) <= limit*map.cellSize/2+1e-8
    && Math.abs(heights[2]-heights[1]) <= limit*map.cellSize/2+1e-8;
}
export function validateTrailTerrain(map) {
  for (let i=0;i<map.cells.length;i++) if(map.navigation.allowedCells[i]) {
    if(!terrainTrailCell(map,i)) throw new Error(`Trail surface exceeds 20 degrees at ${i%map.width},${Math.floor(i/map.width)}`);
    for(const j of [i+1,i+map.width]) if(j<map.cells.length && map.navigation.allowedCells[j]
      && (j!==i+1 || j%map.width!==0) && !terrainTrailEdge(map,i,j)) throw new Error('Trail connection exceeds slope limit');
  }
}

export function createTerrainRouting(map) {
  const allowed=Array.from({length:map.width*map.height},(_,i)=>terrainTrailCell(map,i));
  const edgeCache=new Map();
  const adjacent=i=>[i-map.width,i+1,i+map.width,i-1].filter(j=>j>=0&&j<allowed.length&&allowed[j]
    &&Math.abs(i%map.width-j%map.width)+Math.abs(Math.floor(i/map.width)-Math.floor(j/map.width))===1
    && edge(i,j));
  function edge(i,j){const key=Math.min(i,j)*allowed.length+Math.max(i,j);if(!edgeCache.has(key))edgeCache.set(key,terrainTrailEdge(map,i,j));return edgeCache.get(key);}
  // Restrict nodes/endpoints to the largest terrain-feasible component. Other
  // plateaus remain intact; we do not cut through their risers to force access.
  const seen=new Set();let largest=[];
  for(let i=0;i<allowed.length;i++)if(allowed[i]&&!seen.has(i)){
    const queue=[i];seen.add(i);
    for(let h=0;h<queue.length;h++)for(const j of adjacent(queue[h]))if(!seen.has(j)){seen.add(j);queue.push(j);}
    if(queue.length>largest.length)largest=queue;
  }
  const component=new Set(largest);
  for(let i=0;i<allowed.length;i++)allowed[i]=component.has(i);
  function route(a,b,existing,bend=0) {
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    const start=a.z*map.width+a.x,goal=b.z*map.width+b.x;
    if (!allowed[start] || !allowed[goal]) return null;
    const distance=i=>Math.abs(i%map.width-b.x)+Math.abs(Math.floor(i/map.width)-b.z);
    const fromStart=i=>Math.abs(i%map.width-a.x)+Math.abs(Math.floor(i/map.width)-a.z);
    const cost=new Float64Array(allowed.length).fill(Infinity),parent=new Int32Array(allowed.length).fill(-1);
    const heap=[];
    function push(i,g){const item={i,g,f:g+distance(i)};heap.push(item);let k=heap.length-1;while(k){const p=(k-1)>>1;if(heap[p].f<=item.f)break;heap[k]=heap[p];k=p;}heap[k]=item;}
    function pop(){const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let c=k*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[k]=heap[c];k=c;}heap[k]=last;}return first;}
    cost[start]=0;push(start,0);
    while(heap.length){
      const {i,g}=pop();if(g!==cost[i])continue;
      if(i===goal){const line=[];for(let j=i;j!==-1;j=parent[j])line.push({x:j%map.width,z:Math.floor(j/map.width)});return line.reverse();}
      for(const j of adjacent(i)){
        if(!allowed[j])continue;
        const interior=fromStart(j)>4&&distance(j)>4;
        if(interior&&existing.has(j))continue;
        // A modest proximity penalty discourages sustained parallel tracks.
        const near=interior&&[j-1,j+1,j-map.width,j+map.width].some(k=>existing.has(k));
        const slope=Math.max(...terrainCellGradients(map,j));
        const turn = parent[i] >= 0 && i-parent[i] !== j-i ? .12 : 0;
        const px=j%map.width-a.x,pz=Math.floor(j/map.width)-a.z;
        const along=length ? Math.max(0,Math.min(1,(px*dx+pz*dz)/(length*length))) : 0;
        const lateral=length ? (-px*dz+pz*dx)/length : 0;
        const corridorDeviation=Math.abs(lateral-2*along*(1-along)*bend);
        const next=g+1+slope*.7+turn+(near?2:0)+corridorDeviation*.08;
        if(next<cost[j]){cost[j]=next;parent[j]=i;push(j,next);}
      }
    }
    return null;
  }
  return {allowed,route};
}
