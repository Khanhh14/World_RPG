import {TU_LINH_WEAPONS,tuLinhWeaponTexture} from '../data/tuLinhWeapons.js';
import {HUNT_EVENT_WEAPONS} from '../data/huntEventItems.js';
import {resalePrice} from '../data/resale.js';
import { offhandTexture } from '../world/OffhandTextures.js';
import { MAX_ENHANCEMENT, enhancedItem } from '../data/enhancement.js';
import { renderSkillsPanel, renderSkillShop, renderSkillTrainingShop } from './SkillsPanel.js';
import { renderWingsPanel, renderWingShop } from './WingsPanel.js';
import { BAG_CAPACITY, canShopItem, EQUIPMENT_SLOTS, SHOP_ITEMS, TOME_ITEMS, monsterMaterialsForMap, monsterExchangeForMap, FOOD_RECIPES, gearIcon, tomeIcon } from '../data/items.js';
import { ITEMS } from '../systems/RPGState.js';
import { renderQuestJournal } from './QuestJournal.js';
import { WORLD_MAP_GROUPS, WORLD_ROUTES, findWorldRoute } from '../data/worldMap.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = (frame, size = 40) => `<span class="rpg-icon" aria-hidden="true" style="width:${size}px;height:${size}px;background-size:${size*12}px ${size*11}px;background-position:-${frame%12*size}px -${Math.floor(frame/12)*size}px"></span>`;
const itemIcon = (item, size = 40) => item?.emoji
    ? `<span class="rpg-item-emoji" role="img" aria-label="${escape(item.name)}" style="font-size:${size * 0.72}px;line-height:1">${item.emoji}</span>`
    : item?.type === 'tome' ? tomeIcon(`tome_${item.icon}`, size)
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
            link.href = '/assets/style/skills.css?v=training-1'; link.dataset.skillBooks = 'true'; document.head.appendChild(link);
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
        const href = stylesheet + '?v=map-diagram-1';
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
        this.root = document.createElement('div'); this.root.className = 'rpg-ui';
        this.root.innerHTML = '<div class="rpg-overview"></div><nav class="rpg-nav" aria-label="Menu nhân vật"></nav><div class="rpg-overlay" hidden><section class="rpg-modal" role="dialog" aria-modal="true" aria-labelledby="rpg-modal-title"></section></div><div class="rpg-world-map-overlay" hidden><section class="rpg-world-map" role="dialog" aria-modal="true" aria-labelledby="world-map-title"></section></div><div class="rpg-toast" role="status" hidden></div>';
        document.body.appendChild(this.root);
        this.overlay = this.root.querySelector('.rpg-overlay');
        this.modal = this.root.querySelector('.rpg-modal');
        this.worldMapOverlay = this.root.querySelector('.rpg-world-map-overlay');
        this.worldMapDialog = this.root.querySelector('.rpg-world-map');
        this.onClick = async event => {
            const button = event.target.closest('button[data-action]');
            if (!button || !this.root.contains(button) || button.disabled) return;
            const { action, id } = button.dataset;
            if (action === 'activity') { this.scene.activityUI?.open(id); return; }
            if (action === 'map-open') { if (this.mapOpen) this.closeWorldMap(); else this.openWorldMap(); return; }
            if (action === 'map-close') { this.closeWorldMap(); return; }
            if (action === 'map-select') { this.mapDestination = id; this.renderWorldMap(); return; }
            if (action === 'tab' && !(button.closest('.rpg-tabs') && this.tab === id)) this.toggle(id);
            if (action === 'close') this.close();
            if (action === 'skill-slot') { this.skillSlot = Number(id); this.renderModal(); }
            if (action === 'skill-school') { this.skillSchool = id; this.renderModal(); }
            if (action === 'book-school') { this.bookSchool = id; this.renderModal(); }
            if (action === 'skill-retry') await this.scene.skillsSystem?.load();
            if (action === 'skill-buy' && this.skillNPC && this.scene.dialogue?.nearest() === this.skillNPC) await this.scene.skillsSystem?.perform('buy', {skillId:id,merchantId:this.skillVendor});
            if (action === 'skill-assign') await this.scene.skillsSystem?.perform('assign', {skillId:id,slot:this.skillSlot ?? 0});
            if (action === 'skill-material-buy' && this.trainingNPC && this.scene.dialogue?.nearest() === this.trainingNPC) await this.scene.skillsSystem?.perform('buy-material',{itemId:id,quantity:Number(button.dataset.quantity)});
            if (action === 'skill-upgrade' || action === 'skill-breakthrough') {
                const p=this.state.data.skills?.levels?.[id]??{level:1,cap:10};
                await this.scene.skillsSystem?.perform(action==='skill-upgrade'?'upgrade':'breakthrough',{skillId:id,expectedLevel:p.level,expectedCap:p.cap});
            }
            if (action === 'skill-clear') await this.scene.skillsSystem?.perform('assign', {skillId:null,slot:Number(id)});
            if (action === 'wing-select') { this.wingSelected = id; this.renderModal(); }
            if (action === 'wing-retry') await this.scene.wingsSystem?.load();
            if (action === 'wing-buy' && this.wingNPC && this.scene.dialogue?.nearest() === this.wingNPC) await this.scene.wingsSystem?.perform('buy', { itemId: id });
            if (action === 'tome-chest-buy' && this.tomeNPC && this.scene.dialogue?.nearest() === this.tomeNPC) {
                const result = await this.state.buyItem('tome_chest');
                if (this.destroyed) return;
                this.toast(result.message);
                if (this.tab === 'tome-shop') this.renderModal();
            }
            if (action === 'tome-upgrade') {
                const result = await this.state.upgradeTome(id);
                if (this.destroyed) return;
                this.toast(result.message);
                if (this.tab === 'tomes') this.renderModal();
            }
            if (action === 'wing-equip') await this.scene.wingsSystem?.perform('equip', { wingId: id });
            if (action === 'wing-unequip') await this.scene.wingsSystem?.perform('equip', { wingId: null });
            if(action==='wing-enchant')await this.scene.wingsSystem?.perform('enchant',{wingId:id});
            if (action === 'wing-upgrade') {
                const owned = this.state.data.wings?.collection?.find(item => item.id === id);
                if (owned) await this.scene.wingsSystem?.perform('upgrade', { wingId: id, expectedLevel: owned.level });
            }
            if (action === 'select') { this.selected = id; this.previewId = null; this.renderModal(); }
            if (action === 'preview') { this.previewId = this.selected; this.renderModal(); }
            if (action === 'preview-reset') { this.previewId = null; this.renderModal(); }
            if (action === 'preview-turn') { this.previewLeft = !this.previewLeft; this.drawCharacterPreview(); }
            if (action === 'use') { this.previewId = null; this.toast(await this.state.useItem(id || this.selected)); this.render(); }
            if (action === 'shop-mode') { this.shopMode=id;this.renderModal(); }
            if (action === 'sale-retry') { const result=await this.state.recoverSale();this.toast(result.message);this.render(); }
            if (action === 'sell' && this.shopNPC && this.scene.dialogue?.nearest() === this.shopNPC) {
                const result=await this.state.sellItem(id,Number(button.dataset.quantity),{mapId:this.scene.mapData.id,x:this.scene.player.x,feetY:this.scene.player.feetY});
                if(this.destroyed)return;this.toast(result.message);this.render();
            }
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
                this.toast(this.state.exchangeMonsterMaterials(this.scene.mapData.id).message);
            }
            if (action === 'food-exchange' && this.foodNPC && this.scene.dialogue?.nearest() === this.foodNPC) {
                const result = await this.state.exchangeFood(id, {mapId:this.scene.mapData.id,x:this.scene.player.x,feetY:this.scene.player.feetY});
                this.toast(result.message);this.render();
            }
            if (action === 'boss-retry') await this.scene.bossRewards?.flush();
            if (action === 'boss-stones') this.scene.bossRewards?.collect();
            if (action === 'enhance') {
                const result=this.state.upgradeEquipment(id, Number(button.dataset.level));
                this.toast(result.message);this.render();
            }
            if (action === 'unequip') {
                const slot = ITEMS[id]?.type;
                if (slot && this.state.data.equipment[slot] === id) {
                    this.previewId = null; this.selected = id;
                    this.toast(await this.state.useItem(id)); this.render();
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
            if (this.mapOpen) {
                if (key === 'm' || key === 'escape') {
                    event.preventDefault(); this.closeWorldMap(); return;
                }
                if (key === 'tab') {
                    const buttons = [...this.worldMapDialog.querySelectorAll('button:not(:disabled)')];
                    const first = buttons[0], last = buttons.at(-1);
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                    return;
                }
                if (!['enter',' '].includes(key)) event.preventDefault();
                return;
            }
            const tabs = { b: 'inventory', j: 'quests', c: 'skills', t: 'tomes' };
            if (key === 'm') { event.preventDefault(); this.openWorldMap(); }
            else if (tabs[key]) { event.preventDefault(); this.toggle(tabs[key]); }
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
    get blocked() { return Boolean(this.tab || this.mapOpen) || !!this.scene.activityUI?.isOpen; }
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
        const buff = d.foodBuff && d.foodBuff.expiresAt > Date.now()
            ? FOOD_RECIPES.find(recipe => recipe.id === d.foodBuff.foodId)
            : null;
        const buffStatus = buff ? `<div class="rpg-food-buff">${escape(buff.name)} · hiệu lực ${Math.ceil((d.foodBuff.expiresAt - Date.now()) / 60000)} phút</div>` : '';
        this.root.querySelector('.rpg-overview').innerHTML = `<div class="rpg-status"><div class="rpg-portrait">${icon(96,48)}<span class="rpg-level">LV ${d.level}</span></div><div class="rpg-meters"><div class="rpg-name">${escape(d.name || 'Lữ khách')}</div>${this.bar('hp','HP',d.hp,s.maxHP)}${this.bar('mp','MP',d.mp,s.maxMP)}${buffStatus}${this.bar('xp','EXP',d.exp,s.expNeeded)}</div></div>${tracker}<div class="rpg-location"><span class="rpg-location-name">${escape(this.mapTitle)}</span></div>`;
        this.root.querySelector('.rpg-nav').innerHTML = [['map','Bản đồ','M'],['inventory','Túi đồ','B'],['quests','Nhiệm vụ','J'],['settings','Cài đặt','⚙'],['guide','Hướng dẫn','?']].map(([id,name,key]) => `<button type="button" data-action="${id==='map'?'map-open':['settings','guide'].includes(id)?'activity':'tab'}" data-id="${id}" aria-label="${name} (${key})"><span>${name}</span><kbd>${key}</kbd>${id==='quests' && d.quests?.some(quest => quest.status === 'completed')?'<i class="rpg-dot"></i>':''}</button>`).join('');
        if (this.tab) this.renderModal();
        if (this.mapOpen) this.renderWorldMap();
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
        this.shopNPC = npc; this.shopMode='buy'; this.shopCategory = 'all'; this.shopLevel = 0;
        this.toggle('shop');
    }
    openSkillTrainingShop(npc) {
        if (npc?.role !== 'skill-training-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.trainingNPC=npc; this.toggle('skill-training-shop');
        void this.scene.skillsSystem?.load();
    }
    openSkillShop(npc) {
        if (npc?.role !== 'skill-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.skillNPC = npc; this.skillVendor = npc.id === 'mage' ? 'mage' : 'sora'; this.bookSchool = 'demon'; this.toggle('skill-shop');
        void this.scene.skillsSystem?.load();
    }
    openFoodExchange(npc) {
        if (npc?.role !== 'food-exchange' || this.scene.dialogue?.nearest() !== npc) return;
        this.foodNPC = npc;
        this.toggle('food-exchange');
    }
    openWingShop(npc) {
        if (npc?.role !== 'wing-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.wingNPC = npc; this.toggle('wing-shop');
        void this.scene.wingsSystem?.load();
    }
    openTomeShop(npc) {
        if (npc?.role !== 'tome-merchant' || this.scene.dialogue?.nearest() !== npc) return;
        this.tomeNPC = npc;
        this.toggle('tome-shop');
    }
    openExchange(npc) {
        if (npc?.role !== 'monster-material-exchange' || this.scene.dialogue?.nearest() !== npc) return;
        this.exchangeNPC = npc;
        this.toggle('exchange');
    }
    toggle(tab) {
        if (tab === 'skill-training-shop' && (!this.trainingNPC || this.scene.dialogue?.nearest() !== this.trainingNPC)) return;
        if (tab === 'skill-shop' && (!this.skillNPC || this.scene.dialogue?.nearest() !== this.skillNPC)) return;
        if (tab === 'wing-shop' && (!this.wingNPC || this.scene.dialogue?.nearest() !== this.wingNPC)) return;
        if (tab === 'tome-shop' && (!this.tomeNPC || this.scene.dialogue?.nearest() !== this.tomeNPC)) return;
        if (tab === 'shop' && (!this.shopNPC || this.scene.dialogue?.nearest() !== this.shopNPC)) return;
        if (tab === 'exchange' && (!this.exchangeNPC || this.scene.dialogue?.nearest() !== this.exchangeNPC)) return;
        if (tab === 'food-exchange' && (!this.foodNPC || this.scene.dialogue?.nearest() !== this.foodNPC)) return;
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
        this.previewId = null; this.tab = null; this.shopNPC = null; this.exchangeNPC = null; this.foodNPC = null; this.wingNPC = null; this.tomeNPC = null; this.skillNPC = null; this.trainingNPC = null; this.overlay.hidden = true;
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
            : { inventory: 'Túi đồ & Trang bị', potential: 'Tiềm Năng', wings: 'Nâng cấp cánh', skills: 'Kỹ năng', tomes: 'Cổ Tịch' };
        if (this.trainingNPC && this.tab !== 'quests') names['skill-training-shop']='Bí thuật Yuna';
        if (this.skillNPC && this.tab !== 'quests') names['skill-shop'] = 'Sách kỹ năng';
        if (this.wingNPC && this.tab !== 'quests') names['wing-shop'] = 'Đá nâng cấp cánh';
        if (this.tomeNPC && this.tab !== 'quests') names['tome-shop'] = 'Rương Cổ Tịch';
        if (this.shopNPC && this.tab !== 'quests') names.shop = 'Cửa hàng';
        if (this.exchangeNPC && this.tab === 'exchange') names.exchange = 'Đổi vật phẩm quái';
        if (this.foodNPC && this.tab === 'food-exchange') names['food-exchange'] = 'Đổi món ăn';
        const tabs = this.tab === 'quests' ? '' : `<div class="rpg-tabs">${Object.entries(names).map(([id, name]) => `<button type="button" data-action="tab" data-id="${id}" class="${id === this.tab ? 'active' : ''}">${name}</button>`).join('')}</div>`;
        this.modal.classList.toggle('rpg-skills-modal', this.tab === 'skills');
        this.modal.classList.toggle('rpg-skill-shop-modal', ['skill-shop','skill-training-shop'].includes(this.tab));
        this.modal.classList.toggle('rpg-wing-modal', this.tab === 'wings');
        this.modal.classList.toggle('rpg-tomes-modal', this.tab === 'tomes');
        this.modal.classList.toggle('rpg-wing-shop-modal', this.tab === 'wing-shop');
        this.modal.classList.toggle('rpg-shop-modal', ['shop','tome-shop'].includes(this.tab));
        this.modal.classList.toggle('rpg-inventory-modal', this.tab === 'inventory');
        this.modal.classList.toggle('rpg-potential-modal', this.tab === 'potential');
        this.modal.classList.toggle('rpg-quests-modal', this.tab === 'quests');
        this.modal.classList.toggle('rpg-exchange-modal', this.tab === 'exchange');
        this.modal.classList.toggle('rpg-food-exchange-modal', this.tab === 'food-exchange');
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
        if (this.tab === 'skill-training-shop') return renderSkillTrainingShop(this);
        if (this.tab === 'skill-shop') return renderSkillShop(this);
        if (this.tab === 'wings') return renderWingsPanel(this);
        if (this.tab === 'tomes') return this.tomesContent();
        if (this.tab === 'wing-shop') return renderWingShop(this);
        if (this.tab === 'tome-shop') return this.tomeShopContent();
        if (this.tab === 'shop') return this.shopContent();
        if (this.tab === 'exchange') return this.exchangeContent();
        if (this.tab === 'food-exchange') return this.foodExchangeContent();
        if (this.tab === 'inventory') {
            return this.inventoryContent();
        }
        if (this.tab === 'quests') return renderQuestJournal(this.state);
        if (this.tab === 'potential') return this.potentialContent();
        return '';
    }
    openWorldMap() {
        if (this.destroyed || this.scene.dialogue?.isOpen || this.state.data.hp <= 0) {
            if (this.state.data.hp <= 0) this.toast('Nhân vật đã gục ngã, hiện không thể mở bản đồ.');
            return;
        }
        if (this.mapOpen) return;
        if (this.tab) this.close();
        this.mapOpen = true;
        this.mapPreviousFocus = document.activeElement;
        this.mapKeyboardWasEnabled = this.scene.input.keyboard.enabled;
        this.scene.input.keyboard.enabled = false;
        this.scene.input.keyboard.resetKeys();
        this.scene.player?.stop();
        this.scene.dialogueUI?.actionBar?.setVisible(false);
        this.mapDestination = null;
        this.worldMapOverlay.hidden = false;
        this.renderWorldMap();
        this.worldMapDialog.querySelector('[data-action="map-close"]')?.focus();
    }
    closeWorldMap() {
        if (!this.mapOpen) return;
        this.mapOpen = false;
        this.worldMapOverlay.hidden = true;
        this.scene.input.keyboard.resetKeys();
        this.scene.input.keyboard.enabled = this.mapKeyboardWasEnabled;
        if (!this.scene.dialogue?.isOpen) this.scene.dialogueUI?.actionBar?.setVisible(true);
        if (this.mapPreviousFocus?.isConnected) this.mapPreviousFocus.focus();
    }
    renderWorldMap() {
        const focus = document.activeElement?.closest('button');
        const focusId = focus?.dataset.id;
        const focusAction = focus?.dataset.action;
        const scrollTop = this.worldMapDialog.scrollTop;
        const currentMap = this.scene.mapData.id;
        const dead = this.state.data.hp <= 0;
        const places = WORLD_MAP_GROUPS.flatMap(group => group.places);
        const destination = places.find(place => place.id === this.mapDestination);
        const route = destination ? findWorldRoute(currentMap, destination.id) : null;
        const routeEdges = new Set((route ?? []).map(step => [step.from, step.to].sort().join(':')));
        const connections = [...new Map(WORLD_ROUTES.map(edge => {
            const key = [edge.from, edge.to].sort().join(':');
            return [key, { key, from: places.find(place => place.id === edge.from), to: places.find(place => place.id === edge.to) }];
        })).values()].filter(edge => edge.from && edge.to);
        const connectionsSvg = connections.map(edge => `<line class="rpg-map-connection ${routeEdges.has(edge.key) ? 'on-route' : ''}" x1="${edge.from.diagram.x}" y1="${edge.from.diagram.y}" x2="${edge.to.diagram.x}" y2="${edge.to.diagram.y}"/>`).join('');
        const nodes = WORLD_MAP_GROUPS.flatMap((group, groupIndex) => group.places.map(place => {
            const current = place.id === currentMap;
            const selected = place.id === this.mapDestination;
            const onRoute = route?.some(step => step.from === place.id || step.to === place.id);
            return `<button type="button" class="rpg-map-node region-${groupIndex} ${current ? 'current' : ''} ${selected ? 'selected' : ''} ${onRoute ? 'on-route' : ''}" style="left:${place.diagram.x / 10}%;top:${place.diagram.y / 6.6}%" data-action="map-select" data-id="${place.id}" aria-pressed="${selected}" ${dead ? 'disabled' : ''}><strong>${escape(place.name)}</strong><span>${current ? 'Bạn đang ở đây' : selected ? 'Điểm đến' : onRoute ? 'Trên lộ trình' : 'Chọn điểm đến'}</span></button>`;
        })).join('');
        const guide = !destination ? '<p class="rpg-map-empty">Chọn điểm đến để xem đường đi từng chặng.</p>'
            : destination.id === currentMap ? `<p class="rpg-map-empty">Bạn đang ở <strong>${escape(destination.name)}</strong>.</p>`
            : route ? `<ol class="rpg-map-route">${route.map((step, index) => {
                const from = places.find(place => place.id === step.from), to = places.find(place => place.id === step.to);
                return `<li><span class="rpg-map-step-number">${index + 1}</span><div><strong>Chặng ${index + 1}/${route.length}: ${escape(from?.name ?? step.from)} → ${escape(to?.name ?? step.to)}</strong><p>Đi tới <b>${escape(step.gate)}</b> ở ${escape(step.direction)}, rồi bước vào cổng. ${index < route.length - 1 ? 'Sau khi tới nơi, mở M để xem chặng kế tiếp.' : 'Đây là chặng cuối.'}</p></div></li>`;
            }).join('')}</ol>`
                : '<p class="rpg-map-empty">Chưa có tuyến đường đi bộ đã khai báo tới khu vực này.</p>';
        this.worldMapDialog.innerHTML = `<header><div><small>CHỈ ĐƯỜNG LIÊN KHU VỰC · M</small><h2 id="world-map-title">Bản đồ thế giới</h2></div><button type="button" data-action="map-close" aria-label="Đóng bản đồ">✕ <small>Esc</small></button></header>
            <p class="rpg-map-intro">Bản đồ này <strong>không dịch chuyển tức thời</strong>. Chọn điểm đến để xem cổng cần đi tới; dùng <b>W/A/S/D</b> hoặc <b>phím mũi tên</b> để đi bộ qua cổng. Mở lại bản đồ sau mỗi chặng để xem hướng tiếp theo.</p>
            <div class="rpg-map-current">Vị trí hiện tại: <strong>${escape(places.find(place => place.id === currentMap)?.name ?? this.mapTitle)}</strong></div>
            <div class="rpg-map-legend"><span><i class="current"></i> Vị trí hiện tại</span><span><i class="selected"></i> Điểm đến</span><span><i class="connection"></i> Lối nối giữa các khu vực</span></div>
            <div class="rpg-map-diagram-scroll"><div class="rpg-map-diagram"><svg viewBox="0 0 1000 660" preserveAspectRatio="none" aria-hidden="true">${connectionsSvg}</svg>${nodes}</div></div>
            <aside class="rpg-map-guide"><h3>${destination ? `Đường tới ${escape(destination.name)}` : 'Hướng dẫn đường đi'}</h3>${dead ? '<p class="rpg-map-empty">Hãy hồi sinh để xem và đi theo lộ trình.</p>' : guide}</aside>
            <footer>Nhấn M để mở/đóng bản đồ · Đi bộ và dùng cổng hoặc NPC theo chỉ dẫn, không dịch chuyển trực tiếp.</footer>`;
        if (focusAction) this.worldMapDialog.querySelector(`button[data-action="${focusAction}"][data-id="${focusId}"]`)?.focus({ preventScroll: true });
        this.worldMapDialog.scrollTop = scrollTop;
    }
    // RPGState hiện tại lưu tổng đồ sở hữu trong inventory (gồm đồ đang mặc).
    // Ba lô chỉ hiển thị số lượng chưa được đặt vào ô trang bị.
    bagQuantity(id) {
        const d = this.state.data;
        const worn = Object.values(d.equipment).filter(value => value === id).length + (d.activeTomes?.includes(id) ? 1 : 0);
        return Math.max(0, (Number(d.inventory[id]) || 0) - worn);
    }
    inventoryContent() {
        const s = this.state, d = s.data;
        const ids = Object.keys(ITEMS).filter(id => ITEMS[id]?.type !== 'tome' && this.bagQuantity(id) > 0);
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
                ${value.specialSkill?`<p class="rpg-subtle">F · ${escape(value.specialSkill.name)} · ${value.specialSkill.mana} MP · ${value.specialSkill.cooldown/1000}s</p>`:''}
                <div class="enhance-info">${level>=MAX_ENHANCEMENT?'Đã cường hóa tối đa':`Lên +${level+1}: <b>${Math.min(level+1,10)} đá</b> · Có ${d.inventory.upgrade_stone??0}`}</div>
                <div class="rpg-equipment-footer"><span class="rpg-tier">CẤP ${value.level ?? 1}</span><div class="enhance-actions"><button type="button" data-action="unequip" data-id="${escape(id)}">Tháo</button><button type="button" class="enhance-button" data-action="enhance" data-id="${slot}" data-level="${level}" ${check.ok?'':'disabled'} title="${escape(check.ok?`Sau nâng: ${nextStats}. Giữ cấp khi đổi trang bị.`:check.message)}">Nâng cấp</button></div></div>` : `<div class="enhance-info">Cấp +${level} được giữ cho món mặc tiếp theo.</div>`}
            </div>`;
        }).join('');
        // Bảy cột, bốn hàng: thêm một cột vào phần trống bên phải.
        // Tự mở thêm hàng khi sở hữu nhiều loại vật phẩm hơn.
        const entries=ids.flatMap(id=>Array.from({length:Math.ceil(this.bagQuantity(id)/(ITEMS[id].maxStack||99))},(_,i)=>({id,quantity:Math.min(ITEMS[id].maxStack||99,this.bagQuantity(id)-i*(ITEMS[id].maxStack||99))})));
        const occupiedSlots = entries.length + Object.keys(TOME_ITEMS).reduce((total, id) => total + Math.ceil(this.bagQuantity(id) / (ITEMS[id].maxStack || 99)), 0);
        const capacity = Math.max(BAG_CAPACITY, Math.ceil(entries.length / 7) * 7);
        const cells = Array.from({ length:capacity }, (_, i) => {
            const entry=entries[i],id=entry?.id,value=ITEMS[id];
            if (!value) return '<div class="rpg-slot empty" aria-hidden="true"></div>';
            return `<button type="button" class="rpg-slot ${id === this.selected ? 'selected' : ''}" data-action="select" data-id="${escape(id)}" aria-label="${escape(value.name)}, số lượng ${entry.quantity}" aria-pressed="${id === this.selected}">${itemIcon(value,36)}<span class="rpg-qty">${entry.quantity}</span></button>`;
        }).join('');
        return `<div class="rpg-bag-layout">
            <section class="rpg-equipment-panel">
                ${(d.pendingBossRewards?.length||this.state.bossRewardError)?`<p>Thưởng boss đang chờ đồng bộ. <button data-action="boss-retry">Thử nhận lại</button></p>`:''}
                ${d.bossStoneInbox?`<p>Đá cường hóa thưởng đang chờ: ${d.bossStoneInbox} <button data-action="boss-stones">Nhận đá vào túi</button></p>`:''}
                <div class="rpg-section-heading"><h3>Lữ khách</h3><span>Trang bị hiện tại</span></div>
                <div class="rpg-model-stage"><span class="rpg-model-caption">${previewItem ? 'ĐANG THỬ ĐỒ' : 'NHÂN VẬT CỦA BẠN'}</span><span class="rpg-model-level">LV ${d.level}</span>
                    <canvas class="rpg-character-preview" width="480" height="360" role="img" aria-label="Mô hình nhân vật với vũ khí và khiên ${previewItem ? 'đang thử' : 'đang trang bị'}"></canvas>
                    <div class="rpg-model-controls"><button type="button" data-action="preview-turn">Đổi hướng</button>${previewItem ? '<button type="button" data-action="preview-reset">Hủy thử</button>' : ''}</div>
                </div>
                ${previewItem ? `<p class="rpg-subtle">Đang thử: ${escape(previewItem.name)}. Bấm Trang bị để mặc.</p>` : ''}
                <div class="rpg-equipment-grid">${gear}</div>
            </section>
            <div class="rpg-bag-column">
            <section class="rpg-bag-panel"><div class="rpg-section-heading"><h3>Ba lô</h3><span>${occupiedSlots} / ${BAG_CAPACITY} ô</span></div>
                <div class="rpg-grid">${cells}</div>
                ${item ? `<article class="rpg-item-detail"><header>${itemIcon(item,48)}<div><h4>${escape(item.name)}</h4><div class="rpg-tier">${item.category === 'fishing' ? 'CÂU CÁ' : `CẤP ${item.level ?? 1}`} · Có ${this.bagQuantity(this.selected)}</div></div></header>
                    <p>${escape(item.description ?? '')}</p>${this.gearStats(item) ? `<p class="rpg-tier">${this.gearStats(item)}</p>` : ''}
                    ${item.category === 'gathering' ? '<p class="rpg-subtle">Dùng tại vườn nấm Ngoại ô YuNa. Gặp Nami để mua rổ hoặc đổi nấm.</p>' : item.category === 'fishing' ? '<p class="rpg-subtle">Vật phẩm câu cá được lưu trong túi đồ nhân vật.</p>' : item.type === 'tome' ? `<p class="rpg-subtle">${this.state.data.activeTomes?.includes(this.selected)?'Cổ Tịch đang kích hoạt. Có thể kết hợp với các Cổ Tịch khác.':'Kích hoạt để nhận hiệu quả. Có thể dùng nhiều Cổ Tịch cùng lúc.'}</p>` : (EQUIPMENT_SLOTS.some(([slot]) => slot === item.type) || item.type === 'consumable') ? `<div class="rpg-item-actions">${['weapon','shield'].includes(item.type) ? '<button type="button" data-action="preview">Thử đồ</button>' : ''}<button type="button" class="rpg-primary" data-action="use">${item.type === 'consumable' ? 'Sử dụng' : 'Trang bị'}</button></div>` : '<p class="rpg-subtle">Vật phẩm nguyên liệu, có thể đổi tại Thợ săn ở Khu Rừng Phía Tây.</p>'}
                </article>` : '<div class="rpg-empty-bag">Ba lô đang trống.<br>Tháo trang bị hoặc mua thêm vật phẩm từ thương nhân.</div>'}
            </section>
            ${this.currencyContent()}
            </div>
        </div><div class="rpg-bag-footer"><span></span></div>`;
    }
    tomesContent() {
        const d = this.state.data;
        const tomes = Object.keys(TOME_ITEMS).map(id => {
            const tome = TOME_ITEMS[id], active = d.activeTomes?.includes(id), available = this.bagQuantity(id) > 0;
            const owned = Number(d.inventory[id]) || 0;
            const level = d.tomeLevels?.[id] ?? 1;
            const retryUpgrade = d.pendingTomeUpgrade?.tomeId === id;
            const blockedUpgrade = this.state.usingItem || (d.pendingTomeUpgrade && !retryUpgrade);
            return `<article class="rpg-equipment-slot rpg-tome-card ${active ? 'equipped' : ''}"><div class="rpg-equipment-header">${tomeIcon(id, 44)}<div><div class="rpg-equipment-title">Cổ Tịch cấp ${level}</div><div class="rpg-equipment-name">${escape(tome.name)}</div></div></div><p class="rpg-subtle">${escape(tome.description)}</p><div class="rpg-equipment-footer"><span class="rpg-tier">${active ? 'ĐANG KÍCH HOẠT' : 'Chưa kích hoạt'} · Sở hữu: ${owned}</span><button type="button" class="${active ? '' : 'rpg-primary'}" data-action="use" data-id="${id}" ${d.pendingEquipmentAction || this.state.usingItem || (!active && !available) ? 'disabled' : ''}>${active ? 'Tháo' : available ? 'Kích hoạt' : 'Chưa có'}</button></div><div class="rpg-tome-upgrade"><span class="rpg-tier">${Math.min(owned, 3)}/3 bản để lên cấp ${level + 1}${owned > 3 ? ` · dư ${owned - 3}` : ''}</span><button type="button" data-action="tome-upgrade" data-id="${id}" ${owned < 3 || blockedUpgrade || d.pendingEquipmentAction ? 'disabled' : ''}>${retryUpgrade ? 'Thử lại' : 'Nâng cấp'}</button></div></article>`;
        }).join('');
        const chestCount = Number(d.inventory.tome_chest) || 0;
        return `<section class="rpg-equipment-panel"><div class="rpg-section-heading"><h3>Cổ Tịch</h3><span>${d.activeTomes?.length ?? 0} đang kích hoạt · Có thể dùng nhiều quyển cùng lúc</span></div><p class="rpg-subtle">Ghép 3 bản trùng cùng loại để tăng 1 cấp; sau khi ghép sẽ giữ lại 1 bản Cổ Tịch.</p>
            ${chestCount ? `<div class="rpg-tome-chest"><div>${itemIcon(ITEMS.tome_chest, 40)}<span>Rương Cổ Tịch · Có ${chestCount}</span></div><button type="button" class="rpg-primary" data-action="use" data-id="tome_chest" ${d.pendingItemUse || this.state.usingItem ? 'disabled' : ''}>Mở rương</button></div>` : ''}
            <div class="rpg-equipment-grid rpg-tomes-grid">${tomes}</div></section>`;
    }
    tomeShopContent() {
        const item = ITEMS.tome_chest, check = this.state.canBuy('tome_chest');
        return `<div class="rpg-shop-gold"><strong>${escape(this.tomeNPC?.name ?? 'Cư dân Miko')}</strong><span>● ${this.state.data.gold.toLocaleString('vi-VN')} vàng</span></div>
            <div class="rpg-shop-grid"><article class="rpg-shop-item"><header>${itemIcon(item, 48)}<div><h3>${escape(item.name)}</h3><span class="rpg-tier">RƯƠNG BÍ ẨN</span></div></header>
                <p>${escape(item.description)} Có thể nhận trùng Cổ Tịch.</p><div class="rpg-shop-buy"><strong>● ${item.price.toLocaleString('vi-VN')} vàng</strong><button type="button" class="rpg-primary" data-action="tome-chest-buy" ${!check.ok || this.state.buying ? 'disabled' : ''}>Mua rương</button></div>
            </article></div>`;
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
        const eventWeaponFrame=TU_LINH_WEAPONS[equipment.weapon]||HUNT_EVENT_WEAPONS[equipment.weapon]?this.scene.textures.getFrame(tuLinhWeaponTexture(this.scene,equipment.weapon)):null;
        const weapon = () => draw(eventWeaponFrame??getFrame(wf), x + direction * gap, y + 6 * scale / worldScale, scale, this.previewLeft);
        const offhand = ITEMS[equipment.shield];
        const shieldFrame = offhand?.offhandKind ? this.scene.textures.getFrame(offhandTexture(this.scene, offhand)) : getFrame(sf);
        const shield = () => draw(shieldFrame, x - direction * gap, y + scale / worldScale, scale, this.previewLeft);
        ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 60, 65, 15, 0, 0, Math.PI * 2); ctx.fill();
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
    resaleContent() {
        const d=this.state.data,ids=Object.keys(ITEMS).filter(id=>ITEMS[id]?.type!=='tome'&&this.bagQuantity(id)>0),busy=this.state.selling||this.state.buying||this.state.usingItem||!!d.pendingSale;
        return `<p class="rpg-subtle">Vũ khí và trang bị: 50% giá mua, làm tròn xuống. Các vật phẩm khác: 10 vàng/món. Đồ đang mặc cần tháo ra trước.</p>${d.pendingSale?'<p class="rpg-sale-pending">Có giao dịch bán đang chờ xác nhận. <button data-action="sale-retry">Thử lại</button></p>':''}<div class="rpg-shop-grid">${ids.map(id=>{
            const item=ITEMS[id],quantity=this.bagQuantity(id),price=resalePrice(id),batch=Math.min(99,quantity);
            return `<article class="rpg-shop-item"><header>${itemIcon(item,44)}<div><h3>${escape(item.name)}</h3><span class="rpg-tier">Trong balo: ${quantity}</span></div></header><div class="rpg-shop-buy"><strong>● ${price} vàng/món</strong></div><div class="rpg-sale-actions"><button data-action="sell" data-id="${id}" data-quantity="1" ${busy?'disabled':''}>Bán 1 · ${price} vàng</button>${quantity>1?`<button data-action="sell" data-id="${id}" data-quantity="${batch}" ${busy?'disabled':''}>Bán ${batch} · ${price*batch} vàng</button>`:''}</div></article>`;
        }).join('')}</div>${ids.length?'':'<p class="rpg-empty-bag">Không có vật phẩm trong balo để bán.</p>'}`;
    }
    shopContent() {
        const s = this.state, d = s.data;
        const mode=`<div class="rpg-shop-filters" aria-label="Mua hoặc bán">${[['buy','Mua đồ'],['sell','Bán đồ']].map(([id,label])=>`<button data-action="shop-mode" data-id="${id}" class="${(this.shopMode??'buy')===id?'active':''}">${label}</button>`).join('')}</div>`;
        if(this.shopMode==='sell')return `<div class="rpg-shop-gold"><strong>${escape(this.shopNPC?.name??'Thương nhân')}</strong><span>● ${d.gold.toLocaleString('vi-VN')} vàng</span></div>${mode}${this.resaleContent()}`;
        const ids = SHOP_ITEMS.filter(id => canShopItem(id,this.state.data.classCode) && (this.shopCategory === 'all' || ITEMS[id].category === this.shopCategory) && (!this.shopLevel || ITEMS[id].level === this.shopLevel));
        return `<div class="rpg-shop-gold"><strong>${escape(this.shopNPC?.name ?? 'Thương nhân')}</strong><span>● ${d.gold.toLocaleString('vi-VN')} vàng</span></div>
        ${mode}<div class="rpg-shop-filters" aria-label="Loại vật phẩm">${[['all','Tất cả'],['weapon','Vũ khí'],['gear','Khiên & giáp'],['special','Trang bị đặc biệt'],['hp','Bình máu'],['mp','Bình mana']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${this.shopCategory===id?'active':''}">${label}</button>`).join('')}</div>
        <div class="rpg-shop-filters" aria-label="Cấp vật phẩm">${[0,1,2,3,4,5].map(level=>`<button data-action="tier" data-id="${level}" class="${this.shopLevel===level?'active':''}">${level?'Cấp '+level:'Mọi cấp'}</button>`).join('')}</div>
        <div class="rpg-subtle">Cấp vật phẩm thể hiện sức mạnh, không yêu cầu cấp nhân vật. Mua xong, mở Ba lô để dùng hoặc trang bị.</div>
        <div class="rpg-shop-grid">${ids.map(id=>{
            const item=ITEMS[id], check=s.canBuy(id);
            return `<article class="rpg-shop-item"><header>${itemIcon(item,44)}<div><h3>${item.name}</h3><span class="rpg-tier">CẤP ${item.level} · Đang có: ${d.inventory[id]??0}</span></div></header><p class="rpg-subtle">${item.description}</p><div class="rpg-shop-buy"><strong>● ${item.price} vàng</strong><button data-action="buy" data-id="${id}" ${check.ok?'class="rpg-primary"':'disabled'} title="${escape(check.message)}">${check.ok?'Mua 1':item.maxStack===1 && d.inventory[id]?'Đã sở hữu':check.message}</button></div></article>`;
        }).join('')}</div>`;
    }
    exchangeContent() {
        const inventory = this.state.data.inventory;
        const recipe = monsterExchangeForMap(this.scene.mapData.id);
        const pool = monsterMaterialsForMap(this.scene.mapData.id);
        const total = pool.reduce(
            (sum, material) => sum + (inventory[material.id] ?? 0), 0
        );
        const exchangeError = this.state.canExchangeMonsterMaterials(this.scene.mapData.id);
        const canExchange = !exchangeError;
        const materials = pool.map(material => `
            <article class="rpg-shop-item">
                <header>${itemIcon(ITEMS[material.id],44)}<div><h3>${escape(material.name)}</h3><span class="rpg-tier">Đang có: ${inventory[material.id] ?? 0}</span></div></header>
                <p class="rpg-subtle">${escape(material.description)}</p>
            </article>`).join('');
        return `<div class="rpg-shop-gold"><strong>${escape(this.exchangeNPC?.name ?? 'Thợ săn')}</strong><span>Vật phẩm quái: ${total} / ${recipe.cost}</span></div>
            <p class="rpg-subtle">Gộp các vật phẩm quái của khu vực này: ${recipe.cost} vật phẩm đổi lấy 1 ${escape(recipe.name)}.</p>
            <div class="rpg-shop-grid">${materials}</div>
            <div class="rpg-shop-buy"><span>${escape(exchangeError || `Đổi ${recipe.cost} vật phẩm lấy 1 ${recipe.name}.`)}</span>
                <button type="button" data-action="exchange-materials" ${canExchange ? 'class="rpg-primary"' : 'disabled'}>Đổi ${recipe.cost} vật phẩm</button>
            </div>`;
    }
    foodExchangeContent() {
        const inventory = this.state.data.inventory;
        return `<div class="rpg-shop-gold"><strong>${escape(this.foodNPC?.name ?? 'Đầu bếp')}</strong><span>🍄 Nấm: ${inventory.yuna_mushroom ?? 0}</span></div>
            <p class="rpg-subtle">Mỗi món cần 5 Nấm YuNa và 5 cá cùng loại. Ăn món sẽ hồi HP/MP mỗi giây trong 3 phút; hiệu ứng mới thay thế hiệu ứng đang có.</p>
            <div class="rpg-shop-grid rpg-food-grid">${FOOD_RECIPES.map(recipe => {
                const error = this.state.canExchangeFood(recipe.id);
                return `<article class="rpg-shop-item rpg-food-item"><header><span class="rpg-item-emoji" role="img" aria-label="${escape(recipe.name)}" style="font-size:38px">${recipe.emoji}</span><div><h3>${escape(recipe.name)}</h3><span class="rpg-tier">${escape(recipe.fishName)}: ${inventory[recipe.fishId] ?? 0} / 5</span></div></header>
                    <p class="rpg-subtle">Hồi ${recipe.heal} HP và ${recipe.mana} MP mỗi giây · 3 phút</p>
                    <div class="rpg-shop-buy"><span>5 🍄 + 5 ${escape(recipe.fishName)}</span><button type="button" data-action="food-exchange" data-id="${recipe.id}" ${error ? `disabled title="${escape(error)}"` : 'class="rpg-primary"'}>${error || 'Đổi 1 món'}</button></div>
                </article>`;
            }).join('')}</div>`;
    }
    syncDialogue(open) { this.root.classList.toggle('talking', open); }
    toast(message) {
        const node = this.root.querySelector('.rpg-toast'); node.textContent=message;node.hidden=false;
        clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{node.hidden=true;},2800);
    }
    destroy() {
        if (this.destroyed) return;
        this.closeWorldMap();this.close();this.destroyed=true;this.unsubscribe();clearTimeout(this.toastTimer);
        window.removeEventListener('keydown',this.onKey);this.root.removeEventListener('click',this.onClick);this.root.remove();
    }
}
