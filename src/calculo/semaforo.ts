/**
 * Semáforo de cinco cores pela diferença entre a carga por médico e a média do dia
 * (SPEC-03, `corDoSemaforo`; PRD §6.3).
 *
 * | Faixa                 | Cor          |
 * |-----------------------|--------------|
 * | d < −2                | `azulEscuro` |
 * | −2 ≤ d < −1           | `azulClaro`  |
 * | −1 ≤ d ≤ +1           | `verde`      |
 * | +1 < d ≤ +2           | `amarelo`    |
 * | d > +2 ou `semMedico` | `vermelho`   |
 *
 * Os valores exatamente em ±1 e ±2 caem na faixa mais próxima do verde. A diferença chega exata, sem
 * arredondar.
 */
import type { Cor, SetorNoPainel } from './tipos';

/** As cinco cores, da mais folgada à mais carregada. */
export const CORES_DO_SEMAFORO: readonly Cor[] = ['azulEscuro', 'azulClaro', 'verde', 'amarelo', 'vermelho'];

export function corDoSemaforo(diferenca: number): Cor {
  if (Number.isNaN(diferenca)) throw new RangeError('diferença inválida: NaN');
  if (diferenca < -2) return 'azulEscuro';
  if (diferenca < -1) return 'azulClaro';
  if (diferenca <= 1) return 'verde';
  if (diferenca <= 2) return 'amarelo';
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
