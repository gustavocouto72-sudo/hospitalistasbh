/**
 * Estado do tipo de dia na página (SPEC-05, "Topo"). Fica só na memória: recarregar volta ao padrão do dia.
 */
import { QUADROS_PADRAO } from '@/config/quadros';
import type { Ajustes, Contagens, Quadro, TipoDia } from '@/calculo/tipos';

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

/** Passo do − e do + de médicos (SPEC-05, "Quadro de setores"). */
export const PASSO_MEDICOS = 0.5;

/**
 * Tira (`-1`) ou põe (`+1`) meio médico no setor. Parte do ajuste já guardado ou, sem ajuste, de `semAjuste`
 * (o número do quadro que o cartão mostra), para que dois cliques seguidos somem. Nunca fica abaixo de 0. As
 * contagens digitadas continuam valendo.
 */
export function ajustarMedicos(estado: EstadoDia, setor: string, semAjuste: number, sentido: 1 | -1): EstadoDia {
  const atual = estado.ajustes.medicos?.[setor] ?? semAjuste;
  const medicos = Math.max(0, Math.round((atual + sentido * PASSO_MEDICOS) * 2) / 2);
  return { ...estado, ajustes: { ...estado.ajustes, medicos: { ...estado.ajustes.medicos, [setor]: medicos } } };
}

/** Corrige uma contagem de um posto, campo a campo. O valor precisa ser inteiro ≥ 0. */
export function ajustarContagem(estado: EstadoDia, posto: string, campo: keyof Contagens, valor: number): EstadoDia {
  if (!Number.isInteger(valor) || valor < 0) throw new RangeError(`Contagem ${campo} do posto ${posto}: ${valor}.`);
  const contagens = estado.ajustes.contagens ?? {};
  return {
    ...estado,
    ajustes: { ...estado.ajustes, contagens: { ...contagens, [posto]: { ...contagens[posto], [campo]: valor } } },
  };
}
