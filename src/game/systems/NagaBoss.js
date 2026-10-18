// Boss riêng, dùng chung hệ nhận sát thương và kỹ năng của người chơi.
export class NagaBoss {
 constructor(scene){
  this.scene=scene;this.elapsed=0;this.nextCast=1800;this.nextMelee=0;this.castCount=0;this.warning=null;this.bullets=[];this.defeated=false;
  this.makeTextures();
  const sprite=scene.physics.add.sprite(864,650,'naga-walk-0').setOrigin(.5,1).setScale(2).setDepth(750);
  sprite.body.setSize(32,18).setOffset(16,59).setAllowGravity(false).setCollideWorldBounds(true);
  const shadow=scene.add.ellipse(864,646,110,30,0x000000,.3).setDepth(749);
  this.collider=scene.physics.add.collider(sprite,scene.world.blockers);
  this.entity={sprite,shadow,home:{x:864,y:650},data:{boss:true,hp:1500,damage:25,ai:false},destroy:()=>{this.collider?.destroy();sprite.destroy();shadow.destroy();}};
  scene.monsters.push(this.entity);
  this.target={entity:this.entity,hp:1500,maxHP:1500,damage:25,aggro:false,nextHit:Infinity};
  scene.combat.targets.set(this.entity,this.target);
  this.fx=scene.add.graphics().setDepth(9499);
  this.root=document.createElement('section');this.root.className='naga-boss-hud';this.root.setAttribute('aria-label','Máu boss NaGa');
  this.root.innerHTML='<div class="naga-boss-name">NAGA · CHÚA TỂ HANG ĐỘNG</div><div class="naga-boss-track" role="progressbar" aria-label="Máu NaGa" aria-valuemin="0" aria-valuemax="1500"><div class="naga-boss-fill"></div><span class="naga-boss-value"></span></div><div class="naga-boss-status"></div>';
  document.body.appendChild(this.root);
  if(!document.getElementById('naga-boss-css')){const css=document.createElement('link');css.id='naga-boss-css';css.rel='stylesheet';css.href='/assets/style/nagaBoss.css';document.head.appendChild(css);}
  this.tick=(time,delta)=>this.update(delta);scene.events.on('postupdate',this.tick);scene.events.once('shutdown',()=>this.destroy());this.updateHUD('Tiến vào đấu trường để khiêu chiến');
 }
 makeTextures(){
  const s=this.scene;
  for(let frame=0;frame<6;frame++){
   const key='naga-walk-'+frame;if(s.textures.exists(key))continue;
   const tex=s.textures.createCanvas(key,64,80),c=tex.context,wave=Math.round(Math.sin(frame*Math.PI/3)*4),bob=frame%3===0?1:0;
   c.imageSmoothingEnabled=false;
   const poly=(p,col)=>{c.fillStyle=col;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
   poly([[29,43],[43,49],[52+wave,62],[48,74],[15,77],[6-wave,70],[12,60],[23,65],[34,65],[32,58]],'#112c2a');
   poly([[29,46],[40,51],[47+wave,63],[42,70],[17,72],[11-wave,68],[15,64],[25,68],[37,66],[36,57]],'#4d9764');
   for(let j=0;j<6;j++){c.fillStyle=j%2?'#92bb70':'#2d674f';c.fillRect(17+j*4,68+(j%2)*2,3,3);}
   poly([[18,16+bob],[9,23],[8,40],[19,49],[45,49],[56,40],[55,23],[46,16+bob]],'#183d37');
   poly([[19,19],[12,26],[14,39],[22,44],[42,44],[50,39],[52,26],[45,19]],'#559c69');
   poly([[24,22+bob],[40,22+bob],[44,49],[38,60],[27,60],[20,49]],'#a7bd79');
   for(let j=0;j<5;j++){c.fillStyle='#647e55';c.fillRect(24,32+j*5,16,2);}
   poly([[23,7+bob],[40,7+bob],[45,18+bob],[39,29+bob],[25,29+bob],[19,18+bob]],'#244f43');
   poly([[24,10+bob],[39,10+bob],[42,18+bob],[36,25+bob],[26,25+bob],[22,18+bob]],'#75b57c');
   poly([[21,12],[18,0],[28,8],[32,2],[36,8],[47,0],[42,14]],'#d3b46c');
   c.fillStyle='#f5d765';c.fillRect(24,16+bob,6,3);c.fillRect(35,16+bob,6,3);c.fillStyle='#10252c';c.fillRect(27,16+bob,2,3);c.fillRect(36,16+bob,2,3);
   c.fillStyle='#f1efc5';c.fillRect(27,24+bob,2,5);c.fillRect(36,24+bob,2,5);
   poly([[20,32],[10,38],[3,53],[7,57],[17,46],[24,41]],'#407a58');poly([[44,32],[53,38],[60,53],[56,57],[47,46],[40,41]],'#407a58');
   c.fillStyle='#d3dba3';c.fillRect(2,52,3,8);c.fillRect(58,52,3,8);tex.refresh();
  }
 }
 updateHUD(status){const hp=Math.max(0,this.target.hp);this.root.querySelector('.naga-boss-fill').style.width=(hp/15)+'%';this.root.querySelector('.naga-boss-value').textContent=`${Math.ceil(hp)} / 1.500 HP`;this.root.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.ceil(hp)));this.root.querySelector('.naga-boss-status').textContent=status;}
 reset(){this.target.hp=1500;this.target.aggro=false;this.entity.sprite.body.reset(864,650);this.warning=null;this.bullets=[];this.nextCast=this.elapsed+2000;}
 update(delta=16){
  const s=this.scene,c=s.combat,p=c.origin(),sprite=this.entity.sprite,g=this.fx;g.clear();
  if(this.target.hp<=0){if(!this.defeated){this.defeated=true;this.warning=null;this.bullets=[];sprite.body.stop();this.updateHUD('Đã đánh bại NaGa · Cổng trở về ở phía Nam');s.hud?.toast('Đã đánh bại NaGa!');}return;}
  if(s.rpgState.data.hp<=0){this.reset();this.updateHUD('NaGa trở về tổ');return;}
  if(c.busy){sprite.body.stop();this.warning=null;this.bullets=[];this.nextCast=Math.max(this.nextCast,this.elapsed+1000);this.updateHUD('Tạm dừng');return;}
  this.elapsed+=Math.min(delta,50);const now=this.elapsed;
  const dx=p.x-sprite.x,dy=p.y-sprite.y,d=Math.hypot(dx,dy),active=p.y<1080&&(d<650||this.target.hp<1500);
  this.target.aggro=false;
  if(active){
   if(!this.warning&&now>=this.nextCast){this.warning={kind:this.castCount++%2?'wave':'venom',x:sprite.x,y:sprite.y-50,aim:{...p},until:now+1100};this.nextCast=now+4400;}
   if(!this.warning&&d>115){const nx=dx/d*80,ny=dy/d*80;sprite.body.setVelocity(nx,ny);}else sprite.body.stop();
   if(d<110&&now>=this.nextMelee){this.nextMelee=now+1300;c.damagePlayer(Math.max(8,28-Math.floor(s.rpgState.defense/3)));}
  }else{sprite.body.stop();this.warning=null;this.bullets=[];}
  const moving=Math.hypot(sprite.body.velocity.x,sprite.body.velocity.y)>1;
  sprite.setTexture('naga-walk-'+(moving?Math.floor(now/115)%6:Math.floor(now/350)%2));sprite.setFlipX(dx<0);sprite.setDepth(100+sprite.y);this.entity.shadow.setPosition(sprite.x,sprite.y-4).setDepth(99+sprite.y);
  if(this.warning){const w=this.warning,k=1-Math.max(0,w.until-now)/1100;this.updateHUD(w.kind==='wave'?'CHẤN ĐỘNG · Ra khỏi vòng đỏ!':'ĐỘC NHA · Né loạt đạn!');
   if(w.kind==='wave'){g.fillStyle(0xef624b,.12+k*.15).fillCircle(w.x,w.y,175);g.lineStyle(3,0xffac76,.9).strokeCircle(w.x,w.y,175);g.lineStyle(3,0xffddad,.7).strokeCircle(w.x,w.y,175*k);}
   else {g.lineStyle(16,0x9cf466,.25).lineBetween(w.x,w.y,w.aim.x,w.aim.y);g.lineStyle(2,0xdcffa6,.8).lineBetween(w.x,w.y,w.aim.x,w.aim.y);}
   if(now>=w.until){if(w.kind==='wave'){if(Math.hypot(p.x-w.x,p.y-w.y)<175)c.damagePlayer(Math.max(15,65-Math.floor(s.rpgState.defense/4)));c.vfx.emit('nova',w,175,0xef9867);}
    else {const a=Math.atan2(w.aim.y-w.y,w.aim.x-w.x);for(let i=-2;i<=2;i++)this.bullets.push({x:w.x,y:w.y,dx:Math.cos(a+i*.19),dy:Math.sin(a+i*.19),life:2300});}this.warning=null;}
  }else this.updateHUD(active?'Đang giao chiến':'Tiến vào đấu trường để khiêu chiến');
  for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i],dt=Math.min(delta,50),old={x:b.x,y:b.y};b.x+=b.dx*245*dt/1000;b.y+=b.dy*245*dt/1000;b.life-=dt;
   const vx=b.x-old.x,vy=b.y-old.y,t=Math.max(0,Math.min(1,((p.x-old.x)*vx+(p.y-old.y)*vy)/(vx*vx+vy*vy||1))),hit=Math.hypot(p.x-old.x-vx*t,p.y-old.y-vy*t)<23;
   if(hit){c.damagePlayer(Math.max(6,32-Math.floor(s.rpgState.defense/4)));c.vfx.emit('impact',b,28,0xb9ef72);}
   if(hit||b.life<=0||!c.clearLine(old,b)){this.bullets.splice(i,1);continue;}g.fillStyle(0x9de966,.15).fillCircle(b.x,b.y,18);g.fillStyle(0x93d95e,.85).fillCircle(b.x,b.y,8);g.fillStyle(0xe9ffd4).fillCircle(b.x-2,b.y-2,3);
  }
 }
 destroy(){this.scene.events.off('postupdate',this.tick);this.root.remove();this.fx.destroy();this.bullets=[];this.warning=null;}
}
