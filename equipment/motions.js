import * as T from 'three';
const V=(x,y,z)=>new T.Vector3(x,y,z),Y=V(0,1,0),Z=V(0,0,1),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const authored=new Set(['dagger','greatsword','greataxe','maul','spear','polearm','bow','crossbow']);
export const customMotionName=id=>({dagger:'Dagger_Stab',greatsword:'Greatsword_Cleave',greataxe:'Greataxe_Chop',maul:'Maul_Slam',spear:'Spear_Thrust',polearm:'Polearm_Sweep',bow:'Bow_DrawRelease',crossbow:'Crossbow_FireReload'})[id];
function worldRotation(bone,q){const parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(q));bone.updateMatrixWorld(true);}
function align(bone,from,to){const old=bone.getWorldQuaternion(new T.Quaternion());worldRotation(bone,new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize()).multiply(old));}
export function solveArm(body,side,target,handQ){
 const upper=body.getObjectByName('upperarm_'+side),lower=body.getObjectByName('lowerarm_'+side),hand=body.getObjectByName('hand_'+side);body.updateMatrixWorld(true);
 const a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3()),c=hand.getWorldPosition(new T.Vector3()),l1=a.distanceTo(b),l2=b.distanceTo(c),dir=target.clone().sub(a),d=clamp(dir.length(),Math.abs(l1-l2)+.002,l1+l2-.001);dir.normalize();
 const pole=V(side==='r'?-.6:.6,-.22,-.18),normal=pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(),along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),elbow=a.clone().addScaledVector(dir,along).addScaledVector(normal,height),end=a.clone().addScaledVector(dir,d);
 align(upper,b.clone().sub(a),elbow.clone().sub(a));body.updateMatrixWorld(true);const b2=lower.getWorldPosition(new T.Vector3()),c2=hand.getWorldPosition(new T.Vector3());align(lower,c2.sub(b2),end.clone().sub(b2));worldRotation(hand,handQ);body.updateMatrixWorld(true);return hand.getWorldPosition(new T.Vector3());
}
function constrainGrip(actor,grip,direction,support){const B=actor.body,point=(side)=>B.getObjectByName('upperarm_'+side).getWorldPosition(new T.Vector3()),reach=side=>{const a=point(side),b=B.getObjectByName('lowerarm_'+side).getWorldPosition(new T.Vector3()),c=B.getObjectByName('hand_'+side).getWorldPosition(new T.Vector3());return a.distanceTo(b)+b.distanceTo(c)-.012;},right=point('r'),left=point('l').addScaledVector(direction,-support),rr=reach('r'),lr=reach('l'),g=grip.clone();for(let i=0;i<12;i++)for(const [center,r]of [[right,rr],[left,lr]]){const d=g.clone().sub(center);if(d.length()>r)g.copy(center).add(d.setLength(r));}return g;}
function keysFor(id,w,c){const start=w.phases[0],end=start+w.phases[1];
 if(id==='dagger')return[[0,V(-.24,c-.1,.10),V(0,.05,1)],[start*.80,V(-.28,c-.08,-.12),V(.12,.05,1)],[start+.02,V(-.08,c-.1,.54),V(-.02,.02,1)],[end,V(-.10,c-.1,.51),V(0,.02,1)],[.90,V(-.24,c-.1,.10),V(0,.05,1)],[1,V(-.24,c-.1,.10),V(0,.05,1)]];
 if(id==='spear')return[[0,V(-.12,c-.22,-.26),V(.04,.09,1)],[start*.8,V(-.16,c-.20,-.40),V(.05,.06,1)],[start+.02,V(-.08,c-.14,.05),V(.02,.015,1)],[end,V(-.08,c-.14,.05),V(.02,.015,1)],[.92,V(-.12,c-.22,-.26),V(.04,.09,1)],[1,V(-.12,c-.22,-.26),V(.04,.09,1)]];
 if(id==='polearm')return[[0,V(-.08,c-.16,-.12),V(.35,.18,.9)],[start*.80,V(-.10,c-.10,-.18),V(-.86,.13,.48)],[start,V(-.10,c-.12,.02),V(-.76,.08,.65)],[end,V(.04,c-.18,.06),V(.85,-.05,.52)],[.94,V(-.08,c-.16,-.12),V(.35,.18,.9)],[1,V(-.08,c-.16,-.12),V(.35,.18,.9)]];
 return[[0,V(-.10,c-.04,.10),V(0,.82,.57)],[start*.78,V(-.13,c+.23,-.10),V(-.15,.92,-.3)],[start,V(-.12,c+.13,.12),V(-.12,.7,.7)],[end,V(-.04,c-.23,.42),V(.15,-.32,.93)],[.9,V(-.10,c-.04,.10),V(0,.82,.57)],[1,V(-.10,c-.04,.10),V(0,.82,.57)]];
}
function poseKey(keys,t){let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],p=smooth((t-a[0])/(b[0]-a[0]||1));return{grip:a[1].clone().lerp(b[1],p),direction:a[2].clone().lerp(b[2],p).normalize()};}
export function bakeWeaponMotion(actor,profile,prop){
 if(!authored.has(profile.id))return null;const cached=actor.weaponMotions?.get(profile.id);if(cached){prop.group.quaternion.identity();return cached;}const name=customMotionName(profile.id),mixer=actor.mixer,bones=[];actor.body.traverse(o=>{if(o.isBone)bones.push(o);});const baseName=['bow','crossbow'].includes(profile.id)?'Sword_Idle':'Sword_Attack',base=actor.actions.get(baseName),duration=1,frames=120,tracks=new Map(bones.map(b=>[b.name,{q:[],p:[]}])) ,times=[];
 let maxGripError=0;const readyFrame=new Map();
 function pose(t){mixer.stopAllAction();base.reset().stopFading().setEffectiveTimeScale(1).setEffectiveWeight(1).play();mixer.update(base.getClip().duration*t);actor.root.updateMatrixWorld(true);const chest=actor.body.getObjectByName('spine_03').getWorldPosition(new T.Vector3()),c=chest.y;
  if(profile.id==='bow'){
   const draw=smooth(t/(profile.phases[0]||.4)),release=smooth((t-profile.phases[0])/.07),returning=smooth((t-.72)/.25),tension=draw*(1-release),left=V(.14,c+.06,.33),leftQ=new T.Quaternion();solveArm(actor.body,'l',left,leftQ);const L=actor.body.getObjectByName('hand_l').getWorldPosition(new T.Vector3()),right=V(L.x,c+.06,L.z-.22-.25*tension);if(t>profile.phases[0])right.lerp(V(-.18,c+.02,.02),smooth((t-profile.phases[0])/.25)*(1-returning));const RQ=new T.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2);solveArm(actor.body,'r',right,RQ);
  }else if(profile.id==='crossbow'){
   const grip=V(-.10,c-.15,.18),q=new T.Quaternion().setFromUnitVectors(Y,Z);solveArm(actor.body,'r',grip,q);actor.root.updateMatrixWorld(true);const R=actor.body.getObjectByName('hand_r').getWorldPosition(new T.Vector3()),fore=R.clone().add(V(.05,0,.18)),reload=smooth((t-.36)/.2)*(1-smooth((t-.76)/.22));fore.add(V(0,.16*reload,-.25*reload));solveArm(actor.body,'l',fore,q.clone().multiply(new T.Quaternion().setFromAxisAngle(Y,Math.PI)));
  }else{
   const k=poseKey(keysFor(profile.id,profile,c),t),q=new T.Quaternion().setFromUnitVectors(Y,k.direction),support=profile.id==='spear'?.34:profile.id==='polearm'?.20:-.13,grip=profile.hands==='양손'?constrainGrip(actor,k.grip,k.direction,support):k.grip,actualR=solveArm(actor.body,'r',grip,q);if(profile.hands==='양손'){
    const target=actualR.clone().addScaledVector(k.direction,support),lq=q.clone().multiply(new T.Quaternion().setFromAxisAngle(Y,Math.PI));const actualL=solveArm(actor.body,'l',target,lq);maxGripError=Math.max(maxGripError,actualL.distanceTo(target));
   }else{solveArm(actor.body,'l',V(.21,c-.02,.14),new T.Quaternion());}

  }
  actor.root.updateMatrixWorld(true);
 }
 for(let i=0;i<=frames;i++){const t=i/frames;pose(t);times.push(t);for(const b of bones){const a=tracks.get(b.name);const q=b.quaternion.clone();if(a.q.length){const last=new T.Quaternion().fromArray(a.q,a.q.length-4);if(last.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);}a.q.push(...q.toArray());a.p.push(...b.position.toArray());if(i===0)readyFrame.set(b.name,{q:q.clone(),p:b.position.clone()});}}
 const animTracks=[];for(const b of bones){const a=tracks.get(b.name);animTracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,a.q));if(['root','pelvis'].includes(b.name))animTracks.push(new T.VectorKeyframeTrack(b.name+'.position',times,a.p));}
 const clip=new T.AnimationClip(name,duration,animTracks),idleTracks=[];for(const b of bones){const r=readyFrame.get(b.name);idleTracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',[0,2],[...r.q.toArray(),...r.q.toArray()]));if(['root','pelvis'].includes(b.name)){const p=r.p.clone(),up=p.clone();up.y+=.003;idleTracks.push(new T.VectorKeyframeTrack(b.name+'.position',[0,.5,1,1.5,2],[...p.toArray(),...up.toArray(),...p.toArray(),...p.toArray(),...p.toArray()]));}}
 const idle=new T.AnimationClip(name+'_Idle',2,idleTracks);mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;actor.actions.set(name,action);actor.actions.set(idle.name,mixer.clipAction(idle));prop.group.quaternion.identity();actor.body.updateMatrixWorld(true);const result={clip:name,idle:idle.name,maxGripError,source:'authored two-bone IK, baked skeletal keyframes',frames:frames+1};actor.weaponMotions??=new Map();actor.weaponMotions.set(profile.id,result);return result;
}
export function updateBowString(actor,prop,pull=false){if(!prop?.bowString)return;const hand=actor.body.getObjectByName('hand_r').getWorldPosition(new T.Vector3());prop.group.worldToLocal(hand);const point=pull?hand:new T.Vector3(0,0,-.23),a=prop.bowString.geometry.attributes.position;a.setXYZ(1,point.x,point.y,point.z);a.needsUpdate=true;prop.bowString.geometry.computeBoundingSphere();}

