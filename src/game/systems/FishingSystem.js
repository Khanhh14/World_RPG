import { fishingApi } from '../../api/fishingApi.js';
import { FishingUI } from '../ui/FishingUI.js';
export class FishingSystem {
  constructor(scene) {
    if (scene.mapData?.id !== 'atlast-lake') return;
    this.scene = scene; this.alive = true; this.phase = 'idle'; this.basketOpen = false; this.attemptId = null;
    this.ui = new FishingUI(() => this.start(), () => this.openBasket(), () => this.grantRod(), () => this.closeBasket(), () => this.cancel());
    this.originalUpdate = scene.update;
    scene.update = (...args) => {
      if (!this.alive) return;
      if (this.phase === 'casting' && (!this.near() || scene.hud?.blocked || document.hidden)) void this.cancel();
      if (this.phase !== 'idle' || this.basketOpen) scene.player?.stop();
      else this.originalUpdate.apply(scene, args);
      this.update();
    };
    this.onKey = event => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === 'tab' && this.basketOpen) {
        const buttons = [...this.ui.overlay.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        event.stopImmediatePropagation(); return;
      }
      if (key === 'escape' && (this.phase !== 'idle' || this.basketOpen)) {
        event.preventDefault(); event.stopImmediatePropagation(); this.basketOpen ? this.closeBasket() : void this.cancel();
      } else if (key === 'e' && this.near() && !scene.hud?.blocked && !scene.dialogue?.isOpen && !this.basketOpen) {
        event.preventDefault(); event.stopImmediatePropagation(); void this.start();
      } else if ((this.basketOpen || this.phase !== 'idle') && ['b','c','j','h'].includes(key)) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    this.onVisibility = () => { if (document.hidden && this.phase === 'casting') void this.cancel(); };
    window.addEventListener('keydown', this.onKey, true); document.addEventListener('visibilitychange', this.onVisibility);
    scene.events.once('shutdown', () => this.destroy());
    void this.load(true);
  }
  position() { return { mapId: this.scene.mapData.id, x: this.scene.player?.x, feetY: this.scene.player?.feetY }; }
  near() {
    const p = this.position(), s = this.data?.spot;
    return !!s && p.mapId === s.mapId && p.x >= s.minX && p.x <= s.maxX && p.feetY >= s.minY && p.feetY <= s.maxY;
  }
  async load(cancelOld = false) {
    try {
      const data = await fishingApi.bootstrap(); if (!this.alive) return;
      this.data = data; this.ui.inventory(data);
      if (cancelOld && data.activeId) await fishingApi.cancel(data.activeId);
    } catch (error) { if (this.alive) { this.ui.basketStatus(error.message); this.ui.toast(error.message); } }
  }
  openBasket() {
    if (!this.alive || this.phase !== 'idle' || this.scene.hud?.blocked || this.scene.dialogue?.isOpen) return;
    this.basketOpen = true; this.ui.showBasket(true); this.scene.player.stop(); void this.load(true);
  }
  closeBasket() { this.basketOpen = false; this.ui.showBasket(false); }
  async grantRod() {
    if (this.granting) return; this.granting = true;
    try { const data = await fishingApi.rod(); if (this.alive) { this.data = { ...this.data, ...data }; this.ui.inventory(data); this.ui.toast('Đã có cần câu. Đứng ở mép bến và nhấn E để câu.'); } }
    catch (error) { if (this.alive) this.ui.basketStatus(error.message); }
    finally { this.granting = false; }
  }
  async start() {
    if (!this.alive || this.phase !== 'idle' || this.basketOpen || !this.near() || this.scene.hud?.blocked || this.scene.dialogue?.isOpen) return;
    if (!this.data.hasRod) { this.ui.toast('Bạn cần cần câu. Mở Giỏ cá để nhận cần câu tập sự.'); return; }
    this.phase = 'starting'; this.scene.player.stop(); this.ui.setProgress(0);
    this.cancelRequested = false;
    try {
      const result = await fishingApi.start(this.position());
      if (!this.alive || this.cancelRequested) { await fishingApi.cancel(result.attemptId); if (this.alive) this.reset(); return; }
      this.attemptId = result.attemptId; this.startedAt = performance.now(); this.duration = result.durationMs; this.phase = 'casting';
    } catch (error) { if (this.alive) { this.reset(); this.ui.toast(error.message); } }
  }
  async finish() {
    if (this.phase !== 'casting') return;
    this.phase = 'finishing'; this.ui.setProgress(100, true);
    try {
      const result = await fishingApi.finish(this.attemptId, this.position());
      if (this.alive) {
        this.data = { ...this.data, ...result.inventory }; this.ui.inventory(result.inventory);
        this.ui.toast(`Bạn câu được ${result.fish.name} ×1! Đã lưu vào MySQL.`);
      }
    } catch (error) {
      if (this.alive) {
        this.ui.toast(error.message);
        // Nếu phản hồi finish bị mất nhưng đã lưu cá, cancel trả lại kết quả đã hoàn thành.
        try {
          const recovered = await fishingApi.cancel(this.attemptId);
          if (this.alive && recovered.result) this.ui.toast(`Đã nhận ${recovered.result.fish.name} ×1. Kết quả đã lưu.`);
        } catch { /* Mất mạng: lần mở Giỏ cá sau sẽ đọc lại dữ liệu. */ }
        if (this.alive) await this.load();
      }
    }
    finally { if (this.alive) this.reset(); }
  }
  async cancel() {
    if (this.phase === 'finishing') return; // Yêu cầu nhận cá đã gửi: đợi kết quả, không hứa hoàn tác.
    if (this.phase === 'starting') { this.cancelRequested = true; this.ui.toast('Đang hủy lượt câu…'); return; }
    if (!this.attemptId || this.phase === 'canceling') return;
    this.phase = 'canceling';
    try { await fishingApi.cancel(this.attemptId); if (this.alive) this.ui.toast('Đã hủy câu cá.'); }
    catch (error) { if (this.alive) this.ui.toast(error.message); }
    finally { if (this.alive) this.reset(); }
  }
  reset() { this.phase = 'idle'; this.attemptId = null; this.ui.progress.hidden = true; }
  update() {
    const visible = this.near() && !this.basketOpen && !this.scene.hud?.blocked && !this.scene.dialogue?.isOpen;
    const bar = this.scene.dialogueUI?.actionBar;
    this.ui.actionVisible(visible, bar?.layout, this.scene);
    // Chỉ phủ ô E, giữ nguyên các ô kỹ năng của HUD hiện tại.
    if (bar?.caption && visible) { bar.caption.setVisible(false); this.captionHidden = true; }
    else if (bar?.caption && this.captionHidden) { bar.caption.setVisible(bar.visible !== false); this.captionHidden = false; }
    if (this.phase === 'casting') {
      const percent = (performance.now() - this.startedAt) / this.duration * 100;
      this.ui.setProgress(percent); if (percent >= 100) void this.finish();
    }
  }
  destroy() {
    if (!this.alive) return; this.alive = false;
    if (this.attemptId && this.phase !== 'finishing') void fishingApi.cancel(this.attemptId).catch(() => {});
    window.removeEventListener('keydown', this.onKey, true); document.removeEventListener('visibilitychange', this.onVisibility);
    this.scene.update = this.originalUpdate; this.ui.destroy();
  }
}
