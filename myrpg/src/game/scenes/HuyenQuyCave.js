import {BaseWorldScene} from './BaseWorldScene.js';
import {huyenQuyCave} from '../data/huyenQuy.js';
import {HuyenQuyCaveWorld} from '../world/HuyenQuyCaveWorld.js';
import {createHuyenQuyTextures} from '../world/HuyenQuyTextures.js';
import {HuyenQuyBoss} from '../systems/HuyenQuyBoss.js';
export class HuyenQuyCave extends BaseWorldScene{
 constructor(){super('HuyenQuyCave',huyenQuyCave);}
 createWorld(map){return new HuyenQuyCaveWorld(this,map);}
 create(){createHuyenQuyTextures(this);super.create();this.bossSystem=new HuyenQuyBoss(this);}
}
