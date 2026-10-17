import { MAX_ENHANCEMENT, enhancementLevel, enhancedItem } from '../data/enhancement.js';
import { wingStats } from '../data/wings.js';
import { purchaseItem } from '../../api/shopApi.js';
import {
    createCharacterState,
    getCharacterProfile,
    getCharacterAccountId
} from './characterSession.js';

import {
    ITEMS,
    EQUIPMENT_SLOTS,
    BAG_CAPACITY,
    MONSTER_MATERIALS
} from '../data/items.js';

export { ITEMS } from '../data/items.js';

export const DESTINATIONS = [
    ['village', 'Làng Khởi Đầu'],
    ['west-forest', 'Khu Rừng Phía Tây'],
    ['atlast-lake', 'Hồ Nước Atlast']
];

const SAVE_KEY = 'tiny-rpg-progress-v1';

const integer = (value, min, max, fallback) => {
    return Number.isFinite(value)
        ? Math.max(min, Math.min(max, Math.floor(value)))
        : fallback;
};

export class RPGState {
    static forScene(scene) {
        const accountId =
            scene.registry.get('auth-user')?.id ??
            getCharacterAccountId();

        if (
            (typeof accountId !== 'string' &&
                typeof accountId !== 'number') ||
            !String(accountId).trim()
        ) {
            throw new Error(
                'Không thể tải tiến trình game khi chưa xác định được tài khoản đăng nhập.'
            );
        }

        const userId = String(accountId);
        const characterId = getCharacterProfile()?.id;

        if (!characterId) {
            throw new Error('Chưa chọn nhân vật. Hãy đăng nhập lại.');
        }

        let state = scene.registry.get('rpg-state-v1');

        if (
            !state ||
            state.userId !== userId ||
            String(state.data.characterId) !== String(characterId)
        ) {
            state = createCharacterState(RPGState, userId);
            scene.registry.set('rpg-state-v1', state);
        }

        return state;
    }

    constructor(storage, userId) {
        if (
            (typeof userId !== 'string' &&
                typeof userId !== 'number') ||
            !String(userId).trim()
        ) {
            throw new Error(
                'RPGState cần ID tài khoản để lưu tiến trình riêng.'
            );
        }

        this.userId = String(userId);
        this.saveKey = `${SAVE_KEY}:${encodeURIComponent(this.userId)}`;
        this.listeners = new Set();
        this.serverRevision = -1;

        try {
            this.storage =
                storage === undefined ? globalThis.localStorage : storage;
        } catch {
            this.storage = null;
        }

        // createCharacterState sẽ nạp dữ liệu của nhân vật đã chọn.
        this.data = {
            version: 2,
            level: 1,
            exp: 0,
            hp: 100,
            mp: 50,
            gold: 50,
            gems: 0,
            wings: null,
            pendingWingAction: null,
            skills: null,
            pendingSkillAction: null,
            pendingPurchase: null,
            pendingKills: [],

            inventory: {
                health_potion: 5,
                mana_potion: 3,
                iron_sword: 1,
                wood_staff: 1,
                round_shield: 1
            },

            enhancements: Object.fromEntries(EQUIPMENT_SLOTS.map(([slot]) => [slot, 0])),
            equipment: Object.fromEntries(
                EQUIPMENT_SLOTS.map(([slot]) => [slot, null])
            ),

            visited: [],
            explorationClaimed: false,
            quests: [],
            questLoadStatus: 'loading',
            questLoadError: ''
        };

        this.restore();
    }

    bonus(stat) {
        return EQUIPMENT_SLOTS.reduce(
            (sum, [slot]) => sum + (this.equippedStats(slot)?.[stat] ?? 0),
            0
        ) + this.wingBonus(stat);
    }

    enhancementLevel(slot) { return enhancementLevel(this.data.enhancements?.[slot]); }

    equippedStats(slot) {
        return enhancedItem(ITEMS[this.data.equipment[slot]], this.enhancementLevel(slot));
    }

    enhancementCheck(slot) {
        if (!EQUIPMENT_SLOTS.some(([key]) => key === slot)) return { ok:false, message:'Ô trang bị không hợp lệ.' };
        if (!ITEMS[this.data.equipment[slot]]) return { ok:false, message:'Hãy mặc trang bị vào ô này trước.' };
        const level = this.enhancementLevel(slot), cost = Math.min(level + 1, 10);
        if (level >= MAX_ENHANCEMENT) return { ok:false, level, cost:0, message:'Ô này đã đạt cấp cường hóa tối đa.' };
        const stones = this.data.inventory.upgrade_stone ?? 0;
        if (!Number.isSafeInteger(stones) || stones < cost) return { ok:false, level, cost, message:`Cần ${cost} đá nâng cấp trang bị để lên +${level+1}.` };
        return { ok:true, level, cost, message:'' };
    }

