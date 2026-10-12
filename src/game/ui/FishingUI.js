import './fishing.css';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export class FishingUI {
  constructor(onAction, onBasket, onRod, onClose, onCancel) {
    this.root = document.createElement('div'); this.root.className = 'fishing-ui';
    this.root.innerHTML = `<button class="fish-basket-button">Giỏ cá</button><button class="fish-action" hidden><span class="fish-action-label">Câu cá</span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 38L28 8" stroke="#d7b36b" stroke-width="5"/><path d="M28 8Q40 14 36 29" fill="none" stroke="#efe7ca" stroke-width="2"/><path d="M36 29v8q0 7-6 4" fill="none" stroke="#efe7ca" stroke-width="2"/></svg><b>E</b></button><div class="fish-progress" hidden><strong>Đang câu cá…</strong><div class="fish-track" role="progressbar" aria-label="Tiến trình câu cá" aria-valuemin="0" aria-valuemax="100"><div></div></div><span>Chờ cá cắn câu</span><button class="fish-cancel">Hủy · Esc</button></div><div class="fish-message" role="status" hidden></div><div class="fish-overlay" hidden><section class="fish-modal" role="dialog" aria-modal="true" aria-labelledby="fish-title"><header><h2 id="fish-title">Giỏ cá</h2><button class="fish-close">Đóng · Esc</button></header><p class="fish-info">Cần câu và cá được lưu theo nhân vật trong MySQL.</p><div class="fish-items"></div><button class="fish-rod">Nhận cần câu tập sự</button><p class="fish-status" role="status"></p></section></div>`;
    document.body.appendChild(this.root);
    this.action = this.root.querySelector('.fish-action'); this.progress = this.root.querySelector('.fish-progress'); this.overlay = this.root.querySelector('.fish-overlay');
    this.action.onclick = onAction; this.root.querySelector('.fish-basket-button').onclick = onBasket;
    this.root.querySelector('.fish-rod').onclick = onRod; this.root.querySelector('.fish-close').onclick = onClose; this.root.querySelector('.fish-cancel').onclick = onCancel;
  }
  actionVisible(visible, layout, scene) {
    this.action.hidden = !visible;
    if (visible && layout && scene.game?.canvas) {
      const rect = scene.game.canvas.getBoundingClientRect(), sx = rect.width / scene.scale.width, sy = rect.height / scene.scale.height;
      Object.assign(this.action.style, { left: `${rect.left + layout.x * sx}px`, top: `${rect.top + layout.y * sy}px`, width: `${layout.big * sx}px`, height: `${layout.big * sy}px`, right:'auto', bottom:'auto' });
    }
  }
  showBasket(open) {
    this.overlay.hidden = !open;
    if (open) { this.previousFocus = document.activeElement; this.root.querySelector('.fish-close').focus(); }
    else this.previousFocus?.isConnected && this.previousFocus.focus();
  }
  inventory(data) {
    const totals = new Map();
    for (const item of data.items || []) { const old = totals.get(item.id); totals.set(item.id, { ...item, quantity: item.quantity + (old?.quantity || 0) }); }
    this.root.querySelector('.fish-items').innerHTML = [...totals.values()].map(item => `<article><span>${item.id === 'starter_fishing_rod' ? '🎣' : '🐟'}</span><div>${escape(item.name)}<small>× ${item.quantity}</small></div></article>`).join('') || '<p>Chưa có cần câu hoặc cá.</p>';
    const rod = this.root.querySelector('.fish-rod'); rod.disabled = data.hasRod; rod.textContent = data.hasRod ? 'Đã có cần câu tập sự' : 'Nhận cần câu tập sự · Miễn phí';
    this.root.querySelector('.fish-status').textContent = 'Đã tải từ MySQL · Nhân vật #' + data.characterId;
  }
  basketStatus(text) { this.root.querySelector('.fish-status').textContent = text; }
  setProgress(percent, finishing = false) {
    this.progress.hidden = false;
    const value = Math.max(0, Math.min(100, percent));
    this.root.querySelector('.fish-track>div').style.width = value + '%';
    this.root.querySelector('.fish-track').setAttribute('aria-valuenow', Math.floor(value));
    this.progress.querySelector('span').textContent = finishing ? 'Đang nhận cá từ máy chủ…' : `${Math.floor(value)}% · Esc để hủy`;
    this.root.querySelector('.fish-cancel').disabled = finishing;
  }
  toast(text) { const node = this.root.querySelector('.fish-message'); node.textContent = text; node.hidden = false; clearTimeout(this.timer); this.timer = setTimeout(() => node.hidden = true, 4500); }
  destroy() { clearTimeout(this.timer); this.root.remove(); }
}
