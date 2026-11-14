import {eventsApi} from '../../api/eventsApi.js';
import {EVENT_SKILLS} from '../data/eventSkills.js';
import {ITEMS} from '../data/items.js';
export class EventsSystem{
 constructor(scene){this.scene=scene;this.state=scene.rpgState;this.alive=true;this.view=null;this.error='';this.busy=false;this.loading=false;this.spinning=false;this.lastDragonSpin=null;this.selectedHuntGroup='monster';this.onChange=()=>{};scene.events.once('shutdown',()=>{this.alive=false;});if(this.state.data.pendingEventExchange||this.state.data.pendingEventClaim||this.state.data.pendingDragonAction)void this.load();}
 notify(){if(this.alive)this.onChange();}
 apply(result){
  if(String(result.character?.id)!==String(this.state.data.characterId)||!Array.isArray(result.events))throw new Error('Dữ liệu sự kiện không thuộc nhân vật.');
  if(Number.isSafeInteger(result.wingEssence)&&result.wingEssence>=0)this.state.data.inventory.wing_essence=result.wingEssence;
  this.state.applyServerCharacter(result.character);if(Array.isArray(result.items))this.state.applyServerItems(result.items);this.view=result.events;this.error='';
 }
 async load(){
  if(this.loading||this.busy)return;this.loading=true;this.notify();
  try{this.apply(await eventsApi.load());}catch(e){this.error=e.message;}finally{this.loading=false;this.notify();}
  if(this.state.data.pendingEventExchange)await this.exchange();
  if(this.state.data.pendingEventClaim)await this.claim(this.state.data.pendingEventClaim.milestoneId);
  if(this.state.data.pendingDragonAction)await this.recoverDragonAction();
 }
 save(next){
  if(!this.state.storage)throw new Error('Chưa lưu được yêu cầu đổi. Hãy cho phép lưu trên trình duyệt.');
  this.state.storage.setItem(this.state.saveKey,JSON.stringify(next));
  if(this.state.storage.getItem(this.state.saveKey)!==JSON.stringify(next))throw new Error('Chưa lưu được yêu cầu đổi. Hãy thử lại.');
 }
 canStartEventAction(){
  const s=this.state;
  return !(s.usingItem||s.buying||s.selling||s.bossRewardBusy||s.data.pendingPurchase||s.data.pendingSale||s.data.pendingEquipmentAction||s.data.pendingItemUse||s.data.pendingInventoryAction||s.data.pendingDailyAction||s.data.pendingEventExchange||s.data.pendingEventClaim);
 }
 async recoverDragonAction(){
  const pending=this.state.data.pendingDragonAction;
  if(!pending)return;
  if(pending.action==='exchange')return this.exchangeDragonKey(true);
  if(pending.action==='spin')return this.spinDragonCache(true);
 }
 async runDragonAction(action,recovering=false){
  const s=this.state;if(this.busy)return;
  if(!recovering&&!this.canStartEventAction()){
   this.error='Hãy hoàn tất giao dịch đang chờ trước.';this.notify();return;
  }
  if(!s.data.pendingDragonAction){
   if(action==='exchange'&&this.scene.dialogue?.nearest()?.role!=='dragon-cache-exchange'){
    this.error='Hãy đến gần Thợ rèn Long Kha tại Phế Tích Địa Long để đổi nguyên liệu.';this.notify();return;
   }
   const pending={
    eventId:'dragon-cache',action,requestId:crypto.randomUUID(),
    ...(action==='exchange'?{position:{mapId:this.scene.mapData.id,x:this.scene.player.x,feetY:this.scene.player.feetY}}:{})
   };
   this.save({...s.data,pendingDragonAction:pending});s.data.pendingDragonAction=pending;s.changed();
  }
  const pending=s.data.pendingDragonAction;
  if(pending.eventId!=='dragon-cache'||pending.action!==action){this.error='Có một giao dịch Rương Địa Long khác đang chờ.';this.notify();return;}
  this.busy=true;this.spinning=action==='spin';this.error='';this.notify();
  try{
   const request=action==='exchange'?eventsApi.exchangeDragonKey:eventsApi.spinDragonCache;
   const operation=request.call(eventsApi,pending);
   const result=action==='spin'
    ?(await Promise.all([operation,new Promise(resolve=>setTimeout(resolve,2200))]))[0]
    :await operation;
   if(result.requestId!==pending.requestId||String(result.character?.id)!==String(s.data.characterId)||!Array.isArray(result.items))throw new Error('Phản hồi Rương Địa Long không khớp.');
   const dragonCache=this.view?.find(event=>event.id==='dragon-cache');
   if(action==='spin'&&(typeof result.rewardId!=='string'||!ITEMS[result.rewardId]||!dragonCache?.rewardIds?.includes(result.rewardId)))throw new Error('Máy chủ trả về phần thưởng quay rương không hợp lệ.');
   this.apply(result);
   if(action==='spin')this.lastDragonSpin=result.rewardId;
   this.save({...s.data,pendingDragonAction:null});s.data.pendingDragonAction=null;s.changed();
   this.scene.hud?.toast(action==='exchange'?'Đã đổi 50 vật phẩm rơi lấy 1 chìa khóa Rương Địa Long.':`Quay rương nhận được ${ITEMS[result.rewardId]?.name||'trang bị Địa Long'}.`);
  }catch(e){
   this.error=e.message;
   if([400,403,409].includes(e.status)){this.save({...s.data,pendingDragonAction:null});s.data.pendingDragonAction=null;s.changed();}
  }finally{this.busy=false;this.spinning=false;this.notify();}
 }
 exchangeDragonKey(recovering=false){return this.runDragonAction('exchange',recovering);}
 spinDragonCache(recovering=false){return this.runDragonAction('spin',recovering);}
 async exchange(recipeId='nhan-long-weapon'){
  const s=this.state;if(this.busy)return;
  if(s.usingItem||s.buying||s.selling||s.bossRewardBusy||s.data.pendingPurchase||s.data.pendingSale||s.data.pendingEquipmentAction||s.data.pendingItemUse||s.data.pendingInventoryAction||s.data.pendingDailyAction){this.error='Hãy hoàn tất giao dịch vật phẩm đang chờ trước.';this.notify();return;}
  this.busy=true;this.error='';this.notify();
  try{
   if(!s.data.pendingEventExchange){
    const event=this.view?.find(e=>e.id==='tu-linh');
    const recipe=event?.recipes?.find(r=>r.id===recipeId);
    const itemId=recipe?.skillId|| (recipe?.classWeapon?event.weapons?.[s.data.classCode]?.id:recipe?.itemId);
    if(!itemId)throw new Error('Hãy tải lại sự kiện.');
    const error=recipe.skillId?null:s.canAdd(itemId);if(error)throw new Error(error+' Nguyên liệu vẫn được giữ.');
    const pending={eventId:'tu-linh',recipeId,requestId:crypto.randomUUID()};this.save({...s.data,pendingEventExchange:pending});s.data.pendingEventExchange=pending;s.changed();
   }
   const pending=s.data.pendingEventExchange,result=await eventsApi.exchange(pending);
   if(result.requestId!==pending.requestId||(!ITEMS[result.itemId]&&!EVENT_SKILLS.some(k=>k.id===result.itemId)))throw new Error('Phản hồi đổi sự kiện không khớp.');
   this.apply(result);
   if(result.skillId)await this.scene.skillsSystem?.load();
   this.save({...s.data,pendingEventExchange:null});s.data.pendingEventExchange=null;s.changed();
   this.scene.hud?.toast(result.skillId?'Đã học Huyễn Thú Hàn Pháo. Mở Balo → Kỹ năng để gán vào ô.':`Đã nhận ${ITEMS[result.itemId].name}. Mở Balo để trang bị.`);
  }catch(e){
   this.error=e.message;
   if([400,403,409].includes(e.status)){s.data.pendingEventExchange=null;s.changed();}
  }finally{this.busy=false;this.notify();}
 }
 async claim(milestoneId){
  const s=this.state;if(this.busy)return;
  if(s.usingItem||s.buying||s.selling||s.bossRewardBusy||s.data.pendingPurchase||s.data.pendingSale||s.data.pendingEquipmentAction||s.data.pendingItemUse||s.data.pendingInventoryAction||s.data.pendingDailyAction){this.error='Hãy hoàn tất giao dịch vật phẩm đang chờ trước.';this.notify();return;}
  this.busy=true;this.error='';this.notify();
  try{
   let pending=s.data.pendingEventClaim;
   if(!pending){
    pending={eventId:'hunt-monsters',milestoneId,requestId:crypto.randomUUID()};
    this.save({...s.data,pendingEventClaim:pending});s.data.pendingEventClaim=pending;s.changed();
   }
   const result=await eventsApi.claim(pending);
   if(result.requestId!==pending.requestId||result.milestoneId!==pending.milestoneId||String(result.character?.id)!==String(s.data.characterId))throw new Error('Phản hồi quà sự kiện không khớp.');
   this.apply(result);
   await this.scene.wingsSystem?.load();await this.scene.skillsSystem?.load();
   this.save({...s.data,pendingEventClaim:null});s.data.pendingEventClaim=null;s.changed();
   this.scene.hud?.toast(result.alreadyClaimed?'Mốc quà này đã được nhận trước đó.':'Đã nhận quà mốc sự kiện thành công.');
  }catch(e){
   this.error=e.message;
   if([400,403,409].includes(e.status)){s.data.pendingEventClaim=null;s.changed();}
  }finally{this.busy=false;this.notify();}
 }
}
