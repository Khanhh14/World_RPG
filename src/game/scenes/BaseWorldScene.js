import { Scene } from 'phaser';
import { loadWorldAssets } from '../config/assets.js';
import { WorldBuilder } from '../world/WorldBuilder.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { DialogueUI } from '../ui/DialogueUI.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { PortalSystem } from '../systems/PortalSystem.js';
import { MonsterDecoration } from '../entities/MonsterDecoration.js';

// Dùng cho các khu vực dùng cùng bộ tile và cơ chế di chuyển.
export class BaseWorldScene extends Scene {
    constructor(key, mapData) {
        super(key);
        this.mapData = mapData;
    }

    init(data = {}) {
        // Dành cho điểm xuất hiện khi chuyển Scene sau này.
        this.spawn = data.spawn;
    }

    preload() { loadWorldAssets(this); }

    create() {
        const map = this.mapData;
        const width = map.cols * map.tileSize;
        const height = map.rows * map.tileSize;
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor(map.backgroundColor);
        this.world = new WorldBuilder(this, map);
        this.world.build();
        this.player = new Player(this, { ...map.player, ...this.spawn });
        this.npcs = (map.npcs ?? []).map(data => new NPC(this, data, this.world));
        this.monsters = (map.monsters ?? []).map(data => new MonsterDecoration(this, data, map.tileSize));
        this.portals = new PortalSystem(this, this.world, map.portals);
        this.worldCollider = this.physics.add.collider(this.player.sprite, this.world.blockers);
        this.dialogueUI = new DialogueUI(this);
        this.dialogue = new DialogueSystem(this, this.player, this.npcs, this.dialogueUI);
        this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
        this.cameras.main.roundPixels = true;
        this.add.text(16, 16, `${map.title}\nWASD: di chuyển · E: nói chuyện · Esc: đóng`, {
            fontFamily: 'Arial', fontSize: '18px', color: '#ffffff',
            backgroundColor: '#20382b', padding: { x: 12, y: 10 }
        }).setScrollFactor(0).setDepth(10000);

        // Phaser tự dọn Game Objects khi Scene shutdown.
        // Bỏ tham chiếu các lớp quản lý để tạo lại sạch khi vào map lần nữa.
        this.events.once('shutdown', () => {
            this.dialogue.active = null;
            this.world = null;
            this.player = null;
            this.npcs = [];
            this.dialogue = null;
            this.dialogueUI = null;
            this.worldCollider = null;
            this.portals = null;
            this.monsters = [];
        });
    }

    update() {
        if (!this.dialogue || !this.player) return;
        this.dialogue.update();
        this.player.update(this.dialogue.isOpen);
        this.portals.update(this.player, this.dialogue.isOpen);
    }
}
