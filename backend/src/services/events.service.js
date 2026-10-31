const eventSkills=require('../config/skillBooks.json').eventBooks||[];
const catalog=require('../config/tuLinh.json');
const equipment=require('../config/tuLinhEquipment.json');
const huntEvent=require('../config/huntEvent.json');
const skillTraining=require('../config/skillTraining.json');
const {characterView}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
const eventEquipment={...huntEvent.offhand,...Object.fromEntries(Object.values(huntEvent.classWeapons).map(item=>[item.id,item]))};
async function eventLog(c,id){
 const [rows]=await c.execute("SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND action_type IN ('boss_reward','event_exchange','monster_kill','event_milestone_claim')",[id]);
 return rows;
}
function eventBalances(events){
 const balances=Object.fromEntries(catalog.materials.map(m=>[m.id,0]));
 for(const entry of events){
  const payload=parse(entry.payload);
  if(entry.action_type==='boss_reward')for(const [id,count] of Object.entries(payload.eventItems||{})){
   if(id==='nhan_long'&&payload.bossId!=='thanh-long')continue;
   if(Object.hasOwn(balances,id)&&Number.isSafeInteger(count)&&count>0&&count<=100)balances[id]+=count;
  }
  if(entry.action_type==='event_exchange'&&payload.eventId===catalog.id){
   const id=payload.materialId||'nhan_long';if(Object.hasOwn(balances,id))balances[id]-=Number(payload.cost)||0;
  }
 }
 return Object.fromEntries(Object.entries(balances).map(([id,count])=>[id,Math.max(0,count)]));
}
async function eventBalance(c,id){return eventBalances(await eventLog(c,id));}
async function inventory(c,id){
 const [rows]=await c.execute('SELECT item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ? AND quantity > 0 ORDER BY id',[id]);
 return rows.map(r=>({id:r.item_definition_id,quantity:Number(r.quantity),location:r.location,slot:r.slot_key}));
}
function huntSnapshot(events,char){
 const monsterKills=events.filter(e=>e.action_type==='monster_kill').length;
 const bossKills=events.filter(e=>e.action_type==='boss_reward').length;
 const claimed=new Set(events.filter(e=>e.action_type==='event_milestone_claim').map(e=>parse(e.payload)).filter(p=>p.eventId===huntEvent.id).map(p=>p.milestoneId));
 const viewMilestones=(milestones,count)=>milestones.map(m=>{
  const reward={...m.reward};
  if(reward.classWeapon){
   reward.weapon=huntEvent.classWeapons[char.class_code]||null;
   delete reward.classWeapon;
  }
  return {...m,reward,claimed:claimed.has(m.id),canClaim:count>=m.threshold&&!claimed.has(m.id)};
 });
 return {id:huntEvent.id,name:huntEvent.name,description:huntEvent.description,monsterKills,bossKills,monsterMilestones:viewMilestones(huntEvent.monsterMilestones,monsterKills),bossMilestones:viewMilestones(huntEvent.bossMilestones,bossKills)};
}
async function addInventoryItem(c,char,itemId,quantity){
 const special=eventEquipment[itemId];
 if(special)await c.execute(
  'INSERT IGNORE INTO item_definitions (id, name, type, tier, price, max_stack, attack_bonus, icon_key, description, available_in_shop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [itemId,special.name,special.type,special.level||6,0,1,special.attack||0,special.icon,special.description||'',0]
 );
 const [definitions]=await c.execute('SELECT id, max_stack FROM item_definitions WHERE id = ?',[itemId]);
 if(!definitions[0])throw fail(503,'Thiếu định nghĩa vật phẩm '+itemId+'. Hãy kiểm tra dữ liệu vật phẩm.');
 const max=Math.min(99,Number(definitions[0].max_stack)||99);
 const [rows]=await c.execute("SELECT id, item_definition_id, quantity, slot_key FROM character_items WHERE character_id = ? AND location = 'inventory' ORDER BY id FOR UPDATE",[char.id]);
 const stacks=rows.filter(r=>r.item_definition_id===itemId),current=stacks.reduce((n,r)=>n+Number(r.quantity),0);
 const occupied=new Set(rows.map(r=>String(r.slot_key))),required=Math.ceil((current+quantity)/max);
 if(required>stacks.length+28-occupied.size)throw fail(409,'Túi đồ đã đầy. Hãy dọn túi rồi nhận quà sự kiện.');
 let remaining=quantity;
 for(const stack of stacks){
  const added=Math.min(remaining,max-Number(stack.quantity));
  if(added>0){await c.execute('UPDATE character_items SET quantity = quantity + ? WHERE id = ? AND character_id = ?',[added,stack.id,char.id]);remaining-=added;}
 }
 while(remaining>0){
  let slot;
  for(let i=0;i<28;i++)if(!occupied.has(String(i))){slot=String(i);break;}
  if(slot===undefined)throw fail(409,'Túi đồ đã đầy. Hãy dọn túi rồi nhận quà sự kiện.');
  const added=Math.min(remaining,max);
  await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, ?, 'inventory', ?)",[char.id,itemId,added,String(slot)]);
  occupied.add(String(slot));remaining-=added;
 }
}
async function grantItem(c,char,id,quantity){
 if(/^wing_stone_[1-4]$/.test(id)){
  await c.execute('INSERT IGNORE INTO character_wing_materials (character_id, item_id, quantity) VALUES (?, ?, 0)',[char.id,id]);
  const [changed]=await c.execute('UPDATE character_wing_materials SET quantity = quantity + ? WHERE character_id = ? AND item_id = ? AND quantity + ? <= 999',[quantity,char.id,id,quantity]);
  if(!changed.affectedRows)throw fail(409,'Đá nâng cấp cánh đã đầy. Hãy dùng bớt trước khi nhận quà.');
  return;
 }
 if(skillTraining.materials.some(m=>m.id===id)){
  await c.execute('INSERT IGNORE INTO character_skill_materials (character_id, item_id, quantity) VALUES (?, ?, 0)',[char.id,id]);
  const [changed]=await c.execute('UPDATE character_skill_materials SET quantity = quantity + ? WHERE character_id = ? AND item_id = ? AND quantity + ? <= 9999',[quantity,char.id,id,quantity]);
  if(!changed.affectedRows)throw fail(409,'Nguyên liệu kỹ năng đã đầy. Hãy dùng bớt trước khi nhận quà.');
  return;
 }
 await addInventoryItem(c,char,id,quantity);
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
 async function snapshot(c,char){
  const [books]=await c.execute('SELECT skill_id FROM character_skill_books WHERE character_id = ?',[char.id]),log=await eventLog(c,char.id);
  return {character:characterView(char),events:[
   {...catalog,equipment,eventSkills,ownedEventSkills:books.map(b=>b.skill_id),classCode:char.class_code,balances:eventBalances(log)},
   huntSnapshot(log,char)
  ]};
 }
 return {
  load:userId=>run(userId,snapshot),
  async claimMilestone(userId,input={}){
   if(input.eventId!==huntEvent.id||!uuid(input.requestId)||typeof input.milestoneId!=='string')throw fail(400,'Yêu cầu nhận quà sự kiện không hợp lệ.');
   const allMilestones=[...huntEvent.monsterMilestones,...huntEvent.bossMilestones],milestone=allMilestones.find(m=>m.id===input.milestoneId);
   if(!milestone)throw fail(400,'Mốc quà sự kiện không hợp lệ.');
   return run(userId,async(c,char)=>{
    const [receipts]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,input.requestId]);
    if(receipts.length){
     const payload=parse(receipts[0].payload);
     if(receipts[0].action_type!=='event_milestone_claim'||payload.eventId!==huntEvent.id||payload.milestoneId!==milestone.id)throw fail(409,'Mã nhận quà đã dùng cho thao tác khác.');
     return {...await snapshot(c,char),requestId:input.requestId,milestoneId:milestone.id,items:await inventory(c,char.id),replayed:true};
    }
    const log=await eventLog(c,char.id),event=huntSnapshot(log,char);
    const group=milestone.id.startsWith('monster-')?event.monsterMilestones:event.bossMilestones;
    const status=group.find(entry=>entry.id===milestone.id);
    if(status.claimed)return {...await snapshot(c,char),requestId:input.requestId,milestoneId:milestone.id,items:await inventory(c,char.id),alreadyClaimed:true};
    if(!status.canClaim)throw fail(409,'Bạn chưa đạt mốc sự kiện này.');
    const reward={...milestone.reward},itemRewards={...reward.items};
    if(reward.offhand)itemRewards[reward.offhand]=1;
    if(reward.classWeapon){
     const weapon=huntEvent.classWeapons[char.class_code];
     if(!weapon)throw fail(409,'Class nhân vật chưa có vũ khí sự kiện.');
     itemRewards[weapon.id]=1;reward.weapon=weapon;delete reward.classWeapon;
    }
    const gold=Number(char.gold)+Number(reward.gold||0),gems=Number(char.gems||0)+Number(reward.gems||0);
    if(gold>9999999||gems>9999999)throw fail(409,'Ví tiền đã đầy. Hãy dùng bớt trước khi nhận quà.');
    for(const [id,quantity] of Object.entries(itemRewards))await grantItem(c,char,id,quantity);
    await c.execute('UPDATE characters SET gold = ?, gems = ?, progress_version = progress_version + 1 WHERE id = ?',[gold,gems,char.id]);
    Object.assign(char,{gold,gems,progress_version:Number(char.progress_version||0)+1});
    const payload={eventId:huntEvent.id,milestoneId:milestone.id,reward:{...reward,items:itemRewards}};
    await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',[char.id,input.requestId,'event_milestone_claim',JSON.stringify(payload)]);
    return {...await snapshot(c,char),requestId:input.requestId,milestoneId:milestone.id,items:await inventory(c,char.id),reward:payload.reward,replayed:false};
   });
  },
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
module.exports={createEventsService,eventBalance,huntSnapshot};
