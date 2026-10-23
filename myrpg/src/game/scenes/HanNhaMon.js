import {BaseWorldScene} from './BaseWorldScene.js';
import {hanNhaMon} from '../data/hanNhaMon.js';
import {HanNhaMonWorld} from '../world/HanNhaMonWorld.js';
import {createBachHoTextures} from '../world/BachHoTextures.js';
import {BachHoBoss} from '../systems/BachHoBoss.js';
export class HanNhaMon extends BaseWorldScene{
 constructor(){super('HanNhaMon',hanNhaMon);}
 createWorld(map){return new HanNhaMonWorld(this,map);}
 create(){createBachHoTextures(this);super.create();this.bossSystem=new BachHoBoss(this);}
}
