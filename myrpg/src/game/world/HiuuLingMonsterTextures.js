// Small, hard-edged 16px creatures to match the Tiny asset scale.
const palettes={frog:{o:'#254d3e',s:'#3d8254',g:'#79b75a',l:'#c1dc7f',f:'#e9ecc1',e:'#1e2934'},crab:{o:'#673d37',s:'#a14b3a',g:'#d77947',l:'#f4af63',f:'#ffe3a0',e:'#2a2935'},snake:{o:'#264858',s:'#3c7c81',g:'#69b8ad',l:'#a2debf',f:'#d6e8b0',e:'#25323c'}};
export const HIUULING_MONSTER_ART={
 frog:[
 '................','................','...ooo....ooo...','..olllo..olllo..','..ofefo..ofefo..','..ogggoooogggo..','...oggggggggo...','..oglgllglgggo..','.oggggggggggggo.','.ogggfffffggggo.','..oggfffffgggo..','.osogggggggoso..','ogsoogggggoosgo.','olgo.ooooo.oglo.','.oo.........oo..','................'],
 crab:[
 '................','..oo........oo..','.olgo......oglo.','.oggo......oggo.','..oso......oso..','...oso....oso...','....ooooooso....','...ogeggegggo...','..ogggllgggggo..','..ogllllllllgo..','...oggggggggo...','..osooggggooso..','.oso..oooo..oso.','.oo..........oo.','................','................'],
 snake:[
 '................','........oooo....','.......ogllgo...','......oggggggo..','......ogfefego..','.......offffo...','.......ogffo....','.......ogfgo....','..oooo.ogfgo....','.ogllgoogggo....','ogggggggggo.....','oggsooooogo.....','oggo....oggo....','.ogggoooggo.....','..oggggggo......','...oooooo.......']
};
export function createHiuuLingMonsterTextures(scene){
 for(const [kind,rows]of Object.entries(HIUULING_MONSTER_ART)){
  for(let frame=0;frame<4;frame++){
   const key=`hiuuling-${kind}-${frame}`;if(scene.textures.exists(key))continue;
   const t=scene.textures.createCanvas(key,16,16),c=t.context;c.imageSmoothingEnabled=false;
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const color=palettes[kind][rows[y][x]];if(!color)continue;
    let px=x,py=y;
    if(kind==='snake')px+=(y<9?1:-1)*(frame===1?1:frame===3?-1:0);
    else if(kind==='crab'&&y<6)py-=frame%2;
    else if(y>=12)px+=(x<8?1:-1)*(frame===1?1:frame===3?-1:0);
    else if(frame%2)py--;
    if(px>=0&&px<16&&py>=0&&py<16){c.fillStyle=color;c.fillRect(px,py,1,1);}
   }
   t.refresh();
  }
  const key=`hiuuling-${kind}-walk`;if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:4},(_,i)=>({key:`hiuuling-${kind}-${i}`})),frameRate:7,repeat:-1});
 }
}
