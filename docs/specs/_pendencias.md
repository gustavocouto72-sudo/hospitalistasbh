# Pendências para o dono decidir

## T-01.1 — `next start` com `output: 'export'`

O aceite pede `next start -p 3010` no `package.json`, e o script está lá. Só que o Next 16 recusa
`next start` quando `output: 'export'` está ligado ("next start does not work with output: export").
Para ver o `out/` localmente seria preciso servir a pasta estática (por exemplo, um script `preview`
com um servidor estático na 3010), o que pede uma dependência a mais. Fica como está até decidir.

## Node local

O projeto fixa Node 24.22.1 (`engines` e `.nvmrc`, como no OncoWay), mas a máquina roda Node 26,
então o pnpm avisa "Unsupported engine". O build e o dev funcionam assim mesmo.

## T-01.1 — `lint` e `test` antecipados da T-01.2

A verificação do loop roda `pnpm lint` e `pnpm test` em toda task, então a T-01.1 já traz o ESLint
(recomendado do JS e do typescript-eslint, versões do OncoWay), o Vitest e o teste-sentinela em
`src/calculo/`. A T-01.2 fica com o Prettier e o que mais faltar do padrão do OncoWay.

## T-01.1 (rodada 2)

- `next start -p 3010` não funciona com `output: 'export'` no Next 16 (script presente como pede o aceite; registrado em _pendencias.md) (package.json)
- Node local 26 diverge do fixado 24.22.1 e o pnpm avisa 'Unsupported engine' (.nvmrc)
- AGENTS.md gerado automaticamente pelo next dev entrou no diff (AGENTS.md)

## T-01.2 — Prettier "no padrão do OncoWay"

O OncoWay não usa Prettier (não há config nem dependência), então não havia padrão a copiar. Ficou
o Prettier 3.9.10 com o estilo que o código já segue (aspas simples, ponto e vírgula, vírgula final,
linha de 120), o `eslint-config-prettier` por último no ESLint, `pnpm lint` rodando também
`prettier --check .` e `pnpm format` para corrigir. Markdown e `docs/` ficam fora do Prettier para não
reescrever as specs. Ajustar se o dono preferir outro estilo.

## T-01.2 (rodada 1)

- Teste de qualidade compara as strings exatas dos scripts; qualquer ajuste neles vai quebrar o teste (test/qualidade.test.ts)
- Prettier 'no padrão do OncoWay' não tinha referência a seguir; o estilo escolhido foi registrado em _pendencias.md para o dono validar (docs/specs/_pendencias.md)
- Markdown e docs/ fora do Prettier (intencional) (.prettierignore)

## T-01.4 (rodada 1)

- NOTICE cita os caminhos skill/reference/ios.md e android.md, mas na cópia eles ficam em impeccable/reference/ (.claude/skills/NOTICE-impeccable.md)
- Não foi possível comparar a cópia com a fonte do OncoWay, que não foi localizada nesta máquina (.claude/skills/impeccable)
- Status da task ainda em [~]; quem muda o status é o enxuto.mjs (docs/specs/SPEC-01-fundacao/tasks.md)

## T-01.5 (rodada 1)

- Teste da porta é pulado quando ~/Antigravity/PORTS.md não existe (ex.: CI) (test/segredos.test.ts)
- Pre-commit falha de propósito sem gitleaks instalado; pode atrapalhar contribuidores do repositório público (.githooks/pre-commit)
- Regra de CPF só pega o formato com pontuação (.gitleaks.toml)

## T-02.1 — Números por posto da amostra de 12/11/2026

A amostra original não está no repositório nem nesta máquina, e só os totais aparecem no PRD e na
spec. As fixtures em `test/fixtures/` usam números **sintéticos** que mantêm o que se conhece: o
cabeçalho, 12 postos (2.3 e 4.1 zerados), 180 pacientes dos hospitalistas, 35 da cardiologia e geriatria
e os fatores entregues (21 médicos na semana, 10 no fim de semana; 2.3 = 1 e 4.1 = 2,5; 6.x = 2 e 1).
O total de potenciais admissões (15) e a divisão por posto foram inventados. Se o dono quiser os
números exatos de cada posto, basta trocar a tabela `LINHAS` em `test/fixtures/gerar.ts` e rodar
`node test/fixtures/gerar.ts`; os nomes dos postos não identificam ninguém.

## T-02.1 (rodada 1)

- Números por posto e total de potenciais admissões (15) são inventados porque a amostra real não está disponível; está registrado em _pendencias.md e os totais conhecidos foram mantidos (test/fixtures/gerar.ts)

## T-02.2 — UTF-8 sem BOM

A spec manda decodificar em Latin-1 e usar UTF-8 só com BOM, mas a fixture
`relatorio-9998-virgula.csv` da T-02.1 é UTF-8 sem BOM, como sai de muitas planilhas. Lida como
Latin-1, ela teria os acentos quebrados ("InternaÃ§Ã£o"). A decodificação continua em Latin-1 por
padrão e usa UTF-8 com BOM. Sem BOM, também usa UTF-8 quando há bytes acima de 0x7F e todos formam
UTF-8 válido, o que um Latin-1 acentuado praticamente nunca faz. Se o dono preferir a regra estrita,
basta tirar esse ramo e trocar a fixture por Latin-1.

