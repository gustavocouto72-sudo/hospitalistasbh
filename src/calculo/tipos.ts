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

/**
 * Contagens de um posto que o cálculo usa. É um recorte de `ContagemPosto` da leitura (SPEC-02), para o
 * cálculo não depender do formato do relatório.
 */
export type ContagemDoPosto = {
  readonly codigo: string;
  readonly hospitalistas: number;
  readonly cardioGeriatria: number;
  readonly potenciaisAdmissoes: number;
};

/** Contagens somadas de um ou mais postos. A carga é só `hospitalistas`; as outras são indicadores. */
export type Contagens = {
  readonly hospitalistas: number;
  readonly cardioGeriatria: number;
  readonly potenciaisAdmissoes: number;
};

/**
 * Ajustes do dia, que vencem o quadro padrão e o relatório (SPEC-03, "Ajustes").
 * - `medicos`: por id de setor, em passos de 0,5 e ≥ 0. Ids que não existem no quadro do dia são ignorados.
 * - `contagens`: por código de posto, campo a campo. Um posto ausente no relatório passa a existir.
 */
export type Ajustes = {
  readonly medicos?: Readonly<Record<string, number>>;
  readonly contagens?: Readonly<Record<string, Partial<Contagens>>>;
};

/** Setor com as contagens do dia já somadas. */
export type SetorMontado = Setor & {
  readonly contagens: Contagens;
  /** Postos do setor que não vieram no relatório nem foram digitados. */
  readonly postosAusentes: readonly string[];
};

export type AvisoQuadro =
  | { readonly tipo: 'posto-ausente'; readonly posto: string; readonly setor: string; readonly mensagem: string }
  | { readonly tipo: 'posto-fora-do-quadro'; readonly posto: string; readonly mensagem: string };

/** Resultado de `montarQuadro`: o quadro do dia com contagens, ajustes aplicados e avisos. */
export type QuadroMontado = {
  readonly tipoDia: TipoDia;
  readonly setores: readonly SetorMontado[];
  /** Postos fora do quadro e zerados, que não aparecem como setor. */
  readonly postosOcultos: readonly string[];
  readonly avisos: readonly AvisoQuadro[];
};
