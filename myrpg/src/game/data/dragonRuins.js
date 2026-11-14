import {DIA_LONG_MONSTER_STATS} from './diaLongForest.js';

export const DRAGON_RUINS_MONSTER_STATS={
 ...DIA_LONG_MONSTER_STATS,
 hp:Math.ceil(DIA_LONG_MONSTER_STATS.hp*1.5),
 damage:Math.ceil(DIA_LONG_MONSTER_STATS.damage*1.5),
 exp:Math.ceil(DIA_LONG_MONSTER_STATS.exp*1.5),
 gold:Math.ceil(DIA_LONG_MONSTER_STATS.gold*1.5),
 moveSpeed:Math.ceil(DIA_LONG_MONSTER_STATS.moveSpeed*1.5),
 detectionRange:Math.ceil(DIA_LONG_MONSTER_STATS.detectionRange*1.5),
 chaseRange:Math.ceil(DIA_LONG_MONSTER_STATS.chaseRange*1.5),
 dropChance:(DIA_LONG_MONSTER_STATS.dropChance??.25)*1.5
};

const pack=(name,texture,dropItem,locations)=>locations.map(([col,row])=>({
 ...DRAGON_RUINS_MONSTER_STATS,name,texture:`ruins-${texture}-0`,
 animation:`ruins-${texture}-walk`,dropItem,col,row
}));

export const dragonRuins={
 id:'dragon-ruins',title:'PHẾ TÍCH ĐỊA LONG',tileSize:48,cols:42,rows:34,
 tileset:'dungeon',groundFrame:14,backgroundColor:'#171e24',
 player:{x:1008,y:1416,texture:'dungeon',frame:96,scale:3,speed:200},
 monsters:[
  ...pack('Long Cốt Vệ Sĩ','guard','dragon_bone',[[7,7],[11,8],[30,7],[34,9]]),
  ...pack('Địa Long Vảy Ngọc','wyrm','ancient_dragon_scale',[[7,20],[12,23],[29,20],[34,23]]),
  ...pack('Long Ưng Tàn Tích','raptor','jade_dragon_core',[[17,6],[20,5],[24,6],[27,5]])
 ],
 npcs:[{
  id:'dragon-ruins-key-smith',name:'Thợ rèn Long Kha',role:'dragon-cache-exchange',
  frame:88,col:14.5,row:29.5,
  lines:['Mang tổng cộng 50 vật phẩm rơi từ quái Phế Tích Địa Long để đổi lấy một chìa khóa.','Sau đó mở Sự kiện → Rương Địa Long để quay một món trang bị phù hợp với class của bạn.']
 }],
 bossArenaPortal:{x:21*48,feetY:15*48,target:'DiaLongBoss',spawn:{x:21*48,y:22*48}},
 portals:[{
  kind:'doorway',x:1008,feetY:1536,width:192,height:96,
  label:'Về Khu Rừng Địa Long',target:'DiaLongForest',
  spawn:{x:1980,y:768}
 }]
};
