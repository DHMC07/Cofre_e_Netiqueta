/* =====================================================================
   O Cofre Secreto · painel do professor
   ===================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const C = window.CONFIG || {}, cfg = C.firebase || {};
const TURMAS = (C.turmas && C.turmas.length) ? C.turmas : ["4.º A"];
const tid = t => String(t).replace(/[^A-Za-z0-9]/g, "").slice(0, 20) || "turma";
if (!cfg.apiKey || String(cfg.apiKey).startsWith("COLE")) throw new Error("Firebase por configurar");

const app = initializeApp(cfg), auth = getAuth(app), db = getFirestore(app);
let T = TURMAS[0], linhas = [], abertas = {}, lista = "", stops = [], jaMarcados = new Set();

/* ---------- entrar / sair ---------- */
async function entrar() {
  $("loginMsg").textContent = "";
  try { await signInWithEmailAndPassword(auth, $("email").value.trim(), $("pass").value); }
  catch (e) { $("loginMsg").textContent = e.code === "auth/unauthorized-domain" ? "Este endereço não está nos Domínios autorizados do Firebase." : "Email ou palavra-passe errados."; }
}
$("loginBtn").onclick = entrar;
$("pass").onkeydown = e => { if (e.key === "Enter") entrar(); };
$("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, u => {
  if (u && !u.isAnonymous) {
    $("who").textContent = u.email || "";
    $("loginScr").classList.add("hidden"); $("panelScr").classList.remove("hidden");
    abrirTurma(); lerMedidas();
  } else {
    stops.forEach(f => f()); stops = [];
    $("panelScr").classList.add("hidden"); $("loginScr").classList.remove("hidden");
  }
});

/* ---------- turma ---------- */
$("turmaSel").innerHTML = TURMAS.map(t => `<option>${esc(t)}</option>`).join("");
try { const g = localStorage.getItem("cofre-prof-turma"); if (TURMAS.includes(g)) T = g; } catch (e) {}
$("turmaSel").value = T;
$("turmaSel").onchange = () => { T = $("turmaSel").value; try { localStorage.setItem("cofre-prof-turma", T); } catch (e) {} abrirTurma(); };
$("showVal").onchange = desenhar;

function abrirTurma() {
  stops.forEach(f => f()); stops = []; linhas = []; abertas = {}; lista = ""; jaMarcados = new Set();
  $("lista").value = ""; desenharMissoes(); desenhar();
  stops.push(onSnapshot(doc(db, "cofre_controlo", tid(T)),
    s => { abertas = (s.exists() && s.data().abertas) || {}; desenharMissoes(); }, erro));
  stops.push(onSnapshot(query(collection(db, "cofre_registos"), where("turma", "==", T)), snap => {
    linhas = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
    marcarApoio(); desenhar();
  }, erro));
  stops.push(onSnapshot(doc(db, "cofre_turmas", tid(T)), s => {
    lista = (s.exists() && s.data().lista) || "";
    if (document.activeElement !== $("lista")) $("lista").value = lista;
    marcarApoio(); desenhar();
  }, erro));
}
function erro(e) {
  console.error(e);
  $("rows").innerHTML = `<tr><td colspan="10" class="msg" style="text-align:center;padding:24px">Sem acesso aos dados (${esc(e.code || e.message)}). Confirme o seu UID nas regras do Firestore.</td></tr>`;
}

