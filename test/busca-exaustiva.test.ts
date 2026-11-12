/**
 * Testes da busca exaustiva de referência (T-04.2), que serve para conferir a otimalidade de `sugerirApoios`
 * nos testes da SPEC-04. Os painéis são sintéticos.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aplicarApoios } from '../src/calculo/aplicar-apoios';
import { calcularCarga } from '../src/calculo/calcular-carga';
import { montarQuadro } from '../src/calculo/montar-quadro';
import { corDoSetor } from '../src/calculo/semaforo';
import type { Apoio, ContagemDoPosto, ModoSetor, Painel, QuadroMontado } from '../src/calculo/tipos';
import { buscaExaustiva, compararCustos, custoDe, foraDoVerde, type Custo } from './busca-exaustiva';

type SetorSintetico = { id: string; carga: number; medicos: number; modo?: ModoSetor };

/** Painel a partir de setores sintéticos de um posto cada, com o id igual ao código do posto. */
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

/** Confere as restrições da spec numa solução. */
function conferirRestricoes(antes: Painel, apoios: readonly Apoio[], maxApoios = 3) {
  expect(apoios.length).toBeLessThanOrEqual(maxApoios);
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
  return depois;
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
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

/**
 * Busca ingênua, sem poda: todas as listas de até `max` apoios com leitos de 1 até a carga do apoiado, filtradas
 * pelas restrições e avaliadas por `aplicarApoios` e `corDoSetor`. Só para painéis minúsculos.
 */
function buscaIngenua(antes: Painel, max: number): { apoios: Apoio[]; custo: Custo } {
  const ids = antes.setores.map((s) => s.id);
  const triplas: Apoio[] = [];
  for (const de of antes.setores) {
    for (const para of antes.setores) {
      if (de.id === para.id) continue;
      for (let leitos = 1; leitos <= para.carga; leitos++) triplas.push({ de: de.id, para: para.id, leitos });
    }
  }
  let melhor = { apoios: [] as Apoio[], custo: custoDe(aplicarApoios(antes, []), [], ids) };
  const visitar = (inicio: number, lista: Apoio[]) => {
    if (lista.length > 0) {
      const pares = new Set(lista.map((a) => `${a.de}>${a.para}`));
      if (pares.size === lista.length) {
        try {
          const depois = aplicarApoios(antes, lista);
          const ok = depois.setores.every((s) => s.leitosRecebidos === 0 || (s.diferenca as number) <= 1);
          if (ok) {
            const custo = custoDe(depois, lista, ids);
            if (compararCustos(custo, melhor.custo) < 0) melhor = { apoios: [...lista], custo };
          }
        } catch {
          // apoio inválido para aplicarApoios: fora das restrições
        }
      }
    }
    if (lista.length === max) return;
    for (let i = inicio; i < triplas.length; i++) visitar(i + 1, [...lista, triplas[i] as Apoio]);
  };
  visitar(0, []);
  return melhor;
}

describe('buscaExaustiva', () => {
  it('painel todo no verde: nenhum apoio', () => {
    const p = painel([
      { id: 'A', carga: 10, medicos: 1 },
      { id: 'B', carga: 10, medicos: 1 },
      { id: 'C', carga: 11, medicos: 1 },
    ]);
    const r = buscaExaustiva(p);
    expect(r.apoios).toEqual([]);
    expect(r.completo).toBe(true);
    expect(r.custo.foraDoVerde).toBe(0);
  });

  it('amostra de 12/11/2026 (semana): 4.3 e 4.2 vão ao verde com até 2 apoios, vindos de 4.5 e/ou 6.1', () => {
    const p = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    expect([cor(p, '4.3'), cor(p, '4.2')]).toEqual(['amarelo', 'amarelo']);
    const r = buscaExaustiva(p);
    expect(r.completo).toBe(true);
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
    const r = buscaExaustiva(p);
    expect(cor(r.painelDepois, '2.1')).not.toBe('vermelho');
    conferirRestricoes(p, r.apoios);
  });

  it('setor sem médico com 6 pacientes cede todos os 6 leitos', () => {
    const p = painel([
      { id: 'X', carga: 8, medicos: 2 },
      { id: 'S', carga: 6, medicos: 0 },
      { id: 'Y', carga: 8, medicos: 2 },
    ]);
    const r = buscaExaustiva(p);
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
    const r = buscaExaustiva(p);
    expect(r.completo).toBe(true);
    expect(r.apoios).toEqual([
      { de: 'B', para: 'A', leitos: 1 },
      { de: 'C', para: 'A', leitos: 2 },
    ]);
  });

  it('com um apoio bastando, não divide em dois e usa o mínimo de leitos', () => {
    // Média 10. A cede 2 a B (vai a 12 / 1,25 → 10,5): todos no verde com 1 apoio e 2 leitos.
    const p = painel([
      { id: 'A', carga: 13, medicos: 1 },
      { id: 'B', carga: 8, medicos: 1 },
      { id: 'C', carga: 9, medicos: 1 },
    ]);
    const r = buscaExaustiva(p);
    expect(r.custo.foraDoVerde).toBe(0);
    expect(r.apoios).toHaveLength(1);
    expect(r.custo.leitos).toBe(r.apoios[0]?.leitos);
    expect(r.apoios[0]).toEqual({ de: 'B', para: 'A', leitos: 2 });
  });

  it('entre apoiadores iguais em tudo, vence o primeiro do quadro', () => {
    const p = painel([
      { id: 'A', carga: 12, medicos: 1 },
      { id: 'B', carga: 9, medicos: 1 },
      { id: 'C', carga: 9, medicos: 1 },
    ]);
    const r = buscaExaustiva(p);
    expect(r.apoios).toEqual([{ de: 'B', para: 'A', leitos: 1 }]);
  });

  it('setor de escala própria não participa', () => {
    const p = painel([
      { id: 'A', carga: 13, medicos: 1 },
      { id: 'E', carga: 0, medicos: 0, modo: 'escalaPropria' },
      { id: 'B', carga: 8, medicos: 1 },
    ]);
    const r = buscaExaustiva(p);
    expect(r.apoios.every((a) => a.de !== 'E' && a.para !== 'E')).toBe(true);
    conferirRestricoes(p, r.apoios);
  });

  it('sem solução toda no verde com até 3 apoios: devolve a melhor e marca completo: false', () => {
    // A precisa ceder 22, e cada apoiador aguenta só 6.
    const p = painel([
      { id: 'A', carga: 30, medicos: 1 },
      { id: 'B', carga: 10, medicos: 2 },
      { id: 'C', carga: 10, medicos: 2 },
      { id: 'D', carga: 10, medicos: 2 },
      { id: 'E', carga: 10, medicos: 2 },
    ]);
    const r = buscaExaustiva(p);
    expect(r.completo).toBe(false);
    expect(r.apoios).toHaveLength(3);
    expect(r.custo.foraDoVerde).toBe(2);
    expect(foraDoVerde(r.painelDepois)).toBe(2);
    conferirRestricoes(p, r.apoios);
  });

  it('respeita o limite de apoios pedido', () => {
    const p = painel([
      { id: 'A', carga: 14, medicos: 1 },
      { id: 'B', carga: 8, medicos: 1 },
      { id: 'C', carga: 8, medicos: 1 },
      { id: 'D', carga: 10, medicos: 1 },
    ]);
    const r = buscaExaustiva(p, { maxApoios: 1 });
    expect(r.apoios.length).toBeLessThanOrEqual(1);
    expect(r.completo).toBe(false);
  });

  it('com a média indefinida não sugere apoio', () => {
    const p = painel([{ id: 'S', carga: 5, medicos: 0 }]);
    const r = buscaExaustiva(p);
    expect(r.apoios).toEqual([]);
    expect(r.completo).toBe(false);
  });

  it('o custo devolvido bate com o recalculado por aplicarApoios', () => {
    const p = calcularCarga(montarQuadro(AMOSTRA, 'semana'));
    const r = buscaExaustiva(p);
    expect(r.custo).toEqual(
      custoDe(
        aplicarApoios(p, r.apoios),
        r.apoios,
        p.setores.map((s) => s.id),
      ),
    );
  });

  it('compararCustos segue a ordem lexicográfica da spec', () => {
    const base: Custo = { foraDoVerde: 1, apoios: 2, leitos: 4, maiorCargaPorMedico: 10, chave: [1, 2, 3] };
    expect(compararCustos({ ...base, foraDoVerde: 0, apoios: 3 }, base)).toBeLessThan(0);
    expect(compararCustos({ ...base, apoios: 1, leitos: 9 }, base)).toBeLessThan(0);
    expect(compararCustos({ ...base, leitos: 3, maiorCargaPorMedico: 20 }, base)).toBeLessThan(0);
    expect(compararCustos({ ...base, maiorCargaPorMedico: 9, chave: [9] }, base)).toBeLessThan(0);
    expect(compararCustos({ ...base, chave: [1, 2, 2] }, base)).toBeLessThan(0);
    expect(compararCustos(base, { ...base, chave: [1, 2, 3] })).toBe(0);
  });

  describe('em painéis aleatórios pequenos', () => {
    const sementes = Array.from({ length: 40 }, (_, i) => i + 1);

    it.each(sementes)('semente %i: respeita as restrições, nunca piora e é determinística', (semente) => {
      const p = painelAleatorio(semente, 6, 16);
      const r = buscaExaustiva(p);
      conferirRestricoes(p, r.apoios);
      expect(r.custo.foraDoVerde).toBeLessThanOrEqual(foraDoVerde(aplicarApoios(p, [])));
      expect(r.completo).toBe(r.custo.foraDoVerde === 0);
      expect(buscaExaustiva(p)).toEqual(r);
    });

    it.each(sementes.slice(0, 25))('semente %i: empata com a busca ingênua sem poda (até 2 apoios)', (semente) => {
      const p = painelAleatorio(1000 + semente, 3, 5);
      const ids = p.setores.map((s) => s.id);
      const r = buscaExaustiva(p, { maxApoios: 2 });
      const ingenua = buscaIngenua(p, 2);
      expect(r.custo).toEqual(ingenua.custo);
      expect(r.apoios).toHaveLength(ingenua.apoios.length);
      expect(r.apoios).toEqual(expect.arrayContaining(ingenua.apoios));
      expect(custoDe(aplicarApoios(p, r.apoios), r.apoios, ids)).toEqual(r.custo);
    });
  });
});

describe('fica em test/, fora do bundle', () => {
  const raiz = fileURLToPath(new URL('../', import.meta.url));
  const arquivos = (pasta: string): string[] =>
    readdirSync(pasta).flatMap((nome) => {
      const caminho = join(pasta, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
    });

  it('nenhum arquivo de src/ importa a busca exaustiva nem test/', () => {
    for (const arquivo of arquivos(join(raiz, 'src'))) {
      if (!/\.(ts|tsx)$/.test(arquivo)) continue;
      const codigo = readFileSync(arquivo, 'utf8');
      expect(codigo, arquivo).not.toMatch(/busca-exaustiva|from ['"][./]*test\//);
    }
  });
});
