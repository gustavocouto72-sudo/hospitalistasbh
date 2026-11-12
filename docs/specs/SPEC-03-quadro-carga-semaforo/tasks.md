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

- [ ] **T-03.5 — Teste de aceitação com a amostra**
  - Depende de: T-03.4, T-02.4
  - Aceite:
    - Da fixture até o painel, a tabela da spec bate na semana e no fim de semana.
