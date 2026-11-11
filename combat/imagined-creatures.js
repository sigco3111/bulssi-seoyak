import * as T from 'three';
import {EXPANSION} from './expansion-data.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// Original articulated silhouettes. These are authored meshes, not reskinned animals.
export function imaginedCreature(type,boss=false,seed=0){
 const root=new T.Group(),body=new T.Group(),ownMaterials=[],limbs=[],orbit=[],flaps=[];body.name='imagined_body';root.add(body);
 const palettes={bellwraith:[0x665c47,0xc8a869,0x80d9cf],mirrormoth:[0x406976,0xb1d6db,0x9df5ee],foldling:[0x66515c,0xd2c4ac,0xf2b8bd],vessel:[0x356873,0xcbbf92,0x82e5e6],clockeater:[0x685139,0xc5a666,0xffd38b],hollowgarden:[0x3c6150,0x94ae78,0xd6df9b],voidknot:[0x383e60,0x9b94c6,0xd9baff]};
 const [a,b,c]=palettes[type]||palettes.voidknot;
 const material=(color,metalness=.35,roughness=.5,glow=false)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive:glow?color:0,emissiveIntensity:glow?.7:0,side:T.DoubleSide});m.userData.restEmissiveIntensity=glow?.7:0;m.userData.restEmissiveColor=glow?color:0;ownMaterials.push(m);return m;};
 const dark=material(a),trim=material(b,.7,.35),light=material(c,.2,.3,true),black=material(0x171f2b,.1,.7);
 const add=(parent,g,m,x=0,y=0,z=0)=>{g.userData.unique=true;const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const group=(name,x=0,y=0,z=0,parent=body)=>{const o=new T.Group();o.name=name;o.position.set(x,y,z);parent.add(o);return o;};
 const link=(parent,from,to,r,m)=>{const mesh=add(parent,new T.CylinderGeometry(r*.7,r,from.distanceTo(to),8),m,...from.clone().add(to).multiplyScalar(.5).toArray());mesh.quaternion.setFromUnitVectors(V(0,1,0),to.clone().sub(from).normalize());return mesh;};
 const eye=(parent,x,y,z,r=.09)=>{add(parent,new T.TorusGeometry(r,.025,6,20),trim,x,y,z);add(parent,new T.SphereGeometry(r*.7,12,8),light,x,y,z+.02);add(parent,new T.SphereGeometry(r*.25,8,6),black,x,y,z+r*.6);};
 if(type==='mirrormoth'){
  const center=add(body,new T.OctahedronGeometry(.30),dark,0,1.1,0);center.scale.set(.72,1.5,.6);eye(body,0,1.24,.20,.115);
  for(const sign of [-1,1])for(let i=0;i<3;i++){
   const wing=group('glass_wing_'+sign+'_'+i,sign*.12,1.3-i*.21,-.04);wing.rotation.z=sign*(.25+i*.5);wing.rotation.y=sign*.15;
   const shard=add(wing,new T.OctahedronGeometry(.50-i*.08),i%2?trim:dark,sign*(.35-i*.04),0,0);shard.scale.set(1.25,.52,.07);
   link(wing,V(sign*.03,0,.025),V(sign*.78,0,.025),.018,light);flaps.push({wing,sign,base:wing.rotation.y,phase:i*.9});
  }
  for(const sign of [-1,1])link(body,V(sign*.06,1.56,0),V(sign*.28,1.91,.05),.015,trim);
 }else if(type==='bellwraith'){
  const bell=add(body,new T.CylinderGeometry(.26,.60,.70,16,1,true),trim,0,1.1,0);bell.rotation.z=.08;
  for(let i=0;i<10;i++){const t=i/10*Math.PI*2;link(body,V(Math.sin(t)*.25,1.45,Math.cos(t)*.25),V(Math.sin(t)*.56,.77,Math.cos(t)*.56),.017,dark);}
  const pendulum=group('bell_pendulum',0,1.43,0);link(pendulum,V(),V(0,-.74,0),.025,trim);add(pendulum,new T.IcosahedronGeometry(.16,0),light,0,-.80,0);orbit.push({part:pendulum,axis:'z',amplitude:.3,phase:0});
  for(const sign of [-1,1]){const arm=group('bell_arm_'+sign,sign*.66,1.15,.1);add(arm,new T.TorusGeometry(.11,.035,6,12),trim);for(let j=0;j<3;j++)add(arm,new T.CapsuleGeometry(.025,.14,3,6),dark,sign*(j-1)*.06,-.18,.06+j*.02);orbit.push({part:arm,axis:'x',amplitude:.18,phase:sign});}
  add(body,new T.TorusGeometry(.35,.02,6,24),light,0,1.58,0).rotation.x=Math.PI/2;
 }else if(type==='foldling'){
  for(let i=0;i<5;i++){const page=group('fold_page_'+i,(i-2)*.035,1.10+(i%2)*.06,0);const mesh=add(page,new T.ConeGeometry(.42,.7,3),i%2?trim:dark);mesh.rotation.z=(i-2)*.4;mesh.scale.z=.10;flaps.push({wing:page,sign:i%2?1:-1,base:0,phase:i});}
  eye(body,0,1.43,.10,.07);
  for(const sign of [-1,1]){const leg=group('fold_leg_'+sign,sign*.20,.82,0);link(leg,V(),V(sign*.12,-.35,.08),.045,dark);link(leg,V(sign*.12,-.35,.08),V(sign*.2,-.72,.23),.025,trim);add(leg,new T.ConeGeometry(.10,.30,3),trim,sign*.2,-.67,.23).rotation.x=Math.PI/2;limbs.push({leg,phase:sign>0?0:Math.PI,base:0});const arm=group('fold_blade_'+sign,sign*.39,1.18,0);add(arm,new T.ConeGeometry(.12,.67,3),trim,sign*.14,-.2,.1).rotation.z=sign*.55;orbit.push({part:arm,axis:'x',amplitude:.15,phase:sign});}
 }else if(type==='vessel'){
  const bowl=add(body,new T.SphereGeometry(.53,20,12,0,Math.PI*2,Math.PI*.15,Math.PI*.65),dark,0,1.0,0);bowl.rotation.x=Math.PI;
  add(body,new T.TorusGeometry(.49,.055,6,28),trim,0,1.2,0).rotation.x=Math.PI/2;
  const pool=add(body,new T.CircleGeometry(.46,24),light,0,1.19,0);pool.rotation.x=-Math.PI/2;
  for(let i=0;i<3;i++){const t=i/3*Math.PI*2,leg=group('vessel_leg_'+i,Math.sin(t)*.35,.85,Math.cos(t)*.35);const knee=V(Math.sin(t)*.3,-.22,Math.cos(t)*.3),foot=V(Math.sin(t)*.25,-.83,Math.cos(t)*.25);link(leg,V(),knee,.065,trim);add(leg,new T.SphereGeometry(.08,10,6),dark,...knee.toArray());link(leg,knee,foot,.044,dark);add(leg,new T.SphereGeometry(.07,10,6),trim,...foot.toArray());limbs.push({leg,phase:t,base:0});}
  for(let i=0;i<7;i++){const star=add(body,new T.OctahedronGeometry(.04+i%2*.02),light,Math.sin(i*2.4)*.25,1.4+i*.09,Math.cos(i*2.4)*.25);orbit.push({part:star,axis:'y',amplitude:.12,phase:i,position:true,base:star.position.y});}
 }else if(type==='clockeater'){
  for(let i=0;i<7;i++){const segment=group('clock_segment_'+i,Math.sin(i*.7)*.14,.55+i*.12,.65-i*.22);add(segment,new T.TorusGeometry(.16+i*.007,.035,6,16),i%2?trim:dark).rotation.y=Math.PI/2;for(let j=0;j<6;j++){const t=j/6*Math.PI*2;add(segment,new T.BoxGeometry(.04,.07,.07),trim,Math.cos(t)*.2,Math.sin(t)*.2,0).rotation.z=t;}orbit.push({part:segment,axis:'y',amplitude:.3,phase:i*.55});}
  const face=group('clock_face',0,1.40,-.75);add(face,new T.CylinderGeometry(.33,.33,.08,24),dark).rotation.x=Math.PI/2;for(let i=0;i<12;i++){const t=i/12*Math.PI*2;const mark=add(face,new T.BoxGeometry(.015,.05,.015),trim,Math.sin(t)*.27,Math.cos(t)*.27,.05);mark.rotation.z=-t;}const hand=group('clock_hand',0,0,.08,face);add(hand,new T.BoxGeometry(.018,.42,.018),light,0,.14,0);orbit.push({part:hand,axis:'z',amplitude:Math.PI,phase:0,rotate:true});
 }else if(type==='hollowgarden'){
  for(let i=0;i<4;i++){const t=i/4*Math.PI*2,leg=group('root_leg_'+i,Math.sin(t)*.14,.65,Math.cos(t)*.14),knee=V(Math.sin(t)*.4,-.2,Math.cos(t)*.4),foot=V(Math.sin(t)*.60,-.64,Math.cos(t)*.60);link(leg,V(),knee,.07,dark);link(leg,knee,foot,.045,dark);add(leg,new T.DodecahedronGeometry(.08),trim,...knee.toArray());limbs.push({leg,phase:i%2*Math.PI,base:0});}
  link(body,V(0,.45,0),V(0,1.22,0),.13,dark);const bloom=group('garden_bloom',0,1.30,0);eye(bloom,0,0,.13,.19);
  for(let i=0;i<7;i++){const t=i/7*Math.PI*2,petal=group('petal_'+i,Math.sin(t)*.18,Math.cos(t)*.18,0,bloom);petal.rotation.z=-t;const mesh=add(petal,new T.SphereGeometry(1,10,6),i%2?dark:trim,0,.18,0);mesh.scale.set(.13,.32,.065);flaps.push({wing:petal,sign:1,base:0,phase:i*.4});}
 }else{
  for(let i=0;i<4;i++){const knot=group('void_ring_'+i,0,1.1,0);const arc=add(knot,new T.TorusGeometry(.34+i*.09,.026+i*.004,6,32,Math.PI*1.65),i%2?trim:dark);arc.rotation.set(i*.7,i*.9,i*.4);orbit.push({part:knot,axis:['x','y','z'][i%3],amplitude:1,phase:i,rotate:true});}
  for(let i=0;i<7;i++){const t=i/7*Math.PI*2;const tail=group('void_thread_'+i,Math.sin(t)*.18,.8,Math.cos(t)*.18);link(tail,V(),V(Math.sin(t)*.35,-.55,Math.cos(t)*.35),.015,light);orbit.push({part:tail,axis:'z',amplitude:.24,phase:i});}
 }
 if(boss){const variant=seed%3;if(variant===0){for(const sign of [-1,1])for(let i=0;i<3;i++){const blade=add(body,new T.OctahedronGeometry(.18),trim,sign*(.55+i*.12),1.35+i*.20,-.3);blade.scale.set(.4,1.6,.35);}}else if(variant===1){for(let i=0;i<3;i++){const halo=add(body,new T.TorusGeometry(.65+i*.10,.025,6,32,Math.PI*1.65),i%2?light:trim,0,1.55,-.2);halo.rotation.y=i*.55;orbit.push({part:halo,axis:'z',amplitude:.3,phase:i});}}else{for(const sign of [-1,1]){const fin=add(body,new T.ConeGeometry(.15,.85,4),trim,sign*.7,1.0,-.2);fin.rotation.z=sign*.75;}}const crest=group('boss_crest',0,2.05,0);for(let i=0;i<5;i++){const shard=add(crest,new T.OctahedronGeometry(.10),trim,(i-2)*.18,.06+Math.cos(i)*.07,0);shard.scale.set(.5,1.7,.4);}root.scale.setScalar(1.55);}
 root.name='Imagined_'+type;root.userData.creature=type;
 const mixer=new T.AnimationMixer(root),actions=new Map();
 const make=(name,duration,tracks)=>{const action=mixer.clipAction(new T.AnimationClip(name,duration,tracks));if(!name.includes('Loop')){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}actions.set(name,action);};
 make('Idle_Loop',2.8,[new T.NumberKeyframeTrack('imagined_body.position[y]',[0,1.4,2.8],[0,.035,0])]);
 const walking=[new T.NumberKeyframeTrack('imagined_body.position[y]',[0,.25,.5,.75,1],[0,.04,0,.04,0])];
 for(const {leg,phase}of limbs)walking.push(new T.NumberKeyframeTrack(leg.name+'.rotation[x]',[0,.25,.5,.75,1],[Math.sin(phase)*.22,Math.sin(phase+Math.PI/2)*.22,Math.sin(phase+Math.PI)*.22,Math.sin(phase+Math.PI*1.5)*.22,Math.sin(phase)*.22]));
 make('Jog_Fwd_Loop',1,walking);
 make('Sword_Attack',.95,[new T.NumberKeyframeTrack('imagined_body.rotation[x]',[0,.28,.40,.54,.95],[0,-.20,-.24,.42,0]),new T.NumberKeyframeTrack('imagined_body.position[z]',[0,.28,.48,.95],[0,-.12,.24,0])]);
 make('Hit_Chest',.32,[new T.NumberKeyframeTrack('imagined_body.rotation[z]',[0,.10,.32],[0,.14,0])]);
 make('Death01',1.2,[new T.NumberKeyframeTrack('imagined_body.rotation[z]',[0,.4,1.2],[0,.45,1.8]),new T.NumberKeyframeTrack('imagined_body.position[y]',[0,.8,1.2],[0,-.55,-.7])]);
 actions.get('Idle_Loop').play();
 const actor={root,body,mixer,actions,ownMaterials,rigged:false,type,displayName:EXPANSION.monsterLore.find(m=>m.id===type)?.name||type,
  secondaryTick(time,m){if(m.dead)return;for(const f of flaps)f.wing.rotation.y=f.base+Math.sin(time*(type==='mirrormoth'?3.2:1.7)+f.phase)*f.sign*(type==='mirrormoth'?.34:.16);for(const o of orbit){if(o.position)o.part.position.y=o.base+Math.sin(time*1.8+o.phase)*o.amplitude;else o.part.rotation[o.axis]=o.rotate?time*.4+o.phase:Math.sin(time*1.6+o.phase)*o.amplitude;}}
 };return actor;
}