## T-02.2 (rodada 1)

- Heurística extra de UTF-8 sem BOM vai além da spec (documentada em _pendencias.md) (src/relatorio/decodificar.ts)
- Parâmetro `nome` de decodificarRelatorio não é usado (src/relatorio/decodificar.ts)

## T-02.3 — Ponto decimal e ordinal opcional

- `lerNumero` aceita, além da vírgula (`11,2`, `,5`), o ponto como decimal (`2.5`), para CSV ou xlsx
  salvos por outra ferramenta. Não há separador de milhar. Se o dono quiser só a vírgula, basta trocar
  `[.,]` por `,` em `src/relatorio/numeros.ts`.
- `extrairCodigoPosto` aceita o nome mesmo sem o ordinal (`Posto 2 - 4 PAV` → `4.2`), além de `º`, `°`,
  `o`, `Âº` e `Â°`.

## T-02.3 (rodada 1)

- lerNumero aceita ponto decimal além da vírgula, indo um pouco além da spec (registrado em _pendencias.md) (src/relatorio/numeros.ts)
- extrairCodigoPosto aceita o nome sem ordinal, indo um pouco além da spec (registrado em _pendencias.md) (src/relatorio/posto.ts)
- lerContagem('-0') é aceita e devolve -0 (src/relatorio/numeros.ts)

## T-02.4 — Decisões da validação

- **Posto duplicado:** gera erro e só a primeira ocorrência entra nos postos; a repetida fica de fora.
- **Linha com número inválido:** sai dos postos inteira (com um erro para cada célula inválida); se
  nenhuma linha sobrar, também sai o erro "relatório sem postos".
- **Linha sem nome do posto** (com números): erro na linha, caso que a spec não cita.
- **Numeração das linhas:** conta só as linhas com conteúdo, com o cabeçalho na linha 1; uma linha em
  branco no meio do arquivo desloca o número em relação ao editor de texto.
- **xlsx:** `lerRelatorio` é síncrona e, até a T-02.5, devolve o erro `xlsx-sob-demanda`. A T-02.5
  deve decidir se a função passa a ser assíncrona para carregar o SheetJS por `import()`.
- **Dependência:** `zod` 4.6.7 entrou em `dependencies`, fixado.

## T-02.4 (rodada 1)

- Numeração das linhas ignora linhas em branco no meio do arquivo e pode divergir do editor (decisão registrada em _pendencias.md) (src/relatorio/ler.ts)
- xlsx ainda devolve erro xlsx-sob-demanda; leitura real fica para a T-02.5 (src/relatorio/ler.ts)
- textos/ importa tipo de relatorio/numeros, acoplando interface à leitura (só type import) (src/textos/index.ts)

## T-02.5 — SheetJS e leitura assíncrona

- **Origem do SheetJS:** `xlsx` 0.20.3 entrou em `dependencies` pelo tarball oficial
  (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), como a própria SheetJS recomenda. A versão do
  registro npm parou na 0.18.5, que tem avisos de segurança conhecidos. O lockfile fixa o hash. Se o
  dono preferir só o registro npm, a troca é no `package.json`.
- **`lerRelatorio` virou assíncrona** (`Promise<ResultadoLeitura>`), porque o `import('xlsx')` dinâmico
  só existe assim. Texto tabulado e CSV não carregam nada além do que já carregavam.
- **xlsx:** lê só a primeira planilha, sem fórmulas; números saem com ponto decimal, que `lerNumero` já
  aceita. Um xlsx que o SheetJS não consegue abrir gera o erro `xlsx-ilegivel` (substitui o
  `xlsx-sob-demanda` da T-02.4).
- **Bundle inicial:** verificado por teste (nenhum import estático de `xlsx` em `src/`) e pelo build, que
  não traz o SheetJS. A página ainda não usa a leitura; quando a tela de upload chegar, o SheetJS deve
  aparecer só num chunk separado.

## T-02.5 (rodada 1)

- SheetJS 0.20.3 instalado pelo tarball do CDN da SheetJS, fora do registro npm (hash fixado no lockfile, escolha registrada em _pendencias.md) (package.json)
- textoDaCelula transforma Date em texto ISO; irrelevante para as colunas do 9998, mas célula de data formatada viraria texto inesperado (src/relatorio/ler.ts)

## T-03.1

- **3.1 na semana (`escalaPropria`):** a spec traz "—" em médicos; o quadro grava `medicos: 0`, já que
  esses setores ficam fora das somas da média. Se o dono quiser mostrar a escala própria do 3.1, vira um
  campo à parte.
- **Ids dos setores:** `2` para o 2º andar e `3.1+6.1` para o setor fundido do fim de semana; os demais
  usam o código do posto principal.

## T-03.1 (rodada 1)

- 3.1 da semana (escalaPropria) grava medicos: 0 onde a spec traz '—'; decisão registrada em _pendencias.md (src/config/quadros.ts)
- Spec cita config/quadros.ts; arquivo criado em src/config/quadros.ts (src/config/quadros.ts)
