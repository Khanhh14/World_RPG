import { WorldBuilder } from './WorldBuilder.js';
export class YunaCityWorld extends WorldBuilder {
 build(){
  super.build();
  const {cols,rows}=this.data,T=this.tileSize;
  // Tường thành Tiny Town: hàng chóp 96–98, thân 108–110, chân 120–122.
  for(let x=0;x<cols;x++){
   const edge=x===0?0:x===cols-1?2:1;
   for(const y of [0,rows-3]){
    this.tile(x,y,96+edge,100+(y+3)*T);
    this.tile(x,y+1,108+edge,100+(y+3)*T);
    this.tile(x,y+2,120+edge,100+(y+3)*T);
   }
  }
  this.blocker(cols*T/2,1.5*T,cols*T,3*T);
  this.blocker(cols*T/2,(rows-1.5)*T,cols*T,3*T);
  for(let y=3;y<rows-3;y++){
   this.tile(0,y,123,100+(y+1)*T);this.tile(1,y,124,100+(y+1)*T);
   // Cửa Đông để đi tới cổng dịch chuyển.
   if(y>=18&&y<=22)continue;
   this.tile(cols-2,y,123,100+(y+1)*T);this.tile(cols-1,y,124,100+(y+1)*T);
  }
  this.blocker(T,rows*T/2,2*T,rows*T);
  this.blocker((cols-1)*T,9*T,2*T,18*T);
  this.blocker((cols-1)*T,(23+rows)*T/2,2*T,(rows-23)*T);
  const joints=this.scene.add.graphics().setDepth(1);
  joints.lineStyle(1,0x8e9bac,.24);
  for(let y=3;y<rows-3;y+=2){
   joints.lineBetween(2*T,y*T,(cols-2)*T,y*T);
   for(let x=2+(y%4?1:0);x<cols-2;x+=2)joints.lineBetween(x*T,y*T,x*T,Math.min(rows-3,y+2)*T);
  }
  // Viền đá nhạt phân chia quảng trường, không dùng nền đất/cỏ.
  for(let x=3;x<cols-3;x++)for(const y of [17,23])this.tile(x,y,121,3);
 }
}
