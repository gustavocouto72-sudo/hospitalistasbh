# SPEC-05 — Interface

Referências: PRD §4, §6 e §7. Toda a interface é feita com a skill `impeccable`, carregada antes de qualquer trabalho de UI.

## Problema

O hospitalista do dia precisa, em menos de 1 minuto e muitas vezes pelo celular, subir o relatório, conferir os médicos, ver quem está sobrecarregado e decidir os apoios.

## Fluxo (página única)

1. **Topo:** título, data de hoje e seletor **Dia de semana / Fim de semana**. O padrão vem do dia atual: sábado e domingo marcam fim de semana. O seletor pode ser trocado à mão.
2. **Subir relatório:** área de arrastar e soltar, mais um botão "Escolher arquivo". Aceita `.xls`, `.csv` e `.xlsx`. Logo abaixo aparece a frase "O arquivo é lido só neste aparelho. Nada é enviado nem guardado."
   - Avisos e erros da SPEC-02 aparecem em linguagem simples, com a linha afetada.
   - Também há um botão "Preencher à mão", que abre o quadro zerado.
3. **Quadro de setores:** um cartão por setor, com:
   - nome e postos;
   - médicos, editáveis com botões − e + em passos de 0,5;
   - pacientes dos hospitalistas, cardiologia e geriatria, e potenciais admissões (com destaque), todos editáveis;
   - pacientes por médico em número grande;
   - diferença para a média ("+1,8");
   - cor e rótulo ("Acima da média").
   - O 3.1 na semana aparece como cartão discreto "Escala própria".
   - Os postos ocultos ficam numa linha recolhível.
4. **Resumo do dia:** média de pacientes por médico, total de médicos, total de pacientes e quantos setores estão em cada cor.
5. **Sugestão de apoio:** lista de frases "**4.5** apoia **3 leitos** do **4.3**". Cada frase tem botões de aceitar, editar leitos, trocar apoiador e remover. Também há o botão "Adicionar apoio" e o seletor **Antes / Depois**, que muda os cartões entre os números sem apoio e com os apoios aceitos.
6. **Saída:** botão "Imprimir ou gerar PDF" (SPEC-06).

## Regras de interface

- **Responsiva:** desenhada primeiro para 360 px de largura.
- **Cartões:** uma coluna no celular, grade no desktop.
- **Cores:** o semáforo usa cinco cores com contraste AA, sempre com número e rótulo. A cor nunca é a única pista.
- **Paleta:** azul escuro e azul claro não podem ser confundidos com o verde para quem é daltônico. A paleta final passa pela validação da skill.
- **Textos:** em português, todos em `textos/`.
- **Estado:** fica só na memória da página. Recarregar a página zera tudo.
  - Exceção opcional: guardar em `localStorage` só as preferências (último tipo de dia escolhido), nunca as contagens.
- **Acessibilidade:** navegação inteira por teclado e rótulos ARIA nos botões − e +.
- **Atualização:** os números se refazem na hora, sem botão "calcular".

## Critérios de aceite

- Da amostra subida até a sugestão na tela, em menos de 1 minuto.
- Funciona em celular de 360 px sem rolagem horizontal.
- Editar médicos ou contagens recalcula cores e sugestões na hora.
- Recarregar a página não deixa nenhum dado de pacientes.

## Testes esperados

- Testes de componente com Testing Library: subir a fixture, editar médicos, aceitar e remover um apoio, e alternar Antes/Depois.
- Teste ponta a ponta com Playwright num viewport de celular e outro de desktop, usando a fixture da amostra.
- Verificação automática de contraste das cinco cores.
