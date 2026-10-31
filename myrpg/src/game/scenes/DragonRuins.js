import {BaseWorldScene} from './BaseWorldScene.js';
import {dragonRuins} from '../data/dragonRuins.js';
import {DragonRuinsWorld} from '../world/DragonRuinsWorld.js';
import {createDragonRuinsMonsterTextures} from '../world/DragonRuinsMonsterTextures.js';

export class DragonRuins extends BaseWorldScene{
 constructor(){super('DragonRuins',dragonRuins);}
 createWorld(map){return new DragonRuinsWorld(this,map);}
 create(){createDragonRuinsMonsterTextures(this);super.create();}
}
