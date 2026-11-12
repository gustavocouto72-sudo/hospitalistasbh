import { describe, expect, it } from 'vitest';
import { mapearColunas, normalizarNome } from './cabecalho';

const CABECALHO = [
  'Ds posto',
  'Qt hospitalistas',
  'Qt cardio geriatria',
  'Qt potenciais admissoes',
  'Qt pac medico semana',
  'Qt pac medico fim semana',
  'Fator dia semana',
  'Fator fim semana',
];

describe('T-02.3 — normalização do nome da coluna', () => {
  it('ignora acento, caixa e espaços', () => {
    expect(normalizarNome('  Qt Potenciais  Admissões ')).toBe('qtpotenciaisadmissoes');
    expect(normalizarNome('DS POSTO')).toBe('dsposto');
    expect(normalizarNome('Qt cardio\tgeriatria')).toBe('qtcardiogeriatria');
  });
});

describe('T-02.3 — mapeamento das colunas', () => {
  it('localiza as quatro colunas do cabeçalho real e ignora as demais', () => {
    expect(mapearColunas(CABECALHO)).toEqual({
      indices: { posto: 0, hospitalistas: 1, cardioGeriatria: 2, potenciaisAdmissoes: 3 },
      faltando: [],
    });
  });

  it('encontra as colunas em qualquer ordem e com grafia variada', () => {
    const cabecalho = [
      'Fator dia semana',
      'QT POTENCIAIS ADMISSÕES',
      'qt hospitalistas',
      'Coluna nova',
      'DsPosto',
      ' Qt  Cardio Geriatria ',
    ];
    expect(mapearColunas(cabecalho).indices).toEqual({
      posto: 4,
      hospitalistas: 2,
      cardioGeriatria: 5,
      potenciaisAdmissoes: 1,
    });
  });

  it('diz quais colunas obrigatórias faltam', () => {
    const resultado = mapearColunas(['Ds posto', 'Qt hospitalistas', 'Qt potenciais admissoes']);
    expect(resultado.faltando).toEqual(['cardioGeriatria']);
    expect(resultado.indices).toEqual({ posto: 0, hospitalistas: 1, potenciaisAdmissoes: 2 });
  });

  it('com cabeçalho vazio, faltam todas', () => {
    expect(mapearColunas([]).faltando).toEqual(['posto', 'hospitalistas', 'cardioGeriatria', 'potenciaisAdmissoes']);
  });

  it('se a coluna se repete, vale a primeira', () => {
    expect(mapearColunas(['Ds posto', 'Ds posto', 'Qt hospitalistas']).indices.posto).toBe(0);
  });
});
