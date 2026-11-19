/**
 * Semáforo de cinco cores pela diferença entre a carga por médico e a média do dia
 * (SPEC-03, `corDoSemaforo`; PRD §6.3).
 *
 * | Faixa                   | Cor          |
 * |-------------------------|--------------|
 * | d < −2,5                | `azulEscuro` |
 * | −2,5 ≤ d < −1,5         | `azulClaro`  |
 * | −1,5 ≤ d ≤ +1,5         | `verde`      |
 * | +1,5 < d ≤ +2,5         | `amarelo`    |
 * | d > +2,5 ou `semMedico` | `vermelho`   |
 *
 * Os valores exatamente em ±1,5 e ±2,5 caem na faixa mais próxima do verde. A diferença chega exata, sem
 * arredondar.
 *
 * As faixas eram ±1 e ±2 até 19/11/2026. O dono achou a margem curta demais: a sugestão pedia apoio por
 * diferenças pequenas. Para mudar a tolerância, bastam as duas constantes abaixo; a sugestão de apoio, a
 * legenda e a folha acompanham.
 */
import type { Cor, SetorNoPainel } from './tipos';

/** As cinco cores, da mais folgada à mais carregada. */
export const CORES_DO_SEMAFORO: readonly Cor[] = ['azulEscuro', 'azulClaro', 'verde', 'amarelo', 'vermelho'];

/** Até quantos pacientes por médico, para cima ou para baixo da média, o setor conta como "na média". */
export const MARGEM_DO_VERDE = 1.5;
/** Daqui para fora o setor é vermelho (acima) ou azul escuro (abaixo). */
export const MARGEM_DO_AMARELO = 2.5;

export function corDoSemaforo(diferenca: number): Cor {
  if (Number.isNaN(diferenca)) throw new RangeError('diferença inválida: NaN');
  if (diferenca < -MARGEM_DO_AMARELO) return 'azulEscuro';
  if (diferenca < -MARGEM_DO_VERDE) return 'azulClaro';
  if (diferenca <= MARGEM_DO_VERDE) return 'verde';
  if (diferenca <= MARGEM_DO_AMARELO) return 'amarelo';
  return 'vermelho';
}

/**
 * Cor de um setor do painel. `semMedico` é sempre vermelho, mesmo com a média indefinida. `escalaPropria`,
 * `vazio` e setores sem diferença (média indefinida) ficam sem cor (`null`).
 */
export function corDoSetor(setor: SetorNoPainel): Cor | null {
  if (setor.estado === 'semMedico') return 'vermelho';
  if (setor.estado !== 'calculado' || setor.diferenca === null) return null;
  return corDoSemaforo(setor.diferenca);
}
