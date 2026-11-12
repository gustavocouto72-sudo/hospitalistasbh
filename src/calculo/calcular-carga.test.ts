import { describe, expect, it } from 'vitest';
import { calcularCarga } from './calcular-carga';
import { montarQuadro } from './montar-quadro';
import type { Ajustes, ContagemDoPosto, Painel, TipoDia } from './tipos';

const posto = (codigo: string, hospitalistas: number, cardioGeriatria = 0): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria,
  potenciaisAdmissoes: 0,
});

/** Contagens sintéticas que reproduzem a tabela de aceite da SPEC-03 (174 pacientes na semana). */
const AMOSTRA: ContagemDoPosto[] = [
  posto('2.1', 14, 3),
  posto('2.2', 13, 2),
  posto('2.3', 0),
  posto('3.1', 6, 1),
  posto('4.1', 0),
  posto('4.2', 28, 4),
  posto('4.3', 23, 3),
  posto('4.4', 20, 2),
  posto('4.5', 16, 1),
  posto('6.1', 12, 2),
  posto('6.2', 26, 5),
  posto('6.3', 22, 3),
];

const painelDe = (postos: readonly ContagemDoPosto[], tipoDia: TipoDia, ajustes?: Ajustes) =>
  calcularCarga(montarQuadro(postos, tipoDia, ajustes));

const setor = (painel: Painel, id: string) => {
  const encontrado = painel.setores.find((s) => s.id === id);
  if (!encontrado) throw new Error(`setor ${id} não encontrado`);
  return encontrado;
};

