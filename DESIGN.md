# Design — Divisão de carga dos hospitalistas

> Direção visual da T-05.1. Escrita no loop, sem o dono presente: a direção saiu do sorteio da skill
> `impeccable` (seed `seed:0adbe83570ad4207`) sobre uma lista de mundos do próprio público, sem página de
> decisão. **O dono revisa ao fim do loop** e pode pedir outra rodada. Ao fim da SPEC-05 (T-05.6), este
> arquivo é conferido contra a tela construída.
>
> Fonte da verdade dos valores: `src/tema/tokens.ts`, espelhado em `src/app/globals.css` (`@theme`). O teste
> `src/tema/tema.test.ts` confere que os dois batem, que o contraste passa AA e que as cinco cores do
> semáforo continuam distintas com daltonismo.

## Direção: a tabela plastificada do posto

**Cena.** Começo da manhã, sala dos médicos ou corredor da enfermaria, luz fluorescente forte. O hospitalista
do dia segura o celular com uma mão, ou usa o computador do hospital, e decide a divisão em menos de 1 minuto.
Por isso o tema é **claro**, o mesmo da folha impressa, sem modo escuro nesta versão.

**Mundo.** É a tabela de consulta plastificada presa no posto de enfermagem, como a de diluição de medicamentos:
densa, preta no branco, números alinhados em coluna, cantos arredondados do plástico e uma faixa colorida no
cabeçalho de cada bloco. Todo médico já lê esse objeto sem esforço. A tela é um produto de trabalho: o mundo
entra só com tipo, paleta, densidade e um gesto próprio. Layout, navegação e controles são os padrões da web.

**Estratégia de cor: contida, com a cor presa nas faixas.** Página cinza-mesa, cartões de papel branco, tinta
quase preta. A cor aparece **só** nas cinco faixas do semáforo e no violeta das potenciais admissões. Botões,
links e foco são pretos, para que nenhum azul da interface se confunda com o azul do semáforo.

**Gesto próprio: a régua de cinco casas.** Cada setor mostra, junto ao número e ao rótulo, uma régua com cinco
casas (azul escuro → vermelho), com a do setor cheia e as outras só no contorno. A posição diz o nível sem
depender da cor, funciona em preto e branco na impressão e é a terceira pista além do número e do rótulo.

### O que as rodadas descartadas deixaram (empréstimos de disciplina)

- **Do léxico com cor só na prancha:** a cor fica quarentenada na faixa do semáforo. Nada de cor decorativa.
- **Do quadro de partidas:** os setores ficam sempre na ordem fixa do quadro. Quando um número muda, ele muda no
  lugar e nada reordena nem pula.
- **Da fita lado A / lado B:** Antes e Depois são duas metades rígidas do mesmo cartão, trocadas pelo seletor e
  sem animação de virar.
- **Do atlas estelar:** o tamanho do número segue uma rampa fixa. A carga por médico é sempre o maior número do
  cartão, e nada mais compete com ela.

## Cores

### Neutros e papéis

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `pagina` | `#eef0f2` | Fundo da página | — |
| `papel` | `#ffffff` | Cartões, áreas de trabalho, impressão | — |
| `tinta` | `#14181f` | Texto principal, números | 15,6:1 na página |
| `tinta-suave` | `#4a5361` | Postos, rótulos de campo, notas | 6,8:1 na página |
| `linha` | `#d5d9df` | Fios divisórios dentro do cartão | decorativo |
| `linha-forte` | `#8a93a0` | Borda de campo e de controle | 3,1:1 no papel |
| `acao` / `acao-texto` | `#14181f` / `#ffffff` | Botão principal | 17,8:1 |
| `foco` | `#14181f` | Anel de foco de 2 px com 2 px de folga | ≥ 3:1 |
| `admissao` / `admissao-fundo` | `#6b2fa3` / `#f1e8fa` | Destaque das potenciais admissões | 6,9:1 |

### Semáforo

Cada cor tem três papéis: `fundo` (faixa cheia no cabeçalho do cartão), `texto` (o texto sobre a faixa) e
`traco` (rótulo, ícone ou borda sobre o papel). Toda faixa leva borda de 1 px no próprio `traco`, porque o
azul claro, o verde e o amarelo não chegam a 3:1 contra o papel branco e sumiriam sem ela.

| Cor | Faixa (`fundo`) | Texto na faixa | Contraste | Traço no papel | Contraste | Rótulo |
|---|---|---|---|---|---|---|
| Azul escuro | `#1d3f8f` | `#ffffff` | 9,7:1 | `#1d3f8f` | 9,7:1 | Muito abaixo da média |
| Azul claro | `#9ccbf2` | `#0b1d33` | 9,9:1 | `#1f5f99` | 6,7:1 | Abaixo da média |
| Verde | `#3daa6e` | `#0e2a12` | 5,3:1 | `#1e6b3f` | 6,5:1 | Na média |
| Amarelo | `#ffd84a` | `#2b2100` | 11,5:1 | `#7a5a00` | 6,4:1 | Acima da média |
| Vermelho | `#a51c1c` | `#ffffff` | 7,6:1 | `#a51c1c` | 7,6:1 | Sobrecarregado |

**Validação de daltonismo.** As faixas foram simuladas com as matrizes de Machado, Oliveira e Fernandes (2009),
com severidade total, e comparadas no OKLab. A menor distância entre duas faixas é:

| Visão | Menor distância (OKLab) | Par mais próximo |
|---|---|---|
| Normal | 0,22 | azul claro × verde |
| Protanopia | 0,19 | azul escuro × vermelho |
| Deuteranopia | 0,18 | verde × vermelho |
| Tritanopia | 0,16 | azul claro × amarelo |

