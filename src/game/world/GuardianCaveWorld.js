import {WorldBuilder} from './WorldBuilder.js';
export class GuardianCaveWorld extends WorldBuilder{
 build(){
  const {cols,rows}=this.data,s=this.tileSize;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   this.tile(x,y,14);
   if(!x||!y||x===cols-1||y===rows-1)this.tile(x,y,28,10);
  }
  this.blocker(864,24,1728,48);this.blocker(864,1512,1728,48);
  this.blocker(24,768,48,1536);this.blocker(1704,768,48,1536);
  for(let y=23;y<30;y++)for(let x=16;x<20;x++)this.tile(x,y,49,1);
  for(const col of [3,31])for(const row of [5,12,19]){
   for(let dy=0;dy<3;dy++)this.tile(col,row+dy,[8,20,32][dy],100+(row+3)*s);
   this.blocker((col+.5)*s,(row+2.8)*s,36,24);
   this.add.image((col+.5)*s,(row+2)*s,'town',3).setOrigin(.5,1).setScale(3).setDepth(100+(row+3)*s);
  }
  const g=this.add.graphics().setDepth(2);
  g.fillStyle(0x607357,.13).fillCircle(864,624,338);
  g.lineStyle(5,0xbda568,.6).strokeCircle(864,624,310);
  g.lineStyle(2,0x93b08b,.45).strokeCircle(864,624,286);
  for(let i=0;i<16;i++){
   const a=i*Math.PI/8,x=864+Math.cos(a)*298,y=624+Math.sin(a)*298;
   g.lineStyle(3,0xd9c27b,.75).lineBetween(x-6,y+7,x,y-7).lineBetween(x,y-7,x+6,y+7);
  }
  for(let i=0;i<210;i++){
   const x=48+i*137%1600,y=48+i*83%1360;
   g.fillStyle([0xaa873e,0xd4af56,0x778b52][i%3],.6).fillRect(x,y,6,3);
  }
 }
}
