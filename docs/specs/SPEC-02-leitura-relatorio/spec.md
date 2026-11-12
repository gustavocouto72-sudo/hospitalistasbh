# SPEC-02 — Leitura do relatório 9998

Referências: PRD §6.1 e Anexo A.

## Problema

O TASY exporta um arquivo com extensão `.xls` que, por dentro, é texto separado por tabulação, em Latin-1 e com vírgula decimal. O site precisa transformá-lo em contagens por posto sem depender das colunas calculadas, que vêm com fatores errados.

## Comportamento esperado

`lerRelatorio(arquivo: ArrayBuffer, nome: string): ResultadoLeitura`

- **Formato:** detecta o formato pelo conteúdo, não pela extensão.
  - Texto tabulado (o caso real): decodifica em **ISO-8859-1**. Se o conteúdo for UTF-8 válido com BOM, usa UTF-8.
  - `.csv` com `;` ou `,` como separador.
  - `.xlsx` real, pela biblioteca SheetJS, carregada só quando o arquivo for xlsx.
- **Cabeçalho:** localiza as colunas pelo nome, ignorando acento, caixa e espaços:
  - `Ds posto` → `posto`
  - `Qt hospitalistas` → `hospitalistas`
  - `Qt cardio geriatria` → `cardioGeriatria`
  - `Qt potenciais admissoes` → `potenciaisAdmissoes`
- **Colunas ignoradas:** pacientes por médico, fatores e qualquer coluna desconhecida.
- **Linha "Total":** ignorada.
- **Código do posto:** extrai do nome com o padrão `Posto <N> - <A>º PAV` → `<A>.<N>`. Exemplo: "Unidade de Internação Posto 2 - 4º PAV" → `4.2`. Aceita `º`, `°` ou `o`, e também o acento quebrado pelo Latin-1.
- **Números:** aceita `20`, `11,2`, `,5` e `0,5`. Contagens devem ser inteiros ≥ 0.
- **Saída:** `{ postos: ContagemPosto[], avisos: Aviso[], erros: Erro[] }`, validada com Zod.

```ts
type ContagemPosto = {
  codigo: string;            // "4.2"
  nomeOriginal: string;
  hospitalistas: number;     // carga
  cardioGeriatria: number;   // informativo
  potenciaisAdmissoes: number; // recorte de hospitalistas
};
```

## Regras e invariantes

- `potenciaisAdmissoes ≤ hospitalistas`. Se vier maior, gera um aviso, sem bloquear a leitura.
- Um código de posto que aparece duas vezes gera um erro.
- O arquivo nunca sai do navegador: a leitura usa `File.arrayBuffer()` e nada de `fetch`.

## Casos de borda

- Arquivo vazio ou só com cabeçalho → erro "relatório sem postos".
- Coluna obrigatória ausente → erro que diz qual coluna falta.
- Posto com nome fora do padrão → aviso, e o posto entra com o nome original como código, editável na tela.
- Número inválido (texto, negativo ou decimal numa contagem) → erro na linha, e as outras linhas continuam.
- Linhas em branco no fim do arquivo → ignoradas.

## Critérios de aceite

- A amostra real, convertida em fixture sintética com os mesmos números e cabeçalho, gera 12 postos com as contagens corretas.
- Acentos corretos em `nomeOriginal`.
- Total de hospitalistas = 180 e de cardiologia e geriatria = 35, recalculados a partir dos postos.

## Testes esperados

- Fixture tabulada em Latin-1 (cópia sintética da amostra).
- A mesma fixture em UTF-8 com BOM.
- CSV com `;`.
- Pelo menos um `.xlsx`.
- Um teste para cada caso de borda acima.
- Teste de propriedade: qualquer nome no padrão `Posto N - Aº PAV` gera `A.N`.
