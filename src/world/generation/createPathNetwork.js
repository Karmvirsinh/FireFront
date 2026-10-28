// Build an ordinary forest graph first; endpoints attach only after it exists.
export function createPathNetwork({ start, safeZone }, settings, random) {
  const euclidean = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
  const index = p => p.z * settings.width + p.x;
  const count = settings.nodeMin + Math.floor(random() * (settings.nodeMax - settings.nodeMin + 1));
  const nodes = [];
  // Bounded rejection sampling: no grid template and no vegetation randomness consumed.
  for (let attempt = 0; nodes.length < count && attempt < 600; attempt++) {
    const p = { x: 8 + Math.floor(random() * (settings.width - 16)),
      z: 8 + Math.floor(random() * (settings.height - 16)) };
    if ([start, safeZone].every(q => euclidean(p, q) >= 7)
      && nodes.every(q => euclidean(p, q) >= settings.nodeSpacing)) nodes.push(p);
  }
  if (nodes.length !== count || ['x', 'z'].some(axis =>
    Math.max(...nodes.map(p => p[axis])) - Math.min(...nodes.map(p => p[axis])) < 28)) {
    throw new Error('Could not place well-spaced forest nodes.');
  }
  const pairs = [];
  for (let a = 0; a < count; a++) for (let b = a + 1; b < count; b++) {
    pairs.push({ a, b, length: euclidean(nodes[a], nodes[b]) });
  }
  pairs.sort((a, b) => a.length - b.length || a.a - b.a || a.b - b.b);
  const turn = (a, b, c) => (b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
  const crosses = (edge, other) => {
    if ([edge.a, edge.b].some(i => i === other.a || i === other.b)) return false;
    const [a,b,c,d] = [nodes[edge.a],nodes[edge.b],nodes[other.a],nodes[other.b]];
    return turn(a,b,c)*turn(a,b,d) < 0 && turn(c,d,a)*turn(c,d,b) < 0;
  };
  const degree = Array(count).fill(0), parent = Array.from({length:count}, (_,i)=>i), tree = [];
  const root = i => { while (parent[i] !== i) i = parent[i]; return i; };
  for (const edge of pairs) {
    const ra = root(edge.a), rb = root(edge.b);
    if (ra === rb || degree[edge.a] >= 3 || degree[edge.b] >= 3
      || edge.length > 38 || tree.some(other => crosses(edge, other))) continue;
    tree.push(edge); parent[ra] = rb; degree[edge.a]++; degree[edge.b]++;
    if (tree.length === count - 1) break;
  }
  if (tree.length !== count - 1) throw new Error('Forest nodes need a nearby connected tree.');
  function graphPath(a, b, edges) {
    const open=[a], costs=Array(count).fill(Infinity), paths=Array(count).fill(null), done=new Set();
    costs[a]=0;paths[a]=[];
    while(open.length) {
      open.sort((i,j)=>costs[i]-costs[j]||i-j);
      const current=open.shift();
      if(done.has(current)) continue;
      if(current===b) return paths[current];
      done.add(current);
      for(const e of edges) {
        const next=e.a===current?e.b:e.b===current?e.a:null;
        if(next!==null&&costs[current]+e.length<costs[next]) {
          costs[next]=costs[current]+e.length;paths[next]=[...paths[current],e];open.push(next);
        }
      }
    }
    return null;
  }
  // A minimum tree can happen to be a chain. A short edge swap creates a branch
  // without prescribing its shape or the number/location of later junctions.
  if (Math.max(...degree) < 3) {
    let swap = null;
    for (const edge of pairs.filter(e => !tree.includes(e) && e.length <= 30)) {
      for (const pivot of [edge.a, edge.b]) {
        if (degree[pivot] !== 2) continue;
        for (const removed of graphPath(edge.a, edge.b, tree)) {
          if (removed.a === pivot || removed.b === pivot || edge.length > removed.length + 8
            || tree.some(other => other !== removed && crosses(edge, other))) continue;
          if (!swap || edge.length-removed.length < swap.cost) swap={edge,removed,cost:edge.length-removed.length};
        }
      }
    }
    if (!swap) throw new Error('No readable branching connection for these nodes.');
    tree.splice(tree.indexOf(swap.removed),1,swap.edge);
    for(const e of tree) { degree[e.a]=0;degree[e.b]=0; }
    for(const e of tree) { degree[e.a]++;degree[e.b]++; }
  }
  const cells = new Set(), centerlines = [], connections = [];
  function rasterize(a, b, bend) {
    const length=euclidean(a,b), line=[{...a}];
    if (!length) return line;
    const control={x:(a.x+b.x)/2-(b.z-a.z)/length*bend,
      z:(a.z+b.z)/2+(b.x-a.x)/length*bend};
    const steps=Math.ceil(length*4);
    for(let j=1;j<=steps;j++) {
      const t=j/steps,u=1-t;
      const x=Math.round(u*u*a.x+2*u*t*control.x+t*t*b.x);
      const z=Math.round(u*u*a.z+2*u*t*control.z+t*t*b.z);
      let p={...line.at(-1)};
      while(p.x!==x||p.z!==z) {
        if(Math.abs(x-p.x)>=Math.abs(z-p.z)) p.x+=Math.sign(x-p.x);
        else p.z+=Math.sign(z-p.z);
        line.push({...p});
      }
    }
    return line;
  }
  function candidate(a,b,kind) {
    const bend=(random()*2-1)*Math.min(5,euclidean(a,b)*0.22);
    for(const offset of [bend,-bend*0.5,0]) {
      const line=rasterize(a,b,offset), directSteps=manhattan(a,b);
      if(line.length-1>directSteps*1.8) continue;
      const interior=line.filter(p=>manhattan(p,a)>4&&manhattan(p,b)>4);
      if(interior.some(p=>cells.has(index(p)))) continue;
      const existing=[...cells].map(i=>({x:i%settings.width,z:Math.floor(i/settings.width)}));
      const nearby=interior.filter(p=>existing.some(q=>manhattan(p,q)<=2)).length;
      const nearbyFraction=interior.length?nearby/interior.length:0;
      if(nearbyFraction>(kind==='loop'?0.2:0.35)) continue;
      return { line, directSteps, rasterSteps:line.length-1, nearbyFraction };
    }
    return null;
  }
  function install(a,b,kind,geometry,extra={}) {
    for(const p of geometry.line) cells.add(index(p));
    centerlines.push(geometry.line);
    const {line,...metrics}=geometry;
    connections.push({kind,from:{...a},to:{...b},...metrics,...extra});
  }
  for(const edge of tree) {
    const a=nodes[edge.a],b=nodes[edge.b],geometry=candidate(a,b,'tree');
    if(!geometry) throw new Error('Tree connection would cross or closely parallel a trail.');
    install(a,b,'tree',geometry,{fromNode:edge.a,toNode:edge.b});
  }
  const edges=[...tree];
  for(let opportunity=0;opportunity<settings.maxLoopConnections;opportunity++) {
    if(random()>=settings.loopProbability) continue;
    const eligible=pairs.filter(e=>!edges.includes(e)&&e.length<=27&&degree[e.a]<4&&degree[e.b]<4
      && !edges.some(other=>crosses(e,other)))
      .map(e=>({edge:e,route:graphPath(e.a,e.b,edges).reduce((sum,p)=>sum+p.length,0),tie:random()}))
      .filter(c=>c.route>c.edge.length*1.5&&c.route-c.edge.length>10)
      .sort((a,b)=>a.edge.length*(1+a.tie*.25)-b.edge.length*(1+b.tie*.25));
    for(const {edge,route} of eligible) {
      const a=nodes[edge.a],b=nodes[edge.b],geometry=candidate(a,b,'loop');
      if(!geometry) continue;
      install(a,b,'loop',geometry,{fromNode:edge.a,toNode:edge.b,previousRouteLength:route});
      edges.push(edge);degree[edge.a]++;degree[edge.b]++;break;
    }
  }
  // Attach each endpoint to the already-built network, usually at an edge junction.
  for(const [kind,point] of [['start',start],['safe',safeZone]]) {
    const targets=[...cells].map(i=>({x:i%settings.width,z:Math.floor(i/settings.width)}))
      .sort((a,b)=>euclidean(point,a)-euclidean(point,b)||a.z-b.z||a.x-b.x);
    let attached=false;
    for(const target of targets.slice(0,16)) {
      const geometry=candidate(point,target,kind);
      if(!geometry) continue;
      install(point,target,kind,geometry);attached=true;break;
    }
    if(!attached) throw new Error('Endpoint cannot attach cleanly to forest network.');
  }
  if(cells.size>300) throw new Error('Trail network exceeds the sparse carving budget.');
  // Rounded oversampling and overlapping curves can form redundant 2x2 blocks.
  // Reconnect every incident arm inside the removed cell's 3x3 neighborhood.
  // Whole-network connectivity alone can substitute a distant detour and erase
  // a useful loop. Preserve curve endpoints (including branch tips) as well.
  const protectedCells = new Set(centerlines.flatMap(line => [line[0], line.at(-1)])
    .map(p => p.z * settings.width + p.x));
  const adjacent = (i) => [i - settings.width, i + 1, i + settings.width, i - 1]
    .filter(j => cells.has(j) && Math.abs(j % settings.width - i % settings.width)
      + Math.abs(Math.floor(j / settings.width) - Math.floor(i / settings.width)) === 1);
  function route(from, to) {
    const queue = [from], parent = new Map([[from, null]]);
    for (let head = 0; head < queue.length; head += 1) {
      const i = queue[head];
      if (i === to) {
        const path = [to];
        while (parent.get(path[0]) !== null) path.unshift(parent.get(path[0]));
        return path;
      }
      for (const j of adjacent(i)) if (!parent.has(j)) { parent.set(j, i); queue.push(j); }
    }
    return null;
  }
  function locallyConnectedWithout(i) {
    const arms = adjacent(i), x = i % settings.width, z = Math.floor(i / settings.width);
    cells.delete(i);
    const queue = [arms[0]], seen = new Set(queue);
    for (let head = 0; head < queue.length; head += 1) {
      for (const j of adjacent(queue[head])) {
        if (!seen.has(j) && Math.abs(j % settings.width - x) <= 1
          && Math.abs(Math.floor(j / settings.width) - z) <= 1) {
          seen.add(j); queue.push(j);
        }
      }
    }
    const connected = arms.every(j => seen.has(j));
    cells.add(i);
    return connected;
  }
  let changed;
  do {
    changed = false;
    for (let z = 0; z < settings.height - 1; z += 1) for (let x = 0; x < settings.width - 1; x += 1) {
      const i = z * settings.width + x;
      const square = [i, i + 1, i + settings.width, i + settings.width + 1];
      if (!square.every(j => cells.has(j))) continue;
      const removable = square.find(j => !protectedCells.has(j) && locallyConnectedWithout(j));
      if (removable !== undefined) { cells.delete(removable); changed = true; }
    }
  } while (changed); // Strictly decreasing cell count, bounded by the grid size.
  // Reconnect traces through the retained network after a redundant corner is removed.
  const cleanLines = centerlines.map(line => {
    const kept = line.map(p => p.z * settings.width + p.x).filter(i => cells.has(i));
    const trace = [kept[0]];
    for (const i of kept.slice(1)) {
      const last = trace.at(-1);
      if (i !== last) trace.push(...route(last, i).slice(1));
    }
    // Thinning can redirect a trace around an already visited corner. Erase those
    // retraced loops from metadata; trailCells still describes the exact full network.
    const simple = [], positions = new Map();
    for (const i of trace) {
      if (positions.has(i)) while (simple.length > positions.get(i) + 1) positions.delete(simple.pop());
      else { positions.set(i, simple.length); simple.push(i); }
    }
    return simple.map(i => ({ x: i % settings.width, z: Math.floor(i / settings.width) }));
  });
  // Geometry metrics describe the retained traces, not their pre-thinning raster.
  const cleanConnections = connections.map((connection, i) => ({ ...connection,
    rasterSteps: cleanLines[i].length - 1 }));
  return { cells, centerlines: cleanLines, connections: cleanConnections, nodes };

}
