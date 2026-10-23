const {randomInt}=require('node:crypto');
const parse=p=>typeof p==='string'?JSON.parse(p):p;
async function enchantBonuses(c,id){
 const [rows]=await c.execute("SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND action_type = 'wing_enchant'",[id]);
 const result={};for(const row of rows){const p=parse(row.payload);if(!['maxHP','defense','attack'].includes(p.stat)||!Number.isSafeInteger(p.amount))continue;const b=result[p.wingId]??={maxHP:0,defense:0,attack:0,count:0};b[p.stat]+=p.amount;b.count++;}return result;
}
async function rollEnchant(c,char,wingId,roll=randomInt){
 const [rows]=await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ?',[char.id]);
 let kills=0,spent=0;
 for(const row of rows){const p=parse(row.payload);if(row.action_type==='monster_kill'&&p.mapId==='dia-long-forest')kills++;if(row.action_type==='wing_enchant')spent++;if(row.action_type==='shop_sell'&&p.source==='local'&&p.itemId==='wing_essence')spent+=p.quantity;}
 if(Math.floor(kills/20)<=spent)throw Object.assign(new Error('Chưa đủ tinh chất có lịch sử hạ quái Địa Long. Hãy đồng bộ thưởng rồi thử lại.'),{status:409});
 const [stat,amount]=[['maxHP',10],['defense',1],['attack',2]][roll(3)];return {wingId,stat,amount};
}
module.exports={enchantBonuses,rollEnchant};
