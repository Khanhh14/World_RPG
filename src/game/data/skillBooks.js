import { COMBAT_SKILLS } from './combatSkills.js';
export const BOOK_SKILLS = [
  {
    "id": "holy_spear",
    "name": "Thánh Quang",
    "school": "god",
    "effect": "bolt",
    "icon": "bolt",
    "mana": 14,
    "cooldown": 6000,
    "multiplier": 1.8,
    "range": 400,
    "color": 16770466,
    "description": "Phóng ánh sáng theo hướng nhìn, gây 180% công. Tầm 400px.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "holy_aegis",
    "name": "Thần Hộ",
    "school": "god",
    "effect": "guard",
    "icon": "guard",
    "mana": 16,
    "cooldown": 14000,
    "duration": 6000,
    "reduction": 0.6,
    "color": 16770466,
    "description": "Giảm 60% sát thương nhận vào trong 6 giây. Không cộng dồn lớp hộ thể.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "holy_grace",
    "name": "Thiên Ân",
    "school": "god",
    "effect": "heal",
    "icon": "heal",
    "mana": 20,
    "cooldown": 12000,
    "heal": 60,
    "color": 16770466,
    "description": "Hồi 60 HP, không vượt HP tối đa. Không tiêu mana khi máu đầy.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "human_slash",
    "name": "Phá Sơn",
    "school": "human",
    "effect": "power",
    "icon": "power",
    "mana": 10,
    "cooldown": 4000,
    "multiplier": 2.2,
    "range": 140,
    "color": 9362431,
    "weapon": true,
    "description": "Chém một quái phía trước, gây 220% công. Tầm 140px. Cần vũ khí.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "human_whirl",
    "name": "Bão Kiếm",
    "school": "human",
    "effect": "whirl",
    "icon": "whirl",
    "mana": 16,
    "cooldown": 8000,
    "multiplier": 1.6,
    "range": 150,
    "color": 9362431,
    "weapon": true,
    "description": "Gây 160% công lên các quái trong bán kính 150px. Cần vũ khí.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "human_arrow",
    "name": "Xuyên Tâm",
    "school": "human",
    "effect": "bolt",
    "icon": "bolt",
    "mana": 18,
    "cooldown": 9000,
    "multiplier": 2.4,
    "range": 480,
    "color": 9362431,
    "weapon": true,
    "description": "Bắn luồng khí theo hướng nhìn, gây 240% công lên quái đầu tiên trúng. Tầm 480px. Cần vũ khí.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "demon_flame",
    "name": "Hắc Viêm",
    "school": "demon",
    "effect": "bolt",
    "icon": "bolt",
    "mana": 20,
    "cooldown": 8000,
    "multiplier": 2.6,
    "range": 380,
    "color": 14060799,
    "description": "Phóng hắc hỏa theo hướng nhìn, gây 260% công. Tầm 380px.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "demon_abyss",
    "name": "Vực Thẳm",
    "school": "demon",
    "effect": "whirl",
    "icon": "whirl",
    "mana": 22,
    "cooldown": 10000,
    "multiplier": 2.1,
    "range": 175,
    "color": 14060799,
    "description": "Nổ năng lượng hắc ám quanh người, gây 210% công trong bán kính 175px.",
    "goldPrice": 2000,
    "gemPrice": 10
  },
  {
    "id": "demon_drain",
    "name": "Huyết Tế",
    "school": "demon",
    "effect": "drain",
    "icon": "heal",
    "mana": 20,
    "cooldown": 12000,
    "multiplier": 1.2,
    "range": 125,
    "lifesteal": 0.3,
    "color": 15764396,
    "description": "Gây 120% công quanh người trong 125px; hồi HP bằng 30% sát thương thực gây ra, không vượt HP tối đa.",
    "goldPrice": 2000,
    "gemPrice": 10
  }
];
export const SCHOOLS = [{id:'god',name:'Thần',color:'#f3d38a'}, {id:'human',name:'Nhân',color:'#8edbff'}, {id:'demon',name:'Ma',color:'#d4a1ff'}];
export const ALL_SKILLS = [...COMBAT_SKILLS, ...BOOK_SKILLS];
export const STARTER_SKILLS = COMBAT_SKILLS.map(s => s.id);
export const findSkill = id => ALL_SKILLS.find(s => s.id === id);
export function skillSlots(state) {
 return state?.data?.skills?.slots ?? STARTER_SKILLS;
}
