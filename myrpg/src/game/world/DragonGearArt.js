const colors=['#b9c5c9','#91c5e5','#bb9cde','#dea572','#e3ca78'];
const shapes={
 dragon_sword:[
  {d:'M10 1H14V5L9 10L7 8Z'},
  {d:'M9 3H12L8 8L7 7Z',fill:'#eff3db'},
  {d:'M5 8L8 11L6 13L3 10Z'},
  {d:'M2 12L4 14L2 16L0 14Z',fill:'#a96f43'}
 ],
 dragon_staff:[
  {d:'M8 5L13 1L15 3L11 8Z'},
  {d:'M9 6L14 2L15 3L10 8Z',fill:'#eff0de'},
  {d:'M7 7L9 9L4 15L2 13Z'},
  {d:'M11 3A2 2 0 1 1 15 3A2 2 0 1 1 11 3',fill:'#8f9ff0'}
 ],
 dragon_axe:[
  {d:'M7 7L11 2L15 4L13 8L10 9Z'},
  {d:'M11 3L14 4L12 7L10 7Z',fill:'#eff0de'},
  {d:'M8 8L10 10L4 16L2 14Z'},
  {d:'M6 10L8 12L5 15L3 13Z',fill:'#a96f43'}
 ],
 dragon_shield:[
  {d:'M2 2H14V8L12 12L8 15L4 12L2 8Z'},
  {d:'M4 4H12V8L11 11L8 13L5 11L4 8Z',fill:'#496d7c'},
  {d:'M7 3H9V12H7ZM3 7H13V9H3Z',fill:'#e1cf8c'}
 ]
};

const baseColor=level=>colors[Math.max(0,Math.min(colors.length-1,level-1))];

export function dragonGearIcon(id,level=6,size=40){
 const artwork=shapes[id];
 if(!artwork)return '';
 const base=baseColor(level);
 const paths=artwork.map(({d,fill})=>`<path d="${d}"${fill?` fill="${fill}"`:''}/>`).join('');
 return `<svg aria-hidden="true" class="rpg-gear-icon" width="${size}" height="${size}" viewBox="0 0 16 16" style="image-rendering:pixelated;flex-shrink:0" shape-rendering="crispEdges"><g fill="${base}" stroke="#243b3c" stroke-width=".5">${paths}</g></svg>`;
}

export function dragonGearTexture(scene,id,level=6){
 const key=`dragon-gear-${id}-${level}`;
 if(scene.textures.exists(key))return key;
 const artwork=shapes[id];
 if(!artwork)throw new Error(`Không có hình trang bị Địa Long: ${id}`);
 const texture=scene.textures.createCanvas(key,16,16),context=texture.context;
 context.imageSmoothingEnabled=false;
 for(const {d,fill} of artwork){
  const path=new Path2D(d);
  context.fillStyle=fill||baseColor(level);
  context.fill(path);
  context.strokeStyle='#243b3c';
  context.lineWidth=.5;
  context.stroke(path);
 }
 texture.refresh();
 return key;
}
