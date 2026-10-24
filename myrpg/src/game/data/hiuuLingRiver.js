import {NOXII_MONSTER_STATS} from './noxiiEntrance.js';
export const HIUULING_MONSTER_STATS={...NOXII_MONSTER_STATS};
const pack=(name,kind,locations)=>locations.map(([col,row])=>({...HIUULING_MONSTER_STATS,name,texture:`hiuuling-${kind}-0`,animation:`hiuuling-${kind}-walk`,col,row}));
// Broad grassy bank above; a narrow, gently stepped river runs along the bottom.
const water=[];
for(let col=0;col<48;col++){
 const edge=col<10?30:col<22?29:col<35?30:29;
 for(let row=edge;row<36;row++)water.push([col,row]);
}
export const hiuuLingRiver={
 id:'hiuuling-river',title:'BỜ SÔNG HIUULING',tileSize:48,cols:48,rows:36,tileset:'town',backgroundColor:'#83c46a',
 player:{x:288,y:816,texture:'dungeon',frame:96,scale:3,speed:200},
 paths:[[3,15,36,3],[12,8,3,17],[29,8,3,17],[11,23,22,3]],water,
 trees:[[0,0,false],[4,0,false],[8,0,false],[12,0,false],[16,0,false],[20,0,false],[24,0,false],[28,0,false],[32,0,false],[36,0,false],[40,0,false],[44,0,false],
  [0,4,false],[44,4,false],[1,10,false],[44,10,false],[1,20,false],[44,20,false],[2,24,false],[41,24,false],[18,6,false],[35,6,false],[22,20,false]],
 decorations:[[6,5,28],[16,10,17],[24,5,28],[39,11,17],[8,21,28],[19,23,17],[35,22,28],[42,17,17]],
 npcs:[],
 monsters:[
  ...pack('Ếch lục','frog',[[8,8],[12,9],[8,12],[15,12]]),
  ...pack('Cua càng đỏ','crab',[[29,8],[34,9],[29,13],[37,13]]),
  ...pack('Thủy xà','snake',[[11,24],[18,24],[30,24],[37,24]])
 ],
 portals:[{x:144,feetY:840,label:'Về Làng Khởi Đầu',target:'Game',spawn:{x:984,y:1320}}]
};
