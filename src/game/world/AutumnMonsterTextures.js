// Original Tiny-style 16px creatures, drawn with a small hard-edged palette.
const PALETTES={
 squirrel:{o:'#54352d',s:'#98542f',g:'#d98a3e',l:'#f3bd65',f:'#ffe0a0',e:'#262331'},
 hedgehog:{o:'#49382c',s:'#876334',g:'#bfa04b',l:'#e8ca66',f:'#f2d6a2',e:'#242733'}
};
export const AUTUMN_MONSTER_ART={
 squirrel:[
 '................','..oooo..........','.ogllgo....o.o..','ogllgggo..ogogo.','oglgsggo..oggggo','oggsoggo..ofegfo','oggsoggo...offfo','.oggggo...ogffo.','..oggo...oggggo.','...ogooooogfggo.','....ogggggfgggo.','....ogllgggggo..','.....oggggggo...','.....ofgoofgo...','.....oooo.ooo...','................'],
 hedgehog:[
 '................','................','................','....o..o..o.....','...ogooloogoo...','..ogllgllgllgo..','.oogsgsgsgsgggo.','.oggglgglgggggo.','oogsggsggsggggo.','ogggggggggggffo.','ogsgsgsggggfeffo','.ogggggggggffffo','..ogggggggggffo.','...ofo.oo.ofo...','...ooo....ooo...','................']
};
export function createAutumnMonsterTextures(scene){
 for(const [kind,rows] of Object.entries(AUTUMN_MONSTER_ART)){
  for(let frame=0;frame<4;frame++){
   const key=`autumn-${kind}-${frame}`;if(scene.textures.exists(key))continue;
   const texture=scene.textures.createCanvas(key,16,16),ctx=texture.context;ctx.imageSmoothingEnabled=false;
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const color=PALETTES[kind][rows[y][x]];if(!color)continue;
    let px=x,py=y;
    if(y>=13)px+=(x<8?1:-1)*(frame===1?1:frame===3?-1:0);
    else if(kind==='squirrel'&&x<7&&y<10)py+=frame%2===1?-1:0;
    else if(frame===1||frame===3)py--;
    if(px>=0&&px<16&&py>=0&&py<16){ctx.fillStyle=color;ctx.fillRect(px,py,1,1);}
   }
   texture.refresh();
  }
  const key=`autumn-${kind}-walk`;
  if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:4},(_,i)=>({key:`autumn-${kind}-${i}`})),frameRate:6,repeat:-1});
 }
}