describe('calcularCarga', () => {
  it('calcula carga, carga por médico e média do dia na semana', () => {
    const painel = painelDe(AMOSTRA, 'semana');
    expect(painel.cargaTotal).toBe(174);
    expect(painel.medicosTotal).toBe(18);
    expect(painel.media).toBe(174 / 18);
    const esperado: Record<string, [number, number]> = {
      '4.3': [23, 11.5],
      '4.2': [28, 11.2],
      '6.2': [26, 10.4],
      '4.4': [20, 10],
      '2': [27, 9],
      '6.3': [22, 8.8],
      '4.5': [16, 8],
      '6.1': [12, 8],
    };
    for (const [id, [carga, porMedico]] of Object.entries(esperado)) {
      const s = setor(painel, id);
      expect(s.estado).toBe('calculado');
      expect(s.carga).toBe(carga);
      expect(s.cargaPorMedico).toBeCloseTo(porMedico, 10);
      expect(s.diferenca).toBe((s.cargaPorMedico as number) - (painel.media as number));
    }
  });

  it('usa números exatos, sem arredondar', () => {
    const painel = painelDe(AMOSTRA, 'semana');
    expect(setor(painel, '4.3').diferenca).toBe(11.5 - 174 / 18);
    expect(painel.media).not.toBe(9.67);
  });

  it('deixa o setor de escala própria fora das somas, com carga e sem carga por médico', () => {
    const painel = painelDe(AMOSTRA, 'semana', { medicos: { '3.1': 2 } });
    const s = setor(painel, '3.1');
    expect(s.estado).toBe('escalaPropria');
    expect(s.carga).toBe(6);
    expect(s.contagens.cardioGeriatria).toBe(1);
    expect(s.cargaPorMedico).toBeNull();
    expect(s.diferenca).toBeNull();
    expect(painel.cargaTotal).toBe(174);
    expect(painel.medicosTotal).toBe(18);
  });

  it('no fim de semana soma o 3.1 + 6.1 e usa 8 médicos', () => {
    const painel = painelDe(AMOSTRA, 'fimDeSemana');
    expect(setor(painel, '3.1+6.1').carga).toBe(18);
    expect(setor(painel, '3.1+6.1').cargaPorMedico).toBe(18);
    expect(painel.cargaTotal).toBe(180);
    expect(painel.medicosTotal).toBe(8);
    expect(painel.media).toBe(22.5);
  });

  it('setor sem médico com carga: estado semMedico, entra na carga e não soma médicos', () => {
    const painel = painelDe(AMOSTRA, 'semana', { medicos: { '6.1': 0 } });
    const s = setor(painel, '6.1');
    expect(s.estado).toBe('semMedico');
    expect(s.carga).toBe(12);
    expect(s.cargaPorMedico).toBe(Number.POSITIVE_INFINITY);
    expect(s.diferenca).toBe(Number.POSITIVE_INFINITY);
    expect(painel.cargaTotal).toBe(174);
    expect(painel.medicosTotal).toBe(16.5);
    expect(painel.media).toBe(174 / 16.5);
  });

  it('posto novo com pacientes vira setor semMedico que pesa na média', () => {
    const painel = painelDe([...AMOSTRA, posto('7.1', 6)], 'semana');
    expect(setor(painel, '7.1')).toMatchObject({ estado: 'semMedico', carga: 6, medicos: 0 });
    expect(painel.cargaTotal).toBe(180);
    expect(painel.media).toBe(180 / 18);
    expect(painel.avisos).toContainEqual(expect.objectContaining({ tipo: 'posto-fora-do-quadro', posto: '7.1' }));
  });

  it('ajuste de médicos muda a carga por médico e a média', () => {
    const painel = painelDe(AMOSTRA, 'semana', { medicos: { '4.3': 3 } });
    expect(setor(painel, '4.3').cargaPorMedico).toBe(23 / 3);
    expect(painel.medicosTotal).toBe(19);
    expect(painel.media).toBe(174 / 19);
  });

  it('setor com médicos e carga 0 fica com carga por médico 0', () => {
    const painel = painelDe(
      AMOSTRA.map((p) => (p.codigo === '4.5' ? posto('4.5', 0) : p)),
      'semana',
    );
    const s = setor(painel, '4.5');
    expect(s).toMatchObject({ estado: 'calculado', carga: 0, cargaPorMedico: 0 });
    expect(s.diferenca).toBe(0 - (painel.media as number));
  });

  it('setor sem médico e sem carga fica vazio, fora do semáforo', () => {
    const painel = painelDe(
      AMOSTRA.map((p) => (p.codigo === '6.1' ? posto('6.1', 0) : p)),
      'semana',
      { medicos: { '6.1': 0 } },
    );
    expect(setor(painel, '6.1')).toMatchObject({ estado: 'vazio', carga: 0, cargaPorMedico: null, diferenca: null });
  });

  it('com Σ médicos = 0 a média fica indefinida e o painel avisa, sem quebrar', () => {
    const zerados = Object.fromEntries(['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'].map((id) => [id, 0]));
    const painel = painelDe(AMOSTRA, 'semana', { medicos: zerados });
    expect(painel.medicosTotal).toBe(0);
    expect(painel.cargaTotal).toBe(174);
    expect(painel.media).toBeNull();
    expect(painel.setores.every((s) => s.diferenca === null)).toBe(true);
    expect(setor(painel, '4.3')).toMatchObject({ estado: 'semMedico', cargaPorMedico: Number.POSITIVE_INFINITY });
    expect(painel.avisos).toContainEqual(
      expect.objectContaining({ tipo: 'media-indefinida', mensagem: expect.any(String) }),
    );
  });

  it('não avisa média indefinida quando há médicos', () => {
    expect(painelDe(AMOSTRA, 'semana').avisos).toEqual([]);
  });

  it('preserva o quadro: setores, ordem, ocultos e avisos', () => {
    const quadro = montarQuadro(AMOSTRA, 'semana');
    const painel = calcularCarga(quadro);
    expect(painel.tipoDia).toBe('semana');
    expect(painel.postosOcultos).toEqual(quadro.postosOcultos);
    expect(painel.setores.map((s) => s.id)).toEqual(quadro.setores.map((s) => s.id));
    for (const [i, s] of painel.setores.entries()) expect(s).toMatchObject(quadro.setores[i] as object);
  });

  it('é puro e determinístico', () => {
    const quadro = montarQuadro(AMOSTRA, 'fimDeSemana');
    const copia = structuredClone(quadro);
    expect(calcularCarga(quadro)).toEqual(calcularCarga(quadro));
    expect(quadro).toEqual(copia);
  });

  it('propriedade: Σ carga = Σ hospitalistas dos postos, e média = Σ carga calculada ÷ Σ médicos', () => {
    let semente = 20_261_112;
    const aleatorio = (max: number) => {
      semente = (semente * 1_103_515_245 + 12_345) % 2_147_483_648;
      return semente % (max + 1);
    };
    const codigos = [...AMOSTRA.map((p) => p.codigo), '7.1', '8.4'];
    const ids = ['2', '3.1', '3.1+6.1', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3', '7.1'];
    for (let rodada = 0; rodada < 300; rodada += 1) {
      const postos = codigos
        .filter(() => aleatorio(4) > 0)
        .map((codigo) => posto(codigo, aleatorio(1) ? aleatorio(30) : 0, aleatorio(5)));
      const medicos = Object.fromEntries(ids.filter(() => aleatorio(2) === 0).map((id) => [id, aleatorio(8) / 2]));
      const total = postos.reduce((soma, p) => soma + p.hospitalistas, 0);
      for (const tipoDia of ['semana', 'fimDeSemana'] as const) {
        const painel = painelDe(postos, tipoDia, { medicos });
        expect(painel.setores.reduce((soma, s) => soma + s.carga, 0)).toBe(total);
        const calculados = painel.setores.filter((s) => s.modo === 'calculado');
        const carga = calculados.reduce((soma, s) => soma + s.carga, 0);
        const medicosTotal = calculados.reduce((soma, s) => soma + s.medicos, 0);
        expect(painel.cargaTotal).toBe(carga);
        expect(painel.medicosTotal).toBe(medicosTotal);
        expect(painel.media).toBe(medicosTotal > 0 ? carga / medicosTotal : null);
        for (const s of painel.setores) {
          expect(s.carga).toBe(s.contagens.hospitalistas);
          if (s.estado === 'calculado') expect(s.cargaPorMedico).toBe(s.carga / s.medicos);
          if (s.estado === 'semMedico') expect(s.medicos === 0 && s.carga > 0).toBe(true);
        }
      }
    }
  });
});
