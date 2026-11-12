# Hospitalistas divisão — contexto inicial

Registrado em 12/11/2026, antes da explicação detalhada (que virá por áudio).

## A ideia

- Software simples, aberto (sem login), publicado só na Vercel.
- Serve para apoiar uma decisão simples.
- É basicamente uma calculadora baseada numa planilha.

## Como vamos construir

1. Montar o PRD.
2. Dividir o PRD em specs.
3. Dividir as specs em tasks.
4. Só então implementar.

## Referências

| Tema | Referência |
|---|---|
| Método (PRD, specs, tasks, ADRs, glossário) | OncoWay: `~/Antigravity/OncoWay/oncoway` com o ContextDevKit em `contextkit/` e o PRD em `docs/prd.md` |
| Estética e interface | Skill `impeccable` (cópia em `~/Antigravity/OncoWay/oncoway/.claude/skills/impeccable`) |
| Stack de referência | Next.js, React, Tailwind, Radix/shadcn, Zod, Vitest, TypeScript, pnpm, deploy na Vercel |
| Banco de dados | Provavelmente desnecessário. Se for preciso, seguir o OncoWay (Supabase + Drizzle) |

## Referência de domínio: HelmCare - Nurse

A ideia é **dividir a carga de trabalho** entre profissionais, de forma parecida com o HelmCare (`~/Antigravity/HelmCare - Nurse/backend/src/distribuicao/distribuicao.algorithm.ts`). A diferença é que **não vamos usar o Fugulin**: vamos usar uma escala de ocupação, que ainda vai chegar.

Como o HelmCare faz hoje:

- Cada leito ocupado recebe um peso. No modo Fugulin o peso é o score do paciente; no modo manual é binário (complexo = 1, simples = 0).
- **Regra dura:** cada profissional recebe ⌊N/T⌋ ou ⌈N/T⌉ pacientes, ou seja, a diferença máxima é de 1.
- **Equilíbrio de carga:** heurística LPT, em que os mais pesados são distribuídos primeiro, sempre para quem está com menos carga.
- **Proximidade geográfica:** é só uma preferência, refinada com trocas 1 por 1 pela ordem do leito.
- É determinístico e auditável: a mesma entrada dá sempre a mesma saída.
- A saída mostra as escalas com os leitos, os pontos totais e a composição por faixa, além de máximo, mínimo e diferença de carga. Também permite ajuste manual com recálculo.

## Situação (12/11/2026)

O PRD está em `docs/prd.md` e as specs e tasks em `docs/specs/`. A escala do Fugulin foi trocada pelo relatório 9998 do TASY, e a carga é o número de pacientes dos hospitalistas por setor.
