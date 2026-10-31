import {WorldBuilder} from './WorldBuilder.js';

export class DragonRuinsWorld extends WorldBuilder{
 build(){
  const {cols,rows}=this.data,size=this.tileSize,centerX=cols*size/2;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   this.tile(col,row,14);
   if((col*13+row*7)%29===0)this.tile(col,row,49,1);
   if((col*5+row*11)%47===0)this.tile(col,row,61,1);
  }

  for(let col=2;col<cols-2;col++)for(let row=14;row<18;row++)this.tile(col,row,49,2);
  for(let row=17;row<rows-2;row++)for(let col=19;col<23;col++)this.tile(col,row,49,2);
  for(let row=9;row<24;row++)for(let col=17;col<25;col++){
   if(Math.hypot(col-21,row-15)<4.4)this.tile(col,row,49,3);
  }

  for(let col=0;col<cols;col++){
   this.tile(col,0,28,100);
   if(col<18||col>23)this.tile(col,rows-1,28,100);
  }
  for(let row=1;row<rows;row++){
   this.tile(0,row,28,100);
   this.tile(cols-1,row,28,100);
  }
  this.blocker(centerX,size/2,cols*size,size);
  this.blocker(size/2,rows*size/2,size,rows*size);
  this.blocker((cols-.5)*size,rows*size/2,size,rows*size);
  this.blocker((centerX-144)/2,(rows-.5)*size,centerX-144,size);
  this.blocker(centerX+144+(cols*size-centerX-144)/2,(rows-.5)*size,cols*size-centerX-144,size);

  for(const [col,row] of [[5,4],[12,5],[29,4],[36,6],[5,26],[13,27],[28,27],[36,25]]){
   this.column(col,row);
  }
  for(const [col,row,frame] of [[3,11,6],[9,12,7],[32,11,6],[38,14,7],[4,23,6],[37,22,7],[15,4,6],[26,27,6]]){
   this.tile(col,row,frame,100+(row+1)*size);
   this.blocker((col+.5)*size,(row+.75)*size,24,18);
  }

  this.dragonSeal(centerX,15*size);
  this.gate(centerX,rows*size);
  this.cracks();
 }

 column(col,row){
  const size=this.tileSize;
  for(let dy=0;dy<3;dy++)this.tile(col,row+dy,[8,20,32][dy],100+(row+3)*size);
  this.blocker((col+.5)*size,(row+2.8)*size,36,24);
 }

 dragonSeal(x,y){
  const g=this.add.graphics().setDepth(4);
  g.fillStyle(0x9a7939,.1).fillEllipse(x,y,570,390);
  g.lineStyle(5,0xb99b56,.56).strokeEllipse(x,y,550,370);
  g.lineStyle(2,0xd1bb79,.43).strokeEllipse(x,y,506,326);
  g.lineStyle(2,0xb99b56,.38).strokeEllipse(x,y,390,238);
  for(let i=0;i<16;i++){
   const angle=i*Math.PI/8,rx=Math.cos(angle),ry=Math.sin(angle);
   const px=x+rx*265,py=y+ry*175;
   g.lineStyle(3,0xd4bd75,.62)
    .lineBetween(px-rx*8,py-ry*8,px+rx*8,py+ry*8)
    .lineBetween(px-ry*5,py+rx*5,px+ry*5,py-rx*5);
  }
  g.lineStyle(11,0x92763f,.78).beginPath().moveTo(x-118,y+48)
   .lineTo(x-68,y+73).lineTo(x-15,y+50).lineTo(x+37,y+62)
   .lineTo(x+91,y+35).lineTo(x+105,y-3).lineTo(x+74,y-34)
   .lineTo(x+30,y-22).lineTo(x+5,y+5).lineTo(x-35,y-11)
   .lineTo(x-67,y-46).lineTo(x-106,y-31).lineTo(x-91,y+2)
   .lineTo(x-51,y+12).lineTo(x-22,y+35).strokePath();
  g.lineStyle(5,0xd3b96e,.75).lineBetween(x+72,y-34,x+94,y-67)
   .lineBetween(x+84,y-31,x+122,y-49).lineBetween(x+98,y+29,x+129,y+48)
   .lineBetween(x+63,y+47,x+79,y+77).lineBetween(x-62,y+48,x-77,y+79)
   .lineBetween(x-103,y+17,x-135,y+31).lineBetween(x-50,y-10,x-61,y-46);
  g.fillStyle(0xe4c979,.85).fillCircle(x+74,y-25,5);
 }

 gate(x,y){
  const g=this.add.graphics().setDepth(100+y);
  g.fillStyle(0x10232a,.9).fillRect(x-76,y-122,152,120);
  g.fillStyle(0x393d3b,1).fillRect(x-96,y-132,28,132).fillRect(x+68,y-132,28,132);
  g.fillStyle(0x76704f,1).fillRect(x-89,y-132,14,112).fillRect(x+75,y-132,14,112);
  g.fillStyle(0x4f5144,1).fillRect(x-68,y-148,136,24);
  g.fillStyle(0x948456,1).fillRect(x-55,y-158,110,15);
  g.lineStyle(3,0xd3bb72,.9).strokeCircle(x,y-84,22);
  g.lineStyle(2,0x8be0cf,.8).strokeCircle(x,y-84,14);
  g.lineStyle(3,0xd3bb72,.72).beginPath().moveTo(x-14,y-84).lineTo(x-5,y-94)
   .lineTo(x+3,y-78).lineTo(x+14,y-88).strokePath();
  this.add.text(x,y-174,'VỀ KHU RỪNG ĐỊA LONG',{
   fontFamily:'Arial',fontSize:'13px',color:'#f0daa0',
   backgroundColor:'#172a2c',padding:{x:7,y:4}
  }).setOrigin(.5,1).setDepth(9000);
 }

 cracks(){
  const g=this.add.graphics().setDepth(5);
  for(const [x,y,dx,dy] of [[290,430,33,19],[510,1120,-28,31],[1500,480,34,-23],[1720,1150,-36,25],[450,1410,26,-32],[1580,840,-24,-34],[830,260,23,18],[1240,1320,-30,-16]]){
   g.lineStyle(2,0x11191e,.5).beginPath().moveTo(x,y)
    .lineTo(x+dx*.5,y+dy*.5).lineTo(x+dx,y+dy)
    .lineTo(x+dx*1.1,y+dy*1.5).strokePath();
  }
 }
}
