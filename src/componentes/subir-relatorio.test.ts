import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ResultadoLeitura } from '@/relatorio/ler';
import { textos } from '@/textos';
import { ENTRADA_INICIAL, type EstadoEntrada } from './entrada';
import { Pagina } from './Pagina';
import { SubirRelatorio } from './SubirRelatorio';

const t = textos.subir;
const nada = () => undefined;
const html = (entrada: EstadoEntrada) =>
  renderToStaticMarkup(createElement(SubirRelatorio, { entrada, aoEscolherArquivo: nada, aoPreencherAMao: nada }));

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
  erros: [
    {
      tipo: 'numero-invalido',
      linha: 4,
      posto: 'Posto 3 - 4º PAV',
      coluna: 'Qt hospitalistas',
      valor: 'abc',
      motivo: 'texto',
      mensagem: textos.leitura.erros.numeroInvalido({
        linha: 4,
        posto: 'Posto 3 - 4º PAV',
        coluna: 'Qt hospitalistas',
        valor: 'abc',
        motivo: 'texto',
      }),
    },
    { tipo: 'posto-sem-nome', linha: 5, mensagem: textos.leitura.erros.postoSemNome(5) },
  ],
};

describe('SubirRelatorio', () => {
  it('tem a área de arrastar, o botão de escolher e o seletor nativo só com os três formatos', () => {
    const pagina = html(ENTRADA_INICIAL);
    expect(pagina).toContain(t.titulo);
    expect(pagina).toContain(t.instrucao);
    expect(pagina).toContain(t.escolher);
    expect(pagina).toMatch(
      /<input[^>]*type="file"[^>]*accept=".xls,.csv,.xlsx"|accept=".xls,.csv,.xlsx"[^>]*type="file"/,
    );
    expect(pagina).toContain(escapar(t.formatos));
  });

  it('mostra a frase de privacidade', () => {
    expect(html(ENTRADA_INICIAL)).toContain(t.privacidade);
  });

  it('oferece "Preencher à mão" como botão', () => {
    expect(html(ENTRADA_INICIAL)).toMatch(new RegExp(`<button[^>]*type="button"[^>]*>[^<]*${t.preencherAMao}`));
  });

  it('não mostra resumo nem mensagens antes de subir', () => {
    const pagina = html(ENTRADA_INICIAL);
    expect(pagina).not.toContain(t.mensagens.ajudaErros);
    expect(pagina).not.toContain(t.mensagens.ajudaAvisos);
  });

  it('lista erros e avisos em linguagem simples, com a linha afetada', () => {
    const pagina = html({ fonte: { tipo: 'relatorio', nome: 'relatorio.xls', leitura }, envio: null });
    expect(pagina).toContain(escapar(t.resumo.lido({ nome: 'relatorio.xls', postos: 1 })));
    expect(pagina).toContain(t.mensagens.erros(2));
    expect(pagina).toContain(t.mensagens.avisos(1));
    for (const { mensagem } of [...leitura.erros, ...leitura.avisos]) expect(pagina).toContain(escapar(mensagem));
    expect(pagina).toContain('Linha 4');
    expect(pagina).toContain('Linha 5');
    expect(pagina).toContain(t.mensagens.ajudaErros);
    expect(pagina).toContain(t.mensagens.ajudaAvisos);
    expect(pagina).toContain(t.trocar);
  });

  it('um relatório limpo mostra só o resumo', () => {
    const limpo = { ...leitura, avisos: [], erros: [] };
    const pagina = html({ fonte: { tipo: 'relatorio', nome: 'relatorio.xls', leitura: limpo }, envio: null });
    expect(pagina).toContain(escapar(t.resumo.lido({ nome: 'relatorio.xls', postos: 1 })));
    expect(pagina).not.toContain(t.mensagens.ajudaErros);
    expect(pagina).not.toContain(t.mensagens.ajudaAvisos);
  });

  it('mostra a falha como alerta, sem esconder o relatório anterior', () => {
    const mensagem = t.erros.extensao('laudo.pdf');
    const pagina = html({
      fonte: { tipo: 'relatorio', nome: 'relatorio.xls', leitura },
      envio: { tipo: 'falha', nome: 'laudo.pdf', mensagem },
    });
    expect(pagina).toMatch(
      new RegExp(`role="alert"[^>]*>[\\s\\S]*${escapar(mensagem).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
    expect(pagina).toContain(escapar(t.resumo.lido({ nome: 'relatorio.xls', postos: 1 })));
  });

  it('avisa a leitura em andamento', () => {
    const pagina = html({ fonte: { tipo: 'nenhuma' }, envio: { tipo: 'lendo', nome: 'relatorio.xls' } });
    expect(pagina).toContain(escapar(t.resumo.lendo('relatorio.xls')));
    expect(pagina).toContain('aria-busy="true"');
  });

  it('mostra o preenchimento à mão', () => {
    expect(html({ fonte: { tipo: 'manual' }, envio: null })).toContain(escapar(t.resumo.manual));
  });

  it('anuncia o resumo numa região viva para leitor de tela', () => {
    expect(html(ENTRADA_INICIAL)).toContain('aria-live="polite"');
  });
});

describe('Pagina com a área de subir', () => {
  it('já traz a área de subir e a frase de privacidade no HTML estático', () => {
    const pagina = renderToStaticMarkup(createElement(Pagina));
    expect(pagina).toContain(t.escolher);
    expect(pagina).toContain(t.privacidade);
    expect(pagina).toContain(t.preencherAMao);
  });
});
