// Cấp nâng thuộc ô. Giới hạn kỹ thuật, không còn chặn ở +99.
export const MAX_ENHANCEMENT = 2147483647;
export const ENHANCEMENT_STATS = ['attack', 'defense', 'maxHP', 'maxMP'];
export const enhancementLevel = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, MAX_ENHANCEMENT) : 0;
export function enhancedItem(item, level = 0) {
    if (!item) return null;
    const result = { ...item }, n = enhancementLevel(level);
    for (const stat of ENHANCEMENT_STATS) {
        const base = Number(item[stat] || 0);
        // Mỗi cấp +10% chỉ số gốc, làm tròn lên phần tăng; không lũy kế theo cấp trước.
        if (base > 0) result[stat] = base + Math.ceil(base * 0.1) * n;
    }
    return result;
}