    upgradeEquipment(slot, expectedLevel) {
        const check = this.enhancementCheck(slot);
        if (!check.ok) return check;
        if (expectedLevel !== check.level) return { ok:false, message:'Cấp nâng đã thay đổi. Hãy kiểm tra lại.' };
        const next = { ...this.data,
            inventory: { ...this.data.inventory, upgrade_stone:this.data.inventory.upgrade_stone-check.cost },
            enhancements: { ...this.data.enhancements, [slot]:check.level+1 }
        };
        // Lưu cả đá lẫn cấp trong một bản ghi trước khi cập nhật UI. Không mất đá nếu lưu thất bại.
        try {
            this.storage?.setItem(this.saveKey, JSON.stringify(next));
            const stored = JSON.parse(this.storage?.getItem(this.saveKey) || 'null');
            if (stored?.enhancements?.[slot] !== check.level+1 || stored?.inventory?.upgrade_stone !== next.inventory.upgrade_stone) throw new Error();
        } catch { return { ok:false, message:'Không lưu được cường hóa. Hãy cho phép lưu dữ liệu trình duyệt; chưa trừ đá.' }; }
        this.data.inventory = next.inventory; this.data.enhancements = next.enhancements;
        this.changed();
        return { ok:true, message:`Cường hóa ${EQUIPMENT_SLOTS.find(([key])=>key===slot)[1].toLowerCase()} lên +${check.level+1} · −${check.cost} đá.` };
    }

    wingBonus(stat) {
        // Chỉ số bộ sưu tập luôn có hiệu lực, không phụ thuộc cánh đang hiển thị.
        return (this.data.wings?.collection ?? []).reduce((total, owned) =>
            total + (wingStats(owned.id, owned.level)[stat] || 0), 0);
    }

    get maxHP() {
        return 100 + (this.data.level - 1) * 10 + this.bonus('maxHP');
    }

    get maxMP() {
        return 50 + (this.data.level - 1) * 5;
    }

    get expNeeded() {
        return this.data.level * 100;
    }

    get attack() {
        return 10 + (this.data.level - 1) * 2 + this.bonus('attack');
    }

    get defense() {
        return 5 + this.data.level - 1 + this.bonus('defense');
    }

    get explorationReady() {
        return DESTINATIONS.every(([id]) =>
            this.data.visited.includes(id)
        );
    }

    restore() {
        try {
            const saved = JSON.parse(
                this.storage?.getItem(this.saveKey) ?? 'null'
            );

            if (!saved || ![1, 2].includes(saved.version)) return;

            this.data.level = integer(saved.level, 1, 100, 1);
            this.data.exp = integer(
                saved.exp,
                0,
                this.expNeeded - 1,
                0
            );

            this.data.mp = integer(saved.mp, 0, this.maxMP, this.maxMP);
            this.data.gold = integer(saved.gold, 0, 9999999, 50);
            this.data.pendingPurchase = saved.pendingPurchase || null;
            this.data.pendingWingAction = saved.pendingWingAction || null;
            this.data.pendingSkillAction = saved.pendingSkillAction || null;
            this.data.pendingKills = Array.isArray(saved.pendingKills) ? saved.pendingKills.filter(id => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id)) : [];

            for (const id of Object.keys(ITEMS)) {
                this.data.inventory[id] = integer(
                    saved.inventory?.[id],
                    0,
                    99,
                    0
                );
            }

            for (const [slot] of EQUIPMENT_SLOTS) {
                this.data.enhancements[slot] = enhancementLevel(saved.enhancements?.[slot]);
                const id = saved.equipment?.[slot];

                if (
                    ITEMS[id]?.type === slot &&
                    this.data.inventory[id] > 0
                ) {
                    this.data.equipment[slot] = id;
                }
            }

            this.data.hp = integer(
                saved.hp,
                0,
                this.maxHP,
                this.maxHP
            );

            this.data.visited = DESTINATIONS
                .map(([id]) => id)
                .filter(id => saved.visited?.includes?.(id));

            this.data.explorationClaimed =
                saved.explorationClaimed === true;
        } catch {
            // Dữ liệu không hợp lệ: giữ trạng thái khởi đầu.
        }
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    changed() {
        try {
            this.storage?.setItem(
                this.saveKey,
                JSON.stringify(this.data)
            );
        } catch {
            // Vẫn chơi được khi trình duyệt chặn lưu dữ liệu.
        }

        for (const fn of this.listeners) {
            fn(this.data);
        }
    }

