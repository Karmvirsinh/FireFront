import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createGeneratedMap } from '../src/world/generation/createGeneratedMap.js';
import { validateGeneratedMap } from '../src/world/generation/validateGeneratedMap.js';
import { normalizeSeed, seedStream, GENERATOR_SETTINGS, GENERATOR_VERSION } from '../src/world/generation/seed.js';
import { placeEndpoints } from '../src/world/generation/placeEndpoints.js';
import { createVegetation } from '../src/world/generation/createVegetation.js';
import { createPathNetwork } from '../src/world/generation/createPathNetwork.js';
import { normalizeMap } from '../src/world/mapContract.js';
import { findPath, findBufferExit } from '../src/agents/findPath.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { createFireSimulation } from '../src/simulation/createFireSimulation.js';

const seeds = [...Array.from({ length: 1024 }, (_, i) => i), 1024, 2026, 65535, 2147483648, 4294967295];

test('forest-network-v4 seed-7 logical baseline stays stable across future rendering changes', () => {
  const { cells, start, safeZone, spawnCells, navigation, pathNetwork } = createGeneratedMap(7);
  const digest = createHash('sha256').update(JSON.stringify({ cells, start, safeZone, spawnCells, navigation, pathNetwork })).digest('hex');
  assert.equal(digest, '212ccae3584e9b325149c9eece5ed55d20a4568bbbc73038b8a2eda7694e1f31');
});
function reachable(map) {
  const goal = map.safeZone.z * map.width + map.safeZone.x, queue = [goal], seen = new Set(queue);
  for (let head = 0; head < queue.length; head += 1) {
    const i = queue[head], x = i % map.width, z = Math.floor(i / map.width);
    for (const [nx, nz] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]) {
      const next = nz * map.width + nx;
      if (nx < 0 || nz < 0 || nx >= map.width || nz >= map.height || seen.has(next)
        || !map.cells[next].walkable || !map.navigation.allowedCells[next]) continue;
      seen.add(next); queue.push(next);
    }
  }
  return seen;
}

test('decimal uint32 seeds normalize without rounding, wrapping, substitution or implicit randomness', () => {
  for (const [value, expected] of [[' 00042 ',42],[0,0],['4294967295',4294967295]]) assert.equal(normalizeSeed(value), expected);
  for (const value of ['', ' ', '-1', '+1', '1.2', '1e3', '0xff', '4294967296', NaN, Infinity, null, undefined]) {
    assert.throws(() => createGeneratedMap(value, () => assert.fail('invalid seed must not generate')), /Seed must/);
  }
});

