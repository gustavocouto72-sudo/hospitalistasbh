/**
 * Ajudantes sintéticos para os testes da SPEC-04: painéis de setores de um posto cada, painéis aleatórios
 * determinísticos e a conferência das restrições da spec numa lista de apoios. Nenhum dado real.
 */
import { expect } from 'vitest';
import { aplicarApoios } from '../src/calculo/aplicar-apoios';
import { calcularCarga } from '../src/calculo/calcular-carga';
import { MARGEM_DO_VERDE, corDoSetor } from '../src/calculo/semaforo';
import type { Apoio, ModoSetor, Painel, PainelComApoios, QuadroMontado } from '../src/calculo/tipos';

export type SetorSintetico = { id: string; carga: number; medicos: number; modo?: ModoSetor };

/** Painel a partir de setores sintéticos de um posto cada, com o id igual ao código do posto. */
export function painel(setores: readonly SetorSintetico[]): Painel {
  const quadro: QuadroMontado = {
    tipoDia: 'semana',
    setores: setores.map(({ id, carga, medicos, modo = 'calculado' }) => ({
      id,
      nome: id,
      postos: [id],
      medicos,
      medicosDaEscala: medicos,
      residente: false,
      modo,
      contagens: { hospitalistas: carga, cardioGeriatria: 0, potenciaisAdmissoes: 0 },
      postosAusentes: [],
    })),
    postosOcultos: [],
    avisos: [],
  };
  return calcularCarga(quadro);
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Painel aleatório com 2 a `maxSetores` setores, alguns sem médico ou de escala própria. */
export function painelAleatorio(semente: number, maxSetores: number, maxCarga: number): Painel {
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

export const cor = (p: Painel, id: string) =>
  corDoSetor(p.setores.find((s) => s.id === id) as Painel['setores'][number]);

/** Confere as restrições e os invariantes da spec numa solução e devolve o painel depois do apoio. */
export function conferirRestricoes(antes: Painel, apoios: readonly Apoio[]): PainelComApoios {
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
      expect(s.diferenca as number).toBeLessThanOrEqual(MARGEM_DO_VERDE);
    }
    if (s.estado === 'escalaPropria') expect(s.leitosCedidos + s.leitosRecebidos).toBe(0);
    expect(s.leitosCedidos).toBeLessThanOrEqual(s.antes.carga);
  }
  // Σ pacientes reais (sem o fator 1,25) antes = depois, e a média não muda.
  expect(depois.setores.reduce((t, s) => t + s.pacientes, 0)).toBe(antes.setores.reduce((t, s) => t + s.carga, 0));
  expect(depois.media).toBe(antes.media);
  return depois;
}
