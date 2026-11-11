import * as T from 'three';
import {GEAR_VISUALS} from '../combat/expansion-data.js';
const Q=(axis,angle)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis),angle);
export function addGearDetails(actor,slots,{at,between,pos}){
 const active={};
 for(const [slot,id]of Object.entries(slots)){
  const v=GEAR_VISUALS.get(id);if(!v)continue;active[slot]={id,theme:v.theme,style:slot==='helm'?v.head:v.style};
  const mat=(color,metalness=.65)=>new T.MeshStandardMaterial({color,metalness,roughness:.42,side:T.DoubleSide});
  const prefix='Gear_'+slot+'_'+v.theme+'_',base=v.color,trim=v.trim;
  const piece=(name,bone,g,x,y,z,scale=[1,1,1],q)=>at(prefix+name,bone,g,mat(trim),x,y,z,scale,q);
  if(slot==='helm'){
   actor.body.traverse(o=>{if(o.isMesh&&o.name==='Hair')o.visible=['halo','crown','antlers','eclipse'].includes(v.head);});
   const head='Head',ring=(name,r,y,z=.0)=>piece(name,head,new T.TorusGeometry(r,.008,6,28),0,y,z,[1,1,1],Q([1,0,0],Math.PI/2));
   if(v.head==='hood'){
    at(prefix+'Hood',head,new T.SphereGeometry(.126,24,14,0,Math.PI*2,0,Math.PI*.65),mat(base,.05),0,1.73,-.027,[1,1,1.1]);
    for(const sign of [-1,1])at(prefix+'Hood_Fold_'+sign,head,new T.CapsuleGeometry(.025,.13,4,8),mat(base,.05),sign*.106,1.64,-.010,[1,1,1],Q([0,0,1],sign*.15));
    piece('Forehead_Sigil',head,new T.OctahedronGeometry(.025),0,1.79,.085,[.7,1.4,.5]);
   }else if(v.head==='visor'){
    at(prefix+'Half_Helm',head,new T.SphereGeometry(.116,24,14,0,Math.PI*2,0,Math.PI*.53),mat(base),0,1.738,-.021);
    for(const sign of [-1,1]){piece('Temple_'+sign,head,new T.OctahedronGeometry(.06),sign*.113,1.71,.005,[.35,1.6,.8]);piece('Wing_'+sign,head,new T.ConeGeometry(.025,.14,3),sign*.14,1.79,-.02,[1,1,1],Q([0,0,1],-sign*.4));}
   }else if(v.head==='horns'||v.head==='antlers'){
    ring('Circlet',.111,1.747,-.018);
    for(const sign of [-1,1])for(let j=0;j<3;j++){
     const a=new T.Vector3(sign*(.085+j*.033),1.77+j*.045,-.035-j*.022),b=a.clone().add(new T.Vector3(sign*.035,.055,-.025));
     between(prefix+'Branch_'+sign+'_'+j,head,a,b,.016-j*.003,mat(trim));
     if(v.head==='antlers'&&j>0)between(prefix+'Fork_'+sign+'_'+j,head,a,a.clone().add(new T.Vector3(-sign*.035,.06,.01)),.008,mat(trim));
    }
   }else if(v.head==='halo'||v.head==='eclipse'){
    const mesh=piece('Halo',head,new T.TorusGeometry(v.head==='eclipse'?.165:.145,.012,8,40,v.head==='eclipse'?Math.PI*1.7:Math.PI*2),0,1.87,-.09);mesh.rotation.z=.22;
    for(let j=0;j<5;j++){const t=j/5*Math.PI*2;piece('Star_'+j,head,new T.OctahedronGeometry(.018),Math.sin(t)*.15,1.87+Math.cos(t)*.15,-.09);}
   }else{
    ring('Circlet',.110,1.75,-.016);for(let j=-2;j<=2;j++)piece('Crown_'+j,head,new T.ConeGeometry(.018,.06+(2-Math.abs(j))*.018,4),j*.043,1.80,.05);
   }
  }else if(slot==='armor'){
   const rows=v.style==='lamellar'?5:v.style==='plate'?3:2;
   for(let j=0;j<rows;j++)for(const sign of [-1,1]){
    const mesh=piece('Chest_Lame_'+j+'_'+sign,'spine_03',new T.BoxGeometry(v.style==='lamellar'?.065:.078,.026,.012),sign*.105,1.38-j*.042,.166,[1,1,1],Q([0,0,1],-sign*.20));
    mesh.userData.slot='armor';
   }
   if(v.style==='coat'||v.style==='robe'){
    for(const sign of [-1,1])for(let j=0;j<5;j++)piece('Hem_Stud_'+sign+'_'+j,'pelvis',new T.OctahedronGeometry(.013),sign*(.16+j*.015),.93-j*.04,.13);
    at(prefix+'Sash','spine_03',new T.BoxGeometry(.042,.35,.018),mat(trim,.15),0,1.28,.177,[1,1,1],Q([0,0,1],-.38));
   }else{
    for(const [side,sign]of [['l',1],['r',-1]]){const p=pos('upperarm_'+side);for(let j=0;j<2;j++){const shape=v.theme==='glass'?new T.OctahedronGeometry(.07):new T.ConeGeometry(.04,.12,5);piece('Shoulder_Crest_'+side+j,'upperarm_'+side,shape,p.x+sign*(.03+j*.04),p.y+.05,p.z-.02,[1,1,1],Q([0,0,1],-sign*.65));}}
   }
   piece('Heart_Seal','spine_03',new T.OctahedronGeometry(.031),0,1.35,.184,[.8,1.3,.4]);
  }else if(slot==='gloves'){
   for(const side of ['l','r']){const p=pos('lowerarm_'+side).lerp(pos('hand_'+side),.80);piece('Cuff_'+side,'lowerarm_'+side,new T.TorusGeometry(.052,.009,6,20),...p.toArray(),[1,1,1],Q([0,0,1],Math.PI/2));const h=pos('hand_'+side);piece('Backplate_'+side,'hand_'+side,new T.OctahedronGeometry(.045),h.x,h.y,h.z+.04,[.8,1.4,.32]);}
  }else if(slot==='boots'){
   for(const side of ['l','r']){const p=pos('calf_'+side);piece('Shin_'+side,'calf_'+side,new T.BoxGeometry(.06,.15,.018),p.x,.25,-.003);const f=pos('foot_'+side);piece('Ankle_'+side,'foot_'+side,new T.TorusGeometry(.055,.009,6,20),f.x,.10,-.06,[1,1,1],Q([1,0,0],Math.PI/2));}
  }else if(slot==='belt'){
   piece('Buckle','pelvis',v.theme==='clock'?new T.TorusGeometry(.047,.008,6,20):new T.OctahedronGeometry(.046),0,1.02,.197,[1,.8,.35]);
   for(const sign of [-1,1])at(prefix+'Pouch_'+sign,'pelvis',new T.BoxGeometry(.07,.09,.045),mat(base,.05),sign*.19,1.01,.07);
  }else if(slot==='amulet')piece('Pendant','spine_03',new T.TorusGeometry(.032,.007,6,18),0,1.36,.20);
  else if(slot.startsWith('ring')){const side=slot==='ring1'?'l':'r';const p=pos('index_01_'+side);piece('Stone_'+side,'index_01_'+side,new T.OctahedronGeometry(.008),p.x,p.y+.016,p.z+.012);}
 }
 actor.gearDetails=active;return active;
}
