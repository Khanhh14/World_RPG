
// Hiển thị quái; CombatSystem quản lý máu, sát thương và hồi sinh.
export class MonsterDecoration {
    constructor(scene, data, tileSize, world) {
        this.data = data;
        const x = data.col * tileSize;
        const feetY = data.row * tileSize;
        const texture = data.texture ?? 'dungeon';
        const scale = data.scale ?? 3;


        this.shadow = scene.add.ellipse(
            x, feetY - 2,
            30,
            10,
            0x000000, 0.2
        ).setDepth(99 + feetY);

        // Gốc nằm ở chân để các texture khác kích thước vẫn đứng đúng vị trí.
        this.sprite = scene.add.sprite(x, feetY, texture, data.frame)
            .setOrigin(0.5, 1)
            .setScale(scale)
            .setDepth(100 + feetY);

        if (data.ai) {
            scene.physics.add.existing(this.sprite);
            this.sprite.body
                .setSize(8, 5)
                .setOffset(4, 11)
                .setAllowGravity(false)
                .setCollideWorldBounds(true);
            this.blockerCollider = scene.physics.add.collider(this.sprite, world.blockers);
            this.home = { x, y: feetY };
        }

        if (data.name) {
            this.label = scene.add.text(
                x, feetY - this.sprite.displayHeight - 8, data.name,
                {
                    fontFamily: 'Arial', fontSize: '13px',
                    color: '#d9ecc4', backgroundColor: '#20382b',
                    padding: { x: 5, y: 3 }
                }
            ).setOrigin(0.5, 1).setDepth(9000);
        }
    }

    destroy() {
        this.blockerCollider?.destroy();
        this.sprite.destroy();
        this.shadow.destroy();
        this.label?.destroy();
    }
}
