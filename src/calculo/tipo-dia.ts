/**
 * Tipo de dia padrão pela data (SPEC-05, "Topo"): sábado e domingo marcam fim de semana, os outros dias
 * marcam dia de semana. Usa sempre o dia local do aparelho.
 */
import type { TipoDia } from './tipos';

export function tipoDiaPadrao(data: Date): TipoDia {
  const diaDaSemana = data.getDay();
  return diaDaSemana === 0 || diaDaSemana === 6 ? 'fimDeSemana' : 'semana';
}

/** Chave `AAAA-MM-DD` do dia local. É um valor estável, que serve de instantâneo do "hoje" na interface. */
export function chaveDoDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Data local (meio-dia) da chave `AAAA-MM-DD`. */
export function dataDaChave(chave: string): Date {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chave);
  if (!partes) throw new RangeError(`chave de dia inválida: ${chave}`);
  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12);
}
