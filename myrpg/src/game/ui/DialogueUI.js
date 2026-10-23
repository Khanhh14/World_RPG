import { ActionBarUI } from './ActionBarUI.js';

// Hộp hội thoại + cụm ô hành động; tương thích DialogueSystem hiện tại.
export class DialogueUI {
    constructor(scene) {
        this.scene = scene;
        this.actionBar = new ActionBarUI(scene);

        this.panel = scene.add.rectangle(0, 0, 100, 154, 0x15251d, 0.97)
            .setOrigin(0).setStrokeStyle(3, 0xd7bd79);
        this.name = scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: '21px', color: '#ffd166'
        });
        this.text = scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: '19px', color: '#ffffff',
            wordWrap: { width: 800 }, lineSpacing: 5
        });
        this.footer = scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: '14px', color: '#b8cabd'
        });
        this.elements = [this.panel, this.name, this.text, this.footer];
        this.elements.forEach(item => {
            item.setScrollFactor(0).setDepth(10020).setVisible(false);
        });

        this.resize(scene.scale.width, scene.scale.height);
        this.onResize = (gameSize) => this.resize(gameSize.width, gameSize.height);
        scene.scale.on('resize', this.onResize);
        this.onShutdown = () => scene.scale.off('resize', this.onResize);
        scene.events.once('shutdown', this.onShutdown);
    }

    resize(width, height) {
        const top = height - 174;
        this.panel.setPosition(20, top).setSize(Math.max(1, width - 40), 154);
        this.name.setPosition(40, top + 14);
        this.text.setPosition(40, top + 48).setWordWrapWidth(Math.max(1, width - 90));
        this.footer.setPosition(40, top + 126);
        this.actionBar.resize(width, height);
    }

    showHint(npc) {
        // Thay dòng gợi ý giữa màn hình bằng biểu tượng trong ô E.
        this.actionBar.setNPC(npc);
    }

    showLine(npc, index) {
        this.actionBar.setVisible(false);
        this.name.setText(npc.name);
        this.text.setText(npc.lines[index]);
        const action = index === npc.lines.length - 1 ? 'đóng' : 'tiếp tục';
        this.footer.setText(`${index + 1}/${npc.lines.length} · E: ${action} · Esc: đóng`);
        this.elements.forEach(item => item.setVisible(true));
    }

    hide() {
        this.elements.forEach(item => item.setVisible(false));
        this.actionBar.setNPC(null);
        this.actionBar.setVisible(true);
    }

    destroy() {
        this.scene.scale.off('resize', this.onResize);
        this.scene.events.off('shutdown', this.onShutdown);
        this.actionBar.destroy();
        this.elements.forEach(item => item.destroy());
    }
}
