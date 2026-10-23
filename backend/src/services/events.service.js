const eventSkills=require('../config/skillBooks.json').eventBooks||[];
const catalog=require('../config/tuLinh.json');
const equipment=require('../config/tuLinhEquipment.json');
const {characterView}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const parse=v=>typeof v==='string'?JSON.parse(v):v;
async function eventBalance(c,id){
 const [events]=await c.execute("SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND action_type IN ('boss_reward','event_exchange')",[id]);
 const balances=Object.fromEntries(catalog.materials.map(m=>[m.id,0]));
 for(const e of events){
  const p=parse(e.payload);
  if(e.action_type==='boss_reward')for(const [id,count] of Object.entries(p.eventItems||{})){
   if(id==='nhan_long'&&p.bossId!=='thanh-long')continue;
   if(Object.hasOwn(balances,id)&&Number.isSafeInteger(count)&&count>0&&count<=100)balances[id]+=count;
  }
  if(e.action_type==='event_exchange'&&p.eventId===catalog.id){
   const id=p.materialId||'nhan_long';if(Object.hasOwn(balances,id))balances[id]-=Number(p.cost)||0;
  }
 }
 return Object.fromEntries(Object.entries(balances).map(([id,n])=>[id,Math.max(0,n)]));
}
async function inventory(c,id){
 const [rows]=await c.execute('SELECT item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ? AND quantity > 0 ORDER BY id',[id]);
 return rows.map(r=>({id:r.item_definition_id,quantity:Number(r.quantity),location:r.location,slot:r.slot_key}));
}
function createEventsService(db){
 async function run(userId,operation){
  const c=await db.getConnection();
  try{
   await c.beginTransaction();
   const [rows]=await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);
   if(!rows[0])throw fail(409,'Hãy tạo nhân vật trước.');
   const result=await operation(c,rows[0]);await c.commit();return result;
  }catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}
 }
 async function snapshot(c,char){const [books]=await c.execute('SELECT skill_id FROM character_skill_books WHERE character_id = ?',[char.id]);return {character:characterView(char),events:[{...catalog,equipment,eventSkills,ownedEventSkills:books.map(b=>b.skill_id),classCode:char.class_code,balances:await eventBalance(c,char.id)}]};}
 return {
  load:userId=>run(userId,snapshot),
  async exchange(userId,input={}){
   if(input.eventId!==catalog.id||typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.requestId))throw fail(400,'Yêu cầu đổi sự kiện không hợp lệ.');
   return run(userId,async(c,char)=>{
    const recipe=catalog.recipes.find(r=>r.id===(input.recipeId||'nhan-long-weapon'));
    if(!recipe)throw fail(400,'Công thức đổi sự kiện không hợp lệ.');
    const reward=recipe.skillId?eventSkills.find(s=>s.id===recipe.skillId):recipe.classWeapon?(Object.hasOwn(catalog.weapons,char.class_code)?catalog.weapons[char.class_code]:null):equipment[recipe.itemId];
    if(!reward)throw fail(409,'Class hoặc trang bị chưa được hỗ trợ.');
    const itemId=recipe.skillId|| (recipe.classWeapon?reward.id:recipe.itemId);
    const material=catalog.materials.find(m=>m.id===recipe.materialId);
    const [receipts]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,input.requestId]);
    if(receipts.length){
     const p=parse(receipts[0].payload);
     if(receipts[0].action_type!=='event_exchange'||p.eventId!==catalog.id||p.itemId!==itemId||(p.recipeId||'nhan-long-weapon')!==recipe.id)throw fail(409,'Mã giao dịch đã dùng cho thao tác khác.');
     return {...await snapshot(c,char),requestId:input.requestId,itemId,skillId:recipe.skillId||null,items:await inventory(c,char.id),replayed:true};
    }
    const balances=await eventBalance(c,char.id);
    if(balances[recipe.materialId]<recipe.cost)throw fail(409,`Cần đủ ${recipe.cost} ${material.name} để đổi trang bị.`);
    if(recipe.skillId){
     const [owned]=await c.execute('SELECT skill_id FROM character_skill_books WHERE character_id = ?',[char.id]);
     if(owned.some(b=>b.skill_id===recipe.skillId))throw fail(409,'Bạn đã học kỹ năng này; Hàn Nha được giữ nguyên.');
     await c.execute('INSERT INTO character_skill_books (character_id, skill_id) VALUES (?, ?)',[char.id,recipe.skillId]);
    }else{
    const items=await inventory(c,char.id),occupied=new Set(items.filter(i=>i.location==='inventory').map(i=>String(i.slot)));
    let slot=null;for(let i=0;i<28;i++)if(!occupied.has(String(i))){slot=String(i);break;}
    if(slot===null)throw fail(409,'Balo đầy. Hãy chừa một ô trống để nhận trang bị; nguyên liệu vẫn được giữ.');
    await c.execute('INSERT IGNORE INTO item_definitions (id, name, type, tier, price, max_stack, attack_bonus, icon_key, description, available_in_shop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[itemId,reward.name,reward.type||'weapon',6,0,1,reward.attack||0,reward.icon,reward.description||`Vũ khí Tứ Linh dành cho ${char.class_code}. +${reward.attack} công.`,0]);
    await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'inventory', ?)",[char.id,itemId,slot]);
    }
    await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',[char.id,input.requestId,'event_exchange',JSON.stringify({eventId:catalog.id,recipeId:recipe.id,materialId:recipe.materialId,itemId,cost:recipe.cost})]);
    await c.execute('UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?',[char.id]);char.progress_version=Number(char.progress_version||0)+1;
    return {...await snapshot(c,char),requestId:input.requestId,itemId,skillId:recipe.skillId||null,items:await inventory(c,char.id),replayed:false};
   });
  }
 };
}
module.exports={createEventsService,eventBalance};
