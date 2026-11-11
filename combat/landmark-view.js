import * as T from 'three';
import {isWalkable} from './maps.js';

// Scenery is visual only: navigation remains owned by the map grid.
export class LandmarkView {
 constructor(world) {
  this.world=world; this.root=new T.Group(); this.root.name='landmarks'; world.root.add(this.root);
  this.theme=world.map.region?.theme; this.ids=[]; this.moving=[]; this.meshCount=0; this.usedGeometry=new Set();
  this.reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.geo={box:new T.BoxGeometry(1,1,1),column:new T.CylinderGeometry(.5,.5,1,8),ring:new T.TorusGeometry(1,.08,8,32),crystal:new T.OctahedronGeometry(1),disc:new T.CircleGeometry(1,32),cone:new T.ConeGeometry(1,1,12,1,true)};
  const palette={grass:0x6bbcc7,grave:0xa778d6,forest:0x78aa69,marsh:0x80d998,ridge:0xc68554,mine:0x61d4cc,abbey:0xd68d68};
  this.mat={stone:world.material(0x74786b),dark:world.material(0x303936),iron:world.material(0x343b39,.55),bronze:world.material(0xa0875e,.5),ivory:world.material(0xb7b09a),wood:world.material(0x5c4937),accent:world.material(palette[this.theme]||0x91b4a0,.2)};
  this.mat.water=world.material(this.theme==='marsh'?0x284641:0x477474,.08); this.mat.water.roughness=.38;
  this.mat.ripple=world.material(0x98cbb3); this.mat.ripple.transparent=true; this.mat.ripple.opacity=.42; this.mat.ripple.depthWrite=false;
  this.mat.accent.emissive=new T.Color(palette[this.theme]||0x91b4a0); this.mat.accent.emissiveIntensity=.28;
  for(const landmark of world.map.landmarks||[]) {
   if(!Number.isFinite(landmark.x)||!Number.isFinite(landmark.z)) continue;
   const group=new T.Group(); group.position.set(landmark.x,0,landmark.z); group.name='landmark-'+landmark.id; this.root.add(group);
   this.ids.push(landmark.id); const room=typeof landmark.room==='number'?landmark.room:Number(landmark.room?.index);
   if(room===0) this.gateway(group,false);
   else if(room===8) this.gateway(group,true);
   else this.discovery(group,room);
  }
  for(const geometry of Object.values(this.geo)) if(!this.usedGeometry.has(geometry)) geometry.dispose();
 }
 add(parent,shape,material,x,y,z,sx,sy,sz,rotation=0) {
  this.usedGeometry.add(this.geo[shape]); const obj=new T.Mesh(this.geo[shape],this.mat[material]);
  // Keep every ground-level solid outside the traversable grid, including its footprint.
  if(shape!=='disc' && shape!=='ring' && y-sy/2<3) {
   const center=parent.getWorldPosition(new T.Vector3()), radius=Math.max(sx,sz)*.72;
   const clear=(px,pz)=>{for(let dx=-radius;dx<=radius+.01;dx+=.4) for(let dz=-radius;dz<=radius+.01;dz+=.4) if(isWalkable(this.world.map,center.x+px+dx,center.z+pz+dz,.05)) return false; return true;};
   if(!clear(x,z)) { let found=false; for(let r=.5;r<=20&&!found;r+=.5) for(let a=0;a<16;a++) { const px=x+Math.cos(a*Math.PI/8)*r,pz=z+Math.sin(a*Math.PI/8)*r; if(clear(px,pz)){x=px;z=pz;found=true;break;} } }
  }
  obj.position.set(x,y,z); obj.scale.set(sx,sy,sz); obj.rotation.y=rotation;
  obj.receiveShadow=true; obj.castShadow=shape!=='disc'; parent.add(obj); this.meshCount++; return obj;
 }
 gateway(g,boss) {
  const side=boss?4.7:3.6, h=boss?4.1:3.7, pillars=[];
  for(const sign of [-1,1]) {
   const type=this.theme==='mine'?'box':'column', material=this.theme==='forest'?'wood':this.theme==='mine'?'iron':'stone';
   const base=this.add(g,type,material,sign*side,.47,0,1,.94,1); pillars.push(base);
   for(let n=1;n<4;n++) {
    const bend=this.theme==='forest'?sign*n*.15:0;
    const block=this.add(g,type,material,base.position.x+bend,.47+n*.87,base.position.z,.92-n*.04,.88,.92-n*.04);
    block.position.set(base.position.x+bend,.47+n*.87,base.position.z);
    if(this.theme==='forest') block.rotation.z=-sign*.16;
    else if(this.theme!=='mine') block.rotation.y=n*.12*sign;
   }
   const topX=base.position.x+(this.theme==='forest'?sign*.45:0);
   // Each edge ends in a short broken arch, leaving the centre open.
   const shard=this.add(g,'box',material,topX-sign*.52,3.5,base.position.z,1.2,.3,.65);
   shard.position.set(topX-sign*.52,3.5,base.position.z); shard.rotation.z=sign*.28;
   const broken=this.add(g,'crystal',material,topX-sign*1.05,3.34,base.position.z,.22,.2,.35);
   broken.position.set(topX-sign*1.05,3.34,base.position.z);
  }
  if(boss) for(const sign of [-1,1]) {
   const pier=this.add(g,'column','stone',sign*(side+1.4),.75,-1.5,.7,1.5,.7);
   const fragment=this.add(g,'crystal','stone',pier.position.x,1.53,pier.position.z,.35,.23,.35);
   fragment.position.set(pier.position.x,1.53,pier.position.z);
  }
  this.themeDetail(g,side,h,boss,pillars);if(boss)this.bossSigil(g);
 }

