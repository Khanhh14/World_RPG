const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');
async function request(action, body = {}) {
  const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 12000);
  try {
    const response = await fetch(`${base}/fishing/${action}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: abort.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) throw Object.assign(new Error(data?.message || 'Không đọc được dữ liệu câu cá.'), { status: response.status });
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Mất kết nối máy chủ. Vật phẩm câu cá sẽ được đồng bộ lại khi đăng nhập.');
  } finally { clearTimeout(timeout); }
}
export const fishingApi = {
  bootstrap: () => request('bootstrap'),
  buyRod: position => request('rod', position),
  sell: (fishId, position) => request('sell', { fishId, ...position }),
  start: position => request('start', position),
  finish: (attemptId, position) => request('finish', { attemptId, ...position }),
  cancel: attemptId => request('cancel', { attemptId }),
};
