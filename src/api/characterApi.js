const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');
async function request(path, body) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(base + '/characters' + path, { method: body ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', signal: controller.signal, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) throw Object.assign(new Error(data?.message || 'Không đọc được dữ liệu nhân vật.'), { status: response.status });
    return data;
  } catch (e) { if (e.status) throw e; throw new Error('Không kết nối được máy chủ. Nhấn Kiểm tra lại để xác nhận nhân vật đã được lưu chưa.'); }
  finally { clearTimeout(timer); }
}
export const characterApi = { current: () => request('/me'), create: (name, classCode) => request('', { name, classCode }) };
