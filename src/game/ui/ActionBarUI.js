import { CombatSystem } from '../systems/CombatSystem.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';
import { actionIcon } from './actionIcons.js';
export { actionIcon } from './actionIcons.js';
export class ActionBarUI {
  constructor(scene){
    this.scene=scene;this.managesInput=true;this.visible=true;this.alive=true;this.npc=null;
    if(!document.getElementById('rpg-action-style')){const link=document.createElement('link');link.id='rpg-action-style';link.rel='stylesheet';link.href=`${import.meta.env?.BASE_URL??'/'}assets/style/actionBar.css?v=5`;document.head.appendChild(link);}
    this.root=document.createElement('section');this.root.className='rpg-actions';this.root.setAttribute('aria-label','Kỹ năng và tương tác');
    this.root.innerHTML=`<div class="ra-notice" role="status" hidden></div><div class="ra-skills">${COMBAT_SKILLS.map(s=>this.button(s.id,s.name,s.key,s.icon,'skill')).join('')}</div><div class="ra-orbit">${this.button('hp','Bình HP','Q','hp','utility')}${this.button('auto','Tự động đánh','AUTO','auto','utility')}${this.button('mp','Bình Mana','R','mp','utility')}${this.button('special','Vũ khí','F','special','utility')}${this.button('interact','Đánh thường','E','sword','main')}</div><div class="ra-tooltip" role="tooltip" hidden></div><section class="ra-picker" role="dialog" aria-label="Gán bình vào ô nhanh" hidden></section>`;
    document.body.appendChild(this.root);this.buttons=new Map([...this.root.querySelectorAll('button[data-id]')].map(b=>[b.dataset.id,b]));
    this.picker=this.root.querySelector('.ra-picker');this.pickerKind=null;
    this.tooltip=this.root.querySelector('.ra-tooltip');this.notice=this.root.querySelector('.ra-notice');
    this.combat=new CombatSystem(scene,text=>this.toast(text));scene.combat=this.combat;
    this.onClick=e=>{const b=e.target.closest('button');if(!b)return;
      if(b.dataset.id==='auto'){this.combat.autoAttack=!this.combat.autoAttack;this.refresh();}
      else if(b.dataset.choose)this.openPicker(b.dataset.choose);
      else if(b.dataset.potion){if(this.combat.potions.assign(this.pickerKind,b.dataset.potion)){this.toast('Đã gán '+this.combat.potions.selected(this.pickerKind).name);this.closePicker();}}
      else if(b.hasAttribute('data-picker-close'))this.closePicker();
      else if(!this.pickerKind)this.invoke(b.dataset.id);
    };
    this.onContext=e=>{const kind=e.target.closest('button')?.dataset.id;if(kind==='hp'||kind==='mp'){e.preventDefault();this.openPicker(kind);}};
    this.onOutside=e=>{if(this.pickerKind&&!this.picker.contains(e.target)&&!e.target.closest('[data-choose]'))this.closePicker(false);};
    this.root.addEventListener('contextmenu',this.onContext);window.addEventListener('pointerdown',this.onOutside,true);
    this.onPointer=e=>{e.stopPropagation();};
    this.onHover=e=>{const b=e.target.closest('button');if(!b)return;if(this.pickerKind||!b.dataset.tooltip)return;this.tooltip.textContent=b.dataset.tooltip;this.tooltip.hidden=false;};
    this.onLeave=()=>{this.tooltip.hidden=true;};
    this.root.addEventListener('click',this.onClick);this.root.addEventListener('pointerdown',this.onPointer);
    this.root.addEventListener('pointerover',this.onHover);this.root.addEventListener('focusin',this.onHover);this.root.addEventListener('pointerleave',this.onLeave);this.root.addEventListener('focusout',this.onLeave);
    this.onKey=e=>{
      if(!this.alive||document.hidden||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName))return;
      if(this.pickerKind){
        e.stopImmediatePropagation();
        if(e.code==='Escape'){e.preventDefault();this.closePicker();}
        else if(e.code==='Tab'){
          const all=[...this.picker.querySelectorAll('button:not(:disabled)')],first=all[0],last=all.at(-1);
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
        }else if(!['Enter','Space'].includes(e.code))e.preventDefault();
        return;
      }
      if(e.shiftKey&&['KeyQ','KeyR'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();this.openPicker(e.code==='KeyQ'?'hp':'mp');return;}
      const id=({KeyE:'interact',KeyQ:'hp',KeyR:'mp',KeyF:'special',Digit1:'power',Digit2:'bolt',Digit3:'whirl',Digit4:'guard',Digit5:'heal',Numpad1:'power',Numpad2:'bolt',Numpad3:'whirl',Numpad4:'guard',Numpad5:'heal'})[e.code];
      if(!id||scene.hud?.blocked||scene.fishingSystem?.basketOpen)return;
      e.preventDefault();e.stopImmediatePropagation();this.invoke(id);
    };
    window.addEventListener('keydown',this.onKey,true);
    this.onUpdate=()=>this.refresh();scene.events.on('postupdate',this.onUpdate);
    scene.events.once('shutdown',()=>this.destroy());this.resize(scene.scale.width,scene.scale.height);this.refresh();
  }
  button(id,label,key,icon,kind){return `<button type="button" class="ra-button ra-${kind}" data-id="${id}" aria-label="${label} (${key})"><span class="ra-icon">${actionIcon(icon)}</span><span class="ra-label">${label}</span><kbd>${key}</kbd><span class="ra-count"></span><span class="ra-level"></span><span class="ra-cooldown" hidden></span></button>${['hp','mp'].includes(id)?`<button type="button" class="ra-assign ra-assign-${id}" data-choose="${id}" aria-label="Chọn cấp bình ${id==='hp'?'HP':'Mana'}">⌄</button>`:''}`;}
  context(){
    const f=this.scene.fishingSystem;
    if(this.scene.dialogue?.isOpen)return {icon:'next',label:'Tiếp tục',kind:'dialogue'};
    if(f?.phase&&f.phase!=='idle')return {icon:'cancel',label:f.phase==='finishing'?'Nhận cá…':'Hủy câu',kind:'cancel'};
    const npc=this.scene.dialogue?.nearest?.()??this.npc;
    if(npc)return {icon:npc.isMerchant?'shop':'talk',label:npc.isMerchant?'Mua bán':'Nói chuyện',kind:'npc'};
    if(f?.alive&&f.near())return {icon:'fish',label:'Câu cá',kind:'fish'};
    return {icon:'sword',label:'Đánh thường',kind:'attack'};
  }
  invoke(id){
    if(!this.alive||this.pickerKind||!this.scene.rpgState||this.scene.hud?.blocked||this.scene.fishingSystem?.basketOpen)return;
    if(id==='interact'){
      const c=this.context(),f=this.scene.fishingSystem;
      if(c.kind==='dialogue'||c.kind==='npc')this.scene.dialogue?.interact();
      else if(c.kind==='fish')void f.start();
      else if(c.kind==='cancel')void f.cancel();
      else this.combat.attack();
    }else if(id==='special')this.toast('Kỹ năng riêng của vũ khí sẽ được bổ sung sau.');
    else if(id==='hp'||id==='mp')this.combat.potion(id);
    else this.combat.cast(id);
    this.refresh();
  }
  refresh(){
    if(!this.alive)return;const scene=this.scene,c=this.context(),f=scene.fishingSystem;
    this.root.hidden=!!scene.hud?.blocked||!!f?.basketOpen||(!this.visible&&!scene.dialogue?.isOpen);
    this.root.classList.toggle('ra-dialogue',!!scene.dialogue?.isOpen);
    const main=this.buttons.get('interact');
    if(main.dataset.context!==c.kind){main.dataset.context=c.kind;main.querySelector('.ra-icon').innerHTML=actionIcon(c.icon);}
    main.querySelector('.ra-label').textContent=c.label;main.setAttribute('aria-label',`${c.label} (E)`);main.dataset.tooltip=`${c.label} · E`;
    const focused=this.root.contains(document.activeElement)?document.activeElement.closest('button'):null;
    if(focused?.dataset.id==='interact'&&!this.tooltip.hidden)this.tooltip.textContent=main.dataset.tooltip;
    main.disabled=!scene.rpgState||scene.rpgState.data.hp<=0||f?.phase==='finishing';
    const auto=this.buttons.get('auto');
    auto.classList.toggle('ra-auto-on',this.combat.autoAttack);
    auto.setAttribute('aria-pressed',String(this.combat.autoAttack));
    auto.dataset.tooltip=`Tự động đánh · Bấm để ${this.combat.autoAttack?'tắt':'bật'}.`;
    auto.disabled=!scene.rpgState||scene.rpgState.data.hp<=0||!!scene.hud?.blocked||!!scene.dialogue?.isOpen||!!f?.basketOpen||!!(f?.phase&&f.phase!=='idle');
    for(const skill of COMBAT_SKILLS){
      const b=this.buttons.get(skill.id),remaining=this.combat.remaining(skill.id),error=this.combat.ready(skill);
      b.disabled=!!error;b.dataset.tooltip=`${skill.name} · ${skill.mana} MP · Hồi ${skill.cooldown/1000}s\n${skill.description}${error?'\n'+error:''}`;
      b.querySelector('.ra-count').textContent=`${skill.mana} MP`;this.cooldown(b,remaining,skill.cooldown);
    }
    for(const kind of ['hp','mp']){
      const button=this.buttons.get(kind),item=this.combat.potions.selected(kind);
      button.querySelector('.ra-count').textContent=`×${item?.quantity??0}`;
      button.querySelector('.ra-level').textContent=item?`C${item.level??1}`:'—';
      button.disabled=this.combat.busy||!item?.quantity||this.combat.remaining(kind)>0;
      button.dataset.tooltip=`${item?.name??'Chưa gán bình'} · ${kind==='hp'?'Q':'R'}\n${item?`Hồi ${item[kind==='hp'?'heal':'mana']} ${kind==='hp'?'HP':'Mana'} · Còn ${item.quantity}`:'Chọn bình đang có trong túi.'}\nNhấn ⌄ hoặc chuột phải để chọn cấp. Hết bình sẽ không tự đổi cấp.`;
      this.cooldown(button,this.combat.remaining(kind),900);
      this.root.querySelector(`[data-choose="${kind}"]`).disabled=!scene.rpgState||!!scene.hud?.blocked||!!scene.dialogue?.isOpen||!!f?.basketOpen||!!(f?.phase&&f.phase!=='idle');
    }
    if(this.pickerKind){
      if(this.root.hidden||scene.dialogue?.isOpen||(f?.phase&&f.phase!=='idle'))this.closePicker(false);
      else {scene.player?.stop();this.renderPicker();}
    }
    const special=this.buttons.get('special');special.setAttribute('aria-disabled','true');special.dataset.tooltip='Kỹ năng đặc biệt của vũ khí · Chưa mở';
    special.classList.add('ra-locked');
    if(this.noticeUntil&&performance.now()>this.noticeUntil)this.notice.hidden=true;
  }
  openPicker(kind){
    if(!['hp','mp'].includes(kind)||(!this.pickerKind&&this.combat.busy))return;
    this.pickerKind=kind;this.combat.uiBlocked=true;this.pickerSignature=null;
    this.scene.player?.stop();this.scene.input?.keyboard?.resetKeys();this.tooltip.hidden=true;
    this.picker.hidden=false;this.root.classList.add('ra-picking');this.renderPicker();
    const focus=this.picker.querySelector('button[aria-pressed="true"]:not(:disabled)')??this.picker.querySelector('button');focus?.focus();
  }
  renderPicker(){
    const kind=this.pickerKind;if(!kind)return;
    const options=this.combat.potions.options(kind),selected=this.combat.potions.selected(kind)?.id;
    const signature=JSON.stringify([kind,selected,options.map(i=>[i.id,i.quantity])]);if(this.pickerSignature===signature)return;
    this.pickerSignature=signature;
    const focused=document.activeElement?.dataset.potion;
    this.picker.replaceChildren();
    const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');
    title.textContent=`Gán bình ${kind==='hp'?'HP · Q':'Mana · R'}`;close.type='button';close.setAttribute('data-picker-close','');close.setAttribute('aria-label','Đóng chọn bình');close.textContent='×';header.append(title,close);this.picker.append(header);
    const hint=document.createElement('p');hint.textContent='Chọn cấp muốn dùng. Chỉ tiêu hao đúng bình đã gán.';this.picker.append(hint);
    const list=document.createElement('div');list.className='ra-potion-list';this.picker.append(list);
    for(const item of options){
      const row=document.createElement('button');row.type='button';row.className='ra-potion-option';row.dataset.potion=item.id;row.disabled=item.quantity<=0;row.setAttribute('aria-pressed',String(item.id===selected));
      const icon=document.createElement('span');icon.className='ra-potion-art';icon.innerHTML=actionIcon(kind);
      const copy=document.createElement('span'),name=document.createElement('strong'),details=document.createElement('small');
      name.textContent=item.name;details.textContent=`Hồi ${item[kind==='hp'?'heal':'mana']} ${kind==='hp'?'HP':'Mana'} · Có ${item.quantity}`;copy.append(name,details);
      const status=document.createElement('span');status.className='ra-potion-tag';status.textContent=item.id===selected?'Đã gán':item.quantity>0?'Gán':'Chưa có';row.append(icon,copy,status);list.append(row);
    }
    if(!options.some(i=>i.quantity>0)){const p=document.createElement('p');p.textContent='Bạn chưa có bình loại này. Mua bình từ thương nhân rồi gán tại đây.';this.picker.append(p);}
    if(focused)[...list.children].find(b=>b.dataset.potion===focused&&!b.disabled)?.focus();
  }
  closePicker(focus=true){
    const kind=this.pickerKind;this.pickerKind=null;this.combat.uiBlocked=false;this.picker.hidden=true;this.root.classList.remove('ra-picking');this.scene.input?.keyboard?.resetKeys();
    if(focus&&kind)this.root.querySelector(`[data-choose="${kind}"]`)?.focus();
  }
  cooldown(button,left,total){const shade=button.querySelector('.ra-cooldown');shade.hidden=left<=0;shade.textContent=left>0?(left/1000).toFixed(1):'';button.style.setProperty('--cooldown',`${Math.min(100,left/total*100)}%`);}
  toast(text){
    if(this.scene.hud){this.scene.hud.toast(text);return;}
    this.notice.textContent=text;this.notice.hidden=false;this.noticeUntil=performance.now()+3000;
  }
  selectPotion(kind,id){
    if(!this.combat.potions.assign(kind,id))return false;
    this.toast(`Đã gán ${this.combat.potions.selected(kind).name} vào ô ${kind==='hp'?'Q':'R'}.`);
    this.refresh();
    return true;
  }
  setNPC(npc){this.npc=npc;}
  setVisible(value){this.visible=value;this.refresh();}
  resize(width,height){this.layout={x:width-108,y:height-108,big:88,small:58,scale:1};}
  destroy(){
    if(!this.alive)return;this.alive=false;window.removeEventListener('keydown',this.onKey,true);window.removeEventListener('pointerdown',this.onOutside,true);this.scene.events.off('postupdate',this.onUpdate);this.combat.destroy();if(this.scene.combat===this.combat)this.scene.combat=null;this.root.remove();
  }
}
