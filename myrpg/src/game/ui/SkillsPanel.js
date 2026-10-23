import {SKILL_TRAINING,skillProgress,scaledSkill} from '../data/skillTraining.js';
import { EVENT_SKILLS, BOOK_SKILLS, MAGE_SKILLS, SCHOOLS, STARTER_SKILLS, findSkill, skillSlots } from '../data/skillBooks.js';
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
 const group=hud.skillSchool || 'all';const list=[...BOOK_SKILLS,...MAGE_SKILLS,...EVENT_SKILLS].filter(k=>group==='all'||k.school===group).map(k=>scaledSkill(k,s));
 const busy=s.skillBusy || !s.skillsLoaded || !!s.data.pendingSkillAction;
 return `${notice(s)}<div class="sk-heading"><div><span class="sk-eyebrow">BỘ KỸ NĂNG CHIẾN ĐẤU</span><h3>Chọn ô · Chọn kỹ năng</h3><p>Phím 1–5 sử dụng kỹ năng trong ô tương ứng. Mỗi kỹ năng chỉ gán một ô.</p></div><span class="sk-owned">${owned.length} kỹ năng đã học</span></div>
 <div class="sk-slots">${slots.map((id,i)=>{const k=findSkill(id,s);return `<button class="sk-slot ${selected===i?'selected':''}" data-action="skill-slot" data-id="${i}" aria-pressed="${selected===i}"><kbd>${i+1}</kbd>${k?art(k):'<span class="sk-empty">+</span>'}<strong>${esc(k?.name || 'Ô trống')}</strong></button>`;}).join('')}</div>
 <div class="sk-assignment"><span>Đang chọn <b>ô ${selected+1}</b>. Chọn “Gán vào ô” bên dưới để thay kỹ năng.</span><button data-action="skill-clear" data-id="${selected}" ${busy||!slots[selected]?'disabled':''}>Bỏ gán ô ${selected+1}</button></div>
 ${materialWallet(s)}<p class="sk-training-help">Mỗi lần nâng cần 3 bột. Đạt Lv 10 / 20 / 30… cần 1 / 2 / 3… sách phép đột phá để mở thêm 10 cấp.</p>${filters(hud,false)}<div class="sk-grid">${list.map(k=>{const has=owned.includes(k.id),assigned=slots.indexOf(k.id),seller=k.seller==='mage'?'Pháp sư':'Học giả Sora';return `<article class="sk-card ${has?'':'locked'}" style="--school:${schoolFor(k).color}"><header>${art(k)}<div><span class="sk-eyebrow">${schoolFor(k).name}</span><h3>${esc(k.name)}</h3></div></header><p>${esc(k.description)}</p><div class="sk-meta">${k.mana} MP <span>Hồi ${k.cooldown/1000}s</span></div><div class="sk-card-footer"><small>${assigned>=0?'Đang ở ô '+(assigned+1):has?'Đã học':k.seller==='event'?'Đổi trong Sự kiện Tứ Linh':`Cần mua tại ${seller}`}</small><button data-action="skill-assign" data-id="${k.id}" ${busy||!has||assigned===selected?'disabled':'class="rpg-primary"'}>${!has?'Chưa học':assigned===selected?'Đã gán':'Gán vào ô '+(selected+1)}</button></div>${trainingCard(s,k,has,busy)}</article>`;}).join('')}</div>`;
}
export function renderSkillShop(hud){
 const s=hud.state,owned=s.data.skills?.owned??[],seller=hud.skillVendor || 'sora',mage=seller==='mage';
 const list=mage?MAGE_SKILLS:BOOK_SKILLS;
 const group=hud.bookSchool || 'demon';
 const groups=SCHOOLS;
 const cards=list.filter(k=>k.school===group).map(k=>{const has=owned.includes(k.id),enough=s.data.gold>=k.goldPrice&&s.data.gems>=k.gemPrice;return `<article class="sk-card sk-book" style="--school:${schoolFor(k).color}"><div class="sk-book-cover">${art(k)}<span>${schoolFor(k).name}</span></div><h3>${esc(k.name)}</h3><p>${esc(k.description)}</p><div class="sk-meta">${k.mana} MP <span>Hồi ${k.cooldown/1000}s</span></div><div class="sk-price"><span class="${s.data.gold<k.goldPrice?'missing':''}">● ${fmt(k.goldPrice)} vàng</span><b>+</b><span class="${s.data.gems<k.gemPrice?'missing':''}">◆ ${fmt(k.gemPrice)} đá quý</span></div><button class="rpg-primary sk-buy" data-action="skill-buy" data-id="${k.id}" ${has||!enough||s.skillBusy||!s.skillsLoaded||s.data.pendingSkillAction?'disabled':''}>${has?'Đã học':s.skillBusy?'Đang xử lý…':!enough?'Chưa đủ vàng và đá quý':'Mua kỹ năng'}</button></article>`;}).join('');
 return `${notice(s)}<div class="sk-heading"><div><span class="sk-eyebrow">${mage?'LÀNG KHỞI ĐẦU • KỸ NĂNG CƠ BẢN':'TÀNG THƯ • THÀNH YUNA'}</span><h3>${mage?'Pháp sư · Ma / Thần / Nhân':'Học giả Sora · Sách kỹ năng'}</h3><p>${mage?'Chín kỹ năng riêng của Pháp sư, chia theo ba hệ Ma, Thần và Nhân.':'Chín sách kỹ năng riêng của Học giả Sora.'} Mỗi kỹ năng cần đồng thời <b>2.000 vàng + 10 đá quý</b>.</p></div><div class="sk-wallet"><span>● ${fmt(s.data.gold)} vàng</span><span>◆ ${fmt(s.data.gems)} đá quý</span></div></div>
 <div class="sk-filters">${groups.map(c=>`<button data-action="book-school" data-id="${c.id}" class="${c.id===group?'active':''}">${c.name}</button>`).join('')}</div><div class="sk-grid">${cards}</div><div class="sk-assignment"><span>Kỹ năng đã mua có thể gán tại trang Kỹ năng.</span><button data-action="tab" data-id="skills">Mở trang Kỹ năng · C →</button></div>`;
}

