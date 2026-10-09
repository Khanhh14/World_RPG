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
        const length = Math.hypot(x, y);
        this.sprite.setVelocity(
            length ? x / length * this.speed : 0,
            length ? y / length * this.speed : 0
        );
        if (x) this.sprite.setFlipX(x < 0);
        this.updateAppearance();
    }

    updateAppearance() {
        this.sprite.setDepth(100 + this.feetY);
        this.shadow.setPosition(this.x, this.sprite.y + 22).setDepth(99 + this.feetY);
    }

    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
    }
}
