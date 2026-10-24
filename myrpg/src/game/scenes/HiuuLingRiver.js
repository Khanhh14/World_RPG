import {BaseWorldScene} from './BaseWorldScene.js';
import {hiuuLingRiver} from '../data/hiuuLingRiver.js';
import {HiuuLingRiverWorld} from '../world/HiuuLingRiverWorld.js';
import {createHiuuLingMonsterTextures} from '../world/HiuuLingMonsterTextures.js';
export class HiuuLingRiver extends BaseWorldScene{
 constructor(){super('HiuuLingRiver',hiuuLingRiver);}
 preload(){super.preload();if(!this.textures.exists('battle'))this.load.spritesheet('battle','assets/tiny-battle/Tilemap/tilemap_packed.png',{frameWidth:16,frameHeight:16});}
 createWorld(map){return new HiuuLingRiverWorld(this,map);}
 create(){createHiuuLingMonsterTextures(this);super.create();}
}
