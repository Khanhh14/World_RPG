import { authApi } from '../../api/authApi.js';
const scenery = `<svg class="auth-scenery" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shape-rendering="crispEdges">
<defs><pattern id="auth-grass" width="58" height="48" patternUnits="userSpaceOnUse"><rect width="58" height="48" fill="#86bf64"/><path d="M8 12h4v4h4v-4h3v7H8zM40 36h3v-4h3v8h-6z" fill="#76af58"/><path d="M30 8h5v3h-5z" fill="#98ca76"/></pattern><g id="auth-tree"><rect x="-3" y="3" width="6" height="15" fill="#755239"/><path d="M-5-34H5v6h6v8h5v25h-5v6h-22V5h-5v-25h5v-8h6z" fill="#344c35"/><path d="M-3-28H4v7h6v23H5v5H-6V2h-5v-21h5v-9z" fill="#509345"/><path d="M-2-22h4v8h3v7H-5v-12h3z" fill="#94cb67"/></g><g id="auth-flower"><path d="M0 0h3v10H0z" fill="#4d893f"/><path d="M-3-4h8v8h-8z" fill="#f9db73"/><path d="M0-7h3v3H0zM-6-1h3v3h-3zM5-1h3v3H5z" fill="#fff2af"/></g></defs>
<rect width="960" height="540" fill="url(#auth-grass)"/><path d="M0 346H960M280 0V540" stroke="#d49754" stroke-width="67"/><path d="M0 346H960M280 0V540" stroke="#e8ac68" stroke-width="53"/>
<path d="M0 471Q170 441 220 540H0z" fill="#577d61"/><path d="M0 485Q150 460 190 540H0z" fill="#6ab3bf"/><path d="M15 508h35m32 9h34m-53 15h25" stroke="#b0d8c7" stroke-width="3"/>
<g transform="translate(105 162)"><rect x="-43" y="-18" width="86" height="81" fill="#a88b63"/><rect x="-37" y="-12" width="74" height="67" fill="#d3bd8c"/><path d="M-52-14V-38h13v-14h14v-14h50v14h14v14h13v24z" fill="#614740"/><path d="M-43-22v-13h13v-14h14v-9h32v9h14v14h13v13z" fill="#b96643"/><path d="M-30-33h60M-15-46h30" stroke="#d58550" stroke-width="5"/><rect x="-9" y="22" width="24" height="41" fill="#654b3a"/><rect x="-29" y="4" width="16" height="19" fill="#528184"/><rect x="20" y="4" width="13" height="19" fill="#528184"/></g>
<g><use href="#auth-tree" x="45" y="63"/><use href="#auth-tree" x="125" y="73"/><use href="#auth-tree" x="199" y="46"/><use href="#auth-tree" x="386" y="89"/><use href="#auth-tree" x="458" y="52"/><use href="#auth-tree" x="565" y="99"/><use href="#auth-tree" x="665" y="57"/><use href="#auth-tree" x="750" y="101"/><use href="#auth-tree" x="872" y="52"/><use href="#auth-tree" x="936" y="149"/><use href="#auth-tree" x="410" y="464"/><use href="#auth-tree" x="504" y="511"/><use href="#auth-tree" x="627" y="454"/><use href="#auth-tree" x="802" y="495"/><use href="#auth-tree" x="909" y="445"/><use href="#auth-tree" x="56" y="277"/><use href="#auth-tree" x="161" y="416"/></g>
<g><use href="#auth-flower" x="55" y="214"/><use href="#auth-flower" x="194" y="278"/><use href="#auth-flower" x="149" y="286"/><use href="#auth-flower" x="346" y="215"/><use href="#auth-flower" x="348" y="418"/><use href="#auth-flower" x="770" y="403"/><use href="#auth-flower" x="851" y="236"/></g></svg>`;
export class AuthUI {
  constructor() {
    this.mode = 'login'; this.busy = false;
    this.root = document.createElement('div'); this.root.id = 'rpg-auth-root';
    this.root.innerHTML = `${scenery}<div class="auth-shade"></div><header class="auth-brand"><b>✦ TINY RPG</b><span>HÀNH TRÌNH CỦA BẠN</span></header><main class="auth-layout"><section class="auth-story"><span class="auth-label">LÀNG KHỞI ĐẦU</span><h1>Một thế giới mới.<br>Một câu chuyện <em>của bạn.</em></h1><p>Trở về ngôi làng nhỏ, chuẩn bị hành trang<br>và bắt đầu chuyến phiêu lưu.</p><div class="auth-places"><span>Rừng Phía Tây</span><span>Hồ Nước Atlast</span></div></section><section class="auth-card" aria-labelledby="auth-title"><div class="auth-card-heading"><span class="auth-portrait" aria-hidden="true"></span><div><span class="auth-label">CỔNG VÀO THẾ GIỚI</span><h2 id="auth-title" tabindex="-1">Đăng nhập</h2></div></div><p class="auth-subtitle" id="auth-description">Chào mừng trở lại, nhà thám hiểm.</p><form id="auth-form"><label>Tài khoản<input name="username" autocomplete="username" minlength="3" maxlength="50" pattern="[A-Za-z0-9_]{3,50}" title="3–50 ký tự: chữ không dấu, số hoặc dấu gạch dưới." required placeholder="Tên tài khoản" autocapitalize="none" spellcheck="false"></label><label data-register hidden>Email<input name="email" type="email" autocomplete="email" maxlength="254" placeholder="ban@example.com" disabled></label><label>Mật khẩu<span class="auth-password"><input name="password" type="password" autocomplete="current-password" maxlength="128" required placeholder="Nhập mật khẩu"><button type="button" data-action="reveal" aria-label="Hiện mật khẩu" aria-pressed="false">Hiện</button></span><small data-register hidden>Từ 8 đến 128 ký tự.</small></label><label data-register hidden>Nhập lại mật khẩu<input name="confirm" type="password" autocomplete="new-password" maxlength="128" placeholder="Nhập lại mật khẩu" disabled></label><p class="auth-notice" role="status" aria-live="polite" hidden></p><button type="submit" class="auth-button auth-primary">Đăng nhập <span>→</span></button><div class="auth-divider"><span>Chưa có tài khoản?</span></div><button type="button" data-action="switch" class="auth-button auth-secondary">Đăng ký</button><button type="button" data-action="retry" class="auth-retry" hidden>Kiểm tra lại kết nối</button></form><p class="auth-card-foot">✦ Mỗi hành trình đều bắt đầu từ một bước chân.</p></section></main><footer class="auth-footer">KHÁM PHÁ · TRƯỞNG THÀNH · PHIÊU LƯU</footer>`;
    document.body.appendChild(this.root);
    this.form = this.root.querySelector('form');
    this.notice = this.root.querySelector('.auth-notice');
    this.done = new Promise(resolve => { this.resolve = resolve; });
    this.form.addEventListener('submit', event => { event.preventDefault(); void this.submit(); });
    this.root.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || this.busy) return;
      if (button.dataset.action === 'switch') this.setMode(this.mode === 'login' ? 'register' : 'login');
      if (button.dataset.action === 'retry') void this.checkSession();
      if (button.dataset.action === 'reveal') {
        const show = this.field('password').type === 'password';
        this.field('password').type = show ? 'text' : 'password';
        button.textContent = show ? 'Ẩn' : 'Hiện'; button.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'); button.setAttribute('aria-pressed', String(show));
      }
    });
    this.form.addEventListener('input', () => this.field('confirm').setCustomValidity(''));
  }
  field(name) { return this.form.elements.namedItem(name); }
  message(text, success = false) { this.notice.textContent = text; this.notice.classList.toggle('success', success); this.notice.hidden = false; }
  setMode(mode) {
    this.mode = mode; const register = mode === 'register'; this.form.reset(); this.field('confirm').setCustomValidity('');
    this.root.querySelectorAll('[data-register]').forEach(node => { node.hidden = !register; });
    for (const name of ['email', 'confirm']) { this.field(name).disabled = !register; this.field(name).required = register; }
    this.field('password').minLength = register ? 8 : 1; this.field('password').autocomplete = register ? 'new-password' : 'current-password'; this.field('password').type = 'password';
    const reveal = this.root.querySelector('[data-action="reveal"]'); reveal.textContent = 'Hiện'; reveal.setAttribute('aria-pressed', 'false'); reveal.setAttribute('aria-label', 'Hiện mật khẩu');
    this.root.querySelector('#auth-title').textContent = register ? 'Đăng ký' : 'Đăng nhập';
    this.root.querySelector('#auth-description').textContent = register ? 'Tạo tài khoản để bắt đầu chuyến phiêu lưu.' : 'Chào mừng trở lại, nhà thám hiểm.';
    this.root.querySelector('.auth-divider span').textContent = register ? 'Bạn đã có tài khoản?' : 'Chưa có tài khoản?';
    this.root.querySelector('[data-action="switch"]').textContent = register ? 'Quay lại đăng nhập' : 'Đăng ký';
    this.notice.hidden = true; this.setBusy(false); this.field('username').focus();
  }
  setBusy(busy, label = 'Đang xử lý…') {
    this.busy = busy; this.form.setAttribute('aria-busy', String(busy));
    for (const element of this.form.querySelectorAll('input, button')) element.disabled = busy;
    if (!busy && this.mode === 'login') { this.field('email').disabled = true; this.field('confirm').disabled = true; }
    this.root.querySelector('[type="submit"]').textContent = busy ? label : this.mode === 'login' ? 'Đăng nhập →' : 'Tạo tài khoản →';
  }
  async checkSession() {
    if (this.busy) return;
    this.setBusy(true, 'Đang kiểm tra phiên…');
    try { const result = await authApi.me(); this.finish(result.user); }
    catch (error) {
      this.setBusy(false);
      if (error.status !== 401) this.message(error.message);
      else this.notice.hidden = true;
      this.root.querySelector('[data-action="retry"]').hidden = error.status === 401;
    }
  }
  async submit() {
    if (this.busy) return;
    const register = this.mode === 'register';
    if (register && this.field('password').value !== this.field('confirm').value) { this.field('confirm').setCustomValidity('Mật khẩu nhập lại chưa trùng khớp.'); }
    if (!this.form.reportValidity()) return;
    const username = this.field('username').value.trim(), password = this.field('password').value, email = this.field('email').value.trim();
    this.setBusy(true); this.notice.hidden = true;
    try {
      if (register) {
        await authApi.register(username, email, password);
        this.setMode('login'); this.field('username').value = username; this.message('Đăng ký thành công! Hãy đăng nhập để vào game.', true); this.field('password').focus();
      } else {
        const result = await authApi.login(username, password);
        // Xác nhận cookie đã được trình duyệt lưu trước khi mở game.
        const session = await authApi.me();
        if (session.user.id !== result.user.id) throw new Error('Phiên đăng nhập không khớp. Vui lòng thử lại.');
        this.finish(session.user);
      }
    } catch (error) { this.message(error.message); this.setBusy(false); }
  }
  finish(user) {
    if (!user?.id || !user?.username) { this.setBusy(false); this.message('Dữ liệu tài khoản không hợp lệ.'); return; }
    this.form.reset(); this.root.remove(); this.resolve(user);
  }
  async wait() { void this.checkSession(); return this.done; }
}
