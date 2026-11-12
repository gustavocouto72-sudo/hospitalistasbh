import { describe, expect, it } from 'vitest';
import { QUADROS_PADRAO } from '../config/quadros';
import { montarQuadro } from './montar-quadro';
import type { ContagemDoPosto, QuadroMontado } from './tipos';

const posto = (
  codigo: string,
  hospitalistas: number,
  cardioGeriatria = 0,
  potenciaisAdmissoes = 0,
): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria,
  potenciaisAdmissoes,
});

/** Amostra sintética no formato do relatório: 12 postos, 2.3 e 4.1 zerados. */
const AMOSTRA: ContagemDoPosto[] = [
  posto('2.1', 18, 3, 2),
  posto('2.2', 16, 4, 1),
  posto('2.3', 0),
  posto('3.1', 12, 2, 3),
  posto('4.1', 0),
  posto('4.2', 24, 5, 2),
  posto('4.3', 19, 3, 1),
  posto('4.4', 20, 4, 0),
  posto('4.5', 21, 3, 2),
  posto('6.1', 14, 2, 1),
  posto('6.2', 18, 5, 2),
  posto('6.3', 18, 4, 1),
];

const setor = (quadro: QuadroMontado, id: string) => {
  const encontrado = quadro.setores.find((s) => s.id === id);
  if (!encontrado) throw new Error(`setor ${id} não encontrado`);
  return encontrado;
};

