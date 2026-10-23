export const HUYEN_QUY=Object.freeze({
 id:'huyen-quy',name:'Huyền Quy',hp:15000,damage:200,speed:68,
 home:{x:864,y:624},activeRange:600,leashRange:780,arenaBottom:1100,respawnMs:20*60*1000,
 skills:[
  {id:'breath',name:'Huyền Thủy Tức',damage:260,range:620,spread:.44,warningMs:1400},
  {id:'thunder',name:'Hàn Vũ Thủy Trụ',damage:240,radius:88,count:5,warningMs:1500},
  {id:'orbs',name:'Huyền Châu Liên Xạ',damage:170,count:7,speed:275,warningMs:1100},
  {id:'tail',name:'Sóng Chấn Huyền Giáp',damage:300,radius:270,warningMs:1200},
  {id:'charge',name:'Linh Xà Xung Kích',damage:320,range:470,width:76,warningMs:1500,duration:650}
 ]
});
export const huyenQuyCave={
 id:'huyen-quy-cave',title:'ĐỘNG HUYỀN QUY · ĐÁY HỒ ATLAST',tileSize:48,cols:36,rows:32,tileset:'dungeon',backgroundColor:'#112e42',
 player:{x:864,y:1248,texture:'dungeon',frame:96,scale:3,speed:200},npcs:[],monsters:[],
 portals:[{x:864,feetY:1440,label:'Trở lên Hồ Atlast',target:'AtlastLake',spawn:{x:2016,y:1080}}]
};
