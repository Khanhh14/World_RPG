import { BaseWorldScene } from './BaseWorldScene.js';
import { noxiiCave } from '../data/noxiiCave.js';
import { NoxiiCaveWorld } from '../world/NoxiiCaveWorld.js';
import { NoxiiBoss } from '../systems/NoxiiBoss.js';
export class NoxiiCave extends BaseWorldScene {
    constructor(){super('NoxiiCave',noxiiCave);}
    createWorld(map){return new NoxiiCaveWorld(this,map);}
    create(){super.create();this.bossSystem=new NoxiiBoss(this);}
}
