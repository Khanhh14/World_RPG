import {tuLinhWeaponIcon} from '../data/tuLinhWeapons.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classes={swordsman:'Kiếm sĩ',mage:'Pháp sư',fighter:'Đấu sĩ'};
function seal(id){
 const colors={nhan_long:'#81d6bc',hoa_phung:'#ef9976',huyen_giap:'#a5b5d0',han_nha:'#a0d5eb'};
 const paths={nhan_long:'M9 22L10 12L16 8L24 11L25 17L19 20L16 16L18 13M11 14L7 11M21 11L22 6M12 21L21 24L25 20',hoa_phung:'M16 25L14 16L6 10L10 20L16 25L22 20L26 10L18 16L16 25M14 16L16 6L18 16',huyen_giap:'M9 11L16 7L23 11L25 19L20 25L12 25L7 19Z M9 15H23M12 10L13 24M20 10L19 24',han_nha:'M16 6V26M7 11L25 21M7 21L25 11M12 8L16 12L20 8M12 24L16 20L20 24'};
 return `<svg aria-hidden="true" width="56" height="56" viewBox="0 0 32 32"><path d="M9 2H23L30 9V23L23 30H9L2 23V9Z" fill="#18332d" stroke="${colors[id]}"/><path d="${paths[id]}" fill="none" stroke="${colors[id]}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
export function renderEvents(system,state){
 const refresh=`<button type="button" data-action="events-refresh" ${system.loading||system.busy?'disabled':''}>${system.loading?'Đang tải…':'Làm mới'}</button>`;
 const e=system.view?.find(v=>v.id==='tu-linh');
 if(!e)return `<div class="ga-empty"><b>${system.loading?'Đang tải sự kiện…':'Chưa tải được danh sách sự kiện.'}</b><p>Nhận vật phẩm và đổi thưởng theo nhân vật.</p>${refresh}</div>`;
 const balance=e.balances.nhan_long||0,owned=e.weapons[state.data.classCode],pending=!!state.data.pendingEventExchange;
 const error=owned?state.canAdd(owned.id):'Class chưa hỗ trợ.';
 const disabled=system.busy||system.loading||(!pending&&(balance<e.cost||!!error));
 return `<div class="te-topline"><span>SỰ KIỆN HIỆN TẠI · 1 ĐANG DIỄN RA</span>${refresh}</div>
 <article class="te-event"><header class="te-banner"><div><span class="te-live">ĐANG DIỄN RA</span><h3>Tứ Linh</h3><p>Thu thập linh vật · Đổi thần binh theo class</p></div><div class="te-banner-mark" aria-hidden="true"><svg width="45" height="45" viewBox="0 0 32 32"><path d="M16 2L22 8L16 14L10 8ZM2 16L8 10L14 16L8 22ZM18 16L24 10L30 16L24 22ZM16 18L22 24L16 30L10 24Z" fill="none" stroke="#d7bd76" stroke-width="1.5"/></svg></div></header>
 <div class="te-materials">${e.materials.map(m=>`<section class="te-material ${m.active?'is-active':'is-locked'}">${seal(m.id)}<h4>${escape(m.name)}</h4><strong>${Number(e.balances[m.id]||0)} <small>đang có</small></strong><p>${m.active?'Hạ Thanh Long: nhận 1 Nhân Long.':'Chưa mở · Chờ bổ sung boss.'}</p></section>`).join('')}</div>
 <div class="te-recipe"><div><h4>Đổi vũ khí Nhân Long</h4><p>20 Nhân Long → 1 vũ khí chính đúng class của bạn.</p></div><strong>${balance} / ${e.cost}<small>Nhân Long</small></strong></div>
 <div class="te-progress" role="progressbar" aria-label="Nhân Long để đổi vũ khí" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${Math.min(20,balance)}"><i style="width:${Math.min(100,100*balance/e.cost)}%"></i></div>
 <div class="te-weapons">${Object.entries(e.weapons).map(([code,w])=>`<section class="te-weapon ${code===state.data.classCode?'is-current':''}"><div>${tuLinhWeaponIcon(w.id,58)}<span>${escape(classes[code])}${code===state.data.classCode?' · Class của bạn':''}</span></div><h4>${escape(w.name)}</h4><p>Vũ khí chính · +${w.attack} công</p><small>${code===state.data.classCode?'Bạn sẽ nhận món này':'Dành cho class tương ứng'}</small></section>`).join('')}</div>
 <div class="te-actions"><p>${pending?'Có giao dịch đang chờ xác nhận. Bấm kiểm tra để hoàn tất.':balance<e.cost?`Cần thêm ${e.cost-balance} Nhân Long.`:error?escape(error):`Sẵn sàng nhận ${escape(owned?.name)}.`}<small>Linh vật lưu riêng trong Sự kiện. Vũ khí nhận vào balo.</small></p><button type="button" class="ga-primary" data-action="events-exchange" ${disabled?'disabled':''}>${system.busy?'Đang đổi…':pending?'Kiểm tra giao dịch':'Đổi 20 Nhân Long'}</button></div></article>`;
}
