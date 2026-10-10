import { BaseWorldScene } from './BaseWorldScene.js';
import { westForest } from '../data/westForest.js';
import { ProceduralWorldBuilder } from '../world/ProceduralWorldBuilder.js';

export class WestForest extends BaseWorldScene {
    constructor() { super('WestForest', westForest); }

    // Địa hình không dùng Tiny Town; chỉ nhân vật/quái/ô kỹ năng dùng Tiny Dungeon.
    preload() {
        if (!this.textures.exists('dungeon')) {
            this.load.spritesheet('dungeon', 'assets/tiny-dungeon/Tilemap/tilemap_packed.png', {
                frameWidth: 16, frameHeight: 16
            });
        }
    }
    createWorld(map) { return new ProceduralWorldBuilder(this, map); }
}
