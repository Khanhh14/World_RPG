// Hiệu ứng Graphics gọn nhẹ: không dùng ảnh ngoài, không thay công thức sát thương.
export class CombatVFX {
 constructor(scene){this.scene=scene;this.g=scene.add.graphics().setDepth(9501);this.bursts=[];this.reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;}
 emit(kind,p,radius,color,angle=0){if(!p)return;this.bursts.push({...p,kind,radius,color,angle,start:this.scene.time.now,duration:kind==='heal'?1050:kind==='whirl'?720:kind==='slash'?300:550});if(this.bursts.length>36)this.bursts.shift();}
 arc(x,y,r,start,end,color,alpha,width){const g=this.g;g.lineStyle(width,color,alpha);g.beginPath();g.arc(x,y,r,start,end);g.strokePath();}
 star(x,y,size,color,alpha){const g=this.g;g.fillStyle(color,alpha);g.fillTriangle(x,y-size,x+size*.3,y,x-size*.3,y);g.fillTriangle(x,y+size,x+size*.3,y,x-size*.3,y);g.fillTriangle(x-size,y,x,y-size*.3,x,y+size*.3);g.fillTriangle(x+size,y,x,y-size*.3,x,y+size*.3);}
 update(now,origin,shots,guard){
  const g=this.g;g.clear();
  for(const s of shots){
   const trail=s.trail||[];for(let i=0;i<trail.length;i++){const k=(i+1)/trail.length;g.fillStyle(s.color,k*.22).fillCircle(trail[i].x,trail[i].y,3+k*8);}
   g.fillStyle(s.color,.12).fillCircle(s.x,s.y,21);g.fillStyle(s.color,.35).fillCircle(s.x,s.y,12);g.fillStyle(0xe5ffff,1).fillCircle(s.x,s.y,4);
   this.arc(s.x,s.y,9,now*.016,now*.016+4,s.color,.95,2);
   for(let j=0;j<3;j++){const a=now*.009+j*2.1;this.star(s.x+Math.cos(a)*13,s.y+Math.sin(a)*13,3,0xeaffff,.8);}
  }
  if(guard&&origin){
   const {x,y}=origin;g.fillStyle(0x75bcff,.055).fillCircle(x,y,42);g.lineStyle(2,0xbce9ff,.75).strokeCircle(x,y,41);g.lineStyle(1,0x669fff,.6).strokeCircle(x,y,46);
   for(let i=0;i<6;i++){const a=i*Math.PI/3+now*.00065;this.star(x+Math.cos(a)*44,y+Math.sin(a)*44,4,0xc3e7ff,.85);}
   g.lineStyle(2,0xb9deff,.7);g.beginPath();g.moveTo(x,y-22);g.lineTo(x+17,y-15);g.lineTo(x+15,y+5);g.lineTo(x,y+18);g.lineTo(x-15,y+5);g.lineTo(x-17,y-15);g.closePath();g.strokePath();
  }
  for(let i=this.bursts.length-1;i>=0;i--){
   const e=this.bursts[i],t=(now-e.start)/e.duration;if(t>=1){this.bursts.splice(i,1);continue;}const fade=1-t,r=e.radius,angle=e.angle;
   if(e.kind==='slash'||e.kind==='power'){
    const sweep=angle-1.25+t*1.7;
    for(let j=0;j<3;j++)this.arc(e.x,e.y,r*(.6+j*.13),sweep-.65,sweep+1.05,e.color,fade*(.55-j*.1),12-j*3);
    this.arc(e.x,e.y,r*.85,sweep-.25,sweep+.9,0xfff3d4,fade,3);
   }else if(e.kind==='whirl'){
    for(let j=0;j<3;j++)this.arc(e.x,e.y,r*(.45+t*.55),t*7+j*2.1,t*7+j*2.1+1.5,j%2?0xd5ffe9:e.color,fade,7-j*1.5);
    g.lineStyle(2,e.color,fade*.4).strokeEllipse(e.x,e.y+15,r*2*(.2+t*.8),r*(.2+t*.8));
   }else if(e.kind==='heal'||e.kind==='potion'){
    g.lineStyle(3,e.color,fade*.7).strokeEllipse(e.x,e.y+22,70+t*36,24+t*12);g.lineStyle(1,0xe4ffcb,fade*.5).strokeEllipse(e.x,e.y+22,90+t*32,34+t*12);
    if(e.kind==='heal'){g.fillStyle(e.color,fade*.7).fillRect(e.x-3,e.y-27-t*28,6,24);g.fillRect(e.x-12,e.y-18-t*28,24,6);}
   }else {g.lineStyle(3,e.color,fade*.75).strokeCircle(e.x,e.y,r*(.15+t*.85));g.lineStyle(1,0xf6ffdf,fade*.4).strokeCircle(e.x,e.y,r*(.1+t*.65));}
   const count=this.reduced?4:e.kind==='impact'?10:16;
   for(let n=0;n<count;n++){
    const a=n*2.399+e.angle,spread=(.25+(n%5)*.15)*r;
    let x=e.x+Math.cos(a)*spread*(.2+t),y=e.y+Math.sin(a)*spread*(.2+t);
    if(e.kind==='heal'||e.kind==='potion'){x=e.x+Math.cos(a)*30;y=e.y+20-t*(55+(n%4)*14);}
    if(e.kind==='slash'||e.kind==='power'){x=e.x+Math.cos(angle-1+n/count*2)*r*(.6+t*.4);y=e.y+Math.sin(angle-1+n/count*2)*r*(.6+t*.4);}
    if(n%3===0)this.star(x,y,3+fade*2,e.color,fade*.9);else g.fillStyle(n%2?e.color:0xf8ffe1,fade*.8).fillRect(x,y,2+fade*2,2+fade*2);
   }
  }
 }
 destroy(){this.bursts=[];this.g.destroy();}
}
