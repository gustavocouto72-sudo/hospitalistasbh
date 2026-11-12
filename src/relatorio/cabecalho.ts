/**
 * Mapeamento das colunas do relatório 9998 pelo nome (SPEC-02, "Cabeçalho").
 *
 * Os nomes são comparados sem acento, caixa nem espaços. Colunas desconhecidas, as de pacientes por
 * médico e as de fatores ficam de fora.
 */

export type Coluna = 'posto' | 'hospitalistas' | 'cardioGeriatria' | 'potenciaisAdmissoes';

/** Ordem em que as colunas obrigatórias são conferidas e relatadas. */
export const COLUNAS: readonly Coluna[] = ['posto', 'hospitalistas', 'cardioGeriatria', 'potenciaisAdmissoes'];

/** Nome de cada coluna no relatório, como o TASY o escreve. */
export const NOME_NO_RELATORIO: Record<Coluna, string> = {
  posto: 'Ds posto',
  hospitalistas: 'Qt hospitalistas',
  cardioGeriatria: 'Qt cardio geriatria',
  potenciaisAdmissoes: 'Qt potenciais admissoes',
};

/** Tira acentos, espaços (inclusive os não separáveis) e caixa. */
export function normalizarNome(nome: string): string {
  return nome.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/gu, '').toLowerCase();
}

const COLUNA_POR_NOME = new Map<string, Coluna>(
  COLUNAS.map((coluna) => [normalizarNome(NOME_NO_RELATORIO[coluna]), coluna]),
);

export type MapaDeColunas = {
  /** Índice de cada coluna encontrada no cabeçalho. */
  indices: Partial<Record<Coluna, number>>;
  /** Colunas obrigatórias que não apareceram, na ordem de `COLUNAS`. */
  faltando: Coluna[];
};

/** Localiza as colunas obrigatórias no cabeçalho. Se uma se repete, vale a primeira. */
export function mapearColunas(cabecalho: readonly string[]): MapaDeColunas {
  const indices: Partial<Record<Coluna, number>> = {};
  cabecalho.forEach((nome, indice) => {
    const coluna = COLUNA_POR_NOME.get(normalizarNome(nome));
    if (coluna !== undefined && indices[coluna] === undefined) indices[coluna] = indice;
  });
  return { indices, faltando: COLUNAS.filter((coluna) => indices[coluna] === undefined) };
}
