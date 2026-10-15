import { WING_CATALOG, wingStyle, wingStats, nextStone } from '../data/wings.js';
import { wingIconURL } from '../world/WingTextures.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('vi-VN');
export const wingImage = (id,level=0,size=100) => `<img class="yw-icon" src="${wingIconURL(id,level)}" width="${size}" height="${Math.round(size*2/3)}" alt="${esc(wingStyle(id)?.name)}">`;
export function stoneIcon(stone, size=46) {
 return `<svg class="yw-stone-icon" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2L39 12 44 27 24 46 4 27 9 12Z" fill="#132d31" stroke="${stone.color}" stroke-width="2"/><path d="M24 5L36 14 31 27 24 41 16 27 12 14Z" fill="${stone.color}"/><path d="M12 14H36L24 23Z" fill="#e7fff7" opacity=".8"/><path d="M24 23L31 27 24 41Z" fill="#183849" opacity=".5"/><path d="M24 5V23L12 14Z" fill="#fff" opacity=".3"/><text x="24" y="32" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#132d31">${stone.tier}</text></svg>`;
}
function status(state) {
 return state.wingError ? `<div class="yw-notice error" role="alert">${esc(state.wingError)} <button data-action="wing-retry" ${state.wingBusy?'disabled':''}>Kiểm tra lại</button></div>`
 : !state.wingsLoaded ? '<div class="yw-notice" role="status">Đang tải bộ sưu tập cánh…</div>' : '';
}
export function wingEquipmentCard(state) {
 const wings=state.data.wings, own=wings?.collection?.find(w=>w.id===wings.equipped);
 return `<div class="rpg-equipment-slot yw-equipment ${own?'equipped':''}"><div class="rpg-equipment-header">${own?wingImage(own.id,own.level,64):'<span class="yw-empty-wing">✦</span>'}<div><div class="rpg-equipment-title">CÁNH</div><div class="rpg-equipment-name">${own?esc(wingStyle(own.id)?.name)+' +'+own.level:'Chưa trang bị'}</div></div></div><div class="rpg-equipment-footer"><span>${own?'Cánh đang mang trên nhân vật':'3 mẫu cánh cơ bản miễn phí'}</span><button data-action="tab" data-id="wings">Quản lý</button></div></div>`;
}
export function renderWingsPanel(hud) {
 const s=hud.state, w=s.data.wings;
 const selected=wingStyle(hud.wingSelected) || wingStyle(w?.equipped) || WING_CATALOG.styles[0];
 hud.wingSelected=selected.id;
 const own=w?.collection?.find(x=>x.id===selected.id), level=own?.level || 0;
 const equipped=w?.equipped===selected.id, max=level>=WING_CATALOG.maxLevel;
 const stone=nextStone(level), count=w?.materials?.[stone?.id] || 0;
 const current=wingStats(selected.id,level), next=wingStats(selected.id,Math.min(level+1,9));
 const busy=s.wingBusy, disabled=busy || !own || !s.wingsLoaded || Boolean(s.data.pendingWingAction);
 const canUpgrade=!disabled && !max && count>0;
 return `${status(s)}<div class="yw-layout">
  <section class="yw-showcase"><div class="yw-eyebrow">BỘ SƯU TẬP • YuNa</div><div class="yw-heading"><h3>${esc(selected.name)}</h3><span class="yw-level">+${level}</span></div>
   <div class="yw-stage" style="--wing-color:${selected.colors[2]}"><div class="yw-halo"></div><canvas class="rpg-character-preview" width="480" height="360" role="img" aria-label="Nhân vật thử ${esc(selected.name)}"></canvas><span class="yw-stage-label">${equipped?'ĐANG TRANG BỊ':'XEM TRƯỚC'}</span><button class="yw-turn" data-action="preview-turn">↔ Đổi hướng</button></div>
   <div class="yw-collection">${WING_CATALOG.styles.map(style=>{const o=w?.collection?.find(x=>x.id===style.id);return `<button class="yw-choice ${style.id===selected.id?'selected':''}" data-action="wing-select" data-id="${style.id}" aria-pressed="${style.id===selected.id}">${wingImage(style.id,o?.level||0,110)}<strong>${esc(style.name)}</strong><small>+${o?.level||0}${w?.equipped===style.id?' · Đang mặc':''}</small></button>`;}).join('')}</div>
   <button class="rpg-primary yw-equip" data-action="${equipped?'wing-unequip':'wing-equip'}" data-id="${selected.id}" ${disabled?'disabled':''}>${busy?'Đang lưu…':equipped?'Tháo cánh':'Trang bị '+esc(selected.name)}</button>
  </section>
  <section class="yw-upgrade"><div class="yw-eyebrow">NÂNG CẤP CÁNH</div><h3>${max?'Đã đạt sức mạnh tối đa':`Thức tỉnh cấp +${level+1}`}</h3><p class="yw-muted">${esc(selected.subtitle)}. Chỉ số của mẫu cánh này luôn có hiệu lực, kể cả khi tháo. Các mẫu đã sở hữu cộng dồn chỉ số.</p>
   <div class="yw-stats"><div class="yw-stat-label"><span>MẪU CÁNH NÀY</span><span>HIỆN TẠI</span><span>${max?'TỐI ĐA':'SAU NÂNG'}</span></div>${[['attack','Tấn công'],['defense','Phòng thủ'],['maxHP','HP tối đa']].map(([key,label])=>`<div class="yw-stat"><span>${label}</span><strong>+${current[key]}</strong><strong class="yw-next">${max?'—':'+'+next[key]}</strong></div>`).join('')}</div>
   <p class="yw-muted">Tổng bộ sưu tập: <strong>+${s.wingBonus('attack')} công · +${s.wingBonus('defense')} thủ · +${s.wingBonus('maxHP')} HP</strong>. Trang bị chỉ thay đổi ngoại hình.</p>
   <div class="yw-progress" aria-label="Cấp nâng ${level} trên 9">${Array.from({length:9},(_,i)=>`<span class="${i<level?'filled':''}"></span>`).join('')}</div>
   ${max?'<div class="yw-requirement"><strong>✦ Cánh +9</strong><p>Đôi cánh đã được nâng cấp hoàn chỉnh.</p></div>':`<div class="yw-requirement">${stoneIcon(stone,56)}<div><strong>${esc(stone.name)}</strong><p>Cần 1 viên · Đang có <b>${count}</b></p></div><span class="yw-chance">100%<small>THÀNH CÔNG</small></span></div>`}
   <button class="rpg-primary yw-upgrade-button" data-action="wing-upgrade" data-id="${selected.id}" ${canUpgrade?'':'disabled'}>${busy?'Đang lưu…':max?'Đã nâng tối đa':count<1?'Chưa đủ đá nâng cấp':`Nâng cấp lên +${level+1}`}</button>
   <p class="yw-muted yw-rule">+1–3: đá cấp 1 · +4–6: đá cấp 2 · +7–9: đá cấp 3.<br>Mỗi lần dùng 1 viên, không thu thêm vàng, không mất cấp.</p>
   <div class="yw-materials">${WING_CATALOG.stones.map(st=>`<div>${stoneIcon(st,32)}<span>Cấp ${st.tier}<strong>×${w?.materials?.[st.id]||0}</strong></span></div>`).join('')}</div>
   <p class="yw-footnote">Mua đá từ Vũ sư Airi trước nhà phía Tây Ngoại ô thành YuNa.</p>
  </section></div>`;
}
export function renderWingShop(hud) {
 const s=hud.state, w=s.data.wings;
 return `${status(s)}<header class="yw-shop-intro"><div><span class="yw-eyebrow">XƯỞNG CÁNH • NGOẠI Ô YuNa</span><h3>Vũ sư Airi</h3><p>Chọn viên đá phù hợp với cấp cánh bạn muốn nâng.</p></div><span class="yw-gold">● ${fmt(s.data.gold)} vàng</span></header>
 <div class="yw-shop-grid">${WING_CATALOG.stones.map((stone,i)=>{const owned=w?.materials?.[stone.id]||0;const disabled=s.wingBusy||!s.wingsLoaded||s.data.pendingWingAction||s.data.gold<stone.price||owned>=999;return `<article class="yw-shop-card" style="--stone-color:${stone.color}"><div class="yw-shop-art">${stoneIcon(stone,96)}</div><span class="yw-eyebrow">NGUYÊN LIỆU CẤP ${stone.tier}</span><h3>${esc(stone.name)}</h3><p>Dùng cho cánh +${i*3+1} đến +${i*3+3}.<br>Tiêu hao 1 viên mỗi lần nâng.</p><div class="yw-shop-owned">Trong kho: <strong>${owned} / 999</strong></div><div class="yw-shop-buy"><strong>● ${fmt(stone.price)}</strong><button class="rpg-primary" data-action="wing-buy" data-id="${stone.id}" ${disabled?'disabled':''}>${s.wingBusy?'Đang lưu…':s.data.gold<stone.price?'Thiếu vàng':'Mua 1 viên'}</button></div></article>`;}).join('')}</div>
 <div class="yw-shop-bottom"><span>Đá mua được lưu vào kho nguyên liệu cánh.</span><button data-action="tab" data-id="wings">Mở nâng cấp cánh →</button></div>`;
}
