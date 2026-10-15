import { wingTexture } from '../world/WingTextures.js';
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
        this.sprite.setVelocity(
            length ? x / length * this.speed : 0,
            length ? y / length * this.speed : 0
        );
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
        this.shieldSprite
            .setPosition(
                this.x + (facingLeft ? 22 : -22),
                this.sprite.y + 1
            )
            .setDepth(playerDepth + (facingLeft ? 1 : -1))
            .setFlipX(facingLeft);
    }
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
                if (frame !== null) {
                    this.weaponSprite = this.scene.add.image(this.x, this.sprite.y, 'dungeon', frame)
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
                const frame = this.getShieldFrame(shield);
                if (frame !== null) {
                    this.shieldSprite = this.scene.add.image(this.x, this.sprite.y, 'dungeon', frame)
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
        // Kiếm: frames 103-107, Rìu: frame 118, Gậy: frame 129
        const weaponFrames = {
            'iron_sword': 103, 'iron_sword_2': 104, 'iron_sword_3': 105,
            'iron_sword_4': 106, 'iron_sword_5': 107, 'starter_axe': 118,
            'wood_staff': 129
        };
        return weaponFrames[weaponId] ?? null;
    }

    getShieldFrame(shieldId) {
        // Khiên: frames 102, 101
        const shieldFrames = {
            'round_shield': 102, 'round_shield_2': 101, 'round_shield_3': 102,
            'round_shield_4': 101, 'round_shield_5': 102
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
