import { WorldBuilder } from './WorldBuilder.js';
export class NagaWorld extends WorldBuilder {
 build(){
  const s=this.scene,g=s.add.graphics().setDepth(0),w=1728,h=1536;
  g.fillStyle(0x14222b).fillRect(0,0,w,h);
  for(let y=48;y<h-48;y+=48)for(let x=48;x<w-48;x+=48){
   const n=(x*13+y*31)%17;g.fillStyle([0x293b41,0x2d4146,0x30474a][n%3]).fillRect(x+1,y+1,46,46);
   if(n<5){g.lineStyle(1,0x1b2e34,.6).lineBetween(x+7,y+13,x+30,y+25);g.lineBetween(x+30,y+25,x+35,y+42);}
  }
  g.fillStyle(0x435951).fillCircle(864,650,335);g.lineStyle(5,0x68816b,.7).strokeCircle(864,650,310);g.lineStyle(2,0x8aac76,.5).strokeCircle(864,650,285);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=864+Math.cos(a)*295,y=650+Math.sin(a)*295;g.lineStyle(3,0xa4bf83,.7).lineBetween(x-6,y-6,x+6,y+6);g.lineBetween(x-6,y+6,x+6,y-6);}
  for(let y=1008;y<1440;y+=48){g.fillStyle(0x46534b).fillRect(792,y,144,46);}
  this.blocker(w/2,24,w,48);this.blocker(w/2,h-24,w,48);this.blocker(24,h/2,48,h);this.blocker(w-24,h/2,48,h);
  for(let i=0;i<26;i++){
   const x=i%2?1500:160,y=110+Math.floor(i/2)*100;
   const rock=s.add.graphics().setDepth(100+y);rock.fillStyle(0x14232a).fillEllipse(x,y,130,38);rock.fillStyle(0x4c6570).fillTriangle(x-48,y,x-30,y-85,x+20,y);rock.fillStyle(0x314850).fillTriangle(x-30,y-85,x+20,y,x+45,y-12);
   this.blocker(x,y-8,85,35);
   if(i%3===0){rock.fillStyle(0x6fe6be).fillTriangle(x+20,y-5,x+35,y-68,x+48,y-12);rock.fillStyle(0xd0ffe2).fillTriangle(x+35,y-68,x+35,y-8,x+41,y-21);}
  }
 }
}