describe('montarQuadro', () => {
  it('soma as contagens dos postos de cada setor na semana', () => {
    const quadro = montarQuadro(AMOSTRA, 'semana');
    expect(quadro.tipoDia).toBe('semana');
    expect(setor(quadro, '2').contagens).toEqual({ hospitalistas: 34, cardioGeriatria: 7, potenciaisAdmissoes: 3 });
    expect(setor(quadro, '4.3').contagens).toEqual({ hospitalistas: 19, cardioGeriatria: 3, potenciaisAdmissoes: 1 });
    expect(setor(quadro, '3.1').contagens.hospitalistas).toBe(12);
    expect(setor(quadro, '3.1').modo).toBe('escalaPropria');
  });

  it('soma o 3.1 e o 6.1 num setor só no fim de semana', () => {
    const quadro = montarQuadro(AMOSTRA, 'fimDeSemana');
    expect(setor(quadro, '3.1+6.1').contagens).toEqual({
      hospitalistas: 26,
      cardioGeriatria: 4,
      potenciaisAdmissoes: 4,
    });
    expect(quadro.setores.map((s) => s.id)).toEqual(QUADROS_PADRAO.fimDeSemana.setores.map((s) => s.id));
  });

  it('mantém a ordem, os nomes, os modos e os médicos do quadro padrão', () => {
    const quadro = montarQuadro(AMOSTRA, 'semana');
    expect(quadro.setores.map(({ id, nome, postos, medicos, modo }) => ({ id, nome, postos, medicos, modo }))).toEqual(
      QUADROS_PADRAO.semana.setores,
    );
  });

  it('soma as contagens do 4.1 no 4.2', () => {
    const quadro = montarQuadro([...AMOSTRA.filter((p) => p.codigo !== '4.1'), posto('4.1', 3, 1, 1)], 'semana');
    expect(setor(quadro, '4.2').contagens).toEqual({ hospitalistas: 27, cardioGeriatria: 6, potenciaisAdmissoes: 3 });
    expect(quadro.setores.some((s) => s.id === '4.1')).toBe(false);
  });

  it('esconde postos fora do quadro zerados, sem aviso', () => {
    const quadro = montarQuadro([...AMOSTRA, posto('7.1', 0)], 'semana');
    expect(quadro.postosOcultos).toEqual(['2.3', '7.1']);
    expect(quadro.setores.some((s) => s.postos.includes('2.3'))).toBe(false);
    expect(quadro.avisos.filter((a) => a.tipo === 'posto-fora-do-quadro')).toEqual([]);
  });

  it('transforma o 2.3 com pacientes num setor sem médico, com aviso', () => {
    const quadro = montarQuadro(
      AMOSTRA.map((p) => (p.codigo === '2.3' ? posto('2.3', 5, 1) : p)),
      'semana',
    );
    expect(setor(quadro, '2.3')).toMatchObject({
      nome: '2.3',
      postos: ['2.3'],
      medicos: 0,
      modo: 'calculado',
      contagens: { hospitalistas: 5, cardioGeriatria: 1, potenciaisAdmissoes: 0 },
    });
    expect(quadro.postosOcultos).toEqual([]);
    expect(quadro.avisos).toContainEqual(
      expect.objectContaining({ tipo: 'posto-fora-do-quadro', posto: '2.3', mensagem: expect.stringContaining('2.3') }),
    );
  });

  it('põe os postos novos com pacientes depois dos setores do quadro, na ordem do relatório', () => {
    const quadro = montarQuadro([posto('9.2', 4), ...AMOSTRA, posto('7.1', 0, 2)], 'semana');
    const ids = quadro.setores.map((s) => s.id);
    expect(ids.slice(0, QUADROS_PADRAO.semana.setores.length)).toEqual(QUADROS_PADRAO.semana.setores.map((s) => s.id));
    expect(ids.slice(QUADROS_PADRAO.semana.setores.length)).toEqual(['9.2', '7.1']);
  });

  it('marca o posto do quadro ausente no relatório: carga 0 e aviso', () => {
    const quadro = montarQuadro(
      AMOSTRA.filter((p) => p.codigo !== '4.4'),
      'semana',
    );
    expect(setor(quadro, '4.4').contagens).toEqual({ hospitalistas: 0, cardioGeriatria: 0, potenciaisAdmissoes: 0 });
    expect(setor(quadro, '4.4').postosAusentes).toEqual(['4.4']);
    expect(setor(quadro, '4.3').postosAusentes).toEqual([]);
    expect(quadro.avisos).toEqual([
      expect.objectContaining({ tipo: 'posto-ausente', posto: '4.4', setor: '4.4', mensagem: expect.any(String) }),
    ]);
  });

  it('aceita relatório vazio: todos os setores com carga 0 e um aviso por posto ausente', () => {
    const quadro = montarQuadro([], 'fimDeSemana');
    expect(quadro.setores.every((s) => s.contagens.hospitalistas === 0)).toBe(true);
    const postosDoQuadro = QUADROS_PADRAO.fimDeSemana.setores.flatMap((s) => s.postos);
    expect(quadro.avisos.map((a) => a.posto)).toEqual(postosDoQuadro);
  });

  describe('ajustes', () => {
    it('médicos editados vencem o padrão', () => {
      const quadro = montarQuadro(AMOSTRA, 'semana', { medicos: { '4.3': 1.5, '6.1': 0 } });
      expect(setor(quadro, '4.3').medicos).toBe(1.5);
      expect(setor(quadro, '6.1').medicos).toBe(0);
      expect(setor(quadro, '4.4').medicos).toBe(2);
    });

    it('dá médicos a um setor criado por posto novo', () => {
      const quadro = montarQuadro([...AMOSTRA, posto('7.1', 6)], 'semana', { medicos: { '7.1': 1 } });
      expect(setor(quadro, '7.1').medicos).toBe(1);
    });

    it('contagens corrigidas à mão vencem as do relatório, campo a campo', () => {
      const quadro = montarQuadro(AMOSTRA, 'semana', { contagens: { '2.1': { hospitalistas: 20 } } });
      expect(setor(quadro, '2').contagens).toEqual({ hospitalistas: 36, cardioGeriatria: 7, potenciaisAdmissoes: 3 });
    });

    it('contagem digitada para um posto ausente o faz presente', () => {
      const quadro = montarQuadro(
        AMOSTRA.filter((p) => p.codigo !== '4.4'),
        'semana',
        { contagens: { '4.4': { hospitalistas: 15 } } },
      );
      expect(setor(quadro, '4.4').contagens).toEqual({ hospitalistas: 15, cardioGeriatria: 0, potenciaisAdmissoes: 0 });
      expect(setor(quadro, '4.4').postosAusentes).toEqual([]);
      expect(quadro.avisos).toEqual([]);
    });

    it('zerar à mão um posto fora do quadro o esconde', () => {
      const quadro = montarQuadro([...AMOSTRA, posto('7.1', 4)], 'semana', {
        contagens: { '7.1': { hospitalistas: 0 } },
      });
      expect(quadro.setores.some((s) => s.id === '7.1')).toBe(false);
      expect(quadro.postosOcultos).toContain('7.1');
    });

    it('ignora ajuste de médicos de setor que não existe no quadro do dia', () => {
      const quadro = montarQuadro(AMOSTRA, 'semana', { medicos: { '3.1+6.1': 2 } });
      expect(quadro.setores.map((s) => s.medicos)).toEqual(QUADROS_PADRAO.semana.setores.map((s) => s.medicos));
    });

    it.each([-0.5, 1.25, Number.NaN, Number.POSITIVE_INFINITY])(
      'recusa médicos fora dos passos de 0,5: %s',
      (valor) => {
        expect(() => montarQuadro(AMOSTRA, 'semana', { medicos: { '4.3': valor } })).toThrow(RangeError);
      },
    );

    it.each([-1, 2.5, Number.NaN])('recusa contagem que não é inteiro não negativo: %s', (valor) => {
      expect(() => montarQuadro(AMOSTRA, 'semana', { contagens: { '4.3': { hospitalistas: valor } } })).toThrow(
        RangeError,
      );
    });
  });

  it('não altera a entrada nem o quadro padrão e é determinístico', () => {
    const entrada = structuredClone(AMOSTRA);
    const padrao = structuredClone(QUADROS_PADRAO);
    const a = montarQuadro(entrada, 'semana', { medicos: { '4.3': 3 } });
    const b = montarQuadro(entrada, 'semana', { medicos: { '4.3': 3 } });
    expect(a).toEqual(b);
    expect(entrada).toEqual(AMOSTRA);
    expect(QUADROS_PADRAO).toEqual(padrao);
  });

  it('propriedade: Σ hospitalistas dos setores = Σ hospitalistas dos postos', () => {
    let semente = 12_112_026;
    const aleatorio = (max: number) => {
      semente = (semente * 1_103_515_245 + 12_345) % 2_147_483_648;
      return semente % (max + 1);
    };
    const codigos = [...new Set(Object.values(QUADROS_PADRAO).flatMap((q) => q.setores.flatMap((s) => s.postos)))];
    codigos.push('2.3', '7.1', '8.4');
    for (let rodada = 0; rodada < 200; rodada += 1) {
      const postos = codigos
        .filter(() => aleatorio(4) > 0)
        .map((codigo) => posto(codigo, aleatorio(1) ? aleatorio(30) : 0, aleatorio(5), aleatorio(3)));
      const total = postos.reduce((soma, p) => soma + p.hospitalistas, 0);
      for (const tipoDia of ['semana', 'fimDeSemana'] as const) {
        const quadro = montarQuadro(postos, tipoDia);
        expect(quadro.setores.reduce((soma, s) => soma + s.contagens.hospitalistas, 0)).toBe(total);
        const noQuadro = new Set(quadro.setores.flatMap((s) => s.postos));
        for (const oculto of quadro.postosOcultos) expect(noQuadro.has(oculto)).toBe(false);
      }
    }
  });
});
