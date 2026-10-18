// Nền, nhà, đường, cây: tiny-town; nhân vật: tiny-dungeon. Ô 16px phóng 3 lần.
export const yunaCity={
 id:'yuna-city',title:'THÀNH YUNA',tileSize:48,cols:54,rows:42,tileset:'town',backgroundColor:'#83c46a',
 player:{x:2352,y:984,texture:'dungeon',frame:96,scale:3,speed:200},
 paths:[[1,19,52,4],[9,12,3,23],[25,10,3,26],[40,12,3,23],[8,14,36,3],[8,33,36,3]],
 paving:[{x:19,y:16,width:15,height:10,frame:43},{x:23,y:10,width:7,height:6,frame:43}],
 houses:[[8,8,'red'],[24,5,'blue'],[39,8,'red'],[8,28,'blue'],[24,28,'red'],[39,28,'blue'],[16,3,'red'],[32,3,'blue']],
 props:[],solidTiles:[],
 fences:[[4,4,9],[37,4,11],[4,38,17],[33,38,16]],
 gardens:[[15,29,3,4],[34,29,3,4],[16,10,3,3],[34,10,3,3]],
 trees:[[0,0],[5,0],[10,0],[45,0],[50,0],[0,6],[0,11],[0,26],[0,32],[0,37],[50,5],[50,10],[50,28],[50,34],[50,38],[6,36],[17,36],[30,36],[42,36],[16,24],[34,24]],
 decorations:[[6,17,17],[16,18,17],[35,18,17],[46,17,17],[20,28,28],[31,28,28],[16,34,17],[35,34,17]],
 monsters:[],
 npcs:[
  {id:'yuna-city-guard',name:'Đội trưởng Kael',frame:96,col:9.5,row:14,lines:['Chào mừng đến Thành Yuna.','Cổng phía Đông dẫn ra Ngoại ô YuNa.']},
  {id:'yuna-city-mayor',name:'Thành chủ Yuna',frame:86,col:25.5,row:11,lines:['Chào mừng lữ khách tới quảng trường Yuna.','Hãy chuẩn bị kỹ trước khi đối đầu với NaGa.']},
  {id:'yuna-city-scholar',name:'Học giả Sora',frame:84,col:40.5,row:14,lines:['NaGa cần mười phút để hồi sinh sau khi bị hạ.','Dấu báo kỹ năng là cơ hội tốt nhất để né đòn.']},
  {id:'yuna-city-smith',name:'Thợ rèn Doran',frame:88,col:9.5,row:34,lines:['Mở ba lô và nhấn Nâng cấp cạnh ô trang bị.','Cấp cường hóa vẫn giữ khi thay món mới.']},
  {id:'yuna-city-herbalist',name:'Dược sư Lina',frame:85,col:25.5,row:34,lines:['Hãy mang theo bình máu và mana khi thám hiểm.','Bạn có thể chọn cấp bình dùng cho các ô nhanh.']},
  {id:'yuna-city-citizen',name:'Cư dân Miko',frame:87,col:40.5,row:34,lines:['Quảng trường là nơi nghỉ chân của các lữ khách.','Vũ sư Airi ở Ngoại ô YuNa bán đá nâng cấp cánh.']}
 ],
 portals:[{x:2496,feetY:1008,label:'Về Ngoại ô YuNa',target:'YunaOutskirts',spawn:{x:264,y:888}}]
};
