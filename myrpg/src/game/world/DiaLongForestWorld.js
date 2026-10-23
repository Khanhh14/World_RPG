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
  const arena=this.add.graphics().setDepth(2);
  arena.fillStyle(0x738c58,.16).fillEllipse(1176,355,800,530);
  arena.lineStyle(4,0xcbb475,.55).strokeEllipse(1176,355,790,520);
  arena.lineStyle(2,0xe2ce93,.4).strokeEllipse(1176,355,735,472);
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,x=1176+Math.cos(a)*378,y=355+Math.sin(a)*245;
   arena.lineStyle(3,0xe0c989,.7).lineBetween(x-6,y+6,x,y-6).lineBetween(x,y-6,x+6,y+6);
  }
  this.add.text(1176,72,'LÃNH ĐỊA THANH LONG',{fontFamily:'Arial',fontSize:'15px',color:'#ffedbe',backgroundColor:'#263d32',padding:{x:8,y:5}}).setOrigin(.5).setDepth(9000);
  const camp=this.add.graphics().setDepth(3);
  camp.lineStyle(2,0xe3d5a2,.4).strokeEllipse(1176,1656,130,52);
  // Low plants use Tiny Town tiles; keep the road and actor spawn points clear.
  for(const [col,row] of [[2,8],[17,6],[30,7],[44,13],[3,25],[44,25]])this.tile(col,row,17,20);
 }
}
