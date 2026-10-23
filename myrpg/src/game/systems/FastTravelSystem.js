import { FAST_TRAVEL_STOPS, FAST_TRAVEL_ROUTES } from '../data/fastTravel.js';
export class FastTravelSystem {
 constructor(scene){
  this.scene=scene;this.isOpen=false;this.traveling=false;this.alive=true;
  this.root=document.createElement('dialog');this.root.className='rpg-fast-travel';
  this.root.setAttribute('aria-labelledby','fast-travel-title');
  this.root.innerHTML='<header><div><small>TRẠM DỊCH CHUYỂN</small><h2 id="fast-travel-title">Mã Phu</h2></div><button type="button" data-close aria-label="Đóng">×</button></header><p>Chọn nơi muốn đến. Chuyến đi hoàn toàn miễn phí.</p><div data-stops></div><p data-message role="status"></p><footer>Esc để đóng · Không tiêu hao vàng</footer>';
  document.body.append(this.root);
  if(!document.getElementById('fast-travel-css')){const css=document.createElement('link');css.id='fast-travel-css';css.rel='stylesheet';css.href=`${import.meta.env?.BASE_URL??'/'}assets/style/fastTravel.css`;document.head.append(css);}
  this.root.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  this.root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))this.close();else if(b.dataset.destination)this.go(b.dataset.destination);});
  this.root.addEventListener('pointerdown',e=>e.stopPropagation());
  this.key=e=>{
   if(!this.isOpen)return;
   if(e.code==='Escape'){e.preventDefault();this.close();}
   if(!['Tab','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
  };
  window.addEventListener('keydown',this.key,true);
  scene.events.once('shutdown',()=>this.destroy());
 }
 open(npc){
  if(!this.alive||this.traveling||this.scene.rpgState.data.hp<=0)return;
  this.npc=npc;this.isOpen=true;this.scene.player.stop();this.scene.input.keyboard.resetKeys();
  const list=this.root.querySelector('[data-stops]');list.replaceChildren();
  for(const id of FAST_TRAVEL_ROUTES[this.scene.mapData.id]??[]){
   const stop=FAST_TRAVEL_STOPS[id];if(!stop)continue;
   const b=document.createElement('button');b.type='button';b.dataset.destination=id;b.className='travel-destination';
   const title=document.createElement('strong'),hint=document.createElement('span'),arrow=document.createElement('b');title.textContent=stop.label;hint.textContent='Dịch chuyển ngay · Miễn phí';arrow.textContent='→';b.append(title,hint,arrow);list.append(b);
  }
  this.root.querySelector('[data-message]').textContent=list.children.length?'':'Chưa có tuyến dịch chuyển tại đây.';
  if(!this.root.open)this.root.showModal();
  (list.querySelector('button')??this.root.querySelector('[data-close]')).focus();
 }
 go(id){
  if(!this.isOpen||this.traveling||!this.alive)return;
  const s=this.scene,stop=FAST_TRAVEL_STOPS[id];
  if(!(FAST_TRAVEL_ROUTES[s.mapData.id]??[]).includes(id)||!stop)return;
  if(s.rpgState.data.hp<=0||s.dialogue.nearest()!==this.npc){this.close();return;}
  this.traveling=true;s.player.stop();this.close();
  s.scene.start(stop.scene,{spawn:{...stop.spawn}});
 }
 close(){this.isOpen=false;if(this.root.open)this.root.close();this.scene.input?.keyboard?.resetKeys();}
 destroy(){if(!this.alive)return;this.alive=false;this.close();window.removeEventListener('keydown',this.key,true);this.root.remove();if(this.scene.fastTravel===this)this.scene.fastTravel=null;}
}
