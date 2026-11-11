import * as T from 'three';
import {CELL,SIZE,isWalkable} from './maps.js';
import soil from '../presentation/art/generated/soil-v1.webp';
import cobble from '../presentation/art/generated/cobble-v1.webp';
import wood from '../presentation/art/generated/wood-v1.webp';
import rock from '../presentation/art/generated/rock-v1.webp';
import pine from '../presentation/art/generated/pine-v1.webp';

export function paintedTexture(world,kind){
 const texture=new T.TextureLoader().load({soil,cobble,wood,rock,pine}[kind]);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 if(kind!=='pine')texture.wrapS=texture.wrapT=T.RepeatWrapping;
 world.textures??=[];world.textures.push(texture);return texture;
}

// Buildings keep their whole footprint outside the walkable ground.
function clearSite(world,x,z,radius){
 for(let r=0;r<=16;r+=.6)for(let i=0;i<(r?20:1);i++){
  const a=i/20*Math.PI*2,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
  if(Math.abs(px)>27||Math.abs(pz)>27)continue;
  let clear=true;
  for(let dx=-radius;dx<=radius;dx+=.45)for(let dz=-radius;dz<=radius;dz+=.45)if(isWalkable(world.map,px+dx,pz+dz,.12))clear=false;
  if(clear)return {x:px,z:pz};
 }
 return null;
}

