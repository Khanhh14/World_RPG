import {TinyOutdoorWorldBuilder} from './TinyOutdoorWorldBuilder.js';
import {createHoaPhuongCaveMouth} from './HoaPhuongTextures.js';
export class HiuuLingRiverWorld extends TinyOutdoorWorldBuilder{
 build(){
  super.build();createHoaPhuongCaveMouth(this.scene);
  const x=2064,y=840;
  this.add.ellipse(x,y-3,230,35,0x38262b,.3).setDepth(99+y);
  this.add.image(x,y,'hoa-phuong-cave-mouth').setOrigin(.5,1).setScale(3).setDepth(100+y);
  this.blocker(x-87,y-49,60,98);this.blocker(x+87,y-49,60,98);
  this.add.text(x,y-182,'HANG HỎA PHƯỢNG',{fontFamily:'Arial',fontSize:'15px',color:'#ffe0a1',backgroundColor:'#49312b',padding:{x:8,y:5}}).setOrigin(.5,1).setDepth(9000);
  this.add.text(x,y+10,'Đi vào hang',{fontFamily:'Arial',fontSize:'12px',color:'#ffdfa1',backgroundColor:'#49312b',padding:{x:6,y:3}}).setOrigin(.5,0).setDepth(9000);
 }
}
