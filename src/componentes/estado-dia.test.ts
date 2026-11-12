import { describe, expect, it } from 'vitest';
import { QUADROS_PADRAO } from '@/config/quadros';
import { ESTADO_INICIAL, escolherTipoDia, quadroDoDia, tipoDiaAtual } from './estado-dia';

describe('estado do tipo de dia', () => {
  it('começa sem escolha manual e segue o padrão do dia', () => {
    expect(ESTADO_INICIAL.escolhaManual).toBeNull();
    expect(tipoDiaAtual(ESTADO_INICIAL, 'semana')).toBe('semana');
    expect(tipoDiaAtual(ESTADO_INICIAL, 'fimDeSemana')).toBe('fimDeSemana');
  });

  it('não sabe o tipo antes de saber o dia', () => {
    expect(tipoDiaAtual(ESTADO_INICIAL, null)).toBeNull();
    expect(quadroDoDia(null)).toBeNull();
  });

  it('a troca manual vence o padrão do dia', () => {
    const estado = escolherTipoDia(ESTADO_INICIAL, 'fimDeSemana', 'semana');
    expect(tipoDiaAtual(estado, 'semana')).toBe('fimDeSemana');
    expect(tipoDiaAtual(escolherTipoDia(estado, 'semana', 'semana'), 'semana')).toBe('semana');
  });

  it('o quadro padrão muda junto com o seletor', () => {
    const padrao = 'fimDeSemana';
    expect(quadroDoDia(tipoDiaAtual(ESTADO_INICIAL, padrao))).toBe(QUADROS_PADRAO.fimDeSemana);
    const semana = escolherTipoDia(ESTADO_INICIAL, 'semana', padrao);
    expect(quadroDoDia(tipoDiaAtual(semana, padrao))).toBe(QUADROS_PADRAO.semana);
    const fimDeSemana = escolherTipoDia(semana, 'fimDeSemana', padrao);
    expect(quadroDoDia(tipoDiaAtual(fimDeSemana, padrao))).toBe(QUADROS_PADRAO.fimDeSemana);
  });

  it('trocar o tipo de dia descarta os médicos ajustados e mantém as contagens digitadas', () => {
    const ajustado = {
      escolhaManual: 'semana' as const,
      ajustes: { medicos: { '4.3': 3 }, contagens: { '4.3': { hospitalistas: 20 } } },
    };
    const trocado = escolherTipoDia(ajustado, 'fimDeSemana', 'semana');
    expect(trocado.ajustes.medicos).toBeUndefined();
    expect(trocado.ajustes.contagens).toEqual({ '4.3': { hospitalistas: 20 } });
  });

  it('escolher o tipo que já está em vigor não mexe em nada', () => {
    const ajustado = { escolhaManual: 'semana' as const, ajustes: { medicos: { '4.3': 3 } } };
    expect(escolherTipoDia(ajustado, 'semana', 'fimDeSemana')).toBe(ajustado);
    const peloPadrao = { escolhaManual: null, ajustes: { medicos: { '4.3': 3 } } };
    expect(escolherTipoDia(peloPadrao, 'semana', 'semana')).toBe(peloPadrao);
  });
});
