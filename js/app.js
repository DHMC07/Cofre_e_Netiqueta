/* =====================================================================
   O Cofre Secreto · página dos alunos (TIC 4.º ano)
   Funciona com o Firebase (js/nuvem.js) e, se não houver ligação,
   continua a funcionar só neste computador.
   ===================================================================== */
"use strict";
// ═══════════ CONFIGURAÇÃO ═══════════
const IDS=['m1','m2','m3','m4','m5'];
const CONF=window.CONFIG||{};
const MED=Object.assign({leituraFacil:true,menos:true,tempo:true,cadeado:true,estrelas:true},CONF.medidas||{});
const CFG={turmas:(CONF.turmas&&CONF.turmas.length)?CONF.turmas:['4.º A','4.º B','4.º C','4.º D','4.º E','4.º F','4.º G','4.º H','4.º I'],
  univ:{leitura:MED.leituraFacil!==false},selOpts:{menos:!!MED.menos,tempo:!!MED.tempo,cadeado:!!MED.cadeado,estrelas:!!MED.estrelas}};
const FB_CONFIGURADO=!!(CONF.firebase&&CONF.firebase.apiKey&&!String(CONF.firebase.apiKey).startsWith('COLE'));
const LSget=k=>{try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const LSdel=k=>{try{localStorage.removeItem(k);}catch(e){}};
const $=id=>document.getElementById(id);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const today=()=>new Date().toLocaleDateString('pt-PT');
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2600);}
function setAcc(n){document.documentElement.style.setProperty('--acc',`var(--m${n})`);document.documentElement.style.setProperty('--accs',`var(--m${n}s)`);}
let actx=null;
function beep(f,d){f=f||660;d=d||.15;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.12,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+d);o.start();o.stop(actx.currentTime+d);}catch(e){}}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=$('confetti'),cols=['#0E7C66','#E9A93A','#7A49D6','#2F5DA8','#D2513A','#1E8E5A'];
  for(let i=0;i<70;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'vw';s.style.background=cols[i%cols.length];s.style.animationDelay=Math.random()*.6+'s';s.style.animationDuration=(1.8+Math.random()*1.4)+'s';c.appendChild(s);}
  setTimeout(()=>c.innerHTML='',3600);}
function closeModal(){$('modal').classList.remove('on');}

// ═══════════ MEDIDAS UNIVERSAIS E SELETIVAS ═══════════
// As medidas seletivas ligam-se no painel do professor (ou com o link terminado em #apoio).
let REMOTE_APOIO=false;
const apoioLink=()=>location.hash.replace('#','').toLowerCase()==='apoio';
function apoioOn(k){return !!S.apoio&&(!k||!!CFG.selOpts[k]);}
const starsFromErrors=(e,a,b)=>{if(apoioOn('estrelas'))e=Math.floor(e/2);return e<=a?3:e<=b?2:1;};
async function detectApoio(){S.apoio=apoioLink()||REMOTE_APOIO;applyEasy();}
function applyEasy(){const v=LSget('cof4:easy');const allowed=CFG.univ.leitura||!!S.apoio;
  const on=allowed&&(v===null?!!S.apoio:!!v);document.body.classList.toggle('easy',on);
  const b=$('easyBtn');if(b){b.classList.toggle('hidden',!allowed);b.setAttribute('aria-pressed',on?'true':'false');}}
// (sem leitura em voz alta)
const sayOn=()=>false;function speak(){}function stopSpeak(){}function autoRead(){}
$('easyBtn').onclick=()=>{LSset('cof4:easy',!document.body.classList.contains('easy'));applyEasy();};
window.addEventListener('hashchange',()=>{if(S.name)detectApoio();});

// ═══════════ LIGAÇÃO AO FIREBASE ═══════════
// O progresso do aluno vai para o Firebase sempre que muda de passo ou termina uma missão.
// Cada aluno tem um registo com o nome dele e a turma. Se sair da página, mudar de computador
// ou o navegador apagar os dados, basta voltar a escrever o mesmo nome e turma para continuar.
let NUVEM=null,ABERTAS=null,CTL_WAIT=FB_CONFIGURADO,stopReg=null,stopCtl=null,EXISTE=false,LIGADO=false,NETST=FB_CONFIGURADO?'sync':'off',PASSO='No mapa',HOME_MSG='';
const tid=t=>String(t).replace(/[^A-Za-z0-9]/g,'').slice(0,20)||'turma';
const idAluno=(n,t)=>(tid(t)+'_'+norm(n).replace(/ /g,'-')).slice(0,80);
const netTxt=()=>({ok:'☁️ Guardado',sync:'☁️ A ligar…',erro:'📴 Sem ligação: o trabalho fica guardado neste computador'})[NETST]||'';
function setNet(s){NETST=s;const el=$('net');if(el)el.textContent=netTxt();}
if(FB_CONFIGURADO){
  import(new URL('js/nuvem.js',document.baseURI).href).then(m=>{
    if(!m.ativo){CTL_WAIT=false;setNet('off');refreshMap();return;}
    NUVEM=m;m.vigiarConfig(c=>{if(c&&c.medidas){Object.assign(CFG.selOpts,c.medidas);if('leituraFacil' in c.medidas)CFG.univ.leitura=!!c.medidas.leituraFacil;applyEasy();}});
    ligar();
  }).catch(e=>{console.warn('Sem ligação ao Firebase:',e);CTL_WAIT=false;setNet('erro');refreshMap();});
}
function refreshMap(){if(S.screen==='map')renderMap();}
function estado(){
  const c=S.cur?{id:S.cur.id,step:S.cur.step||0,ok:(S.cur.ok||[]).slice(0,5),draft:S.draft||null}:null;
  return {prog:S.prog,passo:String(PASSO).slice(0,60),cur:c,cadeado:(S.prog.m4&&S.prog.m4.c)||null,estrelas:totalStars(),concluido:allDone()};}
// junta o progresso deste computador com o que está no Firebase (fica sempre o melhor)
function juntar(rp){let novo=false;
  IDS.forEach(k=>{const r=rp&&rp[k],l=S.prog[k];if(!r||!r.done)return;
    if(!l||!l.done){S.prog[k]=JSON.parse(JSON.stringify(r));novo=true;}
    else if((r.stars||0)>(l.stars||0)){l.stars=r.stars;if(r.c)l.c=r.c;}});
  return novo;}
