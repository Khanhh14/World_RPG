import { BaseWorldScene } from './BaseWorldScene.js';
import { diaLongBossArena } from '../data/diaLongBoss.js';
import { DragonRuinsWorld } from '../world/DragonRuinsWorld.js';
import { createDragonRuinsMonsterTextures } from '../world/DragonRuinsMonsterTextures.js';
import { DiaLongBossSystem } from '../systems/DiaLongBossSystem.js';

export class DiaLongBoss extends BaseWorldScene {
    constructor() { super('DiaLongBoss', diaLongBossArena); }
    createWorld(map) { return new DragonRuinsWorld(this, map); }
    create() {
        createDragonRuinsMonsterTextures(this);
        super.create();
        this.bossSystem = new DiaLongBossSystem(this);
    }
}
