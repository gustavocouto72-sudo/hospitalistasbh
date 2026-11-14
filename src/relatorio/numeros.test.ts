import { describe, expect, it } from 'vitest';
import { lerContagem, lerNumero } from './numeros';

describe('T-02.3 — números com vírgula decimal', () => {
  it.each([
    ['20', 20],
    ['0', 0],
    ['11,2', 11.2],
    [',5', 0.5],
    ['0,5', 0.5],
    ['1,5', 1.5],
    ['8,57', 8.57],
    [' 18 ', 18],
    ['-3', -3],
    ['2.5', 2.5],
  ])('lê %j como %d', (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });

  it.each(['', '   ', 'doze', '1,2,3', ',', '1.234,5', '5a', '--1', '1 2'])('rejeita %j', (texto) => {
    expect(lerNumero(texto)).toBeUndefined();
  });
});

describe('T-02.3 — contagens', () => {
  it('aceita inteiros ≥ 0, inclusive com vírgula zerada', () => {
    expect(lerContagem('24')).toEqual({ ok: true, valor: 24 });
    expect(lerContagem('0')).toEqual({ ok: true, valor: 0 });
    expect(lerContagem('3,0')).toEqual({ ok: true, valor: 3 });
    expect(Object.is((lerContagem('-0') as { valor: number }).valor, 0)).toBe(true);
  });

  it('diz por que a contagem é inválida', () => {
    expect(lerContagem('')).toEqual({ ok: false, motivo: 'vazio' });
    expect(lerContagem('doze')).toEqual({ ok: false, motivo: 'texto' });
    expect(lerContagem('-3')).toEqual({ ok: false, motivo: 'negativo' });
    expect(lerContagem('12,5')).toEqual({ ok: false, motivo: 'decimal' });
    expect(lerContagem(',5')).toEqual({ ok: false, motivo: 'decimal' });
  });
});

describe('formato novo do relatório (13/11/2026): vírgula no fim', () => {
  it('"20," é 20 e "0," é 0', () => {
    expect(lerContagem('20,')).toEqual({ ok: true, valor: 20 });
    expect(lerContagem('0,')).toEqual({ ok: true, valor: 0 });
    expect(lerNumero('171,')).toBe(171);
  });

  it('só a vírgula, ou vírgula dobrada, não é número', () => {
    expect(lerNumero(',')).toBeUndefined();
    expect(lerNumero('20,,')).toBeUndefined();
  });
});
