import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CORES_DO_SEMAFORO } from '@/calculo/semaforo';
import { cores, nomeDoToken, semaforo, tipografia } from './tokens';
import { VISOES, contraste, distanciaPerceptual, simularVisao } from './visao';

const raiz = new URL('../../', import.meta.url);
const css = readFileSync(new URL('src/app/globals.css', raiz), 'utf8');
const design = readFileSync(new URL('DESIGN.md', raiz), 'utf8');

/** Distância mínima em OKLab entre duas cores do semáforo, em qualquer visão simulada. */
const DISTANCIA_MINIMA = 0.15;

describe('visao: contas de cor', () => {
  it('calcula o contraste WCAG nos extremos', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('a visão normal não muda a cor e as simulações preservam o cinza', () => {
    expect(simularVisao('#1d3f8f', 'normal')).toBe('#1d3f8f');
    for (const visao of VISOES)
      expect(distanciaPerceptual(simularVisao('#808080', visao), '#808080')).toBeLessThan(0.01);
  });

  it('a deuteranopia aproxima vermelho e verde de mesma luminosidade', () => {
    const normal = distanciaPerceptual('#b3261e', '#2e8540');
    const deuteranopia = distanciaPerceptual(
      simularVisao('#b3261e', 'deuteranopia'),
      simularVisao('#2e8540', 'deuteranopia'),
    );
    expect(deuteranopia).toBeLessThan(normal / 3);
  });

  it('recusa cor fora do formato #rrggbb', () => {
    expect(() => contraste('azul', '#ffffff')).toThrow(RangeError);
  });
});

describe('semáforo: cinco cores validadas', () => {
  it('tem exatamente as cinco cores do cálculo, na mesma ordem', () => {
    expect(Object.keys(semaforo)).toEqual([...CORES_DO_SEMAFORO]);
  });

  it.each(CORES_DO_SEMAFORO)('%s: texto sobre o fundo com contraste AA (4,5:1)', (cor) => {
    expect(contraste(semaforo[cor].texto, semaforo[cor].fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CORES_DO_SEMAFORO)('%s: traço sobre o papel e sobre a página com contraste AA', (cor) => {
    expect(contraste(semaforo[cor].traco, cores.papel)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(semaforo[cor].traco, cores.pagina)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(VISOES)('as cinco cores continuam distintas na visão %s', (visao) => {
    for (const [i, a] of CORES_DO_SEMAFORO.entries()) {
      for (const b of CORES_DO_SEMAFORO.slice(i + 1)) {
        const distancia = distanciaPerceptual(
          simularVisao(semaforo[a].fundo, visao),
          simularVisao(semaforo[b].fundo, visao),
        );
        expect(distancia, `${a} × ${b}`).toBeGreaterThanOrEqual(DISTANCIA_MINIMA);
      }
    }
  });
});

describe('neutros e papéis de interface', () => {
  it('texto principal e secundário passam AA no papel e na página', () => {
    for (const fundo of [cores.papel, cores.pagina]) {
      expect(contraste(cores.tinta, fundo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(cores.tintaSuave, fundo)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ação, foco e linha forte passam 3:1 de contraste não textual', () => {
    expect(contraste(cores.acaoTexto, cores.acao)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(cores.foco, cores.papel)).toBeGreaterThanOrEqual(3);
    expect(contraste(cores.foco, cores.pagina)).toBeGreaterThanOrEqual(3);
    expect(contraste(cores.linhaForte, cores.papel)).toBeGreaterThanOrEqual(3);
  });

  it('o destaque das admissões passa AA sobre o próprio fundo', () => {
    expect(contraste(cores.admissao, cores.admissaoFundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('a escala de tipo tem passos fixos em rem, crescentes', () => {
    const tamanhos = Object.values(tipografia.tamanhos).map((t) => Number.parseFloat(t));
    expect(tamanhos).toEqual([...tamanhos].sort((a, b) => a - b));
    for (const t of Object.values(tipografia.tamanhos)) expect(t).toMatch(/^\d+(\.\d+)?rem$/);
  });
});

describe('tokens sincronizados com o CSS e o DESIGN.md', () => {
  const todos: [string, string][] = [
    ...Object.entries(cores).map(([nome, valor]): [string, string] => [nomeDoToken(nome), valor]),
    ...CORES_DO_SEMAFORO.flatMap((cor) =>
      (['fundo', 'texto', 'traco'] as const).map((papel): [string, string] => [
        nomeDoToken(`semaforo-${cor}-${papel}`),
        semaforo[cor][papel],
      ]),
    ),
  ];

  it.each(todos)('globals.css declara --color-%s: %s', (token, valor) => {
    expect(css.toLowerCase()).toContain(`--color-${token}: ${valor.toLowerCase()};`);
  });

  it('o DESIGN.md registra as cinco cores do semáforo', () => {
    for (const cor of CORES_DO_SEMAFORO) expect(design.toLowerCase()).toContain(semaforo[cor].fundo.toLowerCase());
  });
});
