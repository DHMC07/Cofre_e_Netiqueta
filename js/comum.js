/* =====================================================================
   O Cofre Secreto · funções partilhadas pela página dos alunos e pelo
   painel do professor (desenhos, cadeado, receita).
   ===================================================================== */
"use strict";
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const starsTxt=n=>'★'.repeat(n)+'☆'.repeat(3-n);
const ING=[['len','Pelo menos {n} caracteres'],['up','Uma letra MAIÚSCULA'],['low','Uma letra minúscula'],['num','Um número'],['sym','Um símbolo (! # * @ …)'],['safe','Sem o teu nome nem coisas fáceis (123, abc, aaa)']];
const LVLNAME=['','Fraca','Média','Forte'];
const MISS_INFO=[['m1','Níveis de Segurança',1],['m2','Netiqueta',2],['m3','O que farias tu?',3],['m4','Cadeado Mágico',4],['m5','Promessa',5]];

// ═══════════ ILUSTRAÇÕES ═══════════
const COLS=[['#E05A47','vermelho'],['#F28C38','laranja'],['#F4C93D','amarelo'],['#2FA36B','verde'],['#2F7DE1','azul'],['#8A55E0','roxo'],['#EC6FAE','cor-de-rosa'],['#2A3B5C','azul-noite']];
const SHAPES=['Clássico','Redondo','Coração','Escudo'];
const STK=['⭐','🦁','🚀','🌈','🐉','⚽','🦄','🍕'];
function shade(h,f){const n=parseInt(h.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(x=>Math.max(0,Math.min(255,Math.round(x*f))).toString(16).padStart(2,'0')).join('');}
function bodyShape(s){return ['<rect x="30" y="95" width="140" height="112" rx="22"/>','<circle cx="100" cy="152" r="62"/>',
  '<path d="M100 212 C40 174 20 130 46 104 C66 86 92 94 100 116 C108 94 134 86 154 104 C180 130 160 174 100 212 Z"/>',
  '<path d="M32 95 H168 V140 C168 178 138 199 100 213 C62 199 32 178 32 140 Z"/>'][s]||'';}
const spark=(x,y,r,c)=>`<path d="M${x} ${y-r} Q${x} ${y} ${x+r} ${y} Q${x} ${y} ${x} ${y+r} Q${x} ${y} ${x-r} ${y} Q${x} ${y} ${x} ${y-r}Z" fill="${c||'#E9A93A'}"/>`;
let GID=0;
function lockSVG(o,opts){opts=opts||{};const shp=+o.shape||0;const c=o.hex||(COLS[+o.color]||COLS[4])[0];const d=shade(c,.66),l=shade(c,1.18);const st=STK[+o.sticker];const g='lg'+(++GID);
  const ty=shp===2?146:shp===3?148:154;
  return `<svg viewBox="0 0 200 225" role="img" aria-label="Cadeado ${esc(SHAPES[shp])}"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${c}"/></linearGradient><linearGradient id="${g}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA5B6"/><stop offset=".5" stop-color="#E4E9F0"/><stop offset="1" stop-color="#8590A2"/></linearGradient></defs>`
   +`<ellipse cx="100" cy="216" rx="64" ry="7" fill="#000" opacity=".1"/>`
   +`<path d="M62 106 V70 a38 38 0 0 1 76 0 V106" fill="none" stroke="#6E7A8D" stroke-width="20" stroke-linecap="round"/><path d="M62 106 V70 a38 38 0 0 1 76 0 V106" fill="none" stroke="url(#${g}s)" stroke-width="14" stroke-linecap="round"/>`
   +`<g fill="url(#${g})" stroke="${d}" stroke-width="6" stroke-linejoin="round">${bodyShape(shp)}</g>`
   +`<ellipse cx="${shp===1?66:60}" cy="122" rx="14" ry="7" fill="#fff" opacity=".4" transform="rotate(-28 60 122)"/>`
   +(st!=null?`<circle cx="100" cy="${ty}" r="33" fill="#fff" opacity=".9"/><text x="100" y="${ty+2}" text-anchor="middle" dominant-baseline="middle" font-size="42">${st}</text>`:`<circle cx="100" cy="${ty-6}" r="10" fill="${d}"/><rect x="95" y="${ty-2}" width="10" height="22" rx="4" fill="${d}"/>`)
   +(opts.sparkle?spark(22,40,10)+spark(178,58,8)+spark(184,190,11)+spark(14,196,7,'#fff'):'')+`</svg>`;}
function nestLock(o,x,y,w){return lockSVG(o).replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${w*1.125}" `);}
// cadeado pequeno do mapa: aberto ou fechado
function badge(c,open,txt){
  return `<svg class="lb" viewBox="0 0 64 74" aria-hidden="true"><path d="${open?'M19 26 V16 a13 13 0 0 1 26 0 V12':'M19 36 V24 a13 13 0 0 1 26 0 V36'}" fill="none" stroke="#7F8A9C" stroke-width="7" stroke-linecap="round"${open?' transform="rotate(-14 19 30)"':''}/>`
   +`<rect x="7" y="32" width="50" height="38" rx="11" style="fill:${open?c:'#9AA6B2'}"/><rect x="7" y="32" width="50" height="12" rx="6" fill="#fff" opacity=".18"/>`
   +(open?`<text x="32" y="60" text-anchor="middle" font-family="Baloo 2,Nunito,sans-serif" font-weight="800" font-size="24" fill="#fff">${txt}</text>`:`<circle cx="32" cy="48" r="5" fill="#5E6B7A"/><rect x="29.5" y="50" width="5" height="11" rx="2" fill="#5E6B7A"/>`)+`</svg>`;}
// meninos e meninas das histórias
const SKIN=['#5C3A21','#8D5524','#B9773E','#D9A066','#F1C27D'];
function kid(o){const s=SKIN[o.sk],h=o.hc||'#22150C',sh=o.sh,m=o.m||'ok',ink='#1B1B1B';
  let back='',front='';
  if(o.hs==='long')back=`<path d="M27 60 C24 22 96 22 93 60 L98 108 C84 116 36 116 22 108Z" fill="${h}"/>`;
  if(o.hs==='pony')back=`<ellipse cx="97" cy="58" rx="13" ry="22" fill="${h}"/><circle cx="90" cy="40" r="5" fill="#E05A47"/>`;
  if(o.hs==='puffs')back=`<circle cx="28" cy="34" r="17" fill="${h}"/><circle cx="92" cy="34" r="17" fill="${h}"/>`;
  if(o.hs==='curly'){for(let a=190;a<=350;a+=20){const r=a*Math.PI/180;front+=`<circle cx="${(60+29*Math.cos(r)).toFixed(1)}" cy="${(56+27*Math.sin(r)).toFixed(1)}" r="11" fill="${h}"/>`;}front+=`<ellipse cx="60" cy="36" rx="24" ry="10" fill="${h}"/>`;}
  else front=`<path d="M29 62 C24 24 96 24 91 62 C87 46 76 39 60 39 C45 39 33 46 29 62Z" fill="${h}"/>`+(o.hs==='short'?`<path d="M44 40 Q54 30 70 36" fill="none" stroke="${shade(h,1.6)}" stroke-width="3" opacity=".35"/>`:'');
  const E=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r||3.8}" fill="${ink}"/><circle cx="${x+1.2}" cy="${y-1.3}" r="1.2" fill="#fff"/>`;
  const P=(d,w)=>`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w||3.2}" stroke-linecap="round"/>`;
  const face={
    ok:E(49,62)+E(71,62)+P('M51 74 Q60 81 69 74'),
    happy:P('M44 63 q5 -6 10 0')+P('M66 63 q5 -6 10 0')+`<path d="M49 72 Q60 86 71 72Z" fill="${ink}"/><path d="M53 78 Q60 82 67 78" fill="#E86A6A"/>`,
    sad:E(49,63)+E(71,63)+P('M43 55 L53 52')+P('M77 55 L67 52')+P('M52 79 Q60 73 68 79'),
    angry:E(49,64)+E(71,64)+P('M42 53 L54 58',3.6)+P('M78 53 L66 58',3.6)+P('M52 79 Q60 74 68 79'),
    wow:E(49,61,4.6)+E(71,61,4.6)+P('M44 52 q5 -4 10 0')+P('M66 52 q5 -4 10 0')+`<ellipse cx="60" cy="77" rx="4.5" ry="6" fill="${ink}"/>`,
    think:E(51,60)+E(73,60)+P('M66 51 q6 -4 12 0')+P('M54 77 Q60 75 66 76'),
    cheeky:P('M44 62 q5 -5 10 0')+E(71,62)+P('M51 73 Q62 82 71 71')};
  return `<svg viewBox="0 0 120 130" aria-hidden="true">${back}<path d="M16 130 C16 103 37 93 60 93 C83 93 104 103 104 130Z" fill="${sh}"/><path d="M45 95 Q60 108 75 95" fill="none" stroke="${shade(sh,.72)}" stroke-width="5"/><rect x="52" y="80" width="16" height="16" rx="6" fill="${shade(s,.9)}"/><circle cx="30" cy="64" r="7.5" fill="${s}"/><circle cx="90" cy="64" r="7.5" fill="${s}"/><circle cx="60" cy="61" r="31" fill="${s}"/>${front}${face[m]||face.ok}<ellipse cx="42" cy="72" rx="5.5" ry="3.2" fill="#F07C7C" opacity=".4"/><ellipse cx="78" cy="72" rx="5.5" ry="3.2" fill="#F07C7C" opacity=".4"/></svg>`;}
function heroSVG(){
  let t='';for(let i=0;i<40;i++){const a=i*Math.PI/20,r1=i%5?33:29,r2=37;t+=`<line x1="${(190+r1*Math.cos(a)).toFixed(1)}" y1="${(128+r1*Math.sin(a)).toFixed(1)}" x2="${(190+r2*Math.cos(a)).toFixed(1)}" y2="${(128+r2*Math.sin(a)).toFixed(1)}" stroke="#8A5A0E" stroke-width="${i%5?1.4:2.6}"/>`;}
  return `<svg viewBox="0 0 360 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
   <linearGradient id="hbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7EFE7"/><stop offset="1" stop-color="#BFE0D4"/></linearGradient>
   <linearGradient id="hsafe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A5A88"/><stop offset=".55" stop-color="#22385A"/><stop offset="1" stop-color="#16263F"/></linearGradient>
   <linearGradient id="hdoor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A6C9C"/><stop offset="1" stop-color="#26406A"/></linearGradient>
   <radialGradient id="hdial" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFE7AE"/><stop offset=".55" stop-color="#E9A93A"/><stop offset="1" stop-color="#A86F12"/></radialGradient>
   <radialGradient id="hglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient></defs>
   <rect width="360" height="270" fill="url(#hbg)"/><circle cx="300" cy="54" r="70" fill="url(#hglow)"/>
   <path d="M0 232 H360 V270 H0Z" fill="#A9D2C3"/><ellipse cx="190" cy="236" rx="118" ry="12" fill="#1F3350" opacity=".18"/>
   <rect x="94" y="30" width="194" height="196" rx="26" fill="url(#hsafe)"/><rect x="94" y="30" width="194" height="20" rx="10" fill="#fff" opacity=".07"/>
   <rect x="108" y="44" width="166" height="168" rx="16" fill="url(#hdoor)" stroke="#E9A93A" stroke-width="4"/>
   <rect x="100" y="78" width="12" height="34" rx="5" fill="#E9A93A"/><rect x="100" y="160" width="12" height="34" rx="5" fill="#E9A93A"/>
   ${[[124,60],[258,60],[124,196],[258,196]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="#F4C66E"/><circle cx="${x-1}" cy="${y-1}" r="2" fill="#fff" opacity=".6"/>`).join('')}
   <circle cx="190" cy="128" r="52" fill="#1A2C47"/><circle cx="190" cy="128" r="45" fill="url(#hdial)"/>${t}
   <circle cx="190" cy="128" r="20" fill="#1F3350"/><circle cx="190" cy="128" r="14" fill="url(#hdial)"/><path d="M190 70 l-7 -11 h14z" fill="#D9473A"/>
   <g stroke="#E9A93A" stroke-width="6" stroke-linecap="round"><line x1="252" y1="110" x2="252" y2="146"/><line x1="240" y1="128" x2="264" y2="128"/></g><circle cx="252" cy="128" r="6" fill="#F4C66E"/>
   <path d="M118 52 L160 52 L120 200 Z" fill="#fff" opacity=".05"/>
   <rect x="110" y="224" width="30" height="12" rx="4" fill="#16263F"/><rect x="242" y="224" width="30" height="12" rx="4" fill="#16263F"/>
   ${nestLock({shape:2,color:3,sticker:0},10,108,86)}
   <g transform="translate(300 160) rotate(32)"><circle r="17" fill="none" stroke="#E9A93A" stroke-width="9"/><circle r="17" fill="none" stroke="#FFE3A3" stroke-width="3" stroke-dasharray="10 40"/><rect x="13" y="-5" width="44" height="10" rx="4" fill="#E9A93A"/><rect x="42" y="3" width="7" height="13" rx="2" fill="#E9A93A"/><rect x="30" y="3" width="6" height="10" rx="2" fill="#E9A93A"/></g>
   <g transform="translate(26 30) rotate(-8)"><rect width="104" height="34" rx="9" fill="#fff" stroke="#E9A93A" stroke-width="3" stroke-dasharray="6 4"/><text x="52" y="23" text-anchor="middle" font-family="Lexend,Nunito,sans-serif" font-weight="700" font-size="15" fill="#1F3350">L●●●#3●●●!</text></g>
   ${spark(320,104,11)}${spark(70,206,9,'#fff')}${spark(334,222,9)}${spark(150,16,8)}</svg>`;}
function art(k){
  let s='<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  const bg=c=>`<rect width="360" height="260" fill="${c}"/>`;
  if(k==='lvl'){s+=bg('#D5EFE8');
    [['#D9473A',30],['#F2B33D',140],['#1E8E5A',250]].forEach(([c,x],i)=>{s+=nestLock({shape:0,hex:c,sticker:-1},x,30,80);
      s+=`<rect x="${x+6}" y="140" width="68" height="14" rx="7" fill="#fff"/><rect x="${x+6}" y="140" width="${22*(i+1)+2}" height="14" rx="7" fill="${c}"/>`;});
    s+=`<rect x="34" y="182" width="292" height="48" rx="14" fill="#fff" stroke="#E9A93A" stroke-width="4" stroke-dasharray="8 6"/><text x="180" y="214" text-anchor="middle" font-family="Lexend,Nunito,sans-serif" font-weight="700" font-size="22" fill="#16263A">Leao#3Bananas</text>`;}
  else if(k==='net'){s+=bg('#EEE6FC');
    s+=`<path d="M28 40 h176 a18 18 0 0 1 18 18 v54 a18 18 0 0 1 -18 18 h-130 l-24 22 v-22 h-22 a18 18 0 0 1 -18 -18 v-54 a18 18 0 0 1 18 -18z" fill="#fff" stroke="#7A49D6" stroke-width="4"/><text x="46" y="94" font-family="Nunito,sans-serif" font-weight="900" font-size="25" fill="#16263A">Olá! 👋 Por favor…</text>`
     +`<path d="M332 130 h-176 a18 18 0 0 0 -18 18 v54 a18 18 0 0 0 18 18 h130 l24 22 v-22 h22 a18 18 0 0 0 18 -18 v-54 a18 18 0 0 0 -18 -18z" fill="#7A49D6"/><text x="160" y="184" font-family="Nunito,sans-serif" font-weight="900" font-size="25" fill="#fff">Obrigado! 😊</text>`
     +`<path d="M302 62 c-10 -16 -32 -6 -22 12 l22 22 l22 -22 c10 -18 -12 -28 -22 -12z" fill="#E05A47"/>`+spark(258,36,10);}
  else if(k==='cen'){s+=bg('#FCEFD3');
    s+=`<g transform="translate(14 40) scale(1.45)">${kid({sk:1,hs:'short',sh:'#2F7DE1',m:'think'}).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>`;
    [['#1E8E5A','✓',44],['#fff','',104],['#fff','',164]].forEach(([c,t,y])=>{s+=`<rect x="190" y="${y}" width="150" height="46" rx="14" fill="${c}" stroke="#B86F08" stroke-width="3"/><rect x="206" y="${y+18}" width="${t?84:100}" height="10" rx="5" fill="${t?'#fff':'#E9D3A8'}"/>`+(t?`<text x="314" y="${y+32}" font-size="24" font-weight="900" fill="#fff" font-family="Nunito,sans-serif">✓</text>`:'');});
    s+=`<circle cx="176" cy="40" r="22" fill="#fff" stroke="#B86F08" stroke-width="3"/><text x="176" y="51" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="30" fill="#B86F08">?</text>`;}
  else if(k==='lock'){s+=bg('#DFE8F7');s+=nestLock({shape:3,color:5,sticker:4},110,20,150)+spark(70,60,14)+spark(296,76,10)+spark(300,214,13)+spark(60,200,9,'#fff');}
  else if(k==='oath'){s+=bg('#FBE3DC');
    s+=`<rect x="80" y="30" width="200" height="200" rx="16" fill="#FFFDF7" stroke="#D2513A" stroke-width="4"/><rect x="66" y="22" width="228" height="22" rx="11" fill="#D2513A"/><rect x="66" y="216" width="228" height="22" rx="11" fill="#D2513A"/>`;
    for(let i=0;i<5;i++)s+=`<rect x="108" y="${70+i*26}" width="${i===4?90:144}" height="9" rx="4.5" fill="#E8C3B8"/>`;
    s+=`<circle cx="256" cy="190" r="30" fill="#E9A93A" stroke="#A86F12" stroke-width="4"/><text x="256" y="201" text-anchor="middle" font-size="30">🔒</text>`+spark(40,60,12)+spark(318,90,10);}
  return s+'</svg>';
}
function sealSVG(){let r='';for(let i=0;i<16;i++){const a=i*Math.PI/8;r+=`<circle cx="${(50+38*Math.cos(a)).toFixed(1)}" cy="${(50+38*Math.sin(a)).toFixed(1)}" r="10" fill="#E9A93A"/>`;}
  return `<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M30 80 L22 118 L40 108 L50 120 L56 84Z" fill="#D2513A"/><path d="M70 80 L78 118 L60 108 L50 120 L44 84Z" fill="#B8402B"/>${r}<circle cx="50" cy="50" r="36" fill="#F4C66E" stroke="#A86F12" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="none" stroke="#A86F12" stroke-width="2" stroke-dasharray="3 3"/><text x="50" y="62" text-anchor="middle" font-size="32">🔐</text></svg>`;}
