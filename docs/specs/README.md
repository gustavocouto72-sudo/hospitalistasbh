# Specs e tasks

O PRD (`docs/prd.md`) se divide em sete specs. Cada spec tem uma pasta com:

- `spec.md`: problema, comportamento esperado, regras, casos de borda, critérios de aceite e testes esperados.
- `tasks.md`: tasks em ordem, cada uma com dependências e critérios de aceite.

## Mapa

| Spec | Nome | Fase | Depende de |
|---|---|---|---|
| [SPEC-01](SPEC-01-fundacao/spec.md) | Fundação do projeto | F1 | — |
| [SPEC-02](SPEC-02-leitura-relatorio/spec.md) | Leitura do relatório 9998 | F1 | 01 |
| [SPEC-03](SPEC-03-quadro-carga-semaforo/spec.md) | Quadro de setores, carga e semáforo | F1 | 01 |
| [SPEC-04](SPEC-04-sugestao-apoio/spec.md) | Sugestão de apoio | F2 | 03 |
| [SPEC-05](SPEC-05-interface/spec.md) | Interface | F1–F3 | 02, 03, 04 |
| [SPEC-06](SPEC-06-impressao-pdf/spec.md) | Impressão e PDF | F3 | 05 |
| [SPEC-07](SPEC-07-publicacao-privacidade/spec.md) | Publicação e privacidade | F1 | 01 |

SPEC-02, SPEC-03 e SPEC-07 podem correr em paralelo depois da SPEC-01.

## Regras para todas as tasks

- **Testes primeiro:** o teste que falha vem antes do código, com Vitest.
- **Definição de pronto:** typecheck, lint e testes verdes no que mudou, e commit direto na `main` (modo enxuto do OncoWay, enquanto não houver produção).
- **Fixtures sintéticas:** os relatórios de teste são inventados e nunca trazem nomes de pessoas.
- **Nomes:** identificadores do domínio em pt-BR (`setor`, `posto`, `carga`, `apoio`); termos técnicos em inglês.
- **Textos da interface:** em português e separados do código.

## Status das tasks

`[ ]` a fazer · `[~]` em andamento · `[x]` feita · `[!]` bloqueada (com nota do que falta)