let aLigar=null;
async function ligar(){
  if(!NUVEM||!S.name||!S.key||S.valid)return;
  if(aLigar)return aLigar;
  const quem=S.key;
  aLigar=(async()=>{
    try{
      if(!S.docId){S.docId=idAluno(S.name,S.turma);save();}
      let d=await NUVEM.ler(S.docId);
      if(quem!==S.key)return;
      if(d&&d.estado==='movido'&&d.movidoPara){mudouTurma(d);return;}
      if(d&&d.estado==='validado'){juntar(d.prog);validado(d);return;}
      EXISTE=!!d;
      if(d){
        const vazio=!IDS.some(k=>(S.prog[k]||{}).done)&&!S.cur;
        const novo=juntar(d.prog);
        if(!S.cur&&d.cur&&d.cur.id&&!(S.prog[d.cur.id]||{}).done)S.cur={id:d.cur.id,step:d.cur.step||0,ok:d.cur.ok||[],d:{err:0}};
        if(!S.draft&&d.cur&&d.cur.draft)S.draft=d.cur.draft;
        if(d.nome&&d.nome!==S.name){S.name=d.nome;LSset('cof4:sess',{name:S.name,turma:S.turma});}
        REMOTE_APOIO=!!d.apoio;save();detectApoio();
        if(vazio&&(novo||S.cur)){toast('✅ Encontrámos o teu trabalho. Continua onde paraste!');}
        if(S.screen==='map')renderMap();
      }
      LIGADO=true;vigiar();await sync();
    }catch(e){console.warn('Não foi possível ligar ao Firebase:',e&&e.code,e);setNet('erro');CTL_WAIT=false;refreshMap();}
  })().finally(()=>{aLigar=null;});
  return aLigar;
}
async function sync(){
  if(!NUVEM||!S.name||!S.key||S.valid)return;
  if(!LIGADO){ligar();return;}
  try{
    if(!EXISTE){await NUVEM.criar(S.docId,Object.assign({nome:S.name.slice(0,60),nomeNorm:norm(S.name).slice(0,60),turma:S.turma},estado()));EXISTE=true;}
    else await NUVEM.guardar(S.docId,estado());
    setNet('ok');
  }catch(e){console.warn('Não foi possível guardar no Firebase:',e&&e.code,e);setNet('erro');}
}
let passoT=null;
function syncPasso(t){PASSO=t;clearTimeout(passoT);passoT=setTimeout(sync,600);}
function pararVigia(){stopReg&&stopReg();stopCtl&&stopCtl();stopReg=stopCtl=null;LIGADO=false;EXISTE=false;}
function vigiar(){
  if(!NUVEM||!S.name)return;stopReg&&stopReg();stopCtl&&stopCtl();
  let primeiro=true;
  stopCtl=NUVEM.vigiarControlo(tid(S.turma),a=>{
    const era=CTL_WAIT;CTL_WAIT=false;ABERTAS=a;if(a===null)setNet('erro');
    if(S.screen==='map'){renderMap();if((era||primeiro)&&S.cur&&isOpen(S.cur.id))openMission(S.cur.id);}
    primeiro=false;});
  stopReg=NUVEM.vigiarRegisto(S.docId,d=>{
    if(d===undefined)return; // erro de leitura: tenta mais tarde
    if(d===null){if(EXISTE)apagadoPeloProfessor();return;}
    EXISTE=true;
    if(d.estado==='movido'&&d.movidoPara){mudouTurma(d);return;}
    const ap=!!d.apoio;if(ap!==REMOTE_APOIO){REMOTE_APOIO=ap;detectApoio();refreshMap();}
    if(d.estado==='validado'&&!S.valid)validado(d);
  });
}
addEventListener('online',()=>sync());
// O professor mudou o aluno de turma: continua com o mesmo trabalho na turma certa.
function mudouTurma(d){
  const t=d.turmaNova;if(!t){apagadoPeloProfessor();return;}
  const keep={prog:S.prog,cur:S.cur,draft:S.draft};
  LSdel('cof4:p:'+S.key);pararVigia();
  S.turma=t;S.key=norm(S.name)+'|'+t;S.docId=d.movidoPara;Object.assign(S,keep);save();LSset('cof4:sess',{name:S.name,turma:t});
  ABERTAS=null;CTL_WAIT=true;cur=null;closeModal();toast('O professor mudou-te para a turma '+t+'.');
  renderMap();ligar();
}
// O professor validou: mostra o certificado e apaga os dados deste computador.
function validado(d){
  let data=today();try{if(d.validadoEm&&d.validadoEm.toDate)data=d.validadoEm.toDate().toLocaleDateString('pt-PT');}catch(e){}
  S.valid={data,ap:d.apreciacao||''};
  LSdel('cof4:p:'+S.key);LSdel('cof4:help:'+S.key);LSdel('cof4:sess');S.key='';pararVigia();cur=null;closeModal();
  confetti();beep(880,.3);renderCert();
}
// O professor eliminou o registo: o aluno volta ao início.
function apagadoPeloProfessor(){
  LSdel('cof4:p:'+S.key);LSdel('cof4:sess');pararVigia();
  Object.assign(S,{name:'',turma:'',key:'',prog:{},cur:null,draft:null,valid:null,docId:null});cur=null;PW='';closeModal();
  HOME_MSG='O professor apagou o teu registo. Escreve o teu nome e escolhe a turma certa para começar.';renderHome();
}

// ═══════════ RESPOSTAS: ACERTO E ERRO ═══════════
let AUTO=null;
function okNext(box,html,fn,ms){
  clearTimeout(AUTO);ms=ms||2200;const manual=apoioOn('tempo');beep(760);
  box.innerHTML=`<div class="feedback ok auto"><span>${html}</span><button class="btn small okb" id="nx">Continuar ▸</button>${manual?'':`<div class="autobar" aria-hidden="true"><i style="animation-duration:${ms}ms"></i></div>`}</div>`;
  box.scrollIntoView({block:'nearest',behavior:'smooth'});
  let done=false;const go=()=>{if(done)return;done=true;clearTimeout(AUTO);fn();};
  $('nx').onclick=go;if(manual){$('nx').focus();return;}AUTO=setTimeout(go,ms);
  const f=box.querySelector('.feedback');f.onmouseenter=()=>{clearTimeout(AUTO);f.classList.add('paused');};
}
function badMsg(box,html){clearTimeout(AUTO);beep(220,.12);box.innerHTML=`<div class="feedback bad"><span>${html}</span></div>`;box.scrollIntoView({block:'nearest',behavior:'smooth'});}
const TRY=['Ainda não. Lê outra vez com atenção e tenta de novo!','Quase! Pensa mais um bocadinho e escolhe outra.','Essa não é. Tenta outra vez!'];
const tryAgain=()=>TRY[Math.floor(Math.random()*TRY.length)];

// ═══════════ A RECEITA DA PALAVRA-PASSE FORTE ═══════════
const minLen=()=>apoioOn('cadeado')?8:10;
function crit(pw,name,ml){ml=ml||10;const n=norm(pw).replace(/ /g,'');
  const parts=norm(name).split(' ').filter(w=>w.length>=3);
  const easy=/(012|123|234|345|456|567|678|789|abc|bcd|qwe|asd|password|senha|palavrapasse)/i.test(n)||/(.)\1\1/.test(pw);
  return {len:pw.length>=ml,up:/[A-ZÀ-Ý]/.test(pw),low:/[a-zß-ÿ]/.test(pw),num:/[0-9]/.test(pw),sym:/[^A-Za-zÀ-ÿ0-9\s]/.test(pw),safe:pw.length>0&&!easy&&!parts.some(w=>n.includes(w))};}
const critCount=c=>ING.filter(([k])=>c[k]).length;
const levelOf=c=>{const n=critCount(c);return n>=6?3:n>=4?2:1;};
function ingsHtml(c,ml){return `<div class="ings">${ING.map(([k,l])=>`<span class="${c[k]?'y':'n'}">${c[k]?'✓':'✗'} ${esc(l.replace('{n}',ml))}</span>`).join('')}</div>`;}

// ═══════════ CONTEÚDOS ═══════════
const RECEITA=[
  {em:'📏',b:'Comprida',ex:'10+',s:'Pelo menos 10 caracteres'},
  {em:'🔠',b:'MAIÚSCULA',ex:'A B C',s:'Pelo menos uma'},
  {em:'🔡',b:'minúscula',ex:'a b c',s:'Pelo menos uma'},
  {em:'🔢',b:'Número',ex:'1 2 3',s:'Pelo menos um'},
  {em:'✳️',b:'Símbolo',ex:'! # @ *',s:'Pelo menos um'},
  {em:'🙈',b:'Secreta',ex:'sem nome',s:'Nada de nomes, datas ou 123'}];
const LVLS=[
  {p:'123456',a:'f',why:'É a palavra-passe mais usada no mundo. Adivinha-se num segundo!'},
  {p:'bobby',a:'f',why:'É o nome de um cão. Quem te conhece ou vê as tuas fotos consegue adivinhar.'},
  {p:'joana2016',a:'f',why:'Nome e ano de nascimento são fáceis de descobrir.'},
  {p:'aaaaaa',a:'f',why:'Repetir a mesma letra não protege nada.'},
  {p:'futebol',a:'f',why:'É só uma palavra conhecida, toda em minúsculas.'},
  {p:'Gato2024',a:'m',why:'Tem maiúscula e números, mas é curta e não tem símbolo.'},
  {p:'Cenoura7',a:'m',why:'Tem maiúscula e um número, mas falta um símbolo e é curta.'},
  {p:'Pizza#lua',a:'m',why:'Tem maiúscula e símbolo, mas falta um número e é curta.'},
  {p:'Lua!Azul',a:'m',why:'Mistura maiúsculas e um símbolo, mas é curta e não tem números.'},
  {p:'Leao#Come3Bananas',a:'F',why:'Tem os ingredientes todos: é comprida e mistura maiúsculas, minúsculas, número e símbolo.'},
  {p:'Nuvem!Azul+42Patos',a:'F',why:'Comprida e cheia de ingredientes. Muito difícil de adivinhar!'},
  {p:'Foguete@Voa9Alto',a:'F',why:'Junta palavras que não combinam, um número e um símbolo. Forte!'},
  {p:'Pinguim$Toca8Piano',a:'F',why:'Uma frase maluca com maiúsculas, número e símbolo. Fortíssima!'}];