test('1029 documented seeds satisfy complete-map, clear path, spawn capacity and independent reachability invariants', () => {
  const endpoints = new Set(), paths = new Set(), vegetation = new Set(), nodeCounts = new Set(), loopCounts = new Set(), branchCounts = new Set();
  for (const seed of seeds) {
    const map = createGeneratedMap(seed), seen = reachable(map);
    assert.equal(map.width,64); assert.equal(map.height,64); assert.equal(map.cellSize,0.5);
    assert.equal(map.cells.length,4096); assert.equal(map.spawnCells.length,20);
    assert.equal(new Set(map.spawnCells).size,20);
    assert.equal(map.generation.seed,seed); assert.equal(map.generation.version,GENERATOR_VERSION);
    assert.deepEqual(map.generation.settings,GENERATOR_SETTINGS);
    assert.ok(Math.hypot(map.start.x-map.safeZone.x,map.start.z-map.safeZone.z)>=34);
    assert.ok(map.spawnCells.every(i=>seen.has(i)));
    const zone=map.zones.start;
    assert.ok(map.spawnCells.every(i=>i%64>=zone.x0 && i%64<=zone.x1 && Math.floor(i/64)>=zone.z0 && Math.floor(i/64)<=zone.z1));
    assert.ok(Object.values(map.zones).every(b=>b.x0>=0 && b.z0>=0 && b.x1<64 && b.z1<64));
    for (const [i,cell] of map.cells.entries()) {
      if (map.navigation.allowedCells[i]) {
        assert.ok(seen.has(i)); assert.equal(cell.fuelType,'none'); assert.equal(cell.walkable,true);
        assert.ok(['route','start','safe'].includes(cell.terrain));
      }
      if (cell.fuelType==='grass') assert.equal(cell.walkable,true);
      if (['brush','forest'].includes(cell.fuelType)) assert.equal(cell.walkable,false);
      if (cell.terrain==='obstacle') assert.equal(cell.walkable,false);
    }
    assert.ok(map.cells.some((c,i)=>c.fuelType==='grass' && c.walkable && !map.navigation.allowedCells[i]));
    assert.ok(['grass','brush','forest'].every(f=>map.cells.some(c=>c.fuelType===f)));
    assert.ok(map.cells.some(c=>c.terrain==='clearing')); assert.ok(map.cells.some(c=>c.terrain==='obstacle'));
    assert.deepEqual(map.rendering.labels.map(l=>l.text),['START','SAFE']);
    assert.equal(map.pathNetwork.widthCells,1);
    assert.equal(map.cells.filter(c=>c.terrain==='start').length,20);
    assert.equal(map.cells.filter(c=>c.terrain==='safe').length,1);
    const carved = new Set(map.pathNetwork.trailCells);
    for (const [i,cell] of map.cells.entries()) if(cell.terrain==='route') assert.ok(carved.has(i),'no widening outside the single-cell raster');
    for (const line of map.pathNetwork.centerlines) for (let i=0;i<line.length;i++) {
      const p=line[i];assert.equal(map.navigation.allowedCells[p.z*64+p.x],true);
      if(i) assert.equal(Math.abs(p.x-line[i-1].x)+Math.abs(p.z-line[i-1].z),1,'connected clean raster trace');
    }
    // No broad 2x3/3x2 bands. Any retained 2x2 is a genuine compact junction.
    const route=(x,z)=>x>=0 && x<64 && z>=0 && z<64 && map.cells[z*64+x].terrain==='route';
    for(let z=0;z<63;z++) for(let x=0;x<63;x++) {
      if(![[0,0],[1,0],[0,1],[1,1]].every(([dx,dz])=>route(x+dx,z+dz))) continue;
      for(const [dx,dz] of [[0,0],[1,0],[0,1],[1,1]]) assert.ok(
        [[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>map.navigation.allowedCells[(z+dz+b)*64+x+dx+a]).length>=3);
      assert.ok(!route(x+2,z)||!route(x+2,z+1));
      assert.ok(!route(x,z+2)||!route(x+1,z+2));
    }
    endpoints.add(JSON.stringify([map.start,map.safeZone])); paths.add(JSON.stringify(map.pathNetwork));
    vegetation.add(map.cells.map(c=>c.fuelType[0]).join(''));
    nodeCounts.add(map.pathNetwork.nodes.length);
    loopCounts.add(map.pathNetwork.connections.filter(c=>c.kind==='loop').length);
    branchCounts.add(map.pathNetwork.nodes.filter((_,i)=>map.pathNetwork.connections.filter(c=>c.kind==='tree'
      &&(c.fromNode===i||c.toNode===i)).length>=3).length);
    if (seed < 16 || seed === 4294967295) assert.deepEqual(createGeneratedMap(seed),map);
  }
  assert.ok(endpoints.size>240 && paths.size>250 && vegetation.size>250);
  assert.deepEqual([...nodeCounts].sort(),[6,7,8,9]);
  assert.deepEqual([...loopCounts].sort(),[0,1,2]);
  assert.ok(branchCounts.size>=2,'branch count varies across seeds');
});

test('component streams isolate paths/endpoints from vegetation random consumption', () => {
  const seed=42, map=createGeneratedMap(seed), random=seedStream(seed,'vegetation');
  for(let i=0;i<1000;i++) random();
  const endpoints=placeEndpoints(GENERATOR_SETTINGS,seedStream(seed,'endpoints'));
  const network=createPathNetwork(endpoints,GENERATOR_SETTINGS,seedStream(seed,'paths',map.generation.attempt));
  assert.deepEqual(endpoints.start,map.start);
  assert.deepEqual(network.centerlines,map.pathNetwork.centerlines);
  assert.notDeepEqual(seedStream(seed,'paths')(),seedStream(seed,'rocks')());
});

test('node placement has bounded work even when the random stream repeats one location forever', () => {
  let calls=0;
  assert.throws(()=>createPathNetwork({start:{x:10,z:32},safeZone:{x:54,z:32}},GENERATOR_SETTINGS,
    ()=>{calls++;return 0;}),/forest nodes/);
  assert.equal(calls,1201,'one node-count draw and at most 600 coordinate attempts');
});

test('bounded retries are deterministic, validate before return and report exhaustion', () => {
  const attempts=[];
  const map=createGeneratedMap(7,(seed,attempt)=>{
    attempts.push([seed,attempt]);
    if(attempt<2) throw new Error('controlled candidate failure');
    const candidate=createGeneratedMap(seed);candidate.generation.attempt=attempt;return candidate;
  });
  assert.equal(map.generation.attempt,2);assert.deepEqual(attempts,[[7,0],[7,1],[7,2]]);
  let calls=0;
  assert.throws(()=>createGeneratedMap(7,()=>{calls++;return {}; }),/after 4 attempts/); assert.equal(calls,4);
  const invalid=createGeneratedMap(42);
  const index=invalid.cells.findIndex(c=>c.terrain==='route');invalid.cells[index].fuelType='grass';
  assert.throws(()=>validateGeneratedMap(invalid),/fuel\/obstacle/);
  const disconnected=createGeneratedMap(42);
  for(const i of disconnected.spawnCells) disconnected.navigation.allowedCells[i]=false;
  assert.throws(()=>validateGeneratedMap(disconnected),/navigation policy/);
  const pinched=createGeneratedMap(42), p=pinched.pathNetwork.centerlines[0][5], i=p.z*64+p.x;
  pinched.cells[i]={terrain:'clearing',fuelType:'none',walkable:true};pinched.navigation.allowedCells[i]=false;
  assert.throws(()=>validateGeneratedMap(pinched),/path width pinch/);
});

test('Path-first policy forbids a physical grass shortcut and buffer escape; cooling preserves both layers', () => {
  const map=normalizeMap({width:3,height:2,cellSize:.5,start:{x:0,z:0},safeZone:{x:2,z:0},spawnCells:[0],
    cells:Array.from({length:6},(_,i)=>({terrain:i===1?'vegetation':'route',fuelType:i===1?'grass':'none',walkable:true})),
    navigation:{mode:'path-first',allowedCells:[true,false,true,true,true,true]}});
  const unsafe=new Uint8Array(6), direct=new Uint8Array(6);
  assert.deepEqual(findPath(map,0,2,unsafe),[0,3,4,5,2]);
  unsafe[0]=1;assert.deepEqual(findBufferExit(map,0,unsafe,direct),[0,3]);
  assert.equal(findPath(map,1,2,new Uint8Array(6)),null);
  const fire=createFireSimulation(map);fire.select(1);fire.start();
  for(let i=0;i<401;i++) fire.advance(.05);
  assert.equal(fire.cells[1].state,'burned-cool');assert.equal(map.cells[1].walkable,true);
  assert.equal(map.navigation.allowedCells[1],false);
  const bad=structuredClone(map);bad.navigation.allowedCells[1]='yes';assert.throws(()=>normalizeMap(bad),/mask/);
});

test('fire and A* integrate on multiple generated maps, conserve counts and reset/replay across ordinary render intervals', () => {
  for(const seed of [0,7,42]) {
    const map=createGeneratedMap(seed), original=structuredClone(map), simulation=createEvacuationSimulation(map);
    const ignition=map.cells.findIndex((c,i)=>c.fuelType!=='none' && [i-1,i+1,i-64,i+64].some(j=>map.navigation.allowedCells[j]));
    function run(fps) {
      assert.equal(simulation.select(ignition),true);assert.equal(simulation.start(),true);
      for(let i=0;i<fps*10;i++) {
        simulation.advance(1/fps);
        if(i%fps===0) {
          assert.equal(Object.values(simulation.agents.counts()).reduce((a,b)=>a+b,0),20);
          assert.ok(simulation.agents.agents.every(a=>map.navigation.allowedCells[a.cell]));
        }
      }
      return structuredClone({cells:simulation.cells,agents:simulation.agents.agents,time:simulation.time});
    }
    const first=run(30);assert.ok(simulation.cells.filter(c=>c.state!=='unburned').length>1);
    simulation.reset();assert.equal(simulation.selected,null);assert.equal(simulation.agents.counts().waiting,20);assert.equal(simulation.time,0);
    assert.deepEqual(run(60),first);assert.deepEqual(map,original);
  }
});


test('representative one-cell trails preserve a valid initial A* path for each of twenty distinct spawns', () => {
  for (const seed of [0,7,2026]) {
    const map=createGeneratedMap(seed), goal=map.safeZone.z*64+map.safeZone.x;
    for(const spawn of map.spawnCells) {
      const path=findPath(map,spawn,goal,new Uint8Array(4096));
      assert.ok(path && path[0]===spawn && path.at(-1)===goal);
      assert.ok(path.every(i=>map.navigation.allowedCells[i] && map.cells[i].walkable));
    }
  }
});

test('seed-7 network vegetation closes a nonfuel trail; buffers trap without killing and agents later recover', () => {
  const map=createGeneratedMap(7), simulation=createEvacuationSimulation(map);
  const ignition=34*64+40, trail=33*64+40, goal=map.safeZone.z*64+map.safeZone.x;
  assert.ok(findPath(map,map.spawnCells[0],goal,simulation.hazards));
  assert.equal(map.cells[trail].terrain,'route');assert.equal(map.cells[trail].fuelType,'none');
  simulation.select(ignition);simulation.start();
  assert.equal(simulation.cells[ignition].state,'burning');assert.equal(simulation.cells[trail].state,'unburned');
  assert.equal(simulation.hazards[trail],1);assert.equal(findPath(map,map.spawnCells[0],goal,simulation.hazards),null);
  assert.equal(simulation.agents.counts().trapped,20);assert.equal(simulation.agents.counts().lost,0);
  let recovered=false;
  for(let step=0;step<4000 && simulation.agents.counts().evacuated<20;step++) {
    simulation.advance(.05);
    const counts=simulation.agents.counts();
    if(counts.evacuating>0) recovered=true;
    assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),20);assert.equal(counts.lost,0);
    assert.equal(simulation.cells[trail].state,'unburned','bare trail never burns; closure is navigation only');
  }
  assert.equal(recovered,true);assert.equal(simulation.agents.counts().evacuated,20);
  assert.ok(Math.abs(simulation.time-88.9)<1e-7);
  simulation.reset();assert.equal(simulation.agents.counts().waiting,20);assert.equal(simulation.hazards[trail],0);
});