    setQuests(quests) {
        this.data.quests = Array.isArray(quests) ? quests : [];
        this.data.questLoadStatus = 'ready';
        this.data.questLoadError = '';
        this.changed();
    }

    setQuestLoadError(message) {
        this.data.questLoadStatus = 'error';
        this.data.questLoadError = String(message || 'Không tải được nhiệm vụ.');
        this.changed();
    }

    visit(id) {
        const validDestination = DESTINATIONS.some(
            ([key]) => key === id
        );

        if (validDestination && !this.data.visited.includes(id)) {
            this.data.visited.push(id);
            this.changed();
        }
    }

    takeDamage(amount) {
        this.data.hp = Math.max(
            0,
            this.data.hp - integer(amount, 0, 999999, 0)
        );

        this.changed();
    }

    spendMana(amount) {
        amount = integer(amount, 0, 999999, 0);

        if (this.data.mp < amount) return false;

        this.data.mp -= amount;
        this.changed();

        return true;
    }

    // Tiền/EXP chỉ thay đổi khi nhận phản hồi đã lưu thành công từ backend.
    applyServerCharacter(character) {
        if (!character || String(character.id) !== String(this.data.characterId)) return false;
        const revision = Number(character.revision);
        if (!Number.isSafeInteger(revision) || revision < this.serverRevision) return false;
        const previousLevel = this.data.level;
        this.serverRevision = revision;
        for (const field of ['level', 'exp', 'gold', 'gems']) {
            const value = Number(character[field]);
            if (Number.isSafeInteger(value) && value >= 0) this.data[field] = value;
        }
        // Không ghi đè HP/MP đang chiến đấu bằng snapshot HP cũ từ DB.
        if (this.data.level > previousLevel) {
            this.data.hp = this.maxHP; this.data.mp = this.maxMP;
        }
        this.data.hp = Math.min(this.data.hp, this.maxHP);
        this.data.mp = Math.min(this.data.mp, this.maxMP);
        this.changed();
        return true;
    }

    canAdd(id, quantity = 1) {
        const item = ITEMS[id];
        const count = this.data.inventory[id] ?? 0;

        if (
            !item ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 99
        ) {
            return 'Số lượng không hợp lệ.';
        }

        if (count + quantity > item.maxStack) {
            return item.maxStack === 1
                ? 'Bạn đã sở hữu trang bị này.'
                : 'Mỗi ô chứa tối đa 99 bình.';
        }

        const usedSlots = Object.values(this.data.inventory)
            .filter(number => number > 0)
            .length;

        if (!count && usedSlots >= BAG_CAPACITY) {
            return 'Ba lô đã đầy.';
        }

        return null;
    }

    canBuy(id, quantity = 1) {
        const error = this.canAdd(id, quantity);

        if (error) {
            return { ok: false, message: error };
        }

        if (this.data.gold < ITEMS[id].price * quantity) {
            return { ok: false, message: 'Không đủ vàng.' };
        }

        return { ok: true, message: '' };
    }

    async buyItem(id, quantity = 1) {
        if (this.buying) return { ok: false, message: 'Đang xử lý giao dịch…' };
        if (this.data.pendingPurchase) {
            const recovered = await this.recoverPurchase();
            return { ...recovered, message: recovered.ok ? 'Đã khôi phục giao dịch trước. Hãy chọn món tiếp theo.' : recovered.message };
        }
        const check = this.canBuy(id, quantity);
        if (!check.ok) return check;
        this.data.pendingPurchase = { requestId: crypto.randomUUID(), itemId: id, quantity };
        // Lưu yêu cầu trước khi trừ vàng. Nếu storage bị chặn thì không gửi mua hàng.
        try {
            if (!this.storage) throw new Error();
            this.storage.setItem(this.saveKey, JSON.stringify(this.data));
            const saved = JSON.parse(this.storage.getItem(this.saveKey));
            if (saved.pendingPurchase?.requestId !== this.data.pendingPurchase.requestId) throw new Error();
        } catch {
            this.data.pendingPurchase = null;
            return { ok: false, message: 'Hãy cho phép lưu dữ liệu trình duyệt để mua đồ an toàn.' };
        }
        return this.recoverPurchase();
    }

