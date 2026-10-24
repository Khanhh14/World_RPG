const fail=(status,message)=>Object.assign(new Error(message),{status});
// Kích thước thật của các map; chỉ nhận tọa độ hữu hạn trong bản đồ đã biết.
const maps={'village':[2112,1536],'west-forest':[2688,2112],'atlast-lake':[2304,1728],'yuna-outskirts':[2496,1632],'yuna-city':[2592,2016],'naga-cave':[1728,1536],'noxii-entrance':[2304,1728],'noxii-cave':[1728,1536],'dia-long-forest':[2304,1920],'autumn-forest':[2112,1728],'guardian-cave':[1728,1536],'huyen-quy-cave':[1728,1536],'han-nha-mon':[1728,1536],'hiuuling-river':[2304,1728]};
function view(r){return {characterId:String(r.character_id),hp:Number(r.hp),mp:Number(r.mana),mapId:r.map_id,x:Number(r.position_x),y:Number(r.position_y),version:Number(r.version)};}
function validate(p){
 const bounds=maps[p?.mapId];
 if(!bounds||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>bounds[0]||p.y>bounds[1])throw fail(400,'Vị trí lưu không hợp lệ.');
 for(const k of ['hp','mp'])if(!Number.isSafeInteger(p[k])||p[k]<0||p[k]>100000000)throw fail(400,'HP/MP không hợp lệ.');
 if(!Number.isSafeInteger(p.version)||p.version<0||!/^[a-f0-9-]{36}$/i.test(p.requestId||''))throw fail(400,'Phiên bản lưu không hợp lệ.');
}
function createRuntimeService(db){
 async function run(userId,fn){const c=await db.getConnection();try{await c.beginTransaction();
  const [chars]=await c.execute('SELECT id, hp, mana FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',[userId]);const char=chars[0];if(!char)throw fail(409,'Chưa có nhân vật.');
  await c.execute("INSERT IGNORE INTO character_runtime (character_id,hp,mana,map_id,position_x,position_y) VALUES (?,?,?,'village',960,768)",[char.id,Math.max(0,Number(char.hp)),Math.max(0,Number(char.mana))]);
  const [rows]=await c.execute('SELECT * FROM character_runtime WHERE character_id = ? FOR UPDATE',[char.id]);
  const result=await fn(c,char,rows[0]);await c.commit();return result;
 }catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}}
 return {
  load(userId){return run(userId,async(c,char,row)=>({runtime:view(row)}));},
  save(userId,p){validate(p);return run(userId,async(c,char,row)=>{
   if(String(p.characterId)!==String(char.id))throw fail(403,'Nhân vật không thuộc tài khoản.');
   if(row.request_id===p.requestId)return {runtime:view(row),saved:true};
   if(Number(row.version)!==p.version)return {runtime:view(row),saved:false,conflict:true};
   await c.execute('UPDATE character_runtime SET hp=?,mana=?,map_id=?,position_x=?,position_y=?,version=version+1,request_id=? WHERE character_id=?',[p.hp,p.mp,p.mapId,p.x,p.y,p.requestId,char.id]);
   await c.execute('UPDATE characters SET hp=?,mana=?,progress_version=progress_version+1 WHERE id=?',[p.hp,p.mp,char.id]);
   return {saved:true,runtime:{characterId:String(char.id),hp:p.hp,mp:p.mp,mapId:p.mapId,x:p.x,y:p.y,version:Number(row.version)+1}};
  });}
 };
}
module.exports={createRuntimeService,validate};
