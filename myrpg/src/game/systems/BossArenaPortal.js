export class BossArenaPortal {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.transitioning = false;
        this.range = 76;
        this.marker = scene.add.circle(data.x, data.feetY, 42, 0x7de3d5, 0.12)
            .setStrokeStyle(3, 0xc3fff0, 0.8).setDepth(9000);
        this.label = scene.add.text(data.x, data.feetY - 58, 'ĐẤU TRƯỜNG ĐỊA LONG', {
            fontFamily: 'Arial', fontSize: '13px', color: '#d3fff2',
            backgroundColor: '#193229', padding: { x: 7, y: 4 }
        }).setOrigin(0.5, 1).setDepth(9000);
        scene.tweens.add({ targets: this.marker, alpha: 0.45, duration: 800, yoyo: true, repeat: -1 });
        scene.events.once('shutdown', () => {
            this.marker.destroy();
            this.label.destroy();
        });
    }

    near() {
        const player = this.scene.player;
        return !!player && Math.hypot(player.x - this.data.x, player.feetY - this.data.feetY) <= this.range;
    }

    activate() {
        if (this.transitioning || !this.near()) return false;
        this.transitioning = true;
        this.scene.player.stop();
        this.scene.scene.start(this.data.target, { spawn: { ...this.data.spawn } });
        return true;
    }
}
