// Original 16px sprites, limited palettes and hard pixel edges to match Tiny Town.
const PALETTES={
 monkey:{o:'#473226',s:'#93602f',g:'#daaa43',l:'#f5d06c',f:'#ffe0a0',e:'#231f2c',w:'#fff4d1'},
 dog:{o:'#492630',s:'#8d3440',g:'#d95646',l:'#f17c58',f:'#edb17a',e:'#241f2c',w:'#fff0cf'},
 bird:{o:'#25394c',s:'#315e9d',g:'#459fd8',l:'#84d4ef',f:'#b7e9ee',e:'#1b2639',w:'#fff3cf',b:'#e2b55b'}
};
const SPRITES={
 monkey:[
 '................','................','.....oo..oo.....','....oglooglo....','....oggggggo....','...ogfffffggo...','...ofefeffffo...','....offfffo.....','.....oooo...oo..','....oglggo.oglo.','...ogglgggoolgo.','...ogflgggoggo..','....ofgggoo.....','....ogggggo.....','....of..ofo.....','....oo..ooo.....'],
 dog:[
 '................','................','..........oo....','.........oggo...','.........ogfgo..','..oo.....ogegoo.','..ogooooooggffo.','...ogggggggfffo.','...ogllgggggfo..','..oggggggggoo...','..oggggggggo....','...oggggggo.....','...oggo.oggo....','...ofgo.ogfo....','...ooo..oooo....','................'],
 bird:[
 '................','.......oo.......','......oggo......','.....olgggo.....','.....ofeggoo....','.....offgggbbo..','....ogffgggbo...','...ogglffggo....','..ogggglfggo....','.ogsggglfgo.....','..oosggggo......','...oosggo.......','....oogo........','.....obo........','....obobo.......','................']
};
export const DIA_LONG_MONSTER_ART=SPRITES;
export function createDiaLongMonsterTextures(scene){
 for(const [kind,pixels] of Object.entries(SPRITES)){
  const animation=`dia-long-${kind}-walk`;
  for(let frame=0;frame<4;frame++){
   const key=`dia-long-${kind}-${frame}`;if(scene.textures.exists(key))continue;
   const texture=scene.textures.createCanvas(key,16,16),ctx=texture.context;ctx.imageSmoothingEnabled=false;
   const bob=frame%2===1?-1:0;
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const col=PALETTES[kind][pixels[y][x]];if(!col)continue;
    let px=x,py=y;
    if(kind==='bird'&&x<6&&y>=7&&y<=11){py+=frame===1?-2:frame===3?1:0;}
    else if(y>=13&&kind!=='bird'){px+=(x<7?1:-1)*(frame===1?1:frame===3?-1:0);}
    else if(y<13)py+=bob;
    if(px>=0&&px<16&&py>=0&&py<16){ctx.fillStyle=col;ctx.fillRect(px,py,1,1);}
   }
   texture.refresh();
  }
  if(!scene.anims.exists(animation))scene.anims.create({key:animation,frames:Array.from({length:4},(_,i)=>({key:`dia-long-${kind}-${i}`})),frameRate:kind==='bird'?9:6,repeat:-1});
 }
}
