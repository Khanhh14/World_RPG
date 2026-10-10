import { EQUIPMENT_SLOTS, SHOP_ITEMS, gearIcon } from '../data/items.js';
import { ITEMS, DESTINATIONS } from '../systems/RPGState.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = (frame, size = 40) => `<span class="rpg-icon" aria-hidden="true" style="width:${size}px;height:${size}px;background-size:${size*12}px ${size*11}px;background-position:-${frame%12*size}px -${Math.floor(frame/12)*size}px"></span>`;
const itemIcon = (item, size = 40) => item?.icon ? gearIcon(item.icon, item.level, size) : icon(item?.frame ?? 103, size);
const CSS = `
.rpg-ui .rpg-shop-modal{width:min(900px,100%)}.rpg-shop-filters{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.rpg-ui .rpg-shop-filters button.active{background:#b6985e;color:#182c21}.rpg-shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:16px}.rpg-shop-item{background:#10271f;border:1px solid #506449;border-radius:9px;padding:14px;display:flex;flex-direction:column;gap:10px}.rpg-shop-item header{display:flex;gap:12px;align-items:center}.rpg-shop-item h3{margin:0 0 5px;font-size:15px}.rpg-shop-item p{margin:0;flex:1}.rpg-shop-buy{display:flex;justify-content:space-between;align-items:center;gap:8px;color:#f6d67f}.rpg-tier{font-size:10px;color:#ebce85}.rpg-equipment>div{flex:1}.rpg-equipment button{padding:5px 8px;font-size:11px}.rpg-shop-gold{display:flex;justify-content:space-between;gap:10px;color:#f6d67f}.rpg-shop-item button{font-size:12px}
.rpg-ui{position:fixed;inset:0;z-index:30;pointer-events:none;font-family:Arial,sans-serif;color:#f3ebd4;font-size:14px;--panel:#152b25;--gold:#d9b66c;--muted:#a8bbae}
.rpg-ui *{box-sizing:border-box}.rpg-ui button{font:inherit;cursor:pointer;color:inherit;border:1px solid #607064;background:#253f32;border-radius:7px;padding:9px 12px}.rpg-ui button:hover{background:#36583f;border-color:var(--gold)}.rpg-ui button:focus-visible{outline:3px solid #ffe19c;outline-offset:2px}.rpg-ui button:disabled{opacity:.5;cursor:default}.rpg-ui .rpg-icon{display:inline-block;flex-shrink:0;background-image:url('assets/tiny-dungeon/Tilemap/tilemap_packed.png');background-repeat:no-repeat;image-rendering:pixelated}
.rpg-status{position:absolute;left:18px;top:18px;display:flex;gap:12px;padding:12px;width:310px;background:linear-gradient(135deg,#203c31f5,#112720f5);border:1px solid #9b8854;box-shadow:0 3px 0 #0e211bb0;border-radius:12px}
.rpg-portrait{position:relative;align-self:flex-start;width:61px;height:70px;display:grid;place-items:center;background:#2f4b3b;border:2px solid #d9b66c;border-radius:8px}.rpg-level{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:bold;background:#d9b66c;color:#172a20;padding:3px 7px;border-radius:5px}
.rpg-meters{flex:1;min-width:0}.rpg-name{font-weight:bold;margin:0 0 7px;font-size:14px;letter-spacing:.2px}.rpg-bar{height:17px;margin-top:5px;border-radius:4px;overflow:hidden;background:#091c19;border:1px solid #415448;position:relative}.rpg-fill{height:100%;transition:width .2s}.rpg-bar.hp .rpg-fill{background:linear-gradient(#e67468,#b74342)}.rpg-bar.mp .rpg-fill{background:linear-gradient(#71b8d9,#40789c)}.rpg-bar.xp{height:12px}.rpg-bar.xp .rpg-fill{background:linear-gradient(#ecd08c,#bf9650)}.rpg-bar-label{position:absolute;inset:0;text-align:center;font-size:10px;font-weight:bold;line-height:15px;color:#fff;text-shadow:0 1px 2px #000}.rpg-bar.xp .rpg-bar-label{font-size:9px;line-height:10px}.rpg-location{position:absolute;right:18px;top:18px;text-align:right;max-width:44%;font-size:13px}.rpg-location-name,.rpg-gold{display:block;width:fit-content;margin-left:auto;padding:9px 12px;background:#172d25ed;border:1px solid #60725d;border-radius:7px}.rpg-gold{margin-top:7px;color:#f6d67f}.rpg-nav{position:absolute;left:18px;bottom:20px;display:flex;gap:7px;pointer-events:auto}.rpg-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:64px;background:#152b25ed;box-shadow:0 2px 0 #102018;position:relative}.rpg-nav kbd{font:11px Arial;color:#dcc996}.rpg-dot{position:absolute;right:7px;top:5px;width:8px;height:8px;background:#f3cb68;border-radius:50%}.rpg-ui.talking .rpg-nav{display:none}
.rpg-overlay{position:absolute;inset:0;background:#0817109e;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:18px}.rpg-overlay[hidden]{display:none}.rpg-modal{width:min(740px,100%);max-height:calc(100dvh - 36px);overflow:auto;background:linear-gradient(145deg,#213b30,#11261f);border:2px solid #b89a60;border-radius:14px;box-shadow:0 16px 80px #0008;padding:20px}.rpg-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.rpg-modal h2{font-size:22px;margin:0}.rpg-modal h3{font-size:16px;margin:0 0 12px}.rpg-subtle{color:var(--muted);font-size:12px;line-height:1.65}.rpg-tabs{display:flex;gap:6px;border-bottom:1px solid #4d604b;padding-bottom:12px;margin-bottom:18px;flex-wrap:wrap}.rpg-tabs button{font-size:12px;padding:7px 10px}.rpg-tabs button.active{background:#b6985e;color:#182c21;border-color:#e4c585;font-weight:bold}
.rpg-bag-layout{display:grid;grid-template-columns:minmax(0,1fr) 215px;gap:18px}.rpg-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;align-content:start}.rpg-ui .rpg-slot{position:relative;aspect-ratio:1;padding:2px;min-width:0;background:#10281f;border:1px solid #51634c;border-radius:6px;display:grid;place-items:center}.rpg-ui .rpg-slot.selected{border:2px solid #e6ca83;background:#314d35}.rpg-slot.empty{opacity:.45}.rpg-qty{position:absolute;right:4px;bottom:2px;font-size:11px;text-shadow:0 1px 2px #000}.rpg-equipped{position:absolute;left:3px;top:3px;color:#f4d274;font-size:9px}.rpg-item-info{min-height:230px;background:#10271f;border:1px solid #4c604b;border-radius:9px;padding:16px}.rpg-item-info h3{margin:12px 0 5px}.rpg-item-info p{line-height:1.65;color:#c1cbb9;font-size:13px}.rpg-ui .rpg-primary{background:#b99b61;border-color:#e2c27e;color:#12271d;font-weight:bold}.rpg-item-info .rpg-primary{width:100%;margin-top:9px}.rpg-bag-footer{display:flex;justify-content:space-between;margin-top:14px;font-size:12px;color:#b4c1af}
.rpg-character{display:grid;grid-template-columns:1fr 1fr;gap:18px}.rpg-character-card{background:#10271f;border:1px solid #48604b;border-radius:9px;padding:18px}.rpg-character-hero{display:flex;gap:16px;align-items:center;margin-bottom:16px}.rpg-stat-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #314b38}.rpg-stat-row:last-child{border:0}.rpg-equipment{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #314b38}.rpg-quest{padding:20px;background:#10271f;border:1px solid #49634d;border-radius:9px}.rpg-quest ul{list-style:none;padding:0;margin:16px 0}.rpg-quest li{padding:9px 0;color:#b2c3b3}.rpg-quest li.done{color:#c7df99}.rpg-rewards{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-top:1px solid #3c5541;padding-top:16px;color:#e5c879}.rpg-help{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rpg-help div{padding:13px;background:#10271f;border-radius:7px;line-height:1.6}.rpg-help kbd{display:block;color:#f1d18b;font-weight:bold}.rpg-toast{position:absolute;left:50%;top:145px;transform:translateX(-50%);max-width:90%;padding:11px 18px;border:1px solid #b59c65;background:#10271ff5;border-radius:8px;text-align:center;z-index:2;box-shadow:0 3px 12px #0005}.rpg-toast[hidden]{display:none}
@media(max-width:700px){.rpg-status{width:274px;left:10px;top:10px;padding:9px;gap:9px}.rpg-location{top:10px;right:10px;max-width:35%;font-size:11px}.rpg-nav{left:10px;bottom:12px;gap:4px}.rpg-nav button{min-width:49px;padding:7px;font-size:11px}.rpg-modal{padding:14px}.rpg-bag-layout{grid-template-columns:1fr}.rpg-item-info{min-height:0}.rpg-item-info>.rpg-icon{float:left;margin-right:12px}.rpg-grid{grid-template-columns:repeat(6,1fr)}.rpg-character{grid-template-columns:1fr}.rpg-toast{top:125px}}
@media(max-width:430px){.rpg-location-name{display:none}.rpg-status{width:265px}.rpg-location{max-width:90px}.rpg-gold{padding:7px}.rpg-help{grid-template-columns:1fr}}
`;