const NET=[
  {t:'Dizer «olá», «por favor» e «obrigado» nas mensagens.',a:'b',i:'👋',why:'Ser simpático online é tão importante como cara a cara.'},
  {t:'Escrever TUDO EM MAIÚSCULAS no chat.',a:'m',i:'📢',why:'Online, as maiúsculas parecem gritos.'},
  {t:'Pedir autorização antes de publicar a foto de um colega.',a:'b',i:'📸',why:'A imagem de cada pessoa é dela. Pergunta sempre primeiro.'},
  {t:'Responder a um insulto com outro insulto.',a:'m',i:'😡',why:'Só piora a situação. Ignora, bloqueia e conta a um adulto.'},
  {t:'Ler a mensagem outra vez antes de a enviar.',a:'b',i:'👀',why:'Assim evitas erros e frases que podem magoar alguém.'},
  {t:'Enviar a mesma mensagem muitas vezes seguidas.',a:'m',i:'🔁',why:'Isso chama-se «spam» e incomoda toda a gente.'},
  {t:'Contar a um adulto quando alguém te trata mal online.',a:'b',i:'🧑‍🏫',why:'Um adulto de confiança ajuda-te a resolver o problema.'},
  {t:'Dizer online coisas que não dirias cara a cara.',a:'m',i:'🙊',why:'Do outro lado do ecrã está uma pessoa real, com sentimentos.'},
  {t:'Partilhar a palavra-passe com o melhor amigo.',a:'m',i:'🔑',why:'As palavras-passe são secretas. Só tu e os teus pais as devem saber.'},
  {t:'Usar um emoji para mostrar que estás a brincar.',a:'b',i:'😉',why:'Ajuda os outros a perceber o teu tom e evita mal-entendidos.'},
  {t:'Deixar um colega de fora do jogo de propósito.',a:'m',i:'🚫',why:'Excluir alguém de propósito magoa. Online também se é amigo.'},
  {t:'Esperar pela tua vez e respeitar as regras do jogo online.',a:'b',i:'🎮',why:'Jogar limpo torna o jogo divertido para todos.'}];
const POLITE=[
  {r:'DÁ-ME O TEU LÁPIS JÁ!!!',a:['Olá! Podes emprestar-me o teu lápis, por favor? 🙂','Dá-me o lápis senão conto à professora!','LÁPIS!!! AGORA!!!'],why:'Sem gritos (maiúsculas) e com «por favor». Muito melhor!'},
  {r:'O teu desenho é horrível 🤮',a:['Gostei das cores! Talvez possas pôr mais detalhes. 😊','Ninguém gosta do teu desenho.','Hahaha, que feio!'],why:'Podes dar a tua opinião sem magoar: diz primeiro o que é bom.'},
  {r:'Sai do jogo, és mesmo mau a jogar!',a:['Boa tentativa! Queres que te explique um truque? 🎮','Vai-te embora, ninguém te quer aqui.','Perdeste outra vez, nabo!'],why:'Ajudar quem está a aprender é jogar limpo.'},
  {r:'Vou pôr a tua foto no grupo e vais ver…',a:['Posso pôr a nossa foto no grupo da turma? 📸','Já pus a tua foto e toda a gente se riu.','Se não fizeres o que eu quero, publico a foto.'],why:'Antes de publicar uma foto de alguém, pede sempre autorização.'}];
const CEN=[
  {id:'A',nm:'João',k:{sk:1,hs:'short',sh:'#2F7DE1',m:'think'},p:'🐶',s:'O João quer criar uma palavra-passe para a conta do seu jogo favorito e decide usar o nome do seu cão: «bobby».',q:'É uma boa ideia?',
   a:['Não. Quem conhece o João ou vê as fotos dele consegue adivinhar.','Sim, porque é um nome bonito e fácil de lembrar.','Sim, desde que escreva o nome todo em minúsculas.'],
   why:'Nomes de animais, de amigos ou datas de anos são fáceis de adivinhar. Uma palavra-passe forte mistura maiúsculas, números e símbolos.'},
  {id:'B',nm:'Ana',k:{sk:3,hs:'long',hc:'#4A2A12',sh:'#E05A47',m:'angry'},p:'🎮',s:'A Ana está a jogar online e um jogador começa a insultá-la no chat porque ela perdeu uma ronda. A Ana fica zangada e insulta-o de volta com palavras feias.',q:'O que devia a Ana ter feito?',
   a:['Ignorar, não responder na mesma moeda, bloquear o jogador e avisar um adulto.','Insultar ainda mais, para ele aprender.','Desligar o computador e não contar a ninguém.'],
   why:'Responder com insultos só piora. Ignorar, bloquear e contar a um adulto de confiança é o mais seguro.'},
  {id:'C',nm:'Pedro',k:{sk:0,hs:'curly',sh:'#2FA36B',m:'cheeky'},p:'🕹️',s:'O Pedro descobriu a palavra-passe do irmão mais velho e entrou na conta dele para lhe mudar a personagem do jogo, por brincadeira.',q:'É correto?',
   a:['Não! A privacidade dos outros respeita-se, mesmo em casa. As palavras-passe são secretas.','Sim, porque é só uma brincadeira.','Sim, porque são irmãos e podem partilhar tudo.'],
   why:'Entrar na conta de outra pessoa sem autorização é errado, mesmo que seja da família.'},
  {id:'D',nm:'Rita',k:{sk:2,hs:'pony',hc:'#1E120A',sh:'#8A55E0',m:'wow'},p:'🎁',s:'A Rita recebe uma mensagem: «Parabéns! Ganhaste um tablet! Envia a tua palavra-passe para receberes o prémio.»',q:'O que deve a Rita fazer?',
   a:['Não responder e mostrar a mensagem a um adulto.','Enviar logo a palavra-passe, para não perder o prémio.','Enviar só metade da palavra-passe.'],
   why:'Ninguém de confiança te pede a palavra-passe por mensagem. Prémios assim costumam ser armadilhas.'},
  {id:'E',nm:'Tiago',k:{sk:4,hs:'short',hc:'#7A4A1E',sh:'#F28C38',m:'ok'},p:'💻',s:'O Tiago usou um computador da biblioteca para ver a sua conta e foi-se embora sem sair dela.',q:'O que se esqueceu de fazer?',
   a:['Terminar a sessão (sair da conta) antes de se ir embora.','Desligar só o ecrã, isso chega.','Nada, o computador guarda tudo em segurança.'],
   why:'Se não saíres da conta, a pessoa seguinte pode entrar como se fosses tu.'},
  {id:'F',nm:'Marta',k:{sk:0,hs:'puffs',sh:'#EC6FAE',m:'happy'},p:'📸',s:'A Marta tirou uma foto engraçada da amiga Inês e quer publicá-la no grupo da turma.',q:'O que deve fazer primeiro?',
   a:['Perguntar à Inês se ela autoriza.','Publicar logo, porque a foto é muito engraçada.','Publicar e só apagar se a Inês se zangar.'],
   why:'Antes de publicar fotos de outras pessoas, pede sempre autorização. É uma regra de netiqueta.'},
  {id:'G',nm:'Rui',k:{sk:2,hs:'short',sh:'#1F3350',m:'sad'},p:'🤫',s:'Um colega diz ao Rui: «Dá-me a tua palavra-passe, é só para eu ver o teu nível no jogo.»',q:'O que deve o Rui responder?',
   a:['Não. As palavras-passe são secretas, só os meus pais as podem saber.','Está bem, porque é meu colega de turma.','Dou, mas só se ele me der a dele.'],
   why:'Uma palavra-passe partilhada deixa de ser segredo, mesmo com amigos.'},
  {id:'H',nm:'Sofia',k:{sk:1,hs:'long',hc:'#22150C',sh:'#F4C93D',m:'angry'},p:'⌨️',s:'A Sofia está zangada e escreve no grupo: «PAREM DE FAZER BARULHO!!!», tudo em maiúsculas.',q:'Como vão os colegas ler esta mensagem?',
   a:['Como se a Sofia estivesse a gritar.','Como uma mensagem calma e simpática.','Ninguém repara nas maiúsculas.'],
   why:'Escrever TUDO EM MAIÚSCULAS online é como gritar. Escreve com calma e respeito.'}];