test('forest graph branches before endpoints attach; optional loops are useful and sparse', () => {
  let loops=0;
  for(const seed of seeds) {
    const map=createGeneratedMap(seed), {nodes,connections,trailCells}=map.pathNetwork;
    assert.ok(trailCells.length<=300);
    const tree=connections.filter(c=>c.kind==='tree');
    assert.equal(tree.length,nodes.length-1);
    const reached=new Set([0]);
    for(let pass=0;pass<nodes.length;pass++) for(const c of tree) {
      if(reached.has(c.fromNode)) reached.add(c.toNode);
      if(reached.has(c.toNode)) reached.add(c.fromNode);
    }
    assert.equal(reached.size,nodes.length);
    const degree=nodes.map((_,i)=>tree.filter(c=>c.fromNode===i||c.toNode===i).length);
    assert.equal(Math.max(...degree),3,'ordinary forest tree already branches without START/SAFE');
    for(let i=0;i<nodes.length;i++) {
      assert.equal(map.cells[nodes[i].z*64+nodes[i].x].terrain,'route','node is not a large clearing');
      for(let j=0;j<i;j++) assert.ok(Math.hypot(nodes[i].x-nodes[j].x,nodes[i].z-nodes[j].z)>=11);
    }
    assert.deepEqual(connections.slice(-2).map(c=>c.kind),['start','safe']);
    assert.deepEqual(connections.at(-2).from,map.start);assert.deepEqual(connections.at(-1).from,map.safeZone);
    for(const c of connections) {
      assert.equal(c.directSteps,Math.abs(c.from.x-c.to.x)+Math.abs(c.from.z-c.to.z));
      assert.ok(c.rasterSteps<=c.directSteps*1.8);
      assert.ok(c.nearbyFraction<=(c.kind==='loop'?0.2:0.35));
      if(c.kind==='loop') {
        loops++;const chord=Math.hypot(c.from.x-c.to.x,c.from.z-c.to.z);
        assert.ok(c.previousRouteLength>chord*1.5&&c.previousRouteLength-chord>10);
      }
    }
  }
  assert.ok(loops>50,'loops remain occasional additions rather than mandatory shapes');
});

test('path-only retries and new carving preserve endpoint and underlying vegetation streams', () => {
  for(const seed of [0,7,2026,91,512]) {
    const map=createGeneratedMap(seed), endpoints=placeEndpoints(GENERATOR_SETTINGS,seedStream(seed,'endpoints'));
    assert.deepEqual(map.start,endpoints.start);assert.deepEqual(map.safeZone,endpoints.safeZone);
    const original=createVegetation(GENERATOR_SETTINGS,seedStream(seed,'vegetation'),seedStream(seed,'rocks'));
    for(const [i,cell] of map.cells.entries()) if(!map.navigation.allowedCells[i]) assert.deepEqual(cell,original[i]);
    assert.deepEqual(createGeneratedMap(seed),map);
  }
  assert.ok(createGeneratedMap(0).generation.attempt>0,'fixture actually exercises a path retry');
});