export class RPGHUD {
    constructor(scene, state, mapTitle) {
        this.scene = scene; this.state = state; this.mapTitle = mapTitle;
        this.tab = null; this.selected = 'health_potion'; this.destroyed = false;
        if (!document.getElementById('tiny-rpg-hud-style')) {
            const style = document.createElement('style'); style.id = 'tiny-rpg-hud-style';
            style.textContent = CSS; document.head.appendChild(style);
        }
        this.root = document.createElement('div'); this.root.className = 'rpg-ui';
        this.root.innerHTML = '<div class="rpg-overview"></div><nav class="rpg-nav" aria-label="Menu nhân vật"></nav><div class="rpg-overlay" hidden><section class="rpg-modal" role="dialog" aria-modal="true" aria-labelledby="rpg-modal-title"></section></div><div class="rpg-toast" role="status" hidden></div>';
        document.body.appendChild(this.root);
        this.overlay = this.root.querySelector('.rpg-overlay');
        this.modal = this.root.querySelector('.rpg-modal');
        this.onClick = event => {
            const button = event.target.closest('button[data-action]');
            if (!button || !this.root.contains(button) || button.disabled) return;
            const { action, id } = button.dataset;
            if (action === 'tab' && !(button.closest('.rpg-tabs') && this.tab === id)) this.toggle(id);
            if (action === 'close') this.close();
            if (action === 'select') { this.selected = id; this.renderModal(); }
            if (action === 'use') this.toast(this.state.useItem(this.selected));
            if (action === 'buy' && this.shopNPC && this.scene.dialogue?.nearest() === this.shopNPC) this.toast(this.state.buyItem(id).message);
            if (action === 'unequip') this.toast(this.state.useItem(id));
            if (action === 'filter') { this.shopCategory = id; this.renderModal(); }
            if (action === 'tier') { this.shopLevel = Number(id); this.renderModal(); }
            if (action === 'claim') this.toast(this.state.claimExploration());
        };
        this.onKey = event => {
            if (this.destroyed || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
            const key = event.key.toLowerCase();
            const tabs = { b: 'bag', c: 'character', j: 'quests', h: 'help' };
            if (tabs[key]) { event.preventDefault(); this.toggle(tabs[key]); }
            else if (key === 'escape' && this.tab) { event.preventDefault(); this.close(); }
            else if (key === 'tab' && this.tab) {
                const buttons = [...this.modal.querySelectorAll('button:not(:disabled)')];
                const first = buttons[0], last = buttons.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        };
        this.root.addEventListener('click', this.onClick);
        window.addEventListener('keydown', this.onKey);
        this.unsubscribe = state.subscribe(() => this.render());
        this.render();
    }
    get blocked() { return Boolean(this.tab); }
    bar(kind, label, value, max) {
        return `<div class="rpg-bar ${kind}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><div class="rpg-fill" style="width:${Math.max(0,Math.min(100,value/max*100))}%"></div><span class="rpg-bar-label">${label} ${value} / ${max}</span></div>`;
    }
    render() {
        const s = this.state, d = s.data;
        this.root.querySelector('.rpg-overview').innerHTML = `<div class="rpg-status"><div class="rpg-portrait">${icon(96,48)}<span class="rpg-level">LV ${d.level}</span></div><div class="rpg-meters"><div class="rpg-name">Lữ khách</div>${this.bar('hp','HP',d.hp,s.maxHP)}${this.bar('mp','MP',d.mp,s.maxMP)}${this.bar('xp','EXP',d.exp,s.expNeeded)}</div></div><div class="rpg-location"><span class="rpg-location-name">${escape(this.mapTitle)}</span><span class="rpg-gold">● ${d.gold.toLocaleString('vi-VN')} vàng</span></div>`;
        this.root.querySelector('.rpg-nav').innerHTML = [['bag','Ba lô','B'],['character','Nhân vật','C'],['quests','Nhiệm vụ','J'],['help','Hướng dẫn','H']].map(([id,name,key]) => `<button type="button" data-action="tab" data-id="${id}" aria-label="${name} (${key})"><span>${name}</span><kbd>${key}</kbd>${id==='quests' && s.explorationReady && !d.explorationClaimed?'<i class="rpg-dot"></i>':''}</button>`).join('');
        if (this.tab) this.renderModal();
    }
    openShop(npc) {
        if (!npc?.isMerchant || this.scene.dialogue?.nearest() !== npc) return;
        this.shopNPC = npc; this.shopCategory = 'all'; this.shopLevel = 0;
        this.toggle('shop');
    }
    toggle(tab) {
        if (tab === 'shop' && (!this.shopNPC || this.scene.dialogue?.nearest() !== this.shopNPC)) return;
        if (this.scene.dialogue?.isOpen) { this.toast('Kết thúc hội thoại để mở menu.'); return; }
        if (this.tab === tab) { this.close(); return; }
        if (!this.tab) {
            this.previousFocus = document.activeElement;
            this.keyboardWasEnabled = this.scene.input.keyboard.enabled;
            this.scene.input.keyboard.enabled = false;
            this.scene.input.keyboard.resetKeys();
        }
        this.tab = tab; this.overlay.hidden = false;
        this.scene.player?.stop();
        this.scene.dialogueUI?.actionBar?.setVisible(false);
        this.renderModal(); this.modal.querySelector('button')?.focus();
    }
    close() {
        if (!this.tab) return;
        this.tab = null; this.shopNPC = null; this.overlay.hidden = true;
        this.scene.input.keyboard.resetKeys();
        this.scene.input.keyboard.enabled = this.keyboardWasEnabled;
        if (!this.scene.dialogue?.isOpen) this.scene.dialogueUI?.actionBar?.setVisible(true);
        if (this.previousFocus?.isConnected) this.previousFocus.focus();
    }
    renderModal() {
        const focus = document.activeElement?.closest('button');
        const focusAction = focus?.dataset.action, focusId = focus?.dataset.id;
        const names = { bag:'Ba lô',character:'Nhân vật',quests:'Nhật ký nhiệm vụ',help:'Hướng dẫn' };
        if (this.shopNPC) names.shop = 'Cửa hàng';
        this.modal.classList.toggle('rpg-shop-modal', this.tab === 'shop');
        this.modal.innerHTML = `<header class="rpg-modal-header"><h2 id="rpg-modal-title">${names[this.tab]}</h2><button type="button" data-action="close" aria-label="Đóng menu">✕ <small>Esc</small></button></header><div class="rpg-tabs">${Object.entries(names).map(([id,name])=>`<button type="button" data-action="tab" data-id="${id}" class="${id===this.tab?'active':''}">${name}</button>`).join('')}</div>${this.content()}`;
        if (focus && this.root.contains(focus) === false && focusAction) {
            [...this.modal.querySelectorAll('button')].find(button=>button.dataset.action===focusAction && button.dataset.id===focusId)?.focus();
        }
    }
    content() {
        const s = this.state, d = s.data;
        if (this.tab === 'shop') return this.shopContent();
        if (this.tab === 'bag') {
            const ids = Object.keys(ITEMS).filter(id => d.inventory[id] > 0);
            if (!ids.includes(this.selected)) this.selected = ids[0] ?? null;
            const item = ITEMS[this.selected], equipped = item && d.equipment[item.type] === this.selected;
            const slots = Array.from({length:24},(_,index)=> {
                const id=ids[index];
                if (!id) return '<div class="rpg-slot empty" aria-hidden="true"></div>';
                const value=ITEMS[id], worn=d.equipment[value.type]===id;
                return `<button type="button" data-action="select" data-id="${id}" class="rpg-slot ${id===this.selected?'selected':''}" aria-label="${value.name}, ${d.inventory[id]}${worn?', đang trang bị':''}">${itemIcon(value,36)}<span class="rpg-qty">${d.inventory[id]}</span>${worn?'<span class="rpg-equipped">ĐANG ĐEO</span>':''}</button>`;
            }).join('');
            return `<div class="rpg-bag-layout"><div class="rpg-grid">${slots}</div><aside class="rpg-item-info">${item?`${itemIcon(item,56)}<h3>${item.name}</h3><p>${item.description}</p><p class="rpg-subtle">Số lượng: ${d.inventory[this.selected]}</p><button type="button" class="rpg-primary" data-action="use">${item.type==='consumable'?'Sử dụng':equipped?'Tháo trang bị':'Trang bị'}</button>`:'Ba lô đang trống.'}</aside></div><div class="rpg-bag-footer"><span>${ids.length}/24 ô · Vật phẩm cùng loại xếp chồng</span><span>● ${d.gold} vàng</span></div>`;
        }
        if (this.tab === 'character') return `<div class="rpg-character"><div class="rpg-character-card"><div class="rpg-character-hero">${icon(96,64)}<div><h3>Lữ khách · Cấp ${d.level}</h3><div class="rpg-subtle">Nhà thám hiểm</div></div></div>${[['Máu',`${d.hp} / ${s.maxHP}`],['Năng lượng',`${d.mp} / ${s.maxMP}`],['Công',s.attack],['Thủ',s.defense],['EXP cấp tiếp theo',`${d.exp} / ${s.expNeeded}`]].map(([name,value])=>`<div class="rpg-stat-row"><span>${name}</span><strong>${value}</strong></div>`).join('')}</div><div class="rpg-character-card"><h3>Trang bị</h3>${EQUIPMENT_SLOTS.map(([slot,name,frame])=>`<div class="rpg-equipment">${itemIcon(ITEMS[d.equipment[slot]] ?? (frame === null ? {icon:slot,level:1} : {frame}))}<div><div class="rpg-subtle">${name}</div>${ITEMS[d.equipment[slot]]?.name??'Chưa trang bị'}</div>${d.equipment[slot]?`<button data-action="unequip" data-id="${d.equipment[slot]}">Tháo</button>`:''}</div>`).join('')}<p class="rpg-subtle">Chọn vật phẩm trong ba lô để trang bị. Chỉ số công và thủ dành cho hệ thống chiến đấu sau này.</p></div></div>`;
        if (this.tab === 'quests') return `<article class="rpg-quest"><h3>Những bước chân đầu tiên</h3><p class="rpg-subtle">Khám phá ba khu vực bằng các cổng dịch chuyển.</p><ul>${DESTINATIONS.map(([id,name])=>`<li class="${d.visited.includes(id)?'done':''}">${d.visited.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul><div class="rpg-rewards"><span>120 EXP · 30 vàng</span><button type="button" class="rpg-primary" data-action="claim" ${!s.explorationReady||d.explorationClaimed?'disabled':''}>${d.explorationClaimed?'Đã nhận thưởng':s.explorationReady?'Nhận thưởng':`${d.visited.length}/3 khu vực`}</button></div></article>`;
        return `<div class="rpg-help">${[['W A S D / Phím mũi tên','Di chuyển nhân vật'],['E / Esc','Trò chuyện, mở cửa hàng / đóng menu'],['B','Mở hoặc đóng ba lô'],['C','Xem chỉ số và trang bị'],['J','Theo dõi nhiệm vụ khám phá'],['H / Esc','Mở hướng dẫn / đóng menu']].map(([key,description])=>`<div><kbd>${key}</kbd>${description}</div>`).join('')}</div><p class="rpg-subtle">Bước vào cổng để đổi khu vực. Các ô kỹ năng 1–3 chưa có kỹ năng chiến đấu. Tiến trình được tự lưu trong trình duyệt nếu bộ nhớ cục bộ được cho phép.</p>`;
    }
    shopContent() {
        const s = this.state, d = s.data;
        const ids = SHOP_ITEMS.filter(id => (this.shopCategory === 'all' || ITEMS[id].category === this.shopCategory) && (!this.shopLevel || ITEMS[id].level === this.shopLevel));
        return `<div class="rpg-shop-gold"><strong>${escape(this.shopNPC?.name ?? 'Thương nhân')}</strong><span>● ${d.gold.toLocaleString('vi-VN')} vàng</span></div>
        <div class="rpg-shop-filters" aria-label="Loại vật phẩm">${[['all','Tất cả'],['weapon','Vũ khí'],['gear','Khiên & giáp'],['hp','Bình máu'],['mp','Bình mana']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${this.shopCategory===id?'active':''}">${label}</button>`).join('')}</div>
        <div class="rpg-shop-filters" aria-label="Cấp vật phẩm">${[0,1,2,3,4,5].map(level=>`<button data-action="tier" data-id="${level}" class="${this.shopLevel===level?'active':''}">${level?'Cấp '+level:'Mọi cấp'}</button>`).join('')}</div>
        <div class="rpg-subtle">Cấp vật phẩm thể hiện sức mạnh, không yêu cầu cấp nhân vật. Mua xong, mở Ba lô để dùng hoặc trang bị.</div>
        <div class="rpg-shop-grid">${ids.map(id=>{
            const item=ITEMS[id], check=s.canBuy(id);
            return `<article class="rpg-shop-item"><header>${itemIcon(item,44)}<div><h3>${item.name}</h3><span class="rpg-tier">CẤP ${item.level} · Đang có: ${d.inventory[id]??0}</span></div></header><p class="rpg-subtle">${item.description}</p><div class="rpg-shop-buy"><strong>● ${item.price} vàng</strong><button data-action="buy" data-id="${id}" ${check.ok?'class="rpg-primary"':'disabled'} title="${escape(check.message)}">${check.ok?'Mua 1':item.maxStack===1 && d.inventory[id]?'Đã sở hữu':check.message}</button></div></article>`;
        }).join('')}</div>`;
    }
    syncDialogue(open) { this.root.classList.toggle('talking', open); }
    toast(message) {
        const node = this.root.querySelector('.rpg-toast'); node.textContent=message;node.hidden=false;
        clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{node.hidden=true;},2800);
    }
    destroy() {
        if (this.destroyed) return;
        this.close();this.destroyed=true;this.unsubscribe();clearTimeout(this.toastTimer);
        window.removeEventListener('keydown',this.onKey);this.root.removeEventListener('click',this.onClick);this.root.remove();
    }
}
