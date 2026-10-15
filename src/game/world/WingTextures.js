import { wingStyle } from '../data/wings.js';

// Cùng một nét vẽ pixel cho cánh trong map, ảnh xem trước và icon giao diện.
export function drawWingPixels(ctx, id, level = 0) {
 const style = wingStyle(id); if (!style) return;
 const [outline, shade, main, light] = style.colors;
 ctx.imageSmoothingEnabled = false;
 const polygon = (points, color) => {
   ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
 };
 for (const side of [-1,1]) {
   ctx.save(); ctx.translate(24,0); ctx.scale(side,1);
   const feathers = id === 'verdant'
     ? [[[1,15],[4,6],[13,1],[13,7],[8,16]],[[3,16],[10,6],[21,4],[18,11],[8,19]],[[4,19],[13,12],[23,13],[19,18],[8,22]],[[3,21],[12,18],[20,22],[13,25],[6,24]]]
     : id === 'phoenix'
     ? [[[1,15],[6,6],[15,0],[13,8],[9,17]],[[3,18],[12,7],[24,3],[20,13],[9,21]],[[4,20],[15,14],[23,12],[20,21],[8,24]],[[3,22],[11,20],[18,23],[12,30],[7,26]]]
     : [[[1,16],[5,6],[15,1],[14,8],[8,17]],[[3,17],[10,7],[23,4],[21,11],[8,21]],[[3,20],[13,12],[23,12],[19,19],[7,24]],[[3,23],[12,19],[20,21],[14,27],[6,26]]];
   for (const feather of feathers) {
     polygon(feather, outline);
     const center = feather.reduce((p,v)=>[p[0]+v[0]/feather.length,p[1]+v[1]/feather.length],[0,0]);
     polygon(feather.map(([x,y])=>[Math.round(x*.8+center[0]*.2),Math.round(y*.8+center[1]*.2)]), shade);
     polygon(feather.slice(0,3).map(([x,y])=>[Math.round(x*.75+center[0]*.25),Math.round(y*.75+center[1]*.25)]).concat([center]), main);
     ctx.fillStyle=light; ctx.fillRect(Math.round(center[0]),Math.round(center[1]),2,1);
   }
   if (level >= 3) { ctx.fillStyle=light; ctx.fillRect(15,7,2,2); ctx.fillRect(19,15,1,2); }
   if (level >= 6) { ctx.fillStyle=main; ctx.fillRect(21,0,1,3); ctx.fillRect(20,1,3,1); }
   if (level >= 9) { ctx.fillStyle=light; ctx.fillRect(21,27,1,3); ctx.fillRect(20,28,3,1); }
   ctx.restore();
 }
 ctx.fillStyle=outline;ctx.fillRect(21,15,6,9);
 ctx.fillStyle=shade;ctx.fillRect(22,14,4,8);
 ctx.fillStyle=light;ctx.fillRect(23,15,2,3);
}
const icons = new Map();
export function wingIconURL(id, level = 0) {
 const key = id + ':' + level;
 if (!icons.has(key)) {
  const canvas = document.createElement('canvas'); canvas.width=48; canvas.height=32;
  drawWingPixels(canvas.getContext('2d'),id,level); icons.set(key,canvas.toDataURL());
 }
 return icons.get(key);
}
export function wingTexture(scene, id, level) {
 const key = `yuna-wing-${id}-${level}`;
 if (!scene.textures.exists(key)) {
  const texture=scene.textures.createCanvas(key,48,32);
  drawWingPixels(texture.context,id,level); texture.refresh();
 }
 return key;
}
