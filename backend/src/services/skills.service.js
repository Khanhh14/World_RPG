const {trainingSnapshot,trainingPayload,mutateTraining}=require('./skillTraining.service');
const catalog=require('../config/skillBooks.json');
const {characterView}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const legacyStarter=['power','bolt','whirl','guard','heal'];
function createSkillsService(db){
 const skillCatalog=[...catalog.books,...(catalog.mageBooks||[]),...(catalog.eventBooks||[])];
 const activeSkillIds=new Set(skillCatalog.map(book=>book.id));
 async function transaction(userId,operation){
  const c=await db.getConnection();
  try{
   await c.beginTransaction();
   const [rows]=await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);
   if(!rows[0])throw fail(409,'Hãy tạo nhân vật trước.');
   for(let slot=0;slot<5;slot++)await c.execute('INSERT IGNORE INTO character_skill_slots (character_id, slot_index, skill_id) VALUES (?, ?, NULL)',[rows[0].id,slot]);
   const marks=legacyStarter.map(()=>'?').join(',');
   await c.execute(`UPDATE character_skill_slots s LEFT JOIN character_skill_books b ON b.character_id = s.character_id AND b.skill_id = s.skill_id SET s.skill_id = NULL WHERE s.character_id = ? AND s.skill_id IN (${marks}) AND b.skill_id IS NULL`,[rows[0].id,...legacyStarter]);
   const result=await operation(c,rows[0]);await c.commit();return result;
  }catch(error){await c.rollback().catch(()=>{});throw error;}finally{c.release();}
 }
 async function snapshot(c,char){
  const [books]=await c.execute('SELECT skill_id FROM character_skill_books WHERE character_id = ?',[char.id]);
  const [assigned]=await c.execute('SELECT slot_index, skill_id FROM character_skill_slots WHERE character_id = ? ORDER BY slot_index',[char.id]);
  const owned=books.map(b=>b.skill_id).filter(id=>activeSkillIds.has(id));
  return {character:characterView(char),skills:{owned,...await trainingSnapshot(c,char,owned),slots:Array.from({length:5},(_,i)=>{const id=assigned.find(s=>Number(s.slot_index)===i)?.skill_id;return owned.includes(id)?id:null;}),revision:Number(char.progress_version)}};
 }
 return {
  load:userId=>transaction(userId,snapshot),
  async mutate(userId,action,input={}){
   if(!['buy','assign','buy-material','upgrade','breakthrough'].includes(action))throw fail(404,'Thao tác không tồn tại.');
   if(typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.requestId))throw fail(400,'Mã giao dịch không hợp lệ.');
   const book=skillCatalog.find(b=>b.id===input.skillId);
   if(action==='buy'&&!book)throw fail(400,'Sách kỹ năng không tồn tại.');
   if(action==='assign'&&(!Number.isInteger(input.slot)||input.slot<0||input.slot>4||(!book&&input.skillId!==null)))throw fail(400,'Kỹ năng hoặc ô gán không hợp lệ.');
   const training=['buy-material','upgrade','breakthrough'].includes(action);
   const payload=training?trainingPayload(action,input,activeSkillIds):action==='buy'?{skillId:input.skillId}:{skillId:input.skillId,slot:input.slot};
   return transaction(userId,async(c,char)=>{
    const [receipts]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,input.requestId]);
    if(receipts.length){
     const old=typeof receipts[0].payload==='string'?JSON.parse(receipts[0].payload):receipts[0].payload;
     if(receipts[0].action_type!=='skill_'+action||Object.keys(old).length!==Object.keys(payload).length||Object.keys(payload).some(k=>old[k]!==payload[k]))throw fail(409,'Mã giao dịch đã dùng cho thao tác khác.');
     return {...await snapshot(c,char),replayed:true};
    }
    const [owned]=await c.execute('SELECT skill_id FROM character_skill_books WHERE character_id = ?',[char.id]);
    if(training){await mutateTraining(c,char,action,input,owned);}
    else if(action==='buy'){
     if(owned.some(s=>s.skill_id===book.id))throw fail(409,'Bạn đã học kỹ năng này, không cần mua lại.');
     const pos=input.position,merchant=(catalog.merchants||[catalog.merchant]).find(m=>m.id===input.merchantId);
     const merchantBooks=merchant?catalog[merchant.catalog]||[]:[];
     if(!book||!merchant||!merchantBooks.some(item=>item.id===book.id)
       ||!pos||!Number.isFinite(pos.x)||!Number.isFinite(pos.feetY)
       ||pos.mapId!==merchant.mapId||Math.hypot(pos.x-merchant.x,pos.feetY-merchant.feetY)>merchant.range) {
      throw fail(409,'Hãy đến đúng người bán để mua kỹ năng này.');
     }
     if(Number(char.gold)<book.goldPrice||Number(char.gems)<book.gemPrice)throw fail(409,'Cần đủ cả 2.000 vàng và 10 đá quý để mua sách.');
     await c.execute('UPDATE characters SET gold = gold - ?, gems = gems - ? WHERE id = ?',[book.goldPrice,book.gemPrice,char.id]);
     await c.execute('INSERT INTO character_skill_books (character_id, skill_id) VALUES (?, ?)',[char.id,book.id]);
     char.gold=Number(char.gold)-book.goldPrice;char.gems=Number(char.gems)-book.gemPrice;
    }else{
     if(input.skillId!==null&&!owned.some(s=>s.skill_id===input.skillId))throw fail(403,'Bạn chưa mua kỹ năng này.');
     // Di chuyển kỹ năng sang ô mới, không cho gán trùng nhiều ô.
     if(input.skillId!==null)await c.execute('UPDATE character_skill_slots SET skill_id = NULL WHERE character_id = ? AND skill_id = ?',[char.id,input.skillId]);
     await c.execute('UPDATE character_skill_slots SET skill_id = ? WHERE character_id = ? AND slot_index = ?',[input.skillId,char.id,input.slot]);
    }
    await c.execute('UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?',[char.id]);char.progress_version=Number(char.progress_version)+1;
    await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',[char.id,input.requestId,'skill_'+action,JSON.stringify(payload)]);
    return {...await snapshot(c,char),replayed:false};
   });
  }
 };
}
module.exports={createSkillsService};