const OATH=['Prometo guardar as minhas palavras-passe em segredo,','criar palavras-passe fortes, com a receita certa,','tratar os outros online com respeito, como cara a cara,','e pedir ajuda a um adulto quando algo me parecer estranho.'];
const WORDS=['Leao','Pizza','Lua','Nuvem','Foguete','Banana','Dragao','Pinguim','Gelado','Piano','Tartaruga','Arco'];
const SYMS=['!','#','*','@','+','$','&','?'];

// ═══════════ ESTADO DO ALUNO ═══════════
// A palavra-passe inventada nunca é guardada: só existe na memória enquanto a página está aberta.
const S={apoio:false,name:'',turma:'',key:'',docId:null,prog:{},cur:null,draft:null,valid:null,promessa:false,screen:'home',unlockAll:false};
function load(){const d=LSget('cof4:p:'+S.key)||{};S.prog=d.prog||{};S.cur=d.cur||null;S.draft=d.draft||null;S.valid=null;S.docId=d.docId||null;}
function save(){if(!S.key)return;LSset('cof4:p:'+S.key,{prog:S.prog,cur:S.cur,draft:S.draft,docId:S.docId,name:S.name,turma:S.turma});}
let PW='';
const prevDone=id=>{const i=IDS.indexOf(id);return i<=0||!!(S.prog[IDS[i-1]]||{}).done;};
// Com Firebase: abertas pelo professor. Sem ligação: abrem por ordem.
const isOpen=id=>S.unlockAll||(ABERTAS?!!ABERTAS[id]:(CTL_WAIT?false:prevDone(id)));
function resetCloudView(){pararVigia();ABERTAS=null;REMOTE_APOIO=false;CTL_WAIT=FB_CONFIGURADO&&NETST!=='erro'&&NETST!=='off';}
const totalStars=()=>MISSIONS.filter(m=>m.id!=='m5').reduce((a,m)=>a+((S.prog[m.id]||{}).stars||0),0);
const maxStars=()=>MISSIONS.filter(m=>m.id!=='m5').length*3;
const allDone=()=>MISSIONS.every(m=>(S.prog[m.id]||{}).done);

// ═══════════ MISSÕES (cada uma tem passos, como no Super-Heróis) ═══════════
const MISSIONS=[
  {id:'m1',c:1,p:'Parte 1',n:'O Jogo dos Níveis de Segurança',d:'Aprende a receita e descobre se cada palavra-passe é fraca, média ou forte.',t:'20 min',art:'lvl',a:1,b:3},
  {id:'m2',c:2,p:'Parte 2',n:'Netiqueta: as boas maneiras digitais',d:'Boas ou más maneiras? Depois, transforma mensagens más em simpáticas.',t:'10 min',art:'net',a:1,b:3},
  {id:'m3',c:3,p:'Parte 3',n:'O que farias tu?',d:'Ajuda o João, a Ana, o Pedro e os amigos a escolher a solução certa.',t:'15 min',art:'cen',a:0,b:2},
  {id:'m4',c:4,p:'Parte 4',n:'O Criador de Cadeados Mágicos',d:'Desenha o teu cadeado, dá um nome ao cofre e cria uma palavra-passe forte.',t:'12 min',art:'lock',a:0,b:1},
  {id:'m5',c:5,p:'Conclusão',n:'A Promessa do Guardião',d:'Lê a promessa do guardião digital e recebe o teu certificado.',t:'3 min',art:'oath',a:9,b:9}];
let cur=null;
const head=(ic,t,p)=>`<div class="step-head"><div class="ic" aria-hidden="true">${ic}</div><div><h2>${t}</h2><p>${p}</p></div></div>`;

// ═══════════ ECRÃS ═══════════
const main=()=>$('main');
function show(html,name,acc){clearTimeout(AUTO);stopSpeak();S.screen=name;setAcc(acc||1);
  main().innerHTML=html;window.scrollTo(0,0);}

