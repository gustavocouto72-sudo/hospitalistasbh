import { describe, expect, it } from 'vitest';
import { aplicarApoios } from './aplicar-apoios';
import { calcularCarga } from './calcular-carga';
import { montarQuadro } from './montar-quadro';
import { corDoSetor } from './semaforo';
import type { Ajustes, Apoio, ContagemDoPosto, Painel, SetorComApoio } from './tipos';

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

const painelDe = (ajustes?: Ajustes, postos: readonly ContagemDoPosto[] = AMOSTRA): Painel =>
  calcularCarga(montarQuadro(postos, 'semana', ajustes));

const setor = (painel: { setores: readonly SetorComApoio[] }, id: string): SetorComApoio => {
  const encontrado = painel.setores.find((s) => s.id === id);
  if (!encontrado) throw new Error(`setor ${id} não encontrado`);
  return encontrado;
};

const MEDIA = 174 / 18;

describe('aplicarApoios', () => {
  it('sem apoios, os números ficam iguais aos de antes', () => {
    const painel = painelDe();
    const depois = aplicarApoios(painel, []);
    expect(depois.apoios).toEqual([]);
    expect(depois.media).toBe(painel.media);
    for (const [i, s] of depois.setores.entries()) {
      const original = painel.setores[i];
      expect(s).toMatchObject(original as object);
      expect(s.antes).toEqual({
        estado: original?.estado,
        carga: original?.carga,
        cargaPorMedico: original?.cargaPorMedico,
        diferenca: original?.diferenca,
      });
      expect(s).toMatchObject({ leitosCedidos: 0, leitosRecebidos: 0, pacientes: original?.carga });
    }
  });

  it('no apoiado tira os leitos; no apoiador soma 1,25 por leito', () => {
    const depois = aplicarApoios(painelDe(), [{ de: '4.5', para: '4.3', leitos: 2 }]);
    const apoiado = setor(depois, '4.3');
    expect(apoiado).toMatchObject({
      carga: 21,
      cargaPorMedico: 10.5,
      leitosCedidos: 2,
      leitosRecebidos: 0,
      pacientes: 21,
    });
    expect(apoiado.diferenca).toBe(10.5 - MEDIA);
    expect(apoiado.antes).toMatchObject({ carga: 23, cargaPorMedico: 11.5, diferenca: 11.5 - MEDIA });
    const apoiador = setor(depois, '4.5');
    expect(apoiador).toMatchObject({
      carga: 18.5,
      cargaPorMedico: 9.25,
      leitosCedidos: 0,
      leitosRecebidos: 2,
      pacientes: 18,
    });
    expect(apoiador.diferenca).toBe(9.25 - MEDIA);
  });

  it('mantém a média, a carga total e os médicos de antes do apoio', () => {
    const painel = painelDe();
    const depois = aplicarApoios(painel, [{ de: '6.1', para: '4.2', leitos: 3 }]);
    expect(depois.media).toBe(MEDIA);
    expect(depois.cargaTotal).toBe(174);
    expect(depois.medicosTotal).toBe(18);
    expect(depois.tipoDia).toBe(painel.tipoDia);
    expect(depois.avisos).toEqual(painel.avisos);
    expect(depois.postosOcultos).toEqual(painel.postosOcultos);
  });

  it('a cor sai da diferença depois do apoio contra a média original', () => {
    const painel = painelDe();
    expect(corDoSetor(setor(aplicarApoios(painel, []), '4.3'))).toBe('amarelo');
    expect(corDoSetor(setor(aplicarApoios(painel, []), '4.2'))).toBe('amarelo');
    const depois = aplicarApoios(painel, [
      { de: '4.5', para: '4.3', leitos: 2 },
      { de: '6.1', para: '4.2', leitos: 2 },
    ]);
    for (const id of ['4.3', '4.2', '4.5', '6.1']) expect(corDoSetor(setor(depois, id))).toBe('verde');
  });

  it('o peso 1,25 pode tirar o apoiador do verde', () => {
    const depois = aplicarApoios(painelDe(), [{ de: '6.1', para: '4.3', leitos: 6 }]);
    expect(setor(depois, '6.1').cargaPorMedico).toBe(19.5 / 1.5);
    expect(corDoSetor(setor(depois, '6.1'))).toBe('vermelho');
  });

  it('soma vários apoios do mesmo apoiador e para o mesmo apoiado', () => {
    const depois = aplicarApoios(painelDe(), [
      { de: '4.5', para: '4.3', leitos: 1 },
      { de: '6.1', para: '4.3', leitos: 1 },
      { de: '4.5', para: '4.2', leitos: 2 },
      { de: '4.5', para: '4.3', leitos: 1 },
    ]);
    expect(setor(depois, '4.3')).toMatchObject({ carga: 20, leitosCedidos: 3, pacientes: 20 });
    expect(setor(depois, '4.2')).toMatchObject({ carga: 26, leitosCedidos: 2 });
    expect(setor(depois, '4.5')).toMatchObject({ carga: 16 + 1.25 * 4, leitosRecebidos: 4, pacientes: 20 });
    expect(setor(depois, '6.1')).toMatchObject({ carga: 13.25, leitosRecebidos: 1, pacientes: 13 });
  });

  it('setor sem médico que cede todos os leitos fica vazio, fora do semáforo', () => {
    const painel = painelDe({ medicos: { '6.1': 0 } });
    expect(setor(aplicarApoios(painel, []), '6.1').estado).toBe('semMedico');
    const depois = aplicarApoios(painel, [
      { de: '4.5', para: '6.1', leitos: 4 },
      { de: '6.3', para: '6.1', leitos: 8 },
    ]);
    const s = setor(depois, '6.1');
    expect(s).toMatchObject({ estado: 'vazio', carga: 0, cargaPorMedico: null, diferenca: null, pacientes: 0 });
    expect(s.antes).toMatchObject({ estado: 'semMedico', carga: 12, cargaPorMedico: Number.POSITIVE_INFINITY });
    expect(corDoSetor(s)).toBeNull();
    expect(depois.media).toBe(174 / 16.5);
  });

  it('setor sem médico que cede só parte continua vermelho', () => {
    const depois = aplicarApoios(painelDe({ medicos: { '6.1': 0 } }), [{ de: '4.5', para: '6.1', leitos: 5 }]);
    expect(setor(depois, '6.1')).toMatchObject({ estado: 'semMedico', carga: 7, cargaPorMedico: Infinity });
    expect(corDoSetor(setor(depois, '6.1'))).toBe('vermelho');
  });

  it('com a média indefinida a diferença continua nula', () => {
    const zerados = Object.fromEntries(['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'].map((id) => [id, 0]));
    const painel = painelDe({ medicos: zerados });
    expect(painel.media).toBeNull();
    expect(aplicarApoios(painel, []).setores.every((s) => s.diferenca === null)).toBe(true);
  });

  describe('edição manual', () => {
    const sugerida: Apoio[] = [
      { de: '4.5', para: '4.3', leitos: 2 },
      { de: '6.1', para: '4.2', leitos: 2 },
    ];

    it('remover um apoio devolve o setor aos números de antes', () => {
      const painel = painelDe();
      const depois = aplicarApoios(painel, sugerida.slice(1));
      expect(setor(depois, '4.3')).toMatchObject({ carga: 23, cargaPorMedico: 11.5, leitosCedidos: 0 });
      expect(setor(depois, '4.5')).toMatchObject({ carga: 16, leitosRecebidos: 0 });
      expect(setor(depois, '4.2')).toMatchObject({ carga: 26 });
    });

    it('alterar os leitos recalcula os dois lados', () => {
      const depois = aplicarApoios(painelDe(), [{ ...sugerida[0]!, leitos: 4 }, sugerida[1]!]);
      expect(setor(depois, '4.3')).toMatchObject({ carga: 19, cargaPorMedico: 9.5 });
      expect(setor(depois, '4.5')).toMatchObject({ carga: 21, cargaPorMedico: 10.5 });
    });

    it('trocar o apoiador move o peso para o novo setor', () => {
      const depois = aplicarApoios(painelDe(), [{ ...sugerida[0]!, de: '6.3' }, sugerida[1]!]);
      expect(setor(depois, '4.5')).toMatchObject({ carga: 16, leitosRecebidos: 0 });
      expect(setor(depois, '6.3')).toMatchObject({ carga: 24.5, cargaPorMedico: 24.5 / 2.5, leitosRecebidos: 2 });
      expect(setor(depois, '4.3')).toMatchObject({ carga: 21 });
    });

    it('criar um apoio novo soma aos existentes', () => {
      const depois = aplicarApoios(painelDe(), [...sugerida, { de: '2', para: '6.2', leitos: 1 }]);
      expect(setor(depois, '6.2')).toMatchObject({ carga: 25, cargaPorMedico: 10 });
      expect(setor(depois, '2')).toMatchObject({ carga: 28.25 });
      expect(depois.apoios).toEqual([...sugerida, { de: '2', para: '6.2', leitos: 1 }]);
    });
  });

  describe('apoios inválidos', () => {
    const casos: [string, Apoio[], RegExp][] = [
      ['leitos zero', [{ de: '4.5', para: '4.3', leitos: 0 }], /inteiro maior que zero/],
      ['leitos negativos', [{ de: '4.5', para: '4.3', leitos: -1 }], /inteiro maior que zero/],
      ['leitos fracionados', [{ de: '4.5', para: '4.3', leitos: 1.5 }], /inteiro maior que zero/],
      ['leitos NaN', [{ de: '4.5', para: '4.3', leitos: Number.NaN }], /inteiro maior que zero/],
      ['o mesmo setor', [{ de: '4.3', para: '4.3', leitos: 1 }], /a si mesmo/],
      ['apoiador fora do quadro', [{ de: '9.9', para: '4.3', leitos: 1 }], /9\.9 não está no quadro/],
      ['apoiado fora do quadro', [{ de: '4.5', para: '9.9', leitos: 1 }], /9\.9 não está no quadro/],
      ['apoiador de escala própria', [{ de: '3.1', para: '4.3', leitos: 1 }], /escala própria/],
      ['apoiado de escala própria', [{ de: '4.5', para: '3.1', leitos: 1 }], /escala própria/],
      [
        'apoiador que também é apoiado',
        [
          { de: '4.5', para: '4.3', leitos: 1 },
          { de: '6.1', para: '4.5', leitos: 1 },
        ],
        /apoiar e ser apoiado/,
      ],
      ['ceder mais do que tem', [{ de: '4.5', para: '4.3', leitos: 24 }], /cederia 24 leitos, mas tem só 23/],
      [
        'ceder mais do que tem somando apoios',
        [
          { de: '4.5', para: '4.3', leitos: 20 },
          { de: '6.1', para: '4.3', leitos: 4 },
        ],
        /cederia 24 leitos/,
      ],
    ];

    it.each(casos)('recusa %s', (_, apoios, mensagem) => {
      expect(() => aplicarApoios(painelDe(), apoios)).toThrow(mensagem);
      expect(() => aplicarApoios(painelDe(), apoios)).toThrow(RangeError);
    });

    it('recusa apoiador sem médico', () => {
      const painel = painelDe({ medicos: { '6.1': 0 } });
      expect(() => aplicarApoios(painel, [{ de: '6.1', para: '4.3', leitos: 1 }])).toThrow(/sem médico/);
    });
  });

  it('é puro e determinístico', () => {
    const painel = painelDe();
    const apoios: Apoio[] = [{ de: '4.5', para: '4.3', leitos: 2 }];
    const copiaPainel = structuredClone(painel);
    const copiaApoios = structuredClone(apoios);
    expect(aplicarApoios(painel, apoios)).toEqual(aplicarApoios(painel, apoios));
    expect(painel).toEqual(copiaPainel);
    expect(apoios).toEqual(copiaApoios);
  });

  describe('invariantes em painéis aleatórios', () => {
    let semente = 20_261_112;
    const aleatorio = (max: number) => {
      semente = (semente * 1_103_515_245 + 12_345) % 2_147_483_648;
      return semente % (max + 1);
    };
    const ids = ['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'];

    const sortear = () => {
      const postos = AMOSTRA.map((p) => posto(p.codigo, aleatorio(30)));
      const medicos = Object.fromEntries(ids.map((id) => [id, aleatorio(1) ? aleatorio(8) / 2 : 1 + aleatorio(4) / 2]));
      const painel = painelDe({ medicos }, postos);
      const elegiveis = painel.setores.filter((s) => s.estado === 'calculado' || s.estado === 'semMedico');
      const doadores = elegiveis.filter((s) => s.estado === 'calculado');
      const apoiados = new Set<string>();
      const apoiadores = new Set<string>();
      const cedidos = new Map<string, number>();
      const apoios: Apoio[] = [];
      for (let i = aleatorio(4); i > 0; i -= 1) {
        const para = elegiveis[aleatorio(elegiveis.length - 1)];
        const de = doadores[aleatorio(Math.max(doadores.length - 1, 0))];
        if (!para || !de || de.id === para.id || apoiadores.has(para.id) || apoiados.has(de.id)) continue;
        const resta = para.carga - (cedidos.get(para.id) ?? 0);
        if (resta < 1) continue;
        const leitos = 1 + aleatorio(resta - 1);
        cedidos.set(para.id, (cedidos.get(para.id) ?? 0) + leitos);
        apoiados.add(para.id);
        apoiadores.add(de.id);
        apoios.push({ de: de.id, para: para.id, leitos });
      }
      return { painel, apoios };
    };

    it('Σ pacientes reais antes = depois, ninguém cede mais do que tem, e a média não muda', () => {
      let comApoio = 0;
      for (let rodada = 0; rodada < 300; rodada += 1) {
        const { painel, apoios } = sortear();
        if (apoios.length > 0) comApoio += 1;
        const depois = aplicarApoios(painel, apoios);
        const antes = painel.setores.reduce((soma, s) => soma + s.carga, 0);
        expect(depois.setores.reduce((soma, s) => soma + s.pacientes, 0)).toBe(antes);
        expect(depois.media).toBe(painel.media);
        const leitos = apoios.reduce((soma, a) => soma + a.leitos, 0);
        expect(depois.setores.reduce((soma, s) => soma + s.leitosCedidos, 0)).toBe(leitos);
        expect(depois.setores.reduce((soma, s) => soma + s.leitosRecebidos, 0)).toBe(leitos);
        for (const s of depois.setores) {
          expect(s.leitosCedidos).toBeLessThanOrEqual(s.antes.carga);
          expect(s.pacientes).toBeGreaterThanOrEqual(0);
          expect(s.carga).toBe(s.antes.carga - s.leitosCedidos + 1.25 * s.leitosRecebidos);
          expect(s.leitosCedidos > 0 && s.leitosRecebidos > 0).toBe(false);
          if (s.estado === 'calculado') {
            expect(s.cargaPorMedico).toBe(s.carga / s.medicos);
            expect(s.diferenca).toBe(painel.media === null ? null : s.carga / s.medicos - painel.media);
          }
        }
        expect(aplicarApoios(painel, apoios)).toEqual(depois);
      }
      expect(comApoio).toBeGreaterThan(100);
    });
  });
});

it('o resultado serve onde se espera um Painel', () => {
  const comoPainel: Painel = aplicarApoios(painelDe(), []);
  expect(comoPainel.setores).toHaveLength(painelDe().setores.length);
});