function materialIcon(id){
 const art=id==='skill_powder'?'<path d="M22 18h20l-3 11c12 9 15 26 5 30H20c-10-4-7-21 5-30Z" fill="#7d5abb" stroke="#e5c287" stroke-width="2"/><path d="M23 28h18" stroke="#edc96d" stroke-width="4"/><path d="m32 34 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffe5a5"/><path d="m14 7 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm33-2 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#fff0bf"/>':'<path d="M16 9h32v48H16c-7 0-9-7-9-12V20c0-7 3-11 9-11Z" fill="#9e4a50" stroke="#efcf86" stroke-width="2"/><path d="M17 10v39M17 50h31v9H17c-8 0-8-9 0-9Z" fill="#f4dfae" stroke="#b18e54" stroke-width="2"/><path d="M21 15h22v28H21Z" fill="#602f54" stroke="#dbb967"/><path d="m32 20 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffe3a0"/><path d="M42 46h10v8H42Z" fill="#e7bd68"/>';
 return `<svg class="sk-material-icon" viewBox="0 0 64 64" aria-hidden="true">${art}</svg>`;
}
function materialWallet(s){
 const materials=s.data.skills?.materials??{};
 return `<div class="sk-material-wallet">${SKILL_TRAINING.materials.map(m=>`<span>${materialIcon(m.id)} ${esc(m.name)}: <b>${fmt(materials[m.id])}</b></span>`).join('')}</div>`;
}
function trainingCard(s,k,has,busy){
 if(!has)return '';
 const {level,cap}=skillProgress(s,k.id),m=s.data.skills?.materials??{},max=level>=SKILL_TRAINING.maxLevel,breakthrough=level===cap&&!max,cost=breakthrough?cap/10:SKILL_TRAINING.powderPerUpgrade,item=breakthrough?'breakthrough_book':'skill_powder';
 const enough=(m[item]??0)>=cost;
 const base=[...BOOK_SKILLS,...MAGE_SKILLS,...EVENT_SKILLS].find(b=>b.id===k.id);
 const next=scaledSkill(base,{data:{skills:{levels:{[k.id]:{level:level+1,cap}}}}});
 return `<div class="sk-training"><div class="sk-level"><b>Lv ${level}</b><span>Mốc đã mở: ${cap}</span></div><div class="sk-level-track"><i style="width:${Math.min(100,level/cap*100)}%"></i></div>${max?'<p>Đã đạt cấp tối đa.</p>':`<p class="sk-next">${breakthrough?`Đột phá mở mốc Lv ${cap+10}. Cấp hiện tại vẫn là ${level}; sau đó dùng bột để nâng tiếp.`:`<b>Lv ${level+1}:</b> ${esc(next.description)}`}</p><button class="rpg-primary sk-upgrade" data-action="${breakthrough?'skill-breakthrough':'skill-upgrade'}" data-id="${k.id}" ${busy||!enough?'disabled':''}>${breakthrough?'Đột phá':'Nâng lên Lv '+(level+1)} · ${cost} ${breakthrough?'sách phép':'bột'}</button>`}</div>`;
}
export function renderSkillTrainingShop(hud){
 const s=hud.state,m=s.data.skills?.materials??{},busy=s.skillBusy||!s.skillsLoaded||!!s.data.pendingSkillAction;
 return `${notice(s)}<div class="sk-heading"><div><span class="sk-eyebrow">THÀNH CHỦ YUNA</span><h3>Bí thuật · Nâng cấp kỹ năng</h3><p>Mua nguyên liệu tại đây, nâng từng kỹ năng trong Balo → Kỹ năng. Bột và sách được giữ riêng cho nhân vật, không chiếm ô túi đồ.</p></div><div class="sk-wallet"><span>● ${fmt(s.data.gold)} vàng</span><span>◆ ${fmt(s.data.gems)} đá quý</span></div></div>${materialWallet(s)}<div class="sk-grid sk-training-shop-grid">${SKILL_TRAINING.materials.map(item=>`<article class="sk-card sk-book" style="--school:#d7ba7a"><div class="sk-training-art">${materialIcon(item.id)}</div><h3>${esc(item.name)}</h3><p>${item.id==='skill_powder'?'3 bột nâng kỹ năng thêm 1 cấp. Tăng sát thương, hồi phục hoặc hiệu quả riêng của từng chiêu.':'Đột phá tại Lv 10 / 20 / 30… tiêu hao 1 / 2 / 3… quyển. Mỗi lần mở thêm 10 cấp.'}</p><small>Đang có: ${fmt(m[item.id])}</small><div class="sk-price"><span>● ${fmt(item.goldPrice)} vàng</span><b>+</b><span>◆ ${fmt(item.gemPrice)} đá quý / 1</span></div><div class="sk-training-purchases">${[1,3,10].map(q=>`<button class="rpg-primary" data-action="skill-material-buy" data-id="${item.id}" data-quantity="${q}" ${busy||s.data.gold<item.goldPrice*q||s.data.gems<item.gemPrice*q||Number(m[item.id]??0)+q>9999?'disabled':''}>Mua ${q}</button>`).join('')}</div></article>`).join('')}</div><div class="sk-assignment"><span>Mở kỹ năng để xem hiệu quả hiện tại và cấp kế tiếp.</span><button data-action="tab" data-id="skills">Nâng kỹ năng →</button></div>`;
}
