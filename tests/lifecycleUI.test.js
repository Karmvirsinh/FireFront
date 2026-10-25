import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycleUI } from '../src/ui/createLifecycleUI.js';

// Lightweight DOM adapter: tests ownership/actions, not native browser modality.
class Element extends EventTarget {
  constructor(doc, section=null) {
    super();this.doc=doc;this.section=section;this.dataset={};this.hidden=false;this.disabled=false;
    this.isConnected=true;this.style={removeProperty(){}};this.attributes={};this.handlers=new Set();
  }
  addEventListener(type,fn,options){super.addEventListener(type,fn,options);this.handlers.add(fn);}
  removeEventListener(type,fn,options){super.removeEventListener(type,fn,options);this.handlers.delete(fn);}
  setAttribute(k,v){this.attributes[k]=v;} removeAttribute(k){delete this.attributes[k];}
  focus(){if(!this.disabled)this.doc.activeElement=this;}
  click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}
  showModal(){this.open=true;this.shows=(this.shows??0)+1;} close(){this.open=false;}
  remove(){this.isConnected=false;}
  contains(target){return target===this||this.nodes?.includes(target);}
  closest(){return this.section?.hidden?this.section:null;}
  scrollIntoView(){this.scrolled=true;}
  getBoundingClientRect(){return {left:20,top:100,bottom:160,width:300,height:190};}
  set innerHTML(value){
    this.sections=[...value.matchAll(/data-screen="(\w+)"/g)].map(m=>Object.assign(new Element(this.doc),{dataset:{screen:m[1]}}));
    this.actions={};this.ids={};
    for(const [i,part] of value.split('<section ').slice(1).entries()) {
      const section=this.sections[i];
      for(const m of part.matchAll(/data-action="(\w+)"/g))this.actions[m[1]]=new Element(this.doc,section);
      for(const m of part.matchAll(/id="([\w-]+)"/g))this.ids[m[1]]=new Element(this.doc,section);
    }
    this.nodes=[...this.sections,...Object.values(this.actions),...Object.values(this.ids)];
  }
  querySelector(selector){return selector.startsWith('#')?this.ids[selector.slice(1)]:this.actions[selector.match(/"(\w+)"/)[1]];}
  querySelectorAll(selector){return selector==='button'?Object.values(this.actions):this.sections;}
}
function fixture({benchmark=false}={}) {
  const doc=new EventTarget();doc.created=[];const nodes=new Map();
  doc.createElement=()=>{const e=new Element(doc);doc.created.push(e);return e;};
  doc.body={append(){}};doc.querySelector=s=>{if(!nodes.has(s))nodes.set(s,new Element(doc));return nodes.get(s);};
  const host=new EventTarget();host.innerWidth=700;host.innerHeight=650;
  let map={generation:{seed:7}}, camera={same:true};
  const simulation={started:false,outcome:null,stalledAfterFire:false,agents:{awareness:'local'}};
  const app={current:{map,simulation,camera},replaceMap(candidate,{awareness}){
    simulation.started=false;simulation.outcome=null;simulation.agents.awareness=awareness;
    this.current={map:candidate,simulation,camera};
  }};
  let resets=0;
  doc.querySelector('#reset-simulation').addEventListener('click',()=>{resets++;simulation.started=false;simulation.outcome=null;});
  const ui=createLifecycleUI({application:app,doc,host,benchmark,randomSeed:()=>123,generator:seed=>({generation:{seed}})});
  const dialog=doc.created[0],a=dialog.actions;
  const outcome=()=>Object.freeze({kind:'terminal',time:63.65,remaining:0,seed:7,awareness:'local',counts:{evacuated:20,lost:0}});
  return {doc,host,app,simulation,ui,dialog,a,outcome,resets:()=>resets};
}
function key(target,key,shiftKey=false){const e=new Event('keydown',{cancelable:true});Object.assign(e,{key,shiftKey});target.dispatchEvent(e);return e;}

