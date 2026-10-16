import { retryRequest } from './questApi.js';
const local = ['localhost','127.0.0.1'].includes(location.hostname);
const base = (import.meta.env?.VITE_API_BASE || (local ? `${location.protocol}//${location.hostname}:3001/api` : '/api')).replace(/\/$/,'');
async function request(path, body) {
 const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),12000);
 try {
  const response=await fetch(`${base}/skills${path}`,{method:body?'POST':'GET',credentials:'include',cache:'no-store',signal:controller.signal,
   ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok || !data?.success)throw Object.assign(new Error(data?.message || 'Không tải được dữ liệu kỹ năng.'),{status:response.status});
  return data;
 } catch(error) {
  if(error.status)throw error;
  throw new Error('Chưa nhận được xác nhận từ máy chủ. Bấm Kiểm tra lại để đồng bộ kỹ năng.');
 } finally{clearTimeout(timer);}
}
export const skillsApi={load:()=>request('',null),mutate:(action,input)=>retryRequest(()=>request('/'+action,input))};
