import {BaseWorldScene} from './BaseWorldScene.js';
import {autumnForest} from '../data/autumnForest.js';
import {AutumnForestWorld} from '../world/AutumnForestWorld.js';
import {createAutumnMonsterTextures} from '../world/AutumnMonsterTextures.js';
export class AutumnForest extends BaseWorldScene{
 constructor(){super('AutumnForest',autumnForest);}
 createWorld(map){return new AutumnForestWorld(this,map);}
 create(){createAutumnMonsterTextures(this);super.create();}
}