    async recoverPurchase() {
        if (this.buying || !this.data.pendingPurchase) return { ok: false, message: 'Đang xử lý giao dịch…' };
        this.buying = true;
        try {
            const result = await purchaseItem(this.data.pendingPurchase);
            const { itemId, quantity } = result.purchase;
            this.data.inventory[itemId] = (this.data.inventory[itemId] || 0) + quantity;
            this.data.pendingPurchase = null;
            this.applyServerCharacter(result.character);
            this.changed();
            return { ok: true, message: `Đã mua ${quantity} ${ITEMS[itemId]?.name || itemId}.` };
        } catch (error) {
            if (error.status === 400 || error.status === 409) {
                this.data.pendingPurchase = null; this.changed();
            }
            return { ok: false, message: error.message || 'Chưa xác nhận mua đồ. Mở lại game hoặc bấm mua để kiểm tra giao dịch cũ.' };
        } finally { this.buying = false; }
    }

    addItem(id, quantity = 1) {
        if (this.canAdd(id, quantity)) return false;

        this.data.inventory[id] =
            (this.data.inventory[id] ?? 0) + quantity;

        this.changed();

        return true;
    }

    canExchangeMonsterMaterials() {
        const total = MONSTER_MATERIALS.reduce(
            (sum, material) => sum + (this.data.inventory[material.id] ?? 0),
            0
        );
        if (total < 10) {
            return `Cần thêm ${10 - total} vật phẩm rơi từ quái để đổi.`;
        }

        let remaining = 10;
        let freesSlot = false;
        for (const material of MONSTER_MATERIALS) {
            const count = Math.min(remaining, this.data.inventory[material.id] ?? 0);
            if (count && count === this.data.inventory[material.id]) freesSlot = true;
            remaining -= count;
            if (!remaining) break;
        }

        const error = this.canAdd('upgrade_stone');
        if (error && !(error === 'Ba lô đã đầy.' && freesSlot && !this.data.inventory.upgrade_stone)) {
            return error;
        }
        return '';
    }

    exchangeMonsterMaterials() {
        const error = this.canExchangeMonsterMaterials();
        if (error) return { ok: false, message: error };
        let remaining = 10;
        for (const material of MONSTER_MATERIALS) {
            const count = Math.min(remaining, this.data.inventory[material.id] ?? 0);
            this.data.inventory[material.id] -= count;
            remaining -= count;
            if (!remaining) break;
        }
        this.data.inventory.upgrade_stone = (this.data.inventory.upgrade_stone ?? 0) + 1;
        this.changed();
        return { ok: true, message: 'Đổi thành công 10 vật phẩm quái lấy 1 đá nâng cấp trang bị.' };
    }

    useItem(id) {
        const item = ITEMS[id];

        if (!item || !this.data.inventory[id]) {
            return 'Không có vật phẩm này.';
        }

        if (item.type === 'consumable') {
            if (item.heal) {
                if (this.data.hp >= this.maxHP) {
                    return 'Máu đã đầy, bình chưa bị sử dụng.';
                }

                this.data.hp = Math.min(
                    this.maxHP,
                    this.data.hp + item.heal
                );
            } else {
                if (this.data.mp >= this.maxMP) {
                    return 'Năng lượng đã đầy, bình chưa bị sử dụng.';
                }

                this.data.mp = Math.min(
                    this.maxMP,
                    this.data.mp + item.mana
                );
            }

            this.data.inventory[id]--;
            this.changed();

            return `Đã dùng ${item.name.toLowerCase()}.`;
        }

        if (!EQUIPMENT_SLOTS.some(([slot]) => slot === item.type)) {
            return 'Vật phẩm này không thể sử dụng hoặc trang bị.';
        }

        const equipped = this.data.equipment[item.type] === id;

        this.data.equipment[item.type] = equipped ? null : id;
        this.data.hp = Math.min(this.data.hp, this.maxHP);

        this.changed();

        return `${equipped ? 'Đã tháo' : 'Đã trang bị'} ${item.name.toLowerCase()}.`;
    }

    claimExploration() {
        return 'Hãy nhận thưởng trong bảng nhiệm vụ để lưu vào MySQL.';
    }
}
