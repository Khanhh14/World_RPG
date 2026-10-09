// Hiển thị hộp hội thoại và tự điều chỉnh theo kích thước game.
export class DialogueUI {
    constructor(scene) {
        this.scene = scene;

        this.hint = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#fff2c6',
            backgroundColor: '#20382b',
            padding: { x: 12, y: 8 }
        })
            .setOrigin(0.5, 1)
            .setScrollFactor(0)
            .setDepth(10010)
            .setVisible(false);

        this.panel = scene.add.rectangle(
            0, 0, 100, 154, 0x15251d, 0.97
        )
            .setOrigin(0)
            .setStrokeStyle(3, 0xd7bd79);

        this.name = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '21px',
            color: '#ffd166'
        });

        this.text = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '19px',
            color: '#ffffff',
            wordWrap: { width: 800 },
            lineSpacing: 5
        });

        this.footer = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#b8cabd'
        });

        this.elements = [
            this.panel,
            this.name,
            this.text,
            this.footer
        ];

        this.elements.forEach(item => {
            item
                .setScrollFactor(0)
                .setDepth(10020)
                .setVisible(false);
        });

        // Căn giao diện ngay khi tạo.
        this.resize(scene.scale.width, scene.scale.height);

        // Căn lại khi cửa sổ thay đổi kích thước.
        this.onResize = (gameSize) => {
            this.resize(gameSize.width, gameSize.height);
        };

        scene.scale.on('resize', this.onResize);

        // Gỡ sự kiện khi rời Scene.
        this.onShutdown = () => {
            scene.scale.off('resize', this.onResize);
        };

        scene.events.once('shutdown', this.onShutdown);
    }

    resize(width, height) {
        const top = height - 174;

        this.hint.setPosition(width / 2, height - 30);

        this.panel
            .setPosition(20, top)
            .setSize(Math.max(1, width - 40), 154);

        this.name.setPosition(40, top + 14);

        this.text
            .setPosition(40, top + 48)
            .setWordWrapWidth(Math.max(1, width - 90));

        this.footer.setPosition(40, top + 126);
    }

    showHint(npc) {
        this.hint.setVisible(Boolean(npc));

        if (npc) {
            this.hint.setText(`E · Nói chuyện với ${npc.name}`);
        }
    }

    showLine(npc, index) {
        this.showHint(null);
        this.name.setText(npc.name);
        this.text.setText(npc.lines[index]);

        const action = index === npc.lines.length - 1
            ? 'đóng'
            : 'tiếp tục';

        this.footer.setText(
            `${index + 1}/${npc.lines.length} · E: ${action} · Esc: đóng`
        );

        this.elements.forEach(item => item.setVisible(true));
    }

    hide() {
        this.elements.forEach(item => item.setVisible(false));
    }

    destroy() {
        this.scene.scale.off('resize', this.onResize);
        this.scene.events.off('shutdown', this.onShutdown);

        this.hint.destroy();
        this.elements.forEach(item => item.destroy());
    }
}