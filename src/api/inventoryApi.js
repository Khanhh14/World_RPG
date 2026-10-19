import { retryRequest } from './questApi.js';

const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env?.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');

async function request(input, action = 'use', method = 'POST') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/inventory/${action}`, {
      method,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw Object.assign(new Error(data?.message || 'Chưa xác nhận được thao tác vật phẩm.'), { status: response.status });
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Không kết nối được máy chủ. Vật phẩm chưa được xác nhận sử dụng.');
  } finally {
    clearTimeout(timer);
  }
}

export const inventoryApi = {
  load: () => request(null, 'state', 'GET'),
  use: input => retryRequest(() => request(input)),
  equip: input => retryRequest(() => request(input, 'equipment')),
  exchangeFood: input => retryRequest(() => request(input, 'exchange-food')),
  harvestMushroom: input => retryRequest(() => request(input, 'harvest-mushroom')),
};
