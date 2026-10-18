import { BossRewards } from '../systems/BossRewards.js';
import { SkillsSystem } from '../systems/SkillsSystem.js';
import { WingsSystem } from '../systems/WingsSystem.js';
import { applyCharacterToScene } from '../systems/characterSession.js';
import { Scene } from 'phaser';
import { loadWorldAssets } from '../config/assets.js';
import { WorldBuilder } from '../world/WorldBuilder.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { DialogueUI } from '../ui/DialogueUI.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { PortalSystem } from '../systems/PortalSystem.js';
import { MonsterDecoration } from '../entities/MonsterDecoration.js';
import { RPGState } from '../systems/RPGState.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { RPGHUD } from '../ui/RPGHUD.js';

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

    createWorld(map) { return new WorldBuilder(this, map); }

    create() {
        const map = this.mapData;
        const width = map.cols * map.tileSize;
        const height = map.rows * map.tileSize;
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor(map.backgroundColor);
        this.world = this.createWorld(map);
        this.world.build();
        this.player = new Player(this, { ...map.player, ...this.spawn });
        this.npcs = (map.npcs ?? []).map(data => new NPC(this, data, this.world));
        this.monsters = (map.monsters ?? []).map(data => new MonsterDecoration(this, data, map.tileSize, this.world));
        this.portals = new PortalSystem(this, this.world, map.portals);
        this.worldCollider = this.physics.add.collider(this.player.sprite, this.world.blockers);
        this.dialogueUI = new DialogueUI(this);
        this.dialogue = new DialogueSystem(this, this.player, this.npcs, this.dialogueUI);
        this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
        this.cameras.main.roundPixels = true;
        this.rpgState = RPGState.forScene(this);
        this.rpgState.visit(map.id);
        this.wingsSystem = new WingsSystem(this, this.rpgState);
        this.skillsSystem = new SkillsSystem(this, this.rpgState);
        this.hud = new RPGHUD(this, this.rpgState, map.title);
        this.questSystem = new QuestSystem(this);
        this.bossRewards = new BossRewards(this);
        applyCharacterToScene(this);

        // Cập nhật trang bị ban đầu và lắng nghe thay đổi
        this.updatePlayerEquipment();
        this.equipmentUnsubscribe = this.rpgState.subscribe(() => this.updatePlayerEquipment());

        // Phaser tự dọn Game Objects khi Scene shutdown.
        // Bỏ tham chiếu các lớp quản lý để tạo lại sạch khi vào map lần nữa.
        this.events.once('shutdown', () => {
            if (this.equipmentUnsubscribe) this.equipmentUnsubscribe();
            this.hud?.destroy();
            this.hud = null;
            this.questSystem = null;
            this.dialogue.active = null;
            this.world = null;
            this.player = null;
            this.npcs = [];
            this.dialogue = null;
            this.dialogueUI = null;
            this.worldCollider = null;
            this.portals = null;
            this.monsters.forEach(monster => monster.destroy());
            this.monsters = [];
        });
    }

    updatePlayerEquipment() {
        if (!this.player || !this.rpgState) return;
        const equipment = this.rpgState.data.equipment;
        this.player.updateEquipment(equipment.weapon, equipment.shield);
        this.player.updateWings(this.rpgState.data.wings);
    }

    update() {
        if (!this.dialogue || !this.player) return;
        const menuOpen = this.hud?.blocked ?? false;
        if (!menuOpen) this.dialogue.update();
        const blocked = (this.hud?.blocked ?? false) || this.dialogue.isOpen;
        this.player.update(blocked);
        this.portals.update(this.player, blocked);
        this.hud?.syncDialogue(this.dialogue.isOpen);
    }
}
