import { PotionLoadout } from './PotionLoadout.js';
import { CombatVFX } from './CombatVFX.js';
import { ITEMS } from '../data/items.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export function segmentDistance(p,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const t=len?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1):0;
  return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);
}
export function segmentHitsRect(a,b,r) {
  let low=0,high=1;
  for (const [start,delta,min,max] of [[a.x,b.x-a.x,r.x,r.x+r.width],[a.y,b.y-a.y,r.y,r.y+r.height]]) {
    if (Math.abs(delta)<1e-8) { if(start<min||start>max)return false; }
    else { let t1=(min-start)/delta,t2=(max-start)/delta;if(t1>t2)[t1,t2]=[t2,t1];low=Math.max(low,t1);high=Math.min(high,t2);if(low>high)return false; }
  }
  return true;
}
export class CombatSystem {
  constructor(scene, notify=()=>{}) {
    this.scene=scene;this.notify=notify;this.targets=new Map();this.shots=[];this.effects=[];this.facing={x:0,y:1};this.alive=true;
    this.graphics=scene.add.graphics().setDepth(9500);
    this.potions=new PotionLoadout(()=>this.state);this.vfx=new CombatVFX(scene);this.uiBlocked=false;
    this.tick=(time,delta)=>this.update(time,delta);
    scene.events.on('postupdate',this.tick);scene.events.once('shutdown',()=>this.destroy());
  }
  get state(){return this.scene.rpgState;}
  get now(){return this.scene.time.now;}
  get runtime(){
    const s=this.state;if(!s)return {cooldowns:{},guardUntil:0};
    const key=`combat-runtime:${s.userId??''}:${s.data.characterId??''}`;
    let r=this.scene.registry.get(key);
    if(!r){r={cooldowns:{},guardUntil:0};this.scene.registry.set(key,r);}return r;
  }
  // Cooldowns dùng đồng hồ game chung để không reset khi đổi map.
  get clock(){return this.scene.game.loop.time;}
  get weapon(){return ITEMS[this.state?.data.equipment?.weapon];}
  get busy(){const f=this.scene.fishingSystem;return this.uiBlocked || !this.state || this.state.data.hp<=0 || this.scene.hud?.blocked || this.scene.dialogue?.isOpen || f?.basketOpen || (f?.phase && f.phase!=='idle');}
  remaining(id){return Math.max(0,(this.runtime.cooldowns[id]||0)-this.clock);}
  origin(){const s=this.scene.player?.sprite;return s?{x:s.x,y:s.y}:null;}
  targetPoint(t){const s=t.entity.sprite;return {x:s.x,y:s.y-s.displayHeight*(s.originY??0.5)+s.displayHeight/2};}
  clearLine(a,b){
    return !(this.scene.world?.blockers?.getChildren?.()||[]).some(o=>{
      if(o.active===false||o.body?.enable===false)return false;
      const r=o.body?{x:o.body.x,y:o.body.y,width:o.body.width,height:o.body.height}:o.getBounds?.();
      return r&&segmentHitsRect(a,b,r);
    });
  }
  ready(skill){
    if(this.busy)return 'Đóng menu/hội thoại hoặc kết thúc câu cá trước.';
    if(this.remaining(skill.id)>0)return 'Kỹ năng đang hồi.';
    if(skill.weapon&&!this.weapon)return 'Mở Balo và trang bị vũ khí trước.';
    if(this.state.data.mp<skill.mana)return 'Không đủ mana.';
    if(skill.id==='heal'&&this.state.data.hp>=this.state.maxHP)return 'Máu đã đầy.';
    return '';
  }
  cast(id){
    const skill=COMBAT_SKILLS.find(s=>s.id===id);if(!skill)return false;
    const error=this.ready(skill);if(error){this.notify(error);return false;}
    if(!this.state.spendMana(skill.mana))return false;
    this.runtime.cooldowns[id]=this.clock+skill.cooldown;
    const damage=Math.max(1,this.state.attack),p=this.origin();
    if(id==='power'){this.melee(damage*1.6,112,false);this.flash(p,112,0xffd37a,'power');}
    if(id==='bolt')this.projectile(damage*1.2,320,0x86d9ff);
    if(id==='whirl'){this.melee(damage,125,true);this.flash(p,125,0x7ce1d0,'whirl');}
    if(id==='guard'){this.runtime.guardUntil=this.clock+5000;this.flash(p,50,0x9cbaff);}
    if(id==='heal'){
      const amount=Math.min(30,this.state.maxHP-this.state.data.hp);this.state.data.hp+=amount;this.state.changed();
      this.float(p,`+${amount} HP`,'#a5f6b2');this.flash(p,48,0x89efa9,'heal');
    }
    return true;
  }
  attack(){
    if(this.busy||this.remaining('basic'))return false;
    this.runtime.cooldowns.basic=this.clock+550;
    const staff=/staff|wand|trượng/i.test(this.state.data.equipment?.weapon??'');
    if(staff)this.projectile(this.state.attack,260,0xe7cfff);
    else {this.melee(this.state.attack,92,false);this.flash(this.origin(),88,0xf8dd99,'slash');}
    return true;
  }
  potion(kind){
    if(this.busy||this.remaining(kind))return false;
    const selection=this.potions.selected(kind),id=selection?.id;
    if(!id){this.notify('Chưa gán bình. Nhấn nút chọn cạnh ô bình để gán.');return false;}
    if(selection.quantity<=0){this.notify(`${selection.name} đã hết. Hãy mua thêm hoặc gán cấp khác.`);return false;}
    const count=this.state.data.inventory[id];this.notify(this.state.useItem(id));
    if(this.state.data.inventory[id]<count){this.runtime.cooldowns[kind]=this.clock+900;this.flash(this.origin(),45,kind==='hp'?0xf88996:0x77d9ff,'potion');return true;}return false;
  }
  potionCount(kind){return this.potions.selected(kind)?.quantity??0;}
  melee(damage,range,all){
    const p=this.origin();if(!p)return;
    const hits=[...this.targets.values()].filter(t=>{
      if(t.hp<=0||t.entity.sprite.active===false)return false;
      const q=this.targetPoint(t),dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
      return d<=range&&(all||d<20||(dx*this.facing.x+dy*this.facing.y)/d>=0.15)&&this.clearLine(p,q);
    }).sort((a,b)=>Math.hypot(this.targetPoint(a).x-p.x,this.targetPoint(a).y-p.y)-Math.hypot(this.targetPoint(b).x-p.x,this.targetPoint(b).y-p.y));
    for(const t of (all?hits:hits.slice(0,1)))this.hit(t,damage);
  }
  projectile(damage,range,color){const p=this.origin();if(p)this.shots.push({...p,dx:this.facing.x,dy:this.facing.y,damage,left:range,color,trail:[]});}
  hit(t,damage){
    if(t.hp<=0)return;t.hp=Math.max(0,t.hp-Math.round(damage));t.aggro=true;t.visibleUntil=this.now+4500;
    this.float(this.targetPoint(t),`−${Math.round(damage)}`,'#ffe0ad');
    this.flash(this.targetPoint(t),34,0xffd397,'impact');
    if(t.hp===0){
      t.respawnAt=this.now+15000;t.aggro=false;
      for(const o of [t.entity.sprite,t.entity.shadow,t.entity.label])o?.setVisible(false);
      this.notify('Hạ quái! Quái sẽ xuất hiện lại sau 15 giây.');
    }
  }
  damagePlayer(amount){
    if(this.state.data.hp<=0)return;
    const reduced=this.runtime.guardUntil>this.clock?Math.ceil(amount/2):amount;
    this.state.takeDamage(reduced);this.float(this.origin(),`−${reduced}`,'#ff9b8e');
    if(this.state.data.hp<=0){this.scene.player.stop();this.deathAt=this.now+1600;this.notify('Bạn bị hạ. Đang trở về điểm vào map…');}
  }
  flash(p,radius,color,kind='ring'){this.vfx.emit(kind,p,radius,color,Math.atan2(this.facing.y,this.facing.x));}
  float(p,text,color){if(!p)return;const o=this.scene.add.text(p.x,p.y-30,text,{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color,stroke:'#152b23',strokeThickness:4}).setOrigin(.5).setDepth(9600);this.effects.push({text:o,y:o.y,at:this.now,end:this.now+750});}
  update(time,delta=16){
    if(!this.alive||!this.state||!this.scene.player)return;
    if(this.state.data.hp<=0||this.uiBlocked)this.scene.player.stop();
    const v=this.scene.player.sprite.body?.velocity;if(v&&Math.hypot(v.x,v.y)>1){const l=Math.hypot(v.x,v.y);this.facing={x:v.x/l,y:v.y/l};}
    for(const entity of this.scene.monsters||[])if(entity.sprite?.active&&!this.targets.has(entity))this.targets.set(entity,{entity,hp:60,maxHP:60,aggro:false,nextHit:0});
    const g=this.graphics;g.clear();
    for(const t of this.targets.values()){
      if(!t.entity.sprite.active)continue;
      if(t.hp<=0){if(this.now>=t.respawnAt){t.hp=t.maxHP;t.aggro=false;for(const o of [t.entity.sprite,t.entity.shadow,t.entity.label])o?.setVisible(true);}else continue;}
      const p=this.targetPoint(t),me=this.origin();
      if(t.aggro&&!this.busy&&this.now>=t.nextHit&&Math.hypot(p.x-me.x,p.y-me.y)<95&&this.clearLine(p,me)){
        t.nextHit=this.now+1300;this.damagePlayer(Math.max(2,10-Math.floor(this.state.defense/2)));
      }
      if(t.hp<t.maxHP){const y=p.y-t.entity.sprite.displayHeight/2-8;g.fillStyle(0x172b24,.95).fillRect(p.x-23,y,46,6);g.fillStyle(0xe9806e,1).fillRect(p.x-22,y+1,44*t.hp/t.maxHP,4);}
    }
    if(this.deathAt&&this.now>=this.deathAt){
      this.deathAt=0;const spawn={...this.scene.mapData.player,...this.scene.spawn};const s=this.scene.player.sprite;
      s.body?.reset?s.body.reset(spawn.x,spawn.y):s.setPosition(spawn.x,spawn.y);
      this.state.data.hp=this.state.maxHP;this.state.changed();for(const t of this.targets.values())t.aggro=false;
    }
    // Không gây sát thương trong lúc menu/hội thoại/câu cá đang mở.
    if(this.busy)this.shots=[];
    for(let i=this.shots.length-1;i>=0;i--){
      const shot=this.shots[i],step=Math.min(shot.left,420*Math.min(delta,50)/1000),a={x:shot.x,y:shot.y},b={x:shot.x+shot.dx*step,y:shot.y+shot.dy*step};
      if(!this.clearLine(a,b)){this.flash(a,20,shot.color,'impact');this.shots.splice(i,1);continue;}
      const target=[...this.targets.values()].find(t=>t.hp>0&&t.entity.sprite.active&&segmentDistance(this.targetPoint(t),a,b)<24);
      if(target){this.hit(target,shot.damage);this.shots.splice(i,1);continue;}
      shot.trail.push(a);if(shot.trail.length>10)shot.trail.shift();
      shot.x=b.x;shot.y=b.y;shot.left-=step;
      if(shot.left<=0){this.shots.splice(i,1);continue;}
      
    }
    this.vfx.update(this.now,this.origin(),this.shots,this.runtime.guardUntil>this.clock);
    for(let i=this.effects.length-1;i>=0;i--){
      const e=this.effects[i],k=clamp((this.now-e.at)/(e.end-e.at),0,1);
      if(k>=1){e.text?.destroy();this.effects.splice(i,1);continue;}
      if(e.text){e.text.setY(e.y-k*35).setAlpha(1-k);continue;}
      g.lineStyle(5*(1-k)+1,e.color,1-k);
      if(e.kind==='slash'){g.beginPath();g.arc(e.x,e.y,e.radius*(.5+k*.5),e.angle-1,e.angle+1);g.strokePath();}
      else g.strokeCircle(e.x,e.y,e.radius*(.2+k*.8));
    }
  }
  destroy(){if(!this.alive)return;this.alive=false;this.scene.events.off('postupdate',this.tick);this.graphics.destroy();this.vfx.destroy();for(const e of this.effects)e.text?.destroy();this.effects=[];this.shots=[];this.targets.clear();}
}
