# SPEC-07 — Publicação e privacidade

Referências: PRD §4 e §7.

## Problema

O site precisa estar na Vercel, aberto e sem login, com código público e a garantia, verificável, de que nenhum dado do relatório sai do navegador.

## Comportamento esperado

- **Repositório:** público no GitHub, com licença MIT (a confirmar com o dono) e um README que explica o uso, a privacidade e como rodar localmente.
- **Vercel:** projeto ligado ao repositório, com build estático (`out/`). Publica a cada push na `main`, e cada PR ganha uma prévia.
- **Cabeçalhos de segurança** em `vercel.json`:
  - `Content-Security-Policy` com `connect-src 'self'` e sem domínios de terceiros. Isso impede, no próprio navegador, qualquer envio do relatório.
  - `Referrer-Policy: no-referrer`.
  - `X-Content-Type-Options: nosniff`.
  - `Permissions-Policy` restritiva.
- **Sem rastreamento:** nada de Vercel Analytics, Speed Insights, fontes de CDN ou scripts de terceiros. As fontes ficam no próprio site.
- **Sem dados no código:** o repositório público não tem nomes de pessoas, nem de médicos nem de pacientes. A regra de potenciais admissões fica no relatório do TASY, nunca no código.

## Critérios de aceite

- A URL de produção carrega sem login.
- Na aba Rede do navegador, depois de subir a fixture, não aparece nenhuma requisição além dos arquivos do próprio site.
- O scan de segurança dos cabeçalhos (securityheaders.com ou equivalente) dá nota A.
- O `gitleaks` e uma busca por nomes próprios no repositório dão resultado limpo.

## Testes esperados

- Teste Playwright que sobe a fixture e falha se houver qualquer requisição para outra origem.
- Teste que lê `vercel.json` e confere a CSP.
