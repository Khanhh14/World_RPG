// Cụm hành động cố định: ba ô kỹ năng nhỏ và một ô tương tác lớn.
// Các ô 1/2/3 hiện chỉ là giao diện, chưa có logic chiến đấu.
export class ActionBarUI {
    constructor(scene) {
        this.scene = scene;
        this.npc = null;
        this.visible = true;
        this.graphics = scene.add.graphics()
            .setScrollFactor(0).setDepth(10010);

        this.smallSlots = [103, 116, 129].map((frame, index) => ({
            icon: scene.add.image(0, 0, 'dungeon', frame)
                .setScrollFactor(0).setDepth(10011).setAlpha(0.6),
            key: scene.add.text(0, 0, `${index + 1}`, {
                fontFamily: 'Arial', fontSize: '12px', color: '#d4dbd4'
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(10012)
        }));

        this.key = scene.add.text(0, 0, 'E', {
            fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: '#fff2c6'
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(10012);

        this.caption = scene.add.text(0, 0, 'Tương tác', {
            fontFamily: 'Arial', fontSize: '13px', color: '#cad3ca'
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10012);

        this.resize(scene.scale.width, scene.scale.height);
    }

    resize(width, height) {
        const scale = Math.min(1, Math.max(0.2, (width - 32) / 284));
        const big = 88 * scale;
        const small = 52 * scale;
        const gap = 8 * scale;
        const margin = 20 * scale;
        const x = width - margin - big;
        const y = height - margin - big;

        this.layout = { x, y, big, small, gap, scale };
        this.key.setPosition(x + big - 8 * scale, y + big - 6 * scale)
            .setFontSize(17 * scale);
        this.caption.setPosition(x + big / 2, y - 8 * scale)
            .setFontSize(13 * scale);

        this.smallSlots.forEach((slot, index) => {
            const left = x - 12 * scale - (3 - index) * (small + gap) + gap;
            const top = y + big - small;
            slot.x = left;
            slot.y = top;
            slot.icon.setPosition(left + small / 2, top + small / 2)
                .setScale(2 * scale);
            slot.key.setPosition(left + small - 5 * scale, top + small - 4 * scale)
                .setFontSize(12 * scale);
        });
        this.draw();
    }

    setNPC(npc) {
        if (this.npc === npc) return;
        this.npc = npc;
        this.caption.setText(npc ? (npc.isMerchant ? 'Mua bán' : 'Trò chuyện') : 'Tương tác');
        this.draw();
    }

    draw() {
        const { x, y, big, small, scale } = this.layout;
        const g = this.graphics;
        g.clear();

        // Ba ô kỹ năng nhỏ, làm mờ vì chưa có kỹ năng được gắn.
        for (const slot of this.smallSlots) {
            g.fillStyle(0x12251d, 0.9);
            g.fillRect(slot.x, slot.y, small, small);
            g.lineStyle(2 * scale, 0x607468, 1);
            g.strokeRect(slot.x, slot.y, small, small);
        }

        const ready = Boolean(this.npc);
        g.fillStyle(ready ? 0x244e38 : 0x15251d, 0.95);
        g.fillRect(x, y, big, big);
        g.lineStyle(3 * scale, ready ? 0xffd166 : 0x708276, 1);
        g.strokeRect(x, y, big, big);

        if (ready) {
            // Bong bóng trò chuyện vẽ bằng hình học, không cần ảnh mới.
            const left = x + 20 * scale;
            const top = y + 20 * scale;
            const width = 46 * scale;
            const height = 30 * scale;
            g.fillStyle(0xfff2c6, 1);
            g.fillRect(left, top, width, height);
            g.fillTriangle(
                left + 9 * scale, top + height,
                left + 9 * scale, top + height + 10 * scale,
                left + 20 * scale, top + height
            );
            g.fillStyle(0x244e38, 1);
            for (let i = 0; i < 3; i++) {
                g.fillCircle(left + (12 + i * 11) * scale, top + 15 * scale, 2 * scale);
            }
        } else {
            // Không ở gần NPC: chỉ hiện dấu tương tác trung tính.
            g.lineStyle(2 * scale, 0x708276, 1);
            g.strokeCircle(x + big / 2, y + 37 * scale, 13 * scale);
            g.fillStyle(0x708276, 1);
            g.fillCircle(x + big / 2, y + 37 * scale, 3 * scale);
        }
    }

    setVisible(visible) {
        this.visible = visible;
        this.graphics.setVisible(visible);
        this.key.setVisible(visible);
        this.caption.setVisible(visible);
        for (const slot of this.smallSlots) {
            slot.icon.setVisible(visible);
            slot.key.setVisible(visible);
        }
    }

    destroy() {
        this.graphics.destroy();
        this.key.destroy();
        this.caption.destroy();
        for (const slot of this.smallSlots) {
            slot.icon.destroy();
            slot.key.destroy();
        }
    }
}
