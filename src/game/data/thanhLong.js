export const THANH_LONG=Object.freeze({
 id:'thanh-long',name:'Thanh Long',hp:15000,damage:200,speed:80,
 home:{x:1176,y:360},activeRange:500,leashRange:650,arenaBottom:880,respawnMs:20*60*1000,
 skills:[
  {id:'breath',name:'Hỏa Long Tức',damage:260,range:620,spread:.44,warningMs:1400},
  {id:'thunder',name:'Lôi Vân Thiên Phạt',damage:240,radius:88,count:5,warningMs:1500},
  {id:'orbs',name:'Long Châu Liên Xạ',damage:170,count:7,speed:275,warningMs:1100},
  {id:'tail',name:'Thần Long Bãi Vĩ',damage:300,radius:270,warningMs:1200},
  {id:'charge',name:'Thiên Long Xung Kích',damage:320,range:470,width:76,warningMs:1500,duration:650}
 ]
});
