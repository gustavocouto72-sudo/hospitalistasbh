# SPEC-06 — Impressão e PDF

Referência: PRD §6.5.

## Problema

A equipe recebe a divisão do dia impressa ou em PDF. A tela interativa não serve para isso.

## Comportamento esperado

- O botão "Imprimir ou gerar PDF" chama `window.print()`. No celular e no desktop, o próprio navegador oferece "Salvar como PDF". Não há biblioteca de PDF nem servidor.
- **Folha de impressão (`@media print`)**, em uma página A4 retrato sempre que possível:
  - **Cabeçalho:** "Divisão dos hospitalistas", data e hora em que foi gerada, e tipo de dia.
  - **Tabela por setor:** postos, médicos, pacientes, pacientes por médico antes e depois do apoio, e cor com rótulo.
  - **Lista de apoios aceitos**, em frases.
  - **Rodapé:** média do dia, totais e "Gerado em <endereço do site>. Nenhum dado foi guardado."
- **O que não sai na impressão:** botões, área de upload e controles de edição.
- **Cores:** são impressas, mas o rótulo de texto sempre acompanha, para quem imprime em preto e branco.
- **Conteúdo:** imprime só os apoios aceitos. As sugestões que não foram aceitas não aparecem.

## Critérios de aceite

- Com a amostra, a folha cabe em 1 página A4 no Chrome e no Safari.
- Em preto e branco, continua legível pelo rótulo.
- O PDF salvo no celular (Android e iOS) mostra a tabela inteira.

## Testes esperados

- Playwright `page.pdf()` com a fixture: 1 página e textos-chave presentes.
- Teste de snapshot da folha de impressão.
