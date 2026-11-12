---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Página única: divisão de carga

Modo: Operate. Público: hospitalista ou coordenador do dia, no celular (360 px) ou no computador do hospital,
uma vez por dia. Tarefa: subir o relatório 9998, conferir médicos, ler o semáforo e decidir os apoios em menos
de 1 minuto. Restrições: SPEC-05 e PRODUCT.md. Rodada sem o dono (loop): direção atribuída pelo seed, sem
página de decisão; o dono revisa ao fim.

## Direction contract

THESIS: cada setor é uma linha de tabela de consulta plastificada do posto de enfermagem: densa, preta no branco, com a cor presa na faixa do cabeçalho. Recusa o painel de cartões de métrica com sombra e gráfico.

OWN-WORLD: página cinza-mesa (#eef0f2), papel branco com canto de 8 px e fio de 1 px, tinta #14181f, números tabulares do sistema, botões pretos. A cor só existe nas cinco faixas do semáforo e no violeta das admissões.

STORY: a pessoa sobe o arquivo, vê na hora quais faixas estão vermelhas ou amarelas, lê "4.5 apoia 3 leitos do 4.3", aceita ou ajusta e imprime.

FIRST VIEWPORT: no topo, título, data e o seletor Dia de semana / Fim de semana. Abaixo, a área de subir o relatório com o botão preto "Escolher arquivo" e a frase de privacidade. Depois do upload, o resumo do dia numa linha e os cartões, com a faixa colorida em cima, a carga por médico em 36 px e a régua de cinco casas.

FORM: candidata 7 da lista própria (tabela de diluição plastificada do posto). seed:0adbe83570ad4207

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