function renderHome(){
  show(`<div class="wrap"><div class="home">
    <div><span class="kicker">🔐 TIC · 4.º ano</span><h1>O Cofre Secreto</h1><p class="sub">Palavras-passe fortes e boas maneiras no mundo digital.</p>
      <div class="card form">
        <div class="f"><label for="hName">O teu nome e apelido</label><input id="hName" type="text" autocomplete="off" maxlength="40" placeholder="Por exemplo: Ana Silva" value="${esc(S.name)}"></div>
        <div class="f"><label for="hTurma">A tua turma</label><select id="hTurma"><option value="">Escolhe a turma</option>${CFG.turmas.map(t=>`<option ${t===S.turma?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
        <div class="msg" id="hMsg"${HOME_MSG?' style="color:var(--ok)"':''}>${esc(HOME_MSG)}</div>
        <button class="btn big" id="hGo">Entrar no cofre</button>
      </div></div>
    <div class="hero">${heroSVG()}</div>
  </div></div>`,'home',1);
  HOME_MSG='';
  const go=()=>{const n=$('hName').value.trim().replace(/\s+/g,' '),t=$('hTurma').value;
    if(n.split(' ').length<2){$('hMsg').textContent='Escreve o teu nome e o teu apelido.';$('hName').focus();return;}
    if(!t){$('hMsg').textContent='Escolhe a tua turma.';return;}
    const nk=norm(n)+'|'+t;if(nk!==S.key)resetCloudView();
    S.name=n;S.turma=t;S.key=nk;S.valid=null;load();LSset('cof4:sess',{name:n,turma:t});
    $('hGo').disabled=true;detectApoio().then(()=>{renderMap();ligar();});};
  $('hGo').onclick=go;$('hName').onkeydown=e=>{if(e.key==='Enter')go();};
}

function renderMap(){
  const first=esc(S.name.split(' ')[0]);
  const next=MISSIONS.find(m=>!(S.prog[m.id]||{}).done);
  let status;
  if(!next)status=['🏅',`Parabéns, ${first}! Terminaste todas as missões. O professor vai validar o teu trabalho.`];
  else if(CTL_WAIT)status=['⏳','A ligar ao computador do professor…'];
  else if(isOpen(next.id))status=['🔓',`Olá, ${first}! A missão «${esc(next.n)}» está aberta. Podes começar!`];
  else status=['✋',`Olá, ${first}! Espera que o professor abra a próxima missão: «${esc(next.n)}».`];
  const rows=MISSIONS.map((m,i)=>{const p=S.prog[m.id]||{};const open=isOpen(m.id);const going=S.cur&&S.cur.id===m.id&&!p.done;const isNext=!!next&&next.id===m.id&&open;
    const act=!open?`<span class="wait">🔒 O professor ainda não abriu</span>`:`<button class="btn ${p.done||!isNext?'ghost':''}" data-m="${m.id}">${p.done?'Repetir':going?'Continuar ▶':'Começar'}</button>`;
    return `<div class="stop ${p.done?'done':''} ${open?'':'locked'} ${isNext?'next':''}" style="--c:var(--m${m.c});--cs:var(--m${m.c}s)">${isNext?'<span class="here">👉 Começa aqui!</span>':''}${badge(`var(--m${m.c})`,open,i+1)}<div class="thumb">${art(m.art)}</div>
      <div><span class="parte">${esc(m.p)}</span><h3>${esc(m.n)}<span class="min">⏱ ${esc(m.t)}</span></h3><p>${esc(m.d)}</p>${p.done?`<div class="st">${m.id==='m5'?'🏅 Promessa feita':starsTxt(p.stars||0)}</div>`:''}</div>
      <div class="act">${act}</div></div>`;}).join('');
  const done=allDone();
  show(`<div class="wrap"><div class="banner"><div><h2>Mapa dos cofres</h2><div class="who">${esc(S.name)} | ${esc(S.turma)}</div><div class="net" id="net">${netTxt()}</div></div><div class="tot">⭐ ${totalStars()} / ${maxStars()}</div></div>
   <div class="status"><span class="ic" aria-hidden="true">${status[0]}</span><span>${status[1]}</span></div>
   <div class="trail">${rows}
    <div class="stop final ${done?'':'locked'} ${done&&!S.valid?'next':''}" style="--c:var(--brass-d);--cs:var(--brass-s)">${done&&!S.valid?'<span class="here">👉 Vê o teu certificado</span>':''}${badge('#E9A93A',done,'🏅')}<div class="thumb">${'<svg viewBox="0 0 360 260"><rect width="360" height="260" fill="#FCEFD3"/>'+sealSVG().replace('<svg ','<svg x="120" y="20" width="120" height="220" ')+'</svg>'}</div>
     <div><span class="parte">No fim</span><h3>Validação do professor</h3><p>${S.valid?`Validado em ${esc(S.valid.data)}.`:done?'O professor vai ver e validar o teu trabalho.':'Fica disponível quando terminares todas as missões.'}</p></div>
     <div class="act">${done?`<button class="btn brass" id="goCert">${S.valid?'Ver o certificado':'Ver o certificado'}</button>`:''}</div></div></div>
   <div class="exit" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn ghost" id="helpBtn">❓ Como funciona</button><button class="btn ghost" id="exitBtn">Sair (outro aluno)</button></div></div>`,'map',1);
  $('helpBtn').onclick=showHelp;if(!LSget('cof4:help:'+S.key))showHelp();
  main().querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>openMission(b.dataset.m));
  if($('goCert'))$('goCert').onclick=renderCert;
  $('exitBtn').onclick=()=>{resetCloudView();LSdel('cof4:sess');Object.assign(S,{name:'',turma:'',key:'',docId:null,prog:{},cur:null,draft:null,valid:null,apoio:false});PW='';applyEasy();renderHome();$('hName').focus();};
}

function showHelp(){LSset('cof4:help:'+S.key,1);
  $('mBox').className='mbox res';
  $('mBox').innerHTML=`<h2>Como funciona?</h2><div class="helpgrid">
   <div><b>👆</b><span>Carrega na missão que diz <b style="font-size:inherit">«Começa aqui!»</b>.</span></div>
   <div><b>✏️</b><span>Responde. Se errares, não faz mal: tenta outra vez!</span></div>
   <div><b>🟢</b><span>Quando o botão verde <b style="font-size:inherit">«Próximo»</b> acender, carrega nele.</span></div>
   <div><b>✋</b><span>No fim de cada missão, espera pelo professor.</span></div></div>
   <div class="mbtns" style="justify-content:center"><button class="btn big" id="hOk">Percebi, vamos lá!</button></div>`;
  $('modal').classList.add('on');$('hOk').focus();$('hOk').onclick=()=>$('modal').classList.remove('on');}
// ── abrir uma missão e navegar pelos passos
function openMission(id){
  const m=MISSIONS.find(x=>x.id===id);if(!m||!isOpen(id)){renderMap();return;}
  cur={m,step:0,ok:new Set(),d:{err:0}};
  const g=S.cur;if(g&&g.id===id&&!(S.prog[id]||{}).done){cur.step=Math.min(g.step||0,m.steps.length-1);cur.ok=new Set(g.ok||[]);cur.d=Object.assign({err:0},g.d||{});}
  show(`<div class="topbar"><button class="btn ghost small" id="toMap">🗺️ Mapa</button><div class="title"><small>Missão ${MISSIONS.indexOf(m)+1} · ${esc(m.p)}</small>${esc(m.n)}</div><span class="stepn" id="stepn"></span><div class="prog" id="prog" aria-label="Passos da missão"></div><span class="who">${esc(S.name)}</span></div>
   <div class="wrap" style="padding-bottom:20px"><div id="stage"></div></div>
   <div class="navbar"><button class="btn ghost" id="prevBtn">◀ Anterior</button><span class="navhint" id="navHint"></span><button class="btn" id="nextBtn">Próximo ▶</button></div>`,'mission',m.c);
  $('toMap').onclick=()=>{saveCur();syncPasso('No mapa');renderMap();};
  $('prevBtn').onclick=()=>{if(cur.step>0){cur.step--;renderStep();}};
  $('nextBtn').onclick=()=>{if(!cur.ok.has(cur.step))return;if(cur.step<cur.m.steps.length-1){cur.step++;renderStep();}else finishMission();};
  renderStep();
}
function saveCur(){if(!cur||(S.prog[cur.m.id]||{}).done)return;S.cur={id:cur.m.id,step:cur.step,ok:[...cur.ok],d:JSON.parse(JSON.stringify(cur.d))};save();}
function stepDone(){cur.ok.add(cur.step);updNav();saveCur();}
function updNav(){const st=cur.m.steps;
  $('prog').innerHTML=st.map((_,k)=>`<i class="${k===cur.step?'on':cur.ok.has(k)?'ok':''}"></i>`).join('');
  $('prevBtn').style.visibility=cur.step>0?'visible':'hidden';
  const last=cur.step===st.length-1,ok=cur.ok.has(cur.step);
  $('nextBtn').textContent=last?'Terminar missão ✅':'Próximo ▶';$('nextBtn').disabled=!ok;$('nextBtn').classList.toggle('pulse',ok);
  $('stepn').textContent=`Passo ${cur.step+1} de ${st.length}`;
  $('navHint').textContent=ok?(last?'Muito bem! Carrega em «Terminar missão» ✅':'Muito bem! Carrega em «Próximo» ▶'):'Faz este passo para continuar.';$('navHint').classList.toggle('go',ok);}
function renderStep(){clearTimeout(AUTO);stopSpeak();const el=$('stage');el.innerHTML='';cur.m.steps[cur.step](el,cur.d);updNav();window.scrollTo(0,0);saveCur();autoRead();
  syncPasso(`Missão ${MISSIONS.indexOf(cur.m)+1} · passo ${cur.step+1} de ${cur.m.steps.length}`);}
function finishMission(){
  const m=cur.m;const stars=m.id==='m5'?3:starsFromErrors(cur.d.err||0,m.a,m.b);const old=S.prog[m.id]||{};
  S.prog[m.id]={done:true,stars:Math.max(stars,old.stars||0)};if(m.id==='m4')S.prog.m4.c=cur.d.c;S.cur=null;save();cur=null;PASSO='No mapa';sync();
  confetti();beep(880,.25);
  if(m.id==='m5'){renderCert();return;}
  const nx=MISSIONS.find(x=>!(S.prog[x.id]||{}).done);
  $('mBox').className='mbox res';
  $('mBox').innerHTML=`<div class="vault">${vaultSVG()}</div><h2>Cofre aberto!</h2><div class="bigstars" aria-label="${stars} estrelas">${starsTxt(stars)}</div>
   <p style="font-weight:800">Muito bem, ${esc(S.name.split(' ')[0])}! ${nx&&isOpen(nx.id)?'A próxima missão já está aberta.':'✋ Agora espera pelo professor antes de começares a próxima missão.'}</p>
   <div class="mbtns" style="justify-content:center"><button class="btn" id="rMap">Voltar ao mapa</button></div>`;
  $('modal').classList.add('on');$('rMap').focus();
  $('rMap').onclick=()=>{$('modal').classList.remove('on');renderMap();};
}

// ── passo genérico: escolher a resposta certa, corrigir até acertar
// cfg: {key, pick:()=>[índices], items, prompt(it), opts(it)->[{t,ok,cls}], layout, good(it), bad(it), fixed}
function choiceSeq(el,d,cfg){
  const st=d[cfg.key]=d[cfg.key]||{i:0,order:cfg.pick(),res:[],op:{}};
  const draw=()=>{
    if(st.i>=st.order.length){
      el.innerHTML=`<div class="narrow">${cfg.head}</div><div class="narrow card doneBox"><div class="big">🎉</div><h3>Passo concluído!</h3><p style="font-weight:800">${cfg.doneMsg||'Muito bem!'}</p><button class="btn big okb" id="dbGo">${cur.step===cur.m.steps.length-1?'Terminar missão ✅':'Próximo passo ▶'}</button>${st.order.length>1?`<div class="mdots">${st.order.map((_,j)=>`<i class="${st.res[j]===false?'bad':'ok'}"></i>`).join('')}</div>`:''}</div>`;
      stepDone();$('dbGo').onclick=()=>$('nextBtn').click();return;}
    const it=cfg.items[st.order[st.i]];const raw=cfg.opts(it);
    if(!st.op[st.i])st.op[st.i]=cfg.fixed?raw.map((_,k)=>k):shuffle(raw.map((_,k)=>k));
    const ops=st.op[st.i].map(k=>raw[k]);
    const dots=st.order.length>1?`<div class="mdots">${st.order.map((_,j)=>`<i class="${j===st.i?'cur':st.res[j]===true?'ok':st.res[j]===false?'bad':''}"></i>`).join('')}</div>`:'';
    const list=cfg.layout==='list';
    el.innerHTML=`<div class="narrow">${cfg.head}</div><div class="narrow card">${dots}${cfg.prompt(it)}<div class="ch ${cfg.layout}" id="ch">${ops.map((o,j)=>list?`<button class="opt" data-j="${j}"><b>${'ABC'[j]}</b><span>${esc(o.t)}</span></button>`:`<button class="btn ${o.cls||''}" data-j="${j}">${o.t}</button>`).join('')}</div><div id="fb"></div></div>`;
    let miss=false;
    $('ch').querySelectorAll('button').forEach(b=>b.onclick=()=>{const o=ops[+b.dataset.j];
      if(o.ok){b.classList.add('right');$('ch').querySelectorAll('button').forEach(x=>x.disabled=true);if(st.res[st.i]===undefined)st.res[st.i]=!miss;saveCur();
        okNext($('fb'),`${miss?'Agora sim!':'Muito bem!'} ${cfg.good(it)}`,()=>{st.i++;saveCur();draw();},cfg.ms||2600);}
      else{b.classList.add('wrong');b.disabled=true;b.classList.add('shake');if(!miss){miss=true;d.err=(d.err||0)+1;st.res[st.i]=false;saveCur();}badMsg($('fb'),cfg.bad?cfg.bad(it,o):tryAgain());}});
  };draw();
}

// ═══════════ MISSÃO 1 ═══════════
MISSIONS[0].steps=[
  (el,d)=>{ // a receita
    d.rc=d.rc||[];
    const draw=()=>{el.innerHTML=head('🧪','A receita da palavra-passe forte','Uma palavra-passe é a chave do teu cofre. Carrega em cada ingrediente para o descobrir.')+
      `<div class="recipe">${RECEITA.map((r,k)=>{const on=d.rc.includes(k);return `<button class="ingr ${on?'on':''}" data-k="${k}"><span class="em">${r.em}</span><b>${r.b}</b>${on?`<span class="ex">${esc(r.ex)}</span><small>${esc(r.s)}</small>`:'<span class="hid">Carrega para ver</span>'}</button>`;}).join('')}</div>
       <div class="count">${d.rc.length===RECEITA.length?'✅ Já conheces os 6 ingredientes! Carrega em «Próximo».':`Ingredientes descobertos: ${d.rc.length} de ${RECEITA.length}`}</div>`;
      el.querySelectorAll('.ingr').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(!d.rc.includes(k)){d.rc.push(k);beep(520+k*60,.1);saveCur();}
        if(sayOn())speak(RECEITA[k].b+'. '+RECEITA[k].s);draw();if(d.rc.length===RECEITA.length)stepDone();});};
    draw();if(d.rc.length===RECEITA.length)stepDone();
  },
  (el,d)=>{ // fraca, média ou forte
    const few=apoioOn('menos');const LB={f:['lv1','🔴 Fraca'],m:['lv2','🟡 Média'],F:['lv3','🟢 Forte']};const keys=few?['f','F']:['f','m','F'];
    choiceSeq(el,d,{key:'lv',items:LVLS,layout:few?'c2':'c3',fixed:true,
      head:head('🚦','Fraca, média ou forte?','Olha bem para cada palavra-passe e escolhe o nível de segurança.'),
      pick:()=>{const p=(a,n)=>shuffle(LVLS.map((x,k)=>x.a===a?k:-1).filter(k=>k>=0)).slice(0,n);return few?shuffle([...p('f',3),...p('F',3)]):shuffle([...p('f',3),...p('m',2),...p('F',3)]);},
      prompt:it=>`<div class="situ"><p>Que nível de segurança tem esta palavra-passe?</p><div class="pwtag">${esc(it.p)}</div><span class="pwlen">Tem ${it.p.length} caracteres</span></div>`,
      opts:it=>keys.map(k=>({t:LB[k][1],ok:k===it.a,cls:LB[k][0]})),
      good:it=>`É ${LB[it.a][1].slice(3).toLowerCase()}. ${esc(it.why)}${ingsHtml(crit(it.p,'',10),10)}`,ms:3600});
  },
  (el,d)=>{ // torna-a forte
    const ml=minLen();d.tf=d.tf||'bobby';
    el.innerHTML=`<div class="narrow">${head('💪','Torna-a forte!','O João usou «bobby». Ajuda-o: muda a palavra-passe até o medidor ficar verde.')}</div>`+
     `<div class="narrow card"><label class="lab" for="tf">A palavra-passe do João (podes ver, é só um treino)</label><input class="inp" id="tf" type="text" maxlength="40" autocomplete="off" spellcheck="false" autocapitalize="off" style="font-family:Lexend,Nunito,sans-serif;font-size:24px" value="${esc(d.tf)}">
      <div class="meter" id="tfM"><i></i><i></i><i></i></div><div class="mlabel" id="tfL"></div><ul class="rec" id="tfR"></ul><div id="fb"></div></div>`;
    let was=false;
    const upd=()=>{const v=$('tf').value;d.tf=v;const c=crit(v,'',ml);const lv=v?levelOf(c):0;
      $('tfM').className='meter'+(lv?' l'+lv:'');$('tfL').textContent='Força: '+(lv?LVLNAME[lv]:'—');
      $('tfR').innerHTML=ING.map(([k,l])=>`<li class="${c[k]?'ok':''}"><i>${c[k]?'✓':''}</i><span>${esc(l.replace('{n}',ml))}</span></li>`).join('');
      if(lv===3&&!was){was=true;beep(760);$('fb').innerHTML='<div class="feedback ok"><span>🟢 Fortíssima! Agora o cofre do João está seguro. Carrega em «Próximo».</span></div>';stepDone();}
      else if(lv<3&&was){was=false;$('fb').innerHTML='';cur.ok.delete(cur.step);updNav();}
      saveCur();};
    $('tf').oninput=upd;upd();
  }];

