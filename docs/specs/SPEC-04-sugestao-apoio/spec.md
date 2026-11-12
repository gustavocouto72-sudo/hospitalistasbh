# SPEC-04 — Sugestão de apoio

Referência: PRD §6.4.

## Problema

Com o painel pronto, a equipe precisa saber quais setores apoiam quais, e com quantos leitos, para que todos fiquem no verde. Apoiar quebra a lógica geográfica, então o sistema deve sugerir o mínimo de apoios.

## Termos

- **Apoio:** `{ de: setorApoiador, para: setorApoiado, leitos: n }`. Lê-se "o setor A apoia n leitos do setor B".
- **Carga ponderada do setor após o apoio:**
  - No apoiado: carga − leitos cedidos.
  - No apoiador: carga + **1,25** × leitos recebidos.
- **Referência:** a média do dia **antes** do apoio (SPEC-03). Ela não muda depois, porque a quantidade de pacientes reais é a mesma; o peso 1,25 só mede o esforço de quem apoia.

## Comportamento esperado

`sugerirApoios(painel, opcoes?) → { apoios: Apoio[], painelDepois: Painel }`

**Objetivo, em ordem de prioridade:**
1. Minimizar o número de setores fora do verde. Setores `semMedico` precisam ceder todos os leitos.
2. Entre as soluções empatadas, minimizar o número de apoios (pares).
3. Depois, minimizar o total de leitos de apoio.
4. Depois, minimizar a maior carga ponderada por médico.
5. O desempate final é a ordem dos setores no quadro, para manter o resultado determinístico.

**Restrições:**
- Leitos inteiros (≥ 1 por apoio).
- Qualquer setor pode apoiar qualquer outro, e não há teto de leitos.
- Um apoiador não pode sair do verde para cima, ou seja, a diferença dele não pode passar de +1.
- Um setor não é apoiador e apoiado ao mesmo tempo.
- Setores `escalaPropria` não participam.

**Algoritmo sugerido (a validar por testes):**
1. Fazer uma busca gulosa determinística: enquanto existir um setor acima do verde ou `semMedico`, pegar o mais sobrecarregado.
2. Escolher como apoiador o setor com mais folga, ou seja, a menor carga ponderada por médico.
3. Transferir o menor número inteiro de leitos que leve o apoiado para o verde sem tirar o apoiador do verde. Se não der, transferir o máximo que o apoiador aguenta e repetir com o próximo apoiador.
4. Ao final, fazer uma melhoria local que funda apoios redundantes e tente reduzir pares.
5. Como são no máximo uns 10 setores, vale comparar o resultado guloso com uma busca exaustiva limitada (até 3 apoios) nos testes, para conferir a otimalidade nos casos de aceitação.

**Sem solução que deixe todos no verde** (ex.: carga total alta demais para os médicos do dia): devolver a melhor solução pelos critérios acima e marcar `completo: false`, com um aviso "nem todos os setores cabem no verde hoje".

## Edição pela equipe

- `aplicarApoios(painel, apoios) → Painel`, usada tanto pela sugestão quanto pela edição manual: aceitar, mudar o número de leitos, trocar o apoiador, remover ou criar um apoio.
- A interface chama essa função a cada mudança, e tudo é recalculado na hora.

## Invariantes

- Σ pacientes reais (sem o fator 1,25) antes = depois.
- Nenhum setor cede mais leitos do que tem.
- A mesma entrada dá sempre a mesma sugestão.

## Critérios de aceite

- **Amostra de 12/11/2026, semana:** o 4.3 (11,5) e o 4.2 (11,2) estão no amarelo. A sugestão deve trazer os dois para o verde com no máximo 2 apoios, tendo como apoiadores 4.5 e/ou 6.1, que estão no azul claro. O resultado exato fica registrado no teste depois de conferido pelo dono.
- **Caso com 2.1 = 20 pacientes e 1 médico** (o exemplo do áudio): a sugestão tira o setor do vermelho.
- **Setor `semMedico` com 6 pacientes:** todos os 6 leitos vão para outros setores.
- **Painel todo no verde:** nenhum apoio.

## Testes esperados

- Os casos de aceitação acima.
- Testes de propriedade: os invariantes, mais "nunca piora o número de setores fora do verde" e o determinismo.
- Comparação com a busca exaustiva em painéis aleatórios pequenos (até 6 setores).
- `aplicarApoios` com edição manual: remover, alterar e criar.
