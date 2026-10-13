import { ITEMS } from '../data/items.js';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export class FishingUI {
  constructor(onAction, onRod, onClose, onCancel, onSell) {
    const stylesheet = '/assets/style/fishing.css';
    let link = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find(node => new URL(node.href, document.baseURI).pathname === stylesheet);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== stylesheet + '?v=fishing-merchant-3') link.setAttribute('href', stylesheet + '?v=fishing-merchant-3');
    const shopStylesheet = '/assets/style/fishing-merchant.css';
    const shopLink = document.createElement('link');
    shopLink.rel = 'stylesheet';
    shopLink.href = shopStylesheet + '?v=fishing-merchant-1';
    document.head.appendChild(shopLink);
    this.shopLink = shopLink;
    this.root = document.createElement('div'); this.root.className = 'fishing-ui';
    this.root.innerHTML = `<button class="fish-action" hidden><span class="fish-action-label">Câu cá</span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 38L28 8" stroke="#d7b36b" stroke-width="5"/><path d="M28 8Q40 14 36 29" fill="none" stroke="#efe7ca" stroke-width="2"/><path d="M36 29v8q0 7-6 4" fill="none" stroke="#efe7ca" stroke-width="2"/></svg><b>E</b></button><div class="fish-progress" hidden><strong>Đang câu cá…</strong><div class="fish-track" role="progressbar" aria-label="Tiến trình câu cá" aria-valuemin="0" aria-valuemax="100"><div></div></div><span>Chờ cá cắn câu</span><button class="fish-cancel">Hủy · Esc</button></div><div class="fish-message" role="status" hidden></div><div class="fish-overlay" hidden><section class="fish-modal" role="dialog" aria-modal="true" aria-labelledby="fish-title"><header class="fish-shop-header"><div class="fish-shop-emblem" aria-hidden="true">🎣</div><div class="fish-shop-heading"><span class="fish-shop-kicker">CỬA HÀNG BẾN CÁ</span><h2 id="fish-title">Cần thủ Hồ Atlast</h2></div><button class="fish-close">Đóng <kbd>Esc</kbd></button></header><p class="fish-info">Mua cần câu để bắt đầu chuyến câu. Ta cũng thu mua cá ngay tại đây.</p><div class="fish-shop-wallet"><span>VÍ CỦA BẠN</span><strong><i>●</i> <b class="fish-gold"></b> vàng</strong></div><section class="fish-rod-offer"><span class="fish-rod-icon" aria-hidden="true">🎣</span><div class="fish-rod-copy"><strong>Cần câu tập sự</strong><span>Dụng cụ cơ bản · Câu cá ở bến Hồ Atlast</span><b>50 vàng</b></div><button class="fish-rod">Mua cần câu</button></section><section class="fish-buyback"><header><div><span>THU MUA</span><h3>Cá trong túi đồ</h3></div><p>Chọn cá để bán hết số lượng đang có</p></header><div class="fish-items"></div></section><p class="fish-status" role="status"></p></section></div>`;
    document.body.appendChild(this.root);
    this.action = this.root.querySelector('.fish-action'); this.progress = this.root.querySelector('.fish-progress'); this.overlay = this.root.querySelector('.fish-overlay');
    this.action.onclick = onAction;
    this.root.querySelector('.fish-rod').onclick = onRod; this.root.querySelector('.fish-close').onclick = onClose; this.root.querySelector('.fish-cancel').onclick = onCancel;
    this.root.querySelector('.fish-items').onclick = event => {
      const button = event.target.closest('button[data-sell]');
      if (button && !button.disabled) onSell(button.dataset.sell);
    };
  }
  actionVisible(visible, layout, scene) {
    this.action.hidden = !visible;
    if (visible && layout && scene.game?.canvas) {
      const rect = scene.game.canvas.getBoundingClientRect(), sx = rect.width / scene.scale.width, sy = rect.height / scene.scale.height;
      Object.assign(this.action.style, { left: `${rect.left + layout.x * sx}px`, top: `${rect.top + layout.y * sy}px`, width: `${layout.big * sx}px`, height: `${layout.big * sy}px`, right:'auto', bottom:'auto' });
    }
  }
  showShop(open, gold) {
    this.overlay.hidden = !open;
    if (Number.isFinite(Number(gold))) this.root.querySelector('.fish-gold').textContent = Number(gold).toLocaleString('vi-VN');
    if (this.data) this.inventory(this.data);
    if (open) { this.previousFocus = document.activeElement; this.root.querySelector('.fish-close').focus(); }
    else this.previousFocus?.isConnected && this.previousFocus.focus();
  }
  inventory(data) {
    this.data = data;
    const totals = new Map();
    for (const item of data.items || []) { const old = totals.get(item.id); totals.set(item.id, { ...item, quantity: item.quantity + (old?.quantity || 0) }); }
    this.root.querySelector('.fish-items').innerHTML = Object.entries(data.fishPrices || {}).map(([id, unitPrice]) => {
      const item = totals.get(id), quantity = item?.quantity || 0, price = Number(unitPrice);
      if (!Number.isFinite(price)) return '';
      return `<article><span class="fish-sale-icon" aria-hidden="true">${ITEMS[id]?.emoji ?? '🐟'}</span><div class="fish-sale-copy"><strong>${escape(item?.name ?? ITEMS[id]?.name ?? id)}</strong><small>${quantity} con trong túi · ${price} vàng/con</small></div><button data-sell="${escape(id)}" ${quantity ? '' : 'disabled'}>${quantity ? 'Bán hết' : 'Chưa có'}<b>${quantity ? `${(price * quantity).toLocaleString('vi-VN')} vàng` : '—'}</b></button></article>`;
    }).join('') || '<p class="fish-empty">Chưa có cá để bán. Cá câu được sẽ tự động vào túi đồ.</p>';
    const rod = this.root.querySelector('.fish-rod');
    rod.disabled = data.hasRod || Number(data.gold) < Number(data.rodPrice);
    rod.textContent = data.hasRod ? 'Đã sở hữu' : Number(data.gold) < Number(data.rodPrice) ? 'Không đủ vàng' : 'Mua cần câu';
    this.root.querySelector('.fish-gold').textContent = Number(data.gold).toLocaleString('vi-VN');
    this.root.querySelector('.fish-status').textContent = `Nhân vật #${data.characterId} · Vật phẩm câu cá được lưu vào túi đồ`;
  }
  shopStatus(text) { this.root.querySelector('.fish-status').textContent = text; }
  setProgress(percent, finishing = false) {
    this.progress.hidden = false;
    const value = Math.max(0, Math.min(100, percent));
    this.root.querySelector('.fish-track>div').style.width = value + '%';
    this.root.querySelector('.fish-track').setAttribute('aria-valuenow', Math.floor(value));
    this.progress.querySelector('span').textContent = finishing ? 'Đang nhận cá từ máy chủ…' : `${Math.floor(value)}% · Esc để hủy`;
    this.root.querySelector('.fish-cancel').disabled = finishing;
  }
  toast(text) { const node = this.root.querySelector('.fish-message'); node.textContent = text; node.hidden = false; clearTimeout(this.timer); this.timer = setTimeout(() => node.hidden = true, 4500); }
  destroy() { clearTimeout(this.timer); this.root.remove(); this.shopLink.remove(); }
}
