import {WorldBuilder}from'./WorldBuilder.js';
export class HoaPhuongCaveWorld extends WorldBuilder{
 build(){
  const {cols,rows}=this.data;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   this.tile(x,y,14).setTint((x+y)%7===0?0x9c7970:0xb19a8a);
   if(!x||!y||x===cols-1||y===rows-1)this.tile(x,y,28,10).setTint(0x956258);
  }
  this.blocker(864,24,1728,48);this.blocker(864,1512,1728,48);this.blocker(24,768,48,1536);this.blocker(1704,768,48,1536);
  const g=this.add.graphics().setDepth(2);
  for(const x of [120,1608]){g.fillStyle(0x7e312a).fillRoundedRect(x-65,120,130,1120,28);g.lineStyle(5,0xf68b3f,.7).strokeRoundedRect(x-65,120,130,1120,28);this.blocker(x,680,130,1120);}
  g.fillStyle(0x923f30,.15).fillCircle(864,624,335);g.lineStyle(5,0xf5b460,.7).strokeCircle(864,624,310);g.lineStyle(2,0xe67741,.6).strokeCircle(864,624,283);
  for(let i=0;i<16;i++){const a=i*Math.PI/8,x=864+Math.cos(a)*298,y=624+Math.sin(a)*298;g.lineStyle(3,0xffd58a,.75).lineBetween(x-6,y+7,x,y-7).lineBetween(x,y-7,x+6,y+7);}
  for(let y=24;y<30;y++)for(let x=16;x<20;x++)this.tile(x,y,49,1).setTint(0xc3a48d);
  for(const col of [5,29])for(const row of [5,13,21]){for(let dy=0;dy<3;dy++)this.tile(col,row+dy,[8,20,32][dy],100+(row+3)*48).setTint(0xc48b6b);this.blocker((col+.5)*48,(row+2.8)*48,36,24);}
  this.add.text(864,148,'PHƯỢNG SÀO · BIỂN LỬA VĨNH HẰNG',{fontFamily:'Arial',fontSize:'17px',color:'#ffe0a1',backgroundColor:'#492a2c',padding:{x:10,y:5}}).setOrigin(.5).setDepth(9000);
  const fx=this.add.graphics().setDepth(3);const tick=()=>{fx.clear();const t=this.scene.time.now/1000;
   for(let i=0;i<64;i++){const x=(i%2?1608:120)+Math.sin(i*2+t)*42,k=(t*.15+i*.137)%1,y=1210-k*1080;fx.fillStyle(i%3?0xffad4e:0xffdf91,(1-k)*.8).fillRect(x,y,3+i%3,4);if(i%3===0)fx.lineStyle(1,0xffb05e,(1-k)*.4).lineBetween(x,y+14,x,y);}
   for(let i=0;i<18;i++){const x=350+i*137%1000,y=220+i*83%1000,k=(t*.12+i*.17)%1;fx.fillStyle(0xffc477,Math.sin(k*Math.PI)*.3).fillRect(x+Math.sin(t+i)*12,y-k*35,2,3);}
  };
  this.scene.events.on('postupdate',tick);this.scene.events.once('shutdown',()=>{this.scene.events.off('postupdate',tick);fx.destroy();});
 }
}
