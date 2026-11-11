import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import male from '../assets/runtime/humans/Male_Ranger.glb';
import female from '../assets/runtime/humans/Female_Ranger.glb';
import peasantM from '../assets/runtime/humans/Male_Peasant.glb';
import peasantF from '../assets/runtime/humans/Female_Peasant.glb';
import headM from '../assets/runtime/humans/Head_Male.glb';
import headF from '../assets/runtime/humans/Head_Female.glb';
import longHair from '../assets/runtime/humans/Hair_Long.glb';
import shortHair from '../assets/runtime/humans/Hair_SimpleParted.glb';
import buns from '../assets/runtime/humans/Hair_Buns.glb';
import beard from '../assets/runtime/humans/Hair_Beard.glb';
import animations from '../assets/runtime/humans/Animations.glb';
import combatExtra from '../assets/runtime/humans/Combat_Extra.glb';
// 직업별 머리색은 선택 화면 원화에 맞춘다(궁수만 적갈색).
const HAIR={barbarian:0x3b2a20,sorceress:0x30241d,amazon:0x8a4528,paladin:0x3f2d22};
const cache=new Map(),portraits=new Map();let clips=[],preloading;
export async function preloadCharacters(){if(preloading)return preloading;preloading=loadCharacters();return preloading;}
// 한 파일 빌드는 내장 문자열(data:), 웹 공개판은 파일 주소로 모델을 받는다.
const glbBytes=async url=>url.startsWith('data:')?Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0)).buffer:await(await fetch(url)).arrayBuffer();
async function loadCharacters(){
 const loader=new GLTFLoader();
 const entries=Object.entries({male,female,peasantM,peasantF,headM,headF,longHair,shortHair,buns,beard,animations,combatExtra}),buffers=await Promise.all(entries.map(([,url])=>glbBytes(url)));
  for(let i=0;i<entries.length;i++){const gltf=await loader.parseAsync(buffers[i],'');cache.set(entries[i][0],gltf);}
 // Keep the target skeleton's limb lengths; retarget rotation and root motion only.
 clips=[...cache.get('animations').animations,...cache.get('combatExtra').animations].map(c=>new T.AnimationClip(c.name,c.duration,c.tracks.filter(t=>t.name.endsWith('.quaternion')||/^(root|pelvis)\.position$/.test(t.name))));
}
const styleFor=kind=>({file:kind==='archer'?'female':kind==='healer'?'peasantF':kind==='mage'?'peasantM':'male',sex:['archer','healer'].includes(kind)?'F':'M',hair:kind==='healer'?'longHair':kind==='archer'?'buns':'shortHair',idle:'Idle_Loop',run:'Jog_Fwd_Loop',attack:kind==='archer'?'Pistol_Shoot':['mage','healer'].includes(kind)?'Spell_Simple_Shoot':'Sword_Attack'});
function attachHead(body,style){
 const source=cloneSkeleton(cache.get('head'+style.sex).scene);source.updateMatrixWorld(true);const inverse=source.getObjectByName('Head').matrixWorld.clone().invert(),head=body.getObjectByName('Head'),group=new T.Group();head.add(group);
 source.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.clone();if(m.isSkinnedMesh){const pos=geo.attributes.position,v=new T.Vector3();for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld).applyMatrix4(inverse);pos.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();}else geo.applyMatrix4(m.matrixWorld).applyMatrix4(inverse);geo.deleteAttribute('skinIndex');geo.deleteAttribute('skinWeight');geo.computeBoundingBox();geo.computeBoundingSphere();geo.userData.unique=true;group.add(new T.Mesh(geo,m.material));});
 const hair=cache.get(style.hair).scene;hair.updateMatrixWorld(true);hair.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inverse);geo.userData.unique=true;const mesh=new T.Mesh(geo,m.material);mesh.name='Hair';group.add(mesh);});
 if(style.cls==='barbarian'){const face=cache.get('beard').scene;face.updateMatrixWorld(true);face.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inverse);geo.userData.unique=true;const mesh=new T.Mesh(geo,m.material);mesh.name='Beard';group.add(mesh);});}
 return group;
}
function weapon(body,kind){
 const hand=body.getObjectByName('hand_r'),item=new T.Group();hand.add(item);const q=hand.getWorldQuaternion(new T.Quaternion()).invert(),direction=new T.Vector3(...(kind==='archer'?[0,0,1]:['mage','healer','lancer'].includes(kind)?[0,1,0]:[0,-1,0])).normalize();item.quaternion.copy(q.multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction)));
 const steel=new T.MeshStandardMaterial({color:0xc8d4db,metalness:.8,roughness:.3}),gold=new T.MeshStandardMaterial({color:0x9f814e,metalness:.65,roughness:.35}),wood=new T.MeshStandardMaterial({color:0x49392c,roughness:.8});
 const add=(g,m,x,y,z)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.geometry.userData.unique=true;item.add(mesh);return mesh;};
 let blade;
 if(kind==='archer'){
  // A hand-mounted crossbow uses the aimed upper-body clip.
  add(new T.BoxGeometry(.055,.38,.07),wood,0,.1,0);const arc=add(new T.TorusGeometry(.22,.018,5,22,Math.PI),wood,0,.21,0);arc.rotation.z=Math.PI/2;arc.rotation.x=Math.PI/2;add(new T.BoxGeometry(.42,.012,.012),gold,0,.22,-.02);
 }else if(kind==='mage'||kind==='healer'){
  add(new T.CylinderGeometry(.022,.029,1.42,8),wood,0,.42,0);add(new T.TorusGeometry(.12,.024,6,20),gold,0,1.12,0);const gem=add(new T.OctahedronGeometry(.095),new T.MeshStandardMaterial({color:kind==='mage'?0xe2aa72:0xa5d4b2,emissive:kind==='mage'?0xb85523:0x41986c,emissiveIntensity:.7}),0,1.12,0);gem.name='focus';
 }else if(kind==='lancer'){add(new T.CylinderGeometry(.022,.028,1.65,8),wood,0,.4,0);add(new T.ConeGeometry(.075,.32,4),steel,0,1.38,0);add(new T.CylinderGeometry(.04,.04,.13,8),gold,0,1.17,0);
 }else{
  blade=add(new T.BoxGeometry(.065,.65,.018),steel,0,.4,0);add(new T.ConeGeometry(.047,.15,4),steel,0,.8,0);add(new T.BoxGeometry(.25,.035,.05),gold,0,.06,0);add(new T.CylinderGeometry(.027,.027,.2,8),wood,0,-.055,0);add(new T.SphereGeometry(.035,8,6),gold,0,-.17,0);
  if(kind==='guard'){const shield=new T.Mesh(new T.CylinderGeometry(.26,.26,.04,12),new T.MeshStandardMaterial({color:0x52676b,metalness:.6,roughness:.4}));shield.rotation.x=Math.PI/2;shield.position.set(0,.16,.04);body.getObjectByName('hand_l').add(shield);shield.geometry.userData.unique=true;}
 }
 return blade;
}
export function riggedActor(kind,height=2.8,appearance={}){
 const style={...styleFor(kind),...appearance},source=cache.get(style.file);if(!source)return null;
 const root=new T.Group(),body=cloneSkeleton(source.scene);root.add(body);body.updateMatrixWorld(true);const bodyBounds=new T.Box3().setFromObject(body);
 body.traverse(o=>{if(o.isMesh&&/Head_Hood/.test(o.name))o.visible=kind==='archer';});attachHead(body,style);const calibration=new T.AnimationMixer(body),calibrationClip=clips.find(c=>c.name===(kind==='archer'?'Pistol_Aim_Neutral':'Idle_Loop'));calibration.clipAction(calibrationClip).play();calibration.update(.1);body.updateMatrixWorld(true);const blade=weapon(body,kind);calibration.stopAllAction();
 const ownMaterials=[],materials=new Map();body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const old=o.material;if(!materials.has(old)){const m=old.clone();m.roughness=Math.max(.45,m.roughness);if(o.name==='Hair'||o.name==='Beard')m.color.setHex(HAIR[style.cls]??(kind==='healer'?0xd4b78e:kind==='archer'?0x6b3d27:0x493329));if(kind==='guard'&&/Ranger/.test(o.name))m.color.setHex(0x9fb1bd);if(kind==='lancer'&&/Ranger/.test(o.name))m.color.setHex(0xc7a180);if(kind==='healer'&&/Peasant/.test(o.name))m.color.setHex(0xb8cbb0);materials.set(old,m);ownMaterials.push(m);}o.material=materials.get(old);}});
 body.updateMatrixWorld(true);const scale=height/(bodyBounds.max.y-bodyBounds.min.y+.15);body.scale.setScalar(scale);body.position.y=-bodyBounds.min.y*scale;
 const mixer=new T.AnimationMixer(body),actions=new Map();for(const clip of clips){const action=mixer.clipAction(clip);if(!/Loop|Idle|Neutral/.test(clip.name)){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}actions.set(clip.name,action);}
 const data={root,body,mixer,actions,style,ownMaterials,rigged:true,kind,attack:0,lastAttackValue:0,locked:false,current:null,blade,height,previousPosition:null};playAction(data,style.idle,.01);mixer.update(.001);return data;
}
function playAction(actor,name,fade=.12,seconds){const next=actor.actions.get(name)||actor.actions.get(actor.style.idle);if(!next||actor.current===next)return;const old=actor.current;next.reset().setEffectiveWeight(1);next.timeScale=seconds?next.getClip().duration/seconds:1;next.fadeIn(fade).play();if(old)old.fadeOut(fade);actor.current=next;}
export function animateRigged(actor,dt,moving,attack){
 const triggered=attack>actor.lastAttackValue+.3;actor.lastAttackValue=attack;
 if(triggered){actor.locked=true;const action=actor.actions.get(actor.style.attack);if(actor.current===action){action.reset().play();action.timeScale=action.getClip().duration/.72;}else playAction(actor,actor.style.attack,.065,.72);}
 if(actor.locked&&(actor.current.time>=actor.current.getClip().duration*.96||moving&&attack<.45))actor.locked=false;
 if(!actor.locked){playAction(actor,moving?actor.style.run:actor.style.idle,.15);if(moving){const speed=actor.previousPosition?actor.root.position.distanceTo(actor.previousPosition)/Math.max(.001,dt):4.3;actor.current.timeScale=Math.max(.65,Math.min(1.55,(speed<.05?4.3:speed)/4.3));}}
 actor.mixer.update(dt);actor.previousPosition=actor.root.position.clone();
}
export function characterPortrait(kind){
 if(portraits.has(kind))return portraits.get(kind);const actor=riggedActor(kind,2.8),scene=new T.Scene();scene.add(actor.root);actor.root.rotation.y=.2;scene.add(new T.HemisphereLight(0xe5edff,0x3d352b,2));const light=new T.DirectionalLight(0xffdfb6,3);light.position.set(-3,5,5);scene.add(light);const rim=new T.DirectionalLight(0x8faed6,2);rim.position.set(3,3,-3);scene.add(rim);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(240,300);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const camera=new T.PerspectiveCamera(25,.8,.1,20);camera.position.set(.22,2.38,2.65);camera.lookAt(0,2.28,0);actor.mixer.update(.15);renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');portraits.set(kind,url);renderer.dispose();renderer.forceContextLoss();return url;
}
export const riggedAssetNames=()=>[...cache.keys()];
