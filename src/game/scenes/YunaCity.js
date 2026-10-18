import { YunaCityWorld } from '../world/YunaCityWorld.js';
import { BaseWorldScene } from './BaseWorldScene.js';
import { yunaCity } from '../data/yunaCity.js';
export class YunaCity extends BaseWorldScene {constructor(){super('YunaCity',yunaCity);} createWorld(map){return new YunaCityWorld(this,map);}}
