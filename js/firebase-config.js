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
    apiKey: "AIzaSyDiSfj2Z6Nc5FsMx7fvksfn5FLrmbe7YYs",
    authDomain: "cofre-e-netiqueta.firebaseapp.com",
    databaseURL: "https://cofre-e-netiqueta-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cofre-e-netiqueta",
    storageBucket: "cofre-e-netiqueta.firebasestorage.app",
    messagingSenderId: "1069444075829",
    appId: "1:1069444075829:web:951051489e859ec26f3c7c",
    measurementId: "G-WX3SBDF5CL"
  },


  turmas: ["4.º A", "4.º B", "4.º C", "4.º D", "4.º E", "4.º F", "4.º G", "4.º H", "4.º I"],

  // Valores iniciais das medidas (pode mudá-los depois no painel do professor)
  medidas: { leituraFacil: true, menos: true, tempo: true, cadeado: true, estrelas: true }
};