/* ---------- missões abertas ---------- */
function desenharMissoes() {
  $("missRows").innerHTML = MISS_INFO.map(([id, n, c], i) => `<div class="mrow">${badge(`var(--m${c})`, !!abertas[id], i + 1)}
    <div class="t">Missão ${i + 1}<small>${esc(n)}</small></div>
    <label class="tog"><input type="checkbox" data-o="${id}" ${abertas[id] ? "checked" : ""} aria-label="Abrir a missão ${i + 1}"><span></span></label></div>`).join("");
  $("missRows").querySelectorAll("[data-o]").forEach(x => x.onchange = () => gravarAbertas({ ...abertas, [x.dataset.o]: x.checked }));
}
function gravarAbertas(a) {
  $("ctlMsg").textContent = "";
  setDoc(doc(db, "cofre_controlo", tid(T)), { abertas: a, atualizado: serverTimestamp() })
    .catch(e => { $("ctlMsg").textContent = "Não foi possível guardar: " + (e.code || e.message); $("ctlMsg").className = "pmsg bad"; desenharMissoes(); });
}
$("openNext").onclick = () => {
  const k = MISS_INFO.map(m => m[0]).find(id => !abertas[id]);
  if (!k) { $("ctlMsg").className = "pmsg"; $("ctlMsg").textContent = "Todas as missões já estão abertas."; return; }
  gravarAbertas({ ...abertas, [k]: true });
};
$("closeAll").onclick = () => gravarAbertas(Object.fromEntries(MISS_INFO.map(m => [m[0], false])));

/* ---------- lista da turma e medidas seletivas ---------- */
const chave = n => { const w = norm(n).split(" ").filter(Boolean); return (w[0] || "") + " " + (w[w.length - 1] || ""); };
function nomesLista() {
  return lista.split("\n").map(l => l.trim()).filter(Boolean).map(l => ({ nome: l.replace(/\*\s*$/, "").trim(), apoio: /\*\s*$/.test(l) }));
}
const igual = (a, b) => norm(a) === norm(b) || chave(a) === chave(b);
function marcarApoio() { // liga sozinho as medidas aos alunos com * na lista
  const marcados = nomesLista().filter(n => n.apoio);
  linhas.forEach(l => {
    if (l.estado === "validado" || l.apoio || jaMarcados.has(l.id)) return;
    if (marcados.some(n => igual(n.nome, l.nome))) { jaMarcados.add(l.id); updateDoc(doc(db, "cofre_registos", l.id), { apoio: true }).catch(console.warn); }
  });
}
$("saveLista").onclick = () => {
  const v = $("lista").value;
  setDoc(doc(db, "cofre_turmas", tid(T)), { lista: v, atualizado: serverTimestamp() })
    .then(() => { $("listaMsg").className = "pmsg"; $("listaMsg").textContent = "✅ Lista guardada."; lista = v; marcarApoio(); desenhar(); })
    .catch(e => { $("listaMsg").className = "pmsg bad"; $("listaMsg").textContent = "Não foi possível guardar: " + (e.code || e.message); });
};

/* ---------- definições das medidas ---------- */
const MED = [["mLei", "leituraFacil"], ["mMen", "menos"], ["mTem", "tempo"], ["mCad", "cadeado"], ["mEst", "estrelas"]];
function lerMedidas() {
  const base = Object.assign({ leituraFacil: true, menos: true, tempo: true, cadeado: true, estrelas: true }, C.medidas || {});
  const pinta = m => MED.forEach(([id, k]) => $(id).checked = m[k] !== false);
  pinta(base);
  stops.push(onSnapshot(doc(db, "cofre_config", "geral"), s => { if (s.exists() && s.data().medidas) pinta(Object.assign(base, s.data().medidas)); }, console.warn));
}
$("saveMed").onclick = () => {
  const m = Object.fromEntries(MED.map(([id, k]) => [k, $(id).checked]));
  setDoc(doc(db, "cofre_config", "geral"), { medidas: m, atualizado: serverTimestamp() })
    .then(() => { $("medMsg").className = "pmsg"; $("medMsg").textContent = "✅ Guardado para todos os alunos."; })
    .catch(e => { $("medMsg").className = "pmsg bad"; $("medMsg").textContent = "Não foi possível guardar: " + (e.code || e.message); });
};

