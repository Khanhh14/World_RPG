import {WorldBuilder} from './WorldBuilder.js';
export class HanNhaMonWorld extends WorldBuilder{
 build(){
  const g=this.add.graphics().setDepth(0);g.fillStyle(0xdcebf0).fillRect(0,0,1728,1536);
  for(let y=0;y<32;y++)for(let x=0;x<36;x++){
   if((x*17+y*23)%7===0){g.fillStyle(0xbcd8e3,.6).fillRect(x*48+8,y*48+15,18,3).fillRect(x*48+26,y*48+31,9,3);}
   if(!x||!y||x===35||y===31)this.tile(x,y,28,10).setTint(0x91bacc);
  }
  this.blocker(864,24,1728,48);this.blocker(864,1512,1728,48);this.blocker(24,768,48,1536);this.blocker(1704,768,48,1536);
  g.fillStyle(0xa3cbdc,.6).fillEllipse(864,624,850,650);g.lineStyle(5,0xefffff,.9).strokeEllipse(864,624,850,650);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;g.lineStyle(2,0xefffff,.7).lineBetween(864+Math.cos(a)*70,624+Math.sin(a)*70,864+Math.cos(a)*320,624+Math.sin(a)*250);}
  for(const x of [150,1530])for(const y of [240,500,780,1060]){
   const p=this.add.graphics().setDepth(100+y);p.fillStyle(0x617c87).fillRect(x-9,y-30,18,40);
   for(let k=0;k<3;k++){const yy=y-40-k*35,w=70-k*12;p.fillStyle(0x416878).fillTriangle(x-w,yy+14,x,yy-65,x+w,yy+14);p.fillStyle(0xf0f8f8).fillTriangle(x-w+3,yy+5,x,yy-65,x+w-3,yy+5);}
   this.blocker(x,y,40,24);
  }
  for(let y=1100;y<1440;y+=55){g.fillStyle(0xb0c8d1,.65).fillRoundedRect(817,y,94,30,8);}
  this.add.text(864,144,'HÀN NHA MÔN · PHONG ẤN BẠCH HỔ',{fontFamily:'Arial',fontSize:'18px',color:'#e9fcff',backgroundColor:'#29485d',padding:{x:12,y:7}}).setOrigin(.5).setDepth(9000);
  const snow=this.add.graphics().setDepth(8998);const tick=()=>{snow.clear();const t=this.scene.time.now/1000;for(let i=0;i<100;i++){const y=(i*173+t*(18+i%20))%1536,x=(i*137+Math.sin(t*.5+i)*23)%1728;snow.fillStyle(0xffffff,.4+i%3*.15).fillRect(x,y,2+i%3,2+i%3);}};
  this.scene.events.on('postupdate',tick);this.scene.events.once('shutdown',()=>{this.scene.events.off('postupdate',tick);snow.destroy();});
 }
}
