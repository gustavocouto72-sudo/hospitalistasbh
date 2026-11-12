import { describe, expect, it } from 'vitest';
import type { ContagemDoPosto } from '@/calculo/tipos';
import { textos } from '@/textos';
import { ESTADO_INICIAL, ajustarContagem, ajustarMedicos } from './estado-dia';
import { contagensDosPostos, lerContagem, notasDoSetor, painelDoDia, resumoDoDia, visualDoSetor } from './painel-dia';

const posto = (codigo: string, hospitalistas: number, cardioGeriatria = 0, potenciaisAdmissoes = 0) => ({
  codigo,
  hospitalistas,
  cardioGeriatria,
  potenciaisAdmissoes,
});

// Semana: 18 médicos nos setores calculados. 4.3 com 2 médicos e 30 pacientes fica bem acima da média.
const POSTOS: readonly ContagemDoPosto[] = [
  posto('2.1', 10, 1),
  posto('2.2', 8),
  posto('3.1', 12, 0, 1),
  posto('4.1', 5),
  posto('4.2', 9),
  posto('4.3', 30, 2, 3),
  posto('4.4', 14),
  posto('4.5', 6),
  posto('6.1', 9),
  posto('6.2', 15),
  posto('6.3', 14),
  posto('2.3', 0),
];

const corDe = (s: Parameters<typeof visualDoSetor>[0]) => {
  const visual = visualDoSetor(s);
  return visual.tipo === 'semaforo' ? visual.cor : null;
};

const setor = (painel: ReturnType<typeof painelDoDia>, id: string) => {
  const achado = painel.setores.find((s) => s.id === id);
  if (!achado) throw new Error(`setor ${id} ausente`);
  return achado;
};

describe('ajustes da página', () => {
  it('médicos andam em passos de 0,5 e não ficam abaixo de 0', () => {
    let estado = ajustarMedicos(ESTADO_INICIAL, '4.3', 2, 1);
    expect(estado.ajustes.medicos).toEqual({ '4.3': 2.5 });
    estado = ajustarMedicos(estado, '4.3', 2.5, -1);
    expect(estado.ajustes.medicos).toEqual({ '4.3': 2 });
    const zero = ajustarMedicos(ajustarMedicos(ESTADO_INICIAL, '6.1', 0.5, -1), '6.1', 0, -1);
    expect(zero.ajustes.medicos).toEqual({ '6.1': 0 });
  });

  it('ajustar médicos mantém as contagens digitadas', () => {
    const comContagem = ajustarContagem(ESTADO_INICIAL, '4.3', 'hospitalistas', 20);
    const estado = ajustarMedicos(comContagem, '4.3', 2, 1);
    expect(estado.ajustes.contagens).toEqual({ '4.3': { hospitalistas: 20 } });
  });

  it('contagens são por posto e campo a campo', () => {
    let estado = ajustarContagem(ESTADO_INICIAL, '4.3', 'hospitalistas', 20);
    estado = ajustarContagem(estado, '4.3', 'potenciaisAdmissoes', 4);
    estado = ajustarContagem(estado, '4.1', 'cardioGeriatria', 1);
    expect(estado.ajustes.contagens).toEqual({
      '4.3': { hospitalistas: 20, potenciaisAdmissoes: 4 },
      '4.1': { cardioGeriatria: 1 },
    });
  });

  it('recusa contagem que não é inteiro ≥ 0', () => {
    expect(() => ajustarContagem(ESTADO_INICIAL, '4.3', 'hospitalistas', -1)).toThrow(RangeError);
    expect(() => ajustarContagem(ESTADO_INICIAL, '4.3', 'hospitalistas', 1.5)).toThrow(RangeError);
  });
});

describe('lerContagem', () => {
  it('aceita só inteiros ≥ 0 digitados', () => {
    expect(lerContagem('12')).toBe(12);
    expect(lerContagem(' 7 ')).toBe(7);
    expect(lerContagem('0')).toBe(0);
    expect(lerContagem('')).toBeNull();
    expect(lerContagem('-1')).toBeNull();
    expect(lerContagem('1,5')).toBeNull();
    expect(lerContagem('abc')).toBeNull();
    expect(lerContagem('99999')).toBeNull();
  });
});

describe('painelDoDia', () => {
  it('recalcula na hora quando os médicos mudam', () => {
    const antes = painelDoDia(POSTOS, 'semana', ESTADO_INICIAL.ajustes);
    expect(corDe(setor(antes, '4.3'))).toBe('vermelho');
    // De 2 para 4 médicos: 30 ÷ 4 = 7,5 contra a média de 120 ÷ 20 = 6.
    let ajustado = ESTADO_INICIAL;
    for (const atual of [2, 2.5, 3, 3.5]) ajustado = ajustarMedicos(ajustado, '4.3', atual, 1);
    const depois = painelDoDia(POSTOS, 'semana', ajustado.ajustes);
    expect(setor(depois, '4.3').medicos).toBe(4);
    expect(corDe(setor(depois, '4.3'))).toBe('amarelo');
  });

  it('recalcula na hora quando uma contagem muda', () => {
    const estado = ajustarContagem(ESTADO_INICIAL, '4.3', 'hospitalistas', 12);
    const painel = painelDoDia(POSTOS, 'semana', estado.ajustes);
    expect(setor(painel, '4.3').carga).toBe(12);
    expect(corDe(setor(painel, '4.3'))).toBe('verde');
  });

  it('o preenchimento à mão começa zerado', () => {
    const painel = painelDoDia([], 'semana', {});
    expect(painel.cargaTotal).toBe(0);
    expect(painel.setores.every((s) => s.carga === 0)).toBe(true);
  });
});

