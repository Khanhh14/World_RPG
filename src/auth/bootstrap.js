import { loadRuntime, RuntimeSave } from '../game/systems/RuntimeSave.js';
import { wingsApi } from '../api/wingsApi.js';
import { AuthUI } from '../game/ui/AuthUI.js';
import { authApi } from '../api/authApi.js';
import { chooseCharacter } from '../game/ui/CharacterCreationUI.js';
import { setCharacterProfile } from '../game/systems/characterSession.js';
// Bọc hàm khởi tạo Phaser hiện có, giữ nguyên cấu hình và các map.
export function withAuth(startGame) {
  let pending;
  return (...args) => {
    if (pending) return pending;
    pending = (async () => {
      const user = await new AuthUI().wait();
      const character = await chooseCharacter(user);
      const [runtime, wingResult] = await Promise.all([loadRuntime(character.id), wingsApi.load()]);
      character.runtime = runtime; character.wings = wingResult.wings;
      setCharacterProfile(character, user);
      const game = await startGame(user, ...args);
      game?.registry?.set('auth-user', user);
      const saves = new RuntimeSave(game, runtime);
      const state = game?.registry?.get('rpg-state-v1');
      if (Number.isSafeInteger(state?.serverRuntimeVersion)) saves.current.version = state.serverRuntimeVersion;
      game.registry.set('runtime-save', saves);
      const panel = document.createElement('div'); panel.className = 'rpg-account-panel';
      const name = document.createElement('span'); name.textContent = character.name + ' · ' + character.class.name;
      const logout = document.createElement('button'); logout.type = 'button'; logout.textContent = 'Đăng xuất';
      const status = document.createElement('span'); status.setAttribute('role', 'status'); status.className = 'account-status';
      panel.append(name, logout, status); document.body.appendChild(panel);
      const stopKeys = event => event.stopPropagation();
      panel.addEventListener('keydown', stopKeys);
      let checking = false, ending = false;
      function expired(){if(ending)return;ending=true;saves.capture();game.scene.getScenes(true).forEach(s=>s.scene.pause());location.reload();}
      window.addEventListener('rpg-session-expired',expired);
      window.addEventListener('rpg-runtime-conflict',expired);
      async function check() {
        if (checking || document.hidden) return; checking = true;
        try {
          const result = await authApi.me();
          if (String(result.user.id) !== String(user.id)) location.reload();
          status.textContent = saves.error;
        } catch (error) {
          if (error.status === 401) expired();
          else status.textContent = 'Mất kết nối';
        } finally { checking = false; }
      }
      logout.addEventListener('click', async () => {
        logout.disabled = true; status.textContent = '';
        try {
          saves.capture();game.scene.getScenes(true).forEach(s=>s.scene.pause());
          await saves.flush();
          if(saves.current.dirty && !ending){game.scene.getScenes(false).filter(s=>s.scene.isPaused()).forEach(s=>s.scene.resume());throw new Error('Chưa lưu được máy chủ. Hãy thử đăng xuất lại khi có mạng.');}
          await authApi.logout(); location.reload();
        }
        catch (error) { game.scene.getScenes(false).filter(s=>s.scene.isPaused()).forEach(s=>s.scene.resume());status.textContent = error.message; logout.disabled = false; }
      });
      const timer = setInterval(check, 60000);
      window.addEventListener('focus', check);
      game?.events?.once('destroy', () => { clearInterval(timer); window.removeEventListener('focus', check); window.removeEventListener('rpg-session-expired',expired);window.removeEventListener('rpg-runtime-conflict',expired);panel.remove(); });
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
