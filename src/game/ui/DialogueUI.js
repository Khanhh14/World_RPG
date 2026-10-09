// Chỉ hiển thị hộp hội thoại; không xử lý phím hoặc chọn NPC.
export class DialogueUI {
    constructor(scene) {
        const width = scene.scale.width;
        const height = scene.scale.height;
        const top = height - 174;
        this.hint = scene.add.text(width / 2, height - 30, '', {
            fontFamily: 'Arial', fontSize: '18px', color: '#fff2c6',
            backgroundColor: '#20382b', padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10010).setVisible(false);
        const panel = scene.add.rectangle(20, top, width - 40, 154, 0x15251d, 0.97)
            .setOrigin(0).setStrokeStyle(3, 0xd7bd79);
        this.name = scene.add.text(40, top + 14, '', {
            fontFamily: 'Arial', fontSize: '21px', color: '#ffd166'
        });
        this.text = scene.add.text(40, top + 48, '', {
            fontFamily: 'Arial', fontSize: '19px', color: '#ffffff',
            wordWrap: { width: width - 90 }, lineSpacing: 5
        });
        this.footer = scene.add.text(40, top + 126, '', {
            fontFamily: 'Arial', fontSize: '14px', color: '#b8cabd'
        });
        this.elements = [panel, this.name, this.text, this.footer];
        this.elements.forEach(item => item.setScrollFactor(0).setDepth(10020).setVisible(false));
    }

    showHint(npc) {
        this.hint.setVisible(Boolean(npc));
        if (npc) this.hint.setText(`E · Nói chuyện với ${npc.name}`);
    }

    showLine(npc, index) {
        this.showHint(null);
        this.name.setText(npc.name);
        this.text.setText(npc.lines[index]);
        const action = index === npc.lines.length - 1 ? 'đóng' : 'tiếp tục';
        this.footer.setText(`${index + 1}/${npc.lines.length} · E: ${action} · Esc: đóng`);
        this.elements.forEach(item => item.setVisible(true));
    }

    hide() { this.elements.forEach(item => item.setVisible(false)); }

    destroy() {
        this.hint.destroy();
        this.elements.forEach(item => item.destroy());
    }
}
