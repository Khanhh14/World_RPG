const special={...require('../config/offhands.json'),...require('../config/tuLinhEquipment.json'),...require('../config/huntEvent.json').offhand};
const wings=require('../config/wings.json');
const slots=['weapon','shield','armor','helmet','boots','gloves'];
const fail=message=>Object.assign(new Error(message),{status:400});
function validateVitalContext(context){
 if(context==null)return null;
 if(typeof context!=='object'||Array.isArray(context))throw fail('Trạng thái dùng bình không hợp lệ.');
 for(const key of ['hp','mp'])if(!Number.isSafeInteger(context[key])||context[key]<0||context[key]>100000000)throw fail('HP/MP dùng bình không hợp lệ.');
 const enhancements=context.enhancements||{};
 for(const [slot,n] of Object.entries(enhancements))if(!slots.includes(slot)||!Number.isSafeInteger(n)||n<0||n>2147483647)throw fail('Cấp cường hóa không hợp lệ.');
 return {hp:context.hp,mp:context.mp,enhancements};
}
function itemVitals(id){
 if(special[id])return {slot:special[id].type,hp:special[id].maxHP||0,mp:special[id].maxMP||0};
 const m=/^(armor|helmet)(?:_([2-5]))?$/.exec(id);
 if(!m)return {slot:null,hp:0,mp:0};
 const i=Number(m[2]||1)-1;return {slot:m[1],hp:(m[1]==='armor'?[10,20,35,55,80]:[5,10,15,25,35])[i],mp:0};
}
function calculateMaxVitals(level,gear,ownedWings=[],enhancements={},enchantments={}){
 let maxHp=100+(Number(level)-1)*10,maxMana=50+(Number(level)-1)*5;
 for(const row of gear){
  const item=itemVitals(row.item_definition_id),n=enhancements[item.slot]||0;
  maxHp+=item.hp+Math.ceil(item.hp*.1)*n;maxMana+=item.mp+Math.ceil(item.mp*.1)*n;
 }
 for(const row of ownedWings){
  const style=wings.styles.find(s=>s.id===row.wing_id);if(!style)continue;
  const n=Math.max(0,Math.min(wings.maxLevel,Number(row.upgrade_level)||0));
  maxHp+=(style.base.maxHP||0)+(wings.perLevel.maxHP||0)*n;
  maxMana+=(style.base.maxMP||0)+(wings.perLevel.maxMP||0)*n;
 }
 for(const b of Object.values(enchantments))maxHp+=Number(b.maxHP)||0;
 return {maxHp,maxMana};
}
module.exports={validateVitalContext,calculateMaxVitals};
