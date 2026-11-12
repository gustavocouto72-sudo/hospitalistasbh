import { describe, expect, it } from 'vitest';
import type { Quadro, TipoDia } from '../calculo/tipos';
import { QUADROS_PADRAO } from './quadros';

const somaMedicosCalculados = (quadro: Quadro): number =>
  quadro.setores.filter((setor) => setor.modo === 'calculado').reduce((soma, setor) => soma + setor.medicos, 0);

describe('quadros padrão', () => {
  it('tem um quadro para cada tipo de dia, com o tipo certo', () => {
    const tipos: TipoDia[] = ['semana', 'fimDeSemana'];
    for (const tipo of tipos) expect(QUADROS_PADRAO[tipo].tipoDia).toBe(tipo);
  });

  it('soma 18 médicos calculados na semana e 8 no fim de semana', () => {
    expect(somaMedicosCalculados(QUADROS_PADRAO.semana)).toBe(18);
    expect(somaMedicosCalculados(QUADROS_PADRAO.fimDeSemana)).toBe(8);
  });

  it.each(['semana', 'fimDeSemana'] as const)('não repete posto nem id de setor no quadro de %s', (tipo) => {
    const { setores } = QUADROS_PADRAO[tipo];
    const postos = setores.flatMap((setor) => setor.postos);
    expect(new Set(postos).size).toBe(postos.length);
    const ids = setores.map((setor) => setor.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('segue a tabela da semana da spec', () => {
    expect(
      QUADROS_PADRAO.semana.setores.map(({ nome, postos, medicos, modo }) => [nome, postos, medicos, modo]),
    ).toEqual([
      ['2º andar', ['2.1', '2.2'], 3, 'calculado'],
      ['3.1', ['3.1'], 0, 'escalaPropria'],
      ['4.2', ['4.2', '4.1'], 2.5, 'calculado'],
      ['4.3', ['4.3'], 2, 'calculado'],
      ['4.4', ['4.4'], 2, 'calculado'],
      ['4.5', ['4.5'], 2, 'calculado'],
      ['6.1', ['6.1'], 1.5, 'calculado'],
      ['6.2', ['6.2'], 2.5, 'calculado'],
      ['6.3', ['6.3'], 2.5, 'calculado'],
    ]);
  });

  it('segue a tabela do fim de semana da spec', () => {
    expect(
      QUADROS_PADRAO.fimDeSemana.setores.map(({ nome, postos, medicos, modo }) => [nome, postos, medicos, modo]),
    ).toEqual([
      ['2º andar', ['2.1', '2.2'], 1, 'calculado'],
      ['3.1 + 6.1', ['3.1', '6.1'], 1, 'calculado'],
      ['4.2', ['4.2', '4.1'], 1, 'calculado'],
      ['4.3', ['4.3'], 1, 'calculado'],
      ['4.4', ['4.4'], 1, 'calculado'],
      ['4.5', ['4.5'], 1, 'calculado'],
      ['6.2', ['6.2'], 1, 'calculado'],
      ['6.3', ['6.3'], 1, 'calculado'],
    ]);
  });

  it('usa médicos em passos de 0,5 e não negativos', () => {
    for (const quadro of Object.values(QUADROS_PADRAO)) {
      for (const setor of quadro.setores) {
        expect(setor.medicos).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(setor.medicos * 2)).toBe(true);
      }
    }
  });
});
