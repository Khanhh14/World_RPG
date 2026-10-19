// Tiny Town: phía Tây có khu nhà, phía Đông là đất trống và cây thưa.
export const yunaOutskirts = {
 id: 'yuna-outskirts', title: 'NGOẠI Ô THÀNH YuNa',
 tileSize: 48, cols: 52, rows: 34, tileset: 'town', backgroundColor: '#83c46a',
 player: { x: 2256, y: 888, texture: 'dungeon', frame: 96, scale: 3, speed: 200 },
 paths: [[0,17,52,3],[7,11,3,17],[14,11,3,17],[5,13,15,3],[5,24,15,3],
         [31,12,14,11],[34,10,8,3],[33,23,9,2]],
 paving: [{x:11,y:16,width:9,height:5,frame:43}],
 houses: [[5,7,'red'],[13,7,'blue'],[5,22,'blue'],[14,22,'red']],
 props: [], fences: [[3,5,17],[3,29,17]], gardens: [[21,25,4,3]], solidTiles: [],
 trees: [[0,0],[5,0],[10,0],[15,0],[20,0],[25,0],[30,0],[35,0],[40,0],[45,0],[48,4],
         [0,7],[0,11],[21,7],[25,11],[23,19],[26,24],[0,24],[1,29],[22,29],[28,28],
         [34,27],[40,28],[46,27],[47,20],[47,10],[39,5],[33,6],[29,7]],
 decorations: [[42,16,17],[37,22,28],[44,21,28],[30,26,17],
               [22,12,28],[11,28,28],[19,12,17],[3,21,17]],
 npcs: [
  {id:'mushroom-nami',name:'Người hái nấm Nami',role:'mushroom-merchant',frame:85,col:31,row:11,lines:['Mang rổ để hái nấm. Đổi 20 nấm lấy 1 đá cường hóa.']},
  { id:'yuna-wing-merchant', name:'Vũ sư Airi', role:'wing-merchant', frame:86, col:14.5,row:13,
    lines:['Chào mừng đến YuNa. Đá nâng cấp giúp đôi cánh của bạn mạnh hơn.'] },
  { id:'yuna-food-cook', name:'Yuna', role:'food-exchange', frame:96, col:6.5,row:13,
    lines:['Ta có thể nấu món ăn từ 5 Nấm YuNa và 5 cá cùng loại. Mỗi món hồi máu và mana theo thời gian.'] }
 ],
 monsters: [],
 portals: [{x:120,feetY:912,label:'Thành Yuna',target:'YunaCity',spawn:{x:2352,y:984}}, {x:2400,feetY:912,label:'Về Khu Rừng Phía Tây',target:'WestForest',spawn:{x:216,y:1080}}]
};
