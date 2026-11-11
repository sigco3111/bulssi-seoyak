import * as T from 'three';
import {echoRule} from './journey.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const families={mirrors:'cross',bells:'rings',prism:'star',fold:'cross',ink:'pools',pages:'star',waves:'waves',stars:'pools',maelstrom:'rings',hands:'cross',gears:'star',rewind:'rings',roots:'pools',bloom:'rings',harvest:'waves',stitch:'cross',orbits:'star',eclipse:'eclipse'};
// Damage uses the exact same bounds as the visible telegraph. No invisible full-arena hits.
export function bossPattern(arena,m){
 const rule=echoRule(arena),mechanic=arena.region.mechanic||(rule?'bells':null);if(!mechanic)return false;
 m.nextAttack=arena.time+99;if(arena.time<m.nextSpecial)return true;
 const health=m.hp/m.maxHp,phase=health<.3?3:health<.65?2:1;
 if(m.bossPhase!==phase){m.bossPhase=phase;arena.log(m.name+' · '+phase+'단계 · '+({cross:'갈라지는 길',rings:'확장하는 공명',star:'회전하는 시선',pools:'남겨진 흔적',waves:'밀려오는 경계',eclipse:'빈 중심의 피난처'})[families[mechanic]]);}
 m.pattern=(m.pattern||0)+1;m.nextSpecial=arena.time+(phase===3?3.4:phase===2?4.0:4.6);
 arena.enemyAction(m,'Sword_Attack',true);
 const at=m.actor.root.position.clone(),target=arena.hero.clone(),yaw=Math.atan2(target.x-at.x,target.z-at.z),mode=rule?.mixed&&m.pattern%2===0?'waves':arena.region.wing===1&&m.pattern%2===0?'rings':families[mechanic],delay=(phase===3?1.05:1.3)*(rule?.telegraph||1),damage=m.damage;
 const warn=(shape,position,radius,width,inner,angle=0,element='holy',wait=delay)=>arena.telegraph(position,shape,radius,damage,element,{width,inner,yaw:angle,delay:wait});
 m.channelUntil=arena.time+delay+.35;m.action?.setEffectiveTimeScale(m.action.getClip().duration/(delay+.15));
 m.mechanicsSeen??=new Set();m.mechanicsSeen.add(mode);
 if(mode==='cross'){
  // The opening between the two lanes remains safe. Aim is fixed when the warning begins.
  warn('line',at,6,.52,0,yaw,'lightning');warn('line',at,6,.52,0,yaw+Math.PI/2,'lightning',delay+.30);
  if(phase>1)warn('circle',target,1.15,0,0,0,'fire',delay+.65);
 }else if(mode==='rings'){
  for(let i=0;i<phase+1;i++)warn('ring',at,2.2+i*1.6,0,1.25+i*1.6,0,'ice',delay+i*.48);
 }else if(mode==='star'){
  const count=phase+2;for(let i=0;i<count;i++)warn('line',at,6,.36,0,yaw+i*Math.PI/count,'lightning',delay+i*.12);
 }else if(mode==='pools'){
  for(let i=0;i<phase+2;i++){const angle=i*2.4+m.pattern*.6,p=i===0?target:target.clone().add(V(Math.sin(angle)*2.4,0,Math.cos(angle)*2.4));if(arena.canWalk(p.x,p.z,.1))warn('circle',p,1.1,0,0,0,mechanic==='ink'?'fire':'ice',delay+i*.32);}
 }else if(mode==='waves'){
  const direction=yaw+(m.pattern%2?Math.PI/2:0),axis=V(Math.sin(direction),0,Math.cos(direction));
  for(let i=0;i<3;i++)warn('line',at.clone().addScaledVector(axis,(i-1)*2),5,.48,0,direction+Math.PI/2,'ice',delay+i*.55);
 }else{
  // Eclipse alternates the safe inner circle and the safe outer ground.
  if(m.pattern%2)warn('ring',at,6.2,0,2.1,0,'holy',delay+.25);else warn('circle',at,2.25,0,0,0,'lightning',delay+.25);
  if(phase===3)warn('line',at,5,.4,0,yaw,'fire',delay+1.1);
 }
 return true;
}
