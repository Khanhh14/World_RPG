import { Input } from 'phaser';

// Chọn NPC gần nhất và quản lý tiến trình hội thoại.
export class DialogueSystem {
    constructor(scene, player, npcs, ui, range = 88) {
        this.scene = scene;
        this.player = player;
        this.npcs = npcs;
        this.ui = ui;
        this.range = range;
        this.active = null;
        this.keys = scene.input.keyboard.addKeys('E,ESC');
    }

    get isOpen() { return Boolean(this.active); }

    nearest() {
        let result = null;
        let minimum = this.range;
        for (const npc of this.npcs) {
            const distance = Math.hypot(this.player.x - npc.x, this.player.feetY - npc.feetY);
            if (distance < minimum) {
                minimum = distance;
                result = npc;
            }
        }
        return result;
    }

    update() {
        const pressE = Input.Keyboard.JustDown(this.keys.E);
        const pressEsc = Input.Keyboard.JustDown(this.keys.ESC);
        if (pressEsc && this.isOpen) this.close();
        else if (pressE) this.interact();
        this.ui.showHint(this.isOpen ? null : this.nearest());
    }

    interact() {
        if (this.active) {
            this.active.index++;
            if (this.active.index >= this.active.npc.lines.length) this.close();
            else this.ui.showLine(this.active.npc, this.active.index);
            return;
        }
        const npc = this.nearest();
        if (npc?.isMerchant) {
            this.player.stop(); npc.facePlayer(this.player);
            this.scene.hud?.openShop(npc); return;
        }
        if (!npc || !npc.lines?.length) return;
        this.active = { npc, index: 0 };
        this.player.stop();
        npc.facePlayer(this.player);
        this.ui.showLine(npc, 0);
    }

    close() {
        this.active = null;
        this.ui.hide();
    }
}
