import * as T from 'three';
import {EXTRA_THEMES} from './expansion-data.js';
import {CELL} from './maps.js';
export class ExpansionScenery{
 constructor(world){this.world=world;this.moving=[];this.root=new T.Group();this.root.name='world-memory-architecture';world.root.add(this.root);const theme=world.map.region.theme,p=EXTRA_THEMES[theme];if(!p)return;
  const stone=world.material(p[1]),metal=world.material(p[2],.65),glow=world.material(p[2],.1);glow.emissive.setHex(p[2]);glow.emissiveIntensity=.32;
  const add=(parent,g,m,x=0,y=0,z=0)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  for(const [i,r]of world.map.rooms.entries()){
   const root=new T.Group();root.position.set((r.x-17)*CELL,0,(r.z-17)*CELL);this.root.add(root);
   // Scenery stays along room edges; the navigable floor and telegraphs remain readable.
   for(const sign of [-1,1]){
    const x=sign*(r.w/2*CELL-.75),z=-r.h/2*CELL+.7;
    if(theme==='glass'){
     const frame=add(root,new T.TorusGeometry(.85,.075,6,6),metal,x,1.8,z);frame.scale.set(1,1.7,1);frame.rotation.z=i*.35;
     const pane=add(root,new T.OctahedronGeometry(.85),stone,x,1.8,z);pane.scale.set(.85,1.5,.12);add(root,new T.BoxGeometry(.04,2.0,.03),glow,x,1.8,z+.15);
     const shard=add(root,new T.OctahedronGeometry(.22),glow,x+sign*.6,2.7,z);this.moving.push({mesh:shard,y:2.7,phase:i+sign,spin:.18});
    }else if(theme==='ink'){
     const shelf=add(root,new T.BoxGeometry(1.5,1.9,.35),stone,x,1.0,z);shelf.rotation.z=sign*.09;
     for(let j=0;j<4;j++)add(root,new T.BoxGeometry(1.6,.045,.45),metal,x,.35+j*.48,z+.08);
     for(let j=0;j<6;j++){const page=add(root,new T.BoxGeometry(.27,.025,.35),j%2?metal:glow,x+Math.sin(j)*.65,1.3+j*.25,z+.5);page.rotation.z=j*.4;this.moving.push({mesh:page,y:page.position.y,phase:i+j,spin:0});}
    }else if(theme==='tide'){
     const bowl=add(root,new T.SphereGeometry(.75,20,12,0,Math.PI*2,0,Math.PI/2),metal,x,1.3,z);bowl.rotation.x=Math.PI;
     const water=add(root,new T.CircleGeometry(.7,24),glow,x,1.29,z);water.rotation.x=-Math.PI/2;
     for(let j=0;j<4;j++){const drop=add(root,new T.IcosahedronGeometry(.06+j*.02),glow,x+Math.sin(j)*.32,1.6+j*.30,z+Math.cos(j)*.3);this.moving.push({mesh:drop,y:drop.position.y,phase:j,spin:0});}
     add(root,new T.CylinderGeometry(.13,.35,1.3,10),stone,x,.65,z);
    }else if(theme==='clock'){
     const wheel=add(root,new T.TorusGeometry(.88,.12,8,32),metal,x,1.25,z);for(let j=0;j<12;j++){const a=j/12*Math.PI*2,tooth=add(wheel,new T.BoxGeometry(.18,.23,.18),stone,Math.sin(a)*.92,Math.cos(a)*.92,0);tooth.rotation.z=-a;}
     this.moving.push({mesh:wheel,y:1.25,phase:0,spin:sign*.13,axis:'z',fixed:true});add(root,new T.BoxGeometry(.12,2.3,.14),stone,x,1.15,z+.03);
    }else if(theme==='root'){
     for(let j=0;j<3;j++){const stalk=add(root,new T.TorusGeometry(.7+j*.13,.10,6,16,Math.PI*1.25),stone,x+sign*j*.15,.9+j*.5,z);stalk.rotation.z=sign*.5;}
     for(let j=0;j<5;j++){const a=j/5*Math.PI*2,petal=add(root,new T.SphereGeometry(.35,10,6),j%2?metal:glow,x+Math.sin(a)*.4,2.3+Math.cos(a)*.4,z);petal.scale.set(.5,1,.2);petal.rotation.z=-a;}
    }else{
     for(let j=0;j<3;j++){const ring=add(root,new T.TorusGeometry(.65+j*.18,.035,6,32,Math.PI*1.7),j%2?metal:stone,x,1.6,z);ring.rotation.x=j*.8;this.moving.push({mesh:ring,y:1.6,phase:j,spin:(j%2?1:-1)*.15,axis:'y'});}
     add(root,new T.OctahedronGeometry(.17),glow,x,1.6,z);
    }
   }
   if(i===8){const ring=add(root,new T.TorusGeometry(3.3,.03,6,64),metal,0,.028,0);ring.rotation.x=-Math.PI/2;}
  }
 }
 tick(time){for(const o of this.moving){if(!o.fixed)o.mesh.position.y=o.y+Math.sin(time*.8+o.phase)*.12;if(o.spin)o.mesh.rotation[o.axis||'y']+=o.spin/60;}}
}
