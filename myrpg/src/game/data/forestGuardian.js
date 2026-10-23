export const FOREST_GUARDIAN = Object.freeze({
    id:'forest-guardian', name:'Thủ hộ khu rừng', hp:2000, damage:40, speed:82,
    home:{x:864,y:624}, activeRange:600, leashRange:720, arenaBottom:1100,
    respawnMs:20*60*1000,
    skills:[
        {id:'roots',name:'Địa Chấn Rễ Cây',damage:65,radius:230,warningMs:1200},
        {id:'leaves',name:'Phiến Lá Xoáy',damage:45,count:5,speed:300,warningMs:1000},
        {id:'seeds',name:'Mưa Hạt Cổ Thụ',damage:75,radius:92,count:3,warningMs:1500}
    ]
});
export const guardianCave={
    id:'guardian-cave',title:'HANG THỦ HỘ KHU RỪNG',tileSize:48,cols:36,rows:32,
    tileset:'dungeon',backgroundColor:'#202d2a',
    player:{x:864,y:1248,texture:'dungeon',frame:96,scale:3,speed:200},
    npcs:[],monsters:[],
    portals:[{x:864,feetY:1440,label:'Về Khu Rừng Mùa Thu',target:'AutumnForest',spawn:{x:1056,y:384}}]
};