export class PaintedWorld{
 constructor(world){
  this.world=world;this.root=new T.Group();this.root.name='painted-meadow';world.root.add(this.root);this.geometries=[];this.treeCount=0;
  const mat=(color,texture,metalness=0)=>{const m=world.material(color,metalness);if(texture){m.map=texture;m.bumpMap=texture;m.bumpScale=.045;}return m;};
  this.stone=mat(0xb2b3a5,paintedTexture(world,'rock'));
  this.wood=mat(0xb6a790,paintedTexture(world,'wood'));
  this.iron=mat(0x5e696a,null,.65);this.brass=mat(0x9e8a60,null,.55);
  this.buildTrees();this.textureExistingScenery();
  if(world.map.region.id==='meadow'){this.buildWaterway();this.buildMill();this.buildCamp();}
  else if(world.map.region.id==='camp'){
   const material=world.material(0xb8b6a5);material.map=paintedTexture(world,'cobble');material.map.repeat.set(3,3);material.bumpMap=material.map;material.bumpScale=.04;
   const geometry=new T.CircleGeometry(5.0,48);this.geometries.push(geometry);const plaza=new T.Mesh(geometry,material);plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.012,-1.65);plaza.receiveShadow=true;this.root.add(plaza);
  }
 }
 box(parent,material,x,y,z,sx,sy,sz){const g=new T.BoxGeometry(sx,sy,sz);this.geometries.push(g);const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 cylinder(parent,material,r,height,x,y,z){const g=new T.CylinderGeometry(r,r,height,12);this.geometries.push(g);const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 textureExistingScenery(){
  const world=this.world;
  for(const material of Object.values(world.landmarkView?.mat||{})){
   if(material===world.landmarkView.mat.stone||material===world.landmarkView.mat.ivory){material.map=this.stone.map;material.bumpMap=this.stone.map;material.bumpScale=.04;material.needsUpdate=true;}
   if(material===world.landmarkView.mat.wood){material.map=this.wood.map;material.needsUpdate=true;}
  }
 }
 buildTrees(){
  const world=this.world,map=world.map,random=world.random,texture=paintedTexture(world,'pine');
  world.root.traverse(o=>{if(o.name==='procedural-conifer')o.visible=false;});
  const spots=[];
  for(let z=2;z<SIZE-2;z+=3)for(let x=2;x<SIZE-2;x+=3){
   if(map.tiles[z*SIZE+x])continue;
   const wx=(x-17)*CELL,wz=(z-17)*CELL;
   if(![[1,0],[-1,0],[0,1],[0,-1],[2,0],[0,2]].some(([dx,dz])=>map.tiles[(z+dz)*SIZE+x+dx]))continue;
   if(map.objects.some(o=>Math.hypot(o.x-wx,o.z-wz)<3.6))continue;
   spots.push({x:wx,z:wz});
  }
  for(const p of spots.slice(0,40)){
   const material=new T.SpriteMaterial({map:texture,color:0xd9ddce,transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false});
   world.resources.push(material);const tree=new T.Sprite(material);tree.center.set(.43,.05);tree.scale.set(4.8+random()*1.4,4.4+random()*1.1,1);
   const g=new T.Group();g.position.set(p.x,0,p.z);g.add(tree);if(world.heroContact){const shade=world.heroContact.material.clone();shade.opacity=.55;world.resources.push(shade);const geo=new T.PlaneGeometry(2.8,2.2);this.geometries.push(geo);const contact=new T.Mesh(geo,shade);contact.rotation.x=-Math.PI/2;contact.position.y=.025;g.add(contact);}this.root.add(g);
   world.occluders.push({root:g,materials:[material],center:new T.Vector3(p.x,2.2,p.z),radius:2.8,phase:random()*6,opacity:1});this.treeCount++;
  }
 }
 buildWaterway(){
  const world=this.world,map=world.map,open=!!map.shortcutOpen;
  const water=world.material(0x487d79,.18);water.transparent=true;water.opacity=.66;water.roughness=.22;water.depthWrite=false;
  this.water=water;const geometry=new T.PlaneGeometry(CELL*.97,CELL*.97);this.geometries.push(geometry);
  const cells=map.shortcutCells,plane=new T.InstancedMesh(geometry,water,cells.length),d=new T.Object3D();
  for(let i=0;i<cells.length;i++){const k=cells[i];d.position.set((k%SIZE-17)*CELL,open?-.14:.035,(Math.floor(k/SIZE)-17)*CELL);d.rotation.x=-Math.PI/2;d.updateMatrix();plane.setMatrixAt(i,d.matrix);}
  this.root.add(plane);this.waterPlane=plane;
  if(open){
   const stone=world.material(0xc2c3b4);stone.map=paintedTexture(world,'cobble');stone.bumpMap=stone.map;stone.bumpScale=.04;
   const path=new T.InstancedMesh(geometry,stone,cells.length);
   for(let i=0;i<cells.length;i++){const k=cells[i];d.position.set((k%SIZE-17)*CELL,.013,(Math.floor(k/SIZE)-17)*CELL);d.rotation.set(-Math.PI/2,0,(i%4)*Math.PI/2);d.updateMatrix();path.setMatrixAt(i,d.matrix);}
   path.receiveShadow=true;this.root.add(path);
  }
  const control=world.objects.get('seal-1');if(control){
   control.group.children.forEach(o=>o.visible=false);
   this.cylinder(control.group,this.stone,.35,.65,0,.32,0);
   const ringGeo=new T.TorusGeometry(.4,.045,8,32);this.geometries.push(ringGeo);const ring=new T.Mesh(ringGeo,this.brass);ring.position.set(0,1.0,0);ring.rotation.x=-.5;control.group.add(ring);
   for(let j=0;j<4;j++){const spoke=this.box(ring,this.iron,0,0,0,.77,.035,.035);spoke.rotation.z=j*Math.PI/4;}
   this.control=ring;
  }
 }
 buildMill(){
  const w=this.world,def=w.map.objects.find(o=>o.id==='seal-1');if(!def)return;
  const p=clearSite(w,def.x+3.6,def.z-2.4,2.05);if(!p)return;
  const g=new T.Group();g.position.set(p.x,0,p.z);this.root.add(g);
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
   const x=(col-2)*.66+(row%2)*.12,y=.28+row*.56;
   if(col===2&&row<3)continue;
   const b=this.box(g,this.stone,x,y,-.5,.62,.51,.65);b.rotation.z=Math.sin(row*3+col)*.025;
  }
  this.box(g,this.wood,0,2.91,-.5,3.8,.22,1.25);
  for(const side of [-1,1]){const roof=this.box(g,this.wood,side*.78,3.32,-.5,1.8,.10,1.6);roof.rotation.z=-side*.48;}
  const wheel=new T.Group();wheel.position.set(0,1.2,.45);g.add(wheel);this.wheel=wheel;
  for(const z of [-.27,.27]){const geo=new T.TorusGeometry(1.10,.085,8,40);this.geometries.push(geo);const rim=new T.Mesh(geo,this.wood);rim.position.z=z;wheel.add(rim);}
  for(let i=0;i<12;i++){
   const a=i/12*Math.PI*2;const paddle=this.box(wheel,this.wood,Math.cos(a)*1.09,Math.sin(a)*1.09,0,.31,.12,.65);paddle.rotation.z=a;
   if(i%2===0){const spoke=this.box(wheel,this.wood,0,0,0,2.1,.07,.07);spoke.rotation.z=a;}
  }
  const axle=this.cylinder(wheel,this.iron,.12,.85,0,0,0);axle.rotation.x=Math.PI/2;
  this.box(g,this.stone,0,.12,.5,3.8,.24,2.1);
  // The physical site is tested by its footprint, independent of camera decoration.
  this.millSite={x:p.x,z:p.z,radius:2.05};
 }
 buildCamp(){
  const w=this.world,def=w.map.objects.find(o=>o.id==='seal-0');if(!def)return;
  const marker=w.objects.get('seal-0');if(marker){marker.group.children.forEach(o=>o.visible=false);this.box(marker.group,this.wood,0,.18,0,.76,.36,.52);this.box(marker.group,this.brass,0,.375,0,.58,.018,.36);}
  const site=clearSite(w,def.x-3,def.z+1.5,1.05);if(!site)return;
  const g=new T.Group();g.position.set(site.x,0,site.z);this.root.add(g);
  this.box(g,this.wood,0,.55,0,1.6,.15,.9);
  for(const x of [-.7,.7])for(const z of [-.47,.47]){const geo=new T.TorusGeometry(.36,.055,8,20);this.geometries.push(geo);const wheel=new T.Mesh(geo,this.iron);wheel.position.set(x,.36,z);g.add(wheel);}
  this.box(g,this.wood,.2,.84,0,.55,.45,.58);const shaft=this.box(g,this.wood,-1.1,.38,0,.9,.07,.07);shaft.rotation.z=-.18;
 }
 animate(time,dt){if(this.wheel&&this.world.map.shortcutOpen)this.wheel.rotation.z-=dt*.24;if(this.water)this.water.opacity=.59+Math.sin(time*.8)*.035;}
 snapshot(){return{trees:this.treeCount,textured:true,watergateOpen:!!this.world.map.shortcutOpen,shortcutCells:this.world.map.shortcutCells?.length||0,mill:this.millSite||null};}
}
