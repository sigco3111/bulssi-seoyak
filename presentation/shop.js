import {chapterFor} from '../combat/expansion-data.js';
import {audio} from './audio.js';
import {rollItem} from '../combat/progression.js';
export const itemPrice=item=>Math.round((25+item.level*8+(item.damage?(item.damage[0]+item.damage[1])*.65:12))*({normal:1,magic:1.5,rare:2.2,unique:5}[item.rarity]||1));
export function shopOffers(design,profile,npc){
 const gate=Math.min(60,Math.max(profile.level+4,6));let seed=profile.seed+profile.tier*901+profile.level*31;
 return design.equipment.items.filter(i=>i.rarity!=='unique'&&(!i.expansion||chapterFor(i.source)?.regions.some(id=>profile.unlocked.includes(id)))&&i.level<=gate&&(npc==='smith'?i.slot==='mainhand':npc==='keeper'?['amulet','ring'].includes(i.slot):['armor','helm','gloves','boots','offhand','belt','ring','amulet'].includes(i.slot))).map((base,index)=>{const n=(seed+(index+1)*811)>>>0,item=rollItem(design,base.id,n);return{item,baseId:base.id,price:itemPrice(item)};});
}
export function buyOffer(arena,offer){
 const p=arena.profileData;if(arena.mode!=='campaign'||arena.region.id!=='camp')return{ok:false,message:'야영지의 상인과 거래할 수 있습니다.'};
 if(!offer||!Number.isFinite(offer.price)||offer.price<1)return{ok:false,message:'물건을 먼저 골라 주세요.'};
 if(p.inventory.includes(offer.item.id))return{ok:false,message:'이미 구입해 가방에 보관한 장비입니다.'};
 if(p.inventory.length>=150)return{ok:false,message:'가방이 가득 찼습니다. 장비를 분해해 주세요.'};
 if(arena.gold<offer.price)return{ok:false,message:'금화가 '+(offer.price-arena.gold)+'개 부족합니다.'};
 const item=offer.item;arena.gold-=offer.price;designRegister(arena.design,item);p.inventory.push(item.id);p.instances.push({id:item.id,baseId:item.baseId,seed:item.seed,upgrade:0});arena.mapRevision++;arena.persist();arena.drawInventory();audio.play('buy');return{ok:true,message:item.name+'을 구입했습니다. 가방에서 장착할 수 있습니다.'};
}
function designRegister(design,item){design.runtimeItems??=new Map();design.runtimeItems.set(item.id,item);}
export function rewardArrival(arena){const p=arena.profileData;if(p.quests.arrival)return false;p.quests.arrival=true;arena.gold+=90;p.ore+=2;p.potions.hp=Math.min(99,p.potions.hp+2);arena.mapRevision++;arena.persist();return true;}
