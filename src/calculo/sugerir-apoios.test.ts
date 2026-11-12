/**
 * Testes de `sugerirApoios` (SPEC-04; T-04.3): determinismo, restrições da spec e `completo: false` quando não
 * há solução toda no verde. Os painéis são sintéticos.
 */
import { describe, expect, it } from 'vitest';
import { textos } from '../textos';
import { aplicarApoios } from './aplicar-apoios';
import { calcularCarga } from './calcular-carga';
import { montarQuadro } from './montar-quadro';
import { corDoSetor } from './semaforo';
import { sugerirApoios } from './sugerir-apoios';
import type { Apoio, ContagemDoPosto, ModoSetor, Painel, QuadroMontado } from './tipos';

type SetorSintetico = { id: string; carga: number; medicos: number; modo?: ModoSetor };

function painel(setores: readonly SetorSintetico[]): Painel {
  const quadro: QuadroMontado = {
    tipoDia: 'semana',
    setores: setores.map(({ id, carga, medicos, modo = 'calculado' }) => ({
      id,
      nome: id,
      postos: [id],
      medicos,
      modo,
      contagens: { hospitalistas: carga, cardioGeriatria: 0, potenciaisAdmissoes: 0 },
      postosAusentes: [],
    })),
    postosOcultos: [],
    avisos: [],
  };
  return calcularCarga(quadro);
}

const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

/** Contagens sintéticas da tabela de aceite da SPEC-03 (amostra de 12/11/2026, semana). */
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

const cor = (p: Painel, id: string) => corDoSetor(p.setores.find((s) => s.id === id) as Painel['setores'][number]);

const foraDoVerde = (p: Painel) =>
  p.setores.filter((s) => {
    const c = corDoSetor(s);
    return c !== null && c !== 'verde';
  }).length;

function conferirRestricoes(antes: Painel, apoios: readonly Apoio[]) {
  const pares = new Set(apoios.map((a) => `${a.de}>${a.para}`));
  expect(pares.size).toBe(apoios.length);
  const apoiadores = new Set(apoios.map((a) => a.de));
  for (const apoio of apoios) {
    expect(Number.isInteger(apoio.leitos) && apoio.leitos >= 1).toBe(true);
    expect(apoiadores.has(apoio.para)).toBe(false);
  }
  const depois = aplicarApoios(antes, apoios);
  for (const s of depois.setores) {
    if (s.leitosRecebidos > 0) {
      expect(s.estado).toBe('calculado');
      expect(s.diferenca as number).toBeLessThanOrEqual(1);
    }
    if (s.estado === 'escalaPropria') expect(s.leitosCedidos + s.leitosRecebidos).toBe(0);
    expect(s.leitosCedidos).toBeLessThanOrEqual(s.antes.carga);
  }
  const antesTotal = antes.setores.reduce((t, s) => t + s.carga, 0);
  expect(depois.setores.reduce((t, s) => t + s.pacientes, 0)).toBe(antesTotal);
  return depois;
}

function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function painelAleatorio(semente: number, maxSetores: number, maxCarga: number): Painel {
  const r = aleatorio(semente);
  const n = 2 + Math.floor(r() * (maxSetores - 1));
  const setores: SetorSintetico[] = [];
  for (let i = 0; i < n; i++) {
    const sorteio = r();
    const medicos = sorteio < 0.1 ? 0 : 0.5 * (1 + Math.floor(r() * 4));
    const modo: ModoSetor = sorteio > 0.93 ? 'escalaPropria' : 'calculado';
    setores.push({
      id: `S${i + 1}`,
      carga: Math.floor(r() * (maxCarga + 1)),
      medicos: modo === 'calculado' ? medicos : 0,
      modo,
    });
  }
  return painel(setores);
}

