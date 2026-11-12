/**
 * Números do relatório (SPEC-02, "Números"): vírgula decimal, às vezes sem o zero à esquerda (`,5`).
 * O ponto também vale como decimal, para CSV ou xlsx salvos por outra ferramenta. Separador de milhar
 * não é aceito, porque as contagens por posto são pequenas.
 */
const NUMERO = /^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/u;

/** Lê um número com vírgula ou ponto decimal; `undefined` se a célula não for um número. */
export function lerNumero(texto: string): number | undefined {
  const limpo = texto.trim();
  if (!NUMERO.test(limpo)) return undefined;
  return Number(limpo.replace(',', '.'));
}

export type MotivoContagemInvalida = 'vazio' | 'texto' | 'negativo' | 'decimal';

export type Contagem = { ok: true; valor: number } | { ok: false; motivo: MotivoContagemInvalida };

/** Lê uma contagem de pacientes: inteiro ≥ 0. `3,0` vale 3; `12,5` é decimal e inválida. */
export function lerContagem(texto: string): Contagem {
  if (texto.trim() === '') return { ok: false, motivo: 'vazio' };
  const valor = lerNumero(texto);
  if (valor === undefined) return { ok: false, motivo: 'texto' };
  if (valor < 0) return { ok: false, motivo: 'negativo' };
  if (!Number.isInteger(valor)) return { ok: false, motivo: 'decimal' };
  return { ok: true, valor: valor === 0 ? 0 : valor }; // `-0` vira 0
}
