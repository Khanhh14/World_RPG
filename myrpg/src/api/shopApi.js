import { retryRequest } from './questApi.js';
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const base = (import.meta.env?.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/, '');
async function shopRequest(action,input) {
  return retryRequest(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${base}/shop/${action}`, { method: 'POST', credentials: 'include', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw Object.assign(new Error(data?.message || 'Chưa xác nhận được giao dịch.'), { status: response.status });
      return data;
    } finally { clearTimeout(timer); }
  });
}

export const purchaseItem=input=>shopRequest('buy',input);
export const sellItemRequest=input=>shopRequest('sell',input);
