import { claimBossReward } from '../../api/bossRewardApi.js';
export class BossRewards {
 constructor(scene){this.scene=scene;this.state=scene.rpgState;this.alive=true;scene.events.once('shutdown',()=>{this.alive=false;});void this.flush();}
 toast(message){if(this.alive)this.scene.hud?.toast(message);}
 persist(next){
  this.state.storage?.setItem(this.state.saveKey,JSON.stringify(next));
  const read=JSON.parse(this.state.storage?.getItem(this.state.saveKey)||'null');
  if(JSON.stringify(read)!==JSON.stringify(next))throw new Error('Không lưu được thưởng boss trên trình duyệt.');
 }
 async queue(bossId='naga'){
  if (!['naga','noxii','forest-guardian'].includes(bossId)) throw new Error('Boss không hợp lệ.');
  const s=this.state;s.data.pendingBossRewards.push({bossId,requestId:crypto.randomUUID()});
  // Giữ yêu cầu trong bộ nhớ nếu storage lỗi để nút Thử nhận lại có thể tiếp tục.
  try{this.persist(s.data);}catch(e){s.bossRewardError=e.message;s.changed();this.toast('Chưa lưu được yêu cầu. Mở B để thử nhận lại.');return;}
  s.changed();await this.flush();
 }
 async flush(){
  const s=this.state;if(s.bossRewardBusy)return;s.bossRewardBusy=true;
  try{
   while(s.data.pendingBossRewards.length){
    this.persist(s.data);const entry=s.data.pendingBossRewards[0];
    const pending=typeof entry==='string'?{bossId:'naga',requestId:entry}:entry;
    const id=pending.requestId;
    const result=await claimBossReward(pending);
    if(result.requestId!==id||String(result.character?.id)!==String(s.data.characterId))throw new Error('Thưởng không thuộc nhân vật hiện tại.');
    s.applyServerCharacter(result.character);
    const next={...s.data,pendingBossRewards:s.data.pendingBossRewards.filter(x=>(typeof x==='string'?x:x.requestId)!==id),bossStoneInbox:s.data.bossStoneInbox+result.reward.stones};
    this.persist(next);s.data.pendingBossRewards=next.pendingBossRewards;s.data.bossStoneInbox=next.bossStoneInbox;s.bossRewardError='';s.changed();
    this.collect(false);this.toast(`Thưởng ${pending.bossId==='naga'?'NaGa':pending.bossId==='forest-guardian'?'Thủ hộ khu rừng':'Hộ Vệ Hắc Thạch'}: +${result.reward.gold} vàng · +${result.reward.exp} EXP · +${result.reward.stones} đá cường hóa`+(s.data.bossStoneInbox?' (đá đang chờ trong B)':''));
   }
   this.collect(false);
  }catch(e){s.bossRewardError=e.message;this.toast('Thưởng đang chờ. Mở B → Thử nhận lại.');}
  finally{s.bossRewardBusy=false;s.changed();}
 }
 collect(show=true){
  const s=this.state;if(!s.data.bossStoneInbox)return;
  const error=s.canAdd('upgrade_stone');if(error){if(show)this.toast('Hãy chừa ô trống hoặc dùng bớt đá. Thưởng vẫn được giữ.');return;}
  const count=Math.min(s.data.bossStoneInbox,99-(s.data.inventory.upgrade_stone||0));
  const next={...s.data,bossStoneInbox:s.data.bossStoneInbox-count,inventory:{...s.data.inventory,upgrade_stone:(s.data.inventory.upgrade_stone||0)+count}};
  try{this.persist(next);s.data.bossStoneInbox=next.bossStoneInbox;s.data.inventory=next.inventory;s.changed();if(show)this.toast(`Đã nhận ${count} đá cường hóa vào túi.`);}catch(e){s.bossRewardError=e.message;if(show)this.toast(e.message);}
 }
}
