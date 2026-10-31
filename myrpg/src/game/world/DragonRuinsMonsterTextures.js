const PALETTES={
 guard:{o:'#292c36',s:'#65645a',g:'#a79d72',l:'#d4c38d',f:'#ead9a5',e:'#201e2b',r:'#bd7650'},
 wyrm:{o:'#203b38',s:'#34715e',g:'#62a881',l:'#a5d19b',f:'#d4e5ac',e:'#1e2732',r:'#cfaa58'},
 raptor:{o:'#263344',s:'#456b79',g:'#65a6a2',l:'#a1d1bb',f:'#d3e4c1',e:'#202438',r:'#d9b469'}
};

const SPRITES={
 guard:[
  '................','......oo........','.....oggo.......','......ofo..oo...','.....ofefoogfo..','......offfgggo..',
  '.....oggggggo...','.....ogrlrgo....','.....ogggggo....','......oggoo......',
  '.....og..go......','.....og..go......','....og....go.....','....og....go.....',
  '....oo....oo.....','................'
 ],
 wyrm:[
  '................','................','...........oo...','..........oggo..','.........ogffgo.','........ogggggo.',
  '.......oggrgggo.','......oggggggo..','.....oggggggo...','....oggggooo....',
  '...oggggo.......','..oggggo........','.oggggo.........','oggggo..........',
  'oggo............','................'
 ],
 raptor:[
  '................','.......oo.......','......oggo......','.....ogffgo.....','....oggggggo....','...ogggggggo....',
  '..ogggglggggo...','.oggggllgggggo..','..ogggggggggo...','...ogggggggo....',
  '....ogggggo......','.....oggo........','.....og..go......','....og....go.....',
  '....oo....oo.....','................'
 ]
};

export function createDragonRuinsMonsterTextures(scene){
 for(const [kind,pixels] of Object.entries(SPRITES)){
  const animation=`ruins-${kind}-walk`;
  for(let frame=0;frame<4;frame++){
   const key=`ruins-${kind}-${frame}`;
   if(scene.textures.exists(key))continue;
   const texture=scene.textures.createCanvas(key,16,16),ctx=texture.context;
   ctx.imageSmoothingEnabled=false;
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const color=PALETTES[kind][pixels[y][x]];
    if(!color)continue;
    let px=x,py=y;
    if(y<12&&frame%2)py--;
    if(y>=12&&kind!=='wyrm')px+=(x<8?1:-1)*(frame===1?1:frame===3?-1:0);
    if(kind==='wyrm'&&x<6&&frame%2)py--;
    if(px>=0&&px<16&&py>=0&&py<16){ctx.fillStyle=color;ctx.fillRect(px,py,1,1);}
   }
   texture.refresh();
  }
  if(!scene.anims.exists(animation))scene.anims.create({
   key:animation,frames:Array.from({length:4},(_,i)=>({key:`ruins-${kind}-${i}`})),
   frameRate:kind==='raptor'?8:6,repeat:-1
  });
 }
}
