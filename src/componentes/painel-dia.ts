/**
 * Ponte entre o estado da página e o cálculo (SPEC-05, "Quadro de setores" e "Resumo do dia"). Puro: os
 * cartões e o resumo só desenham o que sai daqui, e tudo se refaz a cada edição, sem botão "calcular".
 */
import { calcularCarga } from '@/calculo/calcular-carga';
import { contagensPorPosto, montarQuadro } from '@/calculo/montar-quadro';
import { CORES_DO_SEMAFORO, corDoSetor } from '@/calculo/semaforo';
import type { Ajustes, ContagemDoPosto, Cor, Painel, SetorNoPainel, TipoDia } from '@/calculo/tipos';
import { textos } from '@/textos';

export function painelDoDia(postos: readonly ContagemDoPosto[], tipoDia: TipoDia, ajustes: Ajustes): Painel {
  return calcularCarga(montarQuadro(postos, tipoDia, ajustes));
}

/** Contagens de cada posto do setor, com os ajustes por cima do relatório. Posto sem dado vale zero. */
export function contagensDosPostos(
  postos: readonly ContagemDoPosto[],
  ajustes: Ajustes,
  codigos: readonly string[],
): ContagemDoPosto[] {
  const porPosto = contagensPorPosto(postos, ajustes);
  return codigos.map((codigo) => ({
    codigo,
    ...(porPosto.get(codigo) ?? { hospitalistas: 0, cardioGeriatria: 0, potenciaisAdmissoes: 0 }),
  }));
}

/** Maior contagem aceita num campo. Mais que isso num posto é engano de digitação. */
const CONTAGEM_MAXIMA = 999;

/** Lê o que foi digitado num campo de contagem: inteiro de 0 a 999, ou `null` se não serve. */
export function lerContagem(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d{1,4}$/.test(limpo)) return null;
  const valor = Number(limpo);
  return valor <= CONTAGEM_MAXIMA ? valor : null;
}

/**
 * Como o cartão aparece. A cor nunca vem sozinha: sempre com rótulo e com a casa da régua de cinco
 * (0 = azul escuro, 4 = vermelho).
 */
export type VisualDoSetor =
  | { readonly tipo: 'semaforo'; readonly cor: Cor; readonly rotulo: string; readonly casa: number }
  | { readonly tipo: 'escalaPropria'; readonly rotulo: string }
  | { readonly tipo: 'neutro'; readonly rotulo: string };

export function visualDoSetor(setor: SetorNoPainel): VisualDoSetor {
  if (setor.estado === 'escalaPropria') return { tipo: 'escalaPropria', rotulo: textos.semaforo.escalaPropria };
  const cor = corDoSetor(setor);
  if (cor === null) return { tipo: 'neutro', rotulo: textos.semaforo.vazio };
  const rotulo = setor.estado === 'semMedico' ? textos.semaforo.semMedico : textos.semaforo[cor];
  return { tipo: 'semaforo', cor, rotulo, casa: CORES_DO_SEMAFORO.indexOf(cor) };
}

/**
 * Notas curtas do cartão, tiradas dos avisos do painel. No preenchimento à mão todo posto começa sem dado,
 * então "não veio no relatório" não se aplica.
 */
export function notasDoSetor(painel: Painel, setor: SetorNoPainel, fonte: 'relatorio' | 'manual'): string[] {
  const notas: string[] = [];
  for (const aviso of painel.avisos) {
    if (aviso.tipo === 'posto-ausente' && fonte === 'relatorio' && aviso.setor === setor.id) {
      notas.push(textos.cartao.postoAusente(aviso.posto));
    }
    if (aviso.tipo === 'posto-fora-do-quadro' && aviso.posto === setor.id) notas.push(textos.cartao.foraDoQuadro);
  }
  return notas;
}

export type ResumoDoDia = {
  readonly media: number | null;
  readonly medicos: number;
  readonly pacientes: number;
  /** Setores em cada cor. Escala própria e setores vazios ficam de fora. */
  readonly porCor: Readonly<Record<Cor, number>>;
};

export function resumoDoDia(painel: Painel): ResumoDoDia {
  const porCor = Object.fromEntries(CORES_DO_SEMAFORO.map((cor) => [cor, 0])) as Record<Cor, number>;
  for (const setor of painel.setores) {
    const cor = corDoSetor(setor);
    if (cor) porCor[cor] += 1;
  }
  return { media: painel.media, medicos: painel.medicosTotal, pacientes: painel.cargaTotal, porCor };
}
