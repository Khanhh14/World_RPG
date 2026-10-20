import { BaseWorldScene } from './BaseWorldScene.js';
import { noxiiEntrance } from '../data/noxiiEntrance.js';
import { NoxiiEntranceWorld } from '../world/NoxiiEntranceWorld.js';
export class NoxiiEntrance extends BaseWorldScene {
    constructor() { super('NoxiiEntrance', noxiiEntrance); }
    preload() {
        super.preload();
        if (!this.textures.exists('battle')) this.load.spritesheet('battle', 'assets/tiny-battle/Tilemap/tilemap_packed.png', {frameWidth: 16, frameHeight: 16});
    }
    createWorld(map) { return new NoxiiEntranceWorld(this, map); }
}
