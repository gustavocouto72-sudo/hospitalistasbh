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

## T-03.2 — montarQuadro

- **Nome do retorno:** a spec diz `montarQuadro(...) → Quadro`, mas `Quadro` já é o tipo do quadro
  padrão (T-03.1). O retorno é `QuadroMontado`, com `setores` (cada um com `contagens` somadas e
  `postosAusentes`), `postosOcultos` e `avisos`.
- **Posto zerado:** é o que tem as três contagens em 0. Um posto fora do quadro só com cardiologia e
  geriatria vira setor sem médico (com carga 0).
- **Posto ausente:** todo posto do quadro que não vem no relatório gera aviso, inclusive o 4.1, que na
  prática pode não vir. Se o aviso do 4.1 incomodar, basta isentá-lo.
- **Ajustes inválidos** (médicos fora dos passos de 0,5 ou negativos; contagem não inteira ou negativa)
  lançam `RangeError`: a tela é quem impede esses valores. Ajuste de médicos para um setor que não existe
  no quadro do dia é ignorado.
- **Contagem digitada** para um posto ausente faz o posto existir e tira o aviso; zerar à mão um posto
  fora do quadro o esconde.
- **Postos novos com pacientes** entram depois dos setores do quadro, na ordem do relatório, com id e
  nome iguais ao código do posto.

## T-03.2 (rodada 1)

- Retorno nomeado QuadroMontado em vez de Quadro (diverge do texto da spec, decisão registrada em _pendencias.md) (src/calculo/tipos.ts)
- Ausência do 4.1 no relatório sempre gera aviso de posto ausente, possível ruído no uso diário (src/calculo/montar-quadro.ts)

## T-03.3 — Setor com 0 médicos e carga 0

A spec define `semMedico` só para 0 médicos com carga > 0 e não diz o que fazer com 0 médicos e
carga 0 (0 ÷ 0). Ficou um estado `vazio`: carga por médico e diferença `null`, fora do semáforo,
sem pesar na média. Também ficou `null` a diferença de todos os setores quando a média é indefinida
(Σ médicos = 0), e o painel traz o aviso `media-indefinida`. Ajustar se o dono preferir outra regra.

## T-03.3 (rodada 1)

- Estado 'vazio' (0 médicos e carga 0) não previsto na spec; decisão registrada em _pendencias.md e precisa de confirmação do dono (src/calculo/tipos.ts)

## T-03.4 (rodada 1)

- Nome dos casos em it.each usa %d, que trunca valores com épsilon e deixa o rótulo ambíguo (src/calculo/semaforo.test.ts)

## T-03.5 — Números por posto da fixture refeitos

Os hospitalistas por posto inventados na T-02.1 não reproduziam a tabela de aceite da SPEC-03 (por
exemplo, 4.3 tinha 19 em vez de 23). A tabela fixa quase todos os postos: 2º andar 27, 4.2 28 (com o 4.1
zerado), 4.3 23, 4.4 20, 4.5 16, 6.1 12, 6.2 26 e 6.3 22, que somam 174; com o total de 180, o 3.1 fica
com 6, o que bate com 3.1 + 6.1 = 18 no fim de semana. A tabela `LINHAS` de `test/fixtures/gerar.ts` foi
trocada e as fixtures regeneradas. Continuam inventados: a divisão do 2º andar (2.1 = 14, 2.2 = 13),
cardiologia e geriatria (total 35 mantido) e potenciais admissões. As fixtures de borda não mudaram.

O fim de semana não tem tabela na spec: o teste fixa a média 180 ÷ 8 = 22,5 e as cores que a regra do
semáforo dá (4.2, 2º andar e 6.2 vermelhos; 4.3 e 6.3 verdes; 4.4, 3.1 + 6.1 e 4.5 azul-escuros). Se o
dono tiver a tabela real do fim de semana, vale conferir.

## T-03.5 (rodada 1)

- Cores do fim de semana derivadas da regra, sem tabela de referência na spec (pendência já registrada) (test/aceitacao-amostra.test.ts)
- Números da fixture da T-02.1 alterados para servir ao aceite da SPEC-03; o acoplamento entre as specs está documentado em _pendencias.md (test/fixtures/gerar.ts)

## T-04.1 — `aplicarApoios` com apoio inválido

A spec não diz o que fazer quando a edição manual cria um apoio inválido. Ficou o mais simples:
`aplicarApoios` recusa com `RangeError` (texto em `src/textos/`) leitos que não são inteiros ≥ 1, setor
apoiando a si mesmo, setor fora do quadro, setor de escala própria, apoiador sem médico, setor que apoia e
é apoiado ao mesmo tempo e setor que cede mais leitos do que tem. A interface (T-05/F3) deve validar antes
ou mostrar a mensagem. Um setor sem médico que cede todos os leitos passa a `vazio`, fora do semáforo.
O resultado (`PainelComApoios`) guarda os números de antes em `antes`, mais `leitosCedidos`,
`leitosRecebidos` e `pacientes` (reais, sem o peso 1,25).

