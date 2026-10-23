const training=require('../config/skillTraining.json');
const fail=(status,message)=>Object.assign(new Error(message),{status});
async function createSkillTrainingSchema(db){
 await db.execute(`CREATE TABLE IF NOT EXISTS character_skill_progress (
 character_id BIGINT UNSIGNED NOT NULL, skill_id VARCHAR(64) NOT NULL,
 skill_level INT UNSIGNED NOT NULL DEFAULT 1, unlocked_cap INT UNSIGNED NOT NULL DEFAULT 10,
 PRIMARY KEY (character_id, skill_id)) ENGINE=InnoDB`);
 await db.execute(`CREATE TABLE IF NOT EXISTS character_skill_materials (
 character_id BIGINT UNSIGNED NOT NULL, item_id VARCHAR(64) NOT NULL,
 quantity INT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (character_id, item_id)) ENGINE=InnoDB`);
}
async function trainingSnapshot(c,char,owned){
 const [progress]=await c.execute('SELECT skill_id, skill_level, unlocked_cap FROM character_skill_progress WHERE character_id = ?',[char.id]);
 const [materials]=await c.execute('SELECT item_id, quantity FROM character_skill_materials WHERE character_id = ?',[char.id]);
 return {levels:Object.fromEntries(owned.map(id=>{const p=progress.find(p=>p.skill_id===id);return [id,{level:Number(p?.skill_level??1),cap:Number(p?.unlocked_cap??10)}];})),materials:Object.fromEntries(training.materials.map(m=>[m.id,Number(materials.find(r=>r.item_id===m.id)?.quantity??0)]))};
}
function trainingPayload(action,input,activeSkillIds){
 if(action==='buy-material'){
  if(!training.materials.some(m=>m.id===input.itemId)||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>99)throw fail(400,'Vật phẩm hoặc số lượng không hợp lệ.');
  return {itemId:input.itemId,quantity:input.quantity};
 }
 if(!activeSkillIds.has(input.skillId)||!Number.isInteger(input.expectedLevel)||input.expectedLevel<1||input.expectedLevel>=training.maxLevel||!Number.isInteger(input.expectedCap)||input.expectedCap<10||input.expectedCap>training.maxLevel||input.expectedCap%10!==0)throw fail(400,'Kỹ năng hoặc cấp nâng không hợp lệ.');
 return {skillId:input.skillId,expectedLevel:input.expectedLevel,expectedCap:input.expectedCap};
}
async function spend(c,char,id,amount){
 const [used]=await c.execute('UPDATE character_skill_materials SET quantity = quantity - ? WHERE character_id = ? AND item_id = ? AND quantity >= ?',[amount,char.id,id,amount]);
 if(!used.affectedRows)throw fail(409,id==='skill_powder'?'Cần đủ 3 bột nâng cấp kỹ năng.':`Cần đủ ${amount} sách phép để đột phá.`);
}
async function mutateTraining(c,char,action,input,owned){
 if(action==='buy-material'){
  const m=training.materials.find(m=>m.id===input.itemId),p=input.position,n=training.merchant;
  if(!p||p.mapId!==n.mapId||!Number.isFinite(p.x)||!Number.isFinite(p.feetY)||Math.hypot(p.x-n.x,p.feetY-n.feetY)>n.range)throw fail(409,'Hãy đến gặp Thành chủ Yuna để mua nguyên liệu.');
  const gold=m.goldPrice*input.quantity,gems=m.gemPrice*input.quantity;
  if(Number(char.gold)<gold||Number(char.gems)<gems)throw fail(409,'Không đủ cả vàng và đá quý để mua nguyên liệu.');
  await c.execute('INSERT IGNORE INTO character_skill_materials (character_id, item_id, quantity) VALUES (?, ?, 0)',[char.id,m.id]);
  const [added]=await c.execute('UPDATE character_skill_materials SET quantity = quantity + ? WHERE character_id = ? AND item_id = ? AND quantity + ? <= 9999',[input.quantity,char.id,m.id,input.quantity]);
  if(!added.affectedRows)throw fail(409,'Mỗi nguyên liệu kỹ năng chứa tối đa 9.999.');
  await c.execute('UPDATE characters SET gold = gold - ?, gems = gems - ? WHERE id = ?',[gold,gems,char.id]);
  char.gold=Number(char.gold)-gold;char.gems=Number(char.gems)-gems;return;
 }
 if(!owned.some(b=>b.skill_id===input.skillId))throw fail(403,'Bạn chưa học kỹ năng này.');
 await c.execute('INSERT IGNORE INTO character_skill_progress (character_id, skill_id, skill_level, unlocked_cap) VALUES (?, ?, 1, 10)',[char.id,input.skillId]);
 const [rows]=await c.execute('SELECT skill_level, unlocked_cap FROM character_skill_progress WHERE character_id = ? AND skill_id = ? FOR UPDATE',[char.id,input.skillId]);
 const level=Number(rows[0].skill_level),cap=Number(rows[0].unlocked_cap);
 if(level!==input.expectedLevel||cap!==input.expectedCap)throw fail(409,'Cấp kỹ năng đã thay đổi. Hãy kiểm tra lại.');
 if(action==='upgrade'){
  if(level>=cap)throw fail(409,'Kỹ năng đã chạm mốc. Cần sách phép đột phá trước.');
  await spend(c,char,'skill_powder',training.powderPerUpgrade);
  await c.execute('UPDATE character_skill_progress SET skill_level = skill_level + 1 WHERE character_id = ? AND skill_id = ?',[char.id,input.skillId]);
 }else{
  if(level!==cap||cap>=training.maxLevel)throw fail(409,'Chỉ đột phá khi kỹ năng đạt mốc 10, 20, 30…');
  await spend(c,char,'breakthrough_book',cap/10);
  await c.execute('UPDATE character_skill_progress SET unlocked_cap = unlocked_cap + 10 WHERE character_id = ? AND skill_id = ?',[char.id,input.skillId]);
 }
}
module.exports={createSkillTrainingSchema,trainingSnapshot,trainingPayload,mutateTraining};
