const local=['localhost','127.0.0.1'].includes(location.hostname);
const base=(import.meta.env?.VITE_API_BASE||(local?`${location.protocol}//${location.hostname}:3001/api`:'/api')).replace(/\/$/,'');
export async function runtimeRequest(body,keepalive=false){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const r=await fetch(`${base}/characters/runtime`,{method:body?'POST':'GET',credentials:'include',cache:'no-store',keepalive,signal:controller.signal,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok||!d.success)throw Object.assign(new Error(d.message||'Không lưu được vị trí.'),{status:r.status});return d;}
 finally{clearTimeout(timer);}
}
