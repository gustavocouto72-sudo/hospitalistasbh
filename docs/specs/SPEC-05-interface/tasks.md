# Tasks — SPEC-05 Interface

- [x] **T-05.1 — Direção visual com a impeccable**
  - Depende de: T-01.4
  - Aceite:
    - Tokens de cor (incluindo as cinco do semáforo, validadas para contraste e daltonismo), tipografia e espaçamento.
    - Direção registrada em `DESIGN.md` na raiz.
    - Não bloqueia o loop: o dono revisa a direção visual ao fim.

- [x] **T-05.2 — Topo e seletor de tipo de dia**
  - Depende de: T-05.1, T-03.1
  - Aceite:
    - Padrão pelo dia da semana e troca manual.
    - O quadro padrão muda junto com o seletor.

- [x] **T-05.3 — Subir relatório e preencher à mão**
  - Depende de: T-05.1, T-02.4
  - Aceite:
    - Arrastar e soltar, mais botão.
    - Avisos e erros legíveis.
    - Frase de privacidade.
    - Opção "Preencher à mão".

- [x] **T-05.4 — Cartões de setor e resumo do dia**
  - Depende de: T-05.2, T-03.5
  - Aceite:
    - Edição de médicos (passos de 0,5) e de contagens.
    - Cores e rótulos.
    - Cartão "Escala própria" do 3.1 e postos ocultos recolhíveis.
    - Resumo do dia.

- [x] **T-05.5 — Lista de apoios com edição**
  - Depende de: T-05.4, T-04.4
  - Aceite:
    - Aceitar, editar, trocar, remover e adicionar apoio.
    - Seletor Antes/Depois.
    - Aviso quando `completo: false`.

- [x] **T-05.6 — Testes de componente e ponta a ponta**
  - Depende de: T-05.5
  - Aceite:
    - Testing Library e Playwright (celular e desktop) verdes com a fixture.
    - Revisão final da impeccable (finish) sem achados altos.

- [x] **T-05.7 — Planilha única (revisão do dono, 12/11/2026)**
  - Pedido do dono depois de ver o site: menos rolagem e tudo numa tela, pensando no computador.
  - Aceite:
    - Os cartões viram uma planilha com uma linha por setor: médicos (− e +), pacientes, cardio/geri, potenciais admissões, carga por médico, diferença para a média e a situação em célula colorida, sem apoio e com a recomendação.
    - Topo numa faixa: tipo de dia, subir relatório (botão ou arrastar para a página), preencher à mão, editar contagens e imprimir; média, totais e legenda numa linha.
    - A recomendação de apoio fica embaixo, enxuta, em frases editáveis no lugar. Ela já vale na coluna "Com apoio" e na folha, sem o passo de aceitar e sem o seletor Antes/Depois.
    - No celular, as colunas secundárias somem, a coluna do setor fica fixa e um quadradinho da cor vai ao lado do nome.