function vaultSVG(){let t='';for(let i=0;i<24;i++){const a=i*Math.PI/12;t+=`<line x1="${(110+26*Math.cos(a)).toFixed(1)}" y1="${(99+26*Math.sin(a)).toFixed(1)}" x2="${(110+31*Math.cos(a)).toFixed(1)}" y2="${(99+31*Math.sin(a)).toFixed(1)}" stroke="#8A5A0E" stroke-width="2"/>`;}
  return `<svg viewBox="0 0 220 200" aria-hidden="true"><rect x="18" y="12" width="184" height="176" rx="24" fill="#1F3350"/><rect x="34" y="28" width="152" height="142" rx="14" fill="#0E1A2C"/>
   <g class="loot"><circle cx="110" cy="99" r="56" fill="#E9A93A" opacity=".28"/><text x="110" y="92" text-anchor="middle" font-size="44">⭐</text><text x="78" y="140" text-anchor="middle" font-size="26">🪙</text><text x="142" y="140" text-anchor="middle" font-size="26">💎</text><text x="110" y="148" text-anchor="middle" font-size="22">🪙</text></g>
   <g class="door"><rect x="34" y="28" width="152" height="142" rx="14" fill="#33507E" stroke="#E9A93A" stroke-width="4"/><g class="dial"><circle cx="110" cy="99" r="34" fill="#E9A93A"/><circle cx="110" cy="99" r="31" fill="#F7D387"/>${t}<circle cx="110" cy="99" r="11" fill="#1F3350"/><rect x="107" y="68" width="6" height="14" rx="3" fill="#1F3350"/></g></g></svg>`;}
