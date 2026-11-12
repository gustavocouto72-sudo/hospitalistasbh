# Divisão de carga dos hospitalistas

Calculadora aberta e sem login para dividir os pacientes entre os hospitalistas de cada setor.
Ela lê o relatório 9998 do TASY, mostra quantos pacientes cada médico tem em cada setor, compara com
a média do dia num semáforo de cinco cores e sugere leitos de apoio entre setores para equilibrar a
carga.

## Como usar

1. Escolha o tipo de dia (dia de semana ou fim de semana). O padrão segue a data de hoje.
2. Suba o relatório 9998 (`.xls`, `.csv` ou `.xlsx`) ou use **Preencher à mão**.
3. Confira os cartões dos setores. Dá para mudar o número de médicos (em passos de 0,5) e as contagens.
4. Veja os apoios sugeridos. Aceite, edite, troque ou remova cada um, e compare **Antes** e **Depois**.
5. Use **Imprimir ou gerar PDF** para tirar a folha do dia.

## Regra do cálculo

- **Carga do setor:** pacientes dos hospitalistas. Cardiologia e geriatria ficam de fora.
- **Média do dia:** soma das cargas dividida pela soma dos médicos. Setores com escala própria não entram.
- **Semáforo** (diferença em pacientes por médico, em relação à média):

  | Diferença | Cor |
  | --- | --- |
  | abaixo de −2 | azul-escuro |
  | de −2 até −1 | azul-claro |
  | de −1 a +1 | verde |
  | de +1 até +2 | amarelo |
  | acima de +2, ou setor sem médico | vermelho |

- **Apoio:** o leito apoiado pesa 1,25 para quem apoia e sai inteiro do setor apoiado. A sugestão busca
  o menor número de setores fora do verde, depois o menor número de apoios e de leitos.

O detalhamento está em [`docs/prd.md`](docs/prd.md) e nas specs em [`docs/specs/`](docs/specs/README.md).

## Privacidade

- O arquivo é lido **só no navegador**. O site é estático, sem servidor, banco de dados, login,
  analytics ou scripts de terceiros.
- A política de segurança (`vercel.json`) impede o envio de dados para outro endereço
  (`connect-src 'self'`, `form-action 'none'`), e um teste ponta a ponta confere que nada sai da página.
- O repositório não tem dados reais: todas as fixtures em `test/fixtures/` são sintéticas.

## Rodar localmente

Requer Node 24 e pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3010
pnpm test         # testes unitários (Vitest)
pnpm build && pnpm e2e   # site estático em out/ e testes Playwright
```

## Licença

MIT. A skill `impeccable` em `.claude/skills/` segue a Apache 2.0 (veja `LICENSE`).