describe('sugerirApoios', () => {
  it('painel todo no verde: nenhum apoio e completo', () => {
    const p = painel([
      { id: 'A', carga: 10, medicos: 1 },
      { id: 'B', carga: 10, medicos: 1 },
      { id: 'C', carga: 11, medicos: 1 },
    ]);
    const r = sugerirApoios(p);
    expect(r.apoios).toEqual([]);
    expect(r.completo).toBe(true);
    expect(r.aviso).toBeNull();
    expect(r.painelDepois).toEqual(aplicarApoios(p, []));
  });

  it('amostra de 12/11/2026 (semana): 4.3 e 4.2 vão ao verde com até 2 apoios, vindos de 4.5 e/ou 6.1', () => {
    const p = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    expect([cor(p, '4.3'), cor(p, '4.2')]).toEqual(['amarelo', 'amarelo']);
    const r = sugerirApoios(p);
    expect(r.completo).toBe(true);
    expect(r.apoios.length).toBeGreaterThan(0);
    expect(r.apoios.length).toBeLessThanOrEqual(2);
    for (const a of r.apoios) expect(['4.5', '6.1']).toContain(a.de);
    expect(cor(r.painelDepois, '4.3')).toBe('verde');
    expect(cor(r.painelDepois, '4.2')).toBe('verde');
    conferirRestricoes(p, r.apoios);
  });

  it('2.1 com 20 pacientes e 1 médico sai do vermelho', () => {
    const p = painel([
      { id: '2.1', carga: 20, medicos: 1 },
      { id: '4.2', carga: 10, medicos: 2 },
      { id: '4.3', carga: 10, medicos: 2 },
      { id: '4.4', carga: 10, medicos: 2 },
    ]);
    expect(cor(p, '2.1')).toBe('vermelho');
    const r = sugerirApoios(p);
    expect(cor(r.painelDepois, '2.1')).not.toBe('vermelho');
    conferirRestricoes(p, r.apoios);
  });

  it('setor sem médico com 6 pacientes cede todos os 6 leitos', () => {
    const p = painel([
      { id: 'X', carga: 8, medicos: 2 },
      { id: 'S', carga: 6, medicos: 0 },
      { id: 'Y', carga: 8, medicos: 2 },
    ]);
    const r = sugerirApoios(p);
    const cedidos = r.apoios.filter((a) => a.para === 'S').reduce((t, a) => t + a.leitos, 0);
    expect(cedidos).toBe(6);
    expect(r.painelDepois.setores.find((s) => s.id === 'S')?.estado).toBe('vazio');
    expect(r.completo).toBe(true);
    conferirRestricoes(p, r.apoios);
  });

  it('prefere menos apoios, depois menos leitos e desempata pela ordem dos setores', () => {
    // Média 10. A precisa ceder 3; nem B nem C aguentam 3 sozinhos sem passar de +1.
    const p = painel([
      { id: 'A', carga: 14, medicos: 1 },
      { id: 'B', carga: 8, medicos: 1 },
      { id: 'C', carga: 8, medicos: 1 },
      { id: 'D', carga: 10, medicos: 1 },
    ]);
    expect(sugerirApoios(p).apoios).toEqual([
      { de: 'B', para: 'A', leitos: 1 },
      { de: 'C', para: 'A', leitos: 2 },
    ]);
  });

  it('com um apoio bastando, não divide em dois e usa o mínimo de leitos', () => {
    const p = painel([
      { id: 'A', carga: 13, medicos: 1 },
      { id: 'B', carga: 8, medicos: 1 },
      { id: 'C', carga: 9, medicos: 1 },
    ]);
    expect(sugerirApoios(p).apoios).toEqual([{ de: 'B', para: 'A', leitos: 2 }]);
  });

  it('entre apoiadores iguais em tudo, vence o primeiro do quadro', () => {
    const p = painel([
      { id: 'A', carga: 12, medicos: 1 },
      { id: 'B', carga: 9, medicos: 1 },
      { id: 'C', carga: 9, medicos: 1 },
    ]);
    expect(sugerirApoios(p).apoios).toEqual([{ de: 'B', para: 'A', leitos: 1 }]);
  });

  it('setor de escala própria não participa', () => {
    const p = painel([
      { id: 'A', carga: 13, medicos: 1 },
      { id: 'E', carga: 9, medicos: 0, modo: 'escalaPropria' },
      { id: 'B', carga: 8, medicos: 1 },
    ]);
    const r = sugerirApoios(p);
    expect(r.apoios.length).toBeGreaterThan(0);
    expect(r.apoios.every((a) => a.de !== 'E' && a.para !== 'E')).toBe(true);
    conferirRestricoes(p, r.apoios);
  });

  it('o apoiador não sai do verde para cima', () => {
    // Média 12. A está em +8; B e C aguentam pouco cada um.
    const p = painel([
      { id: 'A', carga: 20, medicos: 1 },
      { id: 'B', carga: 10, medicos: 1 },
      { id: 'C', carga: 10, medicos: 1 },
      { id: 'D', carga: 8, medicos: 1 },
    ]);
    const r = sugerirApoios(p);
    const depois = conferirRestricoes(p, r.apoios);
    for (const s of depois.setores) if (s.leitosRecebidos > 0) expect(s.diferenca as number).toBeLessThanOrEqual(1);
  });

  it('sem solução toda no verde: devolve a melhor, marca completo: false e avisa', () => {
    // Média 10. A precisa ceder 19 para chegar a +1, e B e C aguentam só 9 cada um: A fica fora do verde de
    // qualquer jeito. B e C começam no azul (5 por médico), então o melhor é o mínimo que leva os dois ao verde.
    const p = painel([
      { id: 'A', carga: 30, medicos: 1 },
      { id: 'B', carga: 10, medicos: 2 },
      { id: 'C', carga: 10, medicos: 2 },
    ]);
    const r = sugerirApoios(p);
    expect(r.completo).toBe(false);
    expect(r.aviso).toBe(textos.apoio.avisos.nemTodosNoVerde);
    expect(foraDoVerde(r.painelDepois)).toBeLessThan(foraDoVerde(p));
    expect(r.apoios).toEqual([
      { de: 'B', para: 'A', leitos: 7 },
      { de: 'C', para: 'A', leitos: 7 },
    ]);
    expect(foraDoVerde(r.painelDepois)).toBe(1);
    conferirRestricoes(p, r.apoios);
  });

  it('com a média indefinida não sugere apoio e marca completo: false', () => {
    const p = painel([{ id: 'S', carga: 5, medicos: 0 }]);
    const r = sugerirApoios(p);
    expect(r.apoios).toEqual([]);
    expect(r.completo).toBe(false);
    expect(r.aviso).toBe(textos.apoio.avisos.nemTodosNoVerde);
  });

  it('respeita o limite de apoios pedido', () => {
    const p = painel([
      { id: 'A', carga: 14, medicos: 1 },
      { id: 'B', carga: 8, medicos: 1 },
      { id: 'C', carga: 8, medicos: 1 },
      { id: 'D', carga: 10, medicos: 1 },
    ]);
    const r = sugerirApoios(p, { maxApoios: 1 });
    expect(r.apoios.length).toBeLessThanOrEqual(1);
    expect(r.completo).toBe(false);
  });

  it('devolve os apoios na ordem do quadro (apoiado, depois apoiador)', () => {
    const p = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    const ordem = p.setores.map((s) => s.id);
    const chave = (a: Apoio) => [ordem.indexOf(a.para), ordem.indexOf(a.de)] as const;
    const { apoios } = sugerirApoios(p);
    const ordenados = [...apoios].sort((x, y) => chave(x)[0] - chave(y)[0] || chave(x)[1] - chave(y)[1]);
    expect(apoios).toEqual(ordenados);
  });

  it('não muda o painel de entrada', () => {
    const p = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    const copia = structuredClone(p);
    sugerirApoios(p);
    expect(p).toEqual(copia);
  });

  describe('em painéis aleatórios', () => {
    const sementes = Array.from({ length: 60 }, (_, i) => i + 1);

    it.each(sementes)('semente %i: restrições, nunca piora, completo coerente e determinística', (semente) => {
      const p = painelAleatorio(semente, 10, 24);
      const r = sugerirApoios(p);
      conferirRestricoes(p, r.apoios);
      expect(r.painelDepois).toEqual(aplicarApoios(p, r.apoios));
      expect(foraDoVerde(r.painelDepois)).toBeLessThanOrEqual(foraDoVerde(p));
      expect(r.completo).toBe(foraDoVerde(r.painelDepois) === 0);
      expect(r.aviso).toBe(r.completo ? null : textos.apoio.avisos.nemTodosNoVerde);
      expect(sugerirApoios(structuredClone(p))).toEqual(r);
    });
  });
});
