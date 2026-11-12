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

- [~] **T-07.3 — Repositório público e Vercel**
  - Depende de: T-07.1
  - Aprovada pelo dono em 12/11/2026 (MIT, nome hospitalistasbh). Repositório em github.com/gustavocouto72-sudo/hospitalistasbh e site em https://hospitalistasbh.vercel.app, publicado pela CLI. Falta ligar o repositório ao projeto da Vercel (o app da Vercel no GitHub precisa de acesso ao repositório) para publicar a cada push e ter prévia por PR.
  - Aceite:
    - Repositório criado e README pronto.
    - Projeto na Vercel ligado ao repositório, com prévia por PR.

- [x] **T-07.4 — Conferência em produção**
  - Depende de: T-07.3, T-06.2
  - Conferida em 12/11/2026: abre sem login, só requisições para a própria origem depois de subir a fixture, todos os cabeçalhos de segurança presentes (a nota no securityheaders.com não foi consultada) e busca por nomes próprios limpa.
  - Aceite:
    - URL sem login.
    - Aba Rede limpa.
    - Nota A nos cabeçalhos.
    - Busca por nomes próprios limpa.
