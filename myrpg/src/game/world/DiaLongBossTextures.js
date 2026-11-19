const ANIMATIONS={
 idle:{count:6,fps:6,repeat:-1},
 walk:{count:8,fps:10,repeat:-1},
 cast:{count:8,fps:9,repeat:0},
 hurt:{count:2,fps:10,repeat:0},
 death:{count:8,fps:8,repeat:0}
};

const COLORS={
 outline:'#202c27',stone:'#59684a',stoneLight:'#85905b',
 belly:'#c09a60',gold:'#f0c56a',eye:'#fff0a1',
 claw:'#e5d7a4',dark:'#392d28',hurt:'#f0f0d7'
};

function polygon(ctx,points,color,stroke=COLORS.outline,width=2){
 ctx.beginPath();
 points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();
 ctx.fillStyle=color;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}

function oval(ctx,x,y,rx,ry,color){
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}

function line(ctx,points,color,width){
 ctx.beginPath();points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='square';ctx.lineJoin='miter';ctx.stroke();
}

function drawDragon(ctx,state,frame){
 const phase=frame/ANIMATIONS[state].count*Math.PI*2;
 const walking=state==='walk';
 const casting=state==='cast';
 const hurt=state==='hurt';
 const dying=state==='death';
 const fall=dying?frame*2.2:0;
 const bob=dying?frame*.7:Math.round(Math.sin(phase)*(walking?2:1));
 const tailSwing=casting?[-12,-7,0,12,23,17,5,-4][frame]:Math.sin(phase)*(walking?7:3);
 const legSteps=walking?[Math.sin(phase)*5,-Math.sin(phase)*5,-Math.sin(phase)*5,Math.sin(phase)*5]:[0,0,0,0];
 const stone=hurt?COLORS.hurt:COLORS.stone;
 const light=hurt?'#fff5cf':COLORS.stoneLight;
 const alpha=dying?Math.max(.18,1-frame*.105):1;

 ctx.save();ctx.globalAlpha=alpha;ctx.translate(0,fall);
 if(dying)ctx.translate(0,frame*1.3);

 // Rear tail swings behind the body and whips through the cast animation.
 const tailY=66+bob+tailSwing;
 line(ctx,[[37,61+bob],[25,61+bob+tailSwing*.28],[14,57+tailSwing*.65],[5,tailY]],COLORS.outline,12);
 line(ctx,[[37,59+bob],[25,59+bob+tailSwing*.28],[14,55+tailSwing*.65],[5,tailY-2]],stone,7);
 polygon(ctx,[[3,tailY-3],[10,tailY-9],[9,tailY-2],[14,tailY+1],[7,tailY+4]],light,COLORS.outline,2);
 line(ctx,[[13,55+tailSwing*.65],[8,tailY-4]],'#c5b878',2);

 // Hind and forelegs, with alternating strides and chipped stone claws.
 const legs=[[27,61,legSteps[0]],[41,65,legSteps[1]],[62,63,legSteps[2]],[75,57,legSteps[3]]];
 for(const [x,y,step] of legs){
  polygon(ctx,[[x-6,y-2+bob],[x+5,y-3+bob],[x+8,y+9+step],[x+5,y+17+step],[x-8,y+17+step],[x-9,y+10+step]],COLORS.outline,null);
  polygon(ctx,[[x-4,y-2+bob],[x+4,y-2+bob],[x+5,y+8+step],[x+3,y+14+step],[x-6,y+14+step],[x-7,y+8+step]],stone,null);
  polygon(ctx,[[x-7,y+13+step],[x+6,y+13+step],[x+8,y+17+step],[x-9,y+17+step]],COLORS.dark,null);
  for(let claw=0;claw<3;claw++)polygon(ctx,[[x-6+claw*5,y+15+step],[x-3+claw*5,y+15+step],[x-4+claw*5,y+19+step]],COLORS.claw,null);
  line(ctx,[[x-3,y+2+bob],[x-2,y+7+step]],light,2);
 }

 // Heavy earth-dragon torso and plated underside.
 oval(ctx,49,53+bob,34,21,COLORS.outline);
 oval(ctx,49,50+bob,32,19,stone);
 oval(ctx,49,56+bob,25,12,COLORS.belly);
 oval(ctx,47,51+bob,26,13,light);
 oval(ctx,48,54+bob,22,9,COLORS.stone);
 for(let scale=0;scale<5;scale++){
  const x=31+scale*8,y=53+bob+Math.sin(scale*1.7)*3;
  polygon(ctx,[[x-4,y-2],[x,y-5],[x+4,y-2],[x+3,y+3],[x-3,y+3]],scale%2?'#737d50':'#65734a',null);
 }
 for(let plate=0;plate<6;plate++){
  const x=26+plate*9,y=37+bob+(plate===2?0:Math.abs(plate-2)*1.5);
  polygon(ctx,[[x-5,y+9],[x-2,y+1],[x+1,y+5],[x+4,y-2],[x+7,y+10]],COLORS.outline,null);
  polygon(ctx,[[x-3,y+8],[x-1,y+2],[x+1,y+6],[x+4,y],[x+6,y+9]],light,null);
  line(ctx,[[x+1,y+5],[x+3,y+8]],'#d0b975',1);
 }
 // Broad shoulders and a raised, rock-plated neck.
 polygon(ctx,[[57,48+bob],[64,38+bob],[69,29+bob],[79,28+bob],[84,36+bob],[76,51+bob],[68,59+bob]],COLORS.outline,null);
 polygon(ctx,[[59,46+bob],[66,37+bob],[70,30+bob],[78,31+bob],[81,37+bob],[74,50+bob],[67,54+bob]],stone,null);
 polygon(ctx,[[65,40+bob],[72,33+bob],[78,35+bob],[73,45+bob]],light,null);
 for(let spike=0;spike<3;spike++){
  const x=67+spike*5,y=34+bob-spike*3;
  polygon(ctx,[[x-3,y+5],[x,y-5],[x+3,y+5]],spike===1?COLORS.gold:light,null);
 }
 // Dragon head, horns, muzzle, jaw and a bright amber eye.
 const headY=27+bob-(casting?5:0);
 polygon(ctx,[[67,24+headY-27],[71,15+headY-27],[78,19+headY-27],[84,18+headY-27],[89,24+headY-27],[87,33+headY-27],[80,39+headY-27],[70,35+headY-27]],COLORS.outline,null);
 polygon(ctx,[[69,24+headY-27],[73,17+headY-27],[78,21+headY-27],[84,20+headY-27],[87,25+headY-27],[85,32+headY-27],[79,36+headY-27],[71,33+headY-27]],light,null);
 polygon(ctx,[[78,22+headY-27],[85,20+headY-27],[91,25+headY-27],[89,30+headY-27],[81,30+headY-27]],stone,null);
 polygon(ctx,[[81,30+headY-27],[89,30+headY-27],[86,35+headY-27],[78,34+headY-27]],COLORS.dark,null);
 polygon(ctx,[[72,20+headY-27],[67,12+headY-27],[75,17+headY-27]],COLORS.gold,null);
 polygon(ctx,[[79,20+headY-27],[82,12+headY-27],[84,22+headY-27]],light,null);
 oval(ctx,83,25+headY-27,3,2,casting?COLORS.eye:'#e78d43');
 oval(ctx,84,25+headY-27,1,1,COLORS.outline);
 oval(ctx,90,26+headY-27,1,1,COLORS.gold);
 for(let tooth=0;tooth<3;tooth++)polygon(ctx,[[80+tooth*3,30+headY-27],[82+tooth*3,30+headY-27],[81+tooth*3,33+headY-27]],COLORS.claw,null);
 if(casting){
  polygon(ctx,[[82,32+headY-27],[90,31+headY-27],[87,36+headY-27],[80,35+headY-27]],'#d9853f',null);
  oval(ctx,87,33+headY-27,3,2,'#ffd56e');
 }
 // Glowing seams and dust motes make the stone armor feel alive.
 line(ctx,[[35,48+bob],[39,52+bob],[36,56+bob]],'#d0a956',1);
 line(ctx,[[49,46+bob],[46,50+bob],[50,54+bob]],'#d0a956',1);
 line(ctx,[[59,50+bob],[56,54+bob],[59,57+bob]],'#d0a956',1);
 if(casting)for(let mote=0;mote<5;mote++){
  const x=28+mote*11,y=35+((mote*13+frame*7)%29);
  oval(ctx,x,y,2,2,mote%2?COLORS.gold:'#d9c77e');
 }
 if(hurt){
  ctx.globalAlpha=.35;oval(ctx,49,50+bob,34,22,'#fff5cf');
 }
 if(dying)for(let shard=0;shard<7;shard++){
  const x=16+shard*11,y=72+((shard*7+frame*9)%18);
  polygon(ctx,[[x,y],[x+3,y-5],[x+5,y+1]],shard%2?COLORS.gold:light,null);
 }
 ctx.restore();
}

export function createDiaLongBossTextures(scene){
 for(const [state,animation] of Object.entries(ANIMATIONS)){
  for(let frame=0;frame<animation.count;frame++){
   const key=`dia-long-${state}-${frame}`;
   if(scene.textures.exists(key))continue;
   const texture=scene.textures.createCanvas(key,96,96),ctx=texture.context;
   ctx.imageSmoothingEnabled=false;
   drawDragon(ctx,state,frame);
   texture.refresh();
  }
  const key=`dia-long-${state}`;
  if(!scene.anims.exists(key))scene.anims.create({
   key,frames:Array.from({length:animation.count},(_,index)=>({key:`dia-long-${state}-${index}`})),
   frameRate:animation.fps,repeat:animation.repeat
  });
 }
}
