export const HUYEN_QUY_ANIMATIONS={idle:{count:6,fps:5,repeat:-1},walk:{count:8,fps:7,repeat:-1},cast:{count:6,fps:8,repeat:-1},hurt:{count:2,fps:10,repeat:0},death:{count:8,fps:8,repeat:0}};
// Original 96px Xuanwu-inspired black tortoise with a serpent coiled around its shell.
export function createHuyenQuyTextures(scene){
 for(const [state,a] of Object.entries(HUYEN_QUY_ANIMATIONS)){
  for(let frame=0;frame<a.count;frame++){
   const key=`huyen-quy-${state}-${frame}`;if(scene.textures.exists(key))continue;
   const t=scene.textures.createCanvas(key,96,96),c=t.context;c.imageSmoothingEnabled=false;
   const phase=frame/a.count*Math.PI*2,dead=state==='death',fall=dead?frame*1.4:0,bob=state==='walk'?Math.round(Math.sin(phase)*1.5):Math.round(Math.sin(phase));
   const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y+fall),w,h);};
   const line=(x1,y1,x2,y2,w,color)=>{const n=Math.ceil(Math.hypot(x2-x1,y2-y1));for(let i=0;i<=n;i++){const k=n?i/n:0;rect(x1+(x2-x1)*k,y1+(y2-y1)*k,w,w,color);}};
   const disk=(x,y,rx,ry,color)=>{for(let dy=-ry;dy<=ry;dy++){const half=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry))));rect(x-half,y+dy,2*half+1,1,color);}};
   c.globalAlpha=dead?1-frame*.1:1;
   // Four plated legs, ivory claws, and the tortoise's low tail.
   for(const [x,y,sign] of [[20,62,-1],[30,75,1],[62,75,-1],[72,60,1]]){
    const step=state==='walk'?Math.round(Math.sin(phase+sign)*3):0;
    disk(x,y+step,8,9,'#192c3b');disk(x+1,y+step,6,7,'#3e5968');
    rect(x-4,y-3+step,8,2,'#8fa9a6');rect(x-5,y+6+step,11,4,'#223746');
    for(let i=0;i<3;i++)rect(x-4+i*4,y+8+step,2,3,'#d5d4af');
   }
   line(19,63,9,70,6,'#1b2e3d');line(10,69,4,63,4,'#648281');
   // Carapace: dark slate, pale ridges, six interlocking hexagonal scutes.
   disk(47,51+bob,30,26,'#12283a');disk(47,50+bob,28,24,'#77989b');
   disk(47,48+bob,26,22,'#274854');disk(45,45+bob,22,18,'#335e65');
   for(const [x,y] of [[31,40],[47,34],[63,41],[32,56],[49,51],[61,58]]){
    const points=[[x-6,y-6],[x+4,y-6],[x+9,y],[x+4,y+7],[x-6,y+7],[x-10,y]];
    for(let j=0;j<points.length;j++){const p=points[j],q=points[(j+1)%points.length];line(p[0],p[1]+bob,q[0],q[1]+bob,2,'#142f43');}
    line(x-5,y-4+bob,x+3,y-4+bob,1,'#84adab');
   }
   for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,x=47+Math.cos(angle)*27,y=51+bob+Math.sin(angle)*23;
    rect(x-1,y-1,3,2,'#b2c2ab');
   }
   // Central seal, pulsing cyan while channeling.
   disk(48,49+bob,5,7,'#162e42');rect(47,43+bob,2,12,state==='cast'?'#b4f5e9':'#76b6b4');rect(44,47+bob,8,2,'#94d1c7');
   // Dragon-like tortoise head, heavy brow and broad beak.
   disk(78,58+bob,11,10,'#162d3e');disk(80,58+bob,8,7,'#6a8987');
   rect(83,58+bob,10,6,'#162f40');rect(84,59+bob,8,3,'#b2c4aa');
   rect(79,53+bob,8,4,'#142a3d');rect(81,54+bob,4,2,'#f0d592');rect(84,54+bob,1,3,'#112638');
   rect(75,50+bob,10,2,'#b2c9bc');rect(87,62+bob,4,2,'#d3d4b1');
   // Serpent wraps from the lower rim up around the back; its head rises above it.
   const spine=[[28,74],[16,62],[11,45],[19,28],[38,20],[60,23],[76,34],[73,50],[62,63],[45,70]];
   for(let i=0;i<spine.length-1;i++){
    const p=spine[i],q=spine[i+1],wave=Math.sin(phase+i*.7)*(state==='cast'?2:1);
    line(p[0],p[1]+wave,q[0],q[1]+wave,7,'#102b3b');line(p[0]+1,p[1]+1+wave,q[0]+1,q[1]+1+wave,4,'#447e80');
    line(p[0]+2,p[1]+4+wave,q[0]+2,q[1]+4+wave,1,'#c5bd86');
   }
   const neck=state==='cast'?2:0;
   line(60,26,65,12-neck,7,'#142b3d');line(62,25,67,13-neck,3,'#659d95');
   disk(69,12-neck,10,6,'#102b3c');disk(70,11-neck,8,4,'#527e80');
   rect(72,9-neck,5,2,state==='cast'?'#d4fff1':'#efd28c');rect(75,9-neck,1,3,'#162a36');
   rect(76,14-neck,8,2,'#bdcdb9');rect(79,16-neck,2,3,'#dfd7b6');
   line(82,16-neck,89,21-neck,1,'#b77a86');line(89,21-neck,92,19-neck,1,'#b77a86');
   if(state==='cast')for(let i=0;i<4;i++)rect(24+i*14,32+(i+frame)%3*8,2,3,'#a8f3e5');
   if(state==='hurt'){c.globalAlpha=.3;disk(47,50,26,22,'#e3ffff');}
   if(dead){c.globalAlpha=1;for(let i=0;i<5;i++)rect(25+i*10,79+(i+frame)%9,2,2,'#7da7ac');}
   c.globalAlpha=1;t.refresh();
  }
  const key=`huyen-quy-${state}`;
  if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:a.count},(_,i)=>({key:`huyen-quy-${state}-${i}`})),frameRate:a.fps,repeat:a.repeat});
 }
}
