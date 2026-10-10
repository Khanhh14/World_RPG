import { ITEMS, EQUIPMENT_SLOTS, BAG_CAPACITY } from '../data/items.js';
export { ITEMS } from '../data/items.js';
export const DESTINATIONS = [
    ['village', 'Làng Khởi Đầu'], ['west-forest', 'Khu Rừng Phía Tây'], ['atlast-lake', 'Hồ Nước Atlast']
];
const SAVE_KEY = 'tiny-rpg-progress-v1';
const integer = (value, min, max, fallback) => Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;

export class RPGState {
    static forScene(scene) {
        let state = scene.registry.get('rpg-state-v1');
        if (!state) { state = new RPGState(); scene.registry.set('rpg-state-v1', state); }
        return state;
    }
    constructor(storage) {
        this.listeners = new Set();
        try { this.storage = storage === undefined ? globalThis.localStorage : storage; } catch { this.storage = null; }
        this.data = {
            version: 2, level: 1, exp: 0, hp: 100, mp: 50, gold: 50,
            inventory: { health_potion: 5, mana_potion: 3, iron_sword: 1, wood_staff: 1, round_shield: 1 },
            equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(([slot]) => [slot, null])), visited: [], explorationClaimed: false
        };
        this.restore();
    }
    bonus(stat) { return Object.values(this.data.equipment).reduce((sum, id) => sum + (ITEMS[id]?.[stat] ?? 0), 0); }
    get maxHP() { return 100 + (this.data.level - 1) * 10 + this.bonus("maxHP"); }
    get maxMP() { return 50 + (this.data.level - 1) * 5; }
    get expNeeded() { return this.data.level * 100; }
    get attack() { return 10 + (this.data.level - 1) * 2 + this.bonus("attack"); }
    get defense() { return 5 + this.data.level - 1 + this.bonus("defense"); }
    get explorationReady() { return DESTINATIONS.every(([id]) => this.data.visited.includes(id)); }
    restore() {
        try {
            const saved = JSON.parse(this.storage?.getItem(SAVE_KEY) ?? 'null');
            if (!saved || ![1, 2].includes(saved.version)) return;
            this.data.level = integer(saved.level, 1, 100, 1);
            this.data.exp = integer(saved.exp, 0, this.expNeeded - 1, 0);
            this.data.mp = integer(saved.mp, 0, this.maxMP, this.maxMP);
            this.data.gold = integer(saved.gold, 0, 9999999, 50);
            for (const id of Object.keys(ITEMS)) this.data.inventory[id] = integer(saved.inventory?.[id], 0, 99, 0);
            for (const [slot] of EQUIPMENT_SLOTS) {
                const id = saved.equipment?.[slot];
                if (ITEMS[id]?.type === slot && this.data.inventory[id] > 0) this.data.equipment[slot] = id;
            }
            this.data.hp = integer(saved.hp, 0, this.maxHP, this.maxHP);
            this.data.visited = DESTINATIONS.map(([id]) => id).filter(id => saved.visited?.includes?.(id));
            this.data.explorationClaimed = saved.explorationClaimed === true;
        } catch { /* Dữ liệu không hợp lệ: dùng trạng thái khởi đầu. */ }
    }
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    changed() {
        try { this.storage?.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch { /* Vẫn chơi được khi storage bị chặn. */ }
        for (const fn of this.listeners) fn(this.data);
    }
    visit(id) {
        if (DESTINATIONS.some(([key]) => key === id) && !this.data.visited.includes(id)) {
            this.data.visited.push(id); this.changed();
        }
    }
    takeDamage(amount) {
        this.data.hp = Math.max(0, this.data.hp - integer(amount, 0, 999999, 0)); this.changed();
    }
    spendMana(amount) {
        amount = integer(amount, 0, 999999, 0);
        if (this.data.mp < amount) return false;
        this.data.mp -= amount; this.changed(); return true;
    }
    addGold(amount) { this.data.gold = Math.min(9999999, this.data.gold + integer(amount, 0, 9999999, 0)); this.changed(); }
    addExperience(amount) {
        this.data.exp += integer(amount, 0, 1000000, 0);
        while (this.data.level < 100 && this.data.exp >= this.expNeeded) {
            this.data.exp -= this.expNeeded; this.data.level++;
            this.data.hp = this.maxHP; this.data.mp = this.maxMP;
        }
        if (this.data.level === 100) this.data.exp = Math.min(this.data.exp, this.expNeeded - 1);
        this.changed();
    }
    canAdd(id, quantity = 1) {
        const item = ITEMS[id], count = this.data.inventory[id] ?? 0;
        if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return 'Số lượng không hợp lệ.';
        if (count + quantity > item.maxStack) return item.maxStack === 1 ? 'Bạn đã sở hữu trang bị này.' : 'Mỗi ô chứa tối đa 99 bình.';
        if (!count && Object.values(this.data.inventory).filter(n => n > 0).length >= BAG_CAPACITY) return 'Ba lô đã đầy.';
        return null;
    }
    canBuy(id, quantity = 1) {
        const error = this.canAdd(id, quantity);
        if (error) return { ok:false, message:error };
        if (this.data.gold < ITEMS[id].price * quantity) return { ok:false, message:'Không đủ vàng.' };
        return { ok:true, message:'' };
    }
    buyItem(id, quantity = 1) {
        const check = this.canBuy(id, quantity);
        if (!check.ok) return check;
        this.data.gold -= ITEMS[id].price * quantity;
        this.data.inventory[id] = (this.data.inventory[id] ?? 0) + quantity;
        this.changed();
        return { ok:true, message:`Đã mua ${quantity} ${ITEMS[id].name.toLowerCase()}.` };
    }
    addItem(id, quantity = 1) {
        if (this.canAdd(id, quantity)) return false;
        this.data.inventory[id] = (this.data.inventory[id] ?? 0) + quantity;
        this.changed(); return true;
    }
    useItem(id) {
        const item = ITEMS[id];
        if (!item || !this.data.inventory[id]) return 'Không có vật phẩm này.';
        if (item.type === 'consumable') {
            if (item.heal) {
                if (this.data.hp >= this.maxHP) return 'Máu đã đầy, bình chưa bị sử dụng.';
                this.data.hp = Math.min(this.maxHP, this.data.hp + item.heal);
            } else {
                if (this.data.mp >= this.maxMP) return 'Năng lượng đã đầy, bình chưa bị sử dụng.';
                this.data.mp = Math.min(this.maxMP, this.data.mp + item.mana);
            }
            this.data.inventory[id]--; this.changed(); return `Đã dùng ${item.name.toLowerCase()}.`;
        }
        const equipped = this.data.equipment[item.type] === id;
        this.data.equipment[item.type] = equipped ? null : id;
        this.data.hp = Math.min(this.data.hp, this.maxHP);
        this.changed(); return `${equipped ? 'Đã tháo' : 'Đã trang bị'} ${item.name.toLowerCase()}.`;
    }
    claimExploration() {
        if (this.data.explorationClaimed) return 'Bạn đã nhận thưởng nhiệm vụ này.';
        if (!this.explorationReady) return 'Hãy ghé thăm đủ ba khu vực.';
        this.data.explorationClaimed = true;
        this.data.gold = Math.min(9999999, this.data.gold + 30);
        this.addExperience(120);
        return 'Hoàn thành khám phá! +120 EXP · +30 vàng';
    }
}
