import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodificarRelatorio, decodificarTexto, detectarFormato, dividirLinhas } from './decodificar';

const pasta = new URL('../../test/fixtures/', import.meta.url);
const ler = (nome: string): ArrayBuffer => {
  const bytes = readFileSync(new URL(nome, pasta));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};
const deTexto = (texto: string) => new TextEncoder().encode(texto);
const latin1 = (texto: string) => Uint8Array.from(texto, (c) => c.charCodeAt(0));

const CABECALHO = [
  'Ds posto',
  'Qt hospitalistas',
  'Qt cardio geriatria',
  'Qt potenciais admissoes',
  'Qt pac medico semana',
  'Qt pac medico fim semana',
  'Fator dia semana',
  'Fator fim semana',
];
const PRIMEIRA = ['Unidade de Internação Posto 1 - 2º PAV', '14', '3', '2', '9,33', '28', '1,5', ',5'];
const TOTAL = ['Total', '180', '35', '15', '8,57', '18', '21', '10'];

describe('T-02.2 — detecção de formato pelo conteúdo', () => {
  it('reconhece xlsx pela assinatura ZIP, qualquer que seja a extensão', () => {
    expect(detectarFormato(new Uint8Array(ler('relatorio-9998.xlsx')))).toEqual({ formato: 'xlsx' });
  });

  it('reconhece o texto tabulado, que o TASY salva como .xls', () => {
    expect(detectarFormato(new Uint8Array(ler('relatorio-9998-latin1.xls')))).toEqual({
      formato: 'tabulado',
      separador: '\t',
    });
    expect(detectarFormato(new Uint8Array(ler('relatorio-9998-utf8-bom.xls')))).toMatchObject({
      formato: 'tabulado',
    });
  });

  it('reconhece CSV com ponto e vírgula e com vírgula', () => {
    expect(detectarFormato(new Uint8Array(ler('relatorio-9998-ponto-e-virgula.csv')))).toEqual({
      formato: 'csv',
      separador: ';',
    });
    expect(detectarFormato(new Uint8Array(ler('relatorio-9998-virgula.csv')))).toEqual({
      formato: 'csv',
      separador: ',',
    });
  });

  it('não se deixa enganar pela vírgula decimal entre aspas no CSV com ;', () => {
    const texto = 'Ds posto;Qt hospitalistas\n"Posto 1 - 2º PAV, ala A";"1,5"\n';
    expect(detectarFormato(deTexto(texto))).toEqual({ formato: 'csv', separador: ';' });
  });

  it('a extensão do nome não muda nada: tabulado salvo como .csv continua tabulado', () => {
    const resultado = decodificarRelatorio(ler('relatorio-9998-latin1.xls'), 'relatorio.csv');
    expect(resultado).toMatchObject({ formato: 'tabulado' });
  });

  it('arquivo vazio, ou só com espaços, é vazio', () => {
    expect(detectarFormato(new Uint8Array())).toEqual({ formato: 'vazio' });
    expect(detectarFormato(deTexto('\n\r\n  \n'))).toEqual({ formato: 'vazio' });
    expect(detectarFormato(new Uint8Array([0xef, 0xbb, 0xbf]))).toEqual({ formato: 'vazio' });
  });

  it('texto de uma coluna só, sem separador, cai no tabulado', () => {
    expect(detectarFormato(deTexto('Ds posto\n'))).toEqual({ formato: 'tabulado', separador: '\t' });
  });
});

describe('T-02.2 — decodificação do texto', () => {
  it('Latin-1 é o padrão: acentos corretos sem BOM', () => {
    expect(decodificarTexto(latin1('Internação 2º PAV'))).toBe('Internação 2º PAV');
  });

  it('com BOM e UTF-8 válido, usa UTF-8 e remove o BOM', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...deTexto('Internação 2º PAV')]);
    expect(decodificarTexto(bytes)).toBe('Internação 2º PAV');
  });

  it('sem BOM, UTF-8 válido com acentos é lido como UTF-8 (CSV salvo por planilha)', () => {
    expect(decodificarTexto(deTexto('Internação 2º PAV'))).toBe('Internação 2º PAV');
  });

  it('sem BOM, Latin-1 com bytes que não formam UTF-8 válido continua Latin-1', () => {
    expect(decodificarTexto(latin1('Ã§ ção'))).toBe('Ã§ ção');
  });

  it('texto só ASCII sai igual nos dois caminhos', () => {
    expect(decodificarTexto(deTexto('Ds posto\tTotal'))).toBe('Ds posto\tTotal');
  });

  it('com BOM mas UTF-8 inválido, descarta o BOM e volta para Latin-1 sem quebrar', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...latin1('Internação')]);
    expect(decodificarTexto(bytes)).toBe('Internação');
  });
});

describe('T-02.2 — divisão em linhas e células', () => {
  it('tabulado: separa por tab, aceita CRLF e descarta linhas em branco', () => {
    expect(dividirLinhas('a\tb\r\n\r\nc\td\n\n  \n', '\t')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('CSV: respeita aspas, aspas dobradas e separador dentro das aspas', () => {
    expect(dividirLinhas('a,"1,5","diz ""oi""",,b\n', ',')).toEqual([['a', '1,5', 'diz "oi"', '', 'b']]);
  });

  it('remove espaços nas pontas das células', () => {
    expect(dividirLinhas(' a ; b \n', ';')).toEqual([['a', 'b']]);
  });
});

describe('T-02.2 — decodificarRelatorio com as fixtures', () => {
  for (const nome of [
    'relatorio-9998-latin1.xls',
    'relatorio-9998-utf8-bom.xls',
    'relatorio-9998-ponto-e-virgula.csv',
    'relatorio-9998-virgula.csv',
  ]) {
    it(`${nome}: cabeçalho, 12 postos e Total com acentos corretos`, () => {
      const resultado = decodificarRelatorio(ler(nome), nome);
      if (resultado.formato === 'xlsx' || resultado.formato === 'vazio') throw new Error(resultado.formato);
      expect(resultado.linhas).toHaveLength(14);
      expect(resultado.linhas[0]).toEqual(CABECALHO);
      expect(resultado.linhas[1]).toEqual(PRIMEIRA);
      expect(resultado.linhas[13]).toEqual(TOTAL);
    });
  }

  it('xlsx: devolve os bytes para a leitura sob demanda, sem decodificar', () => {
    const arquivo = ler('relatorio-9998.xlsx');
    const resultado = decodificarRelatorio(arquivo, 'relatorio-9998.xlsx');
    expect(resultado.formato).toBe('xlsx');
    if (resultado.formato !== 'xlsx') return;
    expect(resultado.bytes.byteLength).toBe(arquivo.byteLength);
  });

  it('linhas em branco no fim são ignoradas', () => {
    const resultado = decodificarRelatorio(ler('borda-linhas-em-branco-no-fim.xls'), 'x.xls');
    if (resultado.formato !== 'tabulado') throw new Error(resultado.formato);
    expect(resultado.linhas.every((linha) => linha.some((celula) => celula !== ''))).toBe(true);
  });

  it('arquivo vazio é reconhecido como vazio', () => {
    expect(decodificarRelatorio(ler('borda-vazio.xls'), 'borda-vazio.xls')).toEqual({ formato: 'vazio' });
  });
});
