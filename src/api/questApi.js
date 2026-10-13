const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');

async function request(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/quests${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw Object.assign(new Error(data?.message || 'Không đọc được dữ liệu nhiệm vụ.'), { status: response.status });
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Không kết nối được máy chủ. Tiến độ nhiệm vụ chưa được đồng bộ.');
  } finally {
    clearTimeout(timer);
  }
}

export const questApi = {
  list: () => request('', null),
  progress: (eventType, mapId, eventId) => request('/progress', { eventType, mapId, eventId }),
  claim: questId => request(`/${encodeURIComponent(questId)}/claim`, {}),
};
