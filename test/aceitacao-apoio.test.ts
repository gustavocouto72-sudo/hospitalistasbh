/**
 * Aceitação da SPEC-04 (T-04.4): os casos de "Critérios de aceite", os testes de propriedade (invariantes,
 * "nunca piora" e determinismo) e a comparação de `sugerirApoios` com a busca exaustiva de referência em
 * painéis aleatórios pequenos. Tudo sintético.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aplicarApoios } from '../src/calculo/aplicar-apoios';
import { calcularCarga } from '../src/calculo/calcular-carga';
import { montarQuadro } from '../src/calculo/montar-quadro';
import { sugerirApoios } from '../src/calculo/sugerir-apoios';
import type { Painel } from '../src/calculo/tipos';
import { lerRelatorio } from '../src/relatorio/ler';
import { textos } from '../src/textos';
import { conferirRestricoes, cor, painel, painelAleatorio } from './apoio-sintetico';
import { buscaExaustiva, compararCustos, custoDe, foraDoVerde, type Custo } from './busca-exaustiva';

const pasta = new URL('./fixtures/', import.meta.url);

const FIXTURES = [
  'relatorio-9998-latin1.xls',
  'relatorio-9998-utf8-bom.xls',
  'relatorio-9998-ponto-e-virgula.csv',
  'relatorio-9998-virgula.csv',
  'relatorio-9998.xlsx',
];

async function painelDaAmostra(arquivo: string): Promise<Painel> {
  const bytes = readFileSync(new URL(arquivo, pasta));
  const leitura = await lerRelatorio(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    arquivo,
  );
  expect(leitura.erros).toEqual([]);
  return calcularCarga(montarQuadro(leitura.postos, 'semana'));
}

const custoDaSugestao = (p: Painel, r: ReturnType<typeof sugerirApoios>) =>
  custoDe(
    r.painelDepois,
    r.apoios,
    p.setores.map((s) => s.id),
  );

describe.each(FIXTURES)('T-04.4 — amostra de 12/11/2026, semana (%s)', (arquivo) => {
  it('4.3 e 4.2 saem do amarelo para o verde com até 2 apoios, vindos de 4.5 e/ou 6.1', async () => {
    const p = await painelDaAmostra(arquivo);
    expect([cor(p, '4.3'), cor(p, '4.2'), cor(p, '4.5'), cor(p, '6.1')]).toEqual([
      'amarelo',
      'amarelo',
      'azulClaro',
      'azulClaro',
    ]);
    const r = sugerirApoios(p);
    expect(r.apoios.length).toBeGreaterThan(0);
    expect(r.apoios.length).toBeLessThanOrEqual(2);
    for (const a of r.apoios) expect(['4.5', '6.1']).toContain(a.de);
    expect(cor(r.painelDepois, '4.3')).toBe('verde');
    expect(cor(r.painelDepois, '4.2')).toBe('verde');
    expect(r.completo).toBe(true);
    expect(r.aviso).toBeNull();
    conferirRestricoes(p, r.apoios);
  });

  it('resultado exato, igual ao da busca exaustiva (aguarda a conferência do dono na T-04.5)', async () => {
    const p = await painelDaAmostra(arquivo);
    const r = sugerirApoios(p);
    expect(r.apoios).toEqual([
      { de: '4.5', para: '4.2', leitos: 2 },
      { de: '6.1', para: '4.3', leitos: 2 },
    ]);
    expect(r.apoios).toEqual(buscaExaustiva(p).apoios);
  });
});

describe('T-04.4 — casos de aceitação sintéticos', () => {
  it('2.1 com 20 pacientes e 1 médico sai do vermelho, com o mesmo custo da busca exaustiva', () => {
    const p = painel([
      { id: '2.1', carga: 20, medicos: 1 },
      { id: '4.2', carga: 10, medicos: 2 },
      { id: '4.3', carga: 10, medicos: 2 },
      { id: '4.4', carga: 10, medicos: 2 },
    ]);
    expect(cor(p, '2.1')).toBe('vermelho');
    const r = sugerirApoios(p);
    expect(cor(r.painelDepois, '2.1')).not.toBe('vermelho');
    expect(r.apoios).toEqual([
      { de: '4.2', para: '2.1', leitos: 4 },
      { de: '4.3', para: '2.1', leitos: 4 },
      { de: '4.4', para: '2.1', leitos: 4 },
    ]);
    expect(r.completo).toBe(true);
    expect(compararCustos(custoDaSugestao(p, r), buscaExaustiva(p).custo)).toBe(0);
    conferirRestricoes(p, r.apoios);
  });

  it('setor sem médico com 6 pacientes: todos os 6 leitos vão para outros setores', () => {
    const p = painel([
      { id: 'A', carga: 9, medicos: 1 },
      { id: 'S', carga: 6, medicos: 0 },
      { id: 'B', carga: 16, medicos: 2 },
      { id: 'C', carga: 18, medicos: 2 },
    ]);
    expect(p.setores.find((s) => s.id === 'S')?.estado).toBe('semMedico');
    const r = sugerirApoios(p);
    const cedidos = r.apoios.filter((a) => a.para === 'S').reduce((t, a) => t + a.leitos, 0);
    expect(cedidos).toBe(6);
    expect(r.apoios.every((a) => a.de !== 'S')).toBe(true);
    const depois = conferirRestricoes(p, r.apoios);
    expect(depois.setores.find((s) => s.id === 'S')).toMatchObject({ estado: 'vazio', pacientes: 0 });
    expect(compararCustos(custoDaSugestao(p, r), buscaExaustiva(p).custo)).toBe(0);
  });

  it('painel todo no verde: nenhum apoio', () => {
    const p = painel([
      { id: 'A', carga: 10, medicos: 1 },
      { id: 'B', carga: 19, medicos: 2 },
      { id: 'C', carga: 21, medicos: 2 },
    ]);
    expect(foraDoVerde(p)).toBe(0);
    const r = sugerirApoios(p);
    expect(r.apoios).toEqual([]);
    expect(r.completo).toBe(true);
    expect(r.painelDepois).toEqual(aplicarApoios(p, []));
  });

  it('sem solução toda no verde: devolve a melhor, marca completo: false e avisa', () => {
    const p = painel([
      { id: 'A', carga: 30, medicos: 1 },
      { id: 'B', carga: 10, medicos: 2 },
      { id: 'C', carga: 10, medicos: 2 },
    ]);
    const r = sugerirApoios(p);
    expect(r.completo).toBe(false);
    expect(r.aviso).toBe(textos.apoio.avisos.nemTodosNoVerde);
    expect(compararCustos(custoDaSugestao(p, r), buscaExaustiva(p).custo)).toBe(0);
  });
});

describe('T-04.4 — propriedades em painéis aleatórios (até 10 setores)', () => {
  const sementes = Array.from({ length: 100 }, (_, i) => 9001 + i);

  it.each(sementes)('semente %i: invariantes, nunca piora e determinismo', (semente) => {
    const p = painelAleatorio(semente, 10, 24);
    const copia = structuredClone(p);
    const r = sugerirApoios(p);
    // Invariantes e restrições: Σ pacientes reais, ninguém cede mais do que tem, apoiador até +1 etc.
    conferirRestricoes(p, r.apoios);
    expect(r.painelDepois).toEqual(aplicarApoios(p, r.apoios));
    // Nunca piora o número de setores fora do verde.
    expect(foraDoVerde(r.painelDepois)).toBeLessThanOrEqual(foraDoVerde(p));
    expect(r.completo).toBe(foraDoVerde(r.painelDepois) === 0);
    // Determinismo, sem mudar a entrada.
    expect(p).toEqual(copia);
    expect(sugerirApoios(copia)).toEqual(r);
  });
});

/**
 * Comparação com a busca exaustiva (SPEC-04, passo 5): 300 painéis aleatórios de até 6 setores, com o guloso
 * limitado aos mesmos 3 apoios da busca para comparar o mesmo espaço de soluções.
 */
