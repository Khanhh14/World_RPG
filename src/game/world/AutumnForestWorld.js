import {TinyOutdoorWorldBuilder} from './TinyOutdoorWorldBuilder.js';
export class AutumnForestWorld extends TinyOutdoorWorldBuilder{
 build(){
  super.build();
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
