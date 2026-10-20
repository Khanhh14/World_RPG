export const NOXII_BOSS = Object.freeze({
    name:'Hộ Vệ Hắc Thạch', hp:2500, damage:30, speed:90,
    home:{x:864,y:650}, activeRange:650, leashRange:780,
    respawnMs:20*60*1000,
    skills:[
        {id:'quake',name:'Chấn Thạch',damage:85,radius:220,warningMs:1100},
        {id:'bolts',name:'Hắc Tiễn',damage:35,count:7,speed:290,warningMs:1000},
        {id:'meteors',name:'Mưa Thiên Thạch',damage:65,radius:90,count:3,warningMs:1400}
    ]
});
