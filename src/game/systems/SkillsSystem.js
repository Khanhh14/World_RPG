import { skillsApi } from '../../api/skillsApi.js';
export class SkillsSystem {
 constructor(scene, state) {
  this.scene=scene; this.state=state; this.alive=true;
  scene.events.once('shutdown',()=>{this.alive=false;});
  void this.load();
 }
 apply(result) {
  const s=this.state, incoming=result.skills;
  if(String(result.character?.id)!==String(s.data.characterId))return;
  if(incoming && Number(incoming.revision)>=Number(s.data.skills?.revision ?? -1))s.data.skills=incoming;
  s.applyServerCharacter(result.character);
  s.data.hp=Math.min(s.data.hp,s.maxHP);
  s.skillError='';s.skillsLoaded=true;s.changed();
 }
 async load() {
  try {
   this.apply(await skillsApi.load());
   if(this.state.data.pendingSkillAction)await this.resume();
  }catch(error){this.state.skillError=error.message;this.state.changed();}
 }
 async perform(action, input={}) {
  const s=this.state;
  if(s.skillBusy)return;
  if(s.data.pendingSkillAction){await this.resume();return;}
  if(!s.skillsLoaded){await this.load();return;}
  const request={...input,requestId:crypto.randomUUID()};
  if(action==='buy')request.position={mapId:this.scene.mapData.id,x:this.scene.player.x,feetY:this.scene.player.feetY};
  s.data.pendingSkillAction={action,input:request};
  // Lưu mã yêu cầu trước khi gửi: tải lại trang vẫn dùng đúng mã cũ.
  try{
   s.storage?.setItem(s.saveKey,JSON.stringify(s.data));
   const saved=JSON.parse(s.storage?.getItem(s.saveKey) || 'null');
   if(saved?.pendingSkillAction?.input?.requestId!==request.requestId)throw new Error();
  }catch{
   s.data.pendingSkillAction=null;s.skillError='Hãy cho phép lưu dữ liệu trình duyệt trước khi giao dịch.';s.changed();return;
  }
  await this.resume();
 }
 async resume() {
  const s=this.state, pending=s.data.pendingSkillAction;
  if(s.skillBusy || !pending)return;
  s.skillBusy=true;s.skillError='';s.changed();
  try{
   const result=await skillsApi.mutate(pending.action,pending.input);
   s.data.pendingSkillAction=null;this.apply(result);
   if(this.alive)this.scene.hud?.toast(pending.action==='buy'?'Đã mua sách và học kỹ năng. Mở C để gán vào ô.':pending.input.skillId?'Đã gán kỹ năng vào ô '+(pending.input.slot+1)+'.':'Đã bỏ gán kỹ năng.');
  }catch(error){
   if(error.status===400 || error.status===403 || error.status===409){
    s.data.pendingSkillAction=null;
    try{this.apply(await skillsApi.load());}catch{}
   }
   s.skillError=error.message;
   if(this.alive)this.scene.hud?.toast(error.message);
  }finally{s.skillBusy=false;s.changed();}
 }
}