 themeDetail(g,side,h,boss,pillars) {
  const A=(...args)=>this.add(g,...args), t=this.theme;
  if(t==='grass') {
   const basins=[]; for(const s of [-1,1]) { const basin=A('box','stone',s*(side+1),2.35,-.8,1.4,.35,1.4); const water=A('box','water',basin.position.x,2.53,basin.position.z,1.2,.06,1.2); water.position.set(basin.position.x,2.53,basin.position.z); basins.push(basin); }
   const wheel=A('ring','wood',basins[1].position.x,1.5,basins[1].position.z+.75,1.1,1.1,1); for(let i=0;i<4;i++){const spoke=A('box','wood',0,0,0,1.8,.09,.09); wheel.add(spoke); spoke.rotation.z=i*Math.PI/4;}
   this.moving.push({type:'wheel',object:wheel});
  } else if(t==='grave') {
   for(const s of [-1,1]) { const tomb=A('box','stone',s*(side+1),1.6,-1,1.1,3.2,.8); const seal=A('box','bronze',tomb.position.x,1.8,tomb.position.z+.45,.75,.12,.1); seal.position.set(tomb.position.x,1.8,tomb.position.z+.45); const crack=A('box','accent',tomb.position.x,1.4,tomb.position.z+.51,.07,1.8,.07); crack.position.set(tomb.position.x,1.4,tomb.position.z+.51); crack.rotation.z=s*.24; }
  } else if(t==='forest') {
   for(const s of [-1,1]) { const root=A('column','wood',s*(side+1),1.7,-.6,1.1,3.7,1.1); root.rotation.z=s*.28; const crown=A('crystal','accent',root.position.x,3.5,root.position.z,.42,.7,.42); crown.position.set(root.position.x,3.5,root.position.z); }
   for(const p of pillars) { const knot=A('ring','accent',p.position.x,2.2,p.position.z+.52,.37,.37,.37); knot.position.set(p.position.x,2.2,p.position.z+.52); }
  } else if(t==='marsh') {
   for(const sign of [-1,1]) {
    const x=sign*(side+1), pool=A('disc','water',x,.025,-.6,1.15,.72,1); pool.rotation.x=-Math.PI/2;
    for(let i=0;i<3;i++) { const radius=.22+i*.17, ripple=A('ring','ripple',x+(i-1)*.16,.045+i*.004,-.6,.25+i*.17,.25+i*.17,.25+i*.17); ripple.rotation.x=-Math.PI/2; this.moving.push({type:'ripple',object:ripple,base:radius}); }
    for(let i=0;i<3;i++) { const reed=A('column','wood',x+sign*(.65+i*.13),.5,-1+i*.18,.045,.9+i*.12,.045); reed.rotation.z=sign*(.1+i*.08); }
   }
  } else if(t==='ridge') {
   for(const s of [-1,1]) { const pole=A('column','iron',s*(side+1.1),3.1,-.7,.1,5,.1); const flag=A('box','accent',pole.position.x+s*.6,4.9,pole.position.z,1.2,.65,.06); this.moving.push({type:'flag',object:flag,phase:s}); }
  } else if(t==='mine') {
   for(const s of [-1,1]) { A('box','iron',s*(side+1),2,-.7,.22,4,.22).rotation.z=s*.18; for(let i=0;i<3;i++) A('crystal','accent',s*(side+1.3+i*.25),.5+i*.22,-.8,.25,.65+i*.13,.25).rotation.z=s*.25; }
  } else if(t==='abbey') {
   const p=pillars[0], wx=p.position.x, wz=p.position.z+.55;
   const window=A('ring','bronze',wx,2.65,wz,.68,.68,.68); window.position.set(wx,2.65,wz);
   const glass=A('disc','accent',wx,2.65,wz-.06,.52,.52,1); glass.position.set(wx,2.65,wz-.06);
   for(let i=0;i<4;i++){const spoke=A('box','bronze',wx,2.65,wz+.05,1.05,.045,.05); spoke.position.set(wx,2.65,wz+.05); spoke.rotation.z=i*Math.PI/4;}
   for(const s of [-1,1]) { const plinth=A('box','stone',s*(side+1),.65,-.7,.8,1.3,.8); const bell=A('cone','bronze',plinth.position.x,2,-.7,.7,1.4,.7); bell.position.set(plinth.position.x,2,plinth.position.z); bell.rotation.z=Math.PI; const flame=A('crystal','accent',plinth.position.x,2.85,plinth.position.z,.16,.3,.16); flame.position.set(plinth.position.x,2.85,plinth.position.z); }
  }
 }
 bossSigil(parent){const group=new T.Group();group.position.y=2.7;parent.add(group);this.bossSeal=group;const hue=this.mat.accent.color,glow=new T.MeshBasicMaterial({color:hue,transparent:true,opacity:.60,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),dim=new T.MeshBasicMaterial({color:hue,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});this.world.resources.push(glow,dim);const ring=(radius,y,tilt=0)=>{const geo=new T.TorusGeometry(radius,.018,6,64),o=new T.Mesh(geo,glow);o.position.y=y;o.rotation.x=tilt;group.add(o);this.meshCount++;return o;},shape=(geo,mat,x,y,z)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);group.add(o);this.meshCount++;return o;};
 const outer=ring(1.25,0);outer.rotation.z=.25;ring(.92,0,Math.PI/2);for(let i=0;i<8;i++){const a=i/8*Math.PI*2,o=shape(new T.OctahedronGeometry(.06),glow,Math.cos(a)*1.25,Math.sin(a)*1.25,.025);o.scale.y=1.8;}
 if(this.theme==='abbey'){const bell=shape(new T.ConeGeometry(.68,1.1,24,1,true),this.mat.bronze,0,0,0);bell.rotation.x=Math.PI;const rim=ring(.67,-.55,Math.PI/2);shape(new T.OctahedronGeometry(.16),glow,0,-.56,0);}
 else if(this.theme==='forest'){for(let i=0;i<6;i++){const a=i/6*Math.PI*2,leaf=shape(new T.SphereGeometry(.29,10,6),dim,Math.sin(a)*.5,Math.cos(a)*.5,0);leaf.scale.set(.45,1.8,.28);leaf.rotation.z=-a;}shape(new T.OctahedronGeometry(.26),glow,0,0,0);}
 else if(this.theme==='marsh'){for(let i=0;i<3;i++){const drop=shape(new T.SphereGeometry(.23,12,12),dim,(i-1)*.42,Math.sin(i*2)*.2,0);drop.scale.y=1.65;}ring(.6,.04,.4);}
 else if(this.theme==='grave'){for(let i=0;i<5;i++){const a=i/5*6.28,shard=shape(new T.OctahedronGeometry(.26),dim,Math.sin(a)*.55,Math.cos(a)*.55,0);shard.scale.y=1.8;shard.rotation.z=-a;}ring(.5,0,.5);}
 else if(this.theme==='ridge'){for(let i=0;i<3;i++){const arc=ring(.45+i*.14,(i-1)*.24,Math.PI/2);arc.scale.x=1.4;}shape(new T.OctahedronGeometry(.22),dim,0,0,0);}
 else if(this.theme==='mine'){for(let i=0;i<3;i++){const crystal=shape(new T.OctahedronGeometry(.38),this.mat.accent,(i-1)*.35,Math.sin(i*2)*.22,0);crystal.scale.y=1.8;crystal.rotation.z=(i-1)*.35;}}
 else{ring(.65,0,.65);ring(.65,0,-.65);shape(new T.IcosahedronGeometry(.28,1),dim,0,0,0);}
 this.moving.push({type:'sigil',object:group});
 }
 discovery(g,room) {
  const A=(...args)=>this.add(g,...args), t=this.theme, s=room===6?-1:1, x=s*3.4;
  const base=A('box','stone',x,.28,0,1.8,.55,1.4); const anchor=new T.Group(); anchor.position.copy(base.position); anchor.position.y=0; g.add(anchor); const B=(shape,material,px,y,pz,sx,sy,sz,rotation=0)=>{const o=A(shape,material,0,y,0,sx,sy,sz,rotation); anchor.add(o); o.position.set(px,y,pz); return o;};
  if(t==='grass'||t==='marsh') { const pool=B('disc','water',0,.59,0,.68,.55,1); pool.rotation.x=-Math.PI/2; for(let i=0;i<2;i++){const radius=.22+i*.17, ring=B('ring','ripple',i*.15-.08,.61+i*.005,0,radius,radius,radius); ring.rotation.x=-Math.PI/2; this.moving.push({type:'ripple',object:ring,base:radius});} }
  else if(t==='mine'||t==='grave') { for(let i=0;i<3;i++) B('crystal','accent',(i-1)*.34,1.1+i%2*.25,0,.25,.65+i%2*.35,.25).rotation.z=(i-1)*.22; }
  else if(t==='forest') { B('column','wood',0,1.4,0,.55,2.3,.55).rotation.z=.25; B('ring','accent',0,2.3,.1,.55,.55,.55); }
  else if(t==='ridge') { B('column','iron',0,1.7,0,.1,2.6,.1); const flag=B('box','accent',.55,2.65,0,1,.5,.06); this.moving.push({type:'flag',object:flag,phase:x}); }
  else if(t==='abbey') { B('column','bronze',0,1.1,0,.35,1.1,.35); B('crystal','accent',0,1.85,0,.17,.42,.17); }
 }
 animate(time,dt) {
  if(this.reduced) return;
  for(const item of this.moving) {
   if(item.type==='sigil'){item.object.position.y=2.7+Math.sin(time*.8)*.07;item.object.rotation.y=Math.sin(time*.24)*.15;}else if(item.type==='wheel') item.object.rotation.z=time*.18;
   else if(item.type==='flag') item.object.rotation.y=Math.sin(time*1.4+item.phase)*.17;
   else if(item.type==='ripple') { const scale=item.base*(1+.08*Math.sin(time*1.5)); item.object.scale.set(scale,scale,scale); }
  }
  this.mat.accent.emissiveIntensity=.28+.07*Math.sin(time*1.5);
 }
 snapshot() { return {theme:this.theme,landmarkIds:[...this.ids],meshes:this.meshCount,animated:this.moving.length,particles:0}; }
 // WorldView owns and disposes the attached geometries and registered materials.
 dispose() { this.moving.length=0; }
}
