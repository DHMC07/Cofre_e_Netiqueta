/* =====================================================================
   O Cofre Secreto · ligação dos alunos ao Firebase.
   Os alunos entram de forma anónima e invisível: não precisam de conta.
   ===================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg = window.CONFIG && window.CONFIG.firebase;
export const ativo = !!(cfg && cfg.apiKey && !String(cfg.apiKey).startsWith("COLE"));

let auth, db, pronto;
if (ativo) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  pronto = new Promise((res, rej) => {
    const stop = onAuthStateChanged(auth, u => { if (u) { stop(); res(u); } });
    signInAnonymously(auth).catch(e => {
      console.error("Não foi possível entrar no Firebase. Confirme que o início de sessão Anónimo está ativo e que este endereço está nos Domínios autorizados.", e);
      rej(e);
    });
  });
  pronto.catch(() => {});
}

/* Lê o registo do aluno (para continuar onde parou). Devolve null se não existir */
export async function ler(id) {
  await pronto;
  const s = await getDoc(doc(db, "cofre_registos", id));
  return s.exists() ? s.data() : null;
}

/* Cria o registo do aluno (o id é feito com a turma e o nome) */
export async function criar(id, d) {
  const u = await pronto;
  await setDoc(doc(db, "cofre_registos", id), {
    uid: u.uid, nome: d.nome, nomeNorm: d.nomeNorm, turma: d.turma,
    prog: d.prog, passo: d.passo, cur: d.cur, cadeado: d.cadeado, estrelas: d.estrelas, concluido: d.concluido,
    estado: "em_curso", apoio: false, criado: serverTimestamp(), atualizado: serverTimestamp()
  });
}

/* Atualiza o progresso do aluno (também quando continua noutro computador) */
export async function guardar(id, d) {
  const u = await pronto;
  await updateDoc(doc(db, "cofre_registos", id), {
    uid: u.uid, prog: d.prog, passo: d.passo, cur: d.cur, cadeado: d.cadeado, estrelas: d.estrelas, concluido: d.concluido,
    atualizado: serverTimestamp()
  });
}

/* Avisa quando o professor valida, liga as medidas seletivas ou apaga o registo.
   cb(dados) · cb(null) se o registo foi apagado · cb(undefined) se houve um erro */
export function vigiarRegisto(id, cb) {
  let stop = () => {}, cancel = false;
  pronto.then(() => {
    if (cancel) return;
    stop = onSnapshot(doc(db, "cofre_registos", id),
      s => cb(s.exists() ? s.data() : null),
      e => { console.warn("Registo indisponível:", e.code); cb(undefined); });
  }).catch(() => cb(undefined));
  return () => { cancel = true; stop(); };
}

/* Avisa que missões o professor abriu para a turma. cb(null) se não houver ligação */
export function vigiarControlo(turma, cb) {
  let stop = () => {}, cancel = false;
  pronto.then(() => {
    if (cancel) return;
    stop = onSnapshot(doc(db, "cofre_controlo", turma),
      s => cb(s.exists() && s.data().abertas ? s.data().abertas : {}),
      e => { console.warn("Controlo indisponível:", e.code); cb(null); });
  }).catch(() => cb(null));
  return () => { cancel = true; stop(); };
}

/* Definições das medidas, escolhidas no painel do professor */
export function vigiarConfig(cb) {
  pronto.then(() => onSnapshot(doc(db, "cofre_config", "geral"),
    s => cb(s.exists() ? s.data() : null), () => {})).catch(() => {});
}
