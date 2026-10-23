const rewards=require('../config/dailyRewards.json');
const {characterView}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
const parse=value=>typeof value==='string'?JSON.parse(value):value;
const foodIds=['food_perch_soup','food_carp_stew','food_catfish_stew'];
function vietnamDay(now=new Date()){
 const date=new Date(now.getTime()+7*3600000).toISOString().slice(0,10);
 return {date,resetAt:new Date(Date.parse(date+'T00:00:00+07:00')+86400000).toISOString()};
}
function dailyView(events,now){
 const {date,resetAt}=vietnamDay(now);
 const claims=events.filter(e=>e.action_type==='daily_checkin').map(e=>({sourceId:e.request_id,...parse(e.payload)}));
 const collected=new Set(events.filter(e=>e.action_type==='daily_collect').map(e=>parse(e.payload).sourceId));
 const today=claims.find(c=>c.date===date),total=claims.length;
 const progress=today?((total-1)%7)+1:total%7;
 return {serverNow:now.toISOString(),today:date,resetAt,canClaim:!today,totalClaims:total,cycle:Math.floor((total-(today?1:0))/7)+1,
  progress,nextDay:total%7+1,rewards,
  boxes:claims.filter(c=>!collected.has(c.sourceId)).map(c=>({sourceId:c.sourceId,date:c.date,day:c.day,items:c.reward.items})),
  history:claims.slice().reverse().slice(0,14).map(c=>({...c,collected:collected.has(c.sourceId)}))};
}
function createDailyService(db,{now=()=>new Date()}={}){
 async function transaction(userId,fn){
  const c=await db.getConnection();try{
   await c.beginTransaction();
   const [chars]=await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);
   if(!chars[0])throw fail(409,'Hãy tạo nhân vật trước khi điểm danh.');
   const result=await fn(c,chars[0]);await c.commit();return result;
  }catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}
 }
 async function events(c,id){
  const [rows]=await c.execute("SELECT request_id, action_type, payload, created_at FROM character_economy_events WHERE character_id = ? AND action_type IN ('daily_checkin', 'daily_collect') ORDER BY created_at, request_id",[id]);return rows;
 }
 async function snapshot(c,char,extra={}){return {character:characterView(char),daily:dailyView(await events(c,char.id),now()),...extra};}
 async function receipt(c,char,input,action){
  const [rows]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,input.requestId]);
  if(!rows.length)return null;
  const old=parse(rows[0].payload);
  if(rows[0].action_type!==action||(action==='daily_collect'&&old.sourceId!==input.sourceId))throw fail(409,'Mã yêu cầu đã dùng cho thao tác khác.');
  return old;
 }
 async function saveEvent(c,char,input,action,payload){
  await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',[char.id,input.requestId,action,JSON.stringify(payload)]);
 }
 async function deliveryState(c,char){
  const [foods]=await c.execute("SELECT item_definition_id, quantity FROM character_items WHERE character_id = ? AND location = 'inventory' AND item_definition_id IN ('food_perch_soup', 'food_carp_stew', 'food_catfish_stew')",[char.id]);
  const foodQuantities=Object.fromEntries(foodIds.map(id=>[id,foods.filter(r=>r.item_definition_id===id).reduce((n,r)=>n+Number(r.quantity),0)]));
  return {foodQuantities};
 }
 async function grantFood(c,char,id,quantity){
  const [definitions]=await c.execute('SELECT id, max_stack FROM item_definitions WHERE id = ?',[id]);
  if(!definitions[0])throw fail(503,'Thiếu định nghĩa thức ăn '+id+'. Hãy kiểm tra dữ liệu vật phẩm.');
  const [rows]=await c.execute("SELECT id, item_definition_id, quantity, slot_key FROM character_items WHERE character_id = ? AND location = 'inventory' ORDER BY id FOR UPDATE",[char.id]);
  const max=Math.min(99,Number(definitions[0].max_stack)||99);
  const current=rows.filter(r=>r.item_definition_id===id).reduce((n,r)=>n+Number(r.quantity),0);
  if(current+quantity>max)throw fail(409,'Chồng thức ăn đã đầy. Quà vẫn được giữ tại Quà chờ.');
  const stack=rows.find(r=>r.item_definition_id===id);
  if(stack)await c.execute('UPDATE character_items SET quantity = quantity + ? WHERE id = ? AND character_id = ?',[quantity,stack.id,char.id]);
  else{
   const occupied=new Set(rows.map(r=>String(r.slot_key)));let slot;
   for(let i=0;i<28;i++)if(!occupied.has(String(i))){slot=String(i);break;}
   if(slot===undefined)throw fail(409,'Túi đồ đã đầy. Hãy dọn túi rồi nhận trong Quà chờ.');
   await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, ?, 'inventory', ?)",[char.id,id,quantity,slot]);
  }
 }
 return {
  load:userId=>transaction(userId,(c,char)=>snapshot(c,char)),
  async claim(userId,input={}){
   if(!uuid(input.requestId))throw fail(400,'Mã điểm danh không hợp lệ.');
   return transaction(userId,async(c,char)=>{
    const previous=await receipt(c,char,input,'daily_checkin');
    if(previous)return snapshot(c,char,{sourceId:input.requestId,replayed:true});
    const log=await events(c,char.id),view=dailyView(log,now());
    if(!view.canClaim)return snapshot(c,char,{alreadyClaimed:true});
    const reward=rewards[view.nextDay-1];
    const gold=Number(char.gold)+reward.gold,gems=Number(char.gems||0)+reward.gems;
    if(gold>9999999||gems>9999999)throw fail(409,'Ví tiền đã đầy. Hãy dùng bớt trước khi nhận quà.');
    await c.execute('UPDATE characters SET gold = ?, gems = ?, progress_version = progress_version + 1 WHERE id = ?',[gold,gems,char.id]);
    Object.assign(char,{gold,gems,progress_version:Number(char.progress_version||0)+1});
    await saveEvent(c,char,input,'daily_checkin',{date:view.today,day:reward.day,cycle:view.cycle,reward});
    return snapshot(c,char,{sourceId:input.requestId,replayed:false});
   });
  },
  async collect(userId,input={}){
   if(!uuid(input.requestId)||!uuid(input.sourceId))throw fail(400,'Mã nhận quà không hợp lệ.');
   return transaction(userId,async(c,char)=>{
    const previous=await receipt(c,char,input,'daily_collect');
    const log=await events(c,char.id);
    const source=log.find(e=>e.action_type==='daily_checkin'&&e.request_id===input.sourceId);
    if(!source)throw fail(404,'Không có quà này cho nhân vật hiện tại.');
    const items=parse(source.payload).reward.items;
    const already=previous||log.find(e=>e.action_type==='daily_collect'&&parse(e.payload).sourceId===input.sourceId);
    if(!already){
     for(const [id,qty] of Object.entries(items)){
      if(foodIds.includes(id))await grantFood(c,char,id,qty);
      else if(/^wing_stone_[1-3]$/.test(id)){
       await c.execute('INSERT IGNORE INTO character_wing_materials (character_id, item_id, quantity) VALUES (?, ?, 0)',[char.id,id]);
       const [changed]=await c.execute('UPDATE character_wing_materials SET quantity = quantity + ? WHERE character_id = ? AND item_id = ? AND quantity + ? <= 999',[qty,char.id,id,qty]);
       if(!changed.affectedRows)throw fail(409,'Đá nâng cấp cánh đã đầy. Quà vẫn được giữ để nhận sau.');
      }
     }
     await c.execute('UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?',[char.id]);char.progress_version=Number(char.progress_version||0)+1;
     await saveEvent(c,char,input,'daily_collect',{sourceId:input.sourceId,items});
    }
    return snapshot(c,char,{...await deliveryState(c,char),sourceId:input.sourceId,requestId:input.requestId,upgradeStones:items.upgrade_stone||0,replayed:!!already});
   });
  }
 };
}
module.exports={createDailyService,dailyView,vietnamDay};
