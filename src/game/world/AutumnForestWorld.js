import {createGuardianCaveTexture} from './ForestGuardianTextures.js';
import {TinyOutdoorWorldBuilder} from './TinyOutdoorWorldBuilder.js';
export class AutumnForestWorld extends TinyOutdoorWorldBuilder{
 build(){
  super.build();
  createGuardianCaveTexture(this.scene);
  const x=1056,y=264;
  this.add.ellipse(x,y-3,230,35,0x263429,.25).setDepth(99+y);
  this.add.image(x,y,'guardian-cave-mouth').setOrigin(.5,1).setScale(3).setDepth(100+y);
  // Solid rock sides; the 84px corridor remains open for walking into the cave.
  this.blocker(x-87,y-49,60,98);this.blocker(x+87,y-49,60,98);
  this.add.text(x,y-182,'HANG THỦ HỘ KHU RỪNG',{fontFamily:'Arial',fontSize:'15px',color:'#ffe4a0',backgroundColor:'#263c2d',padding:{x:8,y:5}}).setOrigin(.5,1).setDepth(9000);
  this.add.text(x,y+10,'Đi vào hang',{fontFamily:'Arial',fontSize:'12px',color:'#f6e2af',backgroundColor:'#263c2d',padding:{x:6,y:3}}).setOrigin(.5,0).setDepth(9000);
  const leaves=this.add.graphics().setDepth(2),colors=[0xd9ac4b,0xf3cc65,0xba783e,0xe8ba59];
  // Static pixel leaves, no particle emitter: clear roads remain easy to read.
  for(let i=0;i<420;i++){
   const x=3*((i*137%2000)/3|0)+48,y=3*((i*83%1590)/3|0)+48;
   leaves.fillStyle(colors[i%colors.length],.65).fillRect(x,y,6,3);
   if(i%3===0)leaves.fillRect(x+3,y-3,3,3);
  }
  for(const [col,row] of [[17,3],[26,3],[16,27],[28,27]]){
   const x=(col+.5)*48,y=(row+1)*48;
   this.add.image(x,y,'dungeon',6).setOrigin(.5,1).setScale(3).setDepth(100+y);
   this.blocker(x,y-6,22,12);
  }
 }
}
