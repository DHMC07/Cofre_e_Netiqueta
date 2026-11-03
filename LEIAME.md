# O Cofre Secreto · TIC 4.º ano (GitHub + Firebase)

- **`index.html`**: página dos alunos. Não precisam de conta nem de palavra-passe.
- **`professor.html`**: o seu painel. Entra com o email e a palavra-passe de professor do Firebase.

## Como funciona na aula

| O que acontece | Onde |
|---|---|
| O aluno escreve o nome e escolhe a turma | Aparece logo no seu painel, com o passo onde está |
| Carrega numa missão no painel (ou em «🔓 Abrir a próxima») | A missão abre em todos os computadores da turma, sem recarregar |
| O aluno termina um passo ou uma missão | As estrelas e o cadeado aparecem no painel (a palavra-passe nunca sai do computador do aluno) |
| Liga «Medidas» na linha de um aluno, ou põe * no nome na lista da turma | As medidas seletivas ligam-se no computador desse aluno |
| Carrega em «✅ Validar» | O certificado do aluno recebe o carimbo e o trabalho é apagado do computador dele. O registo fica no Firebase |
| «🔄 Recomeçar do zero» (no botão Ver) | O registo é apagado e o aluno volta ao início |

Sem internet, o aluno continua a trabalhar: o progresso fica no computador e é enviado quando a ligação voltar. Se o Firebase não estiver configurado, o exercício funciona só no computador, com as missões a abrir por ordem.

Este exercício guarda tudo em coleções próprias (`cofre_config`, `cofre_controlo`, `cofre_turmas`, `cofre_registos`), por isso **pode usar o mesmo projeto Firebase dos outros exercícios** sem misturar nada.

---

## 1. Firebase

### Opção A: usar um projeto que já tem (recomendado)
1. Abra o `js/firebase-config.js` de outro exercício (Super-Heróis Digitais, Detetives Digitais…) e copie os valores do Firebase (`apiKey`, `authDomain`, …) para o `js/firebase-config.js` desta pasta.
2. Na consola Firebase, abra **Firestore Database > Regras**.
3. Abra `regras-para-juntar.txt`, troque `COLE_AQUI_O_SEU_UID` pelo seu UID (**Authentication > Utilizadores**, coluna *UID do utilizador*).
4. Cole o bloco **antes das duas últimas chavetas** `}` `}` das regras que já lá estão. **Não apague as regras existentes.** Carregue em **Publicar**.

### Opção B: projeto novo
1. Em <https://console.firebase.google.com> crie um projeto (o plano gratuito Spark chega).
2. **Firestore Database > Criar base de dados**: modo de produção, região na Europa (por exemplo `europe-west1`).
3. **Authentication > Começar > Método de início de sessão**: ative **Anónimo** e **Email/palavra-passe**.
4. **Authentication > Utilizadores > Adicionar utilizador**: crie a sua conta de professor e copie o **UID**.
5. Em `firestore.rules`, troque `COLE_AQUI_O_SEU_UID` pelo seu UID e cole o ficheiro todo em **Firestore > Regras > Publicar**.
6. **⚙️ Definições do projeto > As suas apps > Web (`</>`)**: registe a app e copie os valores de `firebaseConfig` para `js/firebase-config.js`.

Em ambas as opções, confirme a lista de **turmas** em `js/firebase-config.js`.

## 2. GitHub Pages
1. Crie um repositório (por exemplo `cofre-secreto`) e envie todos os ficheiros desta pasta, mantendo as pastas `css` e `js`.
   - **VS Code:** abra a pasta > **Controlo de código-fonte > Publicar no GitHub**.
   - **Sem VS Code:** no repositório, **Add file > Upload files** e arraste tudo.
2. **Settings > Pages > Deploy from a branch > main / (root) > Save**.
3. Ao fim de 1 ou 2 minutos fica disponível em:
   - Alunos: `https://SEU-UTILIZADOR.github.io/cofre-secreto/`
   - Professor: `https://SEU-UTILIZADOR.github.io/cofre-secreto/professor.html`
4. Se o projeto Firebase for novo, adicione `SEU-UTILIZADOR.github.io` em **Authentication > Definições > Domínios autorizados** (se já usa esse projeto noutro exercício no GitHub, já lá está).

## 3. Antes da primeira aula
1. Entre em `professor.html`.
2. Escolha a turma e, em **📋 Lista da turma**, cole os nomes (um por linha, nome e apelido). Ponha `*` no fim do nome dos alunos com medidas seletivas, por exemplo `Ana Silva *`. Guarde.
3. Em **⚙️ Medidas**, confirme que medidas estão ligadas.
4. Dê aos alunos só o link principal.

## 4. Na aula
1. Abra o painel e escolha a turma. Todas as missões começam fechadas.
2. No fim de cada explicação, carregue em **🔓 Abrir a próxima**.
3. No fim, valide: um a um (botão **Ver**, com apreciação opcional) ou **✅ Validar todos os que terminaram**.
4. Antes da aula de outra turma, escolha essa turma no painel (cada turma tem as suas missões abertas).

## Testar no seu computador
Os módulos JavaScript não funcionam se abrir o `index.html` com duplo clique. No VS Code, use a extensão **Live Server** («Go Live») e adicione `127.0.0.1` aos Domínios autorizados do Firebase.

## Se aparecer «📴 Sem ligação» nos alunos
Abra a consola do navegador (F12 > Consola). As causas mais comuns:
- o endereço do GitHub não está nos **Domínios autorizados** do Firebase;
- o início de sessão **Anónimo** não está ativo;
- as regras não foram publicadas, ou o UID ficou mal copiado (no painel aparece «Sem acesso aos dados»).

## Ficheiros
```
index.html               página dos alunos
professor.html           painel do professor
css/estilo.css           aspeto das duas páginas
js/firebase-config.js    dados do Firebase e turmas  ← editar
js/comum.js              desenhos, cadeado e receita
js/app.js                missões dos alunos
js/nuvem.js              ligação dos alunos ao Firebase
js/professor.js          painel do professor
firestore.rules          regras completas (projeto novo)
regras-para-juntar.txt   só o bloco deste exercício (projeto existente)
```
