/**
 * Mapeamento das colunas do relatório 9998 pelo nome (SPEC-02, "Cabeçalho").
 *
 * Os nomes são comparados sem acento, caixa nem espaços. Colunas desconhecidas, o total do setor, as de
 * pacientes por médico e as de fatores ficam de fora.
 *
 * Cardiologia e geriatria vêm de um de dois jeitos: numa coluna só ("Qt cardio geriatria", até 12/11/2026)
 * ou separadas ("Qt cardiologia" e "Qt geriatria", desde 13/11/2026). A leitura soma as duas.
 */

export type Coluna =
  'posto' | 'hospitalistas' | 'cardioGeriatria' | 'cardiologia' | 'geriatria' | 'potenciaisAdmissoes';

/** Ordem em que as colunas são conferidas e relatadas. */
export const COLUNAS: readonly Coluna[] = [
  'posto',
  'hospitalistas',
  'cardioGeriatria',
  'cardiologia',
  'geriatria',
  'potenciaisAdmissoes',
];

/** Nome de cada coluna no relatório, como o TASY o escreve. */
export const NOME_NO_RELATORIO: Record<Coluna, string> = {
  posto: 'Ds posto',
  hospitalistas: 'Qt hospitalistas',
  cardioGeriatria: 'Qt cardio geriatria',
  cardiologia: 'Qt cardiologia',
  geriatria: 'Qt geriatria',
  potenciaisAdmissoes: 'Qt potenciais admissoes',
};

/** Colunas sempre obrigatórias. */
const SEMPRE: readonly Coluna[] = ['posto', 'hospitalistas', 'potenciaisAdmissoes'];

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
  /**
   * Colunas obrigatórias que não apareceram, na ordem de `COLUNAS`. Sem a coluna única de cardiologia e
   * geriatria, faltam as separadas que não vieram.
   */
  faltando: Coluna[];
};

/** Localiza as colunas obrigatórias no cabeçalho. Se uma se repete, vale a primeira. */
export function mapearColunas(cabecalho: readonly string[]): MapaDeColunas {
  const indices: Partial<Record<Coluna, number>> = {};
  cabecalho.forEach((nome, indice) => {
    const coluna = COLUNA_POR_NOME.get(normalizarNome(nome));
    if (coluna !== undefined && indices[coluna] === undefined) indices[coluna] = indice;
  });
  const obrigatorias: readonly Coluna[] =
    indices.cardioGeriatria === undefined ? [...SEMPRE, 'cardiologia', 'geriatria'] : SEMPRE;
  // Com a coluna única, as separadas (se vierem) não entram, para não contar duas vezes.
  if (indices.cardioGeriatria !== undefined) {
    delete indices.cardiologia;
    delete indices.geriatria;
  }
  return { indices, faltando: COLUNAS.filter((c) => obrigatorias.includes(c) && indices[c] === undefined) };
}
