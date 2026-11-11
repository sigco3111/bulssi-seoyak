import {REGIONS} from './maps.js';
import {CHAPTERS,EXPANSION,chapterFor} from './expansion-data.js';
import {rollItem,requiredXp} from './progression.js';

const num=(v,max=1e7)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function journey(profile){return profile.journey??={memories:Array(7).fill(0),kills:Array(7).fill(0),echoes:[],claims:[],crafted:[]};}
export function sanitizeJourney(source,target,cleanState){
 const j=source.journey||{},validEchoes=CHAPTERS.flatMap(c=>EXPANSION.echoRules.map(r=>c.id+'-'+r.id));
 target.journey={memories:CHAPTERS.map((_,i)=>num(j.memories?.[i],9999)),kills:CHAPTERS.map((_,i)=>num(j.kills?.[i])),echoes:[...new Set((Array.isArray(j.echoes)?j.echoes:[]).filter(id=>validEchoes.includes(id)))],claims:[...new Set((Array.isArray(j.claims)?j.claims:[]).filter(id=>typeof id==='string'&&id.length<100))].slice(0,300),crafted:[...new Set((Array.isArray(j.crafted)?j.crafted:[]).filter(id=>EXPANSION.recipes.some(r=>r.item===id)))].slice(0,105)};
 const run=source.expedition,chapter=CHAPTERS.find(c=>c.id===run?.chapter),rule=EXPANSION.echoRules.find(r=>r.id===run?.rule);
 target.expeditions={};for(const [id,archived]of Object.entries(source.expeditions||{})){const c=CHAPTERS.find(c=>c.id===archived?.chapter),r=EXPANSION.echoRules.find(r=>r.id===archived?.rule);if(c&&r&&id===c.id+'-'+r.id&&c.regions.includes(archived.region)&&target.completed.includes(c.final)&&archived.state)target.expeditions[id]={id,chapter:c.id,rule:r.id,region:archived.region,state:cleanState(archived.state),finished:!!archived.finished,position:cleanPosition(archived.position)};}
 target.expedition=chapter&&rule&&chapter.regions.includes(run.region)&&target.completed.includes(chapter.final)&&run.state?{id:chapter.id+'-'+rule.id,chapter:chapter.id,rule:rule.id,region:run.region,state:cleanState(run.state),finished:!!run.finished,position:cleanPosition(run.position)}:null;
}
export function firstClearXp(region){
 const targets=[0,2,5,8,11,14,18,22];
 const to=region.targetLevel||targets[region.index],from=region.index<=7?targets[region.index-1]:region.index===8?22:EXPANSION.regions.find(r=>r.index===region.index-1)?.targetLevel;
 let total=0;for(let l=from;l<to;l++)total+=requiredXp(Math.max(1,l));
 return Math.max(200,Math.round(total*.82));
}
export function echoRule(arena){const e=arena.profileData?.expedition;return e?.region===arena.region?.id?EXPANSION.echoRules.find(r=>r.id===e.rule):null;}
export const chapterAttuned=(p,c)=>!!c&&EXPANSION.echoRules.every(r=>journey(p).echoes.includes(c.id+'-'+r.id));
export function chapterUnlocked(p,c){return p.completed.includes(c.final);}
export function beginEcho(arena,chapterId,ruleId){
 const p=arena.profileData,c=CHAPTERS.find(c=>c.id===chapterId),rule=EXPANSION.echoRules.find(r=>r.id===ruleId);
 if(!c||!rule||!chapterUnlocked(p,c))return {ok:false,message:'먼저 이 장의 마지막 보스를 쓰러뜨리세요.'};
 if(arena.region.id!=='camp')return {ok:false,message:'야영지에서 잔향을 시작할 수 있습니다.'};
 const id=c.id+'-'+rule.id;
 const previous=p.expeditions?.[id];if(previous&&!previous.finished)p.expedition=previous;
 const previousLoot=previous?echoGround(previous):[];if(previous?.finished&&previousLoot.length){const missing=previousLoot.filter(d=>!p.inventory.includes(d.item));if(p.inventory.length+missing.length>150){p.expedition=previous;p.position=previous.position;arena.enterRegion(previous.region,true);arena.log('이전 잔향의 전리품을 회수한 뒤 새 도전을 시작하세요. 이전 구간 포탈도 이용할 수 있습니다.');return {ok:true};}for(const d of missing)p.inventory.push(d.item);previous.state.ground=[];for(const layer of Object.values(previous.state.layers||{}))layer.ground=[];}
 if(p.expedition?.id!==id||p.expedition.finished){
  const seed=(p.seed+c.index*19801+(EXPANSION.echoRules.indexOf(rule)+1)*77647+Math.floor(p.elapsed)*17)%2147483647;
  p.expedition={id,chapter:c.id,rule:rule.id,region:c.final,finished:false,state:{seed,defeated:[],objects:[],revealed:[],boss:false,ground:[],encounters:{},visits:0}};
 }
 if(p.expeditions)delete p.expeditions[id];p.position=p.expedition.position||null;arena.enterRegion(c.final,true);arena.log(rule.name+' · '+rule.description);return {ok:true};
}
export function rewardJourney(arena,monster){
 const p=arena.profileData,c=chapterFor(arena.region.id);if(!c)return;
 const j=journey(p);j.kills[c.index]++;
 if(!monster.boss){if(monster.elite||j.kills[c.index]%12===0)j.memories[c.index]++;return;}
 j.memories[c.index]+=3;
 const run=p.expedition;
 if(run?.region===arena.region.id){
  run.finished=true;
  if(!j.echoes.includes(run.id)){j.echoes.push(run.id);j.memories[c.index]+=8;p.ore+=8;arena.awardXp(requiredXp(p.level)*1.2);arena.gold+=600+c.index*350;arena.log('잔향 첫 완주 · 기억 8개 · 제작 재료 · 여정 경험치');}
  else{j.memories[c.index]+=2;arena.awardXp(requiredXp(p.level)*.12);arena.log('잔향 재도전 완료 · 기억과 장비 획득');}
  if(chapterAttuned(p,c)){const next=REGIONS[REGIONS.find(r=>r.id===c.final).index+1];if(next&&!p.unlocked.includes(next.id)){p.unlocked.push(next.id);arena.log('세 잔향의 기억을 모았습니다. '+next.name+'의 문이 열립니다.');}}
  return;
 }
 const claim='boss-'+arena.region.id;
 if(j.claims.includes(claim))return;
 j.claims.push(claim);arena.awardXp(Math.round(firstClearXp(arena.region)*(arena.region.strata?.5:1)));
 if(arena.region.id===c.final){j.memories[c.index]+=5;p.ore+=6;arena.gold+=350+c.index*200;arena.log(c.title+' 완료 · '+c.epilogue+' 기억 제작과 세 잔향이 열렸습니다.');}
 // Every chapter supplies a class-appropriate, wearable weapon once. No random soft lock.
 const weaponClaim='weapon-'+c.id,base=arena.design.equipment.items.find(i=>i.setId===c.setId&&i.family===({barbarian:'greataxe',sorceress:'staff',paladin:'sword',amazon:'bow'})[arena.classId]);
 if(base&&p.level>=base.level&&!j.claims.includes(weaponClaim)&&p.inventory.length<150){j.claims.push(weaponClaim);const item=rollItem(arena.design,base.id,(p.seed+c.index*73471)%2147483647);registerItem(arena,item);arena.log('여정 장비 지급 · '+item.name+' · 가방에서 장착하세요.');}
}
function registerItem(arena,item){arena.design.runtimeItems??=new Map();arena.design.runtimeItems.set(item.id,item);arena.profileData.inventory.push(item.id);arena.profileData.instances.push({id:item.id,baseId:item.baseId,seed:item.seed,upgrade:item.upgrade});arena.mapRevision++;}
export function craftItem(arena,recipeId){
 const p=arena.profileData,r=EXPANSION.recipes.find(r=>r.id===recipeId),c=r&&CHAPTERS[r.chapter],j=journey(p);
 if(!r||arena.mode!=='campaign'||arena.region.id!=='camp')return {ok:false,message:'야영지에서 기억을 장비로 만들 수 있습니다.'};
 if(!p.completed.includes(c.final))return {ok:false,message:c.title+'의 마지막 보스 처치 후 제작합니다.'};
 if(p.inventory.length>=150)return {ok:false,message:'가방을 비워 주세요.'};
 if(j.memories[r.chapter]<r.memory||p.ore<r.ore||arena.gold<r.gold)return {ok:false,message:'기억·강화 재료·금화가 부족합니다.'};
 const serial=(p.craftSerial||0)+1,item=rollItem(arena.design,r.item,(p.seed+serial*83492791)%2147483647);
 if(!item)return {ok:false,message:'제작할 장비를 찾지 못했습니다.'};
 j.memories[r.chapter]-=r.memory;p.ore-=r.ore;arena.gold-=r.gold;p.craftSerial=serial;registerItem(arena,item);if(!j.crafted.includes(r.item))j.crafted.push(r.item);arena.persist();arena.drawInventory();return {ok:true,message:item.name+' 제작 완료. 가방에서 외형을 확인하고 장착하세요.'};
}
export function startEncounter(arena,def){
 if(!['seal','bell'].includes(def.type)||(!arena.region.guardWaves&&!echoRule(arena)))return false;
 if(arena.zoneState.objects.includes(def.id))return true;
 if(def.type==='bell'&&def.order!==arena.zoneState.objects.filter(id=>id.startsWith('seal-')).length){arena.log('종 순서: 서쪽 → 동쪽 → 중앙');return true;}
 const state=arena.zoneState.encounters??={};
 if(!state[def.id]){state[def.id]={wave:0};arena.log(def.label+' · 수호전 시작. 예고된 적을 모두 쓰러뜨리세요.');arena.persist();}
 return true;
}
export function tickEncounters(arena){
 for(const [id,e] of Object.entries(arena.zoneState.encounters||{})){
  if(arena.zoneState.objects.includes(id))continue;
  const current=arena.map.spawns.filter(s=>s.gate===id&&s.wave===e.wave);
  if(!current.length||!current.every(s=>arena.zoneState.defeated.includes(s.id)))continue;
  if(arena.map.spawns.some(s=>s.gate===id&&s.wave===e.wave+1)){e.wave++;arena.log('다음 수호 파동 · '+(e.wave+1));}
  else{arena.zoneState.objects.push(id);arena.worldView.mark(id,true);arena.awardXp(arena.region.level*30);journey(arena.profileData).memories[chapterFor(arena.region.id).index]++;arena.effects.ring('holy',arena.worldView.objects.get(id).group.position,2,.9);arena.log('수호전 완료 · 기억 1개 · 보스 봉인 해제 진행');}
  arena.mapRevision++;arena.persist();
 }
}

const cleanPosition=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&Math.abs(p[0])<30&&Math.abs(p[2])<30?[p[0],0,p[2]]:null;
export function parkEcho(profile){if(!profile.expedition)return;profile.expeditions??={};profile.expeditions[profile.expedition.id]=profile.expedition;profile.expedition=null;}

export const echoGround=run=>[...new Map([...(run.state.ground||[]),...Object.values(run.state.layers||{}).flatMap(layer=>layer.ground||[])].map(d=>[d.item,d])).values()];
