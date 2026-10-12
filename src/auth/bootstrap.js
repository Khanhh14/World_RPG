import { chooseCharacter } from '../game/characters/CharacterCreationUI.js';
import { setCharacterProfile } from '../game/characters/characterSession.js';
import { AuthUI } from './AuthUI.js';
import { authApi } from './authApi.js';
// Bọc hàm khởi tạo Phaser hiện có, giữ nguyên cấu hình và các map.
export function withAuth(startGame) {
  let pending;
  return (...args) => {
    if (pending) return pending;
    pending = (async () => {
      const user = await new AuthUI().wait();
      const character = await chooseCharacter(user);
      setCharacterProfile(character, user);
      const game = await startGame(user, ...args);
      game?.registry?.set('auth-user', user);
      const panel = document.createElement('div'); panel.className = 'rpg-account-panel';
      const name = document.createElement('span'); name.textContent = character.name + ' · ' + character.class.name;
      const logout = document.createElement('button'); logout.type = 'button'; logout.textContent = 'Đăng xuất';
      const status = document.createElement('span'); status.setAttribute('role', 'status'); status.className = 'account-status';
      panel.append(name, logout, status); document.body.appendChild(panel);
      const stopKeys = event => event.stopPropagation();
      panel.addEventListener('keydown', stopKeys);
      let checking = false;
      async function check() {
        if (checking || document.hidden) return; checking = true;
        try {
          const result = await authApi.me();
          if (String(result.user.id) !== String(user.id)) location.reload();
          status.textContent = '';
        } catch (error) {
          if (error.status === 401) location.reload();
          else status.textContent = 'Mất kết nối';
        } finally { checking = false; }
      }
      logout.addEventListener('click', async () => {
        logout.disabled = true; status.textContent = '';
        try { await authApi.logout(); location.reload(); }
        catch (error) { status.textContent = error.message; logout.disabled = false; }
      });
      const timer = setInterval(check, 60000);
      window.addEventListener('focus', check);
      game?.events?.once('destroy', () => { clearInterval(timer); window.removeEventListener('focus', check); panel.remove(); });
      return game;
    })().catch(error => {
      pending = undefined;
      const box = document.createElement('div'); box.className = 'rpg-start-error';
      box.textContent = 'Đã đăng nhập nhưng chưa mở được game. Kiểm tra lỗi trong Console rồi tải lại trang.';
      document.body.appendChild(box); console.error(error);
      // Giữ lỗi được báo rõ mà không mở game khi xác thực thất bại.
      return null;
    });
    return pending;
  };
}
