// Original hard-edged pixel art. Integer coordinates keep the Tiny palette crisp.
export const GUARDIAN_ANIMATIONS={idle:{count:4,fps:5,repeat:-1},walk:{count:6,fps:8,repeat:-1},cast:{count:4,fps:7,repeat:-1},hurt:{count:2,fps:10,repeat:0},death:{count:6,fps:8,repeat:0}};
const colors={outline:'#302e30',bark:'#614638',dark:'#433d37',wood:'#99704a',light:'#c39960',stone:'#767b6b',stoneLight:'#abb091',leaf:'#c68d3a',gold:'#efbf57',cream:'#ffe39b',core:'#8de1ac',coreDark:'#3c8a6b'};
export function createForestGuardianTextures(scene){
 for(const [state,anim] of Object.entries(GUARDIAN_ANIMATIONS)){
  for(let frame=0;frame<anim.count;frame++){
   const key=`guardian-${state}-${frame}`;if(scene.textures.exists(key))continue;
   const t=scene.textures.createCanvas(key,48,48),c=t.context;c.imageSmoothingEnabled=false;
   const dying=state==='death',fall=dying?frame*2:0,bob=dying?0:frame%2;
   const rect=(x,y,w,h,color)=>{c.fillStyle=colors[color]??color;c.fillRect(x,y,w,h);};
   const part=(x,y,w,h,color)=>rect(x,y+fall,w,h,color);
   if(dying)c.globalAlpha=1-frame*.13;
   // Root feet and independently stepping legs.
   for(const side of [-1,1]){
    const x=side<0?15:27,step=state==='walk'?Math.round(Math.sin(frame*Math.PI/3)*2)*side:0;
    part(x,34+step,7,9,'outline');part(x+1,34+step,5,8,'bark');part(x+2,35+step,2,6,'wood');
    part(x-3,42+step,12,3,'outline');part(x-2,42+step,9,2,'wood');
   }
   part(13,18-bob,23,19,'outline');part(15,18-bob,19,17,'bark');
   part(17,20-bob,4,14,'wood');part(29,21-bob,3,12,'wood');part(18,32-bob,13,3,'dark');
   // Stone shoulder armour, branches and leaf crown.
   for(const side of [-1,1]){
    const x=side<0?6:34,lift=state==='cast'?-5:state==='walk'?bob*side:0;
    part(x,22+lift-bob,8,14,'outline');part(x+1,24+lift-bob,6,10,'bark');part(x+2,25+lift-bob,2,7,'wood');
    part(x-1,18+lift-bob,10,9,'outline');part(x,18+lift-bob,8,7,'stone');part(x+1,19+lift-bob,6,2,'stoneLight');
    part(x,34+lift-bob,8,4,'outline');part(x+1,34+lift-bob,6,3,'wood');
    part(side<0?13:32,6-bob,3,13,'outline');part(side<0?10:35,4-bob,3,6,'outline');
    part(side<0?14:32,7-bob,1,10,'wood');part(side<0?8:37,3-bob,6,3,'leaf');
   }
   part(16,10-bob,16,13,'outline');part(18,11-bob,12,10,'wood');part(19,12-bob,10,3,'light');
   part(19,16-bob,4,3,'dark');part(26,16-bob,4,3,'dark');part(20,16-bob,2,2,'cream');part(27,16-bob,2,2,'cream');
   part(23,19-bob,3,2,'dark');
   for(const [x,y,w,h] of [[11,8,9,5],[17,5,10,6],[25,7,12,5],[15,11,5,4],[30,11,6,4]]){
    part(x,y-bob,w,h,'outline');part(x+1,y-bob,w-2,h-1,'leaf');part(x+2,y-bob,w-4,2,'gold');
   }
   // Faceted living emerald in the trunk; pulses while channeling.
   part(21,23-bob,8,9,'dark');part(22,24-bob,6,7,'coreDark');part(23,24-bob,4,6,'core');part(24,25-bob,2,3,'cream');
   if(state==='cast'){part(20-frame%2,26-bob,2,2,'cream');part(30+frame%2,23-bob,2,2,'gold');}
   if(state==='hurt'){c.globalAlpha=.35;rect(13,16,23,20,'#fff2ca');c.globalAlpha=1;}
   if(dying){c.globalAlpha=1;for(let i=0;i<5;i++)rect(9+i*7,35+(i+frame)%8,2,2,'gold');}
   t.refresh();
  }
  const key=`guardian-${state}`;
  if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:anim.count},(_,i)=>({key:`guardian-${state}-${i}`})),frameRate:anim.fps,repeat:anim.repeat});
 }
 createGuardianCaveTexture(scene);
}
export function createGuardianCaveTexture(scene){
 if(scene.textures.exists('guardian-cave-mouth'))return;
 const t=scene.textures.createCanvas('guardian-cave-mouth',80,56),c=t.context;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 // Mossy stepped rock arch, with an open dark corridor in its middle.
 r(5,20,70,34,'#303a36');r(11,11,58,38,'#303a36');r(20,5,40,43,'#303a36');r(28,1,24,10,'#303a36');
 r(8,21,64,29,'#626f60');r(14,13,52,32,'#626f60');r(22,7,36,34,'#626f60');r(29,3,22,9,'#7c856a');
 r(12,23,10,27,'#8e9677');r(58,23,10,27,'#8e9677');r(17,15,46,6,'#9aa080');r(24,9,31,5,'#a8ad87');
 r(24,23,32,30,'#172522');r(29,17,22,7,'#172522');r(29,25,22,27,'#0c1918');r(34,27,12,25,'#081313');
 r(22,50,36,5,'#a58555');r(28,51,24,4,'#c59d63');
 for(const [x,y] of [[12,20],[60,18],[23,8],[42,6],[7,34],[65,34]]){r(x,y,7,3,'#657b49');r(x+2,y-2,4,3,'#c49b44');r(x+3,y-3,2,2,'#f1c766');}
 r(17,30,3,7,'#454f45');r(60,39,5,2,'#454f45');r(25,12,2,4,'#69755d');
 r(23,32,2,5,'#cfad59');r(55,32,2,5,'#cfad59');
 t.refresh();
}
