/**
 * Contas de cor para validar a paleta: contraste WCAG 2.x, simulação de daltonismo e distância perceptual.
 *
 * - Contraste: luminância relativa do WCAG 2.2 (sRGB linearizado).
 * - Daltonismo: matrizes de Machado, Oliveira e Fernandes (2009) com severidade 1,0, aplicadas em sRGB linear.
 * - Distância: euclidiana no OKLab (Ottosson, 2020). Uma diferença de 0,02 já é perceptível; o tema exige 0,15
 *   entre as cores do semáforo.
 */

export type Visao = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const VISOES: readonly Visao[] = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];

type Matriz = readonly [readonly number[], readonly number[], readonly number[]];
type Rgb = readonly [number, number, number];

const MATRIZES: Record<Exclude<Visao, 'normal'>, Matriz> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const FORMATO = /^#[0-9a-f]{6}$/i;

function lerHex(cor: string): Rgb {
  if (!FORMATO.test(cor)) throw new RangeError(`cor fora do formato #rrggbb: ${cor}`);
  return [1, 3, 5].map((i) => Number.parseInt(cor.slice(i, i + 2), 16) / 255) as unknown as Rgb;
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gama = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const limitar = (c: number) => Math.min(1, Math.max(0, c));

function paraLinear(cor: string): Rgb {
  const [r, g, b] = lerHex(cor);
  return [linear(r), linear(g), linear(b)];
}

function paraHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) =>
      Math.round(limitar(gama(c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function luminancia(cor: string): number {
  const [r, g, b] = paraLinear(cor);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores, de 1 a 21. */
export function contraste(a: string, b: string): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (maior + 0.05) / (menor + 0.05);
}

/** Como a cor aparece para quem tem a deficiência indicada, em `#rrggbb`. */
export function simularVisao(cor: string, visao: Visao): string {
  if (visao === 'normal') {
    lerHex(cor);
    return cor;
  }
  const [r, g, b] = paraLinear(cor);
  const m = MATRIZES[visao];
  const aplicar = (linha: readonly number[]) => limitar(linha[0]! * r + linha[1]! * g + linha[2]! * b);
  return paraHex([aplicar(m[0]), aplicar(m[1]), aplicar(m[2])]);
}

function oklab(cor: string): Rgb {
  const [r, g, b] = paraLinear(cor);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Distância euclidiana entre duas cores no OKLab. */
export function distanciaPerceptual(a: string, b: string): number {
  const [la, aa, ba] = oklab(a);
  const [lb, ab, bb] = oklab(b);
  return Math.hypot(la - lb, aa - ab, ba - bb);
}
