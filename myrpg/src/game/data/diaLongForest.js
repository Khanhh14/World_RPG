import {NOXII_MONSTER_STATS} from './noxiiEntrance.js';
export const DIA_LONG_MONSTER_STATS={
 hp:Math.ceil(NOXII_MONSTER_STATS.hp*1.5),damage:Math.ceil(NOXII_MONSTER_STATS.damage*1.5),
 exp:Math.ceil(NOXII_MONSTER_STATS.exp*1.5),gold:Math.ceil(NOXII_MONSTER_STATS.gold*1.5),
 ai:true,detectionRange:390,chaseRange:540,moveSpeed:195
};
const drops={monkey:'yellow_feather',dog:'red_feather',bird:'blue_feather'};
const pack=(name,kind,locations)=>locations.map(([col,row])=>({...DIA_LONG_MONSTER_STATS,name,dropItem:drops[kind],texture:`dia-long-${kind}-0`,animation:`dia-long-${kind}-walk`,col,row}));
const paths=[[23,4,3,34],[7,16,34,3],[7,8,3,17],[37,10,3,16],[8,23,32,3],[18,33,13,4]];
const clearings=[[15,0,19,11],[4,6,13,10],[31,7,13,13],[5,21,14,6],[30,21,14,6],[18,28,14,11],[19,2,13,7]];
const trees=[];
for(let row=0;row<37;row+=3)for(let col=0;col<45;col+=3){
 const trunk={x:col+1,y:row+1,w:1,h:2};
 if([...paths,...clearings].some(([x,y,w,h])=>trunk.x+trunk.w>x-1&&trunk.x<x+w+1&&trunk.y+trunk.h>y-1&&trunk.y<y+h+1))continue;
 trees.push([col,row,false]);
}
export const diaLongForest={
 id:'dia-long-forest',title:'KHU RỪNG ĐỊA LONG',tileSize:48,cols:48,rows:40,tileset:'town',backgroundColor:'#83c46a',
 player:{x:1176,y:1680,texture:'dungeon',frame:96,scale:3,speed:200},
 paths,trees,houses:[[19,29,'blue'],[27,29,'red']],
 decorations:[[3,17,17],[16,8,28],[29,11,17],[43,22,28],[17,27,17],[30,27,28]],
 npcs:[
  {id:'dia-long-kuto',name:'KuTo',frame:99,col:20.5,row:34,lines:['Chào mừng tới Khu Rừng Địa Long!','Khỉ vàng sống ở bìa rừng tây bắc. Chó đỏ thường xuất hiện ở phía đông; Chim Xanh bay quanh các khoảng rừng giữa bản đồ.','Quái ở đây mạnh hơn quái Cửa Hang NoXII. Hãy chuẩn bị bình hồi phục trước khi đi sâu.']},
  {id:'dia-long-udoi',name:'UDOI',role:'monster-material-exchange',frame:84,col:28.5,row:34,lines:['Mang cho ta 20 lông xanh, lông vàng hoặc lông đỏ để đổi 1 Tinh chất cánh.','Ở gần hai căn nhà này khá an toàn. Khi cần nghỉ, hãy quay về đây.','Cổng phía nam đưa bạn trở lại Ngoại ô YuNa.']}
 ],
 monsters:[
  ...pack('Khỉ vàng','monkey',[[7,9],[12,9],[8,14],[14,14]]),
  ...pack('Chó đỏ','dog',[[35,11],[40,11],[34,17],[40,18]]),
  ...pack('Chim Xanh','bird',[[9,24],[16,23],[32,24],[39,25]])
 ],
 portals:[{x:1176,feetY:1824,label:'Về Ngoại ô YuNa',target:'YunaOutskirts',spawn:{x:1224,y:272}}]
};
