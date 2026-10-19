// Graphics giới hạn số hạt; vùng hồi phục ở lớp mặt đất, tia sáng ở lớp phía trên.
export class CombatVFX {
 constructor(scene){this.scene=scene;this.g=scene.add.graphics().setDepth(9501);this.ground=scene.add.graphics().setDepth(98);this.bursts=[];this.reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;}
 emit(kind,p,radius,color,angle=0){if(!p)return;this.bursts.push({...p,kind,radius,color,angle,start:this.scene.time.now,duration:kind==='heal'?1050:kind==='combo'?680:kind==='beam'?520:kind==='burn'?850:kind==='drain'?760:kind==='whirl'?720:kind==='slash'?300:550});if(this.bursts.length>36)this.bursts.shift();}
 arc(x,y,r,start,end,color,alpha,width){const g=this.g;g.lineStyle(width,color,alpha);g.beginPath();g.arc(x,y,r,start,end);g.strokePath();}
 star(x,y,size,color,alpha){const g=this.g;g.fillStyle(color,alpha);g.fillTriangle(x,y-size,x+size*.3,y,x-size*.3,y);g.fillTriangle(x,y+size,x+size*.3,y,x-size*.3,y);g.fillTriangle(x-size,y,x,y-size*.3,x,y+size*.3);g.fillTriangle(x+size,y,x,y-size*.3,x,y+size*.3);}
 field(now,f){
  const ground=this.ground,g=this.g,age=(now-f.start)/1000;
  const fade=Math.min(1,(now-f.start)/250,Math.max(0,(f.end-now)/600));
  const r=f.radius,x=f.x,y=f.y,color=f.color,pulse=(Math.sin(age*5)+1)/2;
  ground.fillStyle(0x69d88e,.12*fade).fillCircle(x,y,r);
  ground.fillStyle(color,.05*fade).fillCircle(x,y,r*.78);
  ground.lineStyle(3,color,.75*fade).strokeCircle(x,y,r);
  ground.lineStyle(1,0xd9ffb5,.6*fade).strokeCircle(x,y,r-9);
  ground.lineStyle(2,color,.35*fade).strokeCircle(x,y,r*.68);
  const rotation=this.reduced?0:age*.24;
  ground.lineStyle(1,color,.25*fade);
  for(let j=0;j<2;j++){
    ground.beginPath();
    for(let k=0;k<=3;k++){const a=rotation+j*Math.PI/3+k*Math.PI*2/3;const px=x+Math.cos(a)*r*.66,py=y+Math.sin(a)*r*.66;if(k===0)ground.moveTo(px,py);else ground.lineTo(px,py);}
    ground.strokePath();
  }
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6+rotation,px=x+Math.cos(a)*(r-18),py=y+Math.sin(a)*(r-18);
    ground.lineStyle(2,color,fade*.75).lineBetween(px-3,py-4,px+3,py+4);
    ground.lineBetween(px-3,py+4,px+3,py-4);
  }
  ground.lineStyle(3,0xceffbb,fade*.25).strokeCircle(x,y,r*(.3+pulse*.55));
  const count=this.reduced?4:14;
  for(let i=0;i<count;i++){
    const a=i*2.399,rad=r*(.2+(i%5)*.15),t=(age*.5+i*.173)%1;
    const px=x+Math.cos(a)*rad,base=y+Math.sin(a)*rad,py=base-t*65;
    g.lineStyle(2,color,fade*(1-t)*.18).lineBetween(px,base,px,py);
    this.star(px,py,3+(i%3),i%2?0xbaffc9:color,fade*Math.sin(t*Math.PI)*.8);
    if(i%4===0){g.fillStyle(0xccffd1,fade*(1-t)*.7).fillRect(px-1,py-5,2,10);g.fillRect(px-5,py-1,10,2);}
  }
 }
 update(now,origin,shots,guard,fields=[]){
  const g=this.g;g.clear();this.ground.clear();
  for(const field of fields)this.field(now,field);
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
   if(e.kind==='beam'){
    const length=r*(.35+t*.65),halfWidth=4+Math.sin(t*Math.PI)*13;
    const x2=e.x+Math.cos(angle)*length,y2=e.y+Math.sin(angle)*length;
    g.lineStyle(halfWidth*2,e.color,fade*.25).lineBetween(e.x,e.y,x2,y2);
    g.lineStyle(halfWidth,0xf9ffff,fade*.85).lineBetween(e.x,e.y,x2,y2);
    g.lineStyle(2,0xfff2b0,fade).lineBetween(e.x,e.y,x2,y2);
    for(let j=1;j<=5;j++){const k=j/6;this.star(e.x+(x2-e.x)*k,e.y+(y2-e.y)*k,4+fade*3,0xffffff,fade);}
   }else if(e.kind==='counter'){
    const radius=32+t*r;
    g.lineStyle(7*(1-t)+2,e.color,fade*.8).strokeCircle(e.x,e.y,radius);
    g.lineStyle(2,0xeaffff,fade*.8).strokeCircle(e.x,e.y,radius+8);
    for(let j=0;j<4;j++){const a=angle+t*2+j*Math.PI/2;this.star(e.x+Math.cos(a)*radius, e.y+Math.sin(a)*radius,7*fade,e.color,fade);}
   }else if(e.kind==='burn'){
    for(let j=0;j<7;j++){const a=j*Math.PI*2/7+t*2,rad=r*(.2+t*.65),x=e.x+Math.cos(a)*rad,y=e.y+Math.sin(a)*rad;
     g.fillStyle(e.color,fade*.2).fillCircle(x,y,10+fade*5);
     g.fillStyle(0xffb64e,fade*.85).fillTriangle(x,y-18*fade,x-6*fade,y+4*fade,x+6*fade,y+4*fade);
     g.fillStyle(0xfff1be,fade*.8).fillTriangle(x,y-10*fade,x-2*fade,y+2*fade,x+3*fade,y+2*fade);
    }
   }else if(e.kind==='drain'){
    for(let j=0;j<5;j++){const a=angle+t*5+j*Math.PI*2/5,rad=r*(1-t*.75);
     const x=e.x+Math.cos(a)*rad,y=e.y+Math.sin(a)*rad;
     g.lineStyle(3,e.color,fade*.7).lineBetween(x,y,e.x,e.y);
     this.star(x,y,5*fade,e.color,fade);
    }
   }else if(e.kind==='combo'){
    const step=Math.min(2,Math.floor(t*3)),sweep=angle-1.15+step*.9+(t%(.34))*.7;
    this.arc(e.x,e.y,r*(.55+step*.12),sweep-.55,sweep+.75,e.color,fade*.85,8);
    this.arc(e.x,e.y,r*.68,sweep-.35,sweep+.45,0xf2ffff,fade*.75,3);
   }else if(e.kind==='cast'||e.kind==='nova'||e.kind==='sanctuary'){
    const size=r*(.2+t*.9);
    g.fillStyle(e.color,fade*.12).fillCircle(e.x,e.y,size);
    for(let j=0;j<3;j++)this.arc(e.x,e.y,size*(1-j*.17),angle+j*2.1+t*3,angle+j*2.1+t*3+1.5,e.color,fade*.8,4-j);
    g.lineStyle(2,0xfaffdf,fade*.7).strokeCircle(e.x,e.y,size*.6);
    if(e.kind==='nova')for(let j=0;j<8;j++){const a=j*Math.PI/4;g.lineStyle(2,e.color,fade).lineBetween(e.x+Math.cos(a)*size*.5,e.y+Math.sin(a)*size*.5,e.x+Math.cos(a)*size,e.y+Math.sin(a)*size);}
   }else if(e.kind==='slash'||e.kind==='power'){
    const sweep=angle-1.25+t*1.7;
    for(let j=0;j<3;j++)this.arc(e.x,e.y,r*(.6+j*.13),sweep-.65,sweep+1.05,e.color,fade*(.55-j*.1),12-j*3);
    this.arc(e.x,e.y,r*.85,sweep-.25,sweep+.9,0xfff3d4,fade,3);
    for(let j=0;j<3;j++){const a=angle-.45+j*.45;g.lineStyle(2,e.color,fade*.6).lineBetween(e.x+Math.cos(a)*r*.35,e.y+Math.sin(a)*r*.35,e.x+Math.cos(a)*r*(.75+t*.4),e.y+Math.sin(a)*r*(.75+t*.4));}
   }else if(e.kind==='whirl'){
    for(let j=0;j<3;j++)this.arc(e.x,e.y,r*(.45+t*.55),t*7+j*2.1,t*7+j*2.1+1.5,j%2?0xd5ffe9:e.color,fade,7-j*1.5);
    for(let j=0;j<5;j++){const a=t*7+j*Math.PI*2/5;const px=e.x+Math.cos(a)*r*.7,py=e.y+Math.sin(a)*r*.7;this.star(px,py,8*fade,e.color,fade);}
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
    if(e.kind==='cast'||e.kind==='nova'||e.kind==='sanctuary'){
    const size=r*(.2+t*.9);
    g.fillStyle(e.color,fade*.12).fillCircle(e.x,e.y,size);
    for(let j=0;j<3;j++)this.arc(e.x,e.y,size*(1-j*.17),angle+j*2.1+t*3,angle+j*2.1+t*3+1.5,e.color,fade*.8,4-j);
    g.lineStyle(2,0xfaffdf,fade*.7).strokeCircle(e.x,e.y,size*.6);
    if(e.kind==='nova')for(let j=0;j<8;j++){const a=j*Math.PI/4;g.lineStyle(2,e.color,fade).lineBetween(e.x+Math.cos(a)*size*.5,e.y+Math.sin(a)*size*.5,e.x+Math.cos(a)*size,e.y+Math.sin(a)*size);}
   }else if(e.kind==='slash'||e.kind==='power'){x=e.x+Math.cos(angle-1+n/count*2)*r*(.6+t*.4);y=e.y+Math.sin(angle-1+n/count*2)*r*(.6+t*.4);}
    if(n%3===0)this.star(x,y,3+fade*2,e.color,fade*.9);else g.fillStyle(n%2?e.color:0xf8ffe1,fade*.8).fillRect(x,y,2+fade*2,2+fade*2);
   }
  }
 }
 destroy(){this.bursts=[];this.g.destroy();this.ground.destroy();}
}
