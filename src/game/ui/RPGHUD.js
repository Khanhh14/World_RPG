import { MAX_ENHANCEMENT, enhancedItem } from '../data/enhancement.js';
import { renderSkillsPanel, renderSkillShop } from './SkillsPanel.js';
import { renderWingsPanel, renderWingShop, wingEquipmentCard } from './WingsPanel.js';
import { drawWingPixels } from '../world/WingTextures.js';
import { EQUIPMENT_SLOTS, SHOP_ITEMS, MONSTER_MATERIALS, gearIcon } from '../data/items.js';
import { ITEMS } from '../systems/RPGState.js';
import { renderQuestJournal } from './QuestJournal.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = (frame, size = 40) => `<span class="rpg-icon" aria-hidden="true" style="width:${size}px;height:${size}px;background-size:${size*12}px ${size*11}px;background-position:-${frame%12*size}px -${Math.floor(frame/12)*size}px"></span>`;
const itemIcon = (item, size = 40) => item?.emoji
    ? `<span class="rpg-item-emoji" role="img" aria-label="${escape(item.name)}" style="font-size:${size * 0.72}px;line-height:1">${item.emoji}</span>`
    : item?.icon ? gearIcon(item.icon, item.level, size) : icon(item?.frame ?? 103, size);
export class RPGHUD {
    constructor(scene, state, mapTitle) {
        this.scene = scene; this.state = state; this.mapTitle = mapTitle;
        // Tiền tệ mới: dữ liệu cũ chưa có đá quý được hiển thị là 0.
        // RPGState/backend nên lưu trường gems cùng dữ liệu nhân vật.
        if (!Number.isFinite(Number(state.data.gems)) || Number(state.data.gems) < 0) state.data.gems = 0;
        else state.data.gems = Math.floor(Number(state.data.gems));
        this.previewId = null; this.previewLeft = false;
        if (!document.querySelector('link[data-enhancement]')) {
            const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/style/enhancement.css?v=1';css.dataset.enhancement='true';document.head.appendChild(css);
        }
        if (!document.querySelector('link[data-skill-books]')) {
            const link = document.createElement('link'); link.rel = 'stylesheet';
            link.href = '/assets/style/skills.css?v=1'; link.dataset.skillBooks = 'true'; document.head.appendChild(link);
        }
        if (!document.querySelector('link[data-yuna-wings]')) {
            const wingCSS = document.createElement('link'); wingCSS.rel = 'stylesheet';
            wingCSS.href = '/assets/style/wings.css?v=yuna-1'; wingCSS.dataset.yunaWings = 'true'; document.head.appendChild(wingCSS);
        }
        this.tab = null; this.selected = 'health_potion'; this.destroyed = false;
        // CSS đặt trong public/assets/style, tự nạp nếu index.html chưa nạp.
        const stylesheet = '/assets/style/RPGHUD.css';
        let link = [...document.querySelectorAll('link[rel="stylesheet"]')]
            .find(node => new URL(node.href, document.baseURI).pathname === stylesheet);
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        // Đổi phiên bản để trình duyệt tải CSS mới sau khi thay file.
        const href = stylesheet + '?v=rpg-quest-board-2';
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
        this.root = document.createElement('div'); this.root.className = 'rpg-ui';
        this.root.innerHTML = '<div class="rpg-overview"></div><nav class="rpg-nav" aria-label="Menu nhân vật"></nav><div class="rpg-overlay" hidden><section class="rpg-modal" role="dialog" aria-modal="true" aria-labelledby="rpg-modal-title"></section></div><div class="rpg-toast" role="status" hidden></div>';
        document.body.appendChild(this.root);
        this.overlay = this.root.querySelector('.rpg-overlay');
        this.modal = this.root.querySelector('.rpg-modal');
        this.onClick = async event => {
            const button = event.target.closest('button[data-action]');
            if (!button || !this.root.contains(button) || button.disabled) return;
            const { action, id } = button.dataset;
            if (action === 'tab' && !(button.closest('.rpg-tabs') && this.tab === id)) this.toggle(id);
            if (action === 'close') this.close();
            if (action === 'skill-slot') { this.skillSlot = Number(id); this.renderModal(); }
            if (action === 'skill-school') { this.skillSchool = id; this.renderModal(); }
            if (action === 'book-school') { this.bookSchool = id; this.renderModal(); }
            if (action === 'skill-retry') await this.scene.skillsSystem?.load();
            if (action === 'skill-buy' && this.skillNPC && this.scene.dialogue?.nearest() === this.skillNPC) await this.scene.skillsSystem?.perform('buy', {skillId:id});
            if (action === 'skill-assign') await this.scene.skillsSystem?.perform('assign', {skillId:id,slot:this.skillSlot ?? 0});
            if (action === 'skill-clear') await this.scene.skillsSystem?.perform('assign', {skillId:null,slot:Number(id)});
            if (action === 'wing-select') { this.wingSelected = id; this.renderModal(); }
            if (action === 'wing-retry') await this.scene.wingsSystem?.load();
            if (action === 'wing-buy' && this.wingNPC && this.scene.dialogue?.nearest() === this.wingNPC) await this.scene.wingsSystem?.perform('buy', { itemId: id });
            if (action === 'wing-equip') await this.scene.wingsSystem?.perform('equip', { wingId: id });
            if (action === 'wing-unequip') await this.scene.wingsSystem?.perform('equip', { wingId: null });
            if (action === 'wing-upgrade') {
                const owned = this.state.data.wings?.collection?.find(item => item.id === id);
                if (owned) await this.scene.wingsSystem?.perform('upgrade', { wingId: id, expectedLevel: owned.level });
            }
            if (action === 'select') { this.selected = id; this.previewId = null; this.renderModal(); }
            if (action === 'preview') { this.previewId = this.selected; this.renderModal(); }
            if (action === 'preview-reset') { this.previewId = null; this.renderModal(); }
            if (action === 'preview-turn') { this.previewLeft = !this.previewLeft; this.drawCharacterPreview(); }
            if (action === 'use') { this.previewId = null; this.toast(this.state.useItem(this.selected)); this.render(); }
            if (action === 'buy' && this.shopNPC && this.scene.dialogue?.nearest() === this.shopNPC) {
                const result = await this.state.buyItem(id);
                if (this.destroyed) return;
                this.toast(result.message);
                const item = ITEMS[id];
                if (result.ok && item?.type === 'consumable' && ['hp','mp'].includes(item.category)) {
                    this.scene.dialogueUI?.actionBar?.selectPotion(item.category, id);
                }
            }
            if (action === 'exchange-materials' && this.exchangeNPC && this.scene.dialogue?.nearest() === this.exchangeNPC) {
                this.toast(this.state.exchangeMonsterMaterials().message);
            }
            if (action === 'enhance') {
                const result=this.state.upgradeEquipment(id, Number(button.dataset.level));
                this.toast(result.message);this.render();
            }
            if (action === 'unequip') {
                const slot = ITEMS[id]?.type;
                if (slot && this.state.data.equipment[slot] === id) {
                    this.previewId = null; this.selected = id;
                    this.toast(this.state.useItem(id)); this.render();
                }
            }
            if (action === 'filter') { this.shopCategory = id; this.renderModal(); }
            if (action === 'tier') { this.shopLevel = Number(id); this.renderModal(); }
            if (action === 'claim') void this.claimQuest(id);
            if (action === 'quest-retry') this.scene.questSystem?.retry();
        };
        this.onKey = event => {
            if (this.destroyed || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
            const key = event.key.toLowerCase();
            const tabs = { b: 'inventory', j: 'quests', c: 'skills' };
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
        return `<div class="rpg-bar ${kind}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><div class="rpg-fill" style="width:${Math.max(0,Math.min(100,(max > 0 ? value/max*100 : 0)))}%"></div><span class="rpg-bar-label">${label} ${value} / ${max}</span></div>`;
    }
    render() {
        const s = this.state, d = s.data;
        this.scene.player?.updateEquipment?.(d.equipment.weapon, d.equipment.shield);
        const quests = Array.isArray(d.quests) ? d.quests : [];
        const activeQuest = quests.find(quest => quest.status !== 'claimed');
        const trackerContent = activeQuest ? (() => {
            const quest = activeQuest;
            const current = quest.objective.current;
            const target = quest.objective.target;
            const percent = target > 0 ? Math.min(100, current / target * 100) : 0;
            const complete = quest.status === 'completed';
            return `<div class="rpg-quest-tracker-card">
                <span class="rpg-quest-tracker-step">NHIỆM VỤ HIỆN TẠI</span>
                <strong class="rpg-quest-tracker-name">${escape(quest.name)}</strong>
                <p>${escape(quest.description)}</p>
                <div class="rpg-quest-tracker-objective"><span>${escape(quest.objective.label)}</span><strong>${current} / ${target}</strong></div>
                <div class="rpg-quest-tracker-progress" role="progressbar" aria-label="${escape(quest.name)}" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${current}"><i style="width:${percent}%"></i></div>
                <div class="rpg-quest-tracker-footer"><span>✦ ${quest.reward.exp} EXP · ${quest.reward.gold} vàng</span>
                    ${complete ? `<button type="button" data-action="claim" data-id="${escape(quest.id)}">Nhận thưởng</button>` : '<span class="rpg-quest-tracker-hint">Hoàn thành để mở nhiệm vụ tiếp theo</span>'}
                </div>
            </div>`;
        })() : `<p class="rpg-quest-tracker-message">${escape(d.questLoadStatus === 'error' ? d.questLoadError : 'Đang tải nhiệm vụ…')}</p>${d.questLoadStatus === 'error' ? '<button type="button" data-action="quest-retry">Tải lại</button>' : ''}`;
        const tracker = `<section class="rpg-quest-tracker" aria-label="Nhiệm vụ và tiến độ">${trackerContent}</section>`;
        this.root.querySelector('.rpg-overview').innerHTML = `<div class="rpg-status"><div class="rpg-portrait">${icon(96,48)}<span class="rpg-level">LV ${d.level}</span></div><div class="rpg-meters"><div class="rpg-name">${escape(d.name || 'Lữ khách')}</div>${this.bar('hp','HP',d.hp,s.maxHP)}${this.bar('mp','MP',d.mp,s.maxMP)}${this.bar('xp','EXP',d.exp,s.expNeeded)}</div></div>${tracker}<div class="rpg-location"><span class="rpg-location-name">${escape(this.mapTitle)}</span><span class="rpg-gold">● ${d.gold.toLocaleString('vi-VN')} vàng</span></div>`;
        this.root.querySelector('.rpg-nav').innerHTML = [['inventory','Túi đồ','B'],['quests','Nhiệm vụ','J'],['skills','Kỹ năng','C']].map(([id,name,key]) => `<button type="button" data-action="tab" data-id="${id}" aria-label="${name} (${key})"><span>${name}</span><kbd>${key}</kbd>${id==='quests' && d.quests?.some(quest => quest.status === 'completed')?'<i class="rpg-dot"></i>':''}</button>`).join('');
        if (this.tab) this.renderModal();
    }
    async claimQuest(questId) {
        if (this.claimingQuest || !questId) return;
        this.claimingQuest = true;
        try { this.toast(await this.scene.questSystem.claim(questId)); }
        catch (error) { this.toast(error.message); }
        finally { this.claimingQuest = false; }
    }
    openShop(npc) {
        if (!npc?.isMerchant || this.scene.dialogue?.nearest() !== npc) return;
        this.shopNPC = npc; this.shopCategory = 'all'; this.shopLevel = 0;
        this.toggle('shop');
    }
    openSkillShop(npc) {
        if (npc?.role !== 'skill-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.skillNPC = npc; this.bookSchool = 'god'; this.toggle('skill-shop');
        void this.scene.skillsSystem?.load();
    }
    openWingShop(npc) {
        if (npc?.role !== 'wing-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.wingNPC = npc; this.toggle('wing-shop');
        void this.scene.wingsSystem?.load();
    }
    openExchange(npc) {
        if (npc?.role !== 'monster-material-exchange' || this.scene.dialogue?.nearest() !== npc) return;
        this.exchangeNPC = npc;
        this.toggle('exchange');
    }
    toggle(tab) {
        if (tab === 'skill-shop' && (!this.skillNPC || this.scene.dialogue?.nearest() !== this.skillNPC)) return;
        if (tab === 'wing-shop' && (!this.wingNPC || this.scene.dialogue?.nearest() !== this.wingNPC)) return;
        if (tab === 'shop' && (!this.shopNPC || this.scene.dialogue?.nearest() !== this.shopNPC)) return;
        if (tab === 'exchange' && (!this.exchangeNPC || this.scene.dialogue?.nearest() !== this.exchangeNPC)) return;
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
        this.previewId = null; this.tab = null; this.shopNPC = null; this.exchangeNPC = null; this.wingNPC = null; this.skillNPC = null; this.overlay.hidden = true;
        this.scene.input.keyboard.resetKeys();
        this.scene.input.keyboard.enabled = this.keyboardWasEnabled;
        if (!this.scene.dialogue?.isOpen) this.scene.dialogueUI?.actionBar?.setVisible(true);
        if (this.previousFocus?.isConnected) this.previousFocus.focus();
    }
    renderModal() {
        const focus = document.activeElement?.closest('button');
        const focusWasInside = focus && this.modal.contains(focus);
        const scrollTop = this.modal.scrollTop;
        const focusAction = focus?.dataset.action, focusId = focus?.dataset.id;
        const names = this.tab === 'quests'
            ? { quests: 'Nhật ký nhiệm vụ' }
            : { inventory: 'Túi đồ & Trang bị', potential: 'Tiềm Năng', wings: 'Nâng cấp cánh', skills: 'Kỹ năng' };
        if (this.skillNPC && this.tab !== 'quests') names['skill-shop'] = 'Sách kỹ năng';
        if (this.wingNPC && this.tab !== 'quests') names['wing-shop'] = 'Đá nâng cấp cánh';
        if (this.shopNPC && this.tab !== 'quests') names.shop = 'Cửa hàng';
        if (this.exchangeNPC && this.tab === 'exchange') names.exchange = 'Đổi vật phẩm quái';
        const tabs = this.tab === 'quests' ? '' : `<div class="rpg-tabs">${Object.entries(names).map(([id, name]) => `<button type="button" data-action="tab" data-id="${id}" class="${id === this.tab ? 'active' : ''}">${name}</button>`).join('')}</div>`;
        this.modal.classList.toggle('rpg-skills-modal', this.tab === 'skills');
        this.modal.classList.toggle('rpg-skill-shop-modal', this.tab === 'skill-shop');
        this.modal.classList.toggle('rpg-wing-modal', this.tab === 'wings');
        this.modal.classList.toggle('rpg-wing-shop-modal', this.tab === 'wing-shop');
        this.modal.classList.toggle('rpg-shop-modal', this.tab === 'shop');
        this.modal.classList.toggle('rpg-inventory-modal', this.tab === 'inventory');
        this.modal.classList.toggle('rpg-potential-modal', this.tab === 'potential');
        this.modal.classList.toggle('rpg-quests-modal', this.tab === 'quests');
        this.modal.classList.toggle('rpg-exchange-modal', this.tab === 'exchange');
        this.modal.innerHTML = `<header class="rpg-modal-header"><h2 id="rpg-modal-title">${names[this.tab]}</h2><button type="button" data-action="close" aria-label="Đóng menu">✕ <small>Esc</small></button></header>${tabs}${this.content()}`;
        this.drawCharacterPreview();
        if (focusWasInside && focusAction) {
            [...this.modal.querySelectorAll('button')].find(button=>button.dataset.action===focusAction && button.dataset.id===focusId)?.focus({ preventScroll: true });
        }
        this.modal.scrollTop = scrollTop;
    }
    content() {
        const s = this.state, d = s.data;
        if (this.tab === 'skills') return renderSkillsPanel(this);
        if (this.tab === 'skill-shop') return renderSkillShop(this);
        if (this.tab === 'wings') return renderWingsPanel(this);
        if (this.tab === 'wing-shop') return renderWingShop(this);
        if (this.tab === 'shop') return this.shopContent();
        if (this.tab === 'exchange') return this.exchangeContent();
        if (this.tab === 'inventory') {
            return this.inventoryContent();
        }
        if (this.tab === 'quests') return renderQuestJournal(this.state);
        if (this.tab === 'potential') return this.potentialContent();
        return '';
    }
    // RPGState hiện tại lưu tổng đồ sở hữu trong inventory (gồm đồ đang mặc).
    // Ba lô chỉ hiển thị số lượng chưa được đặt vào ô trang bị.
    bagQuantity(id) {
        const d = this.state.data;
        const worn = Object.values(d.equipment).filter(value => value === id).length;
        return Math.max(0, (Number(d.inventory[id]) || 0) - worn);
    }
    inventoryContent() {
        const s = this.state, d = s.data;
        const ids = Object.keys(ITEMS).filter(id => this.bagQuantity(id) > 0);
        if (!ids.includes(this.selected)) this.selected = ids[0] ?? null;
        if (this.previewId && !ids.includes(this.previewId)) this.previewId = null;
        const item = ITEMS[this.selected];
        const previewItem = ITEMS[this.previewId];
        const gear = EQUIPMENT_SLOTS.map(([slot, name, frame]) => {
            const id = d.equipment[slot], value = ITEMS[id];
            const level=s.enhancementLevel(slot), check=s.enhancementCheck(slot);
            const stats = value ? this.gearStats(s.equippedStats(slot)) : '';
            const nextStats=value?this.gearStats(enhancedItem(value,level+1)):'';
            return `<div class="rpg-equipment-slot ${value ? 'equipped' : ''}">
                <div class="rpg-equipment-header">${itemIcon(value ?? (frame === null ? { icon:slot, level:1 } : { frame }), 44)}
                    <div><div class="rpg-equipment-title">${escape(name)}</div><div class="rpg-equipment-name ${value ? '' : 'rpg-equipment-empty'}">${escape(value?.name ?? 'Chưa trang bị')} <span class="enhance-level">+${level}</span></div></div>
                </div>${value ? `<div class="rpg-equipment-stats">${stats}</div>
                <div class="enhance-info">${level>=MAX_ENHANCEMENT?'Đã cường hóa tối đa':`Lên +${level+1}: <b>${level+1} đá</b> · Có ${d.inventory.upgrade_stone??0}`}</div>
                <div class="rpg-equipment-footer"><span class="rpg-tier">CẤP ${value.level ?? 1}</span><div class="enhance-actions"><button type="button" data-action="unequip" data-id="${escape(id)}">Tháo</button><button type="button" class="enhance-button" data-action="enhance" data-id="${slot}" data-level="${level}" ${check.ok?'':'disabled'} title="${escape(check.ok?`Sau nâng: ${nextStats}. Giữ cấp khi đổi trang bị.`:check.message)}">Nâng cấp</button></div></div>` : `<div class="enhance-info">Cấp +${level} được giữ cho món mặc tiếp theo.</div>`}
            </div>`;
        }).join('');
        // Bảy cột, bốn hàng: thêm một cột vào phần trống bên phải.
        // Tự mở thêm hàng khi sở hữu nhiều loại vật phẩm hơn.
        const capacity = Math.max(28, Math.ceil(ids.length / 7) * 7);
        const cells = Array.from({ length:capacity }, (_, i) => {
            const id = ids[i], value = ITEMS[id];
            if (!value) return '<div class="rpg-slot empty" aria-hidden="true"></div>';
            return `<button type="button" class="rpg-slot ${id === this.selected ? 'selected' : ''}" data-action="select" data-id="${escape(id)}" aria-label="${escape(value.name)}, số lượng ${this.bagQuantity(id)}" aria-pressed="${id === this.selected}">${itemIcon(value,36)}<span class="rpg-qty">${this.bagQuantity(id)}</span></button>`;
        }).join('');
        return `<div class="rpg-bag-layout">
            <section class="rpg-equipment-panel">
                <div class="rpg-section-heading"><h3>Lữ khách</h3><span>Trang bị hiện tại</span></div>
                <div class="rpg-model-stage"><span class="rpg-model-caption">${previewItem ? 'ĐANG THỬ ĐỒ' : 'NHÂN VẬT CỦA BẠN'}</span><span class="rpg-model-level">LV ${d.level}</span>
                    <canvas class="rpg-character-preview" width="480" height="360" role="img" aria-label="Mô hình nhân vật với vũ khí và khiên ${previewItem ? 'đang thử' : 'đang trang bị'}"></canvas>
                    <div class="rpg-model-controls"><button type="button" data-action="preview-turn">Đổi hướng</button>${previewItem ? '<button type="button" data-action="preview-reset">Hủy thử</button>' : ''}</div>
                </div>
                ${previewItem ? `<p class="rpg-subtle">Đang thử: ${escape(previewItem.name)}. Bấm Trang bị để mặc.</p>` : ''}
                <div class="rpg-equipment-grid">${gear}${wingEquipmentCard(this.state)}</div>
            </section>
            <div class="rpg-bag-column">
            <section class="rpg-bag-panel"><div class="rpg-section-heading"><h3>Ba lô</h3><span>${ids.length} / ${capacity} ô</span></div>
                <div class="rpg-grid">${cells}</div>
                ${item ? `<article class="rpg-item-detail"><header>${itemIcon(item,48)}<div><h4>${escape(item.name)}</h4><div class="rpg-tier">${item.category === 'fishing' ? 'CÂU CÁ' : `CẤP ${item.level ?? 1}`} · Có ${this.bagQuantity(this.selected)}</div></div></header>
                    <p>${escape(item.description ?? '')}</p>${this.gearStats(item) ? `<p class="rpg-tier">${this.gearStats(item)}</p>` : ''}
                    ${item.category === 'fishing' ? '<p class="rpg-subtle">Vật phẩm câu cá được lưu trong túi đồ nhân vật.</p>' : (EQUIPMENT_SLOTS.some(([slot]) => slot === item.type) || item.type === 'consumable') ? `<div class="rpg-item-actions">${['weapon','shield'].includes(item.type) ? '<button type="button" data-action="preview">Thử đồ</button>' : ''}<button type="button" class="rpg-primary" data-action="use">${item.type === 'consumable' ? 'Sử dụng' : 'Trang bị'}</button></div>` : '<p class="rpg-subtle">Vật phẩm nguyên liệu, có thể đổi tại Thợ săn ở Khu Rừng Phía Tây.</p>'}
                </article>` : '<div class="rpg-empty-bag">Ba lô đang trống.<br>Tháo trang bị hoặc mua thêm vật phẩm từ thương nhân.</div>'}
            </section>
            ${this.currencyContent()}
            </div>
        </div><div class="rpg-bag-footer"><span></span></div>`;
    }
    currencyContent() {
        const d = this.state.data;
        const fmt = value => Math.max(0, Number(value) || 0).toLocaleString('vi-VN');
        return `<section class="rpg-wallet" aria-label="Tiền tệ nhân vật">
            <div class="rpg-wallet-card gold"><span class="rpg-wallet-symbol" aria-hidden="true">●</span><div><span>Vàng</span><strong>${fmt(d.gold)}</strong></div></div>
            <div class="rpg-wallet-card gems"><span class="rpg-wallet-symbol" aria-hidden="true">◆</span><div><span>Đá quý</span><strong>${fmt(d.gems)}</strong></div></div>
        </section>`;
    }
    gearStats(item) {
        return [item.attack && `+${item.attack} công`, item.defense && `+${item.defense} thủ`, item.maxHP && `+${item.maxHP} HP`, item.maxMP && `+${item.maxMP} MP`].filter(Boolean).join(' · ');
    }
    drawCharacterPreview() {
        const canvas = this.modal.querySelector('.rpg-character-preview');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        const player = this.scene.player, sprite = player?.sprite;
        const equipment = { ...this.state.data.equipment };
        const trying = ITEMS[this.previewId];
        if (trying && ['weapon','shield'].includes(trying.type)) equipment[trying.type] = this.previewId;
        const weaponFrames = { iron_sword:103, iron_sword_2:104, iron_sword_3:105, iron_sword_4:106, iron_sword_5:107, wood_staff:129 };
        const shieldFrames = { round_shield:102, round_shield_2:101, round_shield_3:102, round_shield_4:101, round_shield_5:102 };
        const draw = (frame, x, y, scale, flip = false) => {
            const source = frame?.source?.image;
            if (!source || !frame.cutWidth || !frame.cutHeight) return false;
            ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
            ctx.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
                -frame.cutWidth * scale / 2, -frame.cutHeight * scale / 2, frame.cutWidth * scale, frame.cutHeight * scale);
            ctx.restore(); return true;
        };
        const getFrame = number => number == null || !this.scene.textures.exists('dungeon') ? null : this.scene.textures.getFrame('dungeon', number);
        const wf = player?.getWeaponFrame?.(equipment.weapon) ?? weaponFrames[equipment.weapon] ?? null;
        const sf = player?.getShieldFrame?.(equipment.shield) ?? shieldFrames[equipment.shield] ?? null;
        const direction = this.previewLeft ? -1 : 1;
        const scale = 7, x = 240, y = 176;
        // Offset được đổi từ pixel thế giới sang kích thước canvas.
        const worldScale = Math.abs(sprite?.scaleX) || 3;
        const gap = 18 * scale / worldScale;
        const weapon = () => draw(getFrame(wf), x + direction * gap, y + 6 * scale / worldScale, scale, this.previewLeft);
        const shield = () => draw(getFrame(sf), x - direction * gap, y + scale / worldScale, scale, this.previewLeft);
        ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 60, 65, 15, 0, 0, Math.PI * 2); ctx.fill();
        const wingData = this.state.data.wings;
        const wingId = this.tab === 'wings' ? this.wingSelected : wingData?.equipped;
        const wing = wingData?.collection?.find(item => item.id === wingId);
        if (wing) {
            ctx.save(); ctx.translate(x, y - 8 * scale / worldScale);
            if (this.previewLeft) ctx.scale(-1, 1);
            ctx.scale(scale, scale); ctx.translate(-24, -16);
            drawWingPixels(ctx, wing.id, wing.level); ctx.restore();
        }
        if (this.previewLeft) weapon(); else shield();
        const rendered = draw(sprite?.frame ?? getFrame(96), x, y, scale, this.previewLeft);
        if (this.previewLeft) shield(); else weapon();
        if (!rendered) {
            ctx.fillStyle = '#d9b66c'; ctx.font = '22px Arial'; ctx.textAlign = 'center';
            ctx.fillText('Chưa tải hình nhân vật', x, y);
        }
    }
    potentialContent() {
        const s = this.state, d = s.data;
        const fmt = value => (Number(value) || 0).toLocaleString('vi-VN');
        const needed = Math.max(0, Number(s.expNeeded) || 0);
        const exp = Math.max(0, Number(d.exp) || 0);
        const percent = needed > 0 ? Math.max(0, Math.min(100, exp / needed * 100)) : 0;
        const card = (label, value, kind = '') => `<div class="rpg-potential-card ${kind}"><span>${label}</span><strong>${value}</strong></div>`;
        return `<section class="rpg-potential">
            <header class="rpg-potential-heading">
                <div><span class="rpg-tier">HỒ SƠ NHÂN VẬT</span><h3>Lữ khách</h3></div>
                <div class="rpg-potential-level" aria-label="Cấp độ ${fmt(d.level)}"><strong>${fmt(d.level)}</strong></div>
            </header>
            <div class="rpg-potential-grid">
                ${card('MÁU', `${fmt(d.hp)}<em>/${fmt(s.maxHP)}</em>`, 'health')}
                ${card('MANA', `${fmt(d.mp)}<em>/${fmt(s.maxMP)}</em>`, 'mana')}
                ${card('TẤN CÔNG', fmt(s.attack))}
                ${card('PHÒNG THỦ', fmt(s.defense))}
            </div>
            <div class="rpg-potential-exp">
                <div class="rpg-exp-heading"><span>EXP</span><strong>${fmt(exp)}/${fmt(needed)}</strong></div>
                <div class="rpg-exp-track" role="progressbar" aria-label="EXP" aria-valuemin="0" aria-valuemax="${needed}" aria-valuenow="${exp}"><div style="width:${percent}%"></div></div>
            </div>
        </section>`;
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
    exchangeContent() {
        const inventory = this.state.data.inventory;
        const total = MONSTER_MATERIALS.reduce(
            (sum, material) => sum + (inventory[material.id] ?? 0), 0
        );
        const exchangeError = this.state.canExchangeMonsterMaterials();
        const canExchange = !exchangeError;
        const materials = MONSTER_MATERIALS.map(material => `
            <article class="rpg-shop-item">
                <header>${itemIcon(ITEMS[material.id],44)}<div><h3>${escape(material.name)}</h3><span class="rpg-tier">Đang có: ${inventory[material.id] ?? 0}</span></div></header>
                <p class="rpg-subtle">${escape(material.description)}</p>
            </article>`).join('');
        return `<div class="rpg-shop-gold"><strong>${escape(this.exchangeNPC?.name ?? 'Thợ săn')}</strong><span>Vật phẩm quái: ${total} / 10</span></div>
            <p class="rpg-subtle">Gộp vật phẩm rơi từ bất kỳ quái nào: 10 vật phẩm đổi lấy 1 đá nâng cấp trang bị.</p>
            <div class="rpg-shop-grid">${materials}</div>
            <div class="rpg-shop-buy"><span>${escape(exchangeError || 'Đổi 10 vật phẩm lấy 1 đá nâng cấp.')}</span>
                <button type="button" data-action="exchange-materials" ${canExchange ? 'class="rpg-primary"' : 'disabled'}>Đổi 10 vật phẩm</button>
            </div>`;
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
