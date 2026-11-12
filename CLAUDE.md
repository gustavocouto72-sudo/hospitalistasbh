# Divisão de carga dos hospitalistas

Calculadora web aberta e sem login, publicada na Vercel. Lê o relatório 9998 do TASY, mostra a carga por médico em cada setor num semáforo de cinco cores e sugere leitos de apoio entre setores. Nada é guardado. Fase atual: specs prontas, sem código.

## Leia antes de mudar algo

- Produto e decisões: `docs/prd.md`
- Specs e tasks: `docs/specs/README.md`, com uma pasta por spec contendo `spec.md` e `tasks.md`
- Contexto de origem: `CONTEXTO-INICIAL.md`

## Regras

- **Modo enxuto:** a task é implementada, verificada localmente (typecheck, lint e testes do que mudou) e commitada direto na `main`. Ao terminar, atualize o status dela no `tasks.md`.
- **Testes primeiro:** use Vitest. A regra de cálculo (`src/calculo/`) e a leitura (`src/relatorio/`) são puras e não importam React.
- **Nenhum dado real** em código, teste, fixture ou commit. Fixtures são sintéticas, e nunca entram nomes de médicos ou pacientes, porque o repositório será público.
- **Nada sai do navegador.** Não use analytics, scripts de terceiros nem `fetch` com dados do relatório.
- **Idioma:** identificadores do domínio em pt-BR (`setor`, `posto`, `carga`, `apoio`, `semaforo`), termos técnicos em inglês e interface em português, com os textos em `src/textos/`.
- **Interface:** toda tela ou componente usa a skill `impeccable` (`.claude/skills/impeccable`), carregada antes do trabalho.
- **Porta local:** 3010, fixa e registrada em `~/Antigravity/PORTS.md`. Nunca mate processo de outro projeto.
