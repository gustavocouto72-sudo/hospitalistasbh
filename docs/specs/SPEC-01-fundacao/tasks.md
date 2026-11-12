# Tasks — SPEC-01 Fundação

- [x] **T-01.1 — Inicializar repositório e app**
  - Depende de: —
  - Aceite:
    - `git init` feito.
    - Next.js com TypeScript estrito, `output: 'export'`, pnpm e Node fixado (mesma versão do OncoWay).
    - `next dev -p 3010` e `next start -p 3010` no `package.json`.

- [x] **T-01.2 — Ferramentas de qualidade**
  - Depende de: T-01.1
  - Aceite:
    - Vitest, ESLint e Prettier configurados.
    - Scripts `typecheck`, `lint` e `test`.
    - Teste-sentinela verde.

- [x] **T-01.3 — Tailwind e estrutura de pastas**
  - Depende de: T-01.1
  - Aceite:
    - Tailwind funcionando.
    - Pastas `calculo/`, `relatorio/`, `componentes/`, `textos/`, `config/` e `test/fixtures/` criadas.
    - Regra de lint que impede `calculo/` e `relatorio/` de importar React.

- [ ] **T-01.4 — Skill impeccable e CLAUDE.md**
  - Depende de: T-01.1
  - Aceite:
    - `.claude/skills/impeccable` copiada do OncoWay, junto com LICENSE e NOTICE.
    - `CLAUDE.md` com leitura obrigatória (PRD e specs) e regras.

- [ ] **T-01.5 — Porta e segredos**
  - Depende de: T-01.1
  - Aceite:
    - Porta 3010 registrada em `~/Antigravity/PORTS.md`.
    - `gitleaks` no pre-commit.
    - `.gitignore` cobre `out/`, `.next/`, `node_modules/` e arquivos de relatório (`*.xls`, `*.xlsx`, `*.csv` fora de `test/fixtures/`).
