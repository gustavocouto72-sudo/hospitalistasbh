import { describe, expect, it } from 'vitest';
import { chaveDoDia, dataDaChave, tipoDiaPadrao } from './tipo-dia';

// Novembro de 2026: dia 9 é segunda-feira, 14 é sábado e 15 é domingo.
const dia = (d: number, hora = 12) => new Date(2026, 10, d, hora);

describe('tipoDiaPadrao', () => {
  it.each([9, 10, 11, 12, 13])('marca dia de semana de segunda a sexta (%i/11)', (d) => {
    expect(tipoDiaPadrao(dia(d))).toBe('semana');
  });

  it.each([14, 15])('marca fim de semana no sábado e no domingo (%i/11)', (d) => {
    expect(tipoDiaPadrao(dia(d))).toBe('fimDeSemana');
  });

  it('usa o dia local, nas bordas da meia-noite', () => {
    expect(tipoDiaPadrao(new Date(2026, 10, 13, 23, 59))).toBe('semana');
    expect(tipoDiaPadrao(new Date(2026, 10, 14, 0, 0))).toBe('fimDeSemana');
    expect(tipoDiaPadrao(new Date(2026, 10, 15, 23, 59))).toBe('fimDeSemana');
    expect(tipoDiaPadrao(new Date(2026, 10, 16, 0, 0))).toBe('semana');
  });
});

describe('chaveDoDia e dataDaChave', () => {
  it('gera a chave AAAA-MM-DD do dia local, com zeros à esquerda', () => {
    expect(chaveDoDia(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(chaveDoDia(dia(12))).toBe('2026-11-12');
  });

  it('volta da chave para o mesmo dia local', () => {
    const data = dataDaChave('2026-11-14');
    expect([data.getFullYear(), data.getMonth(), data.getDate()]).toEqual([2026, 10, 14]);
    expect(tipoDiaPadrao(data)).toBe('fimDeSemana');
    expect(chaveDoDia(data)).toBe('2026-11-14');
  });

  it('recusa chave fora do formato', () => {
    expect(() => dataDaChave('14/11/2026')).toThrow(RangeError);
  });
});
