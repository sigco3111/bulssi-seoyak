import DESIGN from '../design/game-design.json';
import * as T from 'three';
import {riggedActor} from '../src/rigged.js';
import {applyAppearance,disposeAppearance} from '../equipment/appearance.js';
import {makeWeapon} from '../equipment/viewer.js';
export const NPCS=DESIGN.presentation.npcs;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function makeNpc(id,design){
 const def=NPCS[id]||NPCS.scout,actor=riggedActor('captain',1.8,{file:def.sex==='F'?'peasantF':'peasantM',sex:def.sex,hair:def.hair});
 actor.blade?.parent.removeFromParent();
 actor.appearance=applyAppearance(actor,{armor:def.armor,boots:'ridge-boots',belt:'supply-belt',gloves:id==='smith'?'wide-gloves':null});
 actor.ownMaterials.push(...actor.appearance.materials);
 actor.mixer.stopAllAction();const idle=actor.actions.get('Idle_Loop');idle.reset().setLoop(T.LoopRepeat,Infinity).setEffectiveWeight(1).play();actor.mixer.update(.1);actor.root.updateMatrixWorld(true);
 if(def.weapon){const profile=design.equipment.profiles.find(p=>p.id===def.weapon),prop=makeWeapon(profile),hand=actor.body.getObjectByName(def.weapon==='bow'?'hand_l':'hand_r');prop.group.scale.setScalar(1/hand.getWorldScale(V()).x);prop.group.quaternion.copy(hand.getWorldQuaternion(new T.Quaternion()).invert()).multiply(new T.Quaternion().setFromUnitVectors(V(0,1,0),V(def.weapon==='bow'?.1:0,.8,.12).normalize()));hand.add(prop.group);actor.npcProp=prop;}
 // The mouth belongs to the head bone, so it follows every nod and turn.
 const head=actor.body.getObjectByName('Head'),mouth=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshStandardMaterial({color:0x3b241f,roughness:.9}));
 head.updateWorldMatrix(true,false);const scale=head.getWorldScale(V()).x;mouth.scale.set(.025/scale,.003/scale,.004/scale);const world=head.getWorldPosition(V()).add(V(0,-.035,.096));mouth.position.copy(head.worldToLocal(world));mouth.name='Npc_Animated_Mouth';head.add(mouth);actor.ownMaterials.push(mouth.material);mouth.geometry.userData.unique=true;actor.npcMouth=mouth;actor.mouthScale=mouth.scale.y;
 actor.npcDefinition=def;actor.npcTime=0;return actor;
}
export function animateNpc(actor,dt,talking=false){actor.npcTime+=dt;actor.mixer.update(dt);const t=actor.npcTime,head=actor.body.getObjectByName('Head'),upper=actor.body.getObjectByName('upperarm_l');head.rotation.y+=Math.sin(t*.8)*.045;head.rotation.x+=Math.sin(t*1.6)*.018;if(talking){upper.rotation.z+=.10+Math.sin(t*2.6)*.075;head.rotation.x+=Math.sin(t*4)*.014;}if(actor.npcMouth)actor.npcMouth.scale.y=actor.mouthScale*(talking?1+Math.abs(Math.sin(t*14))*2.6:1);actor.root.updateMatrixWorld(true);}
export function disposeNpc(actor){actor.npcProp?.group.removeFromParent();actor.npcProp?.dispose();actor.mixer.stopAllAction();actor.root.removeFromParent();disposeAppearance(actor);}
