import {BaseWorldScene} from './BaseWorldScene.js';
import {hoaPhuongCave} from '../data/hoaPhuong.js';
import {HoaPhuongCaveWorld} from '../world/HoaPhuongCaveWorld.js';
import {createHoaPhuongTextures} from '../world/HoaPhuongTextures.js';
import {HoaPhuongBoss} from '../systems/HoaPhuongBoss.js';
export class HoaPhuongCave extends BaseWorldScene{
 constructor(){super('HoaPhuongCave',hoaPhuongCave);}
 createWorld(map){return new HoaPhuongCaveWorld(this,map);}
 create(){createHoaPhuongTextures(this);super.create();this.bossSystem=new HoaPhuongBoss(this);}
}
