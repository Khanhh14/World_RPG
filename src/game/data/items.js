export const EQUIPMENT_SLOTS = [
    ['weapon','Vũ khí',103], ['shield','Khiên',102], ['armor','Áo giáp',null],
    ['helmet','Mũ',null], ['boots','Giày',null], ['gloves','Găng tay',null]
];
export const BAG_CAPACITY = 24;
export const POTION_TIERS = [
    { level:1, hp:50, mp:25, hpPrice:8, mpPrice:6 },
    { level:2, hp:100, mp:50, hpPrice:18, mpPrice:14 },
    { level:3, hp:200, mp:100, hpPrice:40, mpPrice:32 },
    { level:4, hp:350, mp:175, hpPrice:75, mpPrice:60 },
    { level:5, hp:500, mp:250, hpPrice:120, mpPrice:95 }
];
export const ITEMS = {};
export const MONSTER_MATERIALS = [
    { id:'boar_hide', name:'Da heo rừng', emoji:'🐗', description:'Da thu được khi hạ heo rừng ở Khu Rừng Phía Tây.' },
    { id:'wolf_fang', name:'Nanh sói', emoji:'🦷', description:'Nanh thu được khi hạ sói xám ở Khu Rừng Phía Tây.' },
    { id:'forest_gel', name:'Gel rừng', emoji:'🟢', description:'Gel thu được khi hạ slime rừng ở Khu Rừng Phía Tây.' },
    { id:'scorpion_tail', name:'Đuôi bọ cạp', emoji:'🦂', description:'Đuôi thu được khi hạ bọ cạp ở Khu Rừng Phía Tây.' }
];
for (const material of MONSTER_MATERIALS) {
    ITEMS[material.id] = {
        name:material.name, type:'material', category:'monster-drop', level:1,
        maxStack:99, emoji:material.emoji, description:material.description
    };
}
ITEMS.upgrade_stone = {
    name:'Đá nâng cấp trang bị', type:'material', category:'upgrade',
    level:1, maxStack:99, emoji:'💎',
    description:'Nguyên liệu dùng để nâng cấp trang bị.'
};
for (const tier of POTION_TIERS) {
    const suffix = tier.level === 1 ? '' : `_${tier.level}`;
    ITEMS[`health_potion${suffix}`] = {
        name:`Bình máu cấp ${tier.level}`, frame:114, type:'consumable', category:'hp', level:tier.level,
        heal:tier.hp, price:tier.hpPrice, maxStack:99,
        description:`Hồi ${tier.hp} HP, không vượt HP tối đa. Chỉ dùng khi chưa đầy máu.`
    };
    ITEMS[`mana_potion${suffix}`] = {
        name:`Bình mana cấp ${tier.level}`, frame:116, type:'consumable', category:'mp', level:tier.level,
        mana:tier.mp, price:tier.mpPrice, maxStack:99,
        description:`Hồi ${tier.mp} MP, không vượt MP tối đa. Chỉ dùng khi chưa đầy mana.`
    };
}
const gear = [
    { type:'weapon', base:'iron_sword', name:'Kiếm', frames:[103,104,105,106,107], prices:[35,100,260,600,1300], attack:[5,10,18,30,48] },
    { type:'shield', base:'round_shield', name:'Khiên', frames:[102,101,102,101,102], prices:[25,75,190,440,950], defense:[3,6,10,16,25] },
    { type:'armor', base:'armor', name:'Áo giáp', icon:'armor', prices:[40,120,300,700,1500], defense:[5,9,15,24,36], maxHP:[10,20,35,55,80] },
    { type:'helmet', base:'helmet', name:'Mũ giáp', icon:'helmet', prices:[20,60,150,350,750], defense:[2,4,7,11,17], maxHP:[5,10,15,25,35] },
    { type:'boots', base:'boots', name:'Giày', icon:'boots', prices:[18,50,130,300,650], defense:[1,3,5,8,12] },
    { type:'gloves', base:'gloves', name:'Găng tay', icon:'gloves', prices:[18,50,130,300,650], attack:[1,2,4,7,11], defense:[1,2,3,4,5] }
];
for (const spec of gear) for (let i=0;i<5;i++) {
    const id=i===0 ? spec.base : `${spec.base}_${i+1}`;
    const item={name:`${spec.name} cấp ${i+1}`,type:spec.type,category:spec.type==='weapon'?'weapon':'gear',level:i+1,price:spec.prices[i],maxStack:1};
    if(spec.frames)item.frame=spec.frames[i];else item.icon=spec.icon;
    const bonuses=[];
    for(const [key,label] of [['attack','công'],['defense','thủ'],['maxHP','HP tối đa']]) {
        if(spec[key]){item[key]=spec[key][i];bonuses.push(`+${item[key]} ${label}`);}
    }
    item.description=`${bonuses.join(' · ')}. Có thể trang bị ở mọi cấp nhân vật.`;
    ITEMS[id]=item;
}
// Giữ id cũ để không mất trượng trong bản lưu trước.
ITEMS.wood_staff={name:'Trượng tập sự',frame:129,type:'weapon',category:'weapon',level:1,price:28,maxStack:1,attack:3,description:'+3 công. Có thể trang bị ở mọi cấp nhân vật.'};
export const SHOP_ITEMS=Object.keys(ITEMS)
    .filter(id => !['monster-drop','upgrade'].includes(ITEMS[id].category))
    .sort((a,b)=>ITEMS[a].level-ITEMS[b].level || ITEMS[a].price-ITEMS[b].price);

