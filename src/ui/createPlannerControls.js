export function createPlannerControls(panel,simulation,onChange,{lockedToAstar=false}={}){
 const select=panel.querySelector('#planner-mode'),note=panel.querySelector('#planner-note');
 // Small embedding/test hosts may omit the optional setup UI.
 if(!select)return {refresh(){},dispose(){}};
 function refresh(){select.value=simulation.agents.planner;select.disabled=lockedToAstar||simulation.started;
  if(note)note.textContent=lockedToAstar?'Fixed benchmark: A*.':'Same graph and costs; route to the nearest reachable known-safe destination.';}
 function change(){if(!select.disabled&&!simulation.started&&simulation.setPlanner(select.value))onChange();refresh();}
 select.addEventListener('change',change);refresh();
 return {refresh,dispose(){select.removeEventListener('change',change);}};
}
