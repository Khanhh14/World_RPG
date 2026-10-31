import {retryRequest} from './questApi.js';
const local=['localhost','127.0.0.1'].includes(location.hostname);
const base=(import.meta.env?.VITE_API_BASE||(local?`${location.protocol}//${location.hostname}:3001/api`:'/api')).replace(/\/$/,'');
async function request(path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(`${base}/events${path}`,{method:body?'POST':'GET',credentials:'include',cache:'no-store',signal:controller.signal,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await r.json().catch(()=>null);
  if(!r.ok||!data?.success)throw Object.assign(new Error(data?.message||'Chưa tải được sự kiện.'),{status:r.status});
  return data;
 }finally{clearTimeout(timer);}
}
export const eventsApi={
 load:()=>request('',null),
 exchange:input=>retryRequest(()=>request('/exchange',input)),
 claim:input=>retryRequest(()=>request('/claim',input))
};
