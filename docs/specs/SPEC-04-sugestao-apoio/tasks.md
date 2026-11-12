# Tasks — SPEC-04 Sugestão de apoio

- [ ] **T-04.1 — Tipos e aplicarApoios**
  - Depende de: T-03.4
  - Aceite:
    - Tipo `Apoio`.
    - `aplicarApoios` recalcula a carga ponderada (1,25 no apoiador) e as cores contra a média original.
    - Invariantes testados.

- [ ] **T-04.2 — Busca exaustiva de referência (só para testes)**
  - Depende de: T-04.1
  - Aceite:
    - Busca até 3 apoios em painéis pequenos, seguindo os critérios lexicográficos da spec.
    - Fica em `test/`, fora do bundle.

- [ ] **T-04.3 — sugerirApoios (guloso e melhoria local)**
  - Depende de: T-04.1
  - Aceite:
    - Algoritmo determinístico.
    - Restrições da spec respeitadas.
    - `completo: false` quando não houver solução toda no verde.

- [ ] **T-04.4 — Casos de aceitação e propriedades**
  - Depende de: T-04.2, T-04.3, T-03.5
  - Aceite:
    - Casos da spec verdes.
    - O guloso empata com a busca exaustiva em pelo menos 95% dos painéis aleatórios. As divergências ficam registradas no teste.

- [!] **T-04.5 — Conferência do dono**
  - Depende de: T-04.4
  - Bloqueada até o dono revisar a sugestão para a amostra de 12/11/2026 e para pelo menos 2 relatórios reais de outros dias.
  - Aceite:
    - O resultado aprovado vira teste de regressão.