describe('contagensDosPostos', () => {
  it('mostra cada posto do setor com os ajustes por cima do relatório', () => {
    const estado = ajustarContagem(ESTADO_INICIAL, '4.1', 'hospitalistas', 7);
    const porPosto = contagensDosPostos(POSTOS, estado.ajustes, ['4.2', '4.1']);
    expect(porPosto).toEqual([
      { codigo: '4.2', hospitalistas: 9, cardioGeriatria: 0, potenciaisAdmissoes: 0 },
      { codigo: '4.1', hospitalistas: 7, cardioGeriatria: 0, potenciaisAdmissoes: 0 },
    ]);
    expect(contagensDosPostos([], {}, ['4.4'])).toEqual([
      { codigo: '4.4', hospitalistas: 0, cardioGeriatria: 0, potenciaisAdmissoes: 0 },
    ]);
  });
});

describe('visualDoSetor', () => {
  const painel = painelDoDia(POSTOS, 'semana', {});

  it('dá cor, rótulo e casa da régua aos setores calculados', () => {
    const visual = visualDoSetor(setor(painel, '4.3'));
    expect(visual).toEqual({ tipo: 'semaforo', cor: 'vermelho', rotulo: textos.semaforo.vermelho, casa: 4 });
    expect(visualDoSetor(setor(painel, '4.5'))).toMatchObject({ cor: 'azulEscuro', casa: 0 });
  });

  it('setor sem médico fica vermelho com rótulo próprio', () => {
    const estado = ajustarMedicos(ESTADO_INICIAL, '4.4', 0.5, -1);
    const sem = painelDoDia(POSTOS, 'semana', estado.ajustes);
    expect(visualDoSetor(setor(sem, '4.4'))).toEqual({
      tipo: 'semaforo',
      cor: 'vermelho',
      rotulo: textos.semaforo.semMedico,
      casa: 4,
    });
  });

  it('escala própria e setor vazio ficam sem cor', () => {
    expect(visualDoSetor(setor(painel, '3.1'))).toEqual({
      tipo: 'escalaPropria',
      rotulo: textos.semaforo.escalaPropria,
    });
    const vazio = painelDoDia([], 'semana', { medicos: { '4.3': 0 } });
    expect(visualDoSetor(setor(vazio, '4.3'))).toEqual({ tipo: 'neutro', rotulo: textos.semaforo.vazio });
  });
});

describe('notasDoSetor', () => {
  it('lista os postos que não vieram no relatório', () => {
    const painel = painelDoDia(
      POSTOS.filter((p) => p.codigo !== '4.1'),
      'semana',
      {},
    );
    expect(notasDoSetor(painel, setor(painel, '4.2'), 'relatorio')).toEqual([textos.cartao.postoAusente('4.1')]);
    expect(notasDoSetor(painel, setor(painel, '4.3'), 'relatorio')).toEqual([]);
  });

  it('no preenchimento à mão não acusa posto ausente', () => {
    const painel = painelDoDia([], 'semana', {});
    expect(notasDoSetor(painel, setor(painel, '4.2'), 'manual')).toEqual([]);
  });

  it('avisa o posto fora do quadro que entrou como setor', () => {
    const painel = painelDoDia([...POSTOS, posto('7.1', 5)], 'semana', {});
    expect(notasDoSetor(painel, setor(painel, '7.1'), 'relatorio')).toEqual([textos.cartao.foraDoQuadro]);
  });
});

describe('resumoDoDia', () => {
  it('traz média, totais e quantos setores estão em cada cor', () => {
    const painel = painelDoDia(POSTOS, 'semana', {});
    const resumo = resumoDoDia(painel);
    expect(resumo.media).toBeCloseTo(120 / 18);
    expect(resumo.medicos).toBe(18);
    expect(resumo.pacientes).toBe(120);
    const total = Object.values(resumo.porCor).reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
    expect(resumo.porCor.vermelho).toBeGreaterThanOrEqual(1);
  });

  it('conta o setor sem médico no vermelho', () => {
    const resumo = resumoDoDia(painelDoDia([posto('4.3', 5)], 'semana', { medicos: { '4.3': 0 } }));
    expect(resumo.porCor.vermelho).toBe(1);
    // Quadro zerado: todos têm carga 0 e média 0, então todos estão na média.
    const zerado = resumoDoDia(painelDoDia([], 'semana', {}));
    expect(zerado.pacientes).toBe(0);
    expect(zerado.porCor.verde).toBe(8);
  });
});
