import './character.css';
import { characterApi } from './characterApi.js';
import { authApi } from '../../auth/authApi.js';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const sprite = (frame, size) => `<span class="cc-sprite" aria-hidden="true" style="width:${size}px;height:${size}px;background-size:${size * 12}px ${size * 11}px;background-position:-${frame % 12 * size}px -${Math.floor(frame / 12) * size}px"></span>`;
export class CharacterCreationUI {
  constructor(user) {
    this.user = user; this.busy = false;
    this.done = new Promise(resolve => this.resolve = resolve);
    this.root = document.createElement('main'); this.root.className = 'character-screen';
    this.root.innerHTML = `<section class="cc-panel"><header><div><span class="cc-eyebrow">HÀNH TRÌNH MỚI</span><h1>Tạo nhân vật</h1></div><button type="button" data-action="logout">Đăng xuất</button></header><p class="cc-intro">Chọn con đường của bạn, rồi đặt tên cho người anh hùng.</p><form><fieldset disabled><legend>Chọn class nhân vật</legend><div class="cc-classes"></div></fieldset><div class="cc-bottom"><label for="cc-name">Tên nhân vật<input id="cc-name" name="name" required minlength="3" maxlength="24" autocomplete="off" placeholder="Ví dụ: Lữ Khách" disabled><small>3–24 ký tự · Có thể dùng tiếng Việt, số và khoảng trắng.</small></label><button class="cc-create" type="submit" disabled>Bắt đầu hành trình →</button></div></form><p class="cc-message" role="status">Đang tải hồ sơ nhân vật…</p><button type="button" data-action="retry">Kiểm tra lại</button><footer>Tên và class được lưu theo tài khoản. Vũ khí khởi đầu sẽ có trong túi đồ.</footer></section>`;
    document.body.appendChild(this.root); this.form = this.root.querySelector('form'); this.message = this.root.querySelector('.cc-message');
    this.form.onsubmit = event => { event.preventDefault(); void this.submit(); };
    this.root.querySelector('[data-action="retry"]').onclick = () => this.load();
    this.root.querySelector('[data-action="logout"]').onclick = async () => { if (this.busy) return; this.setBusy(true); try { await authApi.logout(); location.reload(); } catch (e) { this.message.textContent = e.message; this.setBusy(false); } };
  }
  setBusy(busy) {
    this.busy = busy;
    this.root.querySelectorAll('button').forEach(b => b.disabled = busy);
    const ready = Boolean(this.classes?.length);
    this.form.querySelector('fieldset').disabled = busy || !ready;
    this.form.elements.name.disabled = busy || !ready;
    this.form.querySelector('[type="submit"]').disabled = busy || !ready;
    this.form.querySelector('[type="submit"]').textContent = busy ? 'Đang xử lý…' : 'Bắt đầu hành trình →';
  }
  async load() {
    if (this.busy) return; this.setBusy(true);
    try {
      const data = await characterApi.current();
      if (!data.needsCreation && data.character) { this.finish(data.character); return; }
      this.classes = data.classes;
      this.root.querySelector('.cc-classes').innerHTML = this.classes.map((c, index) => `<label class="cc-choice"><input type="radio" name="classCode" value="${escape(c.code)}" ${index === 0 ? 'checked' : ''} required><div class="cc-card"><div class="cc-hero">${sprite(c.frame, 80)}</div><h2>${escape(c.name)}</h2><p>${escape(c.description)}</p><div class="cc-weapon">${sprite(c.weaponFrame, 32)}<span>${escape(c.weaponName)}</span></div><span class="cc-selected">Đã chọn</span></div></label>`).join('');
      this.message.textContent = 'Mỗi tài khoản dùng một nhân vật trong phiên bản này.';
      this.setBusy(false); this.form.elements.name.focus();
    } catch (e) { this.message.textContent = e.message; this.setBusy(false); }
  }
  async submit() {
    if (this.busy || !this.form.reportValidity()) return;
    const name = this.form.elements.name.value.trim(), classCode = this.form.elements.classCode.value;
    this.setBusy(true); this.message.textContent = 'Đang lưu nhân vật và vũ khí…';
    try { const data = await characterApi.create(name, classCode); this.finish(data.character); }
    catch (e) { this.message.textContent = e.message; this.setBusy(false); }
  }
  finish(character) { this.root.remove(); this.resolve(character); }
  wait() { void this.load(); return this.done; }
}
export const chooseCharacter = user => new CharacterCreationUI(user).wait();
