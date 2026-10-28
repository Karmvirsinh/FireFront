import { normalizeMap } from '../mapContract.js';
import { isNavigable } from '../navigationPolicy.js';
import { neighbors } from '../../agents/findPath.js';
import { GENERATOR_SETTINGS as SETTINGS, GENERATOR_VERSION, normalizeSeed } from './seed.js';

export function validateGeneratedMap(candidate) {
  const map = normalizeMap(candidate);
  const fail = (message) => { throw new Error(`Generated map invalid: ${message}`); };
  if (!map.generation || map.generation.version !== GENERATOR_VERSION
    || normalizeSeed(map.generation.seed) !== map.generation.seed
    || !Number.isInteger(map.generation.attempt) || map.generation.attempt < 0 || map.generation.attempt > 3
    || Object.entries(SETTINGS).some(([key, value]) => map.generation.settings?.[key] !== value)
    || map.pathNetwork?.widthCells !== SETTINGS.pathWidth) fail('generator metadata');
  if (map.width !== SETTINGS.width || map.height !== SETTINGS.height || map.cellSize !== SETTINGS.cellSize
    || map.spawnCells.length !== SETTINGS.population || new Set(map.spawnCells).size !== SETTINGS.population) fail('dimensions/population');
  if (Math.hypot(map.start.x - map.safeZone.x, map.start.z - map.safeZone.z) < 34) fail('endpoints too close');
  if (map.navigation?.mode !== 'path-first') fail('missing Path-first policy');
  const start = map.start.z * map.width + map.start.x;
  const goal = map.safeZone.z * map.width + map.safeZone.x;
  if (map.cells[start].terrain !== 'start' || map.cells[goal].terrain !== 'safe'
    || !map.spawnCells.every((i) => map.cells[i].terrain === 'start')) fail('endpoint/spawn clearing');
  for (const [i, cell] of map.cells.entries()) {
    const network = ['route', 'start', 'safe'].includes(cell.terrain);
    if (network && (cell.fuelType !== 'none' || !cell.walkable)) fail('fuel/obstacle on path or endpoint');
    if (map.navigation.allowedCells[i] !== network) fail('navigation mask disagrees with network');
  }
  const lines = map.pathNetwork.centerlines;
  if (!Array.isArray(lines) || !lines.length) fail('missing path centerlines');
  const radius = (SETTINGS.pathWidth - 1) / 2;
  for (const line of lines) {
    if (!Array.isArray(line) || line.length < 1) fail('invalid path centerline');
    for (const [step, p] of line.entries()) {
      if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.z)
        || p.x < radius || p.z < radius || p.x >= map.width - radius || p.z >= map.height - radius) fail('path bounds');
      if (step && Math.abs(p.x - line[step - 1].x) + Math.abs(p.z - line[step - 1].z) !== 1) fail('nonadjacent path trace');
      for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
        if (!map.navigation.allowedCells[(p.z + dz) * map.width + p.x + dx]) fail('path width pinch');
      }
    }
  }
  const nodes=map.pathNetwork.nodes, connections=map.pathNetwork.connections;
  const validPoint=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z)&&p.x>=0&&p.x<map.width
    &&p.z>=0&&p.z<map.height&&map.navigation.allowedCells[p.z*map.width+p.x];
  if(!Array.isArray(nodes)||nodes.length<SETTINGS.nodeMin||nodes.length>SETTINGS.nodeMax
    ||nodes.some(p=>!validPoint(p)||map.cells[p.z*map.width+p.x].terrain!=='route')) fail('invalid forest nodes');
  for(let i=0;i<nodes.length;i++) for(let j=0;j<i;j++) {
    if(Math.hypot(nodes[i].x-nodes[j].x,nodes[i].z-nodes[j].z)<SETTINGS.nodeSpacing) fail('forest node spacing');
  }
  if(!Array.isArray(connections)||connections.length!==lines.length) fail('missing network connections');
  const treeDegree=Array(nodes.length).fill(0), allDegree=Array(nodes.length).fill(0);
  const tree=connections.filter(c=>c.kind==='tree');
  if(tree.length!==nodes.length-1||connections.filter(c=>c.kind==='loop').length>SETTINGS.maxLoopConnections
    ||['start','safe'].some(kind=>connections.filter(c=>c.kind===kind).length!==1)) fail('network topology');
  for(const [i,c] of connections.entries()) {
    if(!['tree','loop','start','safe'].includes(c.kind)||!validPoint(c.from)||!validPoint(c.to)
      ||c.directSteps!==Math.abs(c.from.x-c.to.x)+Math.abs(c.from.z-c.to.z)
      ||!Number.isInteger(c.rasterSteps)||c.rasterSteps!==lines[i].length-1
      ||c.rasterSteps<c.directSteps||c.rasterSteps>c.directSteps*1.8
      ||!Number.isFinite(c.nearbyFraction)||c.nearbyFraction<0||c.nearbyFraction>(c.kind==='loop'?0.2:0.35)) fail('connection geometry');
    if(JSON.stringify(lines[i][0])!==JSON.stringify(c.from)||JSON.stringify(lines[i].at(-1))!==JSON.stringify(c.to)) fail('connection trace endpoints');
    if(c.kind==='tree'||c.kind==='loop') {
      if(!Number.isInteger(c.fromNode)||!Number.isInteger(c.toNode)||c.fromNode===c.toNode
        ||JSON.stringify(nodes[c.fromNode])!==JSON.stringify(c.from)||JSON.stringify(nodes[c.toNode])!==JSON.stringify(c.to)) fail('connection node references');
      allDegree[c.fromNode]++;allDegree[c.toNode]++;
      if(c.kind==='tree'){treeDegree[c.fromNode]++;treeDegree[c.toNode]++;}
      if(c.kind==='loop'&&(!Number.isFinite(c.previousRouteLength)
        ||c.previousRouteLength<=Math.hypot(c.from.x-c.to.x,c.from.z-c.to.z)*1.5)) fail('unhelpful loop');
    }
  }
  if(Math.max(...treeDegree)!==3||Math.max(...allDegree)>4) fail('branching/degree limits');
  const reached=new Set([0]);
  for(let pass=0;pass<nodes.length;pass++) for(const c of tree) {
    if(reached.has(c.fromNode)) reached.add(c.toNode);
    if(reached.has(c.toNode)) reached.add(c.fromNode);
  }
  if(reached.size!==nodes.length) fail('disconnected forest graph');
  const carved = map.pathNetwork.trailCells;
  if (!Array.isArray(carved) || carved.some(i => !Number.isInteger(i) || !map.navigation.allowedCells[i])
    || new Set(carved).size !== carved.length) fail('invalid carved trail cells');
  if(carved.length>300) fail('excessive carved area');
  const carvedSet = new Set(carved);
  if (map.cells.some((cell, i) => cell.terrain === 'route' && !carvedSet.has(i))) fail('unintended trail widening');
  const degree = i => neighbors(map, i).length;
  const endpoints = new Set(lines.flatMap(line => [line[0], line.at(-1)])
    .map(p => p.z * map.width + p.x));
  for (let z = 0; z < map.height - 1; z += 1) for (let x = 0; x < map.width - 1; x += 1) {
    const i = z * map.width + x, square = [i, i + 1, i + map.width, i + map.width + 1];
    // A protected node at one corner may have degree two while the other three
    // corners carry junction arms. Removing an arm to erase this compact square
    // would destroy a bypass. Still prohibit extended 2x3 / 3x2 cleared bands.
    if (square.every(j => map.cells[j].terrain === 'route')) {
      if (!square.every(j => degree(j) >= 3 || endpoints.has(j))
        || square.filter(j => degree(j) >= 3).length < 3) fail('broad trail overlap');
      const route = (x, z) => map.cells[z * map.width + x]?.terrain === 'route';
      if ((x + 2 < map.width && route(x + 2, z) && route(x + 2, z + 1))
        || (z + 2 < map.height && route(x, z + 2) && route(x + 1, z + 2))) fail('broad trail band');
    }
  }
  // One reverse BFS validates every spawn together (no agent A* during generation).
  if (!isNavigable(map, goal)) fail('destination unavailable');
  const seen = new Set([goal]), queue = [goal];
  for (let head = 0; head < queue.length; head += 1) {
    for (const next of neighbors(map, queue[head])) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  if (!map.spawnCells.every((i) => seen.has(i))) fail('spawn cannot reach safety');
  if (map.navigation.allowedCells.some((allowed, i) => allowed && !seen.has(i))) fail('disconnected network');
  return map;
}
