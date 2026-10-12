// Local: frontend 8080 và backend 3001, cùng hostname để cookie hoạt động.
// Khi deploy dùng cùng origin /api hoặc đặt VITE_API_BASE trong .env frontend.
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');
export class AuthError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}
async function request(path, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/auth/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      credentials: 'include', cache: 'no-store', signal: controller.signal,
      ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) throw new AuthError(result?.message || 'Máy chủ trả về dữ liệu không hợp lệ.', response.status);
    return result;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(error.name === 'AbortError' ? 'Kết nối quá lâu. Hãy thử lại.' : 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy.');
  } finally { clearTimeout(timeout); }
}
export const authApi = {
  me: () => request('me'),
  login: (username, password) => request('login', { username, password }),
  register: (username, email, password) => request('register', { username, email, password }),
  logout: () => request('logout', {}),
};
