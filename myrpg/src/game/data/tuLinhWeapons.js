const common={type:'weapon',category:'event-weapon',level:6,maxStack:1,attack:120,price:0,sellPrice:10,eventId:'tu-linh'};
export const TU_LINH_WEAPONS={
 diet_long_kiem:{...common,name:'Diệt Long Kiếm',classCode:'swordsman',icon:'diet_long_kiem',description:'+120 công. Vũ khí chính Tứ Linh dành cho Kiếm sĩ; đổi bằng 20 Nhân Long.'},
 huyen_long_truong:{...common,name:'Huyễn Long Trượng',classCode:'mage',icon:'huyen_long_truong',description:'+120 công. Vũ khí chính Tứ Linh dành cho Pháp sư; đổi bằng 20 Nhân Long.'},
 khai_long_son_phu:{...common,name:'Khai Long Sơn Phủ',classCode:'fighter',icon:'khai_long_son_phu',description:'+120 công. Vũ khí chính Tứ Linh dành cho Đấu sĩ; đổi bằng 20 Nhân Long.'}
};
export const WEAPON_PIXELS={
 diet_long_kiem:[[10,0,5,5,'#213f46'],[9,3,5,4,'#213f46'],[7,6,5,4,'#213f46'],[5,8,5,4,'#213f46'],[11,1,3,3,'#a2e4d9'],[10,4,3,2,'#68b7b0'],[8,6,3,2,'#a2e4d9'],[6,8,3,2,'#68b7b0'],[4,8,2,5,'#e8c77d'],[4,11,7,2,'#e8c77d'],[3,11,3,3,'#345f69'],[1,13,3,3,'#a77d47'],[4,9,2,2,'#f5e6b1']],
 huyen_long_truong:[[7,5,3,11,'#3b373e'],[8,5,1,11,'#dab972'],[3,2,10,2,'#dfbe77'],[4,1,2,6,'#dfbe77'],[11,0,2,6,'#dfbe77'],[5,5,7,2,'#dfbe77'],[6,0,5,5,'#30465a'],[7,1,3,3,'#a4c6f2'],[7,1,1,2,'#f5f3d2'],[7,9,3,1,'#a5d6d2'],[7,13,3,1,'#a5d6d2']],
 khai_long_son_phu:[[7,1,3,15,'#342f36'],[8,1,1,15,'#d9b873'],[1,1,5,8,'#253f47'],[10,1,5,8,'#253f47'],[2,2,4,5,'#68b8ad'],[10,2,4,5,'#68b8ad'],[1,3,2,4,'#c4e8dc'],[13,3,2,4,'#c4e8dc'],[4,3,8,2,'#dbb86b'],[6,4,4,3,'#e5c77c'],[7,4,2,2,'#96dcd1'],[7,10,3,1,'#80b9ac']]
};
WEAPON_PIXELS.doat_hon_kiem=WEAPON_PIXELS.diet_long_kiem;
WEAPON_PIXELS.doat_hon_truong=WEAPON_PIXELS.huyen_long_truong;
WEAPON_PIXELS.doat_hon_phu=WEAPON_PIXELS.khai_long_son_phu;
export function tuLinhWeaponIcon(id,size=40){return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0">${(WEAPON_PIXELS[id]||[]).map(([x,y,w,h,color])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`).join('')}</svg>`;}
export function tuLinhWeaponTexture(scene,id){
 const key=`event-${id}`;if(scene.textures.exists(key))return key;
 const t=scene.textures.createCanvas(key,16,16),c=t.context;c.imageSmoothingEnabled=false;
 for(const [x,y,w,h,color] of WEAPON_PIXELS[id]||[]){c.fillStyle=color;c.fillRect(x,y,w,h);}t.refresh();return key;
}
