// @vitest-environment jsdom
/**
 * Testes de componente da página inteira, com Testing Library: subir a fixture sintética da amostra, ler a
 * planilha, editar médicos e contagens, mexer na recomendação de apoio e imprimir.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { textos } from '@/textos';
import { Pagina } from './Pagina';

const FIXTURE = 'relatorio-9998-latin1.xls';
const bytes = readFileSync(resolve(process.cwd(), 'test/fixtures', FIXTURE));

beforeEach(() => {
  // Quinta-feira, 12/11/2026: o padrão é dia de semana. Só a data é falsa, os timers seguem reais.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 12, 9, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function subir(arquivo: File) {
  const usuario = userEvent.setup({ applyAccept: false });
  const { container } = render(createElement(Pagina));
  const seletor = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!seletor) throw new Error('sem seletor de arquivo');
  await usuario.upload(seletor, arquivo);
  return { usuario, container };
}

async function subirFixture() {
  const resultado = await subir(new File([bytes], FIXTURE, { type: 'application/vnd.ms-excel' }));
  await screen.findByText(/postos lidos\./);
  return resultado;
}

const linha = (container: HTMLElement, setor: string) => {
  const elemento = container.querySelector<HTMLElement>(`main tr[data-setor="${setor}"]`);
  if (!elemento) throw new Error(`sem linha do setor ${setor}`);
  return elemento;
};

const celula = (container: HTMLElement, setor: string, coluna: string) => {
  const elemento = linha(container, setor).querySelector<HTMLElement>(`[data-coluna="${coluna}"]`);
  if (!elemento) throw new Error(`sem coluna ${coluna} no setor ${setor}`);
  return elemento;
};

const porMedico = (container: HTMLElement, setor: string) => celula(container, setor, 'por-medico').textContent;
const comApoio = (container: HTMLElement, setor: string) =>
  celula(container, setor, 'com-apoio').querySelector('[data-valor]')?.textContent;

const itensDeApoio = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('li[data-apoio]'));

describe('Página — Testing Library', () => {
  it('antes do relatório, mostra a planilha com os médicos do dia e as contagens vazias', () => {
    const { container } = render(createElement(Pagina));
    expect(linha(container, '4.2').textContent).toContain('2,5');
    expect(porMedico(container, '4.2')).toBe('—');
    expect(screen.getByText(textos.recomendacao.semDados)).toBeTruthy();
  });

  it('sobe a fixture e mostra a planilha com a situação e a recomendação aplicada', async () => {
    const { container } = await subirFixture();
    expect(porMedico(container, '4.3')).toBe('11,5');
    expect(celula(container, '4.3', 'situacao').textContent).toBe(textos.semaforo.amarelo);
    expect(celula(container, '4.4', 'situacao').textContent).toBe(textos.semaforo.verde);
    expect(celula(container, '3.1', 'situacao').textContent).toBe(textos.semaforo.escalaPropria);
    expect(screen.getByRole('heading', { name: textos.recomendacao.titulo })).toBeTruthy();
    expect(itensDeApoio(container).length).toBeGreaterThan(0);
    // A recomendação já vale: todo setor na coluna "Com apoio" fica no verde.
    for (const setor of ['2', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3']) {
      expect(celula(container, setor, 'situacao-com-apoio').textContent).toBe(textos.semaforo.verde);
    }
    expect(screen.getByText(textos.subir.privacidade)).toBeTruthy();
  });

  it('editar médicos recalcula a linha na hora', async () => {
    const { usuario, container } = await subirFixture();
    const setor = linha(container, '4.3');
    await usuario.click(within(setor).getByRole('button', { name: textos.cartao.maisMedico('4.3') }));
    // 23 pacientes com 2,5 médicos.
    expect(porMedico(container, '4.3')).toBe('9,2');
    await usuario.click(within(setor).getByRole('button', { name: textos.cartao.menosMedico('4.3') }));
    expect(porMedico(container, '4.3')).toBe('11,5');
  });

  it('marcar residente conta meio médico na conta, sem mudar os médicos mostrados', async () => {
    const { usuario, container } = await subirFixture();
    const caixa = screen.getByRole('checkbox', { name: textos.planilha.residenteNo('4.3') });
    expect((caixa as HTMLInputElement).checked).toBe(false);
    await usuario.click(caixa);
    // 23 pacientes com 2 médicos e 1 residente = 2,5 na conta.
    expect(porMedico(container, '4.3')).toBe('9,2');
    expect(linha(container, '4.3').querySelector('output')?.textContent).toBe('2');
    expect(screen.getByText(textos.resumo.residentes)).toBeTruthy();
    const folha = container.querySelector<HTMLElement>('section[data-folha]')!;
    expect(within(folha).getByText(textos.folha.comResidente('2'))).toBeTruthy();
    await usuario.click(caixa);
    expect(porMedico(container, '4.3')).toBe('11,5');
    expect(screen.queryByText(textos.resumo.residentes)).toBeNull();
  });

  it('a escala própria não tem caixa de residente', async () => {
    await subirFixture();
    expect(screen.queryByRole('checkbox', { name: textos.planilha.residenteNo('3.1') })).toBeNull();
  });

  it('depois de importar, os pacientes de cada posto já podem ser corrigidos, com o número do relatório ao lado', async () => {
    const { usuario, container } = await subirFixture();
    const campo = screen.getByRole<HTMLInputElement>('textbox', { name: textos.cartao.campo.hospitalistas('4.3') });
    expect(campo.value).toBe('23');
    expect(linha(container, '4.3').querySelector('[data-ajustado]')).toBeNull();
    await usuario.clear(campo);
    await usuario.type(campo, '21');
    // 21 pacientes com 2 médicos, contra 172 ÷ 18 de média.
    expect(porMedico(container, '4.3')).toBe('10,5');
    expect(container.querySelector('header dl')?.textContent).toContain(`${textos.resumo.pacientes}172`);
    expect(linha(container, '4.3').querySelector('[data-ajustado]')?.textContent).toBe(textos.planilha.noRelatorio(23));
    // Voltar ao número do relatório tira a nota.
    await usuario.clear(campo);
    await usuario.type(campo, '23');
    expect(linha(container, '4.3').querySelector('[data-ajustado]')).toBeNull();
  });

  it('setor com dois postos mostra um campo por posto e a soma do setor', async () => {
    const { usuario, container } = await subirFixture();
    expect(linha(container, '2').querySelector('[data-soma]')?.textContent).toBe(textos.planilha.somaDoSetor('27'));
    const campo = screen.getByRole('textbox', { name: textos.cartao.campo.hospitalistas('2.1') });
    await usuario.clear(campo);
    await usuario.type(campo, '12');
    expect(linha(container, '2').querySelector('[data-soma]')?.textContent).toBe(textos.planilha.somaDoSetor('25'));
    expect(linha(container, '4.3').querySelector('[data-soma]')).toBeNull();
  });

  it('cardio/geri e potenciais admissões só abrem pelo botão de editar', async () => {
    const { usuario } = await subirFixture();
    const nome = { name: textos.cartao.campo.potenciaisAdmissoes('4.3') };
    expect(screen.queryByRole('textbox', nome)).toBeNull();
    await usuario.click(screen.getByRole('button', { name: textos.planilha.editar }));
    expect(screen.getByRole('textbox', nome)).toBeTruthy();
    await usuario.click(screen.getByRole('button', { name: textos.planilha.pronto }));
    expect(screen.queryByRole('textbox', nome)).toBeNull();
    expect(screen.getByRole('textbox', { name: textos.cartao.campo.hospitalistas('4.3') })).toBeTruthy();
  });

  it('remover um apoio tira a nota e devolve a carga sem apoio na coluna "Com apoio"', async () => {
    const { usuario, container } = await subirFixture();
    const [primeiro] = itensDeApoio(container);
    if (!primeiro) throw new Error('sem apoio sugerido');
    const [, para] = (primeiro.dataset.apoio ?? '').split('→') as [string, string];
    const antes = porMedico(container, para);
    expect(comApoio(container, para)).not.toBe(antes);

    await usuario.click(within(primeiro).getByRole('button', { name: /^Remover: / }));
    await waitFor(() => expect(container.querySelector(`li[data-apoio="${primeiro.dataset.apoio}"]`)).toBeNull());
    expect(comApoio(container, para)).toBe(antes);
  });

  it('mostra os pacientes com apoio: o apoiado perde os leitos, o apoiador ganha, e o total não muda', async () => {
    const { container } = await subirFixture();
    const pacientesAntes = (setor: string) =>
      Array.from(celula(container, setor, 'pacientes').querySelectorAll('input')).reduce(
        (soma, campo) => soma + Number(campo.value),
        0,
      );
    const pacientesDepois = (setor: string) =>
      Number(celula(container, setor, 'pacientes-com-apoio').querySelector('[data-valor]')?.textContent);
    const [primeiro] = itensDeApoio(container);
    if (!primeiro) throw new Error('sem apoio sugerido');
    const [de, para] = (primeiro.dataset.apoio ?? '').split('→') as [string, string];
    const leitos = pacientesAntes(para) - pacientesDepois(para);
    expect(leitos).toBeGreaterThan(0);
    expect(pacientesDepois(de)).toBeGreaterThan(pacientesAntes(de));
    const total = container.querySelector('main tfoot [data-coluna="pacientes-com-apoio"]')?.textContent;
    const totalAntes = container.querySelector('main tfoot [data-coluna="pacientes"]')?.textContent;
    expect(total).toBe(totalAntes);
  });

  it('mais um leito no apoio muda a coluna "Com apoio" do apoiado', async () => {
    const { usuario, container } = await subirFixture();
    const [primeiro] = itensDeApoio(container);
    const [, para] = (primeiro!.dataset.apoio ?? '').split('→') as [string, string];
    const antes = comApoio(container, para);
    await usuario.click(within(primeiro!).getByRole('button', { name: /^Pôr um leito: / }));
    expect(comApoio(container, para)).not.toBe(antes);
  });

  it('"Preencher à mão" zera a planilha e abre os campos', async () => {
    const usuario = userEvent.setup();
    const { container } = render(createElement(Pagina));
    await usuario.click(screen.getByRole('button', { name: textos.subir.preencherAMao }));
    expect(screen.getByText(textos.subir.resumo.manual)).toBeTruthy();
    const campo = screen.getByRole('textbox', { name: textos.cartao.campo.hospitalistas('4.4') });
    await usuario.clear(campo);
    await usuario.type(campo, '20');
    expect(porMedico(container, '4.4')).toBe('10');
  });

  it('um arquivo de outro formato vira erro legível', async () => {
    await subir(new File(['%PDF'], 'laudo.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(textos.subir.erros.extensao('laudo.pdf'))).toBeTruthy();
  });

  it('na impressão, os controles somem e a folha leva os apoios da recomendação', async () => {
    const { usuario, container } = await subirFixture();
    expect(container.querySelector('main')?.className).toMatch(/\bprint:hidden\b/);
    const folha = () => {
      const elemento = container.querySelector<HTMLElement>('section[data-folha]');
      if (!elemento) throw new Error('sem folha de impressão');
      return elemento;
    };
    expect(folha().className).toMatch(/\bhidden\b.*\bprint:flex\b/);
    expect(folha().querySelectorAll('button, input, select')).toHaveLength(0);
    const quantos = itensDeApoio(container).length;
    expect(within(folha()).getAllByRole('listitem')).toHaveLength(quantos);

    for (const item of itensDeApoio(container)) {
      await usuario.click(within(item).getByRole('button', { name: /^Remover: / }));
    }
    expect(within(folha()).getByText(textos.folha.semApoios)).toBeTruthy();
  });

  it('o botão de imprimir chama window.print() e só aparece com o relatório', async () => {
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

  it('o fim de semana troca o quadro', async () => {
    const { usuario, container } = await subirFixture();
    await usuario.click(screen.getByRole('radio', { name: textos.topo.tipoDia.fimDeSemana }));
    expect(linha(container, '4.3').querySelector('output')?.textContent).toBe('1');
    expect(container.querySelector('main tr[data-setor="3.1+6.1"]')).toBeTruthy();
  });
});

describe('Pagina no servidor', () => {
  it('não fixa o tipo de dia no HTML estático, porque o dia só é conhecido no aparelho', () => {
    const html = renderToStaticMarkup(createElement(Pagina));
    expect(html).toContain(textos.app.titulo);
    expect(html).not.toMatch(/<input[^>]*\schecked/);
    expect(html).toContain(textos.subir.escolher);
    expect(html).toContain(textos.subir.privacidade);
    expect(html).toContain(textos.subir.preencherAMao);
  });
});