O teste exige no mínimo 0,15 em todas as visões. O par que mais preocupava, azul × verde, se separa porque
as cores têm luminosidades bem diferentes: o azul escuro é escuro (L 0,39), o verde fica no meio (L 0,66) e o
azul claro é claro (L 0,82). Vermelho e verde, que se confundem na deuteranopia quando têm o mesmo brilho,
também ficam separados: o vermelho é escuro (L 0,47) e o verde, médio. Mesmo assim, a cor **nunca** é a única pista,
porque todo setor mostra número, rótulo e a régua de cinco casas.

## Tipografia

- **Família:** a fonte de sistema (`ui-sans-serif, system-ui, …`). Não baixa nada, não depende de terceiros e é
  a voz que o celular de cada um já lê bem. Uma família só, para títulos, rótulos, botões e números.
- **Números:** sempre tabulares (`font-variant-numeric: tabular-nums`, ligado no `html`), para que as colunas de
  médicos, pacientes e carga se alinhem como na tabela plastificada.
- **Escala fixa em rem**, sem tipo fluido:

| Token | Tamanho / entrelinha | Uso |
|---|---|---|
| `text-nota` | 0,75 rem / 1 rem | Notas, frase de privacidade secundária |
| `text-rotulo` | 0,875 rem / 1,25 rem | Rótulos de campo, postos, rótulo do semáforo |
| `text-corpo` | 1 rem / 1,5 rem | Texto corrido, frases de apoio |
| `text-titulo` | 1,25 rem / 1,75 rem | Nome do setor, títulos de seção |
| `text-numero` | 1,5 rem / 2 rem | Números do resumo do dia, diferença ("+1,8") |
| `text-carga` | 2,25 rem / 2,5 rem | Pacientes por médico, o maior número do cartão |

- Pesos: 400 no corpo, 600 em rótulos e nomes de setor, 700 só na carga por médico.

## Espaço, forma e profundidade

- **Base de 4 px**, a do Tailwind (`--spacing: 0.25rem`). Ritmo usado: 4, 8, 12, 16, 24 e 32 px. Grupos apertados
  (8 px dentro do cartão) e separação generosa entre blocos (24 a 32 px), com mais espaço acima de um título do que
  abaixo dele.
- **Cantos:** `rounded-cartao` (8 px), o canto do plástico, nos cartões. `rounded-controle` (6 px) em botões e
  campos.
- **Profundidade:** nenhuma sombra. O cartão se separa da página pelo contraste papel × mesa e por um fio de 1 px
  em `linha`. Não há sombra colorida, vidro, gradiente nem borda lateral colorida.
- **Gutter:** 16 px no celular, até 32 px no desktop.

## Layout e componentes (para as tasks seguintes)

- **Celular primeiro (360 px):** uma coluna, sem rolagem horizontal. No desktop, a grade dos cartões usa
  `repeat(auto-fill, minmax(18rem, 1fr))`.
- **Cartão de setor:** a faixa do semáforo no topo, com nome do setor e rótulo. Abaixo, em papel, a carga por
  médico em `text-carga`, a diferença em `text-numero`, a régua de cinco casas e uma tabela curta de médicos,
  hospitalistas, cardiologia e geriatria e admissões, com números alinhados à direita.
- **Escala própria (3.1 na semana):** o mesmo cartão sem faixa, com borda tracejada em `linha-forte` e o rótulo
  "Escala própria" em `tinta-suave`.
- **Setor sem médico:** a faixa vermelha com o rótulo próprio, nunca só a cor.
- **Botões − e +:** quadrados de 44 px, borda `linha-forte`, rótulo ARIA ("Tirar meio médico do 4.3").
- **Botão principal:** fundo `acao`, texto `acao-texto`. Secundário: papel com borda `linha-forte`.
- **Seletores (tipo de dia, Antes/Depois):** controle segmentado; o lado ativo fica em `tinta` com texto branco.
- **Potenciais admissões:** número em `admissao` sobre `admissao-fundo`, com a palavra "admissões" ao lado.
- **Avisos e erros de leitura:** texto em `tinta` com ícone e um fio superior de 2 px no `traco` amarelo (aviso)
  ou vermelho (erro), sempre com a linha afetada escrita.
- **Estados:** todo controle tem hover (fundo `pagina`), foco (anel `foco`), ativo, desabilitado (`tinta-suave`
  com 60 % de opacidade no contorno) e erro.
- **Movimento:** só para estado, de 150 a 200 ms com saída exponencial. Números atualizam no lugar, sem entrada
  animada. `prefers-reduced-motion` desliga tudo.
- **Impressão:** fundo branco, `print-color-adjust: exact` para as faixas saírem coloridas. A régua de cinco casas
  garante a leitura mesmo numa impressora preto e branco.

## Riscos e pendências

- Sem o dono no loop, a direção não passou pela página de decisão da skill. Se ele preferir outro mundo, como o
  quadro branco de passagem de plantão, que era a primeira da lista, basta uma nova rodada.
- Só tema claro nesta versão.

## Revisão do dono (12/11/2026): planilha única

O dono achou os cartões difíceis de ler e pediu tudo numa tela, como planilha, com uso principal no
computador. A direção continua a mesma (papel, tinta, cor só no semáforo), mas o gesto da régua de cinco casas
sai da tela e fica só na folha impressa. Na tela, a situação de cada setor é uma **célula cheia na cor do
semáforo, com o rótulo escrito**, como a formatação condicional de uma planilha. Colunas "Sem apoio" e "Com a
recomendação" lado a lado, como as colunas de antes e depois do HelmCare. Linhas compactas (controles de 28 px
no mouse, 40 px no toque) para os nove setores e a recomendação caberem em 1366 × 768 sem rolar.
