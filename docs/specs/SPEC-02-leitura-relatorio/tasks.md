# Tasks — SPEC-02 Leitura do relatório

- [x] **T-02.1 — Fixtures sintéticas**
  - Depende de: T-01.3
  - Aceite:
    - `test/fixtures/relatorio-9998-latin1.xls`, com os mesmos cabeçalho, postos e números da amostra de 12/11/2026, salvo em ISO-8859-1.
    - Variantes em UTF-8 com BOM, CSV com `;` e `.xlsx`.
    - Uma fixture para cada caso de borda.

- [x] **T-02.2 — Decodificação e detecção de formato**
  - Depende de: T-02.1
  - Aceite:
    - Detecta tabulado, CSV ou xlsx pelo conteúdo.
    - Latin-1 é o padrão para texto, e UTF-8 é usado quando há BOM.
    - Testes verdes.

- [x] **T-02.3 — Cabeçalho, código do posto e números**
  - Depende de: T-02.2
  - Aceite:
    - Mapeamento das colunas por nome normalizado.
    - Extração de `A.N` do nome do posto.
    - Parser de números com vírgula, incluindo `,5`.
    - Teste de propriedade do código do posto.

- [x] **T-02.4 — Validação, avisos e erros**
  - Depende de: T-02.3
  - Aceite:
    - Schema Zod de `ContagemPosto`.
    - Linha "Total" ignorada.
    - Todos os casos de borda da spec cobertos, com mensagens em `textos/`.

- [x] **T-02.5 — Leitura de xlsx sob demanda**
  - Depende de: T-02.2
  - Aceite:
    - SheetJS carregado por `import()` dinâmico, só para xlsx.
    - O bundle inicial não inclui SheetJS.

- [x] **T-02.6 — Formato novo do relatório (13/11/2026)**
  - A TI corrigiu o relatório. O cabeçalho passou a ser `Ds posto`, `Qt total setor`, `Qt cardiologia`, `Qt geriatria`, `Qt hospitalistas`, `Qt potenciais admissoes`, `Qt pac medico semana`, `Qt pac medico fim semana`, `Ft dia semana` e `Ft fim semana`. As contagens vêm com vírgula no fim (`20,`) e as linhas terminam em LF.
  - Aceite:
    - Cardiologia e geriatria separadas somam em `cardioGeriatria`; a coluna única antiga continua aceita.
    - `20,` vale 20.
    - Sem nenhuma das formas, o erro pede "Qt cardiologia" e "Qt geriatria".
    - Fixture sintética `relatorio-9998-v2-latin1.xls` lida com os mesmos postos da antiga.
