import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import horse from '../assets/runtime/creatures/Horse.glb';
import wolf from '../assets/runtime/creatures/Wolf.glb';
import stag from '../assets/runtime/creatures/Stag.glb';
const cache=new Map();let pending;
// 한 파일 빌드는 내장 문자열(data:), 웹 공개판은 파일 주소로 모델을 받는다.
const glbBytes=async url=>url.startsWith('data:')?Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0)).buffer:await(await fetch(url)).arrayBuffer();
export function preloadCreatures(){return pending??=Promise.all(Object.entries({horse,wolf,stag}).map(async([id,url])=>{cache.set(id,await new GLTFLoader().parseAsync(await glbBytes(url),''));}));}
export function creature(id,height=1.1){const source=cache.get(id);if(!source)throw Error('Creature not loaded: '+id);const root=new T.Group(),body=clone(source.scene),ownMaterials=[],materials=new Map();root.add(body);body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),scale=height/(bounds.max.y-bounds.min.y);body.scale.setScalar(scale);body.position.y=-bounds.min.y*scale;
 body.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const old=o.material;if(!materials.has(old)){const m=old.clone();m.roughness=.85;materials.set(old,m);ownMaterials.push(m);}o.material=materials.get(old);});
 const mixer=new T.AnimationMixer(body),actions=new Map(),aliases={Idle_Loop:'Idle',Jog_Fwd_Loop:'Gallop',Walk_Loop:'Walk',Sword_Attack:id==='wolf'?'Attack':'Attack_Headbutt',Hit_Chest:'Idle_HitReact_Left',Death01:'Death'};
 for(const [alias,name]of Object.entries(aliases)){const clip=source.animations.find(c=>c.name===name)?.clone();if(!clip)continue;clip.name=alias;const action=mixer.clipAction(clip);if(!alias.includes('Loop')){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}actions.set(alias,action);}
 actions.get('Idle_Loop').play();mixer.update(.001);root.updateMatrixWorld(true);return{root,body,mixer,actions,ownMaterials,type:id,beast:true,rigged:true,height};}
