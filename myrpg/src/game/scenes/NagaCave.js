import { BaseWorldScene } from './BaseWorldScene.js';
import { NagaWorld } from '../world/NagaWorld.js';
import { NagaBoss } from '../systems/NagaBoss.js';
const map={id:'naga-cave',title:'HANG ĐỘNG NAGA',tileSize:48,cols:36,rows:32,backgroundColor:'#172a30',
 player:{x:864,y:1270,texture:'dungeon',frame:96,scale:3,speed:200},npcs:[],monsters:[],
 portals:[{x:864,feetY:1440,label:'Về Khu Rừng Phía Tây',target:'WestForest',spawn:{x:1512,y:1872}}]};
export class NagaCave extends BaseWorldScene {
 constructor(){super('NagaCave',map);}
 createWorld(data){return new NagaWorld(this,data);}
 create(){super.create();this.bossSystem=new NagaBoss(this);}
}
