import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContagemDoPosto } from '@/calculo/tipos';
import { textos } from '@/textos';
import { QuadroSetores } from './QuadroSetores';
import { ResumoDia } from './ResumoDia';
import { painelDoDia } from './painel-dia';

const nada = () => undefined;
const posto = (codigo: string, hospitalistas: number, cardioGeriatria = 0, potenciaisAdmissoes = 0) => ({
  codigo,
  hospitalistas,
  cardioGeriatria,
  potenciaisAdmissoes,
});

const POSTOS: readonly ContagemDoPosto[] = [
  posto('2.1', 10, 1),
  posto('2.2', 8),
  posto('3.1', 12, 0, 1),
  posto('4.1', 5),
  posto('4.2', 9),
  posto('4.3', 30, 2, 3),
  posto('4.4', 14),
  posto('4.5', 6),
  posto('6.1', 9),
  posto('6.2', 15),
  posto('6.3', 14),
  posto('2.3', 0),
  posto('5.1', 0),
];

function quadro(postos = POSTOS, tipoDia: 'semana' | 'fimDeSemana' = 'semana', ajustes = {}) {
  const painel = painelDoDia(postos, tipoDia, ajustes);
  return renderToStaticMarkup(
    createElement(QuadroSetores, {
      painel,
      postos,
      ajustes,
      fonte: 'relatorio',
      aoAjustarMedicos: nada,
      aoAjustarContagem: nada,
    }),
  );
}

const cartao = (html: string, nome: string) => {
  const inicio = html.indexOf(`data-setor="${nome}"`);
  if (inicio < 0) throw new Error(`cartão ${nome} ausente`);
  const fim = html.indexOf('data-setor="', inicio + 1);
  return html.slice(inicio, fim < 0 ? undefined : fim);
};

describe('QuadroSetores', () => {
  it('mostra um cartão por setor, com nome e postos', () => {
    const html = quadro();
    expect(html).toContain(textos.cartao.titulo);
    expect(cartao(html, '2')).toContain('2º andar');
    expect(cartao(html, '2')).toContain('2.1 + 2.2');
    expect(cartao(html, '4.2')).toContain('4.2 + 4.1');
  });

  it('mostra pacientes por médico em destaque, diferença para a média, cor e rótulo', () => {
    const c = cartao(quadro(), '4.3');
    expect(c).toContain('>15<');
    expect(c).toContain('+8,3');
    expect(c).toContain(textos.semaforo.vermelho);
    expect(c).toContain('bg-semaforo-vermelho-fundo');
    const folgado = cartao(quadro(), '4.5');
    expect(folgado).toContain('−3,7');
    expect(folgado).toContain(textos.semaforo.azulEscuro);
    expect(folgado).toContain('bg-semaforo-azul-escuro-fundo');
  });

  it('tem botões − e + com rótulo ARIA e o valor em passos de 0,5', () => {
    const c = cartao(quadro(), '4.2');
    expect(c).toContain(`aria-label="${textos.cartao.menosMedico('4.2')}"`);
    expect(c).toContain(`aria-label="${textos.cartao.maisMedico('4.2')}"`);
    expect(c).toContain('2,5');
  });

  it('desabilita o − quando o setor está sem médico', () => {
    const c = cartao(quadro(POSTOS, 'semana', { medicos: { '4.4': 0 } }), '4.4');
    expect(c).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*aria-label="${textos.cartao.menosMedico('4.4')}"`));
    expect(c).toContain(textos.semaforo.semMedico);
    expect(c).toContain('bg-semaforo-vermelho-fundo');
  });

  it('as contagens de cada posto são campos editáveis, com as potenciais admissões em destaque', () => {
    const c = cartao(quadro(), '4.2');
    for (const p of ['4.2', '4.1']) {
      expect(c).toContain(`aria-label="${textos.cartao.campo.hospitalistas(p)}"`);
      expect(c).toContain(`aria-label="${textos.cartao.campo.cardioGeriatria(p)}"`);
      expect(c).toContain(`aria-label="${textos.cartao.campo.potenciaisAdmissoes(p)}"`);
    }
    expect(c).toContain('inputMode="numeric"');
    const c43 = cartao(quadro(), '4.3');
    expect(c43).toMatch(/value="30"/);
    expect(c43).toContain('text-admissao');
  });

  it('mostra o 3.1 da semana como cartão discreto de escala própria, sem semáforo nem médicos', () => {
    const c = cartao(quadro(), '3.1');
    expect(c).toContain(textos.semaforo.escalaPropria);
    expect(c).toContain('border-dashed');
    expect(c).not.toContain('bg-semaforo-');
    expect(c).not.toContain(textos.cartao.menosMedico('3.1'));
    expect(c).toContain(`aria-label="${textos.cartao.campo.hospitalistas('3.1')}"`);
  });

  it('no fim de semana o 3.1 entra calculado junto com o 6.1', () => {
    const html = quadro(POSTOS, 'fimDeSemana');
    expect(html).not.toContain(textos.semaforo.escalaPropria);
    expect(cartao(html, '3.1+6.1')).toContain('bg-semaforo-');
  });

  it('põe os postos ocultos numa linha recolhível', () => {
    const html = quadro();
    expect(html).toContain('<details');
    expect(html).toContain(textos.cartao.ocultos.resumo(2));
    expect(html).toContain('2.3');
    expect(html).toContain('5.1');
    expect(quadro(POSTOS.filter((p) => p.hospitalistas > 0))).not.toContain('<details');
  });
});

describe('ResumoDia', () => {
  it('mostra média, total de médicos, total de pacientes e quantos setores em cada cor', () => {
    const html = renderToStaticMarkup(createElement(ResumoDia, { painel: painelDoDia(POSTOS, 'semana', {}) }));
    expect(html).toContain(textos.resumo.titulo);
    expect(html).toContain(textos.resumo.media);
    expect(html).toContain('6,7');
    expect(html).toContain(textos.resumo.medicos);
    expect(html).toContain('>18<');
    expect(html).toContain(textos.resumo.pacientes);
    expect(html).toContain('>120<');
    for (const cor of ['azulEscuro', 'azulClaro', 'verde', 'amarelo', 'vermelho'] as const) {
      expect(html).toContain(textos.semaforo[cor]);
    }
  });

  it('avisa quando não há média do dia', () => {
    const ajustes = {
      medicos: Object.fromEntries(['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'].map((id) => [id, 0])),
    };
    const html = renderToStaticMarkup(createElement(ResumoDia, { painel: painelDoDia(POSTOS, 'semana', ajustes) }));
    expect(html).toContain(textos.painel.avisos.mediaIndefinida);
  });
});
