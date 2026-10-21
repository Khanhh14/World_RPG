import { retryRequest } from './questApi.js';
const local=['localhost','127.0.0.1'].includes(location.hostname);
const base=(import.meta.env?.VITE_API_BASE||(local?`${location.protocol}//${location.hostname}:3001/api`:'/api')).replace(/\/$/,'');
async function request(action='',input){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(`${base}/daily${action?'/'+action:''}`,{method:input?'POST':'GET',credentials:'include',cache:'no-store',signal:controller.signal,...(input?{headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.success)throw Object.assign(new Error(data?.message||'Chưa xác nhận được quà điểm danh.'),{status:response.status});
  return data;
 }catch(e){if(e.status)throw e;throw new Error('Chưa kết nối được máy chủ. Tiến độ và quà đang chờ được giữ lại.');}
 finally{clearTimeout(timer);}
}
export const dailyApi={load:()=>request(),claim:input=>retryRequest(()=>request('claim',input)),collect:input=>retryRequest(()=>request('collect',input))};
