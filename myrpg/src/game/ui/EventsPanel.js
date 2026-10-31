import {EVENT_SKILLS} from '../data/eventSkills.js';
import {ITEMS,gearIcon} from '../data/items.js';
import {TU_LINH_WEAPONS,tuLinhWeaponIcon} from '../data/tuLinhWeapons.js';
import {HUNT_EVENT_WEAPONS,huntEventWeaponIcon} from '../data/huntEventItems.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classes={swordsman:'Kiếm sĩ',mage:'Pháp sư',fighter:'Đấu sĩ'};
function seal(id){
 const colors={nhan_long:'#81d6bc',hoa_phung:'#ef9976',huyen_giap:'#a5b5d0',han_nha:'#a0d5eb'};
 const paths={nhan_long:'M9 22L10 12L16 8L24 11L25 17L19 20L16 16L18 13M11 14L7 11M21 11L22 6M12 21L21 24L25 20',hoa_phung:'M16 25L14 16L6 10L10 20L16 25L22 20L26 10L18 16L16 25M14 16L16 6L18 16',huyen_giap:'M9 11L16 7L23 11L25 19L20 25L12 25L7 19Z M9 15H23M12 10L13 24M20 10L19 24',han_nha:'M16 6V26M7 11L25 21M7 21L25 11M12 8L16 12L20 8M12 24L16 20L20 24'};
 return `<svg aria-hidden="true" width="56" height="56" viewBox="0 0 32 32"><path d="M9 2H23L30 9V23L23 30H9L2 23V9Z" fill="#18332d" stroke="${colors[id]}"/><path d="${paths[id]}" fill="none" stroke="${colors[id]}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
const itemIcon=(id,size=46)=>HUNT_EVENT_WEAPONS[id]?huntEventWeaponIcon(id,size):TU_LINH_WEAPONS[id]?tuLinhWeaponIcon(id,size):ITEMS[id]?.emoji?`<span class="te-loot-emoji" style="font-size:${Math.round(size*.76)}px">${ITEMS[id].emoji}</span>`:['wing_stone_1','wing_stone_2','wing_stone_3','wing_stone_4','skill_powder','breakthrough_book'].includes(id)?materialIllustration(id,size):gearIcon(ITEMS[id]?.icon||id,ITEMS[id]?.level||1,size);
const rewardNames={upgrade_stone:'Đá cường hóa',wing_stone_1:'Đá nâng cấp cánh cấp 1',wing_stone_2:'Đá nâng cấp cánh cấp 2',wing_stone_3:'Đá nâng cấp cánh cấp 3',wing_stone_4:'Đá nâng cấp cánh cấp 4',wing_essence:'Tinh chất cánh',skill_powder:'Bột nâng cấp kỹ năng',breakthrough_book:'Sách phép đột phá',food_perch_soup:'Canh cá rô',food_carp_stew:'Cá chép hầm',food_catfish_stew:'Cá trê tiềm',shockwave_charm:'Linh Phù Chấn Động'};
function materialIllustration(id,size){
 const colors={wing_stone_1:['#367963','#8ee8ac','#e0ffcf'],wing_stone_2:['#3875a8','#8bd2ff','#e1f6ff'],wing_stone_3:['#67459a','#c9a1ff','#f2e4ff'],wing_stone_4:['#a76c28','#ffd274','#fff0bc']};
 if(colors[id]){
  const [dark,main,shine]=colors[id];
  return `<svg class="te-material-art" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="m24 3 16 13-5 23H13L8 16Z" fill="${dark}" stroke="${shine}" stroke-width="2"/><path d="m24 7 11 10-4 17H17l-4-17Z" fill="${main}"/><path d="m24 7 2 17 9-7Zm-11 10 13 7-9 10Zm22 0-9 7 5 10Z" fill="${shine}" opacity=".72"/><path d="m24 7 2 17-2 10-7 0-4-17Z" fill="#fff" opacity=".22"/><path d="M12 41h24" stroke="${shine}" stroke-width="2" stroke-linecap="round"/></svg>`;
 }
 return id==='skill_powder'
  ?`<svg class="te-material-art" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 5h18v5l-4 5 10 8v16H9V23l10-8-4-5Z" fill="#7047a3" stroke="#efce83" stroke-width="2"/><path d="M11 25h26v12H11Z" fill="#9d71d0"/><path d="m24 19 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff0b0"/><path d="M17 7h14v3H17Z" fill="#e2bd73"/></svg>`
  :`<svg class="te-material-art" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 7h22l7 7v29H12c-3 0-5-2-5-5V12c0-3 2-5 5-5Z" fill="#9d484f" stroke="#f0d091" stroke-width="2"/><path d="M12 8v30h29" fill="none" stroke="#f3e5b7" stroke-width="3"/><path d="M17 15h18v19H17Z" fill="#60334e" stroke="#d7b76b"/><path d="m26 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffe5a0"/><path d="M33 8v7h7" fill="#d69067" stroke="#f0d091" stroke-width="2"/></svg>`;
}
function currencyIcon(kind){
 return kind==='gold'
  ?'<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="22" cy="33" rx="15" ry="7" fill="#9d632d"/><path d="M7 25v8c0 4 7 7 15 7s15-3 15-7v-8" fill="#d8913d" stroke="#f8d77e" stroke-width="2"/><ellipse cx="22" cy="25" rx="15" ry="7" fill="#f3c55f" stroke="#fff0a5" stroke-width="2"/><path d="M22 20v10m-4-7h6a2 2 0 0 1 0 4h-5a2 2 0 0 0 0 4h7" fill="none" stroke="#9d632d" stroke-width="2" stroke-linecap="round"/></svg>'
  :'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 5h18l10 12-19 26L5 17Z" fill="#348da0" stroke="#a8f3ee" stroke-width="2"/><path d="M15 5h18l-9 12H5Zm9 12h19L24 43Z" fill="#65d9df"/><path d="m15 5 9 12-5 15L5 17Zm18 0-9 12h19Z" fill="#e1ffff" opacity=".8"/><path d="m19 32 5 11 5-11" fill="#23717f"/></svg>';
}
function lootTile(id,quantity,kind='item'){
 const item=ITEMS[id],name=kind==='gold'?'Vàng':kind==='gems'?'Đá quý':rewardNames[id]||item?.name||id;
 const art=kind==='gold'||kind==='gems'?currencyIcon(kind):itemIcon(id,42);
 return `<div class="te-loot ${kind==='gold'?'is-gold':kind==='gems'?'is-gem':''}"><span class="te-loot-art">${art}</span><span class="te-loot-copy"><strong>${escape(name)}</strong><small>${kind==='gold'?'Tiền tệ':kind==='gems'?'Đá quý':item?.type==='weapon'?'Vũ khí sự kiện':item?.type==='shield'?'Trang bị phụ':item?.category==='food'?'Vật phẩm hồi phục':'Nguyên liệu sự kiện'}</small></span><b class="te-loot-count">×${Number(quantity).toLocaleString('vi-VN')}</b></div>`;
}
function renderHuntEvent(system,state,event){
 const pending=state.data.pendingEventClaim;
 const monsterNext=(event.monsterMilestones||[]).find(m=>!m.claimed),bossNext=(event.bossMilestones||[]).find(m=>!m.claimed);
 return `<section class="te-detail te-hunt-detail" data-event-id="${escape(event.id)}"><div class="te-hunt-toolbar"><span class="te-hunt-kicker"><i></i> SỰ KIỆN ĐANG DIỄN RA</span><button type="button" data-action="events-refresh" ${system.loading||system.busy?'disabled':''}>${system.loading?'Đang tải…':'↻ Làm mới'}</button></div><header class="te-hunt-hero"><div class="te-hunt-hero-copy"><span class="te-hunt-overline">THỬ THÁCH MÙA SĂN</span><h3>Săn Quái <em>&</em> Boss</h3><p>${escape(event.description)}</p><div class="te-hunt-hero-tags"><span>✦ Mốc thưởng độc quyền</span><span>◈ Lưu theo nhân vật</span></div></div><div class="te-hunt-emblem" aria-hidden="true"><span>✦</span><small>HUNT<br>EVENT</small></div></header>${system.error?`<p class="te-hunt-error" role="status">${escape(system.error)}</p>`:''}<div class="te-hunt-totals"><article class="te-hunt-total is-monster"><span class="te-total-icon" aria-hidden="true">⚔</span><div><small>QUÁI VẬT ĐÃ HẠ</small><strong>${Number(event.monsterKills||0).toLocaleString('vi-VN')}</strong><span>Tiếp theo: ${monsterNext?`${Number(monsterNext.threshold).toLocaleString('vi-VN')} quái`:'Đã hoàn thành tất cả mốc'}</span></div></article><article class="te-hunt-total is-boss"><span class="te-total-icon" aria-hidden="true">♛</span><div><small>BOSS ĐÃ TIÊU DIỆT</small><strong>${Number(event.bossKills||0).toLocaleString('vi-VN')}</strong><span>Tiếp theo: ${bossNext?`${Number(bossNext.threshold).toLocaleString('vi-VN')} boss`:'Đã hoàn thành tất cả mốc'}</span></div></article></div>${renderMilestones(system,pending,'monster','Chiến tích săn quái','Hạ quái thường',event.monsterMilestones||[],Number(event.monsterKills||0))}${renderMilestones(system,pending,'boss','Chiến tích săn boss','Hạ boss',event.bossMilestones||[],Number(event.bossKills||0))}</section>`;
}
function renderMilestones(system,pending,kind,title,subtitle,rows,count){
 return `<section class="te-hunt-group is-${kind}"><div class="te-hunt-section-heading"><span class="te-hunt-section-icon">${kind==='monster'?'⚔':'♛'}</span><div><span class="te-hunt-overline">${subtitle}</span><h4>${title}</h4></div><small>${rows.filter(m=>m.claimed).length}/${rows.length} ĐÃ NHẬN</small></div><div class="te-hunt-milestones">${rows.map((m,index)=>{
  const progress=Math.min(100,Math.floor(count/m.threshold*100)),reward=m.reward||{},loot=[];
  if(reward.gold)loot.push(lootTile('gold',reward.gold,'gold'));
  if(reward.gems)loot.push(lootTile('gems',reward.gems,'gems'));
  for(const [id,quantity] of Object.entries(reward.items||{}))loot.push(lootTile(id,quantity));
  if(reward.offhand){
   const item=ITEMS[reward.offhand],skill=item?.specialSkill;
   loot.push(lootTile(reward.offhand,1));
   if(item)loot.push(`<p class="te-hunt-special-note">✦ +${item.defense} thủ · +${item.maxHP} HP${skill?` · F: ${escape(skill.name)} gây ${Math.round(skill.multiplier*100)}% công`:''}</p>`);
  }
  if(reward.weapon){
   loot.push(lootTile(reward.weapon.id,1));
   loot.push(`<p class="te-hunt-special-note">⚔ +${Number(reward.weapon.attack||0)} công · Vũ khí theo class</p>`);
  }
  const samePending=pending?.milestoneId===m.id,unlocked=m.canClaim||samePending,percent=String(progress);
  return `<article class="te-hunt-card ${m.claimed?'is-claimed':''} ${unlocked?'is-ready':''}" style="--hunt-progress:${percent}%;--hunt-index:${index}"><div class="te-hunt-card-top"><span class="te-hunt-step">${String(index+1).padStart(2,'0')}</span><span class="te-hunt-state ${m.claimed?'is-claimed':unlocked?'is-ready':''}">${m.claimed?'✓ Đã nhận':unlocked?'✦ Có thể nhận':'Đang tích lũy'}</span></div><h5>${Number(m.threshold).toLocaleString('vi-VN')} <small>${kind==='monster'?'quái':'boss'}</small></h5><div class="te-hunt-progress-row"><span>Tiến độ</span><strong>${Math.min(count,m.threshold).toLocaleString('vi-VN')} <i>/ ${Number(m.threshold).toLocaleString('vi-VN')}</i></strong></div><div class="te-hunt-progress-track"><i></i></div><div class="te-hunt-rewards"><span class="te-hunt-rewards-label">PHẦN THƯỞNG</span><div class="te-loot-list">${loot.join('')}</div></div><button type="button" class="te-hunt-claim ${unlocked&&!m.claimed?'is-ready':''}" data-action="events-claim" data-milestone="${escape(m.id)}" ${system.busy||(!unlocked&&!samePending)||m.claimed?'disabled':''}>${system.busy&&samePending?'Đang nhận quà…':samePending?'Kiểm tra nhận quà':m.claimed?'✓ Đã nhận mốc':unlocked?'Nhận phần thưởng':'Cần thêm '+Math.max(0,m.threshold-count).toLocaleString('vi-VN')+' '+(kind==='monster'?'quái':'boss')}</button></article>`;
 }).join('')}</div></section>`;
}
export function renderEvents(system,state){
 const events=system.view||[],busy=system.loading||system.busy;
 if(!events.some(e=>e.id===system.selectedEventId))system.selectedEventId=events[0]?.id;
 const e=events.find(v=>v.id===system.selectedEventId);
 const refresh=`<button type="button" data-action="events-refresh" ${busy?'disabled':''}>${system.loading?'Đang tải…':'Làm mới'}</button>`;
 const sidebar=`<aside class="te-sidebar" aria-label="Danh sách sự kiện"><h3>SỰ KIỆN</h3><p>${events.length} đang diễn ra</p><nav>${events.map(v=>`<button type="button" data-action="events-select" data-event="${escape(v.id)}" aria-current="${v.id===e?.id}"><span>✦</span><div><strong>${escape(v.name)}</strong><small>Đang diễn ra</small></div><b>›</b></button>`).join('')}</nav><div class="te-sidebar-note">Các sự kiện mới sẽ xuất hiện tại đây.</div></aside>`;
 if(!e)return `<div class="te-shell">${sidebar}<section class="te-detail"><div class="ga-empty"><b>${system.loading?'Đang tải sự kiện…':'Chưa tải được danh sách sự kiện.'}</b><p>Chọn sự kiện để xem thông tin và đổi thưởng.</p>${refresh}</div></section></div>`;
 if(e.id==='hunt-monsters')return `<div class="te-shell">${sidebar}${renderHuntEvent(system,state,e)}</div>`;
 const recipes=e.recipes||[],pending=state.data.pendingEventExchange;
 const rows=recipes.map(recipe=>{
  const material=e.materials.find(m=>m.id===recipe.materialId),count=e.balances[recipe.materialId]||0;
  const classItem=recipe.classWeapon?e.weapons?.[state.data.classCode]:null,id=recipe.skillId||classItem?.id||recipe.itemId;
  const item=EVENT_SKILLS.find(k=>k.id===recipe.skillId)||ITEMS[id]||classItem;if(!item||!material)return '';
  const error=recipe.skillId?(e.ownedEventSkills?.includes(id)?'Đã học kỹ năng này.':null):state.canAdd(id),samePending=pending&&(pending.recipeId||'nhan-long-weapon')===recipe.id;
  const disabled=busy||(!samePending&&(!!pending||count<recipe.cost||!!error));
  const stats=recipe.skillId?'Băng trụ hình nón · 200% công · 40 MP · Hồi 16 giây':[item.attack?`+${item.attack} công`:'',item.defense?`+${item.defense} thủ`:'',item.maxHP?`+${item.maxHP} HP`:'',item.maxMP?`+${item.maxMP} MP`:''].filter(Boolean).join(' · ');
  const hint=error|| (count<recipe.cost?`Cần thêm ${recipe.cost-count} ${material.name}.`:'Sẵn sàng đổi.');
  return `<article class="te-exchange-row" data-recipe="${recipe.id}"><div class="te-cost">${seal(material.id)}<div><strong>${recipe.cost} ${escape(material.name)}</strong><small>Đang có: ${count}</small>${!material.active?'<em>Nguồn rơi sẽ bổ sung sau</em>':''}</div></div><span class="te-arrow" aria-hidden="true">→</span><div class="te-reward">${recipe.skillId?seal('han_nha'):itemIcon(id)}<div><h4>${escape(item.name)}</h4><p>${escape(stats)}</p><small>${recipe.skillId?'Kỹ năng đặc biệt · Mọi class · Gán ô 1–5':recipe.classWeapon?escape(classes[state.data.classCode])+' · Class của bạn':item.type==='shield'?'Ô trang bị phụ · Mọi class':'Trang bị mặc · Mọi class'}</small>${item.specialSkill?'<em>F · Vùng lửa 5 giây</em>':''}</div></div><div class="te-row-action"><button type="button" class="ga-primary" data-action="events-exchange" data-recipe="${recipe.id}" ${disabled?'disabled':''}>${system.busy&&samePending?'Đang đổi…':samePending?'Kiểm tra lại':recipe.skillId?'Học kỹ năng':'Đổi trang bị'}</button><small>${escape(samePending?'Giao dịch đang chờ xác nhận':hint)}</small></div></article>`;
 }).join('');
 return `<div class="te-shell">${sidebar}<section class="te-detail" data-event-id="${escape(e.id)}"><div class="te-topline"><span>THÔNG TIN SỰ KIỆN</span>${refresh}</div><header class="te-banner"><div><span class="te-live">ĐANG DIỄN RA</span><h3>${escape(e.name)}</h3><p>${escape(e.description||'Thu thập linh vật · Đổi thần binh theo class')}</p></div></header><div class="te-material-summary">${e.materials.map(m=>`<div class="${m.active?'is-active':''}">${seal(m.id)}<span>${escape(m.name)}<strong>${Number(e.balances[m.id]||0)}</strong></span></div>`).join('')}</div><div class="te-rules">${e.id==='tu-linh'?'<p><b>Nhân Long:</b> hạ Thanh Long nhận 1. <b>Huyền Giáp:</b> hạ Huyền Quy nhận 1. <b>Hàn Nha:</b> hạ Bạch Hổ nhận 1. <b>Hỏa Phụng:</b> hạ Hỏa Phượng nhận 1.</p>':''}<p>Linh vật lưu riêng trong Sự kiện. Trang bị nhận vào balo; kỹ năng được học trực tiếp và gán tại Balo → Kỹ năng.</p></div><h4 class="te-recipe-title">Đổi vật phẩm</h4><div class="te-exchanges">${rows||'<p>Chưa có công thức đổi cho sự kiện này.</p>'}</div>${e.id==='tu-linh'?`<section class="te-skill-note"><strong>Hỏa Tiên Kỳ · Hỏa Vực Tiên Kỳ</strong><p>Trang bị ô phụ, nhấn F để tạo vùng lửa tại quái gần nhất (không có quái sẽ tạo theo hướng nhìn). Vùng tồn tại 5 giây, mỗi 0,5 giây gây 60% công. Tốn 35 MP · Hồi 20 giây.</p></section>`:''}</section></div>`;
}
