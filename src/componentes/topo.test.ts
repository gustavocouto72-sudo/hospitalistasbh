import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { textos } from '@/textos';
import { Pagina } from './Pagina';
import { QuadroPadrao } from './QuadroPadrao';
import { Topo } from './Topo';
import { QUADROS_PADRAO } from '@/config/quadros';

const nada = () => undefined;
const quinta = new Date(2026, 10, 12, 8);

const marcado = (html: string, valor: string) =>
  new RegExp(`<input[^>]*value="${valor}"[^>]*checked=""|<input[^>]*checked=""[^>]*value="${valor}"`).test(html);

describe('Topo', () => {
  it('mostra título, data por extenso e o seletor com os dois tipos', () => {
    const html = renderToStaticMarkup(createElement(Topo, { hoje: quinta, tipoDia: 'semana', aoEscolher: nada }));
    expect(html).toContain(`<h1`);
    expect(html).toContain(textos.app.titulo);
    expect(html).toContain('Quinta-feira, 12 de novembro de 2026');
    expect(html).toContain('dateTime="2026-11-12"');
    expect(html).toContain(textos.topo.tipoDia.legenda);
    expect(html).toContain(textos.topo.tipoDia.semana);
    expect(html).toContain(textos.topo.tipoDia.fimDeSemana);
  });

  it('marca o tipo recebido', () => {
    const semana = renderToStaticMarkup(createElement(Topo, { hoje: quinta, tipoDia: 'semana', aoEscolher: nada }));
    expect(marcado(semana, 'semana')).toBe(true);
    expect(marcado(semana, 'fimDeSemana')).toBe(false);
    const fim = renderToStaticMarkup(createElement(Topo, { hoje: quinta, tipoDia: 'fimDeSemana', aoEscolher: nada }));
    expect(marcado(fim, 'fimDeSemana')).toBe(true);
    expect(marcado(fim, 'semana')).toBe(false);
  });

  it('usa rádios nativos num grupo com legenda, para teclado e leitor de tela', () => {
    const html = renderToStaticMarkup(createElement(Topo, { hoje: quinta, tipoDia: 'semana', aoEscolher: nada }));
    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend');
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(new Set(html.match(/name="[^"]+"/g)).size).toBe(1);
  });
});

describe('QuadroPadrao', () => {
  it('lista os setores do quadro de semana, com a escala própria e o total de médicos', () => {
    const html = renderToStaticMarkup(createElement(QuadroPadrao, { quadro: QUADROS_PADRAO.semana }));
    for (const setor of QUADROS_PADRAO.semana.setores) expect(html).toContain(setor.nome);
    expect(html).toContain(textos.quadroPadrao.escalaPropria);
    expect(html).toContain('2,5');
    expect(html).toContain(`${textos.quadroPadrao.totalMedicos}`);
    expect(html).toMatch(/>18</);
  });

  it('lista os setores do fim de semana, com 8 médicos', () => {
    const html = renderToStaticMarkup(createElement(QuadroPadrao, { quadro: QUADROS_PADRAO.fimDeSemana }));
    expect(html).toContain('3.1 + 6.1');
    expect(html).not.toContain(textos.quadroPadrao.escalaPropria);
    expect(html).toMatch(/>8</);
  });
});

describe('Pagina no servidor', () => {
  it('não fixa o tipo de dia no HTML estático, porque o dia só é conhecido no aparelho', () => {
    const html = renderToStaticMarkup(createElement(Pagina));
    expect(html).toContain(textos.app.titulo);
    expect(marcado(html, 'semana')).toBe(false);
    expect(marcado(html, 'fimDeSemana')).toBe(false);
    expect(html).not.toContain(textos.quadroPadrao.titulo);
  });
});
