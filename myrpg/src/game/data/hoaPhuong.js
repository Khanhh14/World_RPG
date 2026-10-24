export const HOA_PHUONG=Object.freeze({
 id:'hoa-phuong',name:'Hỏa Phượng',hp:15000,damage:200,speed:68,
 home:{x:864,y:624},activeRange:600,leashRange:780,arenaBottom:1100,respawnMs:20*60*1000,
 skills:[
  {id:'breath',name:'Phượng Viêm Thổ Tức',damage:260,range:620,spread:.44,warningMs:1400},
  {id:'thunder',name:'Hỏa Vũ Thiên Thạch',damage:240,radius:88,count:5,warningMs:1500},
  {id:'orbs',name:'Liệt Vũ Liên Xạ',damage:170,count:7,speed:275,warningMs:1100},
  {id:'firefield',name:'Phượng Hoàng Hỏa Vực',damage:100,radius:300,duration:5000,tickMs:500,warningMs:1600},
  {id:'charge',name:'Phượng Hoàng Xung Kích',damage:320,range:470,width:76,warningMs:1500,duration:650}
 ]
});
export const hoaPhuongCave={
 id:'hoa-phuong-cave',title:'HANG HỎA PHƯỢNG',tileSize:48,cols:36,rows:32,tileset:'dungeon',backgroundColor:'#112e42',
 player:{x:864,y:1248,texture:'dungeon',frame:96,scale:3,speed:200},npcs:[],monsters:[],
 portals:[{x:864,feetY:1440,label:'Về Bờ Sông HiuuLing',target:'HiuuLingRiver',spawn:{x:2064,y:960}}]
};
