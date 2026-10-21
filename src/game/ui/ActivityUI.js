import { DailySystem } from '../systems/DailySystem.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABS=[['daily','▦','Điểm danh'],['gifts','♢','Quà chờ'],['settings','⚙','Cài đặt'],['guide','?','Hướng dẫn']];
const ITEMS={upgrade_stone:['✦','Đá cường hóa'],wing_stone_1:['◈','Đá cánh cấp 1'],wing_stone_2:['◈','Đá cánh cấp 2'],wing_stone_3:['◈','Đá cánh cấp 3'],food_perch_soup:['🍲','Canh cá rô'],food_carp_stew:['🍛','Cá chép hầm'],food_catfish_stew:['🥘','Cá trê tiềm']};
const defaults={damageNumbers:true,monsterNames:true,reducedMotion:false};
const rewardsMarkup=reward=>[
 ...(reward.gold?[`<li><b class="ga-gold">●</b><span>${reward.gold.toLocaleString('vi-VN')} vàng</span></li>`]:[]),
 ...(reward.gems?[`<li><b class="ga-gem">◆</b><span>${reward.gems} đá quý</span></li>`]:[]),
 ...Object.entries(reward.items||{}).map(([id,n])=>`<li><b class="ga-item-${id}">${ITEMS[id]?.[0]||'✦'}</b><span>${escape(ITEMS[id]?.[1]||id)} <strong>×${n}</strong></span></li>`)
].join('');
export class ActivityUI {
 constructor(scene){
  this.scene=scene;this.alive=true;this.isOpen=false;this.tab='daily';this.message='';this.settingsKey=`tiny-rpg-settings:${scene.rpgState.data.characterId}`;
  try{const stored=JSON.parse(localStorage.getItem(this.settingsKey)||'{}');this.settings=Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,typeof stored[k]==='boolean'?stored[k]:v]));}catch{this.settings={...defaults};}
  if(!document.getElementById('rpg-activities-css')){const link=document.createElement('link');link.id='rpg-activities-css';link.rel='stylesheet';link.href='/assets/style/activities.css?v=1';document.head.append(link);}
  this.toolbar=document.createElement('nav');this.toolbar.className='ga-toolbar';this.toolbar.setAttribute('aria-label','Tiện ích trò chơi');
  this.toolbar.innerHTML=TABS.map(([id,symbol,name])=>`<button type="button" data-open="${id}" aria-label="${name}"><span aria-hidden="true">${symbol}</span><small>${name}</small><i data-dot="${id}" hidden></i></button>`).join('');
  this.root=document.createElement('dialog');this.root.className='ga-dialog';this.root.setAttribute('aria-labelledby','ga-title');
  this.root.innerHTML='<header class="ga-header"><div><small>HÀNH TRÌNH PHIÊU LƯU</small><h2 id="ga-title">Điểm danh 7 ngày</h2></div><button type="button" data-close aria-label="Đóng">×</button></header><nav class="ga-tabs" aria-label="Chọn tiện ích"></nav><div class="ga-content"></div><p class="ga-message" role="status"></p><footer>Esc để đóng · Di chuyển và chiến đấu tạm dừng khi mở bảng</footer>';
  this.root.querySelector('.ga-tabs').innerHTML=TABS.map(([id,symbol,name])=>`<button type="button" data-tab="${id}">${symbol} ${name}</button>`).join('');
  document.body.append(this.toolbar,this.root);
  this.toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)this.open(b.dataset.open);});
  this.root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))this.close();else if(b.dataset.tab){this.tab=b.dataset.tab;this.message='';this.render();}else if(b.dataset.action)void this.act(b);});
  this.root.addEventListener('change',e=>{
   const key=e.target.dataset.setting;if(!Object.hasOwn(defaults,key))return;
   this.settings[key]=e.target.checked;
   try{localStorage.setItem(this.settingsKey,JSON.stringify(this.settings));this.message='Đã lưu cài đặt cho nhân vật này.';}catch{this.message='Cài đặt đã áp dụng, nhưng trình duyệt chưa lưu được.';}
   this.applySettings();this.renderMessage();
  });
  this.root.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  this.root.addEventListener('pointerdown',e=>e.stopPropagation());
  this.key=e=>{
   if(!this.isOpen)return;
   if(e.code==='Escape'){e.preventDefault();this.close();}
   if(!['Tab','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
  };
  window.addEventListener('keydown',this.key,true);
  this.tick=()=>this.applySettings();scene.events.on('postupdate',this.tick);
  this.daily=new DailySystem(scene);this.daily.onChange=()=>{if(this.alive)this.render();};
  this.timer=setInterval(()=>{
   if(!this.alive)return;this.updateToolbar();this.updateClock();
   if(this.daily.view&&Date.now()+(this.daily.clockOffset||0)>=this.daily.serverResetAt&&performance.now()-(this.daily.lastResetCheck||0)>30000){this.daily.lastResetCheck=performance.now();void this.daily.load();}
  },1000);
  this.visible=()=>{if(!document.hidden)void this.daily.load(true);};document.addEventListener('visibilitychange',this.visible);
  scene.events.once('shutdown',()=>this.destroy());this.updateToolbar();this.applySettings();
 }
 open(tab){
  const s=this.scene,f=s.fishingSystem;
  if(s.dialogue?.isOpen||s.fastTravel?.isOpen||s.mushroomSystem?.blocked||f?.basketOpen||(f?.phase&&f.phase!=='idle')||s.combat?.uiBlocked||s.rpgState.data.hp<=0){s.hud?.toast('Hãy kết thúc thao tác hiện tại trước khi mở tiện ích.');return;}
  s.hud?.close();this.tab=tab;this.isOpen=true;this.message='';s.player.stop();s.input.keyboard.resetKeys();
  this.render();if(!this.root.open)this.root.showModal();this.root.querySelector('[data-close]').focus();
  if(!this.daily.view||performance.now()-this.daily.syncedAt>30000)void this.daily.load(true);
 }
 close(){this.isOpen=false;if(this.root.open)this.root.close();this.scene.input?.keyboard?.resetKeys();this.toolbar.querySelector(`[data-open="${this.tab}"]`)?.focus();}
 async act(button){
  this.message='';
  try{
   if(button.dataset.action==='refresh'){await this.daily.load(true);return;}
   if(button.dataset.action==='claim'){
    const result=await this.daily.claim();
    if(result?.sourceId&&this.daily.view.boxes.some(b=>b.sourceId===result.sourceId)){
     this.message='Đã điểm danh! Vàng và đá quý đã được cộng.';
     try{await this.daily.collect(result.sourceId);this.message='Đã nhận đầy đủ quà điểm danh hôm nay.';}
     catch(e){this.message='Đã điểm danh. '+e.message;}
    }else this.message='Hôm nay bạn đã điểm danh rồi.';
   }
   if(button.dataset.action==='collect'){await this.daily.collect(button.dataset.source);this.message='Đã nhận quà. Đá cánh nằm trong bảng Cánh; đá cường hóa đã chuyển vào túi hoặc phần đá chờ trong B.';}
  }catch(e){this.message=e.message;}
  this.render();
 }
 updateToolbar(){
  const view=this.daily?.view;
  this.toolbar.querySelector('[data-dot="daily"]').hidden=!view?.canClaim;
  const dot=this.toolbar.querySelector('[data-dot="gifts"]');dot.hidden=!view?.boxes.length;dot.textContent=view?.boxes.length||'';
 }
 applySettings(){
  for(const entity of this.scene.monsters||[])entity.label?.setVisible(this.settings.monsterNames&&entity.sprite.visible);
  if(this.scene.combat?.vfx)this.scene.combat.vfx.reduced=this.settings.reducedMotion||(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 }
 renderMessage(){this.root.querySelector('.ga-message').textContent=this.message||this.daily.error||'';}
 updateClock(){
  const node=this.root.querySelector('[data-countdown]');if(!node||!this.daily.view)return;
  const seconds=Math.max(0,Math.ceil((this.daily.serverResetAt-Date.now()-(this.daily.clockOffset||0))/1000));
  node.textContent=`${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 }
 render(){
  this.updateToolbar();if(!this.isOpen)return;
  const titles={daily:'Điểm danh 7 ngày',gifts:'Quà chờ & nhật ký',settings:'Cài đặt trò chơi',guide:'Sổ tay tân thủ'};
  this.root.querySelector('h2').textContent=titles[this.tab];
  for(const b of this.root.querySelectorAll('[data-tab]'))b.setAttribute('aria-current',String(b.dataset.tab===this.tab));
  const content=this.root.querySelector('.ga-content'),view=this.daily.view;
  if(this.tab==='daily')content.innerHTML=view?this.renderDaily(view):'<div class="ga-empty"><b>Đang kết nối bảng điểm danh…</b><p>Quà được quản lý theo nhân vật trên máy chủ.</p><button type="button" data-action="refresh">Thử kết nối lại</button></div>';
  if(this.tab==='gifts')content.innerHTML=view?this.renderGifts(view):'<div class="ga-empty">Chưa tải được quà. <button type="button" data-action="refresh">Thử lại</button></div>';
  if(this.tab==='settings')content.innerHTML=`<p class="ga-intro">Tùy chỉnh hiển thị, lưu riêng cho nhân vật trên trình duyệt này.</p><div class="ga-settings">${[
   ['damageNumbers','Hiện số sát thương / hồi phục','Hiển thị lượng HP thay đổi phía trên nhân vật và quái.'],
   ['monsterNames','Hiện tên quái thường','Bật hoặc ẩn nhãn tên phía trên các quái trong map.'],
   ['reducedMotion','Giảm chuyển động hiệu ứng','Giảm chuyển động của hiệu ứng hỗ trợ; vùng cảnh báo kỹ năng boss vẫn được giữ.']
  ].map(([id,label,hint])=>`<label><span><strong>${label}</strong><small>${hint}</small></span><input type="checkbox" data-setting="${id}" ${this.settings[id]?'checked':''}></label>`).join('')}</div>`;
  if(this.tab==='guide')content.innerHTML=this.renderGuide();
  this.renderMessage();this.updateClock();
 }
 renderDaily(v){
  const busy=this.daily.busy||!!this.scene.rpgState.data.pendingDailyAction;
  return `<div class="ga-summary"><div><span class="ga-kicker">VÒNG ${v.cycle} · ${v.progress}/7 MỐC</span><h3>Mỗi ngày một phần quà</h3><p>Không cần liên tục. Nghỉ ngày vẫn giữ tiến độ.</p></div><div class="ga-reset">Đổi ngày lúc 00:00 Việt Nam<strong data-countdown></strong></div></div><div class="ga-days">${v.rewards.map(r=>{
   const claimed=r.day<=v.progress,current=v.canClaim&&r.day===v.nextDay;
   return `<article class="ga-day ${claimed?'is-claimed':''} ${current?'is-current':''} ${r.day===7?'is-grand':''}"><header><span>NGÀY ${r.day}</span><b>${claimed?'✓':r.day===7?'✦':current?'★':'◇'}</b></header><ul>${rewardsMarkup(r)}</ul><div class="ga-day-state">${claimed?'Đã nhận':current?'Hôm nay':'Sắp tới'}</div></article>`;
  }).join('')}</div><div class="ga-daily-footer"><p>Vàng, đá quý cộng ngay. Vật phẩm chưa nhận được sẽ giữ trong Quà chờ.</p><button type="button" class="ga-primary" data-action="${busy?'refresh':'claim'}" ${(!v.canClaim||this.daily.busy)?'disabled':''}>${this.daily.busy?'Đang nhận…':busy?'Kiểm tra giao dịch chờ':v.canClaim?`Nhận quà ngày ${v.nextDay}`:'✓ Đã điểm danh hôm nay'}</button></div>`;
 }
 renderGifts(v){
  return `<div class="ga-summary"><div><span class="ga-kicker">QUÀ ĐƯỢC GIỮ LẠI</span><h3>${v.boxes.length} phần quà chưa nhận vật phẩm</h3><p>Vàng và đá quý của các mốc này đã được cộng khi điểm danh.</p></div><button type="button" data-action="refresh" ${this.daily.busy?'disabled':''}>Làm mới</button></div><div class="ga-boxes">${v.boxes.length?v.boxes.map(b=>`<article><div><strong>Quà điểm danh ngày ${b.day}</strong><small>${escape(b.date)}</small></div><ul>${rewardsMarkup({items:b.items})}</ul><button type="button" class="ga-primary" data-action="collect" data-source="${escape(b.sourceId)}" ${this.daily.busy?'disabled':''}>Nhận quà</button></article>`).join(''):'<div class="ga-empty">✓ Bạn đã nhận hết quà.<p>Quà mới sẽ xuất hiện sau lần điểm danh tiếp theo.</p></div>'}</div><h3 class="ga-history-title">Nhật ký gần đây</h3><div class="ga-history">${v.history.length?v.history.map(h=>`<div><span>${escape(h.date)} · Ngày ${h.day}</span><strong>+${h.reward.gold} vàng${h.reward.gems?` · +${h.reward.gems} đá quý`:''}</strong><small>${h.collected?'Đã nhận vật phẩm':'Vật phẩm đang chờ'}</small></div>`).join(''):'Chưa có lần điểm danh nào.'}</div>`;
 }
 renderGuide(){return `<div class="ga-guide"><section><h3>Di chuyển & chiến đấu</h3><dl><dt>W A S D / Phím mũi tên</dt><dd>Di chuyển nhân vật.</dd><dt>E</dt><dd>Đánh thường; nói chuyện, câu cá hoặc tương tác khi ở gần.</dd><dt>1 – 5</dt><dd>Dùng các kỹ năng đã gán.</dd><dt>Q / R</dt><dd>Dùng bình HP / MP. Nút ⌄ cạnh bình để chọn cấp.</dd><dt>AUTO</dt><dd>Bật / tắt tự động tìm và đánh mục tiêu gần.</dd></dl></section><section><h3>Hành trang & hành trình</h3><dl><dt>B</dt><dd>Mở túi đồ, trang bị và cường hóa.</dd><dt>J</dt><dd>Xem nhật ký nhiệm vụ.</dd><dt>C</dt><dd>Xem và gán kỹ năng vào các ô nhanh.</dd><dt>Cổng dịch chuyển</dt><dd>Bước vào giữa cổng để đổi map.</dd><dt>Boss</dt><dd>Né vùng báo kỹ năng. Quà NaGa và Hộ Vệ Hắc Thạch có thời gian hồi sinh riêng.</dd></dl></section></div><div class="ga-tip"><b>Mẹo:</b> Điểm danh mỗi ngày để tích quà. Đá nâng cấp cánh được dùng trong bảng Cánh; thức ăn có thể hồi phục theo thời gian.</div>`;}
 destroy(){
  this.alive=false;this.isOpen=false;clearInterval(this.timer);if(this.root.open)this.root.close();
  window.removeEventListener('keydown',this.key,true);document.removeEventListener('visibilitychange',this.visible);this.scene.events.off('postupdate',this.tick);
  this.toolbar.remove();this.root.remove();
 }
}
