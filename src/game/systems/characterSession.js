import { ITEMS } from '../data/items.js';
let profile = null;
let accountId = null;
export const getCharacterAccountId = () => accountId;
export function setCharacterProfile(value, user) {
  if (!user?.id) throw new Error("Thiếu tài khoản đã xác thực.");
  profile = value; accountId = String(user.id);
}
export function getCharacterProfile() { return profile; }
// Dùng constructor hiện có, không ghi đè RPGState hoặc HUD của người dùng.
export function createCharacterState(StateClass, userId) {
  if (!profile?.id) throw new Error('Chưa có hồ sơ nhân vật sau đăng nhập.');
  if (String(userId) !== accountId) throw new Error("Nhân vật không thuộc phiên đăng nhập hiện tại.");
  const state = new StateClass(null, userId);
  const seed = JSON.parse(JSON.stringify(state.data));
  Object.assign(seed, { level: profile.level, exp: profile.exp, gold: profile.gold, hp: profile.hp, mp: profile.mana, gems: Number(profile.gems || 0), inventory: {}, visited: [], explorationClaimed: false });
  seed.foodBuff = profile.foodBuff || null;
  for (const slot of Object.keys(seed.equipment || {})) seed.equipment[slot] = null;
  for (const item of profile.items || []) {
    if (!ITEMS[item.id]) continue;
    seed.inventory[item.id] = (seed.inventory[item.id] || 0) + item.quantity;
    if (item.location === 'equipment' && Object.hasOwn(seed.equipment || {}, item.slot)) seed.equipment[item.slot] = item.id;
  }
  const prefix = `tiny-rpg-character-${profile.id}:`;
  let storage; try { storage = globalThis.localStorage; } catch { storage = null; }
  const seedJSON = JSON.stringify(seed);
  seed.wings = profile.wings ?? null;
  state.data = seed;
  state.storage = {
    getItem(key) { try { return storage?.getItem(prefix + key) ?? seedJSON; } catch { return seedJSON; } },
    setItem(key, value) { try { storage?.setItem(prefix + key, value); } catch { /* Chơi được khi storage bị chặn. */ } },
    removeItem(key) { try { storage?.removeItem(prefix + key); } catch {} },
  };
  state.restore();
  seed.inventory = {};
  for (const slot of Object.keys(seed.equipment || {})) seed.equipment[slot] = null;
  for (const item of profile.items || []) {
    if (!ITEMS[item.id]) continue;
    seed.inventory[item.id] = (seed.inventory[item.id] || 0) + item.quantity;
    if (item.location === 'equipment' && Object.hasOwn(seed.equipment || {}, item.slot)) seed.equipment[item.slot] = item.id;
  }
  state.data.inventory = seed.inventory;
  state.data.equipment = seed.equipment;
  Object.assign(state.data, { characterId: profile.id, name: profile.name, classCode: profile.classCode, className: profile.class.name, playerFrame: profile.class.frame });
  // MySQL là nguồn chính cho kinh tế; localStorage chỉ giữ giao diện/túi đồ hiện có.
  state.applyServerCharacter(profile);
  if(profile.runtime){
    state.data.hp=profile.runtime.hp<=0?state.maxHP:Math.min(profile.runtime.hp,state.maxHP);
    state.data.mp=Math.min(profile.runtime.mp,state.maxMP);
  }
  state.changed();
  if (state.data.pendingPurchase) void state.recoverPurchase();
  if (state.data.pendingItemUse) void state.recoverItemUse();
  if (state.data.pendingInventoryAction) void state.recoverInventoryAction();
  if (state.data.pendingMonsterDrops?.length) void state.flushMonsterDrops();
  if (state.data.pendingEquipmentAction) void state.recoverEquipmentAction();
  return state;
}
// Gắn ngoại hình và tên sau khi Scene đã tạo player + HUD.
export function applyCharacterToScene(scene) {
  if (!profile) return;
  scene.registry.set('active-character', profile);
  scene.registry.set('active-character-id', profile.id);
  scene.player?.sprite?.setFrame(profile.class.frame);
  if (scene.rpgState?.data) Object.assign(scene.rpgState.data, { name: profile.name, classCode: profile.classCode, className: profile.class.name, playerFrame: profile.class.frame });
  // Các HUD cũ có chữ Lữ khách viết cố định: sửa text tại DOM, không thay bố cục/CSS.
  const refresh = () => {
    const root = document.querySelector('.rpg-ui'); if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('Lữ khách')) nodes.push(walker.currentNode);
    for (const node of nodes) node.nodeValue = node.nodeValue.replaceAll('Lữ khách', profile.name);
    for (const icon of root.querySelectorAll('.rpg-portrait>.rpg-icon,.rpg-character-hero>.rpg-icon')) {
      const size = parseFloat(icon.style.width); if (!size) continue;
      const position = `-${profile.class.frame % 12 * size}px -${Math.floor(profile.class.frame / 12) * size}px`;
      if (icon.style.backgroundPosition !== position && icon.dataset.characterFrame !== String(profile.class.frame)) {
        icon.style.backgroundPosition = position; icon.dataset.characterFrame = String(profile.class.frame);
      }
    }
  };
  refresh();
  const hudRoot = document.querySelector('.rpg-ui');
  if (hudRoot) {
    const observer = new MutationObserver(refresh); observer.observe(hudRoot, { childList: true, subtree: true });
    scene.events.once('shutdown', () => observer.disconnect());
  }
}