// Skill silhouettes have their own anticipation and release, independent of weapon rate.
export function bakeSkillMotions(actor,profile){
 actor.skillClips??=new Set();const names=['Cast_Fire','Cast_Ice','Cast_Lightning','Cast_Area'];if(profile.tags.includes('melee'))names.push('Whirlwind_'+profile.id,'DualAttack_'+profile.id,'Zeal_'+profile.id,'Shield_Bash');
 const bones=[];actor.body.traverse(b=>{if(b.isBone)bones.push(b);});const mixer=actor.mixer;
 for(const name of names){if(actor.skillClips.has(name))continue;const base=actor.actions.get(name.startsWith('Whirlwind')?'Sword_Idle':'Spell_Simple_Idle_Loop'),times=[],tracks=new Map(bones.map(b=>[b.name,{q:[],p:[]}])) ,frames=72;
 for(let i=0;i<=frames;i++){const t=i/frames;mixer.stopAllAction();base.reset().stopFading().setEffectiveTimeScale(1).setEffectiveWeight(1).play();mixer.update(t*base.getClip().duration);actor.root.updateMatrixWorld(true);const c=actor.body.getObjectByName('spine_03').getWorldPosition(V(0,0,0)).y,wind=smooth(t/.35),release=smooth((t-.35)/.10),recover=smooth((t-.7)/.3),power=release*(1-recover),r=V(-.18,c+.05,.13),l=V(.22,c+.04,.16);let rq=new T.Quaternion(),lq=new T.Quaternion();
 if(name==='Cast_Fire'){r.add(V(.10,-.02,.39*power));r.y+=.13*wind*(1-release);l.add(V(.07,-.07,.10*power));}
 else if(name==='Cast_Ice'){r.add(V(-.14*wind*(1-release),.08,.38*power));l.add(V(.17*wind*(1-release),.08,.30*power));}
 else if(name==='Cast_Lightning'){r.add(V(.14,.33*wind*(1-release)+.10*power,.40*power));l.add(V(.12,-.05,-.09));}
 else if(name.startsWith('DualAttack_')||name.startsWith('Zeal_')){const dual=name.startsWith('Dual'),swing=(u)=>Math.sin(Math.PI*Math.max(0,Math.min(1,u)));const right=dual?swing((t-.15)/.36):Math.sin(Math.PI*((t*5)%1)),left=dual?swing((t-.48)/.36):.1;r.set(-.20+right*.25,c+.12-right*.12,.12+right*.57);l.set(.24-left*.25,c+.12-left*.12,.12+left*.57);}
 else if(name==='Shield_Bash'){l.add(V(-.05,.06,.56*power));r.add(V(.05,-.04,-.10*power));}
 else if(name==='Cast_Area'){r.add(V(0,.40*wind*(1-recover),.10*power));l.add(V(0,.40*wind*(1-recover),.10*power));}
 else{const direction=V(-.82,.04,.57).normalize(),q=new T.Quaternion().setFromUnitVectors(Y,direction),g=constrainGrip(actor,V(-.12,c-.05,.20),direction,-.13),actual=solveArm(actor.body,'r',g,q);solveArm(actor.body,'l',actual.clone().addScaledVector(direction,-.13),q.clone().multiply(new T.Quaternion().setFromAxisAngle(Y,Math.PI)));}
 if(!name.startsWith('Whirlwind')){rq.setFromAxisAngle(V(1,0,0),Math.PI/2);lq.copy(rq);solveArm(actor.body,'r',r,rq);solveArm(actor.body,'l',l,lq);}
 times.push(t);for(const b of bones){const a=tracks.get(b.name),q=b.quaternion.clone();if(a.q.length&&new T.Quaternion().fromArray(a.q,a.q.length-4).dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);a.q.push(...q.toArray());a.p.push(...b.position.toArray());}}
 const keys=[];for(const b of bones){const a=tracks.get(b.name);keys.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,a.q));if(['root','pelvis'].includes(b.name))keys.push(new T.VectorKeyframeTrack(b.name+'.position',times,a.p));}const clip=new T.AnimationClip(name,1,keys),action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;actor.actions.set(name,action);actor.skillClips.add(name);}
 mixer.stopAllAction();
}
