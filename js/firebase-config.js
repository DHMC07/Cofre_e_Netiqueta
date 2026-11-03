/* =====================================================================
   O COFRE SECRETO · CONFIGURAÇÃO (o único ficheiro que precisa de editar)

   1) Cole aqui os dados do seu projeto Firebase
      (Consola Firebase > ⚙️ Definições do projeto > As suas apps > Web).
      Se já tem os Super-Heróis Digitais ou os Detetives Digitais no Firebase,
      pode usar os mesmos valores: este exercício guarda os dados em
      coleções próprias (cofre_...), sem misturar nada.
   2) Confirme a lista de turmas.

   Estes valores não são secretos: quem protege os dados são as regras
   (firestore.rules).
   ===================================================================== */
window.CONFIG = {
  firebase: {
    apiKey: "COLE_AQUI",
    authDomain: "COLE_AQUI",
    projectId: "COLE_AQUI",
    storageBucket: "COLE_AQUI",
    messagingSenderId: "COLE_AQUI",
    appId: "COLE_AQUI"
  },

  turmas: ["4.º A", "4.º B", "4.º C", "4.º D", "4.º E", "4.º F", "4.º G", "4.º H", "4.º I"],

  // Valores iniciais das medidas (pode mudá-los depois no painel do professor)
  medidas: { leituraFacil: true, menos: true, tempo: true, cadeado: true, estrelas: true }
};
