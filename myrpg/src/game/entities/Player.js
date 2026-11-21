import {TU_LINH_WEAPONS,tuLinhWeaponTexture} from '../data/tuLinhWeapons.js';
import {HUNT_EVENT_WEAPONS} from '../data/huntEventItems.js';
import { ITEMS } from '../data/items.js';
import { dragonGearTexture } from '../world/DragonGearArt.js';
import { offhandTexture } from '../world/OffhandTextures.js';
import { wingTexture } from '../world/WingTextures.js';
import { titleById } from '../data/titles.js';
// Logic nhân vật được dùng lại ở làng, rừng và các khu vực tiếp theo.
export class Player {
    constructor(scene, config) {
        this.scene = scene;
        this.speed = config.speed;
        this.sprite = scene.physics.add.sprite(
            config.x, config.y, config.texture, config.frame
        ).setScale(config.scale).setCollideWorldBounds(true);
        this.sprite.body.setSize(8, 5);
        this.sprite.body.setOffset(4, 11);
        this.shadow = scene.add.ellipse(config.x, config.y + 22, 26, 10, 0x000000, 0.2);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');

        // Sprites cho vũ khí và khiên
        this.weaponSprite = null;
        this.shieldSprite = null;
        this.currentWeapon = null;
        this.currentShield = null;
        this.titleId = null;
        this.titleLabel = null;
        this.titleTween = null;

        this.updateAppearance();
    }

    get x() { return this.sprite.x; }
    get feetY() { return this.sprite.y + this.sprite.displayHeight / 2; }

    stop() { this.sprite.setVelocity(0, 0); }

    update(blocked = false) {
        let x = 0;
        let y = 0;
        if (!blocked) {
            if (this.cursors.left.isDown || this.keys.A.isDown) x--;
            if (this.cursors.right.isDown || this.keys.D.isDown) x++;
            if (this.cursors.up.isDown || this.keys.W.isDown) y--;
            if (this.cursors.down.isDown || this.keys.S.isDown) y++;
        }
        const autoMove = !blocked && x === 0 && y === 0
            ? this.scene.combat?.autoMoveDirection
            : null;
        if (autoMove) {
            x = autoMove.x;
            y = autoMove.y;
        }
        const length = Math.hypot(x, y);
        const speed=this.speed*(1+(this.scene.rpgState?.tomeBonus('moveSpeed')??0));
        this.sprite.setVelocity(length ? x / length * speed : 0, length ? y / length * speed : 0);
        if (x) this.sprite.setFlipX(x < 0);
        this.updateAppearance();
    }

    updateAppearance() {
    const facingLeft = this.sprite.flipX;
    const playerDepth = 100 + this.feetY;

    this.sprite.setDepth(playerDepth);
    this.shadow
        .setPosition(this.x, this.sprite.y + 22)
        .setDepth(playerDepth - 1);

    if (this.titleLabel?.active) {
        const titleY = this.sprite.y - this.sprite.displayHeight / 2 - 26;
        this.titleLabel.setPosition(this.x, titleY).setDepth(playerDepth + 20);
    }

    if (this.wingSprite) {
        const flutter = Math.sin(this.scene.time.now / 280) * 0.035;
        this.wingSprite.setPosition(this.x, this.sprite.y - 8)
            .setDepth(playerDepth - 0.5).setFlipX(facingLeft)
            .setScale(3 * (1 + flutter), 3);
    }

    // Vũ khí: cách nhân vật 14px, thấp hơn một chút.
    if (this.weaponSprite) {
        this.weaponSprite
            .setPosition(
                this.x + (facingLeft ? -22 : 22),
                this.sprite.y + 6
            )
            .setDepth(playerDepth + (facingLeft ? -1 : 1))
            .setFlipX(facingLeft);
    }

    // Khiên: nằm phía đối diện, cách nhân vật 14px.
    if (this.shieldSprite) {
        const offhand=ITEMS[this.currentShield];
        if(offhand?.offhandKind==='flag')this.shieldSprite.setTexture(offhandTexture(this.scene,offhand,Math.floor(this.scene.time.now/180)%3));
        this.shieldSprite
            .setPosition(
                this.x + (facingLeft ? 22 : -22),
                this.sprite.y + 1
            )
            .setDepth(playerDepth + (facingLeft ? 1 : -1))
            .setFlipX(facingLeft);
    }
}

