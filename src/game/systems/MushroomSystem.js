export class MushroomSystem {
 constructor(scene){
  this.scene=scene;this.state=scene.rpgState;this.alive=true;this.shopOpen=false;this.harvesting=null;this.busy=false;
  this.nodes=[];
  // Vườn trên mảnh đất trống phía Đông Ngoại ô YuNa, tránh đường chính.
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
   const x=(33+col*1.35)*48,y=(12.3+row*1.5)*48,id=`patch-${row*8+col}`;
   const shadow=scene.add.ellipse(x,y-3,33,10,0,0.17).setDepth(99+y);
   const sprite=scene.add.image(x,y,'town',29).setOrigin(.5,1).setScale(3).setDepth(100+y);
   this.nodes.push({id,x,y,sprite,shadow});
  }
  this.progress=scene.add.graphics().setDepth(9999);
  this.root=document.createElement('section');this.root.className='mushroom-modal';this.root.hidden=true;
  this.root.innerHTML=`<div class="mushroom-card" role="dialog" aria-modal="true" aria-labelledby="mushroom-title"><header><h2 id="mushroom-title">Người hái nấm Nami</h2><button data-close aria-label="Đóng">×</button></header><p>Mang rổ vào vườn và nhấn E để hái nấm.</p><p data-count></p><article><span class="mushroom-art"><svg viewBox="0 0 48 48"><path d="M12 22C12 2 36 2 36 22" fill="none" stroke="#efd39a" stroke-width="4"/><path d="M5 20h38l-5 23H10z" fill="#b5814c" stroke="#f1d09b" stroke-width="2"/><path d="M8 28h32M10 36h28M17 21v21M25 21v21M33 21v21" stroke="#745133" stroke-width="2"/></svg></span><div><b>Rổ hái nấm</b><p>Dùng lâu dài · 200 vàng</p></div><button data-buy>Mua rổ</button></article><article><span class="mushroom-art"><svg viewBox="0 0 48 48"><path d="M12 8h24l9 14-21 23L3 22z" fill="#80c7e7" stroke="#fff0bc" stroke-width="2"/><path d="M3 22h42M12 8l12 37L36 8M12 8l12 14L36 8" fill="none" stroke="#e6faff" stroke-width="2"/></svg></span><div><b>Đá cường hóa trang bị</b><p>20 Nấm YuNa → 1 đá</p></div><button data-exchange>Đổi 20 nấm</button></article><p data-message role="status"></p><small>Nấm và đá nằm trong túi đồ B. Mỗi cụm nấm mọc lại sau 30 giây.</small></div>`;
  document.body.append(this.root);
  if(!document.getElementById('mushroom-css')){const link=document.createElement('link');link.id='mushroom-css';link.rel='stylesheet';link.href='/assets/style/mushroom.css';document.head.append(link);}
  this.root.addEventListener('pointerdown',e=>e.stopPropagation());
  this.root.addEventListener('click',e=>{if(e.target.closest('[data-close]'))this.closeShop();else if(e.target.closest('[data-buy]'))void this.buy();else if(e.target.closest('[data-exchange]')&&!this.busy){this.message(this.state.exchangeMushrooms().message);this.render();}});
  this.key=e=>{if(!this.alive)return;if(this.shopOpen){if(e.code==='Escape'){e.preventDefault();this.closeShop();}else if(e.code==='Tab'){const buttons=[...this.root.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}if(!['Enter','Space'].includes(e.code))e.stopImmediatePropagation();}else if(e.code==='Escape')this.cancel();};
  window.addEventListener('keydown',this.key,true);
  this.tick=()=>this.update();scene.events.on('postupdate',this.tick);
  scene.events.once('shutdown',()=>this.destroy());this.update();
 }
 get blocked(){return this.shopOpen||!!this.harvesting;}
 near(){const p=this.scene.player;if(!p)return null;let result=null,range=72;for(const n of this.nodes){if((this.state.data.mushroomHarvest[n.id]||0)>Date.now())continue;const d=Math.hypot(p.x-n.x,p.feetY-n.y);if(d<range){result=n;range=d;}}return result;}
 start(){if(this.blocked||this.scene.hud?.blocked||this.state.data.hp<=0)return;const n=this.near();if(!n)return;if(!this.state.data.inventory.mushroom_basket){this.scene.hud.toast('Mua rổ hái nấm từ Nami trước (200 vàng).');return;}const error=this.state.canAdd('yuna_mushroom');if(error){this.scene.hud.toast(error);return;}this.scene.player.stop();this.harvesting={node:n,start:performance.now()};}
 cancel(){this.harvesting=null;this.progress.clear();}
 update(){
  if(!this.alive)return;
  for(const n of this.nodes){const ready=(this.state.data.mushroomHarvest[n.id]||0)<=Date.now();n.sprite.setVisible(ready);n.shadow.setVisible(ready);}
  const h=this.harvesting;if(!h)return;
  const p=this.scene.player;if(!p||this.state.data.hp<=0||this.scene.hud?.blocked||this.scene.dialogue?.isOpen||Math.hypot(p.x-h.node.x,p.feetY-h.node.y)>80){this.cancel();return;}
  const t=Math.min(1,(performance.now()-h.start)/2000),x=p.x-40,y=p.feetY-80;
  this.progress.clear().fillStyle(0x182e25,.95).fillRoundedRect(x-3,y-3,86,14,5).fillStyle(0xd7bd79).fillRoundedRect(x,y,80*t,8,3);
  if(t>=1){const result=this.state.harvestMushroom(h.node.id);this.cancel();this.scene.hud.toast(result.message);}
 }
 openShop(){this.cancel();this.shopOpen=true;this.scene.player.stop();this.root.hidden=false;this.message('');this.render();this.root.querySelector('[data-close]').focus();}
 closeShop(){this.shopOpen=false;this.root.hidden=true;this.scene.input.keyboard.resetKeys();}
 message(text){this.root.querySelector('[data-message]').textContent=text;}
 render(){const d=this.state.data;this.root.querySelector('[data-count]').textContent=`Vàng: ${d.gold.toLocaleString('vi-VN')} · Nấm: ${d.inventory.yuna_mushroom||0}/20 · Đá: ${d.inventory.upgrade_stone||0}`;const buy=this.root.querySelector('[data-buy]');buy.disabled=this.busy||!!d.inventory.mushroom_basket;buy.textContent=d.inventory.mushroom_basket?'Đã có rổ':d.pendingPurchase?'Thử nhận lại':'Mua rổ';this.root.querySelector('[data-exchange]').disabled=this.busy||(d.inventory.yuna_mushroom||0)<20;}
 async buy(){if(this.busy||this.state.data.inventory.mushroom_basket)return;this.busy=true;this.render();try{const result=await this.state.buyItem('mushroom_basket');if(this.alive)this.message(result.message);}finally{this.busy=false;if(this.alive)this.render();}}
 destroy(){this.alive=false;this.harvesting=null;this.shopOpen=false;window.removeEventListener('keydown',this.key,true);this.scene.events.off('postupdate',this.tick);this.root.remove();this.progress.destroy();if(this.scene.mushroomSystem===this)this.scene.mushroomSystem=null;}
}
