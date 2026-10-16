// Kỹ năng dùng chung để thử chiến đấu; chưa phải cây kỹ năng riêng từng class.
export const COMBAT_SKILLS = [
  { id:'power', name:'Trọng kích', key:'1', mana:6, cooldown:3000, icon:'power', weapon:true, description:'Đánh phía trước, gây 160% công. Tầm 112px.' },
  { id:'bolt', name:'Xung kích', key:'2', mana:10, cooldown:5000, icon:'bolt', weapon:true, projectiles:3, multiplier:.5, description:'Phóng 3 cầu năng lượng tự tìm quái gần trong 320px, mỗi cầu gây 50% công.' },
  { id:'whirl', name:'Lốc xoáy', key:'3', mana:12, cooldown:7000, icon:'whirl', weapon:true, description:'Đánh mọi quái trong bán kính 125px, gây 100% công.' },
  { id:'guard', name:'Hộ thể', key:'4', mana:8, cooldown:12000, icon:'guard', description:'Giảm 50% sát thương phản đòn của quái trong 5 giây.' },
  { id:'heal', name:'Hồi phục', key:'5', mana:15, cooldown:10000, icon:'heal', description:'Hồi 30 HP, không vượt máu tối đa.' }
];