/* ---------- tabela ---------- */
const st = p => p && p.done ? starsTxt(p.stars || 0) : "—";
const forca = c => { const n = String((c && c.bits) || "").split("").filter(x => x === "1").length; return LVLNAME[n >= 6 ? 3 : n >= 4 ? 2 : 1]; };
const quando = l => { try { return l.atualizado && l.atualizado.toDate ? l.atualizado.toDate().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } };
function desenhar() {
  const nomes = nomesLista();
  const naoComecaram = nomes.filter(n => !linhas.some(l => igual(n.nome, l.nome)));
  const val = linhas.filter(l => l.estado === "validado").length, term = linhas.filter(l => l.concluido && l.estado !== "validado").length;
  $("stats").innerHTML = `<span>👧 ${linhas.length} a trabalhar</span><span>🏅 ${term} terminaram</span><span>✅ ${val} validados</span>${nomes.length ? `<span>⏳ ${naoComecaram.length} ainda não começaram</span>` : ""}`;
  const ver = $("showVal").checked ? linhas : linhas.filter(l => l.estado !== "validado");
  let html = ver.map(l => {
    const p = l.prog || {}, v = l.estado === "validado";
    return `<tr class="${v ? "val" : ""}">
      <td><b>${esc(l.nome)}</b><div class="where">⭐ ${l.estrelas || 0}/12</div></td>
      <td>${l.concluido ? "🏅 Terminou" : esc(l.passo || "")}<div class="where">${quando(l)}</div></td>
      <td class="s">${st(p.m1)}</td><td class="s">${st(p.m2)}</td><td class="s">${st(p.m3)}</td>
      <td>${l.cadeado ? `<span class="mini">${lockSVG(l.cadeado)}</span> <span class="s" style="color:var(--brass-d)">${st(p.m4)}</span>` : st(p.m4)}</td>
      <td>${p.m5 && p.m5.done ? "🏅" : "—"}</td>
      <td><label class="tog" title="Medidas seletivas"><input type="checkbox" data-ap="${l.id}" ${l.apoio ? "checked" : ""} ${v ? "disabled" : ""}><span></span></label></td>
      <td>${v ? `<span class="pill y">Validado</span>` : l.concluido ? `<span class="pill s">Por validar</span>` : `<span class="pill n">A trabalhar</span>`}</td>
      <td style="white-space:nowrap"><button class="btn ghost xs" data-ver="${l.id}">👁️ Ver</button> ${!v && l.concluido ? `<button class="btn okb xs" data-val="${l.id}">✅ Validar</button>` : ""}</td></tr>`;
  }).join("");
  html += naoComecaram.map(n => `<tr class="nao"><td><b>${esc(n.nome)}</b>${n.apoio ? ' <span class="pill s">medidas</span>' : ""}</td><td colspan="9">Ainda não começou</td></tr>`).join("");
  $("rows").innerHTML = html || `<tr><td colspan="10" class="note" style="text-align:center;padding:30px">Ainda não há alunos desta turma. Quando um aluno escrever o nome, aparece aqui.</td></tr>`;
  $("rows").querySelectorAll("[data-ap]").forEach(x => x.onchange = () => updateDoc(doc(db, "cofre_registos", x.dataset.ap), { apoio: x.checked }).catch(erro));
  $("rows").querySelectorAll("[data-ver]").forEach(b => b.onclick = () => verAluno(b.dataset.ver));
  $("rows").querySelectorAll("[data-val]").forEach(b => b.onclick = () => validar([b.dataset.val], ""));
}

