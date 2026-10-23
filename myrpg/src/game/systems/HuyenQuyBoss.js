import { getBossStatus } from '../../api/bossRewardApi.js';
import { HUYEN_QUY as BOSS } from '../data/huyenQuy.js';
import { segmentDistance } from './CombatSystem.js';

export class HuyenQuyBoss {
    constructor(scene){
        this.scene=scene;this.alive=true;this.statusReady=false;this.checking=false;
        this.checkAt=0;this.waitUntil=0;this.elapsed=0;this.nextCast=2400;this.nextMelee=0;
        this.lastHP=BOSS.hp;this.hurtUntil=0;this.castCount=0;this.warning=null;this.bullets=[];this.dash=null;this.defeated=false;
        const {x,y}=BOSS.home;
        const sprite=scene.physics.add.sprite(x,y,'huyen-quy-idle-0').setOrigin(.5,1).setScale(3).setDepth(100+y);
        sprite.body.setSize(34,8).setOffset(31,85).setAllowGravity(false).setCollideWorldBounds(true);
        const shadow=scene.add.ellipse(x,y-4,210,54,0x000000,.35).setDepth(99+y);
        this.collider=scene.physics.add.collider(sprite,scene.world.blockers);
        this.entity={sprite,shadow,home:{x,y},data:{boss:true,hp:BOSS.hp,damage:BOSS.damage,ai:false},
            destroy:()=>{this.collider?.destroy();sprite.destroy();shadow.destroy();}};
        scene.monsters.push(this.entity);
        this.target={entity:this.entity,hp:BOSS.hp,maxHP:BOSS.hp,damage:BOSS.damage,aggro:false,nextHit:Infinity};
        scene.combat.targets.set(this.entity,this.target);
        this.fx=scene.add.graphics().setDepth(9499);
        this.root=document.createElement('section');this.root.className='naga-boss-hud';
        this.root.setAttribute('aria-label','Máu boss Huyền Quy');
        this.root.innerHTML='<div class="naga-boss-name">HUYỀN QUY</div><div class="naga-boss-track" role="progressbar" aria-label="Máu boss" aria-valuemin="0" aria-valuemax="15000"><div class="naga-boss-fill"></div><span class="naga-boss-value"></span></div><div class="naga-boss-status"></div>';
        document.body.appendChild(this.root);
        if(!document.getElementById('naga-boss-css')){
            const css=document.createElement('link');css.id='naga-boss-css';css.rel='stylesheet';
            css.href='/assets/style/nagaBoss.css';document.head.appendChild(css);
        }
        this.tick=(_time,delta)=>this.update(delta);
        scene.events.on('postupdate',this.tick);scene.events.once('shutdown',()=>this.destroy());
        this.hide();this.updateHUD('Đang kiểm tra hồi sinh…');void this.refreshStatus();
    }
    pending(){return this.scene.rpgState.data.pendingBossRewards.some(entry=>typeof entry!=='string'&&entry.bossId===BOSS.id);}
    hide(){this.target.hp=0;this.target.respawnAt=Infinity;this.entity.sprite.setVisible(false);this.entity.shadow.setVisible(false);this.entity.sprite.body.stop();}
    async refreshStatus(){
        if(this.checking||!this.alive)return;this.checking=true;
        try{
            const {remainingMs}=await getBossStatus(BOSS.id);if(!this.alive)return;
            this.waitUntil=performance.now()+Math.max(0,remainingMs);this.checkAt=this.waitUntil;
            if(remainingMs>0){this.statusReady=true;this.defeated=true;this.hide();}
            else if(this.pending()){
                this.statusReady=false;this.checkAt=performance.now()+5000;this.hide();
                this.updateHUD('Thưởng đang chờ · Mở B để thử nhận lại');
            }else{
                this.statusReady=true;this.defeated=false;this.reset();
                this.entity.sprite.setVisible(true);this.entity.shadow.setVisible(true);
            }
        }catch{
            if(this.alive){this.statusReady=false;this.checkAt=performance.now()+5000;this.hide();this.updateHUD('Chưa kết nối máy chủ · Đang thử lại…');}
        }finally{this.checking=false;}
    }
    updateHUD(status){
        const hp=Math.max(0,this.target.hp);
        this.root.querySelector('.naga-boss-fill').style.width=`${100*hp/BOSS.hp}%`;
        this.root.querySelector('.naga-boss-value').textContent=`${Math.ceil(hp)} / 15.000 HP`;
        this.root.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.ceil(hp)));
        this.root.querySelector('.naga-boss-status').textContent=status;
    }
    reset(){
        Object.assign(this.target,{hp:BOSS.hp,aggro:false,stunUntil:0,burn:null,vulnerableUntil:0,vulnerability:1,respawnAt:Infinity});
        this.entity.sprite.body.reset(BOSS.home.x,BOSS.home.y);this.entity.sprite.body.stop();
        this.entity.shadow.setPosition(BOSS.home.x,BOSS.home.y-4);
        this.lastHP=BOSS.hp;this.hurtUntil=0;this.entity.sprite.play('huyen-quy-idle',true);this.warning=null;this.bullets=[];this.dash=null;this.nextCast=this.elapsed+2400;this.nextMelee=this.elapsed+1000;this.castCount=0;
    }
    damage(amount){
        const s=this.scene;
        if(this.target.hp<=0||s.rpgState.data.hp<=0)return;
        s.combat.damagePlayer(Math.max(5,amount-Math.floor(s.rpgState.defense/3)),this.target);
    }
    startCast(player){
        const skill=BOSS.skills[this.castCount++%BOSS.skills.length],sprite=this.entity.sprite;
        const source={x:sprite.x,y:sprite.y-144};
        if(skill.id==='breath'||skill.id==='orbs'){
            source.x+=sprite.flipX?-85:85;source.y+=24;
        }
        const aim={...player};
        const points=skill.id==='thunder'?[[0,0],[-145,50],[145,50],[-85,-120],[85,-120]].map(([dx,dy])=>({x:Math.max(110,Math.min(1618,aim.x+dx)),y:Math.max(110,Math.min(1020,aim.y+dy))})):[source];
        const dx=aim.x-source.x,dy=aim.y-source.y,d=Math.hypot(dx,dy)||1;
        const end={x:Math.max(280,Math.min(1448,source.x+dx/d*Math.min(d,skill.range??0))),y:Math.max(260,Math.min(930,source.y+dy/d*Math.min(d,skill.range??0)))};
        this.warning={skill,source,aim,points,end,start:this.elapsed,until:this.elapsed+skill.warningMs};
        this.nextCast=this.elapsed+5900;
    }
    resolveCast(w,player){
        const {skill,source}=w,c=this.scene.combat;
        const a=Math.atan2(w.aim.y-source.y,w.aim.x-source.x);
        if(skill.id==='breath'){
            const angle=Math.atan2(player.y-source.y,player.x-source.x);
            const difference=Math.atan2(Math.sin(angle-a),Math.cos(angle-a));
            if(Math.hypot(player.x-source.x,player.y-source.y)<=skill.range&&Math.abs(difference)<=skill.spread&&c.clearLine(source,player))this.damage(skill.damage);
            this.breathBurst(source,a,skill);
        }else if(skill.id==='thunder'){
            if(w.points.some(p=>Math.hypot(player.x-p.x,player.y-p.y)<skill.radius))this.damage(skill.damage);
            for(const p of w.points){c.vfx.emit('meteor',p,skill.radius,0x8edaf2);this.waterColumn(p);}
        }else if(skill.id==='orbs'){
            for(let i=0;i<skill.count;i++){
                const angle=a+(i-(skill.count-1)/2)*.17;
                this.bullets.push({...source,dx:Math.cos(angle),dy:Math.sin(angle),angle,life:2800,speed:skill.speed,damage:skill.damage});
            }
        }else if(skill.id==='tail'){
            if(Math.hypot(player.x-source.x,player.y-source.y)<skill.radius&&c.clearLine(source,player))this.damage(skill.damage);
            c.vfx.emit('whirl',source,skill.radius,0x76d5b3);c.vfx.emit('quake',source,skill.radius,0x89c6dc);
        }else{
            this.dash={source:{...source},end:{...w.end},skill,start:this.elapsed,hit:false};
        }
    }
    drawWarning(w){
        const g=this.fx,{skill,source}=w,k=Math.min(1,(this.elapsed-w.start)/skill.warningMs),vfx=this.scene.combat.vfx;
        const a=Math.atan2(w.aim.y-source.y,w.aim.x-source.x);
        this.updateHUD(`${skill.name.toUpperCase()} · Né vùng báo sáng!`);
        if(skill.id==='breath'){
            const left={x:source.x+Math.cos(a-skill.spread)*skill.range,y:source.y+Math.sin(a-skill.spread)*skill.range};
            const right={x:source.x+Math.cos(a+skill.spread)*skill.range,y:source.y+Math.sin(a+skill.spread)*skill.range};
            g.fillStyle(0x72b3cf,.12+k*.1).fillTriangle(source.x,source.y,left.x,left.y,right.x,right.y);
            g.lineStyle(3,0xb5edee,.8).lineBetween(source.x,source.y,left.x,left.y).lineBetween(source.x,source.y,right.x,right.y);
            vfx.aim(g,source,a,skill.range,0xb5edee,k);
        }else if(skill.id==='orbs'){
            for(let i=0;i<skill.count;i++)vfx.aim(g,source,a+(i-(skill.count-1)/2)*.17,650,0x82dace,k);
        }else if(skill.id==='charge'){
            const dx=w.end.x-source.x,dy=w.end.y-source.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*skill.width/2,ny=dx/d*skill.width/2;
            g.lineStyle(skill.width,0x7acdd6,.12+k*.1).lineBetween(source.x,source.y,w.end.x,w.end.y);
            g.lineStyle(2,0xc5f1ed,.9).lineBetween(source.x+nx,source.y+ny,w.end.x+nx,w.end.y+ny).lineBetween(source.x-nx,source.y-ny,w.end.x-nx,w.end.y-ny);
            vfx.aim(g,source,Math.atan2(dy,dx),d,0xd8efaf,k);
        }else for(const p of w.points){
            vfx.telegraph(g,p,skill.radius,skill.id==='tail'?0x95dae0:0x91d7f0,k,this.elapsed);
            if(skill.id==='thunder'){
                g.fillStyle(0x35586e,.7).fillEllipse(p.x,p.y-170,82,26);
                g.fillStyle(0x7bb6cc,.6).fillEllipse(p.x-13,p.y-181,48,26);
                g.lineStyle(2,0xd9f1fa,k).lineBetween(p.x-9,p.y-158,p.x+9,p.y-129).lineBetween(p.x+9,p.y-129,p.x-4,p.y-99);
            }
        }
    }
    updateBullets(delta,player){
        const c=this.scene.combat,g=this.fx;
        for(let i=this.bullets.length-1;i>=0;i--){
            const b=this.bullets[i],old={x:b.x,y:b.y};
            b.x+=b.dx*b.speed*delta/1000;b.y+=b.dy*b.speed*delta/1000;b.life-=delta;
            const blocked=!c.clearLine(old,b),hit=!blocked&&segmentDistance(player,old,b)<23;
            if(hit){this.damage(b.damage);c.vfx.emit('impact',b,28,0xbddc83);}
            if(hit||blocked||b.life<=0){this.bullets.splice(i,1);continue;}
            this.drawOrb(g,b);
        }
    }
    update(delta=16){
        if(!this.alive)return;
        const s=this.scene,c=s.combat,sprite=this.entity.sprite;this.fx.clear();
        const origin=c.origin();this.root.hidden=!origin||Math.hypot(origin.x-BOSS.home.x,origin.y-BOSS.home.y)>850;
        if(!this.statusReady){if(performance.now()>=this.checkAt)void this.refreshStatus();return;}
        if(this.waitUntil>performance.now()){
            const seconds=Math.ceil((this.waitUntil-performance.now())/1000);
            this.updateHUD(`Hồi sinh sau ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);return;
        }
        if(this.defeated){if(performance.now()>=this.checkAt)void this.refreshStatus();return;}
        if(this.target.hp<=0){
            this.deathAnimation();this.defeated=true;this.hide();this.warning=null;this.bullets=[];this.dash=null;this.checkAt=Infinity;
            this.updateHUD('Đã hạ boss · Đang nhận thưởng…');
            void s.bossRewards.queue(BOSS.id).then(()=>{if(this.alive)void this.refreshStatus();});return;
        }
        const player=c.origin();if(!player)return;
        if(s.rpgState.data.hp<=0){this.reset();this.updateHUD('Boss trở về vị trí ban đầu');return;}
        if(c.busy){sprite.play('huyen-quy-idle',true);sprite.body.stop();this.warning=null;this.bullets=[];this.dash=null;this.nextCast=Math.max(this.nextCast,this.elapsed+1000);this.updateHUD('Tạm dừng');return;}
        delta=Math.min(delta,50);this.elapsed+=delta;
        const homeDistance=Math.hypot(player.x-BOSS.home.x,player.y-BOSS.home.y);
        if(homeDistance>BOSS.leashRange||player.y>BOSS.arenaBottom){this.reset();this.updateHUD('Tiến vào đấu trường để khiêu chiến');return;}
        const dx=player.x-sprite.x,dy=player.y-(sprite.y-144),d=Math.hypot(dx,dy);
        const active=d<BOSS.activeRange||this.target.hp<BOSS.hp;
        this.target.aggro=false;
        if(!active){sprite.play('huyen-quy-idle',true);sprite.body.stop();this.updateHUD('Tiến lại gần để khiêu chiến');return;}
        if(this.target.stunUntil>c.now){sprite.play('huyen-quy-hurt',true);sprite.body.stop();this.warning=null;this.dash=null;this.updateHUD('Boss bị choáng');return;}
        if(!this.warning&&!this.dash&&this.elapsed>=this.nextCast)this.startCast(player);
        if(!this.warning&&!this.dash&&d>145){const v=c.monsterDirection(this.entity,{x:player.x,y:player.y+144},d,BOSS.speed);sprite.body.setVelocity(v.x,v.y);}
        else sprite.body.stop();
        if(!this.warning&&!this.dash&&d<155&&this.elapsed>=this.nextMelee&&c.clearLine(c.targetPoint(this.target),player)){
            this.nextMelee=this.elapsed+1400;this.damage(BOSS.damage);
        }
        if(this.target.hp<this.lastHP)this.hurtUntil=this.elapsed+210;
        this.lastHP=this.target.hp;
        sprite.play(this.warning?'huyen-quy-cast':this.hurtUntil>this.elapsed?'huyen-quy-hurt':(this.dash||Math.hypot(sprite.body.velocity.x,sprite.body.velocity.y)>1)?'huyen-quy-walk':'huyen-quy-idle',true);
        sprite.setFlipX(dx<0).setDepth(100+sprite.y);
        this.entity.shadow.setPosition(sprite.x,sprite.y-4).setDepth(99+sprite.y);
        if(this.warning){
            const w=this.warning;this.drawWarning(w);
            if(this.elapsed>=w.until){this.warning=null;this.resolveCast(w,player);}
        }else this.updateHUD('Đang giao chiến');
        this.updateDash(player);
        this.updateBullets(delta,player);
    }
    drawOrb(g,b){
        g.lineStyle(11,0x409ca3,.2).lineBetween(b.x-b.dx*35,b.y-b.dy*35,b.x,b.y);
        g.fillStyle(0x377b81,.8).fillCircle(b.x,b.y,14);
        g.lineStyle(2,0xbbe9cb,.9).strokeCircle(b.x,b.y,12);
        g.fillStyle(0x85dac7,1).fillCircle(b.x,b.y,8);g.fillStyle(0xd3faf2,1).fillCircle(b.x-2,b.y-2,4);
        const a=this.elapsed*.008;
        for(let i=0;i<3;i++)g.fillStyle(0xc9ede2,.9).fillRect(b.x+Math.cos(a+i*2.094)*17,b.y+Math.sin(a+i*2.094)*17,3,3);
    }
    updateDash(player){
        const d=this.dash;if(!d)return;
        const s=this.entity.sprite,old={x:s.x,y:s.y-144},k=Math.min(1,(this.elapsed-d.start)/d.skill.duration);
        const next={x:d.source.x+(d.end.x-d.source.x)*k,y:d.source.y+(d.end.y-d.source.y)*k};
        if(!this.scene.combat.clearLine(old,next)){this.dash=null;return;}
        s.body.reset(next.x,next.y+144);
        this.fx.lineStyle(42,0x78d8c5,.3).lineBetween(old.x,old.y,next.x,next.y);
        this.fx.lineStyle(4,0xf8eab4,.8).lineBetween(old.x,old.y,next.x,next.y);
        if(!d.hit&&segmentDistance(player,old,next)<d.skill.width/2+16){this.damage(d.skill.damage);d.hit=true;}
        if(k>=1)this.dash=null;
    }
    temporaryEffect(duration,draw){
        const g=this.scene.add.graphics().setDepth(9400),progress={v:0};
        this.scene.tweens.add({targets:progress,v:1,duration,onUpdate:()=>{g.clear();draw(g,progress.v);},onComplete:()=>g.destroy()});draw(g,0);
    }
    breathBurst(source,a,skill){
        this.temporaryEffect(850,(g,k)=>{
            for(let i=0;i<7;i++){
                const r=skill.range*(.12+i*.12)*Math.min(1,k*3+.25),alpha=(1-k)*(.55-i*.04);
                g.lineStyle(7,0x5caac7,alpha).beginPath().arc(source.x,source.y,r,a-skill.spread,a+skill.spread).strokePath();
                g.lineStyle(2,0xc8f5ec,alpha).beginPath().arc(source.x,source.y,r+4,a-skill.spread,a+skill.spread).strokePath();
            }
            for(let i=0;i<22;i++){
                const angle=a+Math.sin(i*13.3)*skill.spread,r=skill.range*((i%9+1)/10)*Math.min(1,k*3+.2);
                const x=source.x+Math.cos(angle)*r,y=source.y+Math.sin(angle)*r;
                g.lineStyle(1.5,0xc2f5f0,(1-k)*.75).strokeCircle(x,y,3+i%4);
            }
        });
    }
    waterColumn(p){
        this.temporaryEffect(750,(g,k)=>{
            const alpha=1-k,h=180*Math.sin(Math.min(1,k*2)*Math.PI/2);
            g.lineStyle(34,0x5d9fbd,alpha*.3).lineBetween(p.x,p.y,p.x,p.y-h);
            g.lineStyle(13,0x91d8e4,alpha*.75).lineBetween(p.x,p.y,p.x+Math.sin(k*10)*9,p.y-h);
            g.lineStyle(3,0xe0fff4,alpha).lineBetween(p.x-4,p.y,p.x-4,p.y-h);
            for(let i=0;i<5;i++)g.lineStyle(2,0xb7ebed,alpha*.7).strokeEllipse(p.x,p.y-h*i/5,34+(i%2)*8,12);
            g.lineStyle(4,0x93d6e3,alpha).strokeCircle(p.x,p.y,20+70*k);
            for(let i=0;i<8;i++){const a=i*Math.PI/4;g.fillStyle(0xc4f8eb,alpha).fillRect(p.x+Math.cos(a)*k*75,p.y-h*.4+Math.sin(a)*k*65,3,5);}
        });
    }
    deathAnimation(){
        const sprite=this.entity.sprite;
        const ghost=this.scene.add.sprite(sprite.x,sprite.y,'huyen-quy-death-0').setOrigin(.5,1).setScale(3).setDepth(100+sprite.y).setFlipX(sprite.flipX);
        ghost.play('huyen-quy-death');ghost.once('animationcomplete',()=>ghost.destroy());
        this.scene.combat.vfx.emit('nova',{x:sprite.x,y:sprite.y-144},110,0x8cd7df);
    }
    destroy(){this.alive=false;this.scene.events.off('postupdate',this.tick);this.root.remove();this.fx.destroy();this.warning=null;this.bullets=[];this.dash=null;}
}
