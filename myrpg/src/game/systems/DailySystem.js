import { dailyApi } from '../../api/dailyApi.js';
export class DailySystem {
 constructor(scene){this.scene=scene;this.state=scene.rpgState;this.alive=true;this.busy=false;this.error='';this.view=null;this.onChange=()=>{};scene.events.once('shutdown',()=>{this.alive=false;});void this.load(true);}
 notify(){if(this.alive)this.onChange();}
 apply(result){
  if(String(result.character?.id)!==String(this.state.data.characterId))throw new Error('Quà không thuộc nhân vật hiện tại.');
  this.state.applyServerCharacter(result.character);this.view=result.daily;
  this.syncedAt=performance.now();this.serverResetAt=Date.parse(result.daily.resetAt);this.clockOffset=Date.parse(result.daily.serverNow)-Date.now();this.error='';
 }
 async load(recover=false){
  if(this.loading)return;this.loading=true;
  try{const result=await dailyApi.load();this.apply(result);if(recover&&this.state.data.pendingDailyAction)await this.resume();}
  catch(e){this.error=e.message;}finally{this.loading=false;this.notify();}
 }
 save(next){
  if(!this.state.storage)throw new Error('Hãy cho phép lưu dữ liệu trình duyệt trước khi nhận quà.');
  this.state.storage.setItem(this.state.saveKey,JSON.stringify(next));
  if(this.state.storage.getItem(this.state.saveKey)!==JSON.stringify(next))throw new Error('Chưa lưu được xác nhận nhận quà. Hãy thử lại.');
 }
 async run(action,sourceId){
  const s=this.state;
  if(s.data.pendingEventExchange)throw new Error('Mở Sự kiện để hoàn tất giao dịch đang chờ.');
  if(this.busy)return null;
  if(s.usingItem||s.wingBusy||s.bossRewardBusy)throw new Error('Nhân vật đang đồng bộ vật phẩm. Hãy thử lại sau một chút.');
  if(!s.data.pendingDailyAction){
   const pending={action,input:{requestId:crypto.randomUUID(),...(sourceId?{sourceId}:{})}};
   const next={...s.data,pendingDailyAction:pending};this.save(next);s.data.pendingDailyAction=pending;s.changed();
  }
  return this.resume();
 }
 async resume(){
  if(this.busy||!this.state.data.pendingDailyAction)return null;
  this.busy=true;this.error='';this.notify();
  const s=this.state,pending=s.data.pendingDailyAction;
  try{
   const result=await dailyApi[pending.action](pending.input);this.apply(result);
   if(pending.action==='collect'){
    if(result.sourceId!==pending.input.sourceId||result.requestId!==pending.input.requestId)throw new Error('Máy chủ trả về mã nhận quà không khớp.');
    const seen=s.data.activityRewardReceipts.includes(result.sourceId);
    const next={...s.data,pendingDailyAction:null,
     activityRewardReceipts:seen?s.data.activityRewardReceipts:[...s.data.activityRewardReceipts,result.sourceId],
     bossStoneInbox:s.data.bossStoneInbox+(seen?0:result.upgradeStones||0),
     inventory:{...s.data.inventory,...result.foodQuantities}};
    // Ghi nhận đã cấp đá và số đá vào cùng một bản lưu, tránh cấp lại khi mất phản hồi.
    this.save(next);s.data=next;s.changed();
    this.scene.bossRewards?.collect(false);void this.scene.wingsSystem?.load();
   }else{s.data.pendingDailyAction=null;s.changed();}
   return result;
  }catch(e){
   this.error=e.message;
   if([400,403,404,409].includes(e.status)){s.data.pendingDailyAction=null;s.changed();}
   throw e;
  }finally{this.busy=false;this.notify();}
 }
 claim(){return this.run('claim');}
 async collect(sourceId){
  const box=this.view?.boxes.find(b=>b.sourceId===sourceId);
  if(box)for(const [id,qty] of Object.entries(box.items))if(id.startsWith('food_')){
   const error=this.state.canAdd(id,qty);if(error)throw new Error(error+' Vật phẩm điểm danh vẫn được giữ lại. Khi túi có chỗ, mở Điểm danh để nhận lại.');
  }
  return this.run('collect',sourceId);
 }
}
