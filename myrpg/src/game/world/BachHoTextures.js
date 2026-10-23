const animations={idle:[6,5,-1],walk:[8,8,-1],cast:[6,8,-1],hurt:[2,10,0],death:[8,8,0]};
export function createBachHoTextures(scene){
 for(const [state,[count,fps,repeat]] of Object.entries(animations)){
  for(let f=0;f<count;f++){
   const key=`bach-ho-${state}-${f}`;if(scene.textures.exists(key))continue;
   const tex=scene.textures.createCanvas(key,96,96),c=tex.context,phase=f/count*Math.PI*2,fall=state==='death'?f*2:0,bob=state==='walk'?Math.round(Math.sin(phase)*2):0;
   const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y+fall),w,h);};
   const line=(x,y,X,Y,w,color)=>{const n=Math.ceil(Math.hypot(X-x,Y-y));for(let i=0;i<=n;i++)r(x+(X-x)*i/n,y+(Y-y)*i/n,w,w,color);};
   const oval=(x,y,rx,ry,color)=>{for(let j=-ry;j<=ry;j++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));r(x-w,y+j,w*2+1,1,color);}};
   c.globalAlpha=state==='death'?1-f*.1:1;
   line(22,55,7,42+Math.sin(phase)*3,7,'#263b51');line(22,54,8,41+Math.sin(phase)*3,4,'#d2e5eb');line(8,42,6,26,5,'#eaf3ed');r(5,25,6,6,'#273e55');
   for(const [x,off]of [[25,0],[37,Math.PI],[59,Math.PI],[70,0]]){const step=state==='walk'?Math.sin(phase+off)*5:0;oval(x,70+step,6,15,'#263e55');r(x-4,62+step,9,20,'#c8e0e8');r(x-5,80+step,13,5,'#eff8f5');r(x-3,69+step,9,3,'#31475d');for(let i=0;i<3;i++)r(x-3+i*4,83+step,2,3,'#50667a');}
   oval(46,54+bob,29,17,'#273f55');oval(46,52+bob,27,15,'#c7dfe8');oval(45,47+bob,24,9,'#f4faf4');
   for(let i=0;i<6;i++){const x=25+i*8;r(x,39+bob,4,8+i%3*2,'#2c455b');line(x+2,46+bob,x-1,52+bob,3,'#2c455b');}r(34,62+bob,6,5,'#6d92a4');r(52,61+bob,5,5,'#6d92a4');
   oval(73,43+bob,17,20,'#284259');oval(74,42+bob,15,18,'#e5f0ee');oval(62,26+bob,6,7,'#284259');oval(83,25+bob,6,7,'#284259');r(60,23+bob,4,5,'#b8d1d9');r(81,22+bob,4,5,'#b8d1d9');
   r(64,33+bob,8,3,'#2e455a');r(78,32+bob,8,3,'#2e455a');r(66,37+bob,5,3,state==='cast'?'#b5ffff':'#5cc5ef');r(80,36+bob,5,3,'#5cc5ef');r(68,37+bob,2,4,'#172c42');r(81,36+bob,2,4,'#172c42');
   for(const [x,y]of [[60,41],[62,47],[83,42],[82,49]])r(x,y+bob,7,3,'#345269');
   oval(76,51+bob,10,6,'#f9fcf0');r(73,47+bob,7,4,'#334b60');r(76,51+bob,2,5,'#334b60');r(69,55+bob,17,state==='cast'?7:3,'#284054');r(70,55+bob,3,6,'#f4f9e7');r(81,54+bob,3,6,'#f4f9e7');
   line(66,51,54,48,1,'#f1fcff');line(66,54,53,57,1,'#f1fcff');line(86,51,94,47,1,'#f1fcff');
   r(72,25+bob,3,8,'#33556e');r(68,28+bob,11,2,'#33556e');
   if(state==='cast')for(let i=0;i<5;i++){r(18+i*14,20+(i+f)%3*9,2,4,'#a5eaff');}
   if(state==='hurt'){c.globalAlpha=.4;oval(46,52,26,14,'#ffffff');}c.globalAlpha=1;tex.refresh();
  }
  const key=`bach-ho-${state}`;if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:count},(_,i)=>({key:`bach-ho-${state}-${i}`})),frameRate:fps,repeat});
 }
}
