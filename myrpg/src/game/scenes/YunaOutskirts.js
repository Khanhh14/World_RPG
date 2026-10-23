import { MushroomSystem } from '../systems/MushroomSystem.js';
import { BaseWorldScene } from './BaseWorldScene.js';
import { yunaOutskirts } from '../data/yunaOutskirts.js';
export class YunaOutskirts extends BaseWorldScene {
 create(){super.create();this.mushroomSystem=new MushroomSystem(this);}
 constructor() { super('YunaOutskirts', yunaOutskirts); }
}
