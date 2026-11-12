import { getBossStatus } from '../../api/bossRewardApi.js';

const HP = 30000;
const BOSS_ID = 'dia-long';
const HOME = { x: 21 * 48, y: 15 * 48 };

export class DiaLongBossSystem {
    constructor(scene) {
        this.scene = scene;
        this.alive = true;
        this.checking = false;
        this.statusReady = false;
        this.defeated = false;
        this.elapsed = 0;
        this.nextAttack = 2200;
        this.warning = null;
        this.sprite = scene.physics.add.sprite(HOME.x, HOME.y, 'ruins-wyrm-0')
            .setOrigin(0.5, 1).setScale(7).setDepth(100 + HOME.y);
        this.sprite.body.setSize(10, 7).setOffset(3, 8).setAllowGravity(false).setCollideWorldBounds(true);
        this.shadow = scene.add.ellipse(HOME.x, HOME.y - 4, 150, 34, 0x000000, 0.38).setDepth(99 + HOME.y);
        this.collider = scene.physics.add.collider(this.sprite, scene.world.blockers);
        this.entity = {
            sprite: this.sprite, shadow: this.shadow, home: HOME,
            data: { boss: true, hp: HP, damage: 500, ai: false },
            destroy: () => { this.collider?.destroy(); this.sprite.destroy(); this.shadow.destroy(); }
        };
        scene.monsters.push(this.entity);
        this.target = { entity: this.entity, hp: HP, maxHP: HP, damage: 500, aggro: false, nextHit: Infinity };
        scene.combat.targets.set(this.entity, this.target);
        this.fx = scene.add.graphics().setDepth(9499);
        this.root = document.createElement('section');
        this.root.className = 'naga-boss-hud';
        this.root.setAttribute('aria-label', 'Máu boss Địa Long');
        this.root.innerHTML = '<div class="naga-boss-name">ĐỊA LONG · CHÚA TỂ PHẾ TÍCH</div><div class="naga-boss-track" role="progressbar" aria-label="Máu Địa Long" aria-valuemin="0" aria-valuemax="30000"><div class="naga-boss-fill"></div><span class="naga-boss-value"></span></div><div class="naga-boss-status"></div>';
        document.body.appendChild(this.root);
        if (!document.getElementById('naga-boss-css')) {
            const css = document.createElement('link');
            css.id = 'naga-boss-css'; css.rel = 'stylesheet'; css.href = '/assets/style/nagaBoss.css';
            document.head.appendChild(css);
        }
        this.tick = (_time, delta) => this.update(delta);
        scene.events.on('postupdate', this.tick);
        scene.events.once('shutdown', () => this.destroy());
        this.hide();
        this.updateHUD('Đang kiểm tra đấu trường…');
        void this.refreshStatus();
    }

    hide() {
        this.target.hp = 0;
        this.target.respawnAt = Infinity;
        this.sprite.body.stop();
        this.sprite.setVisible(false);
        this.shadow.setVisible(false);
    }

    reset() {
        Object.assign(this.target, { hp: HP, aggro: false, respawnAt: Infinity });
        this.sprite.body.reset(HOME.x, HOME.y);
        this.sprite.body.stop();
        this.shadow.setPosition(HOME.x, HOME.y - 4);
        this.warning = null;
        this.nextAttack = this.elapsed + 2200;
    }

    async refreshStatus() {
        if (this.checking || !this.alive) return;
        this.checking = true;
        try {
            const { remainingMs } = await getBossStatus(BOSS_ID);
            if (!this.alive) return;
            this.waitUntil = performance.now() + Math.max(0, remainingMs);
            this.statusReady = true;
            this.checkAt = this.waitUntil;
            if (remainingMs > 0) {
                this.defeated = true;
                this.hide();
            } else if (this.scene.rpgState.data.pendingBossRewards?.some(entry =>
                typeof entry !== 'string' && entry.bossId === BOSS_ID)) {
                this.statusReady = false;
                this.checkAt = performance.now() + 5000;
                this.hide();
                this.updateHUD('Thưởng đang chờ · Mở Túi để thử nhận lại');
            } else {
                this.defeated = false;
                this.reset();
                this.sprite.setVisible(true);
                this.shadow.setVisible(true);
            }
        } catch {
            if (this.alive) {
                this.statusReady = false;
                this.checkAt = performance.now() + 5000;
                this.hide();
                this.updateHUD('Chưa kết nối máy chủ · Đang thử lại…');
            }
        } finally {
            this.checking = false;
        }
    }