test('entry once; tour Back/Next/Skip/Finish and setup-only Help; entry is not replayed on reset/regeneration',()=>{
  const f=fixture();assert.equal(f.dialog.dataset.screen,'entry');
  f.a.begin.click();assert.equal(f.dialog.dataset.screen,'tour');assert.equal(f.a.back.disabled,true);
  f.a.next.click();assert.equal(f.dialog.ids['tour-title'].textContent,'Environment');
  f.a.back.click();assert.equal(f.dialog.ids['tour-title'].textContent,'Camera controls');
  f.a.skip.click();assert.equal(f.dialog.open,false);
  f.doc.querySelector('#help-tour').click();for(let i=0;i<5;i++)f.a.next.click();
  assert.equal(f.a.next.textContent,'Finish');f.a.next.click();assert.equal(f.dialog.open,false);
  f.simulation.started=true;f.ui.refresh();assert.equal(f.doc.querySelector('#help-tour').disabled,true);
  f.doc.querySelector('#reset-simulation').click();f.ui.refresh();assert.equal(f.dialog.open,false);
  assert.equal(f.doc.querySelector('#help-tour').disabled,false);f.ui.dispose();
});

test('one popup per run, frozen rendered snapshot, Inspect/View results, replay and new scenario',()=>{
  const f=fixture();f.a.begin.click();f.a.skip.click();
  f.simulation.started=true;f.simulation.outcome=f.outcome();f.ui.refresh();
  assert.equal(f.dialog.dataset.screen,'results');assert.equal(f.dialog.ids['result-time'].textContent,'63.65 s');
  const shows=f.dialog.shows;f.a.inspect.click();f.ui.refresh();assert.equal(f.dialog.open,false);
  assert.equal(f.doc.activeElement,f.doc.querySelector('#view-results'),'disabled start/help fallback has usable focus');
  assert.equal(f.dialog.shows,shows);f.doc.querySelector('#view-results').click();assert.equal(f.dialog.open,true);
  f.a.replay.click();assert.equal(f.resets(),1);assert.equal(f.dialog.open,false);assert.equal(f.app.current.map.generation.seed,7);
  assert.equal(f.doc.querySelector('#view-results').hidden,true);
  f.simulation.started=true;f.simulation.outcome=f.outcome();f.ui.refresh();assert.equal(f.dialog.open,true);
  const camera=f.app.current.camera;f.a.new.click();assert.equal(f.app.current.map.generation.seed,123);
  assert.equal(f.simulation.agents.awareness,'local');assert.equal(f.app.current.camera,camera);
  assert.equal(f.doc.querySelector('#seed-input').value,'123');assert.equal(f.dialog.open,false);f.ui.dispose();
});

test('keyboard trap/cancel, tour scroll positioning, blocked background keys, benchmark bypass and full listener disposal',()=>{
  const f=fixture();let cancel=new Event('cancel',{cancelable:true});f.dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented,true);assert.equal(f.dialog.open,true,'entry requires Begin');
  assert.equal(key(f.host,'i').defaultPrevented,true);
  f.a.begin.click();assert.equal(f.doc.querySelector('.camera-hints').scrolled,true);
  f.a.skip.focus();assert.equal(key(f.dialog,'Tab').defaultPrevented,true);assert.equal(f.doc.activeElement,f.a.next);
  key(f.dialog,'Tab',true);assert.equal(f.doc.activeElement,f.a.skip);
  f.dialog.dispatchEvent(new Event('cancel',{cancelable:true}));assert.equal(f.dialog.open,false);
  f.ui.dispose();assert.equal(f.dialog.handlers.size,0);assert.equal(key(f.host,'i').defaultPrevented,false);
  assert.ok(f.doc.created.every(e=>!e.isConnected));
  const b=fixture({benchmark:true});assert.ok(!b.dialog.open);assert.equal(b.doc.querySelector('#help-tour').disabled,true);b.ui.dispose();
});
