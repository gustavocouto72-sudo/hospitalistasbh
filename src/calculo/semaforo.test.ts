import { describe, expect, it } from 'vitest';
import { calcularCarga } from './calcular-carga';
import { montarQuadro } from './montar-quadro';
import { CORES_DO_SEMAFORO, MARGEM_DO_AMARELO, MARGEM_DO_VERDE, corDoSemaforo, corDoSetor } from './semaforo';
import type { ContagemDoPosto, SetorNoPainel } from './tipos';

const EPS = 1e-9;

describe('corDoSemaforo', () => {
  it('tem cinco cores, da mais folgada à mais carregada', () => {
    expect(CORES_DO_SEMAFORO).toEqual(['azulEscuro', 'azulClaro', 'verde', 'amarelo', 'vermelho']);
  });

  it.each([
    [-10, 'azulEscuro'],
    [-2.5 - EPS, 'azulEscuro'],
    [-2.5, 'azulClaro'],
    [-2.5 + EPS, 'azulClaro'],
    [-2, 'azulClaro'],
    [-1.5 - EPS, 'azulClaro'],
    [-1.5, 'verde'],
    [-1.5 + EPS, 'verde'],
    [-1, 'verde'],
    [0, 'verde'],
    [-0, 'verde'],
    [1, 'verde'],
    [1.5 - EPS, 'verde'],
    [1.5, 'verde'],
    [1.5 + EPS, 'amarelo'],
    [2, 'amarelo'],
    [2.5 - EPS, 'amarelo'],
    [2.5, 'amarelo'],
    [2.5 + EPS, 'vermelho'],
    [10, 'vermelho'],
  ] as const)('diferença %d → %s', (diferenca, cor) => {
    expect(corDoSemaforo(diferenca)).toBe(cor);
  });

  it('valores exatamente em ±1,5 e ±2,5 caem na faixa mais próxima do verde', () => {
    expect([-2.5, -1.5, 1.5, 2.5].map(corDoSemaforo)).toEqual(['azulClaro', 'verde', 'verde', 'amarelo']);
    expect([MARGEM_DO_VERDE, MARGEM_DO_AMARELO]).toEqual([1.5, 2.5]);
  });

  it('carga por médico infinita (setor sem médico) é vermelho', () => {
    expect(corDoSemaforo(Number.POSITIVE_INFINITY)).toBe('vermelho');
    expect(corDoSemaforo(Number.NEGATIVE_INFINITY)).toBe('azulEscuro');
  });

  it('recusa diferença que não é número', () => {
    expect(() => corDoSemaforo(Number.NaN)).toThrow(RangeError);
  });
});

const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

/** Contagens sintéticas da tabela de aceite da SPEC-03 (174 pacientes, 18 médicos na semana). */
const AMOSTRA: ContagemDoPosto[] = [
  posto('2.1', 14),
  posto('2.2', 13),
  posto('2.3', 0),
  posto('3.1', 6),
  posto('4.1', 0),
  posto('4.2', 28),
  posto('4.3', 23),
  posto('4.4', 20),
  posto('4.5', 16),
  posto('6.1', 12),
  posto('6.2', 26),
  posto('6.3', 22),
];

const setorDe = (setores: readonly SetorNoPainel[], id: string) => {
  const s = setores.find((x) => x.id === id);
  if (!s) throw new Error(`setor ${id} não encontrado`);
  return s;
};

describe('corDoSetor', () => {
  it('pinta os setores da amostra de semana como na tabela da spec', () => {
    const { setores } = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    const esperado = {
      '4.3': 'amarelo',
      '4.2': 'amarelo',
      '6.2': 'verde',
      '4.4': 'verde',
      '2': 'verde',
      '6.3': 'verde',
      '4.5': 'azulClaro',
      '6.1': 'azulClaro',
    };
    for (const [id, cor] of Object.entries(esperado)) expect(corDoSetor(setorDe(setores, id))).toBe(cor);
  });

  it('escala própria fica sem cor', () => {
    const { setores } = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    expect(corDoSetor(setorDe(setores, '3.1'))).toBeNull();
  });

  it('setor com médicos e carga 0 é azul escuro', () => {
    const postos = AMOSTRA.map((p) => (p.codigo === '4.5' ? posto('4.5', 0) : p));
    const { setores } = calcularCarga(montarQuadro(postos, 'semana'));
    expect(corDoSetor(setorDe(setores, '4.5'))).toBe('azulEscuro');
  });

  it('setor sem médico é vermelho, mesmo com a média indefinida', () => {
    const { setores } = calcularCarga(montarQuadro(AMOSTRA, 'semana', { medicos: { '6.1': 0 } }));
    expect(corDoSetor(setorDe(setores, '6.1'))).toBe('vermelho');

    const zerados = Object.fromEntries(['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'].map((id) => [id, 0]));
    const semNinguem = calcularCarga(montarQuadro(AMOSTRA, 'semana', { medicos: zerados }));
    expect(semNinguem.media).toBeNull();
    expect(corDoSetor(setorDe(semNinguem.setores, '4.3'))).toBe('vermelho');
  });

  it('setor vazio fica sem cor', () => {
    const postos = AMOSTRA.map((p) => (p.codigo === '6.1' ? posto('6.1', 0) : p));
    const { setores } = calcularCarga(montarQuadro(postos, 'semana', { medicos: { '6.1': 0 } }));
    expect(corDoSetor(setorDe(setores, '6.1'))).toBeNull();
  });

  it('setor calculado sem média (diferença nula) fica sem cor', () => {
    const { setores } = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    expect(corDoSetor({ ...setorDe(setores, '4.3'), diferenca: null })).toBeNull();
  });
});
