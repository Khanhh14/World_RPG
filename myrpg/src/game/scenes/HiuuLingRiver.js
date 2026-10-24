import {BaseWorldScene} from './BaseWorldScene.js';
import {hiuuLingRiver} from '../data/hiuuLingRiver.js';
import {TinyOutdoorWorldBuilder} from '../world/TinyOutdoorWorldBuilder.js';
import {createHiuuLingMonsterTextures} from '../world/HiuuLingMonsterTextures.js';
export class HiuuLingRiver extends BaseWorldScene{
 constructor(){super('HiuuLingRiver',hiuuLingRiver);}
 preload(){super.preload();if(!this.textures.exists('battle'))this.load.spritesheet('battle','assets/tiny-battle/Tilemap/tilemap_packed.png',{frameWidth:16,frameHeight:16});}
 createWorld(map){return new TinyOutdoorWorldBuilder(this,map);}
 create(){createHiuuLingMonsterTextures(this);super.create();}
}
