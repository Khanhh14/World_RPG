import {BaseWorldScene} from './BaseWorldScene.js';
import {guardianCave} from '../data/forestGuardian.js';
import {GuardianCaveWorld} from '../world/GuardianCaveWorld.js';
import {createForestGuardianTextures} from '../world/ForestGuardianTextures.js';
import {ForestGuardian} from '../systems/ForestGuardian.js';
export class GuardianCave extends BaseWorldScene{
 constructor(){super('GuardianCave',guardianCave);}
 createWorld(map){return new GuardianCaveWorld(this,map);}
 create(){createForestGuardianTextures(this);super.create();this.bossSystem=new ForestGuardian(this);}
}
