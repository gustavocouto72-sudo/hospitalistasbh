/**
 * Código do posto a partir do nome (SPEC-02, "Código do posto").
 *
 * `Posto <N> - <A>º PAV` → `<A>.<N>`. O ordinal pode vir como `º`, `°`, `o` ou quebrado pelo Latin-1
 * (`Âº`, `Â°`), ou faltar; caixa e espaços não importam e zeros à esquerda caem.
 */
const PADRAO = /posto\s*(\d+)\s*-\s*(\d+)\s*(?:Â?[º°]|o)?\s*pav\b/iu;

/** Devolve `A.N`, ou `undefined` quando o nome foge do padrão. */
export function extrairCodigoPosto(nome: string): string | undefined {
  const achado = PADRAO.exec(nome);
  if (achado === null) return undefined;
  const [, numero, andar] = achado;
  return `${Number(andar)}.${Number(numero)}`;
}
