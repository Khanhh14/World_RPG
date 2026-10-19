// Nền, nhà, đường, cây: tiny-town; nhân vật: tiny-dungeon. Ô 16px phóng 3 lần.
export const yunaCity={
 id:'yuna-city',title:'THÀNH YUNA',tileSize:48,cols:54,rows:42,tileset:'town',backgroundColor:'#bbc5d2',
 player:{x:2352,y:984,texture:'dungeon',frame:96,scale:3,speed:200},
 groundFrame:109,paths:[],paving:[],
 houses:[[8,8,'red'],[24,5,'blue'],[39,8,'red'],[8,28,'blue'],[24,28,'red'],[39,28,'blue'],[16,3,'red'],[32,3,'blue']],
 props:[],solidTiles:[],
 fences:[],gardens:[],trees:[],decorations:[],
 monsters:[],
 npcs:[
  {id:'yuna-coachman',name:'Mã Phu',role:'coachman',frame:100,col:45,row:23.5,lines:['Bạn muốn đi tới đâu?']},
  {id:'yuna-city-guard',name:'Đội trưởng Kael',frame:96,col:9.5,row:14,lines:['Chào mừng đến Thành Yuna.','Cổng phía Đông dẫn ra Ngoại ô YuNa.']},
  {id:'yuna-city-mayor',name:'Thành chủ Yuna',frame:86,col:25.5,row:11,lines:['Chào mừng lữ khách tới quảng trường Yuna.','Hãy chuẩn bị kỹ trước khi đối đầu với NaGa.']},
  {id:'yuna-city-scholar',name:'Học giả Sora',frame:84,col:40.5,row:14,lines:['NaGa cần mười phút để hồi sinh sau khi bị hạ.','Dấu báo kỹ năng là cơ hội tốt nhất để né đòn.']},
  {id:'yuna-city-smith',name:'Thợ rèn Doran',frame:88,col:9.5,row:34,lines:['Mở ba lô và nhấn Nâng cấp cạnh ô trang bị.','Cấp cường hóa vẫn giữ khi thay món mới.']},
  {id:'yuna-city-herbalist',name:'Dược sư Lina',frame:85,col:25.5,row:34,lines:['Hãy mang theo bình máu và mana khi thám hiểm.','Bạn có thể chọn cấp bình dùng cho các ô nhanh.']},
  {id:'yuna-city-citizen',name:'Cư dân Miko',frame:87,col:40.5,row:34,lines:['Quảng trường là nơi nghỉ chân của các lữ khách.','Vũ sư Airi ở Ngoại ô YuNa bán đá nâng cấp cánh.']}
 ],
 portals:[{x:2496,feetY:1008,label:'Về Ngoại ô YuNa',target:'YunaOutskirts',spawn:{x:264,y:888}}]
};
