// @vitest-environment jsdom
/**
 * Testes de componente da página inteira (SPEC-05, "Testes esperados"), com Testing Library: subir a fixture
 * sintética da amostra, editar médicos, aceitar e remover um apoio e alternar Antes/Depois.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { textos } from '@/textos';
import { Pagina } from './Pagina';

const FIXTURE = 'relatorio-9998-latin1.xls';
const bytes = readFileSync(resolve(process.cwd(), 'test/fixtures', FIXTURE));
const t = textos.apoio.lista;

beforeEach(() => {
  // Quinta-feira, 12/11/2026: o padrão é dia de semana. Só a data é falsa, os timers seguem reais.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 12, 9, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function subirFixture() {
  const usuario = userEvent.setup();
  const { container } = render(createElement(Pagina));
  const seletor = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!seletor) throw new Error('sem seletor de arquivo');
  await usuario.upload(seletor, new File([bytes], FIXTURE, { type: 'application/vnd.ms-excel' }));
  await screen.findByText(/postos lidos\./);
  return { usuario, container };
}

const cartao = (container: HTMLElement, setor: string) => {
  const elemento = container.querySelector<HTMLElement>(`article[data-setor="${setor}"]`);
  if (!elemento) throw new Error(`sem cartão do setor ${setor}`);
  return elemento;
};

const porMedico = (elemento: HTMLElement) =>
  within(elemento).getByText(textos.cartao.porMedico).previousSibling?.textContent;

const itensDeApoio = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('li[data-apoio]'));

describe('Página — Testing Library', () => {
  it('sobe a fixture e mostra os cartões, o resumo e a sugestão de apoio', async () => {
    const { container } = await subirFixture();
    expect(screen.getByRole('heading', { name: textos.resumo.titulo })).toBeTruthy();
    expect(screen.getByRole('heading', { name: t.titulo })).toBeTruthy();
    expect(porMedico(cartao(container, '4.3'))).toBe('11,5');
    expect(within(cartao(container, '4.3')).getByText(textos.semaforo.amarelo)).toBeTruthy();
    expect(itensDeApoio(container).length).toBeGreaterThan(0);
    expect(screen.getByText(textos.subir.privacidade)).toBeTruthy();
  });

  it('editar médicos recalcula o cartão na hora', async () => {
    const { usuario, container } = await subirFixture();
    const setor = cartao(container, '4.3');
    await usuario.click(within(setor).getByRole('button', { name: textos.cartao.maisMedico('4.3') }));
    // 23 pacientes com 2,5 médicos.
    expect(within(setor).getByText('2,5')).toBeTruthy();
    expect(porMedico(cartao(container, '4.3'))).toBe('9,2');
    await usuario.click(within(setor).getByRole('button', { name: textos.cartao.menosMedico('4.3') }));
    expect(porMedico(cartao(container, '4.3'))).toBe('11,5');
  });

  it('aceita e remove um apoio, e o Antes/Depois troca os números dos cartões', async () => {
    const { usuario, container } = await subirFixture();
    const [primeiro] = itensDeApoio(container);
    if (!primeiro) throw new Error('sem apoio sugerido');
    const [de, para] = (primeiro.dataset.apoio ?? '').split('→') as [string, string];
    const antes = porMedico(cartao(container, para));

    await usuario.click(within(primeiro).getByRole('button', { name: /^Aceitar: / }));
    expect(within(itensDeApoio(container)[0]!).getByText(t.aceito)).toBeTruthy();

    await usuario.click(screen.getByRole('radio', { name: t.vista.depois }));
    expect(screen.getByText(t.vista.notaDepois(1), { selector: 'p[aria-live]' })).toBeTruthy();
    expect(porMedico(cartao(container, para))).not.toBe(antes);
    expect(within(cartao(container, de)).getByText(new RegExp(`^Apoia .* do ${para}\\.$`))).toBeTruthy();

    await usuario.click(screen.getByRole('radio', { name: t.vista.antes }));
    expect(porMedico(cartao(container, para))).toBe(antes);

    await usuario.click(screen.getByRole('radio', { name: t.vista.depois }));
    const aceito = container.querySelector<HTMLElement>(`li[data-apoio="${de}→${para}"]`)!;
    await usuario.click(within(aceito).getByRole('button', { name: /^Remover: / }));
    await waitFor(() => expect(container.querySelector(`li[data-apoio="${de}→${para}"]`)).toBeNull());
    expect(porMedico(cartao(container, para))).toBe(antes);
  });

  it('na impressão, os controles somem e a folha aparece só com os apoios aceitos', async () => {
    const { usuario, container } = await subirFixture();
    const controles = container.querySelector('main');
    expect(controles?.className).toMatch(/\bprint:hidden\b/);
    const folha = () => {
      const elemento = container.querySelector<HTMLElement>('section[data-folha]');
      if (!elemento) throw new Error('sem folha de impressão');
      return elemento;
    };
    expect(folha().className).toMatch(/\bhidden\b.*\bprint:flex\b/);
    expect(within(folha()).getByText(textos.folha.semApoios)).toBeTruthy();
    expect(folha().querySelectorAll('button, input, select')).toHaveLength(0);

    const [primeiro] = itensDeApoio(container);
    await usuario.click(within(primeiro!).getByRole('button', { name: /^Aceitar: / }));
    expect(within(folha()).queryByText(textos.folha.semApoios)).toBeNull();
    expect(within(folha()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('o botão de imprimir chama window.print() e só aparece com o quadro do dia', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    try {
      const vazio = render(createElement(Pagina));
      expect(screen.queryByRole('button', { name: textos.imprimir.botao })).toBeNull();
      vazio.unmount();

      const { usuario } = await subirFixture();
      const botao = screen.getByRole('button', { name: textos.imprimir.botao });
      expect(botao.closest('main')?.className).toMatch(/\bprint:hidden\b/);
      await usuario.click(botao);
      expect(imprimir).toHaveBeenCalledTimes(1);
    } finally {
      imprimir.mockRestore();
    }
  });

  it('o fim de semana troca o quadro e zera os apoios', async () => {
    const { usuario, container } = await subirFixture();
    await usuario.click(screen.getByRole('radio', { name: textos.topo.tipoDia.fimDeSemana }));
    expect(within(cartao(container, '4.3')).getByText('1')).toBeTruthy();
    expect(screen.getByText(t.vista.notaAntes, { selector: 'p[aria-live]' })).toBeTruthy();
  });
});
