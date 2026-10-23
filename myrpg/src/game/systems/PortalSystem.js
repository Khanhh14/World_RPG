// Cổng tự dịch chuyển khi người chơi bước vào, không dùng phím E.
export class PortalSystem {
    constructor(scene, world, portals = []) {
        this.scene = scene;
        this.portals = portals;
        this.transitioning = false;
        this.enabledAt = scene.time.now + 750;
        this.armed = false;
        this.createTextures();

        for (const portal of portals) {
            if (portal.kind === 'doorway') continue;
            const { x, feetY } = portal;
            scene.add.ellipse(x, feetY - 4, 112, 24, 0x102538, 0.35)
                .setDepth(99 + feetY);
            scene.add.image(x, feetY, 'west-portal-frame')
                .setOrigin(0.5, 1).setScale(3).setDepth(100 + feetY);
            const light = scene.add.image(x, feetY, 'west-portal-light')
                .setOrigin(0.5, 1).setScale(3).setDepth(101 + feetY);
            scene.tweens.add({
                targets: light, alpha: 0.45,
                duration: 900, yoyo: true, repeat: -1
            });
            scene.add.text(x, feetY - 136, portal.label, {
                fontFamily: 'Arial', fontSize: '15px', color: '#d3f7ff',
                backgroundColor: '#193229', padding: { x: 7, y: 4 }
            }).setOrigin(0.5, 1).setDepth(9000);
            scene.add.text(x, feetY + 10, 'Đi vào cổng', {
                fontFamily: 'Arial', fontSize: '12px', color: '#d3f7ff',
                backgroundColor: '#193229', padding: { x: 5, y: 3 }
            }).setOrigin(0.5, 0).setDepth(9000);

            // Hai trụ đá có va chạm; khoảng giữa mở để bước vào.
            world.blocker(x - 33, feetY - 45, 18, 84);
            world.blocker(x + 33, feetY - 45, 18, 84);
        }
    }

    createTextures() {
        const scene = this.scene;
        if (!scene.textures.exists('west-portal-frame')) {
            const g = scene.add.graphics();
            // Khung đá dạng bậc pixel, cùng tỉ lệ ô hình 16px.
            g.fillStyle(0x343e52);
            g.fillRect(2, 11, 6, 29);
            g.fillRect(24, 11, 6, 29);
            g.fillRect(6, 5, 20, 7);
            g.fillRect(10, 2, 12, 4);
            g.fillRect(2, 39, 28, 3);
            g.fillStyle(0x798a9d);
            g.fillRect(3, 12, 4, 26);
            g.fillRect(25, 12, 4, 26);
            g.fillRect(7, 6, 18, 4);
            g.fillRect(11, 3, 10, 2);
            g.fillStyle(0xb8c6cc);
            g.fillRect(3, 12, 1, 26);
            g.fillRect(25, 12, 1, 26);
            g.fillRect(7, 6, 18, 1);
            g.fillStyle(0x46566b);
            for (const y of [18, 25, 32]) {
                g.fillRect(3, y, 4, 1);
                g.fillRect(25, y, 4, 1);
            }
            g.fillStyle(0x78e6ef);
            g.fillRect(14, 6, 4, 4);
            g.generateTexture('west-portal-frame', 32, 42);
            g.destroy();
        }
        if (!scene.textures.exists('west-portal-light')) {
            const g = scene.add.graphics();
            g.fillStyle(0x254c92, 0.9);
            g.fillRect(8, 12, 16, 27);
            g.fillStyle(0x3d9bd0, 0.85);
            g.fillRect(10, 14, 12, 23);
            g.fillStyle(0x7ee4e5, 0.9);
            g.fillRect(13, 18, 6, 16);
            g.fillStyle(0xd4fbef);
            g.fillRect(15, 21, 2, 11);
            g.fillRect(9, 17, 2, 2);
            g.fillRect(20, 28, 2, 2);
            g.fillRect(12, 35, 2, 2);
            g.generateTexture('west-portal-light', 32, 42);
            g.destroy();
        }
    }

    contains(portal, player) {
        if (portal.kind === 'doorway') return Math.abs(player.x - portal.x) < portal.width / 2
            && Math.abs(player.feetY - portal.feetY) < portal.height / 2;
        return Math.abs(player.x - portal.x) < 18 &&
            Math.abs(player.feetY - (portal.feetY - 20)) < 18;
    }

    update(player, dialogueOpen = false) {
        if (this.transitioning || dialogueOpen) return false;
        const portal = this.portals.find(item => this.contains(item, player));
        // Khi xuất hiện ngay trong cổng, phải bước ra trước khi dùng lại.
        if (!portal) this.armed = true;
        if (!portal || !this.armed || this.scene.time.now < this.enabledAt) return false;

        this.transitioning = true;
        player.stop();
        this.scene.scene.start(portal.target, { spawn: { ...portal.spawn } });
        return true;
    }
}
