import {ITEMS,EQUIPMENT_SLOTS} from './items.js';
export function resalePrice(id){
 const item=ITEMS[id];if(!item)return 0;if(Number.isFinite(item.sellPrice))return item.sellPrice;
 return EQUIPMENT_SLOTS.some(([slot])=>slot===item.type)?Math.floor(item.price*.5):10;
}