// ═══════════ MISSÃO 2 ═══════════
MISSIONS[1].steps=[
  (el,d)=>{const n=apoioOn('menos')?3:4;
    choiceSeq(el,d,{key:'net',items:NET,layout:'c2',fixed:true,
      head:head('👍','Boa ou má maneira?','Lê cada atitude e decide se é uma boa maneira no mundo digital.'),
      pick:()=>{const p=a=>shuffle(NET.map((x,k)=>x.a===a?k:-1).filter(k=>k>=0)).slice(0,n);return shuffle([...p('b'),...p('m')]);},
      prompt:it=>`<div class="situ"><span class="ico" aria-hidden="true">${it.i}</span><p>${esc(it.t)}</p></div>`,
      opts:it=>[{t:'👍 Boa maneira',ok:it.a==='b',cls:'yes'},{t:'👎 Má maneira',ok:it.a==='m',cls:'no'}],
      good:it=>`É uma ${it.a==='b'?'boa':'má'} maneira. ${esc(it.why)}`});},
  (el,d)=>{const n=apoioOn('menos')?2:3;
    choiceSeq(el,d,{key:'pol',items:POLITE,layout:'list',
      head:head('✉️','Arranja a mensagem','Esta mensagem não tem boas maneiras. Escolhe a forma simpática de dizer o mesmo.'),
      pick:()=>shuffle(POLITE.map((_,k)=>k)).slice(0,n),
      prompt:it=>`<div class="q"><div class="chat"><div class="face">${kid({sk:2,hs:'short',sh:'#5E6B7A',m:'angry'})}</div><div class="rude">${esc(it.r)}</div></div><p class="qq">Como se diz isto com boas maneiras?</p></div>`,
      opts:it=>it.a.map((t,k)=>({t,ok:k===0})),
      good:it=>esc(it.why),ms:3000});}];

