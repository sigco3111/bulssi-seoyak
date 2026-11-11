import {firstClearXp,journey,echoRule} from './journey.js';
export const stratumCount=arena=>arena.region?.id==='camp'?1:arena.profileData?.expedition?.region===arena.region?.id?3:arena.region?.strata||1;
export const currentStratum=arena=>arena.zoneState?.wing||0;
export const stratumName=arena=>arena.region?.stratumNames?.[currentStratum(arena)]||['기억의 문턱','갈라진 기억의 심층','잔향의 핵심'][currentStratum(arena)];
export function changeStratum(arena,direction=1){
 const state=arena.zoneState,current=currentStratum(arena),next=current+direction;
 if(next<0||next>=stratumCount(arena)||direction>0&&!state.boss)return false;
 arena.persist();arena.saveGround();
 const {layers={},wing=0,...snapshot}=state;layers[current]=snapshot;
 const nextState=layers[next]||{seed:(state.seed+7907)%2147483647,defeated:[],objects:[],revealed:[],boss:false,ground:[],encounters:{},patrolRound:0,patrolReadyAt:0,dropSerial:0,visits:0};
 Object.assign(state,nextState,{layers,wing:next});arena.profileData.position=null;
 arena.zoneState=null;arena.enterRegion(arena.region.id);arena.log('구간 '+(next+1)+' / '+stratumCount(arena)+' · '+stratumName(arena));return true;
}
export function intermediateBoss(arena,m){
 if(!m.boss||currentStratum(arena)>=stratumCount(arena)-1)return false;
 const p=arena.profileData,j=journey(p),wing=currentStratum(arena),echo=p.expedition?.region===arena.region.id?p.expedition.id:null,key='wing-'+(echo||arena.region.id)+'-'+wing;
 arena.zoneState.boss=true;arena.worldView.mark('boss',true);
 if(!j.claims.includes(key)){j.claims.push(key);arena.awardXp(echo?arena.design.combatBalance.progression.curve.base+arena.level*100:Math.round(firstClearXp(arena.region)*.25));}
 const chapter=arena.design.campaign.expansion.chapters.find(c=>c.regions.includes(arena.region.id));j.memories[chapter.index]+=2;p.ore+=2;p.potions.hp=Math.min(99,p.potions.hp+3);p.potions.mana=Math.min(99,p.potions.mana+3);
 arena.log(stratumName(arena)+' 수호체 격파 · 기억 2개 · 물약 보급 · 출구에서 다음 구간으로 이동');arena.persist();return true;
}
