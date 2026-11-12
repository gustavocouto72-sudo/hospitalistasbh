import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TipoDia } from '@/calculo/tipos';
import type { ResultadoLeitura } from '@/relatorio/ler';
import { textos } from '@/textos';
import { Cabecalho } from './Cabecalho';
import { ENTRADA_INICIAL, type EstadoEntrada } from './entrada';
import { painelDoDia } from './painel-dia';

const t = textos.subir;
const nada = () => undefined;
const QUINTA = new Date(2026, 10, 12, 9, 0);

function html(
  entrada: EstadoEntrada,
  extra: { tipoDia?: TipoDia | null; hoje?: Date | null; editando?: boolean } = {},
) {
  return renderToStaticMarkup(
    createElement(Cabecalho, {
      hoje: extra.hoje === undefined ? QUINTA : extra.hoje,
      tipoDia: extra.tipoDia === undefined ? 'semana' : extra.tipoDia,
      entrada,
      painel: entrada.fonte.tipo === 'nenhuma' ? null : painelDoDia([], 'semana', {}),
      editando: extra.editando ?? false,
      podeImprimir: entrada.fonte.tipo !== 'nenhuma',
      aoEscolherTipoDia: nada,
      aoEscolherArquivo: nada,
      aoPreencherAMao: nada,
      aoAlternarEdicao: nada,
    }),
  );
}

const escapar = (texto: string) =>
  renderToStaticMarkup(createElement('span', null, texto)).replace(/^<span>|<\/span>$/g, '');

const leitura: ResultadoLeitura = {
  postos: [
    { codigo: '4.2', nomeOriginal: 'Posto 2 - 4º PAV', hospitalistas: 10, cardioGeriatria: 1, potenciaisAdmissoes: 0 },
  ],
  avisos: [
    {
      tipo: 'posto-fora-do-padrao',
      linha: 3,
      posto: 'Ala X',
      mensagem: textos.leitura.avisos.postoForaDoPadrao('Ala X'),
    },
  ],
  erros: [{ tipo: 'posto-sem-nome', linha: 5, mensagem: textos.leitura.erros.postoSemNome(5) }],
};
const comRelatorio: EstadoEntrada = { fonte: { tipo: 'relatorio', nome: 'relatorio.xls', leitura }, envio: null };

describe('Cabecalho', () => {
  it('traz título, data e o seletor de tipo de dia com dois rádios', () => {
    const saida = html(ENTRADA_INICIAL);
    expect(saida).toContain(textos.app.titulo);
    expect(saida).toContain(textos.topo.data(QUINTA));
    expect(saida).toContain('<legend');
    expect(saida.match(/type="radio"/g)).toHaveLength(2);
    expect(saida).toMatch(/value="semana"[^>]*checked|checked[^>]*value="semana"/);
  });

  it('sem o dia conhecido, nenhum tipo de dia vem marcado', () => {
    const saida = html(ENTRADA_INICIAL, { tipoDia: null, hoje: null });
    expect(saida).not.toMatch(/<input[^>]*\schecked/);
  });

  it('tem o botão de escolher, o seletor nativo só com os três formatos e "Preencher à mão"', () => {
    const saida = html(ENTRADA_INICIAL);
    expect(saida).toContain(t.escolher);
    expect(saida).toMatch(
      /<input[^>]*type="file"[^>]*accept=".xls,.csv,.xlsx"|accept=".xls,.csv,.xlsx"[^>]*type="file"/,
    );
    expect(saida).toMatch(new RegExp(`<button[^>]*type="button"[^>]*>[^<]*${t.preencherAMao}`));
  });

  it('mostra a frase de privacidade', () => {
    expect(html(ENTRADA_INICIAL)).toContain(t.privacidade);
  });

  it('antes do relatório, não oferece editar nem imprimir', () => {
    const saida = html(ENTRADA_INICIAL);
    expect(saida).not.toContain(textos.planilha.editar);
    expect(saida).not.toContain(textos.imprimir.botao);
    expect(saida).not.toContain(t.mensagens.ajudaErros);
  });

  it('com relatório, oferece trocar o arquivo, editar contagens e imprimir', () => {
    const saida = html(comRelatorio);
    expect(saida).toContain(t.trocar);
    expect(saida).toContain(textos.planilha.editar);
    expect(saida).toContain('aria-pressed="false"');
    expect(saida).toContain(textos.imprimir.botao);
    expect(html(comRelatorio, { editando: true })).toContain(textos.planilha.pronto);
  });

  it('lista erros e avisos em linguagem simples, com a linha afetada', () => {
    const saida = html(comRelatorio);
    expect(saida).toContain(escapar(t.resumo.lido({ nome: 'relatorio.xls', postos: 1 })));
    expect(saida).toContain(t.mensagens.erros(1));
    expect(saida).toContain(t.mensagens.avisos(1));
    for (const { mensagem } of [...leitura.erros, ...leitura.avisos]) expect(saida).toContain(escapar(mensagem));
    expect(saida).toContain(t.mensagens.ajudaErros);
    expect(saida).toContain(t.mensagens.ajudaAvisos);
  });

  it('mostra a falha como alerta', () => {
    const mensagem = t.erros.extensao('laudo.pdf');
    const saida = html({ ...comRelatorio, envio: { tipo: 'falha', nome: 'laudo.pdf', mensagem } });
    expect(saida).toMatch(/role="alert"/);
    expect(saida).toContain(escapar(mensagem));
  });

  it('avisa a leitura em andamento numa região viva', () => {
    const saida = html({ fonte: { tipo: 'nenhuma' }, envio: { tipo: 'lendo', nome: 'relatorio.xls' } });
    expect(saida).toContain(escapar(t.resumo.lendo('relatorio.xls')));
    expect(saida).toContain('aria-busy="true"');
    expect(saida).toContain('aria-live="polite"');
  });

  it('traz a legenda das cinco cores, cada uma com o rótulo escrito', () => {
    const saida = html(ENTRADA_INICIAL);
    for (const cor of ['azulEscuro', 'azulClaro', 'verde', 'amarelo', 'vermelho'] as const) {
      expect(saida).toContain(textos.semaforo[cor]);
    }
  });
});
