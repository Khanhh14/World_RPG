import { runtimeRequest } from '../../api/runtimeApi.js';
export const RUNTIME_SCENES={'village':'Game','west-forest':'WestForest','atlast-lake':'AtlastLake','yuna-outskirts':'YunaOutskirts','yuna-city':'YunaCity','naga-cave':'NagaCave','noxii-entrance':'NoxiiEntrance','noxii-cave':'NoxiiCave','dia-long-forest':'DiaLongForest','autumn-forest':'AutumnForest','guardian-cave':'GuardianCave','huyen-quy-cave':'HuyenQuyCave','han-nha-mon':'HanNhaMon','hiuuling-river':'HiuuLingRiver'};
const key=id=>`tiny-rpg-runtime:${id}`;
export async function loadRuntime(characterId){
 const {runtime}=await runtimeRequest();
 if(String(runtime.characterId)!==String(characterId))throw new Error('Trạng thái không thuộc nhân vật.');
 try{const pending=JSON.parse(localStorage.getItem(key(characterId))||'null');
  if(pending?.dirty&&pending.version===runtime.version&&String(pending.characterId)===String(characterId)&&RUNTIME_SCENES[pending.mapId])return {...pending};
 }catch{}
 return {...runtime,dirty:false};
}
export class RuntimeSave {
 constructor(game,initial){
  this.game=game;this.current={...initial};this.inflight=null;this.externalUpdates=0;this.stopped=false;this.error='';this.lastSample=0;
  this.tick=()=>{if(performance.now()-this.lastSample>250){this.lastSample=performance.now();this.capture();}};
  game.events.on('poststep',this.tick);
  this.timer=setInterval(()=>void this.flush(),5000);
  this.leave=()=>{this.capture();void this.flush(true);};
  this.hidden=()=>{if(document.hidden)this.leave();};
  window.addEventListener('pagehide',this.leave);document.addEventListener('visibilitychange',this.hidden);
  game.events.once('destroy',()=>this.destroy());
 }
 persist(){try{localStorage.setItem(key(this.current.characterId),JSON.stringify(this.current));}catch{this.error='Trình duyệt không lưu được bản dự phòng.';}}
 capture(scene){
  if(this.stopped)return;
  const s=scene??this.game.scene.getScenes(true).find(s=>s.rpgState&&s.player);
  if(!s?.player?.sprite?.active||!s.rpgState)return;
  const next={characterId:String(s.rpgState.data.characterId),hp:Math.round(s.rpgState.data.hp),mp:Math.round(s.rpgState.data.mp),mapId:s.mapData.id,x:Math.round(s.player.x),y:Math.round(s.player.sprite.y)};
  if(Object.entries(next).some(([k,v])=>this.current[k]!==v)){Object.assign(this.current,next,{dirty:true});this.persist();}
 }
 async flush(keepalive=false){
  this.capture();
  if(this.externalUpdates)return;
  if(this.inflight){await this.inflight;if(!this.stopped&&this.current.dirty)return this.flush(keepalive);return;}
  if(this.stopped||!this.current.dirty)return;
  const payload={...this.current,requestId:crypto.randomUUID()};
  this.inflight=(async()=>{
   try{const r=await runtimeRequest(payload,keepalive);
    if(r.conflict){this.stopped=true;this.error='Nhân vật đã được lưu từ phiên khác. Hãy tải lại game.';this.current={...r.runtime,dirty:false};this.persist();window.dispatchEvent(new CustomEvent('rpg-runtime-conflict'));return;}
    const changed=['hp','mp','mapId','x','y'].some(k=>this.current[k]!==payload[k]);
    this.current.version=r.runtime.version;this.current.dirty=changed;this.error='';this.persist();
   }catch(e){this.error=e.status===401?'Phiên đăng nhập đã hết hạn.':'Chưa lưu được máy chủ; đã giữ bản dự phòng trên trình duyệt.';this.persist();if(e.status===401)window.dispatchEvent(new CustomEvent('rpg-session-expired'));}
  })();
  try{await this.inflight;}finally{this.inflight=null;}
 }
 async withExternalUpdate(operation,applyResult){
  this.externalUpdates++;
  try{
   while(this.inflight)await this.inflight;
   if(this.stopped)throw Object.assign(new Error('Phiên lưu nhân vật đã bị xung đột. Hãy tải lại game.'),{status:409});
   const result=await operation();
   if(Number.isSafeInteger(result.runtimeVersion))this.current.version=result.runtimeVersion;
   applyResult(result);
   this.capture();
   return result;
  }finally{
   this.externalUpdates--;
   if(!this.externalUpdates)setTimeout(()=>void this.flush(),0);
  }
 }
 destroy(){clearInterval(this.timer);this.game.events.off('poststep',this.tick);window.removeEventListener('pagehide',this.leave);document.removeEventListener('visibilitychange',this.hidden);}
}
