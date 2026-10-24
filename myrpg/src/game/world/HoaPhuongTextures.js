const animations={idle:[6,5,-1],walk:[8,8,-1],cast:[6,8,-1],hurt:[2,10,0],death:[8,8,0]};
export function createHoaPhuongCaveMouth(scene){
 if(scene.textures.exists('hoa-phuong-cave-mouth'))return;
 const t=scene.textures.createCanvas('hoa-phuong-cave-mouth',80,56),c=t.context;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 r(5,20,70,34,'#382b31');r(11,11,58,38,'#382b31');r(20,5,40,43,'#382b31');r(28,1,24,10,'#382b31');
 r(8,21,64,29,'#70574f');r(14,13,52,32,'#70574f');r(22,7,36,34,'#70574f');r(29,3,22,9,'#a77b5d');
 r(12,23,10,27,'#a88367');r(58,23,10,27,'#a88367');r(17,15,46,6,'#c69c72');r(24,9,31,5,'#c69c72');
 r(24,23,32,30,'#39212a');r(29,17,22,7,'#39212a');r(29,25,22,27,'#201c28');r(34,27,12,25,'#110f1c');
 r(22,50,36,5,'#a65b3d');r(28,51,24,4,'#dc8d4d');
 for(const [x,y]of [[12,20],[60,18],[23,8],[42,6],[7,34],[65,34]]){r(x,y,7,3,'#b64e33');r(x+2,y-2,4,3,'#f29a42');r(x+3,y-3,2,2,'#ffe4a3');}
 for(const x of [20,57]){r(x,32,3,12,'#5b4036');r(x-1,28,5,6,'#e76230');r(x,25,3,8,'#ffc560');r(x+1,27,1,5,'#fff0bb');}
 t.refresh();
}
// Original 96px phoenix: layered flight feathers, a golden breast and three long flame tails.
export function createHoaPhuongTextures(scene){
 for(const [state,[count,fps,repeat]]of Object.entries(animations)){
  for(let frame=0;frame<count;frame++){
   const key=`hoa-phuong-${state}-${frame}`;if(scene.textures.exists(key))continue;
   const t=scene.textures.createCanvas(key,96,96),c=t.context;c.imageSmoothingEnabled=false;
   const phase=frame/count*Math.PI*2,flap=Math.sin(phase)*(state==='cast'?13:state==='walk'?11:7),fall=state==='death'?frame*1.4:0,bob=state==='walk'?Math.round(Math.sin(phase)*2):0;
   const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y+fall),w,h);};
   const line=(x,y,X,Y,w,color)=>{const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)));for(let i=0;i<=n;i++)r(x+(X-x)*i/n,y+(Y-y)*i/n,w,w,color);};
   const oval=(x,y,rx,ry,color)=>{for(let dy=-ry;dy<=ry;dy++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry))));r(x-w,y+dy,w*2+1,1,color);}};
   c.globalAlpha=state==='death'?1-frame*.1:1;
   // Tail streamers curl below the body, leaving enough clear space at the feet.
   for(let i=0;i<3;i++){
    const x=45+(i-1)*10,sway=Math.sin(phase+i)*5,tip=78+i%2*12;
    line(45,53,x+sway,72,8,'#72313a');line(x+sway,72,x+(i-1)*8,tip,6,'#bf4732');line(45,53,x+sway+1,72,4,'#f4973c');line(x+sway+1,72,x+(i-1)*8,tip,2,'#ffe0a0');
    oval(x+(i-1)*8,tip-1,3,5,'#f7bd5b');r(x+(i-1)*8,tip-3,1,5,'#fff0b2');
   }
   for(const side of [-1,1]){
    const root=48+side*7,tipY=24+flap;
    line(root,44+bob,48+side*32,tipY+13,15,'#662c38');line(root,41+bob,48+side*32,tipY+10,11,'#b44132');line(root,38+bob,48+side*29,tipY+8,7,'#e77a35');
    for(let i=0;i<6;i++){
     const x=48+side*(18+i*4),y=tipY+9+i*4;
     line(root+side*5,44+i,x,y,6,'#813039');line(root+side*6,43+i,x,y-2,4,i%2?'#ed8436':'#f5ad48');line(root+side*8,42+i,x,y-3,1,'#ffe19a');
    }
    line(48+side*18,35+bob,48+side*42,tipY-5,5,'#a33b32');line(48+side*19,34+bob,48+side*42,tipY-6,2,'#ffd16b');
   }
   oval(48,44+bob,12,18,'#6b2e39');oval(48,43+bob,10,16,'#d15d32');oval(49,45+bob,7,13,'#f8b34e');oval(49,43+bob,4,10,'#ffe49b');
   for(let i=0;i<4;i++)r(43+i%2*3,37+i*5+bob,6,2,'#cf7137');
   line(45,57,40,66,3,'#b8743e');line(52,57,57,66,3,'#b8743e');for(const [x,sign]of [[39,-1],[56,1]]){line(x,66,x+sign*6,69,2,'#ffe0a0');line(x,66,x+2,70,2,'#ffe0a0');}
   // Raised neck, hooked beak, luminous eye and a three-pronged crest.
   line(49,33+bob,56,22+bob,11,'#772f38');line(49,32+bob,56,21+bob,7,'#f09a3d');oval(59,22+bob,10,8,'#863039');oval(60,21+bob,8,6,'#f5af47');
   r(64,23+bob,10,4,'#ffe0a0');r(71,26+bob,3,3,'#d88b42');r(60,18+bob,7,3,'#69313a');r(63,19+bob,3,2,state==='cast'?'#ffffff':'#fff2bf');
   for(let i=0;i<3;i++){line(55+i*3,17+bob,50+i*4,6+i%2*3,3,'#e66f33');r(49+i*4,5+i%2*3+bob,3,3,'#ffdb85');}
   if(state==='cast')for(let i=0;i<8;i++){const a=i*Math.PI/4+phase;r(48+Math.cos(a)*33,40+Math.sin(a)*26,2,3,'#ffe3a0');}
   if(state==='hurt'){c.globalAlpha=.35;oval(48,43,11,16,'#fff0b4');}c.globalAlpha=1;t.refresh();
  }
  const key=`hoa-phuong-${state}`;if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:count},(_,i)=>({key:`hoa-phuong-${state}-${i}`})),frameRate:fps,repeat});
 }
}
