import { describe, expect, it } from 'vitest';
import { extrairCodigoPosto } from './posto';

/** Gerador pseudoaleatório determinístico (mulberry32), para o teste de propriedade ser reprodutível. */
function aleatorio(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('T-02.3 — código do posto', () => {
  it('extrai A.N do nome do relatório', () => {
    expect(extrairCodigoPosto('Unidade de Internação Posto 2 - 4º PAV')).toBe('4.2');
  });

  it('aceita º, °, o e o º quebrado pelo Latin-1', () => {
    expect(extrairCodigoPosto('Unidade de Internação Posto 1 - 2° PAV')).toBe('2.1');
    expect(extrairCodigoPosto('Unidade de Internação Posto 2 - 2o PAV')).toBe('2.2');
    expect(extrairCodigoPosto('Unidade de Internação Posto 3 - 4Âº PAV')).toBe('4.3');
    expect(extrairCodigoPosto('Unidade de InternaÃ§Ã£o Posto 3 - 6Â° PAV')).toBe('6.3');
  });

  it('ignora caixa, espaços extras e zeros à esquerda', () => {
    expect(extrairCodigoPosto('UNIDADE DE INTERNAÇÃO POSTO 05 -  4º pav')).toBe('4.5');
    expect(extrairCodigoPosto('Posto 1-6ºPAV')).toBe('6.1');
  });

  it('devolve undefined para nome fora do padrão', () => {
    expect(extrairCodigoPosto('UTI Adulto')).toBeUndefined();
    expect(extrairCodigoPosto('Total')).toBeUndefined();
    expect(extrairCodigoPosto('Posto 2 - PAV')).toBeUndefined();
    expect(extrairCodigoPosto('Posto - 4º PAV')).toBeUndefined();
    expect(extrairCodigoPosto('')).toBeUndefined();
  });

  it('propriedade: qualquer nome no padrão "Posto N - Aº PAV" gera "A.N"', () => {
    const sorteio = aleatorio(9998);
    const inteiro = (max: number) => Math.floor(sorteio() * max);
    const escolher = <T>(opcoes: readonly T[]): T => opcoes[inteiro(opcoes.length)] as T;
    const ordinais = ['º', '°', 'o', 'Âº', 'Â°'] as const;
    const prefixos = ['', 'Unidade de Internação ', 'Unidade de InternaÃ§Ã£o ', 'Ala Sul - ', 'UI '] as const;
    const espacos = ['', ' ', '  '] as const;
    const caixa = [(s: string) => s, (s: string) => s.toUpperCase(), (s: string) => s.toLowerCase()] as const;

    for (let i = 0; i < 2000; i++) {
      const andar = 1 + inteiro(30);
      const numero = 1 + inteiro(99);
      const e = () => escolher(espacos);
      const nome = escolher(caixa)(
        `${escolher(prefixos)}Posto ${numero}${e()}-${e()}${andar}${escolher(ordinais)}${e() || ' '}PAV`,
      );
      expect(extrairCodigoPosto(nome), nome).toBe(`${andar}.${numero}`);
    }
  });
});
