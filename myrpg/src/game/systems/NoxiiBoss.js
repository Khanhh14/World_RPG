import { getBossStatus } from '../../api/bossRewardApi.js';
import { NOXII_BOSS as BOSS } from '../data/noxiiBoss.js';
import { segmentDistance } from './CombatSystem.js';

export class NoxiiBoss {
    constructor(scene){
        this.scene=scene;this.alive=true;this.statusReady=false;this.checking=false;
        this.checkAt=0;this.waitUntil=0;this.elapsed=0;this.nextCast=2000;this.nextMelee=0;
        this.castCount=0;this.warning=null;this.bullets=[];this.defeated=false;
        const {x,y}=BOSS.home;
        const sprite=scene.physics.add.sprite(x,y,'dungeon',110).setOrigin(.5,1).setScale(6).setDepth(100+y);
        sprite.body.setSize(8,5).setOffset(4,11).setAllowGravity(false).setCollideWorldBounds(true);
        const shadow=scene.add.ellipse(x,y-4,100,28,0x000000,.35).setDepth(99+y);
        this.collider=scene.physics.add.collider(sprite,scene.world.blockers);
        this.entity={sprite,shadow,home:{x,y},data:{boss:true,hp:BOSS.hp,damage:BOSS.damage,ai:false},
            destroy:()=>{this.collider?.destroy();sprite.destroy();shadow.destroy();}};
        scene.monsters.push(this.entity);
        this.target={entity:this.entity,hp:BOSS.hp,maxHP:BOSS.hp,damage:BOSS.damage,aggro:false,nextHit:Infinity};
        scene.combat.targets.set(this.entity,this.target);
        this.fx=scene.add.graphics().setDepth(9499);
        this.root=document.createElement('section');this.root.className='naga-boss-hud';
        this.root.setAttribute('aria-label','Máu boss Hộ Vệ Hắc Thạch');
        this.root.innerHTML='<div class="naga-boss-name">HỘ VỆ HẮC THẠCH</div><div class="naga-boss-track" role="progressbar" aria-label="Máu boss" aria-valuemin="0" aria-valuemax="2500"><div class="naga-boss-fill"></div><span class="naga-boss-value"></span></div><div class="naga-boss-status"></div>';
        document.body.appendChild(this.root);
        if(!document.getElementById('naga-boss-css')){
            const css=document.createElement('link');css.id='naga-boss-css';css.rel='stylesheet';
            css.href='/assets/style/nagaBoss.css';document.head.appendChild(css);
        }
        this.tick=(_time,delta)=>this.update(delta);
        scene.events.on('postupdate',this.tick);scene.events.once('shutdown',()=>this.destroy());
        this.hide();this.updateHUD('Đang kiểm tra hồi sinh…');void this.refreshStatus();
    }
    pending(){return this.scene.rpgState.data.pendingBossRewards.some(entry=>typeof entry!=='string'&&entry.bossId==='noxii');}
    hide(){this.target.hp=0;this.target.respawnAt=Infinity;this.entity.sprite.setVisible(false);this.entity.shadow.setVisible(false);this.entity.sprite.body.stop();}
    async refreshStatus(){
        if(this.checking||!this.alive)return;this.checking=true;
        try{
            const {remainingMs}=await getBossStatus('noxii');if(!this.alive)return;
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
        this.root.querySelector('.naga-boss-value').textContent=`${Math.ceil(hp)} / 2.500 HP`;
        this.root.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.ceil(hp)));
        this.root.querySelector('.naga-boss-status').textContent=status;
    }
    reset(){
        Object.assign(this.target,{hp:BOSS.hp,aggro:false,stunUntil:0,burn:null,vulnerableUntil:0,vulnerability:1,respawnAt:Infinity});
        this.entity.sprite.body.reset(BOSS.home.x,BOSS.home.y);this.entity.sprite.body.stop();
        this.entity.shadow.setPosition(BOSS.home.x,BOSS.home.y-4);
        this.warning=null;this.bullets=[];this.nextCast=this.elapsed+2000;this.nextMelee=this.elapsed+1000;this.castCount=0;
    }
    damage(amount){
        const s=this.scene;
        if(this.target.hp<=0||s.rpgState.data.hp<=0)return;
        s.combat.damagePlayer(Math.max(5,amount-Math.floor(s.rpgState.defense/3)),this.target);
    }
    startCast(player){
        const skill=BOSS.skills[this.castCount++%3],sprite=this.entity.sprite;
        const source={x:sprite.x,y:sprite.y-48};
        const points=skill.id==='meteors' ? [
            {...player},
            {x:Math.max(100,Math.min(1628,player.x-130)),y:Math.max(100,Math.min(1436,player.y+70))},
            {x:Math.max(100,Math.min(1628,player.x+130)),y:Math.max(100,Math.min(1436,player.y+70))}
        ] : [source];
        this.warning={skill,source,aim:{...player},points,start:this.elapsed,until:this.elapsed+skill.warningMs};
        this.nextCast=this.elapsed+5000;
    }
    resolveCast(w,player){
        const {skill,source}=w,c=this.scene.combat;
        if(skill.id==='quake'){
            if(Math.hypot(player.x-source.x,player.y-source.y)<skill.radius)this.damage(skill.damage);
            c.vfx.emit('quake',source,skill.radius,0xc990fa);
        }else if(skill.id==='bolts'){
            const angle=Math.atan2(w.aim.y-source.y,w.aim.x-source.x);
            for(let i=0;i<skill.count;i++){
                const a=angle+(i-(skill.count-1)/2)*.18;
                this.bullets.push({...source,dx:Math.cos(a),dy:Math.sin(a),life:2600,speed:skill.speed,damage:skill.damage});
            }
        }else{
            // Ba vùng rơi được báo trước; mỗi lần thi triển chỉ gây sát thương một lần.
            if(w.points.some(p=>Math.hypot(player.x-p.x,player.y-p.y)<skill.radius))this.damage(skill.damage);
            for(const p of w.points)c.vfx.emit('meteor',p,skill.radius,0xffa66e);
        }
    }
    drawWarning(w){
        const g=this.fx,{skill,source}=w,k=Math.min(1,(this.elapsed-w.start)/skill.warningMs);
        this.updateHUD(`${skill.name.toUpperCase()} · Né vùng báo sáng!`);
        if(skill.id==='bolts'){
            const angle=Math.atan2(w.aim.y-source.y,w.aim.x-source.x);
            for(let i=0;i<skill.count;i++){
                const a=angle+(i-(skill.count-1)/2)*.18;
                this.scene.combat.vfx.aim(g,source,a,600,0xb78bff,k);
            }
        }else for(const p of w.points){
            const color=skill.id==='quake'?0xc990fa:0xffa66e;
            this.scene.combat.vfx.telegraph(g,p,skill.radius,color,k,this.elapsed);
        }
    }
    updateBullets(delta,player){
        const c=this.scene.combat,g=this.fx;
        for(let i=this.bullets.length-1;i>=0;i--){
            const b=this.bullets[i],old={x:b.x,y:b.y};
            b.x+=b.dx*b.speed*delta/1000;b.y+=b.dy*b.speed*delta/1000;b.life-=delta;
            const blocked=!c.clearLine(old,b),hit=!blocked&&segmentDistance(player,old,b)<23;
            if(hit){this.damage(b.damage);c.vfx.emit('impact',b,28,0xba92ff);}
            if(hit||blocked||b.life<=0){this.bullets.splice(i,1);continue;}
            c.vfx.projectile({...b,color:0xc093ff,vfxKind:'fan'},this.elapsed,g);
        }
    }
    update(delta=16){
        if(!this.alive)return;
        const s=this.scene,c=s.combat,sprite=this.entity.sprite;this.fx.clear();
        if(!this.statusReady){if(performance.now()>=this.checkAt)void this.refreshStatus();return;}
        if(this.waitUntil>performance.now()){
            const seconds=Math.ceil((this.waitUntil-performance.now())/1000);
            this.updateHUD(`Hồi sinh sau ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);return;
        }
        if(this.defeated){if(performance.now()>=this.checkAt)void this.refreshStatus();return;}
        if(this.target.hp<=0){
            this.defeated=true;this.hide();this.warning=null;this.bullets=[];this.checkAt=Infinity;
            this.updateHUD('Đã hạ boss · Đang nhận thưởng…');
            void s.bossRewards.queue('noxii').then(()=>{if(this.alive)void this.refreshStatus();});return;
        }
        const player=c.origin();if(!player)return;
        if(s.rpgState.data.hp<=0){this.reset();this.updateHUD('Boss trở về vị trí ban đầu');return;}
        if(c.busy){sprite.body.stop();this.warning=null;this.bullets=[];this.nextCast=Math.max(this.nextCast,this.elapsed+1000);this.updateHUD('Tạm dừng');return;}
        delta=Math.min(delta,50);this.elapsed+=delta;
        const homeDistance=Math.hypot(player.x-BOSS.home.x,player.y-BOSS.home.y);
        if(homeDistance>BOSS.leashRange||player.y>1120){this.reset();this.updateHUD('Tiến vào đấu trường để khiêu chiến');return;}
        const dx=player.x-sprite.x,dy=player.y-(sprite.y-48),d=Math.hypot(dx,dy);
        const active=d<BOSS.activeRange||this.target.hp<BOSS.hp;
        this.target.aggro=false;
        if(!active){sprite.body.stop();this.updateHUD('Tiến lại gần để khiêu chiến');return;}
        if(this.target.stunUntil>c.now){sprite.body.stop();this.warning=null;this.updateHUD('Boss bị choáng');return;}
        if(!this.warning&&this.elapsed>=this.nextCast)this.startCast(player);
        if(!this.warning&&d>100){const v=c.monsterDirection(this.entity,{x:player.x,y:player.y+48},d,BOSS.speed);sprite.body.setVelocity(v.x,v.y);}
        else sprite.body.stop();
        if(!this.warning&&d<110&&this.elapsed>=this.nextMelee&&c.clearLine(c.targetPoint(this.target),player)){
            this.nextMelee=this.elapsed+1400;this.damage(BOSS.damage);
        }
        sprite.setFlipX(dx<0).setDepth(100+sprite.y);
        this.entity.shadow.setPosition(sprite.x,sprite.y-4).setDepth(99+sprite.y);
        if(this.warning){
            const w=this.warning;this.drawWarning(w);
            if(this.elapsed>=w.until){this.warning=null;this.resolveCast(w,player);}
        }else this.updateHUD('Đang giao chiến');
        this.updateBullets(delta,player);
    }
    destroy(){this.alive=false;this.scene.events.off('postupdate',this.tick);this.root.remove();this.fx.destroy();this.warning=null;this.bullets=[];}
}
