// An advancing cone: each enemy takes one hit per cast, regardless of visual barrel count.
export function launchIceCannon(combat,p,aim,skill,damage){
 combat.iceWaves??=[];combat.iceWaves.push({p:{...p},aim:{...aim},skill,damage,age:0,hit:new Set()});
 combat.flash(p,70,0xb9f5ff,'nova');
}
export function updateIceCannon(combat,delta,g){
 if(combat.busy){combat.iceWaves=[];return;}
 for(let i=(combat.iceWaves?.length||0)-1;i>=0;i--){
  const w=combat.iceWaves[i],old=w.age;w.age+=Math.min(delta,50);const front=Math.min(w.skill.range,w.age*.65),back=Math.max(0,old*.65-28),base=Math.atan2(w.aim.y,w.aim.x),k=w.age/950;
  for(const t of combat.targets.values()){
   if(w.hit.has(t)||t.hp<=0||t.returning||t.entity.sprite.active===false)continue;
   const point=combat.targetPoint(t),dx=point.x-w.p.x,dy=point.y-w.p.y,d=Math.hypot(dx,dy),dot=(dx*w.aim.x+dy*w.aim.y)/(d||1);
   if(d>=back&&d<=front+24&&dot>=Math.cos(w.skill.spread)&&combat.clearLine(w.p,point)){w.hit.add(t);combat.hit(t,w.damage);combat.flash(point,32,0xc1f8ff,'nova');}
  }
  for(let n=0;n<9;n++){
   const a=base+(n-4)*w.skill.spread/4,d=Math.min(w.skill.range,front),x=w.p.x+Math.cos(a)*d,y=w.p.y+Math.sin(a)*d,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,len=35+n%3*7,width=10;
   if(!combat.clearLine(w.p,{x,y}))continue;
   const x1=x-dx*len,y1=y-dy*len;
   g.lineStyle(23,0x68ccef,.12*(1-k)).lineBetween(x1,y1,x,y);
   g.fillStyle(0x73bfdf,.9*(1-k*.4)).fillTriangle(x1+nx*width,y1+ny*width,x1-nx*width,y1-ny*width,x-nx*width,y-ny*width).fillTriangle(x1+nx*width,y1+ny*width,x-nx*width,y-ny*width,x+nx*width,y+ny*width);
   g.lineStyle(2,0xe7ffff,.9).lineBetween(x1+nx*width,y1+ny*width,x+nx*width,y+ny*width).lineBetween(x1,y1,x,y);
   g.fillStyle(0xcdf6ff,.95).fillEllipse(x,y,18,15);g.lineStyle(2,0xefffff,.95).strokeEllipse(x,y,18,15);
   for(let j=0;j<3;j++){const q=d-45-j*18;g.fillStyle(0xc8f8ff,(1-k)*.55).fillRect(w.p.x+dx*q+nx*Math.sin(n+j)*16,w.p.y+dy*q+ny*Math.sin(n+j)*16,3,3);}
  }
  if(w.age>=950)combat.iceWaves.splice(i,1);
 }
}
