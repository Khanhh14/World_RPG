import { BaseWorldScene } from './BaseWorldScene.js';
import { atlastLake } from '../data/atlastLake.js';
import { village } from '../data/village.js';
import { TinyOutdoorWorldBuilder } from '../world/TinyOutdoorWorldBuilder.js';
import { FishingSystem } from '../systems/FishingSystem.js';

export class AtlastLake extends BaseWorldScene {
    constructor() {
        super('AtlastLake', {
            ...atlastLake,
            portals: atlastLake.portals.map(portal => ({
                ...portal,
                spawn: portal.target==='Game'?{
                    x: (village.cols - 5) * village.tileSize,
                    y: 15.5 * village.tileSize - 24
                }:{...portal.spawn}
            }))
        });
    }
    createWorld(map) { return new TinyOutdoorWorldBuilder(this, map); }
    create() {
        super.create();
        this.fishingSystem = new FishingSystem(this);
    }
    preload() {
        super.preload();
        if (!this.textures.exists('battle')) {
            this.load.spritesheet('battle', 'assets/tiny-battle/Tilemap/tilemap_packed.png', {
                frameWidth: 16, frameHeight: 16
            });
        }
    }
}
