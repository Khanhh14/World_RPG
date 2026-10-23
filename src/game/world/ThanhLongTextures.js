export const DRAGON_ANIMATIONS={idle:{count:6,fps:6,repeat:-1},walk:{count:8,fps:9,repeat:-1},cast:{count:6,fps:8,repeat:-1},hurt:{count:2,fps:10,repeat:0},death:{count:8,fps:8,repeat:0}};
// Original 96px coiled Asian dragon: a continuous scaled serpent, four claws,
// antlers, golden mane and long whiskers. No external image or font dependency.
export function createThanhLongTextures(scene){
 for(const [state,a] of Object.entries(DRAGON_ANIMATIONS)){
  for(let frame=0;frame<a.count;frame++){
   const key=`thanh-long-${state}-${frame}`;if(scene.textures.exists(key))continue;
   const t=scene.textures.createCanvas(key,96,96),c=t.context;c.imageSmoothingEnabled=false;
   const dead=state==='death',phase=frame/a.count*Math.PI*2,fall=dead?frame*2:0;
   const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y+fall),w,h);};
   const disk=(x,y,rx,ry,color)=>{
    for(let dy=-ry;dy<=ry;dy++){const half=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry))));rect(x-half,y+dy,half*2+1,1,color);}
   };
   const line=(x1,y1,x2,y2,width,color)=>{const steps=Math.ceil(Math.hypot(x2-x1,y2-y1));for(let n=0;n<=steps;n++){const k=steps?n/steps:0;rect(x1+(x2-x1)*k,y1+(y2-y1)*k,width,width,color);}};
   c.globalAlpha=dead?1-frame*.1:1;
   const spine=[[7,76],[20,79],[33,72],[35,61],[25,52],[15,45],[14,33],[23,24],[35,26],[43,36],[43,49],[55,57],[69,53],[77,43],[77,31]];
   const points=[];
   for(let i=0;i<spine.length-1;i++)for(let j=0;j<4;j++){
    const k=j/4,x=spine[i][0]*(1-k)+spine[i+1][0]*k;
    let y=spine[i][1]*(1-k)+spine[i+1][1]*k+Math.sin(phase+i*.6)*1.5;
    if(state==='cast')y-=Math.max(0,i-8)*.35;if(dead)y=53+(y-53)*(1-frame*.07);
    points.push({x,y});
   }
   // Far claws behind the coiled body.
   for(const [x,y,side] of [[22,29,-1],[52,52,1],[30,66,1],[72,39,-1]]){
    const dy=state==='walk'?Math.sin(phase+side)*3:0;
    line(x,y,x+side*10,y+8+dy,4,'#273c3b');line(x+side*10,y+8+dy,x+side*13,y+15+dy,3,'#3c8e80');
    for(let j=0;j<3;j++)line(x+side*13+j*2,y+14+dy,x+side*15+j*2,y+18+dy,1,'#f4dc9b');
   }
   for(let i=0;i<points.length;i++){
    const p=points[i],r=Math.min(6,2+i*.22);
    disk(p.x,p.y,Math.round(r+2),Math.round(r+2),'#263c3e');
   }
   for(let i=0;i<points.length;i++){
    const p=points[i],r=Math.round(Math.min(6,2+i*.22));
    disk(p.x,p.y,r,r,'#317c77');disk(p.x+1,p.y+2,Math.max(1,r-2),Math.max(1,r-3),'#d9b964');
    if(i%3===0){rect(p.x-3,p.y-r+1,4,2,'#6bb6a0');rect(p.x-1,p.y-r-2,2,3,'#e7c165');}
   }
   const headY=25+Math.round(Math.sin(phase)*1.5)-(state==='cast'?2:0);
   // Flame-shaped mane, projecting muzzle and eye ridge.
   for(const [x,y] of [[64,-4],[60,3],[62,10],[65,16]]){rect(x,headY+y,7,6,'#6a573d');rect(x+2,headY+y,4,4,'#d5a34e');rect(x+3,headY+y-2,2,3,'#f4cc71');}
   disk(74,headY+3,11,10,'#233b3c');disk(75,headY+3,9,8,'#59a68f');
   rect(77,headY+2,15,9,'#273c3b');rect(79,headY+3,12,6,'#a2c69b');rect(83,headY+8,8,3,'#d5bb75');
   rect(82,headY+3,7,2,'#f4dda3');rect(89,headY+3,2,2,'#304c47');
   rect(72,headY-2,9,4,'#263b37');rect(74,headY-1,5,2,'#fff0ac');rect(77,headY-1,1,3,'#28382e');rect(71,headY-5,10,2,'#d6b45e');
   // Deer-like antlers (Asian dragon, no wings).
   for(const [x,side] of [[68,-1],[76,1]]){
    line(x,headY-5,x+side*3,headY-15,3,'#524a36');line(x+1,headY-6,x+side*3+1,headY-16,1,'#ffe2a0');
    line(x+side*2,headY-12,x+side*7,headY-13,2,'#dac48c');
   }
   line(86,headY+8,91,headY+14,1,'#fff1b8');line(91,headY+14,85,headY+20,1,'#fff1b8');
   line(82,headY+10,84,headY+20,1,'#ffe4a3');line(84,headY+20,77,headY+23,1,'#ffe4a3');
   if(state==='cast'){rect(90,headY+5,4,4,frame%2?'#ffe9a0':'#eaa15e');}
   if(state==='hurt'){c.globalAlpha=.35;rect(64,headY-4,28,20,'#fff2d2');}
   c.globalAlpha=1;t.refresh();
  }
  const key=`thanh-long-${state}`;
  if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:a.count},(_,i)=>({key:`thanh-long-${state}-${i}`})),frameRate:a.fps,repeat:a.repeat});
 }
}
