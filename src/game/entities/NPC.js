// Một NPC: hình, bóng, tên và vùng va chạm.
export class NPC {
    constructor(scene, data, world) {
        this.id = data.id ?? data.name;
        this.name = data.name;
        this.role = data.role;
        this.isMerchant = data.role === 'merchant' || data.id === 'merchant' || data.shop === 'general' || String(data.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('thuong nhan');
        this.lines = data.lines;
        this.x = data.col * world.tileSize;
        this.feetY = data.row * world.tileSize;
        this.sprite = scene.add.sprite(
            this.x, this.feetY - 24, data.texture ?? 'dungeon', data.frame
        ).setScale(3).setDepth(100 + this.feetY);
        this.shadow = scene.add.ellipse(this.x, this.feetY - 2, 30, 10, 0x000000, 0.2)
            .setDepth(99 + this.feetY);
        this.label = scene.add.text(this.x, this.feetY - 56, this.name, {
            fontFamily: 'Arial', fontSize: '14px',
            color: '#fff2c6', backgroundColor: '#20382b', padding: { x: 5, y: 3 }
        }).setOrigin(0.5, 1).setDepth(9000);
        this.blocker = world.blocker(this.x, this.feetY - 8, 24, 16);
    }

    facePlayer(player) { this.sprite.setFlipX(player.x < this.x); }

    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
        this.label.destroy();
        this.blocker.destroy();
    }
}
