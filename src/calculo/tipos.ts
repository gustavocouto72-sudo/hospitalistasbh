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

/**
 * Estado do setor no painel (SPEC-03, `calcularCarga`):
 * - `calculado`: tem médicos; entra na média e no semáforo.
 * - `escalaPropria`: aparece com as contagens, fora da média e sem cor.
 * - `semMedico`: 0 médicos e carga > 0; entra na carga do dia, não soma médicos e fica vermelho.
 * - `vazio`: 0 médicos e carga 0; nada a atender, fora do semáforo.
 */
export type EstadoSetor = 'calculado' | 'escalaPropria' | 'semMedico' | 'vazio';

/** Setor com a carga do dia. As contas usam números exatos; o arredondamento é só na exibição. */
export type SetorNoPainel = SetorMontado & {
  readonly estado: EstadoSetor;
  /** Σ `hospitalistas` dos postos do setor. */
  readonly carga: number;
  /** Carga ÷ médicos; `Infinity` em `semMedico` (para ordenar) e `null` em `escalaPropria` e `vazio`. */
  readonly cargaPorMedico: number | null;
  /** Carga por médico − média; `null` quando não há carga por médico ou a média é indefinida. */
  readonly diferenca: number | null;
};

export type AvisoPainel = AvisoQuadro | { readonly tipo: 'media-indefinida'; readonly mensagem: string };

/** Resultado de `calcularCarga`. */
export type Painel = {
  readonly tipoDia: TipoDia;
  readonly setores: readonly SetorNoPainel[];
  readonly postosOcultos: readonly string[];
  /** Σ carga dos setores `calculado` (inclui os `semMedico`). */
  readonly cargaTotal: number;
  /** Σ médicos dos setores `calculado`. */
  readonly medicosTotal: number;
  /** cargaTotal ÷ medicosTotal; `null` quando não há médicos. */
  readonly media: number | null;
  readonly avisos: readonly AvisoPainel[];
};

/** Cor do semáforo, da mais folgada (`azulEscuro`) à mais carregada (`vermelho`) (SPEC-03, `corDoSemaforo`). */
export type Cor = 'azulEscuro' | 'azulClaro' | 'verde' | 'amarelo' | 'vermelho';

/**
 * "O setor `de` apoia `leitos` leitos do setor `para`" (SPEC-04, "Termos"). Leitos inteiros, ≥ 1.
 */
export type Apoio = {
  /** Id do setor apoiador. */
  readonly de: string;
  /** Id do setor apoiado. */
  readonly para: string;
  readonly leitos: number;
};

/** Peso de cada leito de apoio para o setor que apoia (SPEC-04; PRD §6.4). */
export const PESO_DO_APOIO = 1.25;

/** Números do setor antes do apoio, como saíram de `calcularCarga`. */
export type AntesDoApoio = Pick<SetorNoPainel, 'estado' | 'carga' | 'cargaPorMedico' | 'diferenca'>;

/**
 * Setor depois dos apoios. `estado`, `carga`, `cargaPorMedico` e `diferenca` passam a valer depois do apoio,
 * com `carga` ponderada (carga − cedidos + 1,25 × recebidos) e a diferença contra a média de antes.
 */
export type SetorComApoio = SetorNoPainel & {
  readonly antes: AntesDoApoio;
  readonly leitosCedidos: number;
  readonly leitosRecebidos: number;
  /** Pacientes reais depois do apoio, sem o peso 1,25: carga − cedidos + recebidos. */
  readonly pacientes: number;
};

/**
 * Resultado de `aplicarApoios`. `media`, `cargaTotal` e `medicosTotal` são os de antes do apoio: a média não
 * muda, porque os pacientes reais são os mesmos. É atribuível a `Painel`.
 */
export type PainelComApoios = Omit<Painel, 'setores'> & {
  readonly setores: readonly SetorComApoio[];
  readonly apoios: readonly Apoio[];
};