/* ---------- ver, validar, recomeçar ---------- */
function fechar() { $("modal").classList.remove("on"); }
$("modal").addEventListener("click", e => { if (e.target === $("modal")) fechar(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
function verAluno(id) {
  const l = linhas.find(x => x.id === id); if (!l) return;
  const p = l.prog || {}, c = l.cadeado, v = l.estado === "validado";
  const bits = String((c && c.bits) || "").split("").map(x => x === "1");
  $("mBox").className = "mbox";
  $("mBox").innerHTML = `<h2>${esc(l.nome)}</h2><p style="font-weight:800;margin:0">${esc(l.turma)} · ⭐ ${l.estrelas || 0}/12 ${l.apoio ? '<span class="pill s">medidas seletivas</span>' : ""} ${v ? '<span class="pill y">Validado</span>' : ""}</p>
    <div class="tbl-wrap"><table class="t"><tr>${MISS_INFO.map(m => `<th>${esc(m[1])}</th>`).join("")}</tr>
      <tr>${MISS_INFO.map(([k]) => `<td style="color:var(--brass-d)">${k === "m5" ? (p.m5 && p.m5.done ? "🏅 feita" : "—") : st(p[k])}</td>`).join("")}</tr></table></div>
    ${c ? `<div class="vgrid"><div class="minilock">${lockSVG(c)}</div><div><b style="font-family:'Baloo 2',sans-serif;font-size:22px">«${esc(c.name)}»</b>
      <p style="margin:6px 0">Palavra-passe com ${c.len} caracteres (mínimo pedido: ${c.ml}), força <b>${forca(c)}</b>.</p>
      <div class="ings">${ING.map(([k, t], j) => `<span class="${bits[j] ? "y" : "n"}">${bits[j] ? "✓" : "✗"} ${esc(t.replace("{n}", c.ml))}</span>`).join("")}</div>
      <p class="note">A palavra-passe do aluno nunca sai do computador dele.</p></div></div>` : `<p class="note">Ainda não fez o cadeado.</p>`}
    ${l.concluido ? "" : `<p class="msg" style="margin-top:12px">Este aluno ainda não terminou todas as missões.</p>`}
    ${v ? "" : `<label class="lab" for="vAp">Apreciação (opcional)</label><select class="inp" id="vAp"><option value="">Sem apreciação</option>${["Excelente", "Muito bom", "Bom", "Satisfaz", "A melhorar"].map(x => `<option>${x}</option>`).join("")}</select>`}
    <div class="mbtns">
      <button class="btn ghost" id="vDel">🔄 Recomeçar do zero</button>
      <button class="btn ghost" id="vClose">Fechar</button>
      ${v ? "" : `<button class="btn okb" id="vOk">✅ ${l.concluido ? "Validar" : "Validar mesmo assim"}</button>`}
    </div>`;
  $("modal").classList.add("on");
  $("vClose").onclick = fechar;
  if ($("vOk")) $("vOk").onclick = () => { validar([id], $("vAp").value); fechar(); };
  $("vDel").onclick = () => {
    if (!confirm(`Apagar o registo de ${l.nome}? O aluno volta ao início e terá de fazer as missões outra vez.`)) return;
    deleteDoc(doc(db, "cofre_registos", id)).catch(erro); fechar();
  };
}
async function validar(ids, ap) {
  if (!ids.length) return;
  const b = writeBatch(db);
  ids.forEach(id => b.update(doc(db, "cofre_registos", id), { estado: "validado", apreciacao: ap || "", validadoEm: serverTimestamp() }));
  await b.commit().catch(erro);
}
$("valAll").onclick = () => {
  const ids = linhas.filter(l => l.concluido && l.estado !== "validado").map(l => l.id);
  if (!ids.length) { alert("Ainda nenhum aluno terminou todas as missões."); return; }
  if (confirm(`Validar ${ids.length} aluno(s) que terminaram todas as missões?`)) validar(ids, "");
};

/* ---------- CSV ---------- */
$("csvBtn").onclick = () => {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Aluno", "Turma", "Níveis de Segurança", "Netiqueta", "O que farias tu?", "Cadeado Mágico", "Promessa", "Estrelas (de 12)", "Força da palavra-passe", "Nome do cofre", "Medidas seletivas", "Estado", "Apreciação"];
  const rows = linhas.map(l => {
    const p = l.prog || {}, n = k => p[k] && p[k].done ? p[k].stars || 0 : "";
    return [l.nome, l.turma, n("m1"), n("m2"), n("m3"), n("m4"), p.m5 && p.m5.done ? "Sim" : "Não", l.estrelas || 0,
      l.cadeado ? forca(l.cadeado) : "", l.cadeado ? l.cadeado.name : "", l.apoio ? "Sim" : "Não",
      l.estado === "validado" ? "Validado" : l.concluido ? "Por validar" : "A trabalhar", l.apreciacao || ""].map(q).join(";");
  });
  const blob = new Blob(["\ufeff" + [head.map(q).join(";"), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `cofre-secreto-${tid(T)}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
};
