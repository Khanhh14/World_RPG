import {tuLinhWeaponIcon} from './tuLinhWeapons.js';

const weapon={
 type:'weapon',category:'event-weapon',level:6,maxStack:1,attack:120,price:0,sellPrice:10,eventId:'hunt-monsters'
};
export const HUNT_EVENT_WEAPONS={
 doat_hon_kiem:{...weapon,name:'Đoạt Hồn Kiếm',classCode:'swordsman',icon:'doat_hon_kiem',description:'+120 công. Vũ khí sự kiện dành cho Kiếm sĩ.'},
 doat_hon_truong:{...weapon,name:'Đoạt Hồn Trượng',classCode:'mage',icon:'doat_hon_truong',description:'+120 công. Vũ khí sự kiện dành cho Pháp sư.'},
 doat_hon_phu:{...weapon,name:'Đoạt Hồn Phủ',classCode:'fighter',icon:'doat_hon_phu',description:'+120 công. Vũ khí sự kiện dành cho Đấu sĩ.'}
};
export const HUNT_EVENT_OFFHAND={
 shockwave_charm:{
  name:'Linh Phù Chấn Động',type:'shield',category:'special',offhandKind:'orb',icon:'orb',
  level:6,price:0,sellPrice:10,maxStack:1,defense:20,maxHP:300,eventId:'hunt-monsters',
  specialSkill:{id:'shockwave',name:'Chấn Động',mana:30,cooldown:15000,radius:150,multiplier:.75,icon:'nova'},
  description:'+20 thủ · +300 HP tối đa. Kỹ năng F: tạo vùng chấn động quanh người, gây 75% công lên quái trong vùng.'
 }
};
export const HUNT_EVENT_ITEMS={...HUNT_EVENT_WEAPONS,...HUNT_EVENT_OFFHAND};
export const huntEventWeaponIcon=(id,size=40)=>HUNT_EVENT_WEAPONS[id]?tuLinhWeaponIcon(id,size):'';
