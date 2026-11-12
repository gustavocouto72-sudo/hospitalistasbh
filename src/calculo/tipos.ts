/**
 * Tipos do quadro de setores (SPEC-03, "Termos").
 */

/** Tipo de dia, que define qual quadro de setores vale. */
export type TipoDia = 'semana' | 'fimDeSemana';

/**
 * `calculado`: entra na carga por médico e na média do dia.
 * `escalaPropria`: aparece com as contagens, mas fica fora da média e sem cor.
 */
export type ModoSetor = 'calculado' | 'escalaPropria';

/** Um ou mais postos atendidos por uma equipe. */
export type Setor = {
  readonly id: string;
  readonly nome: string;
  /** Códigos dos postos (`4.2`), como saem da leitura do relatório. */
  readonly postos: readonly string[];
  /** Médicos do setor, em passos de 0,5 e ≥ 0. Nos setores `escalaPropria` vale 0. */
  readonly medicos: number;
  readonly modo: ModoSetor;
};

/** Os setores de um tipo de dia. Cada posto pertence a no máximo um setor. */
export type Quadro = {
  readonly tipoDia: TipoDia;
  readonly setores: readonly Setor[];
};
