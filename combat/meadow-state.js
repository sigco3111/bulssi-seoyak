import {notice} from './exploration.js';

export function applyMeadowState(map,state){
 if(map.region.id!=='meadow')return false;
 map.shortcutOpen=state.objects.includes('seal-1');
 if(map.shortcutOpen)for(const k of map.shortcutCells){map.tiles[k]=1;map.road[k]=1;}
 return map.shortcutOpen;
}

export function meadowQuestLine(arena){
 const p=arena.profileData;
 if(arena.region.id==='camp')return p.completed.includes('meadow')&&!p.quests.meadowReported?'들판의 길이 열렸습니다. 로웬에게 수문과 사냥꾼의 흔적을 보고하세요.':null;
 if(arena.region.id!=='meadow')return null;
 if(arena.zoneState.boss)return '들판의 위협이 사라졌습니다. 야영지의 로웬에게 돌아가 보고하세요.';
 if(!arena.zoneState.objects.includes('seal-0'))return '버려진 사냥꾼 야영지에서 실종자의 흔적을 조사하세요.';
 if(!arena.zoneState.objects.includes('seal-1'))return '동쪽 수문 제어 장치를 작동하세요. 물이 빠지면 들판을 가로지르는 샛길이 열립니다.';
 return '수문이 열리고 돌길이 드러났습니다. 북쪽 공터의 굶주린 우두머리를 쓰러뜨리세요.';
}

export function completeMeadowEvent(arena,id){
 if(arena.region.id!=='meadow')return;
 if(id==='seal-0'){
  notice(arena,'비어 있는 사냥꾼 야영지','젖은 지도에 수문이 표시되어 있습니다. 짐을 버린 이들은 북쪽 공터로 끌려간 듯합니다.');
 }else if(id==='seal-1'){
  applyMeadowState(arena.map,arena.zoneState);
  arena.path=[];arena.pathGoal=null;
  for(const m of arena.monsters){m.path=[];m.nextPath=0;}
  arena.rebuildWorldArt();
  notice(arena,'수문이 열렸습니다','물이 빠지고 들판을 가로지르는 돌길이 드러났습니다. 물레가 다시 움직입니다.');
 }
 if(id==='seal-0'||id==='seal-1')arena.nextDiscoveryAt=arena.time+5;
}