// ═══════════ MISSÃO 3 ═══════════
function cenStep(k){return (el,d)=>{const it=CEN[k];
  choiceSeq(el,d,{key:'c'+it.id,items:CEN,layout:'list',pick:()=>[k],
    head:head(['🐶','🎮','🕹️','🎁','💻','📸','🤫','⌨️'][k],`A história ${k<3?'d'+(it.nm==='Ana'?'a':'o')+' '+it.nm:'extra: '+it.nm}`,'Lê o que aconteceu e escolhe a solução certa.'),
    prompt:it=>`<div class="q"><div class="scene"><div class="ava"><span class="nm">${esc(it.nm)}</span>${kid(it.k)}<span class="prop" aria-hidden="true">${it.p}</span></div><div class="speech">${esc(it.s)}</div></div><p class="qq">${esc(it.q)}</p></div>`,
    opts:it=>it.a.slice(0,apoioOn('menos')?2:3).map((t,j)=>({t,ok:j===0})),
    good:it=>esc(it.why),doneMsg:'Resolveste esta história!',ms:3200});};}
// A, B e C (os da aula) e duas histórias extra
MISSIONS[2].steps=[cenStep(0),cenStep(1),cenStep(2),cenStep(3),cenStep(6)];

// ═══════════ MISSÃO 4 ═══════════
function makerShell(el,d,stepHtml){
  const D=S.draft=Object.assign({shape:0,color:4,sticker:0,name:''},S.draft||{});
  el.innerHTML=stepHtml.head+`<div class="maker"><aside class="preview"><div class="lockbox" id="pv"></div><div class="cname" id="pvN"></div><div class="meter" id="pvM"><i></i><i></i><i></i></div><div class="mlabel" id="pvL"></div></aside><div class="card">${stepHtml.body}</div></div>`;
  return D;}
function makerUpd(D,sparkle){const ml=minLen();$('pv').innerHTML=lockSVG(D,{sparkle});const nm=(D.name||'').trim();$('pvN').textContent=nm||'O teu cofre ainda não tem nome';$('pvN').classList.toggle('vazio',!nm);
  const c=crit(PW,S.name,ml);const lv=PW?levelOf(c):0;$('pvM').className='meter'+(lv?' l'+lv:'');$('pvL').textContent=PW?'Força: '+LVLNAME[lv]:(sparkle?'🔒 Cofre fechado':'Força: ainda sem palavra-passe');return c;}
MISSIONS[3].steps=[
  (el,d)=>{
    const D=makerShell(el,d,{head:head('🎨','Desenha o teu cadeado mágico','Escolhe a forma, a cor e um autocolante. Depois dá um nome criativo ao teu cofre.'),
      body:`<span class="lab">Forma</span><div class="row" id="kS">${SHAPES.map((n,j)=>`<button class="shp" data-v="${j}" title="${n}" aria-label="Forma ${n}"></button>`).join('')}</div>
       <span class="lab">Cor</span><div class="row" id="kC">${COLS.map(([c,n],j)=>`<button class="sw" data-v="${j}" style="background:${c}" title="${n}" aria-label="Cor ${n}"></button>`).join('')}</div>
       <span class="lab">Autocolante</span><div class="row" id="kK">${STK.map((e,j)=>`<button class="stk" data-v="${j}" aria-label="Autocolante ${j+1}">${e}</button>`).join('')}</div>
       <label class="lab" for="kN">Nome do cofre</label><input class="inp" type="text" id="kN" maxlength="32" autocomplete="off" placeholder="Por exemplo: O Cofre do Dragão Azul">`});
    $('kN').value=D.name||'';
    const shapes=()=>$('kS').querySelectorAll('button').forEach(x=>x.innerHTML=lockSVG({shape:+x.dataset.v,color:D.color,sticker:-1}));
    const mark=(id,v)=>$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));
    const check=()=>{makerUpd(D);save();if((D.name||'').trim().length>=3)stepDone();else{cur.ok.delete(cur.step);updNav();}};
    [['kS','shape'],['kC','color'],['kK','sticker']].forEach(([id,k])=>{mark(id,D[k]);$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{D[k]=+b.dataset.v;mark(id,D[k]);if(k==='color')shapes();beep(600,.06);check();});});
    $('kN').oninput=()=>{D.name=$('kN').value.replace(/\s+/g,' ').replace(/^\s/,'');check();};
    shapes();check();
  },
  (el,d)=>{
    const ml=minLen();let showPw=false;
    const D=makerShell(el,d,{head:head('🔑','A palavra-passe secreta','Usa a receita da palavra-passe forte. Inventa uma só para este jogo!'),
      body:`<div class="secret">🤫 Nunca escrevas aqui uma palavra-passe verdadeira. Esta não fica guardada em lado nenhum e ninguém a vê, nem o professor.</div>
       <label class="lab" for="kP">A minha palavra-passe secreta</label>
       <div class="pwrow"><input class="inp" type="password" id="kP" maxlength="40" autocomplete="new-password" spellcheck="false" autocapitalize="off"><button class="btn ghost small" id="kEye" aria-pressed="false">👁 Mostrar</button></div>
       <ul class="rec">${ING.map(([k,l])=>`<li id="r_${k}"><i></i><span>${esc(l.replace('{n}',ml))}</span></li>`).join('')}</ul>
       <details class="ideas" open><summary>💡 Preciso de ideias</summary>
        <p class="note">Junta palavras malucas que não combinam, um número e um símbolo. Carrega para acrescentar.</p>
        <div class="row">${WORDS.map(w=>`<button class="chip" data-t="${w}">${w}</button>`).join('')}</div>
        <div class="row" style="margin-top:8px">${SYMS.map(w=>`<button class="chip sym" data-t="${esc(w)}">${esc(w)}</button>`).join('')}${'0123456789'.split('').map(w=>`<button class="chip sym" data-t="${w}">${w}</button>`).join('')}</div>
        <div class="mbtns" style="justify-content:flex-start;margin-top:8px"><button class="btn ghost small" id="kDel">⌫ Apagar a última</button><button class="btn ghost small" id="kClr">Começar de novo</button></div></details>
       ${apoioOn('cadeado')?'<p class="note">Dica: podes ditar com Windows + H.</p>':''}<div id="fb"></div>`});
    if(d.closed){$('kP').closest('.card').innerHTML='<div class="doneBox"><div class="big">🔒</div><h3>O cofre já está fechado</h3><p style="font-weight:800">A palavra-passe é segredo e já foi apagada. Carrega em «Próximo».</p></div>';makerUpd(D,true);stepDone();return;}
    const inp=$('kP');inp.value=PW;
    const upd=()=>{const c=makerUpd(D);ING.forEach(([k])=>{const li=$('r_'+k);li.classList.toggle('ok',!!c[k]);li.querySelector('i').textContent=c[k]?'✓':'';});
      if(critCount(c)===6){if(!cur.ok.has(cur.step)){beep(760);$('fb').innerHTML='<div class="feedback ok"><span>🟢 Palavra-passe forte! Memoriza-a e carrega em «Próximo» para fechar o cofre.</span></div>';}stepDone();}
      else{$('fb').innerHTML='';if(cur.ok.has(cur.step)){cur.ok.delete(cur.step);updNav();}}};
    inp.oninput=()=>{PW=inp.value;upd();};
    $('kEye').onclick=()=>{showPw=!showPw;inp.type=showPw?'text':'password';$('kEye').textContent=showPw?'🙈 Esconder':'👁 Mostrar';$('kEye').setAttribute('aria-pressed',showPw);};
    el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{if(PW.length+b.dataset.t.length>40)return;PW+=b.dataset.t;inp.value=PW;upd();});
    $('kDel').onclick=()=>{PW=PW.slice(0,-1);inp.value=PW;upd();};$('kClr').onclick=()=>{PW='';inp.value='';upd();};
    upd();
  },
  (el,d)=>{
    const D=makerShell(el,d,{head:head('🧠','Fecha o cofre','Uma boa palavra-passe fica na tua cabeça. Escreve-a outra vez, de memória.'),
      body:`<div id="kArea"></div>`});
    const area=()=>{
      if(d.closed){makerUpd(D,true);$('kArea').innerHTML=`<div class="doneBox"><div class="big">🔒</div><h3>O cofre está fechado!</h3><p style="font-weight:800">A palavra-passe já foi apagada deste ecrã. Só tu é que a sabes. Carrega em «Terminar missão».</p></div>`;stepDone();return;}
      if(!PW){makerUpd(D);$('kArea').innerHTML=`<div class="feedback bad"><span>A página foi recarregada e a palavra-passe apagou-se (é segredo!). Volta ao passo anterior e escreve-a outra vez.</span></div>`;return;}
      makerUpd(D);
      $('kArea').innerHTML=`<label class="lab" for="kQ">Escreve a palavra-passe outra vez</label><div class="pwrow"><input class="inp" type="password" id="kQ" maxlength="40" autocomplete="off" spellcheck="false" autocapitalize="off"><button class="btn" id="kGo">🔒 Fechar</button></div><div id="fb"></div>`;
      $('kQ').focus();
      const go=()=>{if($('kQ').value===PW){const c=crit(PW,S.name,minLen());
          d.c={shape:D.shape,color:D.color,sticker:D.sticker,name:(D.name||'').trim(),len:PW.length,ml:minLen(),bits:ING.map(([k])=>c[k]?1:0).join('')};
          d.closed=true;PW='';beep(880,.2);confetti();saveCur();area();}
        else{d.err=(d.err||0)+1;saveCur();$('kQ').value='';$('kQ').classList.add('shake');setTimeout(()=>$('kQ')&&$('kQ').classList.remove('shake'),400);
          badMsg($('fb'),'Não é igual. Tenta outra vez, ou carrega em «Anterior» para a veres.');}};
      $('kGo').onclick=go;$('kQ').onkeydown=e=>{if(e.key==='Enter')go();};};
    area();
  }];