    updateHUD(status) {
        const hp = Math.max(0, this.target.hp);
        this.root.querySelector('.naga-boss-fill').style.width = `${100 * hp / HP}%`;
        this.root.querySelector('.naga-boss-value').textContent = `${Math.ceil(hp).toLocaleString('vi-VN')} / 30.000 HP`;
        this.root.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(Math.ceil(hp)));
        this.root.querySelector('.naga-boss-status').textContent = status;
    }

    update(delta = 16) {
        const scene = this.scene, combat = scene.combat, player = combat.origin(), graphics = this.fx;
        graphics.clear();
        if (!this.statusReady) {
            if (performance.now() >= this.checkAt) void this.refreshStatus();
            return;
        }
        if (this.waitUntil > performance.now()) {
            this.updateHUD(`Địa Long hồi sinh sau ${Math.ceil((this.waitUntil - performance.now()) / 60000)} phút`);
            return;
        }
        if (this.defeated) {
            if (performance.now() >= this.checkAt) void this.refreshStatus();
            return;
        }
        if (this.target.hp <= 0) {
            if (!this.defeated) {
                this.defeated = true;
                this.warning = null;
                this.sprite.body.stop();
                this.updateHUD('Đã đánh bại Địa Long · Đang nhận thưởng…');
                scene.hud?.toast('Địa Long đã bị đánh bại! Đang nhận thưởng…');
                this.checkAt = Infinity;
                void scene.bossRewards?.queue(BOSS_ID).then(() => {
                    if (this.alive) void this.refreshStatus();
                });
            }
            return;
        }
        if (scene.rpgState.data.hp <= 0) {
            this.reset();
            this.updateHUD('Địa Long trở về hang ổ');
            return;
        }
        if (combat.busy) {
            this.sprite.body.stop();
            this.warning = null;
            this.nextAttack = Math.max(this.nextAttack, this.elapsed + 900);
            this.updateHUD('Tạm dừng');
            return;
        }
        this.elapsed += Math.min(delta, 50);
        const dx = player.x - this.sprite.x, dy = player.y - this.sprite.y, distance = Math.hypot(dx, dy);
        this.target.aggro = distance < 650;
        if (this.warning) {
            const warning = this.warning;
            const progress = Math.min(1, (this.elapsed - warning.start) / 1200);
            graphics.lineStyle(4, 0xff765b, 0.3 + progress * 0.6).strokeCircle(warning.x, warning.y, 176);
            graphics.fillStyle(0xff5138, 0.08 + progress * 0.16).fillCircle(warning.x, warning.y, 176);
            this.sprite.body.stop();
            this.updateHUD('LONG VĨ · Né vòng đỏ!');
            if (this.elapsed >= warning.until) {
                if (Math.hypot(player.x - warning.x, player.y - warning.y) <= 176) combat.damagePlayer(500, this.target);
                combat.vfx.emit('quake', warning, 176, 0xef765c);
                this.warning = null;
                this.nextAttack = this.elapsed + 2300;
            }
        } else {
            if (distance > 135) {
                this.sprite.body.setVelocity(dx / distance * 78, dy / distance * 78);
            } else {
                this.sprite.body.stop();
            }
            if (distance < 250 && this.elapsed >= this.nextAttack) {
                this.warning = { x: this.sprite.x, y: this.sprite.y - 32, start: this.elapsed, until: this.elapsed + 1200 };
                this.sprite.body.stop();
            }
            this.updateHUD(distance < 650 ? 'Địa Long đang giao chiến' : 'Tiến vào đấu trường để khiêu chiến');
        }
        const moving = Math.hypot(this.sprite.body.velocity.x, this.sprite.body.velocity.y) > 1;
        if (moving) this.sprite.setFlipX(dx < 0);
        this.sprite.setDepth(100 + this.sprite.y);
        this.shadow.setPosition(this.sprite.x, this.sprite.y - 4).setDepth(99 + this.sprite.y);
    }

    destroy() {
        this.alive = false;
        this.scene.events.off('postupdate', this.tick);
        this.root.remove();
        this.fx.destroy();
    }
}
