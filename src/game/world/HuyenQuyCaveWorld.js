import {WorldBuilder} from './WorldBuilder.js';
export class HuyenQuyCaveWorld extends WorldBuilder{
 build(){
  const {cols,rows}=this.data;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   this.tile(x,y,14).setTint((x+y)%7===0?0x7096a3:0x88abb5);
   if(!x||!y||x===cols-1||y===rows-1)this.tile(x,y,28,10).setTint(0x5d8a9b);
  }
  this.blocker(864,24,1728,48);this.blocker(864,1512,1728,48);this.blocker(24,768,48,1536);this.blocker(1704,768,48,1536);
  const ground=this.add.graphics().setDepth(2);
  for(const x of [120,1608]){
   ground.fillStyle(0x143d5a,.9).fillRoundedRect(x-65,120,130,1120,28);
   ground.lineStyle(3,0x5fa2b4,.6).strokeRoundedRect(x-65,120,130,1120,28);
   this.blocker(x,680,130,1120);
  }
  ground.fillStyle(0x346b78,.14).fillCircle(864,624,335);
  ground.lineStyle(5,0x8bbbbb,.6).strokeCircle(864,624,310);ground.lineStyle(2,0xa6d3cd,.4).strokeCircle(864,624,283);
  for(let i=0;i<16;i++){
   const a=i*Math.PI/8,x=864+Math.cos(a)*297,y=624+Math.sin(a)*297;
   ground.lineStyle(3,0xa8d3c4,.7).lineBetween(x-5,y+6,x,y-6).lineBetween(x,y-6,x+5,y+6);
  }
  for(let y=24;y<30;y++)for(let x=16;x<20;x++)this.tile(x,y,49,1).setTint(0x93b7b7);
  for(const col of [5,29])for(const row of [5,13,21]){
   for(let dy=0;dy<3;dy++)this.tile(col,row+dy,[8,20,32][dy],100+(row+3)*48).setTint(0x91bcc3);
   this.blocker((col+.5)*48,(row+2.8)*48,36,24);
   ground.fillStyle(0x7ed8db,.09).fillCircle((col+.5)*48,(row+2)*48,65);
  }
  this.add.text(864,148,'PHONG ẤN HUYỀN VŨ',{fontFamily:'Arial',fontSize:'17px',color:'#bfebe6',backgroundColor:'#163c4b',padding:{x:10,y:5}}).setOrigin(.5).setDepth(9000);
  const fx=this.add.graphics().setDepth(3);
  const tick=()=>{
   fx.clear();const time=this.scene.time.now/1000;
   for(let i=0;i<23;i++){
    const x=180+(i*137%1360),y=100+(i*83%1260),k=(time*.12+i*.171)%1;
    fx.lineStyle(1,0x9cdee0,.1+.13*Math.sin(k*Math.PI)).strokeEllipse(x+Math.sin(time*.5+i)*14,y,56+k*34,13+k*8);
   }
   for(let i=0;i<18;i++){
    const k=(time*.06+i*.127)%1,x=(i%2?1608:120)+Math.sin(i*2+time)*35,y=1200-k*1030;
    fx.lineStyle(1.5,0x9bdae3,.45*(1-k)).strokeCircle(x,y,2+i%4);
   }
  };
  this.scene.events.on('postupdate',tick);this.scene.events.once('shutdown',()=>{this.scene.events.off('postupdate',tick);fx.destroy();});
 }
}
