/**
 * Estado do tipo de dia na página (SPEC-05, "Topo"). Fica só na memória: recarregar volta ao padrão do dia.
 */
import { QUADROS_PADRAO } from '@/config/quadros';
import type { Ajustes, Quadro, TipoDia } from '@/calculo/tipos';

export type EstadoDia = {
  /** Tipo escolhido à mão no seletor. `null` segue o padrão do dia. */
  readonly escolhaManual: TipoDia | null;
  readonly ajustes: Ajustes;
};

export const ESTADO_INICIAL: EstadoDia = { escolhaManual: null, ajustes: {} };

/** Tipo de dia em vigor: a escolha manual vence o padrão. `null` enquanto o dia ainda não é conhecido. */
export function tipoDiaAtual(estado: EstadoDia, padrao: TipoDia | null): TipoDia | null {
  return estado.escolhaManual ?? padrao;
}

export function quadroDoDia(tipoDia: TipoDia | null): Quadro | null {
  return tipoDia ? QUADROS_PADRAO[tipoDia] : null;
}

/**
 * Troca o tipo de dia. Os médicos ajustados valem para os setores do quadro anterior e são descartados; as
 * contagens digitadas são por posto e continuam valendo.
 */
export function escolherTipoDia(estado: EstadoDia, tipoDia: TipoDia, padrao: TipoDia | null): EstadoDia {
  if (tipoDiaAtual(estado, padrao) === tipoDia) return estado;
  const { contagens } = estado.ajustes;
  return { escolhaManual: tipoDia, ajustes: contagens ? { contagens } : {} };
}
