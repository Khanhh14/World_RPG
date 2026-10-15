import { wingsApi } from '../../api/wingsApi.js';
export class WingsSystem {
 constructor(scene, state) {
  this.scene=scene; this.state=state; this.alive=true;
  scene.events.once('shutdown',()=>{this.alive=false;});
  void this.load();
 }
 apply(result) {
  const s=this.state, incoming=result.wings;
  if(String(result.character?.id)!==String(s.data.characterId))return;
  if(incoming && Number(incoming.revision)>=Number(s.data.wings?.revision ?? -1))s.data.wings=incoming;
  s.applyServerCharacter(result.character);
  s.data.hp=Math.min(s.data.hp,s.maxHP);
  s.wingError='';s.wingsLoaded=true;s.changed();
 }
 async load() {
  try {
   this.apply(await wingsApi.load());
   if(this.state.data.pendingWingAction)await this.resume();
  }catch(error){this.state.wingError=error.message;this.state.changed();}
 }
 async perform(action, input={}) {
  const s=this.state;
  if(s.wingBusy)return;
  if(s.data.pendingWingAction){await this.resume();return;}
  if(!s.wingsLoaded){await this.load();return;}
  const request={...input,requestId:crypto.randomUUID()};
  if(action==='buy')request.position={mapId:this.scene.mapData.id,x:this.scene.player.x,feetY:this.scene.player.feetY};
  s.data.pendingWingAction={action,input:request};
  // Lưu mã yêu cầu trước khi gửi: tải lại trang vẫn dùng đúng mã cũ.
  try{
   s.storage?.setItem(s.saveKey,JSON.stringify(s.data));
   const saved=JSON.parse(s.storage?.getItem(s.saveKey) || 'null');
   if(saved?.pendingWingAction?.input?.requestId!==request.requestId)throw new Error();
  }catch{
   s.data.pendingWingAction=null;s.wingError='Hãy cho phép lưu dữ liệu trình duyệt trước khi giao dịch.';s.changed();return;
  }
  await this.resume();
 }
 async resume() {
  const s=this.state, pending=s.data.pendingWingAction;
  if(s.wingBusy || !pending)return;
  s.wingBusy=true;s.wingError='';s.changed();
  try{
   const result=await wingsApi.mutate(pending.action,pending.input);
   s.data.pendingWingAction=null;this.apply(result);
   if(this.alive)this.scene.hud?.toast(pending.action==='buy'?'Đã mua đá nâng cấp cánh.':pending.action==='upgrade'?'Nâng cấp cánh thành công!':pending.input.wingId?'Đã trang bị cánh.':'Đã tháo cánh.');
  }catch(error){
   if(error.status===400 || error.status===409){
    s.data.pendingWingAction=null;
    try{this.apply(await wingsApi.load());}catch{}
   }
   s.wingError=error.message;
   if(this.alive)this.scene.hud?.toast(error.message);
  }finally{s.wingBusy=false;s.changed();}
 }
}