// ═══════════ MISSÃO 5 ═══════════
MISSIONS[4].steps=[
  (el,d)=>{d.ol=d.ol||0;
    const draw=()=>{const done=d.ol>=OATH.length;
      el.innerHTML=head('✋','A Promessa do Guardião','Levanta-te e lê em voz alta. Carrega no botão depois de dizeres cada frase.')+
       `<div class="oath narrow"><div class="seal" style="width:80px;margin:0 auto 6px;line-height:0">${sealSVG()}</div>${OATH.map((t,k)=>`<p class="${k<d.ol||(k===d.ol)?'on':''}">${esc(t)}</p>`).join('')}
        <div style="margin-top:16px">${done?'<div class="feedback ok" style="justify-content:center"><span>🏅 Prometido! Carrega em «Terminar missão» para veres o teu certificado.</span></div>':`<button class="btn big" id="ob">${d.ol===OATH.length-1?'🏅 Prometo!':'Já disse ▶'}</button>`}</div></div>`;
      if($('ob'))$('ob').onclick=()=>{d.ol++;beep(560+d.ol*80,.1);saveCur();draw();if(d.ol>=OATH.length){confetti();stepDone();}};};
    draw();if(d.ol>=OATH.length)stepDone();
  }];

// ═══════════ CERTIFICADO E VALIDAÇÃO ═══════════
function certHtml(){const c=(S.prog.m4||{}).c||{};
  return `<div class="cert"><div class="seal">${sealSVG()}</div><h2>Guardião do Cofre Secreto</h2><div style="font-weight:800;color:var(--muted)">Este certificado é atribuído a</div>
   <div class="nm">${esc(S.name)}</div><div style="font-weight:800">${esc(S.turma)} · TIC · 4.º ano</div>
   <table>${MISSIONS.slice(0,4).map(m=>`<tr><td>${esc(m.n)}</td><td class="s">${(S.prog[m.id]||{}).done?starsTxt(S.prog[m.id].stars||0):'—'}</td></tr>`).join('')}<tr><td>A Promessa do Guardião</td><td>${(S.prog.m5||{}).done?'🏅':'—'}</td></tr></table>
   ${c.name?`<div class="low"><div class="minilock">${lockSVG(c,{sparkle:true})}</div><div><b style="font-family:'Baloo 2',sans-serif;font-size:22px">«${esc(c.name)}»</b><div class="note">Cadeado ${esc(SHAPES[c.shape]||'')}, ${esc((COLS[c.color]||COLS[0])[1])}, com uma palavra-passe forte que só ${esc(S.name.split(' ')[0])} conhece.</div></div></div>`:''}
   ${S.valid?`<div class="stamp ok">✅ Validado pelo professor<small>${esc(S.valid.data)}${S.valid.ap?' · '+esc(S.valid.ap):''}</small></div>`:`<div class="stamp wait">À espera da validação<small>O professor vai validar</small></div>`}</div>`;}
function renderCert(){
  const v=!!S.valid;
  show(`<div class="wrap">${head('🏅','O teu certificado',v?'O professor validou o teu trabalho. Parabéns!':'Terminaste as missões! O professor vai validar o teu trabalho no computador dele.')}
   ${certHtml()}${v?'<p class="note center" style="text-align:center">O teu trabalho ficou guardado com o professor e foi apagado deste computador.</p>':`<p class="note" style="text-align:center" id="net">${netTxt()}</p>`}
   <div class="exit" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${v?'<button class="btn big" id="cEnd">Terminar ✅</button>':'<button class="btn ghost" id="cMap">🗺️ Voltar ao mapa</button>'}</div></div>`,'cert',1);
  if($('cMap'))$('cMap').onclick=renderMap;
  if($('cEnd'))$('cEnd').onclick=()=>{Object.assign(S,{name:'',turma:'',key:'',docId:null,prog:{},cur:null,draft:null,valid:null,apoio:false});resetCloudView();applyEasy();renderHome();};
}

// ═══════════ ARRANQUE ═══════════
// Se a página recarregar, o aluno volta ao sítio onde estava.
$('modal').addEventListener('click',e=>{if(e.target===$('modal')&&!$('mBox').classList.contains('res'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mBox').classList.contains('res'))closeModal();});
addEventListener('pagehide',()=>{if(cur)saveCur();});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||$('modal').classList.contains('on')||S.screen!=='mission')return;
  const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='BUTTON'||tg==='SELECT')return;
  const nx=$('nx');if(nx){e.preventDefault();nx.click();return;}const nb=$('nextBtn');if(nb&&!nb.disabled){e.preventDefault();nb.click();}});
(function start(){const ss=LSget('cof4:sess');
  if(ss&&ss.name&&ss.turma&&CFG.turmas.includes(ss.turma)){S.name=ss.name;S.turma=ss.turma;S.key=norm(ss.name)+'|'+ss.turma;load();
    detectApoio().then(()=>{renderMap();if(S.cur&&isOpen(S.cur.id))openMission(S.cur.id);ligar();});}
  else{applyEasy();renderHome();}})();