## T-04.1 (rodada 1)

- A spec descreve aplicarApoios → Painel; a função devolve PainelComApoios, compatível com Painel, o que está documentado e testado (src/calculo/aplicar-apoios.ts)
- O teste 'o resultado serve onde se espera um Painel' está fora do describe principal (src/calculo/aplicar-apoios.test.ts)

## T-04.2 — Critérios da busca exaustiva

- **"Fora do verde"** conta os azuis também, além de amarelos, vermelhos e `semMedico` com leitos, como diz a
  letra da spec e do PRD ("deixar todos os setores no verde"). Assim, um setor azul que apoia sai da conta, e a
  busca pode preferir uma solução que leva um azul ao verde. O passo guloso da spec só olha os setores acima
  do verde, então, se o dono quiser contar só os de cima, basta trocar `foraDoVerde` em
  `test/busca-exaustiva.ts` (e a T-04.3 deve seguir a mesma regra).
- **Efeito colateral da ordem dos critérios:** quando nem tudo cabe no verde, o critério 3 (menos leitos) vem
  antes do 4 (menor carga máxima). Num setor vermelho que não tem como ficar verde, a busca cede o mínimo de
  leitos que leva os apoiadores ao verde, e não o máximo que aliviaria o vermelho.
- **Critério 4** olha só os setores com médico; um `semMedico` que sobra (carga por médico infinita) não
  empata tudo.
- **Critério 5** compara os apoios ordenados por (apoiado, apoiador) como sequência de (posição do apoiado no
  quadro, posição do apoiador, leitos).
- Um par (apoiador, apoiado) aparece no máximo uma vez, e a média indefinida não gera apoio.

## T-04.2 (rodada 1)

- Azuis contam como 'fora do verde' no critério 1; decisão pendente do dono (registrada em _pendencias.md), e a T-04.3 deve seguir a mesma regra (test/busca-exaustiva.ts)
- Sem solução completa, o critério 3 (menos leitos) antes do 4 faz o setor vermelho ceder o mínimo de leitos, e não o máximo que o aliviaria; segue a spec e está documentado (docs/specs/_pendencias.md)

## T-04.3 — setores azuis contam como fora do verde

O critério 1 da spec ("minimizar o número de setores fora do verde") conta também os setores no azul. Quando
não há solução toda no verde, isso pode levar a sugestão a gastar os leitos de apoio para trazer os apoiadores
do azul ao verde, em vez de aliviar ao máximo o setor sobrecarregado. Exemplo sintético (média 10): A com 30
pacientes e 1 médico, B e C com 10 e 2 cada. A sugestão é B e C apoiarem 7 leitos cada (A fica em 16, ainda
vermelho, e B e C no verde), e não 9 cada (A em 12, amarelo). Segui a spec, que é o mesmo critério da busca
exaustiva da T-04.2. Se o dono preferir aliviar primeiro quem está acima do verde, o critério 1 precisa mudar.

## T-04.3 (rodada 1)

- Setores azuis contam como fora do verde no critério 1; sem solução completa, isso favorece trazer apoiadores ao verde em vez de aliviar o sobrecarregado (decisão pendente do dono) (docs/specs/_pendencias.md)
- Resultado exato da amostra de 12/11/2026 ainda não registrado no teste (aguarda conferência do dono) (src/calculo/sugerir-apoios.test.ts)
- Teste da T-04.3 não compara a sugestão com a busca exaustiva de test/busca-exaustiva.ts em painéis pequenos; se outra task não cobrir, falta esse teste (src/calculo/sugerir-apoios.test.ts)

## T-04.4 (rodada 1)

- Uma das 8 divergências (semente 5254) perde no critério foraDoVerde com o guloso limitado a 3 apoios; sem o limite ele não fica atrás. Está registrada e dentro da tolerância de 5%. (test/aceitacao-apoio.test.ts)

## T-05.1 — Direção visual sem o dono

A skill `impeccable` pede entrevista para o `PRODUCT.md` e uma página de decisão para a direção visual, mas o
loop não tem canal de pergunta. O `PRODUCT.md` foi inferido do PRD e da SPEC-05, com as inferências marcadas,
e a direção é a sorteada pela skill (tabela plastificada do posto, seed `seed:0adbe83570ad4207`). O dono revisa
o `DESIGN.md` ao fim do loop. Também ficou de fora o modo escuro: só há tema claro, o mesmo da impressão.

## T-05.1 (rodada 1)

- Só há tema claro; o modo escuro ficou registrado como pendência (DESIGN.md)
- Direção visual escolhida sem a etapa de decisão da skill e sem o dono; PRODUCT.md inferido do PRD (PRODUCT.md)
- As razões de contraste citadas no DESIGN.md (por exemplo, 15,6:1) não são conferidas pelo teste, que só garante o mínimo AA (DESIGN.md)
- A régua de cinco casas está só descrita, ainda sem componente nem token próprio (DESIGN.md)
