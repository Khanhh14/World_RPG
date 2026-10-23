import { ITEMS } from '../data/items.js';
// Chỉ lưu lựa chọn ô nhanh. Không tạo bình hoặc thay dữ liệu túi đồ.
export class PotionLoadout {
  constructor(getState){this.getState=getState;this.key=null;this.slots={hp:null,mp:null};}
  valid(id,kind){const i=ITEMS[id];return ['hp','mp'].includes(kind)&&i?.type==='consumable'&&Number(i[kind==='hp'?'heal':'mana'])>0;}
  hydrate(){
    const s=this.getState();if(!s?.data.characterId)return false;
    const key=`tiny-rpg-potion-slots:${encodeURIComponent(s.userId??'')}:${encodeURIComponent(s.data.characterId)}`;
    if(this.key===key)return true;this.key=key;this.slots={hp:null,mp:null};
    try{const saved=JSON.parse(globalThis.localStorage?.getItem(key)||'null');for(const kind of ['hp','mp'])if(this.valid(saved?.[kind],kind))this.slots[kind]=saved[kind];}catch{}
    return true;
  }
  save(){try{globalThis.localStorage?.setItem(this.key,JSON.stringify(this.slots));}catch{}}
  options(kind){const s=this.getState();return Object.entries(ITEMS).filter(([id])=>this.valid(id,kind)).map(([id,item])=>({id,...item,quantity:s?.data.inventory?.[id]??0})).sort((a,b)=>(a.level??1)-(b.level??1));}
  selected(kind){
    if(!this.hydrate())return null;
    // Chỉ tự chọn ở lần đầu chưa gán. Bình đã gán hết KHÔNG đổi sang loại khác.
    if(!this.slots[kind]){const first=this.options(kind).find(i=>i.quantity>0);if(first){this.slots[kind]=first.id;this.save();}}
    const id=this.slots[kind];return id?{id,...ITEMS[id],quantity:this.getState()?.data.inventory?.[id]??0}:null;
  }
  assign(kind,id){if(!this.hydrate()||!this.valid(id,kind)||(this.getState().data.inventory[id]??0)<=0)return false;this.slots[kind]=id;this.save();return true;}
}
