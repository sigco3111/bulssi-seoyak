import {CHAPTERS,EXPANSION,SETS} from '../combat/expansion-data.js';
import {REGIONS} from '../combat/maps.js';
import {journey,beginEcho,craftItem,chapterUnlocked,chapterAttuned} from '../combat/journey.js';
import {artFor} from './assets.js';
import {PAINTED_CREATURES} from './painted-generated.js';
import {esc} from './item-details.js';
import {audio} from './audio.js';

export class JourneyBook{
 constructor(design,getArena){
  this.design=design;this.getArena=getArena;this.chapter=0;this.tab='story';
  this.dialog=document.createElement('dialog');this.dialog.id='journey-book';this.dialog.setAttribute('aria-labelledby','journey-title');
  this.dialog.innerHTML='<header><div><small>THE ATLAS OF UNREMEMBERED WORLDS</small><h2 id="journey-title">기억의 지도</h2></div><button data-journey-close aria-label="여정 기록 닫기">✕</button></header><div class="journey-summary"></div><nav class="journey-tabs" aria-label="기록 분류"><button data-journey-tab="story">일곱 장의 여정</button><button data-journey-tab="forge">기억 제작</button><button data-journey-tab="bestiary">이계 도감</button></nav><div class="journey-layout"><nav id="journey-chapters" aria-label="세계의 장"></nav><section id="journey-content"></section></div><footer><p id="journey-message" role="status">장비는 가방에서 장착하세요. 실제 날짜를 기다리는 잠금은 없습니다.</p></footer>';
  document.body.append(this.dialog);
  this.dialog.onclick=e=>{
   if(e.target.closest('[data-journey-close]'))this.close();
   const chapter=e.target.closest('[data-journey-chapter]');if(chapter){this.chapter=Number(chapter.dataset.journeyChapter);this.draw();}
   const tab=e.target.closest('[data-journey-tab]');if(tab){this.tab=tab.dataset.journeyTab;this.draw();}
   const echo=e.target.closest('[data-echo-rule]');if(echo){const a=getArena();this.close();const result=beginEcho(a,CHAPTERS[this.chapter].id,echo.dataset.echoRule);if(!result.ok)a.log(result.message);}
   const craft=e.target.closest('[data-memory-craft]');if(craft){const result=craftItem(getArena(),craft.dataset.memoryCraft);this.draw();this.message(result.message);audio.play(result.ok?'upgrade':'ui-error');}
   const inspect=e.target.closest('[data-memory-inspect]');if(inspect)window.dispatchEvent(new CustomEvent('ashen-inspect-item',{detail:{item:this.design.equipment.items.find(i=>i.id===inspect.dataset.memoryInspect),source:'shop'}}));
   const travel=e.target.closest('[data-journey-travel]');if(travel){this.close();const a=getArena();a.requestTravel?.(travel.dataset.journeyTravel);}
  };
  this.dialog.oncancel=e=>{e.preventDefault();this.close();};this.dialog.onkeydown=e=>e.stopPropagation();
 }
 open(tab='story'){
  const a=this.getArena();if(!a?.ready||a.mode!=='campaign'||a.hp<=0||a.playing||this.dialog.open)return;
  this.wasBlocked=a.uiBlocked;a.uiBlocked=true;a.keys.clear();a.destination=null;this.tab=tab;
  this.chapter=CHAPTERS.find(c=>c.regions.includes(a.region.id))?.index??(CHAPTERS.find(c=>!chapterUnlocked(a.profileData,c)||!chapterAttuned(a.profileData,c))||CHAPTERS.at(-1)).index;
  this.draw();this.dialog.showModal();
 }
 close(){if(!this.dialog.open)return;this.dialog.close();const a=this.getArena();a.uiBlocked=this.wasBlocked;a.keys.clear();a.persist();}
 message(text){this.dialog.querySelector('#journey-message').textContent=text;}
 draw(){
  const a=this.getArena(),p=a.profileData,j=journey(p),c=CHAPTERS[this.chapter],complete=chapterUnlocked(p,c),set=SETS[this.chapter];
  this.dialog.querySelector('.journey-summary').innerHTML='<span><b>'+p.completed.length+' / 25</b> 사냥터</span><span><b>'+j.echoes.length+' / 21</b> 잔향 첫 완주</span><span><b>Lv.'+a.level+' / 60</b> 기술 성장</span><span><b>'+j.crafted.length+' / 105</b> 기억 장비 제작</span>';
  this.dialog.querySelectorAll('[data-journey-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.journeyTab===this.tab);b.setAttribute('aria-pressed',String(b.dataset.journeyTab===this.tab));});
  this.dialog.querySelector('#journey-chapters').innerHTML=CHAPTERS.map(ch=>'<button data-journey-chapter="'+ch.index+'" class="'+(ch.index===this.chapter?'selected':'')+'"><i>'+String(ch.index+1).padStart(2,'0')+'</i><span><b>'+esc(ch.title)+'</b><small>'+ch.regions.filter(id=>p.completed.includes(id)).length+' / '+ch.regions.length+' 사냥터 · 기억 '+j.memories[ch.index]+' · 잔향 '+EXPANSION.echoRules.filter(rule=>j.echoes.includes(ch.id+'-'+rule.id)).length+'/3</small></span><em>'+(chapterUnlocked(p,ch)?'◆':'◇')+'</em></button>').join('');
  const content=this.dialog.querySelector('#journey-content');
  let html='<div class="journey-chapter-heading"><small>CHAPTER '+String(c.index+1).padStart(2,'0')+' · '+(complete?'되찾은 기억':'탐험 중인 기억')+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(c.story)+'</p></div>';
  if(this.tab==='story'){
   html+='<div class="journey-route">'+c.regions.map((id,i)=>{const r=REGIONS.find(r=>r.id===id),done=p.completed.includes(id),open=p.unlocked.includes(id);return '<article class="'+(done?'complete':open?'available':'locked')+'"><i>'+String(i+1).padStart(2,'0')+'</i><div><small>Lv.'+r.level+' · '+(done?'보스 처치 완료':open?'입장 가능':'앞선 보스 처치 후 해금')+'</small><h4>'+esc(r.name)+'</h4><p>'+esc(r.objective)+(r.strata?' 세 구간: '+r.stratumNames.join(' → '):'')+'</p><b>보스 · '+esc(r.boss)+'</b></div><button data-journey-travel="'+id+'" '+(open?'':'disabled')+'>포탈 안내</button></article>';}).join('')+'</div>';
   html+='<section class="journey-echoes"><h4>세계의 잔향</h4><p>'+esc(complete?c.epilogue:'이 장의 마지막 보스를 쓰러뜨리면 세 잔향이 열립니다. 세 잔향을 완주하면 다음 세계로 이어집니다.')+'</p>'+EXPANSION.echoRules.map(rule=>{const cleared=j.echoes.includes(c.id+'-'+rule.id),resume=p.expedition?.id===c.id+'-'+rule.id&&!p.expedition.finished;return '<article><div><h5>'+esc(rule.name)+(cleared?' · 첫 완주':'')+'</h5><p>'+esc(rule.description)+'</p><small>첫 완주: 기억 8개 · 강화 재료 8개 · 현재 레벨 경험치 120%</small></div><button data-echo-rule="'+rule.id+'" '+(complete&&a.region.id==='camp'?'':'disabled')+'>'+(resume?'도전 이어가기':cleared?'다시 도전':'잔향 도전')+'</button></article>';}).join('')+'<small>세 잔향을 완주하면 다음 세계가 열립니다. 야영지에서 입장하며 일반 여정의 지도와 전리품은 별도로 보존합니다.</small></section>';
  }else if(this.tab==='forge'){
   html+='<div class="memory-wallet"><span>'+esc(c.material)+' <b>'+j.memories[c.index]+'</b></span><span>강화 재료 <b>'+p.ore+'</b></span><span>금화 <b>'+a.gold+'</b></span></div><div class="memory-set"><h4>'+esc(set.name)+' 세트</h4>'+set.bonuses.map(b=>'<p>'+b.count+'부위 · '+esc(b.description)+'</p>').join('')+'<small>동일한 반지를 양쪽에 착용하면 두 부위로 계산합니다. 양손 무기로 비활성화된 방패는 제외합니다.</small></div>';
   html+='<div class="memory-recipes">'+EXPANSION.recipes.filter(r=>r.chapter===this.chapter).map(r=>{const item=this.design.equipment.items.find(i=>i.id===r.item),can=complete&&a.region.id==='camp'&&j.memories[r.chapter]>=r.memory&&p.ore>=r.ore&&a.gold>=r.gold;return '<article><button data-memory-inspect="'+item.id+'" class="memory-item-art"><img src="'+artFor(item)+'" alt="'+esc(item.name)+' 실제 장비 모습" loading="lazy"><small>3D 착용 미리보기</small></button><div><small>Lv.'+item.level+' · '+(item.damage?'공격 '+item.damage.join('~')+' · '+item.rate+'회/초 · '+item.reach+'m':'부위별 외형 변화')+'</small><h5>'+esc(item.name)+'</h5><p>기억 '+r.memory+' · 재료 '+r.ore+' · '+r.gold+' 금화</p><button data-memory-craft="'+r.id+'" '+(can?'':'disabled')+'>'+(complete?'장비 제작':'장 마지막 보스 처치 필요')+'</button></div></article>';}).join('')+'</div>';
  }else{
   html+='<p class="bestiary-note">빈 종, 접힌 문장, 별을 담은 그릇. 서로 다른 몸과 움직임을 가진 일곱 이계 생명체입니다.</p><div class="memory-bestiary">'+EXPANSION.monsterLore.map(m=>'<article><img '+(PAINTED_CREATURES[m.id]?'class="painted" ':'')+'src="'+(PAINTED_CREATURES[m.id]||artFor('creature-'+m.id))+'" alt="'+esc(m.name)+'"><h4>'+esc(m.name)+'</h4><p>'+esc(m.anatomy)+'</p></article>').join('')+'</div>';
  }
  content.innerHTML=html;
  this.message(a.region.id==='camp'?'기억은 정예·수호전·보스·잔향에서 얻습니다. 제작은 야영지에서 이용하세요.':'T로 야영지에 돌아가 제작하거나 잔향을 시작하세요.');
 }
}
