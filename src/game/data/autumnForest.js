import {westForest} from './westForest.js';
const base=westForest.monsters[0];
export const AUTUMN_MONSTER_STATS={hp:base.hp,damage:base.damage,exp:30,gold:10,ai:true,detectionRange:base.detectionRange,chaseRange:base.chaseRange,moveSpeed:base.moveSpeed};
const pack=(name,kind,locations)=>locations.map(([col,row])=>({...AUTUMN_MONSTER_STATS,name,texture:`autumn-${kind}-0`,animation:`autumn-${kind}-walk`,col,row}));
const paths=[[20,3,4,31],[6,11,31,3],[6,20,31,3],[6,7,3,16],[34,7,3,16],[16,28,12,4]];
const clearings=[[4,5,12,18],[28,5,12,18],[17,26,10,9],[17,1,10,6]];
const trees=[];
for(let row=0;row<33;row+=3)for(let col=0;col<41;col+=3){
 const x=col+1,y=row+1;
 if([...paths,...clearings].some(([rx,ry,w,h])=>x+1>rx-1&&x<rx+w+1&&y+2>ry-1&&y<ry+h+1))continue;
 trees.push([col,row,true]);
}
export const autumnForest={
 id:'autumn-forest',title:'KHU RỪNG MÙA THU',tileSize:48,cols:44,rows:36,tileset:'town',backgroundColor:'#83c46a',
 player:{x:1056,y:1488,texture:'dungeon',frame:96,scale:3,speed:200},paths,trees,npcs:[],
 decorations:[[3,12,17],[16,8,28],[27,9,17],[40,14,28],[16,25,17],[28,25,28]],
 monsters:[
  ...pack('Sóc hạt dẻ','squirrel',[[7,8],[12,8],[7,13],[12,13],[7,19],[12,19]]),
  ...pack('Nhím lá vàng','hedgehog',[[31,8],[36,8],[31,13],[36,13],[31,19],[36,19]])
 ],
 portals:[{x:1056,feetY:1632,label:'Về Làng Khởi Đầu',target:'Game',spawn:{x:984,y:272}}]
};
