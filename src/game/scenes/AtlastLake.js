import { BaseWorldScene } from './BaseWorldScene.js';
import { atlastLake } from '../data/atlastLake.js';
import { village } from '../data/village.js';
import { ProceduralWorldBuilder } from '../world/ProceduralWorldBuilder.js';

export class AtlastLake extends BaseWorldScene {
    constructor() {
        super('AtlastLake', {
            ...atlastLake,
            portals: atlastLake.portals.map(portal => ({
                ...portal,
                spawn: {
                    x: (village.cols - 5) * village.tileSize,
                    y: 15.5 * village.tileSize - 24
                }
            }))
        });
    }
    preload() {
        if (!this.textures.exists('dungeon')) {
            this.load.spritesheet('dungeon', 'assets/tiny-dungeon/Tilemap/tilemap_packed.png', {
                frameWidth: 16, frameHeight: 16
            });
        }
    }
    createWorld(map) { return new ProceduralWorldBuilder(this, map); }
    create() {
        super.create();
        this.add.text(18.5 * 48, 17 * 48 - 14, 'Bến câu cá', {
            fontFamily: 'Arial', fontSize: '15px', color: '#fff2c6',
            backgroundColor: '#665336', padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 1).setDepth(9000);
    }
}
