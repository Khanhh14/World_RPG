import { PotionLoadout } from './PotionLoadout.js';
import { CombatVFX } from './CombatVFX.js';
import { ITEMS } from '../data/items.js';
import { findSkill, STARTER_SKILLS, skillSlots } from '../data/skillBooks.js';
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
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
    this.scene=scene;this.notify=notify;this.targets=new Map();this.shots=[];this.effects=[];this.fields=[];this.facing={x:0,y:1};this.alive=true;this.autoAttack=false;
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
    const blockers=this.scene.world?.blockers;
    return !(Array.isArray(blockers)?blockers:(blockers?.getChildren?.()||[])).some(o=>{
      if(o.active===false||o.body?.enable===false)return false;
      const r=o.body?{x:o.body.x,y:o.body.y,width:o.body.width,height:o.body.height}:o.getBounds?.();
      return r&&segmentHitsRect(a,b,r);
    });
  }
  ready(skill){
    if(!skill)return 'Ô này chưa gán kỹ năng.';
    if(!(this.state?.data.skills?.owned ?? STARTER_SKILLS).includes(skill.id))return 'Bạn chưa học kỹ năng này.';
    if(!skillSlots(this.state).includes(skill.id))return 'Kỹ năng chưa được gán vào ô.';
    if(this.busy)return 'Đóng menu/hội thoại hoặc kết thúc câu cá trước.';
    if(this.remaining(skill.id)>0)return 'Kỹ năng đang hồi.';
    if(skill.weapon&&!this.weapon)return 'Mở Balo và trang bị vũ khí trước.';
    if(this.state.data.mp<skill.mana)return 'Không đủ mana.';
    if((skill.effect || skill.id)==='heal'&&this.state.data.hp>=this.state.maxHP)return 'Máu đã đầy.';
    return '';
  }
  cast(id){
    const skill=findSkill(id);if(!skill)return false;
    const error=this.ready(skill);if(error){this.notify(error);return false;}
    if(!this.state.spendMana(skill.mana))return false;
    this.runtime.cooldowns[id]=this.clock+skill.cooldown;
    const damage=Math.max(1,this.state.attack),p=this.origin();
    const effect=skill.effect || id, color=skill.color;
    if(effect==='power'){this.melee(damage*(skill.multiplier ?? 1.6),skill.range ?? 112,false);this.flash(p,skill.range ?? 112,color ?? 0xffd37a,'power');}
    if(effect==='bolt')this.volley(skill,damage);
    if(effect==='whirl'){this.melee(damage*(skill.multiplier ?? 1),skill.range ?? 125,true);this.flash(p,skill.range ?? 125,color ?? 0x7ce1d0,'whirl');}
    if(effect==='guard'){
      this.runtime.guardUntil=this.clock+(skill.duration ?? 5000);
      this.runtime.guardReduction=skill.reduction ?? 0.5;
      this.flash(p,60,color ?? 0x9cbaff,'ring');
    }
    if(effect==='healingField' && p){
      this.fields=this.fields.filter(f=>f.skillId!==id);
      this.fields.push({...p,skillId:id,radius:skill.radius,color:color??0xffdf99,start:this.now,end:this.now+skill.duration,next:this.now+skill.interval,interval:skill.interval,heal:skill.heal});
      this.flash(p,skill.radius,color??0xffdf99,'sanctuary');
    }
    if(effect==='heal'){
      const amount=Math.min(skill.heal ?? 30,this.state.maxHP-this.state.data.hp);
      this.state.data.hp+=amount;this.state.changed();
      this.float(p,`+${amount} HP`,'#a5f6b2');this.flash(p,48,color ?? 0x89efa9,'heal');
    }
    if(effect==='drain'){
      const dealt=this.melee(damage*skill.multiplier,skill.range,true) || 0;
      const amount=Math.min(Math.floor(dealt*skill.lifesteal),this.state.maxHP-this.state.data.hp);
      if(amount>0){this.state.data.hp+=amount;this.state.changed();this.float(p,`+${amount} HP`,'#f6a5ce');}
      this.flash(p,skill.range,color,'whirl');
    }
    return true;
  }
  attack(){
    if(this.busy||this.remaining('basic'))return false;
    const mage=this.state.data.classCode==='mage';
    const target=this.nearestTarget(mage?320:92);
    if(!target)return false;
    this.runtime.cooldowns.basic=this.clock+550;
    if(mage)this.projectile(this.state.attack,320,0xe7cfff,target);
    else {
      const player=this.scene.player.sprite,point=this.targetPoint(target);
      this.facing={x:point.x-player.x,y:point.y-player.y};
      const length=Math.hypot(this.facing.x,this.facing.y)||1;
      this.facing.x/=length;this.facing.y/=length;
      player.setFlipX(this.facing.x<0);
      this.flash(this.origin(),78,0xffd990,'slash');
      this.hit(target,this.state.attack);
      this.flash(point,28,0xf8dd99,'impact');
    }
    return true;
  }
  nearestTarget(range){
    const origin=this.origin();
    if(!origin)return null;
    return [...this.targets.values()]
      .filter(target=>target.hp>0&&target.entity.sprite.active&&this.clearLine(origin,this.targetPoint(target)))
      .map(target=>({target,distance:distance(origin,this.targetPoint(target))}))
      .filter(entry=>entry.distance<=range)
      .sort((a,b)=>a.distance-b.distance)[0]?.target??null;
  }
  potion(kind){
    if(this.busy||this.remaining(kind))return false;
    const selection=this.potions.selected(kind),id=selection?.id;
    if(!id){this.notify('Chưa gán bình. Nhấn nút chọn cạnh ô bình để gán.');return false;}
    if(selection.quantity<=0){this.notify(`${selection.name} đã hết. Hãy mua thêm hoặc gán cấp khác.`);return false;}
    const count=this.state.data.inventory[id],message=this.state.useItem(id);
    if(this.state.data.inventory[id]<count){this.runtime.cooldowns[kind]=this.clock+900;this.flash(this.origin(),45,kind==='hp'?0xf88996:0x77d9ff,'potion');return true;}
    this.notify(message);
    return false;
  }
  potionCount(kind){return this.potions.selected(kind)?.quantity??0;}
  melee(damage,range,all){
    const p=this.origin();if(!p)return;
    const hits=[...this.targets.values()].filter(t=>{
      if(t.hp<=0||t.entity.sprite.active===false)return false;
      const q=this.targetPoint(t),dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
      return d<=range&&(all||d<20||(dx*this.facing.x+dy*this.facing.y)/d>=0.15)&&this.clearLine(p,q);
    }).sort((a,b)=>Math.hypot(this.targetPoint(a).x-p.x,this.targetPoint(a).y-p.y)-Math.hypot(this.targetPoint(b).x-p.x,this.targetPoint(b).y-p.y));
    let dealt=0;
    for(const t of (all?hits:hits.slice(0,1)))dealt+=this.hit(t,damage) || 0;
    return dealt;
  }
  nearbyTargets(point,range){
    return [...this.targets.values()].filter(t=>t.hp>0&&t.entity.sprite.active&&distance(point,this.targetPoint(t))<=range&&this.clearLine(point,this.targetPoint(t)))
      .sort((a,b)=>distance(point,this.targetPoint(a))-distance(point,this.targetPoint(b)));
  }
  volley(skill,damage){
    const p=this.origin();if(!p)return;
    const range=skill.range??320,color=skill.color??0x86d9ff,count=skill.projectiles??3;
    const targets=this.nearbyTargets(p,range);
    this.flash(p,64,color,'cast');
    for(let i=0;i<count;i++){
      const target=targets.length?targets[i%targets.length]:null;
      const a=Math.atan2(this.facing.y,this.facing.x)+(i-(count-1)/2)*.24;
      const shot=this.projectile(damage*(skill.multiplier??.5),range,color,target);
      Object.assign(shot,{dx:Math.cos(a),dy:Math.sin(a),homing:true,launchAt:this.now+i*95,expires:this.now+2600+i*95,speed:380+i*22});
    }
    // Giới hạn số cầu còn sống để tránh tích lũy khi chỉnh hồi chiêu trong lúc phát triển.
    if(this.shots.length>60)this.shots.splice(0,this.shots.length-60);
  }
  updateFields(){
    if(this.state.data.hp<=0){this.fields=[];return;}
    const p=this.origin();
    for(const f of this.fields){
      // Mỗi tick xét vị trí hiện tại. Không bù nhiều tick sau khi tab bị treo.
      if(this.now>=f.next&&f.next<=f.end&&this.now<=f.end+100){
        f.next=f.start+(Math.floor((this.now-f.start)/f.interval)+1)*f.interval;
        if(!this.busy&&p&&distance(p,f)<=f.radius){
          const amount=Math.max(0,Math.min(f.heal,this.state.maxHP-this.state.data.hp));
          if(amount){this.state.data.hp+=amount;this.state.changed();this.float(p,`+${amount} HP`,'#baffcb');this.flash(p,45,0xb5ffbc,'heal');}
        }
      }
    }
    this.fields=this.fields.filter(f=>this.now<=f.end);
  }
  projectile(damage,range,color,target=null){
    const p=this.origin();
    if(!p)return;
    const shot={...p,dx:this.facing.x,dy:this.facing.y,damage,left:range,color,trail:[],target};
    if(target){
      const point=this.targetPoint(target),dx=point.x-p.x,dy=point.y-p.y,length=Math.hypot(dx,dy)||1;
      shot.dx=dx/length;shot.dy=dy/length;
    }
    this.shots.push(shot);return shot;
  }
  hit(t,damage){
    if(t.hp<=0)return 0;const previousHP=t.hp;t.hp=Math.max(0,t.hp-Math.round(damage));t.aggro=true;t.chaseUntil=this.now+6000;t.visibleUntil=this.now+4500;
    this.float(this.targetPoint(t),`−${Math.round(damage)}`,'#ffe0ad');
    this.flash(this.targetPoint(t),34,0xffd397,'impact');
    if(t.hp===0){
      t.respawnAt=t.entity.data.boss?Infinity:this.now+15000;t.aggro=false;
      t.entity.sprite.body?.stop();
      for(const o of [t.entity.sprite,t.entity.shadow,t.entity.label])o?.setVisible(false);
      const forestReward=this.scene.mapData.id==='west-forest';
      if(forestReward){
        // Thưởng 30 EXP + 10 vàng được backend lưu qua recordKill().
      }
      const drop=ITEMS[t.entity.data.dropItem];
      if(drop&&Math.random()<0.25){
        if(this.state.addItem(t.entity.data.dropItem)){
          this.scene.hud?.toast(`Nhặt được ${drop.name}.`);
        }
      }
      if (this.scene.mapData.id === 'west-forest') void this.scene.questSystem?.recordKill();
    }
    return previousHP-t.hp;
  }
  damagePlayer(amount){
    if(this.state.data.hp<=0)return;
    const reduced=this.runtime.guardUntil>this.clock?Math.ceil(amount*(1-(this.runtime.guardReduction ?? .5))):amount;
    this.state.takeDamage(reduced);this.float(this.origin(),`−${reduced}`,'#ff9b8e');
    if(this.state.data.hp<=0){this.scene.player.stop();this.deathAt=this.now+1600;this.notify('Bạn bị hạ. Đang trở về điểm vào map…');}
  }
  flash(p,radius,color,kind='ring'){this.vfx.emit(kind,p,radius,color,Math.atan2(this.facing.y,this.facing.x));}
  float(p,text,color){if(!p)return;const o=this.scene.add.text(p.x,p.y-30,text,{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color,stroke:'#152b23',strokeThickness:4}).setOrigin(.5).setDepth(9600);this.effects.push({text:o,y:o.y,at:this.now,end:this.now+750});}
  monsterDirection(entity, target, distance, speed) {
    const dx=target.x-entity.sprite.x,dy=target.y-entity.sprite.y;
    if(distance<2)return {x:0,y:0};
    const desired=Math.atan2(dy,dx);
    const angles=[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI];
    for(const offset of angles){
      const angle=desired+offset;
      const destination={x:entity.sprite.x+Math.cos(angle)*32,y:entity.sprite.y+Math.sin(angle)*32};
      if(this.clearLine({x:entity.sprite.x,y:entity.sprite.y-18}, {x:destination.x,y:destination.y-18}))
        return {x:Math.cos(angle)*speed,y:Math.sin(angle)*speed};
    }
    return {x:0,y:0};
  }
  updateMonsterAI(target) {
    const {entity}=target,data=entity.data,body=entity.sprite.body;
    if(!data.ai||!body)return;
    if(target.hp<=0||this.busy){body.setVelocity(0,0);return;}

    const player=this.scene.player.sprite;
    const playerDistance=distance(entity.sprite,player);
    const detectionRange=data.detectionRange??260;
    const chaseRange=data.chaseRange??360;
    if(playerDistance<=detectionRange){
      target.aggro=true;
      target.chaseUntil=this.now+6000;
    }else if(target.aggro&&playerDistance>chaseRange&&this.now>=target.chaseUntil){
      target.aggro=false;
    }

    const speed=data.moveSpeed??72;
    let destination=null, movementSpeed=speed;
    if(target.aggro&&playerDistance<=chaseRange){
      destination={x:player.x,y:player.y};
    }else{
      target.aggro=false;
      if(!target.patrolTarget||this.now>=target.nextPatrolAt||
        distance(entity.sprite,target.patrolTarget)<10){
        const angle=Math.random()*Math.PI*2;
        const radius=24+Math.random()*52;
        target.patrolTarget={
          x:entity.home.x+Math.cos(angle)*radius,
          y:entity.home.y+Math.sin(angle)*radius
        };
        target.nextPatrolAt=this.now+1200+Math.random()*1600;
      }
      destination=target.patrolTarget;
      movementSpeed=28;
    }
    const direction=this.monsterDirection(entity,destination,distance(entity.sprite,destination),movementSpeed);
    body.setVelocity(direction.x,direction.y);
    if(direction.x)entity.sprite.setFlipX(direction.x<0);

    if(Math.hypot(body.velocity.x,body.velocity.y)>0){
      entity.sprite.setDepth(100+entity.sprite.y);
      entity.shadow.setPosition(entity.sprite.x,entity.sprite.y-2).setDepth(99+entity.sprite.y);
      entity.label?.setPosition(entity.sprite.x,entity.sprite.y-entity.sprite.displayHeight-8);
    }
  }
  update(time,delta=16){
    if(!this.alive||!this.state||!this.scene.player)return;
    if(this.state.data.hp<=0||this.uiBlocked)this.scene.player.stop();
    const v=this.scene.player.sprite.body?.velocity;if(v&&Math.hypot(v.x,v.y)>1){const l=Math.hypot(v.x,v.y);this.facing={x:v.x/l,y:v.y/l};}
    for(const entity of this.scene.monsters||[])if(entity.sprite?.active&&!this.targets.has(entity)){
      const hp=entity.data.hp??60;
      this.targets.set(entity,{entity,hp,maxHP:hp,damage:entity.data.damage??10,aggro:false,nextHit:0,chaseUntil:0});
    }
    this.autoMoveDirection=null;
    if(this.autoAttack&&!this.busy){
      const target=this.nearestTarget(320);
      if(target){
        const point=this.targetPoint(target),player=this.origin(),mage=this.state.data.classCode==='mage';
        const attackRange=mage?320:78;
        const dx=point.x-player.x,dy=point.y-player.y,targetDistance=Math.hypot(dx,dy);
        if(!mage&&targetDistance>attackRange){
          this.autoMoveDirection={x:dx/targetDistance,y:dy/targetDistance};
        }
        if(targetDistance<=attackRange&&this.remaining('basic')<=0)this.attack();
      }
    }
    this.updateFields();
    const g=this.graphics;g.clear();
    for(const t of this.targets.values()){
      if(!t.entity.sprite.active)continue;
      if(t.hp<=0){if(this.now>=t.respawnAt){t.hp=t.maxHP;t.aggro=false;t.entity.sprite.setPosition(t.entity.home?.x??t.entity.sprite.x,t.entity.home?.y??t.entity.sprite.y);t.entity.sprite.body?.reset(t.entity.sprite.x,t.entity.sprite.y);for(const o of [t.entity.sprite,t.entity.shadow,t.entity.label])o?.setVisible(true);}else continue;}
      this.updateMonsterAI(t);
      const p=this.targetPoint(t),me=this.origin();
      if(!t.entity.data.boss&&t.aggro&&!this.busy&&this.now>=t.nextHit&&Math.hypot(p.x-me.x,p.y-me.y)<95&&this.clearLine(p,me)){
        t.nextHit=this.now+1300;this.damagePlayer(Math.max(2,t.damage-Math.floor(this.state.defense/2)));
      }
      if(!t.entity.data.boss&&t.hp<t.maxHP){const y=p.y-t.entity.sprite.displayHeight/2-8;g.fillStyle(0x172b24,.95).fillRect(p.x-23,y,46,6);g.fillStyle(0xe9806e,1).fillRect(p.x-22,y+1,44*t.hp/t.maxHP,4);}
    }
    if(this.deathAt&&this.now>=this.deathAt){
      this.deathAt=0;const spawn={...this.scene.mapData.player,...this.scene.spawn};const s=this.scene.player.sprite;
      s.body?.reset?s.body.reset(spawn.x,spawn.y):s.setPosition(spawn.x,spawn.y);
      this.state.data.hp=this.state.maxHP;this.state.changed();for(const t of this.targets.values())t.aggro=false;
    }
    // Không gây sát thương trong lúc menu/hội thoại/câu cá đang mở.
    if(this.busy)this.shots=[];
    for(let i=this.shots.length-1;i>=0;i--){
      const shot=this.shots[i];
      if(shot.launchAt>this.now)continue;
      if(shot.expires&&this.now>shot.expires){this.shots.splice(i,1);continue;}
      if(shot.homing && (!shot.target || shot.target.hp<=0 || !shot.target.entity.sprite.active || !this.clearLine(shot,this.targetPoint(shot.target)))){
        shot.target=this.nearbyTargets(shot,shot.left)[0]??null;
      }
      if(shot.target){
        if(shot.target.hp<=0||shot.target.entity.sprite.active===false){this.shots.splice(i,1);continue;}
        const point=this.targetPoint(shot.target),dx=point.x-shot.x,dy=point.y-shot.y,length=Math.hypot(dx,dy)||1;
        shot.dx=dx/length;shot.dy=dy/length;
      }
      const step=Math.min(shot.left,(shot.speed??420)*Math.min(delta,50)/1000),a={x:shot.x,y:shot.y},b={x:shot.x+shot.dx*step,y:shot.y+shot.dy*step};
      if(!this.clearLine(a,b)){this.flash(a,20,shot.color,'impact');this.shots.splice(i,1);continue;}
      const target=shot.target
        ? segmentDistance(this.targetPoint(shot.target),a,b)<24?shot.target:null
        : [...this.targets.values()].find(t=>t.hp>0&&t.entity.sprite.active&&segmentDistance(this.targetPoint(t),a,b)<24);
      if(target){this.hit(target,shot.damage);this.flash(this.targetPoint(target),42,shot.color,'nova');this.shots.splice(i,1);continue;}
      shot.trail.push(a);if(shot.trail.length>10)shot.trail.shift();
      shot.x=b.x;shot.y=b.y;shot.left-=step;
      if(shot.left<=0){this.shots.splice(i,1);continue;}
      
    }
    this.vfx.update(this.now,this.origin(),this.shots.filter(s=>!s.launchAt||s.launchAt<=this.now),this.runtime.guardUntil>this.clock,this.fields);
    for(let i=this.effects.length-1;i>=0;i--){
      const e=this.effects[i],k=clamp((this.now-e.at)/(e.end-e.at),0,1);
      if(k>=1){e.text?.destroy();this.effects.splice(i,1);continue;}
      if(e.text){e.text.setY(e.y-k*35).setAlpha(1-k);continue;}
      g.lineStyle(5*(1-k)+1,e.color,1-k);
      if(e.kind==='slash'){g.beginPath();g.arc(e.x,e.y,e.radius*(.5+k*.5),e.angle-1,e.angle+1);g.strokePath();}
      else g.strokeCircle(e.x,e.y,e.radius*(.2+k*.8));
    }
  }
  destroy(){if(!this.alive)return;this.alive=false;this.scene.events.off('postupdate',this.tick);this.graphics.destroy();this.vfx.destroy();for(const e of this.effects)e.text?.destroy();this.effects=[];this.shots=[];this.fields=[];this.targets.clear();}
}
