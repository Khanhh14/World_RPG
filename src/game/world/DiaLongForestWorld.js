import {TinyOutdoorWorldBuilder} from './TinyOutdoorWorldBuilder.js';
export class DiaLongForestWorld extends TinyOutdoorWorldBuilder{
 build(){
  super.build();for(const house of this.data.houses)this.house(...house);
  // Old weathered stones evoke a dragon's spine beside the northern clearing.
  for(const [col,row] of [[20,3],[21,2],[23,1],[25,1],[27,2],[29,3]]){
   const x=(col+.5)*48,y=(row+1)*48;
   this.add.image(x,y,'dungeon',6).setOrigin(.5,1).setScale(3).setDepth(100+y);
   this.blocker(x,y-6,22,12);
  }
  const camp=this.add.graphics().setDepth(3);
  camp.lineStyle(2,0xe3d5a2,.4).strokeEllipse(1176,1656,130,52);
  // Low plants use Tiny Town tiles; keep the road and actor spawn points clear.
  for(const [col,row] of [[2,8],[17,6],[30,7],[44,13],[3,25],[44,25]])this.tile(col,row,17,20);
 }
}
