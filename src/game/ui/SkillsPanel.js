import { BOOK_SKILLS, LEGACY_SKILLS, SCHOOLS, STARTER_SKILLS, findSkill, skillSlots } from '../data/skillBooks.js';
import { actionIcon } from './actionIcons.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x||0).toLocaleString('vi-VN');
const schoolFor=s=>SCHOOLS.find(g=>g.id===s.school) || (s.school==='mage'?{name:'Pháp sư',color:'#9fc4ff'}:{name:'Cơ bản',color:'#b4c9b3'});
const art=s=>`<span class="sk-art" style="--school:${schoolFor(s).color}">${actionIcon(s.icon)}</span>`;
function notice(s){return s.skillError?`<div class="sk-notice" role="alert">${esc(s.skillError)} <button data-action="skill-retry" ${s.skillBusy?'disabled':''}>Kiểm tra lại</button></div>`:!s.skillsLoaded?'<p class="sk-notice">Đang tải sách và ô kỹ năng…</p>':'';}
function filters(hud,shop){
 const selected=(shop?hud.bookSchool:hud.skillSchool) || (shop?'demon':'all');
 const choices=shop?SCHOOLS:[{id:'all',name:'Tất cả'},...SCHOOLS];
 return `<div class="sk-filters">${choices.map(c=>`<button data-action="${shop?'book-school':'skill-school'}" data-id="${c.id}" class="${c.id===selected?'active':''}">${c.name}</button>`).join('')}</div>`;
}
export function renderSkillsPanel(hud){
 const s=hud.state,owned=s.data.skills?.owned ?? STARTER_SKILLS,slots=skillSlots(s);
 const selected=Number.isInteger(hud.skillSlot)?hud.skillSlot:0;hud.skillSlot=selected;
 const group=hud.skillSchool || 'all';const list=[...BOOK_SKILLS,...LEGACY_SKILLS].filter(k=>group==='all'||k.school===group);
 const busy=s.skillBusy || !s.skillsLoaded || !!s.data.pendingSkillAction;
 return `${notice(s)}<div class="sk-heading"><div><span class="sk-eyebrow">BỘ KỸ NĂNG CHIẾN ĐẤU</span><h3>Chọn ô · Chọn kỹ năng</h3><p>Phím 1–5 sử dụng kỹ năng trong ô tương ứng. Mỗi kỹ năng chỉ gán một ô.</p></div><span class="sk-owned">${owned.length} kỹ năng đã học</span></div>
 <div class="sk-slots">${slots.map((id,i)=>{const k=findSkill(id);return `<button class="sk-slot ${selected===i?'selected':''}" data-action="skill-slot" data-id="${i}" aria-pressed="${selected===i}"><kbd>${i+1}</kbd>${k?art(k):'<span class="sk-empty">＋</span>'}<strong>${esc(k?.name || 'Ô trống')}</strong></button>`;}).join('')}</div>
 <div class="sk-assignment"><span>Đang chọn <b>ô ${selected+1}</b>. Chọn “Gán vào ô” bên dưới để thay kỹ năng.</span><button data-action="skill-clear" data-id="${selected}" ${busy||!slots[selected]?'disabled':''}>Bỏ gán ô ${selected+1}</button></div>
 ${filters(hud,false)}<div class="sk-grid">${list.map(k=>{const has=owned.includes(k.id),assigned=slots.indexOf(k.id),seller=k.school==='mage'?'Pháp sư':'Học giả Sora';return `<article class="sk-card ${has?'':'locked'}" style="--school:${schoolFor(k).color}"><header>${art(k)}<div><span class="sk-eyebrow">${schoolFor(k).name}</span><h3>${esc(k.name)}</h3></div></header><p>${esc(k.description)}</p><div class="sk-meta">${k.mana} MP <span>Hồi ${k.cooldown/1000}s</span></div><div class="sk-card-footer"><small>${assigned>=0?'Đang ở ô '+(assigned+1):has?'Đã mua':`Cần mua tại ${seller}`}</small><button data-action="skill-assign" data-id="${k.id}" ${busy||!has||assigned===selected?'disabled':'class="rpg-primary"'}>${!has?'Chưa mua':assigned===selected?'Đã gán':'Gán vào ô '+(selected+1)}</button></div></article>`;}).join('')}</div>`;
}
export function renderSkillShop(hud){
 const s=hud.state,owned=s.data.skills?.owned??[],seller=hud.skillVendor || 'sora',mage=seller==='mage';
 const list=mage?LEGACY_SKILLS:BOOK_SKILLS;
 const group=mage?'mage':(hud.bookSchool || 'demon');
 const groups=mage?[{id:'mage',name:'Pháp sư'}]:SCHOOLS;
 const cards=list.filter(k=>mage||k.school===group).map(k=>{const has=owned.includes(k.id),enough=s.data.gold>=k.goldPrice&&s.data.gems>=k.gemPrice;return `<article class="sk-card sk-book" style="--school:${schoolFor(k).color}"><div class="sk-book-cover">${art(k)}<span>${mage?'Kỹ năng cũ':schoolFor(k).name}</span></div><h3>${esc(k.name)}</h3><p>${esc(k.description)}</p><div class="sk-meta">${k.mana} MP <span>Hồi ${k.cooldown/1000}s</span></div><div class="sk-price"><span class="${s.data.gold<k.goldPrice?'missing':''}">● ${fmt(k.goldPrice)} vàng</span><b>+</b><span class="${s.data.gems<k.gemPrice?'missing':''}">◆ ${fmt(k.gemPrice)} đá quý</span></div><button class="rpg-primary sk-buy" data-action="skill-buy" data-id="${k.id}" ${has||!enough||s.skillBusy||!s.skillsLoaded||s.data.pendingSkillAction?'disabled':''}>${has?'Đã học':s.skillBusy?'Đang xử lý…':!enough?'Chưa đủ vàng và đá quý':'Mua kỹ năng'}</button></article>`;}).join('');
 return `${notice(s)}<div class="sk-heading"><div><span class="sk-eyebrow">${mage?'LÀNG KHỞI ĐẦU • KỸ NĂNG CƠ BẢN':'TÀNG THƯ • THÀNH YUNA'}</span><h3>${mage?'Pháp sư · Kỹ năng cũ':'Học giả Sora · Sách kỹ năng'}</h3><p>${mage?'Các kỹ năng chiến đấu từng được bán tại Pháp sư.':'Chín sách kỹ năng riêng của Học giả Sora.'} Mỗi kỹ năng cần đồng thời <b>2.000 vàng + 10 đá quý</b>.</p></div><div class="sk-wallet"><span>● ${fmt(s.data.gold)} vàng</span><span>◆ ${fmt(s.data.gems)} đá quý</span></div></div>
 ${mage?'':`<div class="sk-filters">${groups.map(c=>`<button data-action="book-school" data-id="${c.id}" class="${c.id===group?'active':''}">${c.name}</button>`).join('')}</div>`}<div class="sk-grid">${cards}</div><div class="sk-assignment"><span>Kỹ năng đã mua có thể gán tại trang Kỹ năng.</span><button data-action="tab" data-id="skills">Mở trang Kỹ năng · C →</button></div>`;
}
