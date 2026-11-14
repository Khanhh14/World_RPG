import { questApi } from '../../api/questApi.js';
import { ITEMS } from '../data/items.js';

export class QuestSystem {
  constructor(scene) {
    this.scene = scene;
    this.state = scene.rpgState;
    this.alive = true;
    scene.events.once('shutdown', () => { this.alive = false; });
    void this.load();
  }

  async load() {
    try {
      await this.refresh();
      if (!this.alive) return;
      for (const entry of [...this.state.data.pendingKills]) {
        const kill = typeof entry === 'string' ? { eventId: entry, mapId: 'west-forest' } : entry;
        await this.record('monster_kill', kill.mapId, kill.eventId, kill.dropItem);
      }
      if (['village','west-forest','atlast-lake'].includes(this.scene.mapData.id)) await this.record('visit', this.scene.mapData.id);
    } catch (error) {
      if (this.alive) this.scene.rpgState.setQuestLoadError(error.message);
    }
  }

  async refresh() {
    try {
      const result = await questApi.list();
      this.state.applyServerCharacter(result.character);
      if (this.alive) this.state.setQuests(result.quests);
      return result.quests;
    } catch (error) {
      if (this.alive) this.scene.rpgState.setQuestLoadError(error.message);
      throw error;
    }
  }

  retry() { void this.load(); }

  async record(eventType, mapId, eventId = crypto.randomUUID(), dropItem = null) {
    if (eventType === 'monster_kill' && !this.state.data.pendingKills.some(entry => (typeof entry === 'string' ? entry : entry.eventId) === eventId)) {
      this.state.data.pendingKills.push({ eventId, mapId, ...(dropItem ? { dropItem } : {}) }); this.state.changed();
    }
    const result = await questApi.progress(eventType, mapId, eventId, dropItem);
    if (eventType === 'monster_kill') this.state.data.pendingKills = this.state.data.pendingKills.filter(entry => (typeof entry === 'string' ? entry : entry.eventId) !== eventId);
    if (Array.isArray(result.items)) this.state.applyServerItems(result.items);
    if (result.dropItem) this.scene.hud?.toast(`Nhặt được ${ITEMS[result.dropItem]?.name || 'vật phẩm rơi Địa Long'}.`);
    this.state.applyServerCharacter(result.character);
    if (this.alive) this.state.setQuests(result.quests);
    else this.state.changed();
  }

  async recordKill(dropItem = null) {
    try {
      await this.record('monster_kill', this.scene.mapData.id, crypto.randomUUID(), dropItem);
    } catch (error) {
      if (this.alive) this.scene.rpgState.setQuestLoadError(error.message);
    }
  }

  async claim(questId) {
    const result = await questApi.claim(questId);
    this.state.applyServerCharacter(result.character);
    this.state.setQuests(result.quests);
    return result.alreadyClaimed
      ? 'Bạn đã nhận thưởng nhiệm vụ này.'
      : `Đã nhận ${result.quest.reward.exp} EXP · ${result.quest.reward.gold} vàng.`;
  }
}