    setTitle(id) {
        if (this.titleId === id) return;
        this.titleTween?.stop();
        this.titleLabel?.destroy();
        this.titleId = id || null;
        this.titleLabel = null;
        const title = titleById(id);
        if (!title) return;

        this.titleLabel = this.scene.add.text(this.x, this.sprite.y, `✦ ${title.name} ✦`, {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: title.color,
            stroke: '#17101d',
            strokeThickness: 4,
            shadow: { color: title.glow, blur: 10, fill: true, stroke: true }
        }).setOrigin(0.5, 1);
        this.titleTween = this.scene.tweens.add({
            targets: this.titleLabel,
            alpha: { from: 0.78, to: 1 },
            scaleX: { from: 1, to: 1.06 },
            scaleY: { from: 1, to: 1.06 },
            duration: 850,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.updateAppearance();
    }

    updateEquipment(weapon, shield) {
        // Cập nhật vũ khí
        if (this.currentWeapon !== weapon) {
            if (this.weaponSprite) {
                this.weaponSprite.destroy();
                this.weaponSprite = null;
            }
            this.currentWeapon = weapon;
            if (weapon) {
                const frame = this.getWeaponFrame(weapon);
                const eventWeapon=TU_LINH_WEAPONS[weapon]||HUNT_EVENT_WEAPONS[weapon];
                const dragonWeapon=ITEMS[weapon]?.category==='dragon-gear';
                if (frame !== null || eventWeapon || dragonWeapon) {
                    const texture=dragonWeapon?dragonGearTexture(this.scene,ITEMS[weapon].icon||weapon,ITEMS[weapon].level):eventWeapon?tuLinhWeaponTexture(this.scene,weapon):'dungeon';
                    this.weaponSprite = this.scene.add.image(this.x, this.sprite.y, texture, dragonWeapon||eventWeapon?undefined:frame)
                        .setScale(this.sprite.scaleX)
                        .setOrigin(0.5, 0.5);
                }
            }
        }

        // Cập nhật khiên
        if (this.currentShield !== shield) {
            if (this.shieldSprite) {
                this.shieldSprite.destroy();
                this.shieldSprite = null;
            }
            this.currentShield = shield;
            if (shield) {
                const item=ITEMS[shield], frame = this.getShieldFrame(shield);
                if (item?.offhandKind || frame !== null) {
                    const dragonShield=item?.category==='dragon-gear';
                    const texture=item?.offhandKind?offhandTexture(this.scene,item):dragonShield?dragonGearTexture(this.scene,item.icon||shield,item.level):'dungeon';
                    this.shieldSprite = this.scene.add.image(this.x, this.sprite.y, texture, item?.offhandKind||dragonShield?undefined:frame)
                        .setScale(this.sprite.scaleX)
                        .setOrigin(0.5, 0.5);
                }
            }
        }
        this.updateAppearance();
    }

    updateWings(data) {
        const selected = data?.collection?.find(item => item.id === data.equipped);
        const key = selected ? `${selected.id}:${selected.level}` : null;
        if (this.wingKey === key) return;
        this.wingSprite?.destroy(); this.wingSprite = null; this.wingKey = key;
        if (selected) this.wingSprite = this.scene.add.image(this.x, this.sprite.y - 8,
            wingTexture(this.scene, selected.id, selected.level)).setOrigin(0.5, 0.5).setScale(3);
        this.updateAppearance();
    }

    getWeaponFrame(weaponId) {
        if (/^wood_staff(?:_[2-5])?$/.test(weaponId)) return 129;
        if (/^starter_axe(?:_[2-5])?$/.test(weaponId)) return 118;
        // Kiếm: frames 103-107, Rìu: frame 118, Gậy: frame 129
        const weaponFrames = {
            'iron_sword': 103, 'iron_sword_2': 104, 'iron_sword_3': 105,
            'iron_sword_4': 106, 'iron_sword_5': 107, 'starter_axe': 118,
            'wood_staff': 129, dragon_sword: 107, dragon_axe: 118, dragon_staff: 129
        };
        return weaponFrames[weaponId] ?? null;
    }

    getShieldFrame(shieldId) {
        // Khiên: frames 102, 101
        const shieldFrames = {
            'round_shield': 102, 'round_shield_2': 101, 'round_shield_3': 102,
            'round_shield_4': 101, 'round_shield_5': 102, dragon_shield: 102
        };
        return shieldFrames[shieldId] ?? null;
    }

    destroy() {
        this.wingSprite?.destroy();
        if (this.weaponSprite) this.weaponSprite.destroy();
        if (this.shieldSprite) this.shieldSprite.destroy();
        this.sprite.destroy();
        this.shadow.destroy();
    }
}
