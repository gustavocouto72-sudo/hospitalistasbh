# SPEC-01 — Fundação do projeto

## Problema

Ainda não há código. Antes das capacidades, o projeto precisa de esqueleto, ferramentas de qualidade e a skill de design.

## Comportamento esperado

- Um app Next.js (App Router, TypeScript estrito) gerado como **site estático** (`output: 'export'`), sem rotas de API nem servidor.
- Tailwind para estilos e Vitest para testes. ESLint e Prettier no padrão do OncoWay.
- A porta local fixa é **3010**, registrada em `~/Antigravity/PORTS.md`. O `next dev -p 3010` fica explícito no `package.json`.
- A skill `impeccable` fica copiada em `.claude/skills/`, com a licença, a partir do OncoWay.
- O `CLAUDE.md` do projeto aponta para o PRD, as specs e as regras.
- O repositório git é local, com `.gitignore` e `gitleaks` no pre-commit.

## Estrutura de pastas

```
src/
  app/            páginas (só a "/")
  calculo/        regras puras: setores, carga, semáforo, apoio (SPEC-03, SPEC-04)
  relatorio/      leitura e validação do arquivo (SPEC-02)
  componentes/    interface (SPEC-05)
  textos/         textos da interface em pt-BR
  config/         quadros padrão de setores e médicos
test/fixtures/    relatórios sintéticos
```

## Regras

- `calculo/` e `relatorio/` não importam React nem nada do navegador. Assim os dois são testáveis isoladamente.
- Nenhuma dependência de analytics, telemetria ou fonte externa que rastreie.

## Critérios de aceite

- `pnpm dev` sobe em http://localhost:3010.
- `pnpm build` gera `out/` estático.
- `pnpm typecheck`, `pnpm lint` e `pnpm test` passam com um teste-sentinela.
- `.claude/skills/impeccable` está presente.

## Testes esperados

- Um teste-sentinela do Vitest em `calculo/`.
