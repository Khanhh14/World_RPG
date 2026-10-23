const armor=[[4,2,3,3],[9,2,3,3],[2,4,12,5],[4,8,8,6]],helmet=[[5,2,6,2],[3,4,10,4],[2,7,4,7],[10,7,4,7],[6,8,4,2]],boots=[[2,2,4,9],[1,10,7,4],[10,2,4,9],[9,10,6,4]],gloves=[[2,3,4,10],[1,6,6,5],[10,3,4,10],[9,6,6,5]];
export function flagPixels(frame=0){
 const pixels=[[3,0,2,16,'#3c3034'],[3,1,1,15,'#d4ac61'],[2,0,4,2,'#f4d793']];
 for(let x=5;x<15;x++){
  const dy=Math.round(Math.sin((x-5)*.65+frame*2.094));
  pixels.push([x,2+dy,1,8,'#59343a'],[x,3+dy,1,6,'#b64a3e'],[x,3+dy,1,1,'#f1c16a'],[x,9+dy,1,1,'#efb557']);
  if(x>=7&&x<=12){const y=6+dy-Math.abs(10-x)*.6;pixels.push([x,Math.round(y),1,3,'#f5d174']);}
 }
 return pixels;
}
export function eventGearPixels(id){
 if(id==='hoa_tien_ky')return flagPixels();
 const rectangles=id.endsWith('armor')?armor:id.endsWith('helmet')?helmet:id.endsWith('boots')?boots:gloves;
 const pixels=[];
 for(const [x,y,w,h] of rectangles){pixels.push([x,y,w,h,'#253b43'],[x+1,y+1,Math.max(1,w-2),Math.max(1,h-2),'#416776'],[x+1,y+1,Math.max(1,w-2),1,'#a4c8cd']);}
 for(const [x,y,w,h] of rectangles)if(w>=4)pixels.push([x+1,y+h-2,w-2,1,'#cbbd85']);
 if(id.endsWith('armor')||id.endsWith('helmet'))pixels.push([7,4,2,7,'#86d8cd'],[6,7,4,2,'#b4ede0']);
 return pixels;
}
export function eventEquipmentIcon(id,size=40){return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0">${eventGearPixels(id).map(([x,y,w,h,c])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('')}</svg>`;}