describe('T-04.4 — guloso × busca exaustiva em painéis aleatórios pequenos', () => {
  const SEMENTES = Array.from({ length: 300 }, (_, i) => 5001 + i);

  type Criterio = Exclude<keyof Custo, 'chave'> | 'ordemDoQuadro';

  /** Primeiro critério da spec em que o guloso perde da busca exaustiva. */
  function criterioDaPerda(guloso: Custo, exaustiva: Custo): Criterio {
    const campos = ['foraDoVerde', 'apoios', 'leitos', 'maiorCargaPorMedico'] as const;
    for (const campo of campos) if (guloso[campo] !== exaustiva[campo]) return campo;
    return 'ordemDoQuadro';
  }

  /**
   * Divergências conferidas: painéis em que o guloso (até 3 apoios) fica atrás da busca exaustiva, com o
   * primeiro critério em que perde. Em nenhum ele perde mais de um setor fora do verde.
   */
  const DIVERGENCIAS: Record<number, Criterio> = {
    5110: 'ordemDoQuadro',
    5151: 'leitos',
    5213: 'leitos',
    5236: 'leitos',
    5254: 'foraDoVerde',
    5267: 'leitos',
    5275: 'leitos',
    5281: 'leitos',
  };

  const resultados = SEMENTES.map((semente) => {
    const p = painelAleatorio(semente, 6, 16);
    const exaustiva = buscaExaustiva(p);
    const guloso = sugerirApoios(p, { maxApoios: 3 });
    const semTeto = sugerirApoios(p);
    return {
      semente,
      exaustiva: exaustiva.custo,
      guloso: custoDaSugestao(p, guloso),
      semTeto: custoDaSugestao(p, semTeto),
    };
  });

  it('empata em pelo menos 95% dos painéis', () => {
    const empates = resultados.filter((r) => compararCustos(r.guloso, r.exaustiva) === 0).length;
    expect(empates / resultados.length).toBeGreaterThanOrEqual(0.95);
  });

  it('as divergências são exatamente as registradas, e o guloso nunca supera a busca exaustiva', () => {
    const divergencias: Record<number, Criterio> = {};
    for (const r of resultados) {
      const c = compararCustos(r.guloso, r.exaustiva);
      expect(c, `semente ${r.semente}`).toBeGreaterThanOrEqual(0);
      if (c > 0) divergencias[r.semente] = criterioDaPerda(r.guloso, r.exaustiva);
    }
    expect(divergencias).toEqual(DIVERGENCIAS);
    for (const r of resultados) {
      expect(r.guloso.foraDoVerde - r.exaustiva.foraDoVerde, `semente ${r.semente}`).toBeLessThanOrEqual(1);
    }
  });

  it('sem teto de apoios, nunca deixa mais setores fora do verde que a busca exaustiva', () => {
    for (const r of resultados) {
      expect(r.semTeto.foraDoVerde, `semente ${r.semente}`).toBeLessThanOrEqual(r.exaustiva.foraDoVerde);
    }
  });
});
