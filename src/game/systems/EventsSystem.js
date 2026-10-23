import {eventsApi} from '../../api/eventsApi.js';
import {ITEMS} from '../data/items.js';
export class EventsSystem{
 constructor(scene){this.scene=scene;this.state=scene.rpgState;this.alive=true;this.view=null;this.error='';this.busy=false;this.loading=false;this.onChange=()=>{};scene.events.once('shutdown',()=>{this.alive=false;});if(this.state.data.pendingEventExchange)void this.load();}
 notify(){if(this.alive)this.onChange();}
 apply(result){
  if(String(result.character?.id)!==String(this.state.data.characterId)||!Array.isArray(result.events))throw new Error('Dữ liệu sự kiện không thuộc nhân vật.');
  this.state.applyServerCharacter(result.character);this.view=result.events;this.error='';
 }
 async load(){
  if(this.loading||this.busy)return;this.loading=true;this.notify();
  try{this.apply(await eventsApi.load());}catch(e){this.error=e.message;}finally{this.loading=false;this.notify();}
  if(this.state.data.pendingEventExchange)await this.exchange();
 }
 save(next){
  if(!this.state.storage)throw new Error('Chưa lưu được yêu cầu đổi. Hãy cho phép lưu trên trình duyệt.');
  this.state.storage.setItem(this.state.saveKey,JSON.stringify(next));
  if(this.state.storage.getItem(this.state.saveKey)!==JSON.stringify(next))throw new Error('Chưa lưu được yêu cầu đổi. Hãy thử lại.');
 }
 async exchange(recipeId='nhan-long-weapon'){
  const s=this.state;if(this.busy)return;
  if(s.usingItem||s.buying||s.selling||s.bossRewardBusy||s.data.pendingPurchase||s.data.pendingSale||s.data.pendingEquipmentAction||s.data.pendingItemUse||s.data.pendingInventoryAction||s.data.pendingDailyAction){this.error='Hãy hoàn tất giao dịch vật phẩm đang chờ trước.';this.notify();return;}
  this.busy=true;this.error='';this.notify();
  try{
   if(!s.data.pendingEventExchange){
    const event=this.view?.find(e=>e.id==='tu-linh');
    const recipe=event?.recipes?.find(r=>r.id===recipeId);
    const itemId=recipe?.classWeapon?event.weapons?.[s.data.classCode]?.id:recipe?.itemId;
    if(!itemId)throw new Error('Hãy tải lại sự kiện.');
    const error=s.canAdd(itemId);if(error)throw new Error(error+' Nguyên liệu vẫn được giữ.');
    const pending={eventId:'tu-linh',recipeId,requestId:crypto.randomUUID()};this.save({...s.data,pendingEventExchange:pending});s.data.pendingEventExchange=pending;s.changed();
   }
   const pending=s.data.pendingEventExchange,result=await eventsApi.exchange(pending);
   if(result.requestId!==pending.requestId||!ITEMS[result.itemId])throw new Error('Phản hồi đổi sự kiện không khớp.');
   this.apply(result);s.applyServerItems(result.items);
   this.save({...s.data,pendingEventExchange:null});s.data.pendingEventExchange=null;s.changed();
   this.scene.hud?.toast(`Đã nhận ${ITEMS[result.itemId].name}. Mở Balo để trang bị.`);
  }catch(e){
   this.error=e.message;
   if([400,403,409].includes(e.status)){s.data.pendingEventExchange=null;s.changed();}
  }finally{this.busy=false;this.notify();}
 }
}
