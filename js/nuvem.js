/* =====================================================================
   O Cofre Secreto · ligação dos alunos ao Firebase.
   Os alunos entram de forma anónima e invisível: não precisam de conta.
   ===================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp }
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

/* Cria o registo do aluno e devolve o seu id */
export async function criar(d) {
  const u = await pronto;
  const ref = await addDoc(collection(db, "cofre_registos"), {
    uid: u.uid, nome: d.nome, nomeNorm: d.nomeNorm, turma: d.turma,
    prog: d.prog, passo: d.passo, cadeado: d.cadeado, estrelas: d.estrelas, concluido: d.concluido,
    estado: "em_curso", apoio: false, criado: serverTimestamp(), atualizado: serverTimestamp()
  });
  return ref.id;
}

/* Atualiza o progresso do aluno */
export async function guardar(id, d) {
  await pronto;
  await updateDoc(doc(db, "cofre_registos", id), {
    prog: d.prog, passo: d.passo, cadeado: d.cadeado, estrelas: d.estrelas, concluido: d.concluido,
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