// Biểu tượng pixel cho các loại giáp chưa có ảnh riêng trong Tiny Dungeon.
export function gearIcon(kind, level=1, size=40) {
    const colors=['#b9c5c9','#91c5e5','#bb9cde','#dea572','#e3ca78'];
    const base=colors[Math.max(0,Math.min(4,level-1))];
    const shapes={
        armor:'<path d="M5 2H7V4H9V2H11L15 5V9H12V14H4V9H1V5Z"/><path d="M5 5H11V12H5Z" fill="#627985"/><path d="M7 5H9V12H7Z" fill="#d9e3df"/>',
        helmet:'<path d="M5 2H11V3H13V6H14V14H10V10H6V14H2V6H3V3H5Z"/><path d="M4 7H12V9H4Z" fill="#243b3c"/><path d="M7 2H9V13H7Z" fill="#e1e7dd"/>',
        boots:'<path d="M2 2H6V9H8V14H1V11H2ZM10 2H14V9H15V14H9V11H10Z"/><path d="M1 12H8V14H1ZM9 12H15V14H9Z" fill="#806447"/><path d="M3 4H6V5H3ZM11 4H14V5H11Z" fill="#e7d6a6"/>',
        gloves:'<path d="M2 3H6V7H8V11H6V14H2V12H1V7H2ZM10 3H14V7H15V12H14V14H10V11H8V7H10Z"/><path d="M2 11H6V13H2ZM10 11H14V13H10Z" fill="#846d4c"/>'
    };
    return `<svg aria-hidden="true" class="rpg-gear-icon" width="${size}" height="${size}" viewBox="0 0 16 16" style="image-rendering:pixelated;flex-shrink:0" shape-rendering="crispEdges"><g fill="${base}" stroke="#243b3c" stroke-width=".5">${shapes[kind]??shapes.armor}</g></svg>`;
}

// Vũ khí khởi đầu của Đấu sĩ.
ITEMS.starter_axe = {name:'Rìu tập sự',frame:118,type:'weapon',category:'weapon',level:1,price:35,maxStack:1,attack:6,description:'+6 công. Vũ khí khởi đầu của Đấu sĩ.'};
ITEMS.starter_fishing_rod = {name:'Cần câu tập sự',type:'material',category:'fishing',level:1,price:50,maxStack:1,emoji:'🎣',description:'Dụng cụ câu cá tại Hồ Nước Atlast.'};
ITEMS.fish_perch = {name:'Cá rô',type:'material',category:'fishing',level:1,price:30,maxStack:99,emoji:'🐟',description:'Cá rô câu được ở Hồ Nước Atlast. Cần thủ thu mua với giá 30 vàng/con.'};
ITEMS.fish_carp = {name:'Cá chép',type:'material',category:'fishing',level:1,price:40,maxStack:99,emoji:'🐠',description:'Cá chép câu được ở Hồ Nước Atlast. Cần thủ thu mua với giá 40 vàng/con.'};
ITEMS.fish_catfish = {name:'Cá trê',type:'material',category:'fishing',level:1,price:50,maxStack:99,emoji:'🐟',description:'Cá trê câu được ở Hồ Nước Atlast. Cần thủ thu mua với giá 50 vàng/con.'};
ITEMS.fish_gold = {name:'Cá vàng',type:'material',category:'fishing',level:1,price:1000,maxStack:99,emoji:'🐠',description:'Cá vàng quý hiếm ở Hồ Nước Atlast. Cần thủ thu mua với giá 1000 vàng/con.'};

// Vũ khí thương nhân theo class; giữ ID đồ cũ và cấp cường hóa theo ô.
for (const [base,name,frame,owner] of [['wood_staff','Trượng',129,'mage'],['starter_axe','Rìu',118,'fighter']]) {
    for(let i=0;i<5;i++){
        const id=i?`${base}_${i+1}`:base;
        ITEMS[id]={...ITEMS[base],name:`${name} cấp ${i+1}`,level:i+1,frame,type:'weapon',category:'weapon',classCode:owner,
            attack:[base==='wood_staff'?3:6,10,18,30,48][i],price:[base==='wood_staff'?28:35,100,260,600,1300][i],maxStack:1,
            description:`+${[base==='wood_staff'?3:6,10,18,30,48][i]} công. Vũ khí dành cho ${owner==='mage'?'Pháp sư':'Đấu sĩ'}.`};
        if(!SHOP_ITEMS.includes(id))SHOP_ITEMS.push(id);
    }
}
for(const [id,item] of Object.entries(ITEMS))if(id.startsWith('iron_sword'))item.classCode='swordsman';
export const canShopItem = (id,classCode) => ITEMS[id]?.type!=='weapon' || ITEMS[id]?.classCode===classCode;

ITEMS.mushroom_basket = { name:'Rổ hái nấm', type:'material', category:'gathering', maxStack:1, price:200, emoji:'🧺', description:'Có rổ trong túi mới hái được nấm. Không tiêu hao khi hái.' };
ITEMS.yuna_mushroom = { name:'Nấm YuNa', type:'material', category:'gathering', maxStack:99, emoji:'🍄', description:'Đổi 20 nấm lấy 1 đá cường hóa tại Người hái nấm Nami ở Ngoại ô YuNa.' };
