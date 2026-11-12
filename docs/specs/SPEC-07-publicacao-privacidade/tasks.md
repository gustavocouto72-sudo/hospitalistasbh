# Tasks — SPEC-07 Publicação e privacidade

- [x] **T-07.1 — Cabeçalhos e CSP**
  - Depende de: T-01.1
  - Aceite:
    - `vercel.json` com os cabeçalhos da spec.
    - Teste que confere a CSP.

- [x] **T-07.2 — Teste de não-envio**
  - Depende de: T-07.1, T-05.3
  - Aceite:
    - Playwright falha se, depois de subir a fixture, houver requisição para outra origem.

- [!] **T-07.3 — Repositório público e Vercel**
  - Depende de: T-07.1
  - Bloqueada até o dono aprovar a criação do repositório público, a licença e o nome do projeto e da URL.
  - Aceite:
    - Repositório criado e README pronto.
    - Projeto na Vercel ligado ao repositório, com prévia por PR.

- [ ] **T-07.4 — Conferência em produção**
  - Depende de: T-07.3, T-06.2
  - Aceite:
    - URL sem login.
    - Aba Rede limpa.
    - Nota A nos cabeçalhos.
    - Busca por nomes próprios limpa.
