import * as T from 'three';
import {ornament,featherWing} from './ornaments.js';
export function addRegalia(actor,c,skeleton,reference,capeMaterial){if(!c.style)return;const index=n=>skeleton.bones.findIndex(b=>b.name===n),owned=actor.ownMaterials,accent=new T.MeshStandardMaterial({color:c.accent,metalness:.78,roughness:.33}),metal=new T.MeshStandardMaterial({color:c.metal,metalness:.65,roughness:.4}),cloth=new T.MeshStandardMaterial({color:c.cloth,roughness:.87,side:T.DoubleSide}),glow=new T.MeshStandardMaterial({color:c.color,emissive:c.color,emissiveIntensity:.55,metalness:.24,roughness:.32,side:T.DoubleSide});owned.push(accent,metal,cloth,glow);const animated=[];
 const attach=(bone,group,x,y,z)=>{group.position.set(x,y,z);group.applyMatrix4(skeleton.boneInverses[index(bone)]);actor.body.getObjectByName(bone).add(group);return group;},piece=(bone,g,m,x,y,z,scale=[1,1,1])=>{const group=new T.Group(),mesh=ornament(group,g,m);mesh.scale.set(...scale);attach(bone,group,x,y,z);return mesh;};
 const style=c.style,premium=c.currency==='premium';
 const chestMetal=premium?metal:style==='raven'?cloth:metal;
 for(const sign of [-1,1]){piece('spine_03',new T.SphereGeometry(1,20,12),chestMetal,sign*.095,1.285,.152,[.112,.175,.092]);piece('spine_03',new T.TorusGeometry(.10,.006,5,24,Math.PI),accent,sign*.095,1.29,.229,[.72,1,.65]);}
 for(let i=0;i<3;i++)piece('spine_02',new T.BoxGeometry(.28-i*.012,.052,.035),i%2?accent:metal,0,1.125+i*.055,.183+i*.014);
 for(const side of ['l','r']){const inv=skeleton.boneInverses[index('lowerarm_'+side)],handRest=skeleton.boneInverses[index('hand_'+side)].clone().invert(),elbowRest=inv.clone().invert(),handP=new T.Vector3().setFromMatrixPosition(handRest),elbowP=new T.Vector3().setFromMatrixPosition(elbowRest),near=elbowP.clone().lerp(handP,.48),guard=new T.Group();ornament(guard,new T.TubeGeometry(new T.LineCurve3(near,handP.clone().lerp(elbowP,.07)),1,.052,10,false),metal);attach('lowerarm_'+side,guard,0,0,0);const rest=skeleton.boneInverses[index('thigh_'+side)].clone().invert(),thigh=new T.Vector3().setFromMatrixPosition(rest),sign=side==='l'?1:-1;piece('thigh_'+side,new T.SphereGeometry(1,14,10),metal,thigh.x,thigh.y-.12,thigh.z+.12,[.095,.16,.052]);piece('thigh_'+side,new T.BoxGeometry(.015,.20,.009),accent,thigh.x+sign*.025,thigh.y-.12,thigh.z+.173);}

 // Every raised plate follows the upper arm; the chest stays clear for weapon grips.
 for(const [side,sign]of [['l',1],['r',-1]]){const matrix=skeleton.boneInverses[index('upperarm_'+side)].clone().invert(),p=new T.Vector3().setFromMatrixPosition(matrix),mantle=new T.Group();for(let i=0;i<3;i++){const cap=ornament(mantle,new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.65),i%2?accent:metal,sign*i*.045,-i*.028,-i*.008);cap.scale.set(.16-i*.015,.07,.13);}
 if(['raven','dragon'].includes(style)){for(let i=0;i<5;i++){const feather=ornament(mantle,new T.ConeGeometry(.035,.25,5),style==='raven'?metal:accent,sign*(.05+i*.025),-.03,-.05-i*.035);feather.rotation.z=-sign*(.4+i*.1);feather.rotation.x=-.7;}}
 if(['knight','oracle'].includes(style))for(let i=0;i<4;i++)ornament(mantle,new T.SphereGeometry(.012,6,5),accent,sign*.08,.035,-.08+i*.055);
 if(premium){const jewel=ornament(mantle,new T.OctahedronGeometry(.054),glow,sign*.07,.085,-.01);jewel.rotation.z=.5;}
 attach('upperarm_'+side,mantle,p.x,p.y+.025,p.z);}
 for(const sign of [-1,1]){const stripe=piece('spine_03',new T.BoxGeometry(.015,.22,.012),accent,sign*.105,1.30,.208);stripe.rotation.z=sign*.12;}
 piece('spine_03',new T.TorusGeometry(.075,.009,6,32),accent,0,1.30,.226);piece('spine_03',new T.OctahedronGeometry(.037),premium?glow:accent,0,1.30,.240);
 for(let i=0;i<5;i++)piece('pelvis',new T.CylinderGeometry(.013,.013,.13+(i%2)*.035,6),accent,(i-2)*.065,.93,.18);
 if(style==='oracle'){for(let i=0;i<3;i++){const disk=piece('spine_03',new T.TorusGeometry(.045,.005,5,20),accent,0,1.18-i*.095,.217);disk.rotation.z=i*.5;}piece('Head',new T.TorusGeometry(.108,.008,6,28,Math.PI*1.3),accent,0,1.73,-.005);}
 if(style==='eclipse'){const halo=new T.Group(),outer=ornament(halo,new T.TorusGeometry(.22,.011,6,48,Math.PI*1.65),accent);outer.rotation.z=.55;for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ornament(halo,new T.OctahedronGeometry(.020),glow,Math.sin(a)*.24,Math.cos(a)*.24,-.01);}attach('spine_03',halo,0,1.78,-.20);animated.push({node:halo,base:halo.quaternion.clone(),mode:'halo'});}
 if(['seraph','dragon'].includes(style)){for(const sign of [-1,1]){const pivot=new T.Group(),wing=featherWing(style==='seraph'?new T.MeshStandardMaterial({color:0xe7dfc7,metalness:.25,roughness:.58,side:T.DoubleSide}):cloth,accent,style==='seraph'?1.02:.88,style==='dragon');if(style==='seraph')owned.push(wing.children[1]?.material);wing.scale.x=sign;wing.rotation.z=sign*.15;pivot.add(wing);attach('spine_03',pivot,sign*.16,1.40,-.235);animated.push({node:pivot,base:pivot.quaternion.clone(),mode:'wing',sign});}}
 const previous=capeMaterial.onBeforeCompile;capeMaterial.onBeforeCompile=s=>{previous?.(s);s.vertexShader='varying vec2 vRegaliaUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvRegaliaUv=uv;');s.fragmentShader='varying vec2 vRegaliaUv;\nuniform float capeTime;\n'+s.fragmentShader;s.uniforms.capeTime=actor.capeTime;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float border=step(vRegaliaUv.x,.035)+step(.965,vRegaliaUv.x)+step(.965,vRegaliaUv.y);
 float weave=sin(vRegaliaUv.x*460.)*sin(vRegaliaUv.y*420.)*.025;
 float emblem=step(abs(vRegaliaUv.x-.5),.009)*step(.22,vRegaliaUv.y)*step(vRegaliaUv.y,.64);
 float diamond=step(abs(abs(vRegaliaUv.x-.5)+abs(vRegaliaUv.y-.44)*.6-.12),.007);
 diffuseColor.rgb*=1.+weave;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.62,.51,.31),clamp(border*.70+emblem*.55+diamond*.65,0.,1.));
 ${premium?'diffuseColor.rgb+=vec3(.12,.10,.17)*diamond*(.6+.4*sin(capeTime*1.4));':''}`);};capeMaterial.customProgramCacheKey=()=>'regalia-'+style;
 actor.cosmeticTick=(now,moving=false)=>{if(actor.capeTime)actor.capeTime.value=now;for(const a of animated){const angle=a.mode==='halo'?Math.sin(now*.25)*.08:Math.sin(now*(moving?3:1.5))*.09;a.node.quaternion.copy(a.base).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,a.mode==='halo'?0:1,a.mode==='halo'?1:0),angle*(a.sign||1)));}};
 actor.regalia={style,animated: animated.length,premium};
}
