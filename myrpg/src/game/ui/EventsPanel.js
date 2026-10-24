import {EVENT_SKILLS} from '../data/eventSkills.js';
import {ITEMS} from '../data/items.js';
import {eventEquipmentIcon} from '../world/EventEquipmentArt.js';
import {TU_LINH_WEAPONS,tuLinhWeaponIcon} from '../data/tuLinhWeapons.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classes={swordsman:'Kiếm sĩ',mage:'Pháp sư',fighter:'Đấu sĩ'};
function seal(id){
 const colors={nhan_long:'#81d6bc',hoa_phung:'#ef9976',huyen_giap:'#a5b5d0',han_nha:'#a0d5eb'};
 const paths={nhan_long:'M9 22L10 12L16 8L24 11L25 17L19 20L16 16L18 13M11 14L7 11M21 11L22 6M12 21L21 24L25 20',hoa_phung:'M16 25L14 16L6 10L10 20L16 25L22 20L26 10L18 16L16 25M14 16L16 6L18 16',huyen_giap:'M9 11L16 7L23 11L25 19L20 25L12 25L7 19Z M9 15H23M12 10L13 24M20 10L19 24',han_nha:'M16 6V26M7 11L25 21M7 21L25 11M12 8L16 12L20 8M12 24L16 20L20 24'};
 return `<svg aria-hidden="true" width="56" height="56" viewBox="0 0 32 32"><path d="M9 2H23L30 9V23L23 30H9L2 23V9Z" fill="#18332d" stroke="${colors[id]}"/><path d="${paths[id]}" fill="none" stroke="${colors[id]}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
const itemIcon=(id,size=46)=>TU_LINH_WEAPONS[id]?tuLinhWeaponIcon(id,size):eventEquipmentIcon(id,size);
export function renderEvents(system,state){
 const events=system.view||[],busy=system.loading||system.busy;
 if(!events.some(e=>e.id===system.selectedEventId))system.selectedEventId=events[0]?.id;
 const e=events.find(v=>v.id===system.selectedEventId);
 const refresh=`<button type="button" data-action="events-refresh" ${busy?'disabled':''}>${system.loading?'Đang tải…':'Làm mới'}</button>`;
 const sidebar=`<aside class="te-sidebar" aria-label="Danh sách sự kiện"><h3>SỰ KIỆN</h3><p>${events.length} đang diễn ra</p><nav>${events.map(v=>`<button type="button" data-action="events-select" data-event="${escape(v.id)}" aria-current="${v.id===e?.id}"><span>✦</span><div><strong>${escape(v.name)}</strong><small>Đang diễn ra</small></div><b>›</b></button>`).join('')}</nav><div class="te-sidebar-note">Các sự kiện mới sẽ xuất hiện tại đây.</div></aside>`;
 if(!e)return `<div class="te-shell">${sidebar}<section class="te-detail"><div class="ga-empty"><b>${system.loading?'Đang tải sự kiện…':'Chưa tải được danh sách sự kiện.'}</b><p>Chọn sự kiện để xem thông tin và đổi thưởng.</p>${refresh}</div></section></div>`;
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
