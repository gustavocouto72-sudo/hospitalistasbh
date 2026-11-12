# Tasks — SPEC-06 Impressão e PDF

- [x] **T-06.1 — Folha de impressão**
  - Depende de: T-05.5
  - Aceite:
    - CSS `@media print` com cabeçalho, tabela, apoios e rodapé da spec.
    - Controles escondidos.
    - Cabe em 1 página A4 com a amostra.

- [x] **T-06.2 — Botão e testes**
  - Depende de: T-06.1
  - Aceite:
    - Botão chama `window.print()`.
    - Playwright `page.pdf()` com 1 página e textos-chave.
    - A conferência manual em celular Android e iOS fica como pendência do dono em `docs/specs/_pendencias.md` e não bloqueia o loop.
