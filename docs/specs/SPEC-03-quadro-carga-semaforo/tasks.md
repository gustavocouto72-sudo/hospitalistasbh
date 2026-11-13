# Tasks — SPEC-03 Quadro, carga e semáforo

- [x] **T-03.1 — Tipos e quadros padrão**
  - Depende de: T-01.3
  - Aceite:
    - Tipos `Setor`, `Quadro` e `TipoDia`.
    - `config/quadros.ts` com os dois quadros da spec.
    - Teste: Σ médicos = 18 na semana e 8 no fim de semana; nenhum posto repetido.

- [x] **T-03.2 — montarQuadro**
  - Depende de: T-03.1
  - Aceite:
    - Soma por setor.
    - 4.1 vai para o 4.2.
    - Ocultos e postos novos com pacientes viram setores sem médico.
    - Ajustes vencem o padrão.
    - Testes de borda verdes.

- [x] **T-03.3 — calcularCarga e média**
  - Depende de: T-03.2
  - Aceite:
    - Carga, carga por médico, média e diferença.
    - `escalaPropria` fora da média; `semMedico` com carga e sem médicos.
    - Teste de propriedade das somas.

- [x] **T-03.4 — corDoSemaforo**
  - Depende de: T-03.3
  - Aceite:
    - Cinco cores com as fronteiras da spec.
    - Testes de fronteira verdes.

- [x] **T-03.5 — Teste de aceitação com a amostra**
  - Depende de: T-03.4, T-02.4
  - Aceite:
    - Da fixture até o painel, a tabela da spec bate na semana e no fim de semana.

- [x] **T-03.6 — Residente (pedido do dono, 12/11/2026)**
  - O residente é definido no dia, de manhã, sobretudo no fim de semana. Divide a carga do setor, mas conta como meio médico (`PESO_DO_RESIDENTE = 0,5`, em `src/calculo/residente.ts`).
  - Aceite:
    - `Ajustes.residentes` por setor; `montarQuadro` soma 0,5 aos médicos da conta e guarda `medicosDaEscala` e `residente` à parte. A escala própria ignora o residente.
    - A carga por médico, a média, o semáforo e a sugestão de apoio usam os médicos com o residente.
    - Na tela, só uma caixa "Residente" por setor, ao lado de Médicos; o 0,5 não aparece. O topo mostra quantos residentes há, e a folha escreve "1 + residente".
    - Trocar o tipo de dia desmarca os residentes; subir outro relatório os mantém.
