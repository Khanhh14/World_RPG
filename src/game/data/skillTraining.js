export const SKILL_TRAINING = {
  "merchant": {
    "mapId": "yuna-city",
    "x": 1224,
    "feetY": 528,
    "range": 110
  },
  "powderPerUpgrade": 3,
  "maxLevel": 1000,
  "materials": [
    {
      "id": "skill_powder",
      "name": "Bột nâng cấp kỹ năng",
      "emoji": "✨",
      "goldPrice": 500,
      "gemPrice": 5
    },
    {
      "id": "breakthrough_book",
      "name": "Sách phép đột phá",
      "emoji": "📕",
      "goldPrice": 2000,
      "gemPrice": 20
    }
  ]
};
const n=value=>Number(value.toFixed(2)).toLocaleString('vi-VN');
export function skillProgress(state,id){
 const p=state?.data?.skills?.levels?.[id];
 return {level:Math.max(1,Math.min(SKILL_TRAINING.maxLevel,Math.floor(Number(p?.level)||1))),cap:Math.max(10,Math.min(SKILL_TRAINING.maxLevel,Math.floor(Number(p?.cap)||10)))};
}
export function scaledSkill(base,state){
 if(!base)return base;
 const {level,cap}=skillProgress(state,base.id),factor=1+(level-1)*.05,s={...base,level,cap};
 for(const key of ['multiplier','burnMultiplier','shieldMultiplier','counterMultiplier'])if(Number.isFinite(base[key]))s[key]=Number((base[key]*factor).toFixed(4));
 for(const key of ['heal','restore'])if(Number.isFinite(base[key]))s[key]=Math.round(base[key]*factor);
 for(const key of ['reduction'])if(Number.isFinite(base[key]))s[key]=Math.min(.85,Number((base[key]*factor).toFixed(4)));
 for(const key of ['vulnerability','attackMultiplier'])if(Number.isFinite(base[key]))s[key]=Number((1+(base[key]-1)*factor).toFixed(4));
 if(base.stunDuration)s.stunDuration=Math.round(Math.min(base.stunDuration*2,base.stunDuration*(1+(level-1)*.02)));
 if(['guard','counter','evade','warcry'].includes(base.effect)&&base.duration)s.duration=Math.round(Math.min(base.duration*2,base.cooldown*.8,base.duration*(1+(level-1)*.02)));
 s.description=skillEffectText(s);return s;
}
export function skillEffectText(s){
 const pct=v=>n(v*100)+'%',seconds=v=>n(v/1000)+' giây',damage=`Gây ${pct(s.multiplier??1)} công`;
 switch(s.effect||s.id){
 case 'beam':return `${damage} theo tia xuyên thẳng, tầm ${s.range}px.`;
 case 'combo':return `${s.hits} nhát chém, mỗi nhát gây ${pct(s.multiplier)} công. Cần vũ khí.`;
 case 'ricochet':return `${damage}, nảy qua tối đa ${s.ricochets+1} mục tiêu. Cần vũ khí.`;
 case 'burn':return `${damage} ban đầu; thiêu đốt ${pct(s.burnMultiplier)} công/giây trong ${seconds(s.burnDuration)}.`;
 case 'nova':return `${damage} lên các quái trong bán kính ${s.range}px quanh người.`;
 case 'drain':return `${damage}, hồi HP bằng ${pct(s.lifesteal)} sát thương thực gây ra.`;
 case 'guard':return `Giảm ${pct(s.reduction)} sát thương nhận vào trong ${seconds(s.duration)}.`;
 case 'counter':return `Giảm ${pct(s.reduction)} sát thương; phản đòn ${pct(s.counterMultiplier)} công trong ${seconds(s.duration)}.`;
 case 'healingField':return `Thánh địa bán kính ${s.radius}px tồn tại ${seconds(s.duration)}. Đứng trong vùng hồi ${s.heal} HP mỗi ${seconds(s.interval)}.`;
 case 'shadowbind':return `${damage} và trói mục tiêu trong ${seconds(s.stunDuration)}.`;
 case 'darkrain':return `Mưa hắc khí đánh tối đa ${s.count} mục tiêu, mỗi mục tiêu chịu ${pct(s.multiplier)} công.`;
 case 'evade':return `Né hoàn toàn đòn đánh của quái trong ${seconds(s.duration)}.`;
 case 'chainlightning':return `${damage}, chuyền tối đa ${s.count} mục tiêu, mỗi lần nảy giảm 18% sát thương.`;
 case 'barrier':return `Lá chắn hấp thụ bằng ${pct(s.shieldMultiplier)} công, tồn tại tối đa ${seconds(s.duration)}.`;
 case 'manaregen':return `Hồi ${s.restore} mana mỗi giây trong ${seconds(s.duration)}.`;
 case 'armorbreak':return `${damage}, làm mục tiêu nhận thêm ${pct(s.vulnerability-1)} sát thương trong ${seconds(s.duration)}.`;
 case 'fanshot':return `Bắn quạt ${s.count} luồng năng lượng, mỗi luồng gây ${pct(s.multiplier)} công.`;
 case 'warcry':return `Tăng sát thương thêm ${pct(s.attackMultiplier-1)} trong ${seconds(s.duration)}.`;
 case 'heal':return `Hồi ${s.heal} HP, không vượt HP tối đa.`;
 default:return s.description;
 }
}
