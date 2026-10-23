export const BACH_HO=Object.freeze({
 id:'bach-ho',name:'Bạch Hổ',hp:15000,damage:200,speed:68,
 home:{x:864,y:624},activeRange:600,leashRange:780,arenaBottom:1100,respawnMs:20*60*1000,
 skills:[
  {id:'breath',name:'Bạch Hổ Băng Tức',damage:260,range:620,spread:.44,warningMs:1400},
  {id:'thunder',name:'Hàn Nha Băng Trụ',damage:240,radius:88,count:5,warningMs:1500},
  {id:'orbs',name:'Băng Châu Liên Xạ',damage:170,count:7,speed:275,warningMs:1100},
  {id:'tail',name:'Bạch Hổ Chấn Địa',damage:300,radius:270,warningMs:1200},
  {id:'charge',name:'Mãnh Hổ Vồ Mồi',damage:320,range:470,width:76,warningMs:1500,duration:650}
 ]
});
export const hanNhaMon={
 id:'han-nha-mon',title:'HÀN NHA MÔN',tileSize:48,cols:36,rows:32,tileset:'dungeon',backgroundColor:'#112e42',
 player:{x:864,y:1248,texture:'dungeon',frame:96,scale:3,speed:200},npcs:[],monsters:[],
 portals:[{x:864,feetY:1440,label:'Về Khu Rừng Mùa Thu',target:'AutumnForest',spawn:{x:1920,y:792}}]
};
