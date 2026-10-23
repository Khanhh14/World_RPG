const catalog=require('../config/resale.json');
const {characterView}=require('./progress.service');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const parse=value=>typeof value==='string'?JSON.parse(value):value;
const snapshot=async(c,id)=>{
 const [rows]=await c.execute('SELECT item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ? AND quantity > 0 ORDER BY id',[id]);
 return rows.map(r=>({id:r.item_definition_id,quantity:Number(r.quantity),location:r.location,slot:r.slot_key}));
};
// Legacy monster materials live in the character's browser save. Limit their
// sale credits by confirmed earning events, not a client-provided gold price.
async function checkLocalAllowance(c,char,item,itemId,quantity){
 const [events]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ?',[char.id]);
 let kills=0,harvests=0,bosses=0,dailyStones=0,sold=0;
 for(const event of events){const p=parse(event.payload);
  if(event.action_type==='monster_kill'&&(!(item.mapId||item.earnedMapId)||p.mapId===(item.mapId||item.earnedMapId)))kills++;
  if(event.action_type==='mushroom_harvest')harvests++;
  if(event.action_type==='boss_reward')bosses+=Number(p.stones||1);
  if(event.action_type==='daily_checkin')dailyStones+=Number(p.reward?.items?.upgrade_stone||0);
  if(itemId==='wing_essence'&&event.action_type==='wing_enchant')sold++;
  if(event.action_type==='shop_sell'&&p.source==='local'&&(item.mapId?catalog[p.itemId]?.mapId===item.mapId:p.itemId===itemId))sold+=p.quantity;
 }
 const allowance=itemId==='upgrade_stone'?Math.floor(kills/10)+Math.floor(harvests/20)+bosses+dailyStones:Math.floor(kills/(item.exchangeCost||1));
 if(sold+quantity>allowance)throw fail(409,'Nguyên liệu chưa có đủ lịch sử nhận thưởng trên máy chủ. Hãy đồng bộ thưởng hạ quái rồi thử lại.');
}
function createResaleService(db){return {async sell(userId,input={}){
 const {requestId,itemId,quantity,position,source}=input,item=Object.hasOwn(catalog,itemId??'')?catalog[itemId]:null;
 if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(requestId)||!item||!Number.isInteger(quantity)||quantity<1||quantity>99||!['inventory','local'].includes(source)||source==='local'&&!item.local)throw fail(400,'Vật phẩm hoặc số lượng bán không hợp lệ.');
 const c=await db.getConnection();
 try{
  await c.beginTransaction();const [chars]=await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);const char=chars[0];if(!char)throw fail(409,'Hãy tạo nhân vật trước.');
  const [receipts]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',[char.id,requestId]);
  if(receipts.length){const p=parse(receipts[0].payload);if(receipts[0].action_type!=='shop_sell'||p.itemId!==itemId||p.quantity!==quantity||p.source!==source)throw fail(409,'Mã giao dịch đã dùng cho thao tác khác.');const result={character:characterView(char),items:await snapshot(c,char.id),sold:p,replayed:true};await c.commit();return result;}
  if(!position||position.mapId!=='village'||!Number.isFinite(position.x)||!Number.isFinite(position.feetY)||Math.hypot(position.x-1416,position.feetY-576)>110)throw fail(409,'Hãy đến gặp Thương nhân ở Làng Khởi Đầu để bán đồ.');
  const total=item.unitPrice*quantity;if(!Number.isSafeInteger(total)||total<1)throw fail(400,'Vật phẩm này không bán được.');if(Number(char.gold)+total>9999999)throw fail(409,'Ví vàng đã đầy. Hãy dùng bớt trước khi bán.');
  if(source==='local')await checkLocalAllowance(c,char,item,itemId,quantity);
  else{
   const [rows]=await c.execute("SELECT id, quantity FROM character_items WHERE character_id = ? AND item_definition_id = ? AND location = 'inventory' AND quantity > 0 ORDER BY id FOR UPDATE",[char.id,itemId]);
   if(rows.reduce((n,r)=>n+Number(r.quantity),0)<quantity)throw fail(409,'Không đủ vật phẩm trong túi. Đồ đang mặc cần tháo ra trước khi bán.');
   let left=quantity;for(const row of rows){const used=Math.min(left,Number(row.quantity));if(used===Number(row.quantity))await c.execute('DELETE FROM character_items WHERE id = ? AND character_id = ?',[row.id,char.id]);else await c.execute('UPDATE character_items SET quantity = quantity - ? WHERE id = ? AND character_id = ?',[used,row.id,char.id]);left-=used;if(!left)break;}
  }
  await c.execute('UPDATE characters SET gold = gold + ?, progress_version = progress_version + 1 WHERE id = ?',[total,char.id]);char.gold=Number(char.gold)+total;char.progress_version=Number(char.progress_version||0)+1;
  const sold={itemId,quantity,source,unitPrice:item.unitPrice,total};await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',[char.id,requestId,'shop_sell',JSON.stringify(sold)]);
  const result={character:characterView(char),items:await snapshot(c,char.id),sold,replayed:false};await c.commit();return result;
 }catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}
}};}
module.exports={createResaleService};
