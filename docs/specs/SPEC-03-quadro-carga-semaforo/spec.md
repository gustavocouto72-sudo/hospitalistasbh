# SPEC-03 — Quadro de setores, carga e semáforo

Referências: PRD §6.2 e §6.3.

## Problema

As contagens chegam por posto, mas a equipe trabalha por setor, e o agrupamento muda conforme o tipo de dia. É preciso juntar postos em setores, dividir a carga pelos médicos e comparar com a média do dia.

## Termos

- **Posto:** a unidade do relatório (`4.2`).
- **Setor:** um ou mais postos atendidos por uma equipe. Tem `id`, `nome`, `postos[]`, `medicos` e `modo` (`calculado` ou `escalaPropria`).
- **Tipo de dia:** `semana` ou `fimDeSemana`.

## Quadros padrão (`config/quadros.ts`)

**Semana: 18 médicos**

| Setor | Postos | Médicos | Modo |
|---|---|---|---|
| 2º andar | 2.1, 2.2 | 3 | calculado |
| 3.1 | 3.1 | — | escalaPropria |
| 4.2 | 4.2, 4.1 | 2,5 | calculado |
| 4.3 | 4.3 | 2 | calculado |
| 4.4 | 4.4 | 2 | calculado |
| 4.5 | 4.5 | 2 | calculado |
| 6.1 | 6.1 | 1,5 | calculado |
| 6.2 | 6.2 | 2,5 | calculado |
| 6.3 | 6.3 | 2,5 | calculado |

**Fim de semana: 8 médicos**

| Setor | Postos | Médicos | Modo |
|---|---|---|---|
| 2º andar | 2.1, 2.2 | 1 | calculado |
| 3.1 + 6.1 | 3.1, 6.1 | 1 | calculado |
| 4.2 | 4.2, 4.1 | 1 | calculado |
| 4.3 | 4.3 | 1 | calculado |
| 4.4 | 4.4 | 1 | calculado |
| 4.5 | 4.5 | 1 | calculado |
| 6.2 | 6.2 | 1 | calculado |
| 6.3 | 6.3 | 1 | calculado |

## Comportamento esperado

`montarQuadro(postos, tipoDia, ajustes?) → Quadro`

- **Contagens:** soma as contagens dos postos de cada setor.
- **Postos fora do quadro** (como o 2.3 ou um posto novo):
  - Zerados → ficam numa lista `postosOcultos`.
  - Com pacientes → viram um setor próprio com 0 médicos e um aviso.
- **Ajustes:** médicos editados no dia, em passos de 0,5 e ≥ 0, e contagens corrigidas à mão. Os ajustes vencem o padrão.

`calcularCarga(quadro) → Painel`

- **Carga do setor** = Σ `hospitalistas` dos postos.
- **Carga por médico** = carga ÷ médicos. Com 0 médicos e carga > 0, o setor fica com estado `semMedico`, e carga por médico = ∞ para fins de ordenação.
- **Média do dia** = Σ carga ÷ Σ médicos, somando só os setores `calculado`.
  - Setores `escalaPropria` ficam fora das duas somas.
  - Setores `semMedico` entram na carga, porque alguém vai ter de atender aqueles pacientes, mas não somam médicos.
- **Diferença** = carga por médico − média.
- **Arredondamento:** só na exibição, com uma casa decimal. As contas usam números exatos.

`corDoSemaforo(diferenca) → Cor`

| Faixa | Cor |
|---|---|
| d < −2 | `azulEscuro` |
| −2 ≤ d < −1 | `azulClaro` |
| −1 ≤ d ≤ +1 | `verde` |
| +1 < d ≤ +2 | `amarelo` |
| d > +2 ou `semMedico` | `vermelho` |

Os valores exatamente em ±1 e ±2 caem na faixa mais próxima do verde.

## Regras e invariantes

- Puro e determinístico: a mesma entrada dá sempre o mesmo painel.
- Σ médicos dos setores `calculado` do quadro padrão = 18 na semana e 8 no fim de semana.
- Cada posto pertence a no máximo um setor por tipo de dia.
- Sem médicos em nenhum setor (Σ = 0) → a média fica indefinida e o painel avisa, sem quebrar.

## Casos de borda

- Relatório sem um posto do quadro → o setor fica com carga 0 e um aviso "posto ausente no relatório".
- Setor com médicos e carga 0 → `azulEscuro`.
- O 3.1 na semana aparece no painel com as contagens, marcado como "escala própria" e sem cor.

## Critérios de aceite

Com a amostra de 12/11/2026, no quadro de **semana**:

| Setor | Pacientes por médico | Cor |
|---|---|---|
| 4.3 | 11,5 | amarelo |
| 4.2 | 11,2 | amarelo |
| 6.2 | 10,4 | verde |
| 4.4 | 10 | verde |
| 2º andar | 9 | verde |
| 6.3 | 8,8 | verde |
| 4.5 | 8 | azul claro |
| 6.1 | 8 | azul claro |

A média é 174 ÷ 18 = 9,67.

## Testes esperados

- A tabela acima como teste de aceitação.
- O mesmo para o fim de semana, com a carga do 3.1 + 6.1 = 18.
- Fronteiras do semáforo: −2, −1, +1, +2 e valores logo acima e abaixo de cada uma.
- Setor sem médico, posto oculto, posto novo com pacientes, ajuste de médicos e Σ médicos = 0.
- Teste de propriedade: Σ carga dos setores = Σ `hospitalistas` dos postos.
