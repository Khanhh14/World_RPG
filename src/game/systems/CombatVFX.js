// One reusable set of Graphics: no emitter, texture, timer or GameObject per cast.
const TAU=Math.PI*2;
const WHITE=0xf4fbff;
const DURATIONS={slash:320,power:580,combo:640,beam:620,impact:360,cast:700,nova:760,whirl:900,burn:900,drain:850,bind:900,rain:850,veil:720,chain:480,barrier:720,mana:1100,break:650,fan:550,warcry:950,heal:1100,potion:950,sanctuary:1000,quake:1000,meteor:1000};
const clamp=n=>Math.max(0,Math.min(1,n));
export class CombatVFX {
 constructor(scene){
  this.scene=scene;this.ground=scene.add.graphics().setDepth(98);
  this.g=scene.add.graphics().setDepth(9501);
  this.glow=scene.add.graphics().setDepth(9502).setBlendMode('ADD');
  this.bursts=[];this.reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 }
 emit(kind,p,radius=48,color=0xb9eaff,angle=0,options={}){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
  this.bursts.push({...options,x:p.x,y:p.y,kind,radius:Math.max(1,Math.min(800,radius??48)),color:color??0xb9eaff,angle,start:this.scene.time.now,duration:DURATIONS[kind]??650});
  if(this.bursts.length>48)this.bursts.splice(0,this.bursts.length-48);
 }
 visible(p,r=100){const v=this.scene.cameras?.main?.worldView;return !v||(p.x+r>=v.x&&p.x-r<=v.right&&p.y+r>=v.y&&p.y-r<=v.bottom);}
 arc(x,y,r,a,b,c,alpha=1,width=2,g=this.g){if(r<=0||alpha<=0)return;g.lineStyle(width,c,alpha).beginPath().arc(x,y,r,a,b).strokePath();}
 star(x,y,s,c,alpha=1,g=this.glow){g.fillStyle(c,alpha).fillTriangle(x,y-s,x+s*.26,y,x-s*.26,y).fillTriangle(x,y+s,x+s*.26,y,x-s*.26,y).fillTriangle(x-s,y,x,y-s*.26,x,y+s*.26).fillTriangle(x+s,y,x,y-s*.26,x,y+s*.26);}
 path(points,c,alpha,width,g=this.g){g.lineStyle(width,c,alpha).beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokePath();}
 halo(x,y,r,c,a=.2){this.glow.fillStyle(c,a*.15).fillCircle(x,y,r*1.7).fillStyle(c,a*.35).fillCircle(x,y,r).fillStyle(c,a).fillCircle(x,y,r*.5);}
 seal(x,y,r,c,a,rotation=0,g=this.ground){
  g.lineStyle(2,c,a).strokeCircle(x,y,r).lineStyle(1,c,a*.65).strokeCircle(x,y,r*.86);
  const n=this.reduced?6:12;
  for(let i=0;i<n;i++){const angle=rotation+i*TAU/n,dx=Math.cos(angle),dy=Math.sin(angle),px=x+dx*r*.93,py=y+dy*r*.93;
   g.lineStyle(1.5,c,a).lineBetween(px-dy*3-dx*3,py+dx*3-dy*3,px+dx*3,py+dy*3).lineBetween(px+dx*3,py+dy*3,px+dy*3-dx*3,py-dx*3-dy*3);
  }
  for(let j=0;j<2;j++){const points=[];for(let i=0;i<=3;i++){const angle=rotation+j*Math.PI/3+i*TAU/3;points.push({x:x+Math.cos(angle)*r*.72,y:y+Math.sin(angle)*r*.72});}this.path(points,c,a*.45,1,g);}
 }
 sparks(e,t,inward=false,rising=false){
  const count=this.reduced?4:e.kind==='impact'?9:18,fade=Math.sin(Math.PI*t),r=e.radius;
  for(let i=0;i<count;i++){
   const a=i*2.39996+e.angle,d=r*(.28+(i%5)*.13)*(inward?1-t:.15+Math.sqrt(t));
   const x=e.x+Math.cos(a)*d,y=rising?e.y+20-t*(45+i%5*14):e.y+Math.sin(a)*d+t*t*14;
   const tail=this.reduced?0:6+10*t;
   this.g.lineStyle(1,e.color,fade*.4).lineBetween(x-Math.cos(a)*tail,y-Math.sin(a)*tail,x,y);
   if(i%3===0)this.star(x,y,(2+i%4)*fade,e.color,fade*.9);else this.glow.fillStyle(i%2?e.color:WHITE,fade*.8).fillCircle(x,y,1.3+fade);
  }
 }
 lightning(from,to,color,fade,phase=0){
  const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)||1,steps=Math.max(4,Math.min(20,Math.ceil(len/20))),points=[];
  for(let i=0;i<=steps;i++){const k=i/steps,j=i===0||i===steps?0:Math.sin(i*17.13+phase)*Math.min(14,len*.1);points.push({x:from.x+dx*k-dy/len*j,y:from.y+dy*k+dx/len*j});}
  this.path(points,color,fade*.15,13,this.glow);this.path(points,color,fade*.9,4);this.path(points,WHITE,fade,1.5,this.glow);
  if(!this.reduced)for(let i=2;i<points.length-1;i+=4){const p=points[i];this.path([p,{x:p.x+dx/len*17-dy/len*13,y:p.y+dy/len*17+dx/len*13},{x:p.x+dx/len*24-dy/len*24,y:p.y+dy/len*24+dx/len*24}],color,fade*.55,1.5);}
 }
 projectile(s,now,g=this.g){
  if(!this.visible(s,70))return;
  const color=s.color??0xba92ff,a=Math.atan2(s.dy??0,s.dx??1),dx=Math.cos(a),dy=Math.sin(a),trail=s.trail??[];
  for(let i=1;i<trail.length;i++){const k=i/trail.length;g.lineStyle(2+k*6,color,k*.28).lineBetween(trail[i-1].x,trail[i-1].y,trail[i].x,trail[i].y);}
  for(let i=3;i>0;i--)g.lineStyle(i*4,color,.06+(3-i)*.05).lineBetween(s.x-dx*(18+i*7),s.y-dy*(18+i*7),s.x,s.y);
  g.fillStyle(color,.15).fillCircle(s.x,s.y,17).fillStyle(color,.9).fillCircle(s.x,s.y,7);
  if(s.vfxKind==='fan'||s.vfxKind==='venom'){
   g.fillStyle(WHITE,.95).fillTriangle(s.x+dx*13,s.y+dy*13,s.x-dx*7-dy*4,s.y-dy*7+dx*4,s.x-dx*7+dy*4,s.y-dy*7-dx*4);
  }else{
   g.fillStyle(WHITE,1).fillCircle(s.x,s.y,3);
   this.arc(s.x,s.y,12,now*.008,now*.008+4.4,color,.85,2,g);
   if(s.vfxKind==='orb'){this.seal(s.x,s.y,20,color,.65,now*.003,g);}
   if(s.vfxKind==='ricochet')this.arc(s.x,s.y,17,-now*.01,-now*.01+4,WHITE,.7,1,g);
  }
  if(!this.reduced)for(let j=0;j<2;j++){const side=j?1:-1,phase=now*.012+j*Math.PI;this.star(s.x-dx*16-dy*Math.sin(phase)*9,s.y-dy*16+dx*Math.sin(phase)*9,3,color,.75,g);}
 }
 telegraph(g,p,r,color,k,now){
  k=clamp(k);g.fillStyle(color,.07+k*.08).fillCircle(p.x,p.y,r);
  // The outer border always matches the actual damage radius.
  g.lineStyle(3,color,.95).strokeCircle(p.x,p.y,r).lineStyle(1,WHITE,.5).strokeCircle(p.x,p.y,r-6);
  this.arc(p.x,p.y,r-3,-Math.PI/2,-Math.PI/2+TAU*k,WHITE,.85,3,g);
  this.seal(p.x,p.y,r*.65,color,.22+k*.28,this.reduced?0:now*.00025,g);
  for(let i=0;i<8;i++){const a=i*TAU/8,dx=Math.cos(a),dy=Math.sin(a),d=r*(1-k*.35);g.lineStyle(2,color,.6).lineBetween(p.x+dx*d,p.y+dy*d,p.x+dx*(d-10),p.y+dy*(d-10));}
  g.lineStyle(2,WHITE,.65).lineBetween(p.x-7,p.y,p.x+7,p.y).lineBetween(p.x,p.y-7,p.x,p.y+7);
 }
 aim(g,from,angle,length,color,k){
  const dx=Math.cos(angle),dy=Math.sin(angle),end={x:from.x+dx*length,y:from.y+dy*length};
  g.lineStyle(9,color,.08+k*.12).lineBetween(from.x,from.y,end.x,end.y).lineStyle(1,color,.65).lineBetween(from.x,from.y,end.x,end.y);
  for(let i=1;i<=4;i++){const d=length*((i/5+k*.15)%1),x=from.x+dx*d,y=from.y+dy*d;g.lineStyle(2,color,.65).lineBetween(x-dx*9-dy*5,y-dy*9+dx*5,x,y).lineBetween(x,y,x-dx*9+dy*5,y-dy*9-dx*5);}
 }
 field(now,f){
  const age=(now-f.start)/1000,fade=clamp(Math.min((now-f.start)/250,(f.end-now)/500));
  if(!this.visible(f,f.radius))return;
  this.ground.fillStyle(f.color,.055*fade).fillCircle(f.x,f.y,f.radius);
  this.seal(f.x,f.y,f.radius,f.color,fade*.75,this.reduced?0:age*.15);
  this.arc(f.x,f.y,f.radius*.8,age,age+Math.PI*1.4,f.color,fade*.3,2,this.ground);
  const n=this.reduced?4:14;
  for(let i=0;i<n;i++){const a=i*2.399,progress=(age*.35+i*.173)%1,r=f.radius*(.2+i%5*.14),x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r-progress*60;
   this.star(x,y,3+i%3,f.color,Math.sin(progress*Math.PI)*fade);
   if(i%4===0)this.cross(x,y,5,f.color,fade*(1-progress));
  }
 }
 cross(x,y,s,c,a){this.glow.fillStyle(c,a).fillRect(x-s*.25,y-s,s*.5,s*2).fillRect(x-s,y-s*.25,s*2,s*.5);}
 aura(now,p,guard,barrier,evade,buffs){
  if(!p)return;const {x,y}=p,time=this.reduced?0:now/1000;
  if(guard){this.seal(x,y+20,39,0x9ecfff,.6,time*.3);for(let i=0;i<3;i++){
   const a=time+i*TAU/3,px=x+Math.cos(a)*38,py=y+Math.sin(a)*21;this.path([{x:px,y:py-13},{x:px+9,y:py-8},{x:px+7,y:py+4},{x:px,y:py+10},{x:px-7,y:py+4},{x:px-9,y:py-8},{x:px,y:py-13}],0xbce9ff,.65,2);
  }}
  if(barrier){this.g.fillStyle(0x67d9ff,.035).fillCircle(x,y,46);this.g.lineStyle(2,0x8eeaff,.7).strokeEllipse(x,y,92,104);
   for(let i=0;i<6;i++){const a=i*TAU/6+time*.4;this.arc(x,y,49,a,a+.55,0xd8faff,.7,2);}
   for(let i=0;i<3;i++){const px=x+(i-1)*21,py=y-8+(i%2)*18;const points=[];for(let j=0;j<=6;j++){const a=j*TAU/6;points.push({x:px+Math.cos(a)*12,y:py+Math.sin(a)*12});}this.path(points,0x8eeaff,.25,1);}
  }
  if(evade)for(let i=0;i<4;i++){const a=-time*1.6+i*TAU/4;this.arc(x,y,32+i*4,a,a+1.4,0xb273ef,.5,4);this.star(x+Math.cos(a)*43,y+Math.sin(a)*30,4,0xdcb5ff,.75);}
  if(buffs.mana)this.seal(x,y+23,29,0xffdf82,.45,-time*.4);
  if(buffs.warcry)for(let i=0;i<4;i++){const a=i*TAU/4+time*.5,px=x+Math.cos(a)*29,py=y+Math.sin(a)*15-((time*.6+i*.25)%1)*35;this.star(px,py,4,0xffbd65,.65);}
 }
 status(now,p,flags){
  if(!flags.bind&&!flags.burn&&!flags.broken||!this.visible(p,100))return;
  const time=this.reduced?0:now*.001,{x,y}=p;
  if(flags.bind){
   this.ground.lineStyle(1.5,0xb273ef,.65).strokeEllipse(x,y+16,48,20);
   for(let i=0;i<7;i++){const a=i*TAU/7+time*.5,px=x+Math.cos(a)*22,py=y+Math.sin(a)*8;this.g.lineStyle(1.5,0xc79bff,.75).strokeEllipse(px,py,8,5);}
   this.star(x,y-30,5,0xc79bff,.8);
  }
  if(flags.burn)for(let i=0;i<4;i++){const k=(time*.9+i*.25)%1,px=x+Math.sin(i*13)*18,py=y+12-k*37;this.glow.fillStyle(0xffb364,(1-k)*.6).fillTriangle(px-3,py,px+Math.sin(time*5+i)*3,py-9,px+3,py);}
  if(flags.broken){const cy=y-35;this.path([{x:x-3,y:cy-8},{x:x-11,y:cy-6},{x:x-9,y:cy+4},{x:x-4,y:cy+9}],0xffaa71,.85,2);this.path([{x:x+3,y:cy-8},{x:x+11,y:cy-6},{x:x+9,y:cy+4},{x:x+4,y:cy+9}],0xffaa71,.85,2);this.path([{x:x+1,y:cy-7},{x:x-2,y:cy},{x:x+2,y:cy+2},{x:x-1,y:cy+7}],WHITE,.8,1);}
 }
 burst(e,t){
  const g=this.g,h=this.glow,{x,y,color:c,radius:r,angle:a,kind}=e,fade=1-t,ease=1-Math.pow(1-t,3),size=r*(.15+.85*ease),spin=this.reduced?0:t;
  if(['slash','power','combo','whirl'].includes(kind)){
   const count=kind==='combo'?3:kind==='whirl'?4:1;
   for(let j=0;j<count;j++){
    const local=kind==='combo'?clamp(t*2-j*.35):t;if(kind==='combo'&&local===0)continue;
    const dir=a+(kind==='whirl'?spin*8+j*TAU/4:kind==='combo'?(j%2?-1:1)*(.9-local*2.2):-.9+local*2.1),rr=r*(kind==='power'?.85:.65)+j*5;
    this.arc(x,y,rr,dir-.85,dir+.55,c,fade*.12,24,h);this.arc(x,y,rr,dir-.75,dir+.5,c,fade*.85,kind==='power'?12:7);this.arc(x,y,rr+3,dir-.55,dir+.45,WHITE,fade,2,h);
    const px=x+Math.cos(dir+.45)*rr,py=y+Math.sin(dir+.45)*rr;this.star(px,py,7*fade,c,fade);
   }
   if(kind==='power'||kind==='whirl')this.ground.lineStyle(2,c,fade*.45).strokeEllipse(x,y+18,size*2,size*.65);
  }else if(kind==='beam'){
   const dx=Math.cos(a),dy=Math.sin(a),length=r*Math.min(1,t*5),end={x:x+dx*length,y:y+dy*length},width=Math.sin(Math.PI*t)*16;
   for(const [w,alpha,col] of [[width*3,.08,c],[width*1.7,.25,c],[width,.8,c],[3,.95,WHITE]])g.lineStyle(Math.max(1,w),col,fade*alpha).lineBetween(x,y,end.x,end.y);
   this.seal(x,y,27,c,fade,a+t,this.g);this.halo(end.x,end.y,22,c,fade*.6);
   for(let i=1;i<=6;i++){const k=i/7;this.star(x+dx*length*k,y+dy*length*k,4+fade*3,WHITE,fade);}
  }else if(kind==='chain'){
   const to=e.to??{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r};this.lightning(e,to,c,fade,this.reduced?0:Math.floor(t*12));this.halo(to.x,to.y,22,c,fade*.6);this.star(to.x,to.y,12*fade,WHITE,fade);
  }else if(kind==='drain'){
   if(e.to){const to=e.to,dx=to.x-x,dy=to.y-y,points=[];for(let j=0;j<=20;j++){const k=j/20,w=Math.sin(k*Math.PI)*Math.sin(k*12-t*8)*12;points.push({x:x+dx*k,y:y+dy*k+w});}this.path(points,c,fade*.18,10,h);this.path(points,c,fade*.75,2);for(let i=0;i<6;i++){const k=(t*1.5+i/6)%1;this.star(x+dx*k,y+dy*k+Math.sin(k*Math.PI)*Math.sin(k*12-t*8)*12,5,c,fade);}}
   this.seal(x,y,Math.min(52,r)*(.7+t*.3),c,fade*.6,-spin*2);this.sparks({...e,radius:Math.min(70,r)},t,true);
  }else if(kind==='burn'){
   this.ground.fillStyle(0x491b24,fade*.15).fillEllipse(x,y+16,r*1.4,r*.55);
   for(let i=0;i<(this.reduced?4:9);i++){const px=x+Math.sin(i*9)*r*.55,base=y+Math.cos(i*3)*r*.24+16,hh=(24+i%4*11)*Math.sin(Math.PI*clamp(t*1.4-i*.025));
    this.halo(px,base-hh*.3,14,c,fade*.3);g.fillStyle(c,fade*.8).fillTriangle(px-7,base,px+Math.sin(t*12+i)*6,base-hh,px+7,base);g.fillStyle(0xffe8a6,fade).fillTriangle(px-3,base,px,base-hh*.6,px+3,base);
   }
  }else if(kind==='bind'){
   this.seal(x,y+15,size*.75,c,fade*.8,-spin*1.5);
   for(let j=0;j<3;j++){const points=[];for(let i=0;i<=24;i++){const angle=i/24*TAU+j*TAU/3+spin*3;points.push({x:x+Math.cos(angle)*r*.5,y:y-28+i/24*55+Math.sin(angle)*9});}this.path(points,c,fade*.65,2);}
   this.star(x,y-43,10*fade,0xe7baff,fade);
  }else if(kind==='rain'||kind==='meteor'){
   const n=this.reduced?3:kind==='meteor'?9:7;
   for(let i=0;i<n;i++){const k=clamp(t*1.8-i*.055),px=x+Math.sin(i*7)*r*.65,py=y+Math.cos(i*4)*r*.35,drop=(1-k)*(kind==='meteor'?200:125);
    g.lineStyle(kind==='meteor'?6:3,c,fade*.65).lineBetween(px+drop*.32,py-drop,px+drop*.32+9,py-drop-28);this.halo(px+drop*.32,py-drop,9,c,fade*.65);
    if(k===1)this.arc(px,py,8+ease*18,0,TAU,c,fade*.5,2,this.ground);
   }
   this.seal(x,y,size,c,fade*.4,t*.25);
   if(kind==='meteor'){this.ground.lineStyle(4,c,fade*.8).strokeCircle(x,y,size);this.sparks(e,t);}
  }else if(kind==='nova'){
   for(let i=0;i<3;i++){const k=clamp(t*1.5-i*.17),rr=r*(.1+.9*(1-(1-k)**2));if(k>0&&k<1){this.arc(x,y,rr,0,TAU,c,(1-k)*.65,7-i*2);this.arc(x,y,rr+4,0,TAU,WHITE,(1-k)*.6,1,this.glow);}}
   this.halo(x,y,r*.45,c,fade*.4);
   for(let i=0;i<(this.reduced?5:12);i++){const angle=i*TAU/12+spin*.2,d=size*.8,px=x+Math.cos(angle)*d,py=y+Math.sin(angle)*d;g.fillStyle(c,fade*.65).fillTriangle(px+Math.cos(angle)*18*fade,py+Math.sin(angle)*18*fade,px-Math.sin(angle)*4,py+Math.cos(angle)*4,px+Math.sin(angle)*4,py-Math.cos(angle)*4);}
   this.sparks(e,t);
  }else if(kind==='sanctuary'){
   this.seal(x,y,size,c,fade*.8,-spin*.35);
   for(let i=0;i<(this.reduced?4:10);i++){const angle=i*TAU/10,px=x+Math.cos(angle)*size*.8,py=y+Math.sin(angle)*size*.8;g.lineStyle(8,c,fade*.1).lineBetween(px,py,px,py-65*fade);g.lineStyle(1,WHITE,fade*.45).lineBetween(px,py,px,py-65*fade);this.star(px,py-65*fade,5,c,fade);}
   this.cross(x,y-t*35,12,c,fade);
  }else if(kind==='break'){
   for(let i=0;i<6;i++){const angle=a+i*TAU/6,px=x+Math.cos(angle)*size*.6,py=y+Math.sin(angle)*size*.6+t*t*22;g.fillStyle(c,fade*.85).fillTriangle(px,py-7,px-4,py+5,px+6,py+2);}
   this.lightning({x:x-15,y:y-28},{x:x+12,y:y+22},c,fade,0);this.arc(x,y,size,0,TAU,c,fade*.6,2);
  }else if(['heal','potion','mana'].includes(kind)){
   this.seal(x,y+20,r*(.6+t*.3),c,fade*.7,-spin*.8);
   for(let i=0;i<(this.reduced?3:8);i++){const k=(t+i*.13)%1,angle=i*2.399,px=x+Math.cos(angle)*r*.55,py=y+15-k*70,alpha=Math.sin(k*Math.PI)*fade;
    if(kind==='heal'||kind==='potion')this.cross(px,py,4+i%3,c,alpha);else this.star(px,py,5,c,alpha);
   }
   if(kind==='heal')this.cross(x,y-10-t*30,10,c,fade);
   this.halo(x,y,26,c,fade*.18);
  }else if(kind==='counter'||kind==='guard'||kind==='barrier'){
   this.seal(x,y+15,size*.85,c,fade*.65,spin);
   if(kind==='counter'){
    for(let i=0;i<5;i++){const angle=a+i*TAU/5+spin*4,px=x+Math.cos(angle)*size*.8,py=y+Math.sin(angle)*size*.8;this.arc(x,y,size*.8,angle-.5,angle,c,fade*.65,4);g.fillStyle(WHITE,fade).fillTriangle(px+Math.cos(angle)*13,py+Math.sin(angle)*13,px-Math.sin(angle)*5,py+Math.cos(angle)*5,px+Math.sin(angle)*5,py-Math.cos(angle)*5);}
   }else{
    for(let i=0;i<6;i++){const angle=i*TAU/6,px=x+Math.cos(angle)*size*.65,py=y+Math.sin(angle)*size*.65;const points=[];for(let j=0;j<=6;j++){const aa=j*TAU/6;points.push({x:px+Math.cos(aa)*12,y:py+Math.sin(aa)*12});}this.path(points,c,fade*.75,2);}
    this.arc(x,y,size,0,TAU,WHITE,fade*.5,2);
   }
   this.sparks(e,t);
  }else if(kind==='fan'){
   for(let i=-2;i<=2;i++){const angle=a+i*.18,len=size;this.path([{x:x+Math.cos(angle)*12,y:y+Math.sin(angle)*12},{x:x+Math.cos(angle)*len,y:y+Math.sin(angle)*len}],c,fade*.6,2);this.star(x+Math.cos(angle)*len,y+Math.sin(angle)*len,5,c,fade);}
   this.arc(x,y,size,a-.65,a+.65,WHITE,fade*.65,2);
  }else if(kind==='veil'){
   for(let i=0;i<5;i++)this.arc(x,y,size*(.6+i*.08),i*TAU/5-spin*3,i*TAU/5-spin*3+1.4,c,fade*.7,6-i*.7);
   this.sparks(e,t,true);
  }else{
   // Cast, nova, sanctuary, guard/counter, barrier, warcry, quake and hit.
   const small=kind==='impact';this.halo(x,y,size*(small?.7:.5),c,fade*(small?.7:.25));
   this.arc(x,y,size,0,TAU,c,fade*.65,small?2:3,this.ground);
   if(!small){this.seal(x,y,size*.8,c,fade*.6,spin*(kind==='cast'?-1:1));for(let i=0;i<3;i++)this.arc(x,y,size*(.45+i*.16),a+i*TAU/3+spin*3,a+i*TAU/3+spin*3+1.5,i%2?WHITE:c,fade*.7,3);}
   if(kind==='quake')for(let i=0;i<10;i++){const angle=i*TAU/10,points=[];for(let j=0;j<5;j++){const d=size*j/4;points.push({x:x+Math.cos(angle)*d+Math.sin(j*9+i)*8,y:y+Math.sin(angle)*d});}this.path(points,c,fade*.75,2,this.ground);}
   if(kind==='warcry')for(let i=0;i<5;i++){const angle=i*TAU/5;this.star(x+Math.cos(angle)*size*.7,y+Math.sin(angle)*size*.4-t*40,7*fade,c,fade);}
   if(small){this.star(x,y,16*fade,WHITE,fade);this.path([{x:x-16*ease,y:y+12*ease},{x:x+16*ease,y:y-12*ease}],c,fade,2);}
   this.sparks(e,t);
  }
  if(['slash','power','combo','whirl','beam','burn','bind','break','fan'].includes(kind))this.sparks(e,t);
 }
 update(now,origin,shots=[],guard=false,fields=[],barrier=false,evade=false,buffs={}){
  this.g.clear();this.ground.clear();this.glow.clear();
  for(const f of fields)this.field(now,f);
  for(const shot of shots)this.projectile(shot,now);
  this.aura(now,origin,guard,barrier,evade,buffs);
  for(let i=this.bursts.length-1;i>=0;i--){const e=this.bursts[i],t=(now-e.start)/e.duration;if(t>=1){this.bursts.splice(i,1);continue;}if(t<0)continue;
   const margin=e.radius+230;if(!e.to&&!this.visible(e,margin))continue;this.burst(e,this.reduced?Math.round(t*12)/12:t);
  }
 }
 destroy(){this.bursts=[];this.g.destroy();this.ground.destroy();this.glow.destroy();}
}
