let serial=0;
const base=(inside,color)=>`<circle cx="32" cy="32" r="25" fill="${color}" opacity=".17"/><g stroke-linejoin="round" stroke-linecap="round">${inside}</g>`;
const sword=`<path d="M22 40L43 9l10-2-2 12-25 25z" fill="url(#metal)" stroke="#243b47" stroke-width="2"/><path d="M26 38L48 13" stroke="#fff9d1" stroke-width="2"/><path d="M18 36l13 12-4 4-14-12z" fill="url(#gold)" stroke="#4c3826" stroke-width="1.5"/><path d="M19 44l-8 10 4 4 9-10" fill="#985433" stroke="#432f29" stroke-width="2"/><path d="M9 54l5 5" stroke="#ffe5a2" stroke-width="4"/>`;
const art={
 sword:()=>base(sword,'#edd398'),
 power:()=>base(`<path d="M9 38C8 22 17 12 31 9L23 18C37 11 46 16 54 24L39 21 48 33 34 28 35 41 24 34 18 50z" fill="url(#fire)" opacity=".95"/>${sword}<path d="M9 14l4 3m39 27 5 2M23 5v5" stroke="#ffe9a7" stroke-width="2"/>`,'#fc9e41'),
 bolt:()=>base(`<path d="M5 39l15-4-7-8 17-7-4-9 15 6 10-7-5 15 12 7-14 7 6 14-17-8-9 13-3-15z" fill="#288ed0" opacity=".5"/><path d="M35 6L15 35h15l-5 23 25-33H35l7-19z" fill="url(#ice)" stroke="#b6f7ff" stroke-width="1.5"/><path d="M13 16l-5 9 8 3M48 41l7 3-5 10" fill="none" stroke="#7edbff" stroke-width="2"/>`,'#43baff'),
 whirl:()=>base(`<path d="M12 23C23 1 52 10 51 28 44 15 26 17 21 27c-4 9 4 15 12 11C19 52 1 40 12 23z" fill="url(#teal)" stroke="#aaf6e1" stroke-width="1.2"/><path d="M49 41C35 61 8 49 11 31c5 14 24 14 30 4 5-8-2-16-11-13 15-11 31 3 19 19z" fill="url(#teal)" stroke="#aaf6e1" stroke-width="1.2"/><circle cx="32" cy="32" r="5" fill="#f3ffda"/><path d="M6 11l5-4m42 46 4-4M8 50l3 3" stroke="#d6ffc7" stroke-width="2"/>`,'#68e7c5'),
 guard:()=>base(`<path d="M32 5L54 14v19c-2 15-22 26-22 26S12 49 10 33V14z" fill="url(#gold)" stroke="#423b31" stroke-width="2"/><path d="M32 11l16 8v13c-2 11-16 20-16 20S18 43 16 32V19z" fill="url(#blue)" stroke="#f9e1a0"/><path d="M32 15v31M21 23l11-5 11 5" fill="none" stroke="#94d7fa" stroke-width="2"/><path d="M32 24l8 9-8 10-8-10z" fill="url(#ice)" stroke="#fff4c3"/><circle cx="14" cy="18" r="2" fill="#fff0bd"/><circle cx="50" cy="18" r="2" fill="#fff0bd"/>`,'#669fee'),
 heal:()=>base(`<path d="M24 53C8 51 8 31 13 17c12 6 18 20 11 36M40 53c16-2 16-22 11-36-12 6-18 20-11 36" fill="url(#leaf)" stroke="#b9e797"/><path d="M12 55l9-19M52 55l-9-19" stroke="#e7f6ad" stroke-width="1.5"/><path d="M26 8h12v14h14v12H38v14H26V34H12V22h14z" fill="url(#leaf)" stroke="#f2ffcf" stroke-width="2"/><path d="M30 12h4v14h14v4H34v14h-4V30H16v-4h14z" fill="#f6ffdb"/><path d="M9 7v7m-3-3h6M53 6v7m-3-3h6" stroke="#d9ffc3" stroke-width="1.5"/>`,'#8ee783'),
 special:()=>base(`<path d="M32 5l8 16 18 3-13 13 3 19-16-9-17 9 4-19L6 24l18-3z" fill="url(#gold)" stroke="#fff0bd"/><path d="M32 16l5 12 13 2-10 8 3 13-11-7-11 7 3-13-10-8 13-2z" fill="#796650"/><path d="M32 23l7 10-7 10-7-10z" fill="url(#ice)"/>`,'#ead198'),
 talk:()=>base(`<path d="M7 11h50v32H31L16 56V43H7z" fill="url(#gold)" stroke="#483f2e" stroke-width="2"/><path d="M12 16h40v22H29L21 45v-7h-9z" fill="#234e41"/><g fill="#ffedb4"><circle cx="21" cy="27" r="3"/><circle cx="32" cy="27" r="3"/><circle cx="43" cy="27" r="3"/></g>`,'#efd792'),
 shop:()=>base(`<path d="M12 25h40v30H12z" fill="#e8c792" stroke="#4d4631" stroke-width="2"/><path d="M7 25l8-16h34l8 16z" fill="#eee1b9"/><path d="M15 9h8l-3 16H7zm17 0h8l4 16H31zm17 0 8 16H44L40 9z" fill="#b56346"/><path d="M9 25c0 9 12 9 12 0 0 9 11 9 11 0 0 9 11 9 11 0 0 9 12 9 12 0" fill="#ae6545" stroke="#f9d794"/><path d="M20 55V37h15v18M40 36h8v9h-8" fill="#52634c"/><circle cx="30" cy="46" r="1.5" fill="#ffdc89"/>`,'#f0c18b'),
 fish:()=>base(`<path d="M12 55L37 8" stroke="#57412d" stroke-width="7"/><path d="M12 55L37 8" stroke="#e2b975" stroke-width="4"/><path d="M37 8c16 5 17 14 14 28v10c0 12-14 12-14 2l5 5" fill="none" stroke="#e4f3de" stroke-width="2"/><circle cx="27" cy="30" r="5" fill="#b38b54" stroke="#ffe6a2"/><path d="M39 38l9-1-4 8z" fill="#ef8c70"/>`,'#80cacf'),
 cancel:()=>base('<path d="M17 17l30 30m0-30L17 47" stroke="#f4b591" stroke-width="8"/><path d="M17 17l30 30m0-30L17 47" stroke="#ffe7b9" stroke-width="3"/>','#e69c77'),
 next:()=>base('<path d="M10 26h26V14l20 18-20 18V38H10z" fill="url(#gold)" stroke="#fff0b3" stroke-width="2"/>','#d5d994')
};
export function actionIcon(id){
 // Dùng đúng atlas và frame như icon bình trong shop/túi đồ.
 // HP = frame 114 (cột 6, hàng 9); Mana = frame 116 (cột 8, hàng 9).
 if(id==='hp'||id==='mp'){
   const col=id==='hp'?6:8;
   const url=`${import.meta.env?.BASE_URL??'/'}assets/tiny-dungeon/Tilemap/tilemap_packed.png`;
   return `<span class="ra-pixel-potion" aria-hidden="true" style="--potion-col:${col};background-image:url('${url}')"></span>`;
 }

 const uid=`ra-art-${++serial}-`;
 let markup=`<svg viewBox="0 0 64 64" aria-hidden="true"><defs>
 <linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#fff0b1"/><stop offset=".5" stop-color="#d9b26c"/><stop offset="1" stop-color="#a37844"/></linearGradient>
 <linearGradient id="metal" x2="1" y2="1"><stop stop-color="#fff6cb"/><stop offset=".5" stop-color="#c4ecec"/><stop offset="1" stop-color="#6c9ab0"/></linearGradient>
 <linearGradient id="fire" x2="1" y2="1"><stop stop-color="#ffe9a0"/><stop offset="1" stop-color="#e76c38"/></linearGradient>
 <linearGradient id="ice" x2=".5" y2="1"><stop stop-color="#f0ffff"/><stop offset=".5" stop-color="#95e9ff"/><stop offset="1" stop-color="#4195e2"/></linearGradient>
 <linearGradient id="teal" x2="1" y2="1"><stop stop-color="#e0ffca"/><stop offset=".45" stop-color="#81e3c6"/><stop offset="1" stop-color="#339888"/></linearGradient>
 <linearGradient id="blue" x2=".8" y2="1"><stop stop-color="#689ed6"/><stop offset="1" stop-color="#273e6b"/></linearGradient>
 <linearGradient id="leaf" x2=".8" y2="1"><stop stop-color="#d4f59d"/><stop offset=".5" stop-color="#7ac687"/><stop offset="1" stop-color="#438a65"/></linearGradient>
 <linearGradient id="glass" x2="1" y2=".3"><stop stop-color="#6b9d9e" stop-opacity=".7"/><stop offset=".5" stop-color="#d9f6ed" stop-opacity=".35"/><stop offset="1" stop-color="#8cc4cc" stop-opacity=".7"/></linearGradient>
 <linearGradient id="red" x2="0" y2="1"><stop stop-color="#f37980"/><stop offset="1" stop-color="#b93151"/></linearGradient>
 <linearGradient id="mana" x2="0" y2="1"><stop stop-color="#67d8f0"/><stop offset="1" stop-color="#2b73be"/></linearGradient>
 </defs>${(art[id]||art.sword)()}</svg>`;
 return markup.replace(/id="([a-z]+)"/g,(_,name)=>`id="${uid}${name}"`).replace(/url\(#([a-z]+)\)/g,(_,name)=>`url(#${uid}${name})`);
}
