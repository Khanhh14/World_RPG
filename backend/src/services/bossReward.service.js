const {characterView,reward}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const BOSS_CONFIG=Object.freeze({
 'hoa-phuong':{name:'Hỏa Phượng',cooldownMs:1200000,exp:5000,gold:3000,stones:5},
 'dia-long':{name:'Địa Long',cooldownMs:1200000,exp:5000,gold:2000,stones:0},
 'bach-ho':{name:'Bạch Hổ',cooldownMs:1200000,exp:5000,gold:3000,stones:5},
 'huyen-quy':{name:'Huyền Quy',cooldownMs:1200000,exp:5000,gold:3000,stones:5},
 'thanh-long':{name:'Thanh Long',cooldownMs:1200000,exp:5000,gold:3000,stones:5},
 'forest-guardian':{name:'Thủ hộ khu rừng',cooldownMs:1200000,exp:750,gold:300,stones:1},
 naga:{name:'NaGa',cooldownMs:600000,exp:300,gold:500,stones:1},
 noxii:{name:'Hộ Vệ Hắc Thạch',cooldownMs:1200000,exp:1000,gold:500,stones:1}
});
function configFor(bossId){
 if(typeof bossId!=='string'||!Object.hasOwn(BOSS_CONFIG,bossId))throw fail(400,'Boss không hợp lệ.');
 return BOSS_CONFIG[bossId];
}
async function cooldown(c,characterId,bossId){
 const config=configFor(bossId);
 const [rows]=await c.execute(
  "SELECT COALESCE(GREATEST(0, ? - TIMESTAMPDIFF(MICROSECOND, MAX(created_at), CURRENT_TIMESTAMP(3)) / 1000), 0) AS remainingMs FROM character_economy_events WHERE character_id = ? AND action_type = 'boss_reward' AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.bossId')) = ?",
  [config.cooldownMs,characterId,bossId]);
 return Math.ceil(Number(rows[0]?.remainingMs)||0);
}
function createBossRewardService(db){return {
 async status(userId,bossId='naga'){
  configFor(bossId);
  const [rows]=await db.execute('SELECT id FROM characters WHERE user_id = ? ORDER BY id LIMIT 1',[userId]);
  if(!rows[0])throw fail(409,'Chưa có nhân vật.');
  return {bossId,remainingMs:await cooldown(db,rows[0].id,bossId)};
 },
 async claim(userId,input={}){
  const config=configFor(input.bossId);
  if(typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.requestId))throw fail(400,'Yêu cầu thưởng boss không hợp lệ.');
  const c=await db.getConnection();try{
   await c.beginTransaction();
   const [rows]=await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);
   const char=rows[0];if(!char)throw fail(409,'Chưa có nhân vật.');
   const [receipts]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,input.requestId]);
   if(receipts.length){
    const old=typeof receipts[0].payload==='string'?JSON.parse(receipts[0].payload):receipts[0].payload;
    if(receipts[0].action_type!=='boss_reward'||old.bossId!==input.bossId)throw fail(409,'Mã thưởng đã dùng cho thao tác khác.');
   }else{
    if(await cooldown(c,char.id,input.bossId)>0)throw fail(409,`${config.name} chưa hồi sinh. Hãy chờ đủ ${config.cooldownMs/60000} phút.`);
    await reward(c,char,config.exp,config.gold);
    if(input.bossId==='dia-long'){
     await c.execute(
      "INSERT IGNORE INTO item_definitions (id, name, type, tier, price, max_stack, attack_bonus, icon_key, description, available_in_shop) VALUES ('dragon_chest', 'Rương Địa Long', 'consumable', 1, 0, 99, 0, 'chest', 'Mở rương nhận ngẫu nhiên 1 trang bị Địa Long.', 0)"
     );
     const [definitions]=await c.execute("SELECT id, max_stack FROM item_definitions WHERE id = 'dragon_chest'");
     if(!definitions.length)throw fail(503,'Thiếu định nghĩa Rương Địa Long trong item_definitions.');
     const [stacks]=await c.execute("SELECT id, quantity, slot_key FROM character_items WHERE character_id = ? AND item_definition_id = 'dragon_chest' AND location = 'inventory' FOR UPDATE",[char.id]);
     const stack=stacks.find(item=>Number(item.quantity)<Number(definitions[0].max_stack));
     if(stack)await c.execute('UPDATE character_items SET quantity = quantity + 1 WHERE id = ? AND character_id = ?',[stack.id,char.id]);
     else{
      const [occupiedRows]=await c.execute("SELECT slot_key FROM character_items WHERE character_id = ? AND location = 'inventory' FOR UPDATE",[char.id]);
      const occupied=new Set(occupiedRows.map(item=>String(item.slot_key)));
      let slot=null;for(let i=0;i<28;i++)if(!occupied.has(String(i))){slot=String(i);break;}
      if(slot===null)throw fail(409,'Túi đồ đầy. Hãy chừa một ô trống rồi nhận thưởng Địa Long.');
      await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, 'dragon_chest', 1, 'inventory', ?)",[char.id,slot]);
     }
    }
    await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
     [char.id,input.requestId,'boss_reward',JSON.stringify({bossId:input.bossId,gold:config.gold,exp:config.exp,stones:config.stones,...(input.bossId==='thanh-long'?{eventItems:{nhan_long:1}}:input.bossId==='huyen-quy'?{eventItems:{huyen_giap:1}}:input.bossId==='bach-ho'?{eventItems:{han_nha:1}}:input.bossId==='hoa-phuong'?{eventItems:{hoa_phung:1}}:{})})]);
   }
   await c.commit();
   const [itemRows]=input.bossId==='dia-long'?await c.execute('SELECT item_definition_id AS id, quantity, location, slot_key AS slot FROM character_items WHERE character_id = ? ORDER BY id',[char.id]):[[]];
   return {character:characterView(char),bossId:input.bossId,requestId:input.requestId,
    eventItems:receipts.length?(typeof receipts[0].payload==='string'?JSON.parse(receipts[0].payload):receipts[0].payload).eventItems||{}:input.bossId==='thanh-long'?{nhan_long:1}:input.bossId==='huyen-quy'?{huyen_giap:1}:input.bossId==='bach-ho'?{han_nha:1}:input.bossId==='hoa-phuong'?{hoa_phung:1}:{},
    ...(input.bossId==='dia-long'?{items:itemRows.map(item=>({id:item.id,quantity:Number(item.quantity),location:item.location,slot:item.slot})),chestId:'dragon_chest'}:{}),
    reward:{gold:config.gold,exp:config.exp,stones:config.stones},replayed:!!receipts.length};
  }catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}
 }
};}
module.exports={createBossRewardService,BOSS_CONFIG};
