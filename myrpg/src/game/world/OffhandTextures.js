import {flagPixels} from './EventEquipmentArt.js';
// Cùng hệ hình pixel 16px của trang bị hiện tại.
export function offhandTexture(scene,item,frame=0){
 const key=`offhand-${item.offhandKind}-${item.level}${item.offhandKind==='flag'?'-'+frame:''}`;
 if(scene.textures.exists(key))return key;
 const texture=scene.textures.createCanvas(key,16,16),c=texture.context;
 const colors=['#a88bed','#80bddd','#c89deb','#e8b37c','#f3d67f'],color=colors[Math.max(0,Math.min(4,item.level-1))];
 const polygon=(points,fill)=>{c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 c.imageSmoothingEnabled=false;
 if(item.offhandKind==='flag'){
  for(const [x,y,w,h,color] of flagPixels(frame)){c.fillStyle=color;c.fillRect(x,y,w,h);}
 }else if(item.offhandKind==='orb'){
  polygon([[5,1],[11,1],[11,2],[13,2],[13,4],[14,4],[14,10],[13,10],[13,12],[11,12],[11,13],[5,13],[5,12],[3,12],[3,10],[2,10],[2,4],[3,4],[3,2],[5,2]],'#26384f');
  polygon([[5,3],[11,3],[11,4],[12,4],[12,10],[10,10],[10,11],[5,11],[5,10],[4,10],[4,5],[5,5]],color);
  c.fillStyle='#eeebff';c.fillRect(5,4,4,2);c.fillRect(5,6,2,2);
  c.fillStyle='#d1ac64';c.fillRect(4,12,8,2);c.fillRect(3,14,10,1);
 }else{
  polygon([[10,0],[14,0],[14,4],[13,4],[13,7],[11,7],[11,9],[9,9],[9,11],[5,11],[5,7],[7,7],[7,4],[9,4],[9,1]],'#243b43');
  polygon([[11,1],[13,1],[13,4],[12,4],[12,6],[10,6],[10,8],[8,8],[8,10],[6,9],[8,7],[8,5],[10,3]],color);
  c.fillStyle='#f0f5e7';c.fillRect(11,1,1,4);c.fillRect(9,5,1,3);
  polygon([[4,8],[10,12],[9,14],[3,10]],'#d4ad64');
  polygon([[4,11],[6,13],[3,16],[1,14]],'#a15f49');
 }
 texture.refresh();return key;
}
