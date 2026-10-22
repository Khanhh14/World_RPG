import {BaseWorldScene} from './BaseWorldScene.js';
import {diaLongForest} from '../data/diaLongForest.js';
import {DiaLongForestWorld} from '../world/DiaLongForestWorld.js';
import {createDiaLongMonsterTextures} from '../world/DiaLongMonsterTextures.js';
export class DiaLongForest extends BaseWorldScene{
 constructor(){super('DiaLongForest',diaLongForest);}
 createWorld(map){return new DiaLongForestWorld(this,map);}
 create(){createDiaLongMonsterTextures(this);super.create();}
}
