import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AMOSTRA, CABECALHO, NOMES_DOS_ARQUIVOS, gerarFixtures } from './fixtures/gerar';

const pasta = new URL('./fixtures/', import.meta.url);
const ler = (nome: string) => new Uint8Array(readFileSync(new URL(nome, pasta)));
const latin1 = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes);
const utf8 = (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
const linhas = (texto: string) => texto.split(/\r?\n/);

describe('T-02.1 — fixtures sintéticas', () => {
  it('a amostra sintética tem os 12 postos e os totais da amostra de 12/11/2026', () => {
    expect(AMOSTRA.map((p) => p.codigo)).toEqual([
      '2.1',
      '2.2',
      '2.3',
      '3.1',
      '4.1',
      '4.2',
      '4.3',
      '4.4',
      '4.5',
      '6.1',
      '6.2',
      '6.3',
    ]);
    const soma = (campo: 'hospitalistas' | 'cardioGeriatria') => AMOSTRA.reduce((t, p) => t + p[campo], 0);
    expect(soma('hospitalistas')).toBe(180);
    expect(soma('cardioGeriatria')).toBe(35);
    for (const codigo of ['2.3', '4.1']) {
      const posto = AMOSTRA.find((p) => p.codigo === codigo);
      expect(posto).toMatchObject({ hospitalistas: 0, cardioGeriatria: 0, potenciaisAdmissoes: 0 });
    }
    for (const posto of AMOSTRA) {
      expect(posto.potenciaisAdmissoes).toBeLessThanOrEqual(posto.hospitalistas);
      const [andar, numero] = posto.codigo.split('.');
      expect(posto.nomeOriginal).toBe(`Unidade de Internação Posto ${numero} - ${andar}º PAV`);
    }
  });

  it('os arquivos em disco são exatamente os gerados pelo script', () => {
    const gerados = gerarFixtures();
    expect(Object.keys(gerados).sort()).toEqual([...NOMES_DOS_ARQUIVOS].sort());
    const emDisco = readdirSync(pasta).filter((nome) => !nome.endsWith('.ts'));
    expect(emDisco.sort()).toEqual([...NOMES_DOS_ARQUIVOS].sort());
    for (const [nome, bytes] of Object.entries(gerados)) {
      expect(Buffer.from(ler(nome)).equals(Buffer.from(bytes)), nome).toBe(true);
    }
  });

  describe('relatorio-9998-latin1.xls', () => {
    const bytes = ler('relatorio-9998-latin1.xls');
    const texto = latin1(bytes);

    it('é texto tabulado em ISO-8859-1, sem BOM e sem ser UTF-8 válido', () => {
      expect(bytes[0]).not.toBe(0xef);
      expect(() => utf8(bytes)).toThrow();
      expect(bytes.includes(0xe7)).toBe(true); // ç em Latin-1
      expect(bytes.includes(0xba)).toBe(true); // º em Latin-1
    });

    it('tem o cabeçalho do relatório, uma linha por posto e a linha Total', () => {
      const [cabecalho, ...resto] = linhas(texto).filter((l) => l !== '');
      expect(cabecalho?.split('\t')).toEqual(CABECALHO);
      expect(resto).toHaveLength(13);
      expect(resto.at(-1)?.split('\t').slice(0, 4)).toEqual(['Total', '180', '35', '15']);
      for (const [i, posto] of AMOSTRA.entries()) {
        const colunas = resto[i]?.split('\t') ?? [];
        expect(colunas).toHaveLength(CABECALHO.length);
        expect(colunas.slice(0, 4)).toEqual([
          posto.nomeOriginal,
          String(posto.hospitalistas),
          String(posto.cardioGeriatria),
          String(posto.potenciaisAdmissoes),
        ]);
      }
    });

    it('usa vírgula decimal, inclusive sem o zero à esquerda', () => {
      expect(texto).toMatch(/\t,5(\t|\r?\n)/);
      expect(texto).toMatch(/\t\d+,\d+(\t|\r?\n)/);
      expect(texto).not.toMatch(/\d\.\d/);
    });
  });

  it('a variante UTF-8 com BOM tem o mesmo conteúdo da Latin-1', () => {
    const bytes = ler('relatorio-9998-utf8-bom.xls');
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(utf8(bytes.slice(3))).toBe(latin1(ler('relatorio-9998-latin1.xls')));
  });

  it('o CSV com ; tem o mesmo conteúdo, trocando só o separador', () => {
    const csv = latin1(ler('relatorio-9998-ponto-e-virgula.csv'));
    expect(csv).not.toContain('\t');
    expect(csv.replaceAll(';', '\t')).toBe(latin1(ler('relatorio-9998-latin1.xls')));
  });

  it('o CSV com , põe entre aspas os números com vírgula decimal', () => {
    const csv = utf8(ler('relatorio-9998-virgula.csv'));
    expect(linhas(csv)[0]).toBe(CABECALHO.join(','));
    expect(csv).toContain(`${AMOSTRA[0]?.nomeOriginal},14,3,2,`);
    expect(csv).toMatch(/,",5"(,|\r?\n)/);
  });

  it('o .xlsx é um zip OOXML com a planilha da amostra', () => {
    const bytes = ler('relatorio-9998.xlsx');
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const conteudo = new TextDecoder('utf-8').decode(bytes);
    for (const parte of [
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/worksheets/sheet1.xml',
    ]) {
      expect(conteudo).toContain(parte);
    }
    expect(conteudo).toContain('<t>Unidade de Internação Posto 2 - 4º PAV</t>');
    expect(conteudo).toContain('<t>Qt potenciais admissoes</t>');
    expect(conteudo).toContain('<v>180</v>');
    expect(conteudo).toContain('<v>0.5</v>');
  });

  describe('casos de borda', () => {
    const texto = (nome: string) => latin1(ler(nome));

    it('vazio e só cabeçalho', () => {
      expect(ler('borda-vazio.xls')).toHaveLength(0);
      expect(linhas(texto('borda-so-cabecalho.xls')).filter((l) => l !== '')).toEqual([CABECALHO.join('\t')]);
    });

    it('coluna obrigatória ausente: falta Qt cardio geriatria', () => {
      const cabecalho = linhas(texto('borda-coluna-ausente.xls'))[0]?.split('\t');
      expect(cabecalho).not.toContain('Qt cardio geriatria');
      expect(cabecalho).toContain('Qt hospitalistas');
    });

    it('posto com nome fora do padrão', () => {
      expect(texto('borda-posto-fora-do-padrao.xls')).toContain('\nUTI Adulto\t');
    });

    it('números inválidos: texto, negativo e decimal numa contagem', () => {
      const t = texto('borda-numero-invalido.xls');
      expect(t).toContain('\tdoze\t');
      expect(t).toContain('\t-3\t');
      expect(t).toMatch(/PAV\t\d+,5\t/);
    });

    it('linhas em branco no fim', () => {
      expect(texto('borda-linhas-em-branco-no-fim.xls')).toMatch(/Total[^\n]*\r\n(\t*\r\n){2,}$/);
    });

    it('posto duplicado', () => {
      const t = texto('borda-posto-duplicado.xls');
      expect(t.split('Posto 2 - 4º PAV\t')).toHaveLength(3);
    });

    it('potenciais admissões maiores que hospitalistas', () => {
      const linha = linhas(texto('borda-potenciais-maior.xls')).find((l) => l.includes('Posto 3 - 4º PAV'));
      const [, hospitalistas, , potenciais] = linha?.split('\t') ?? [];
      expect(Number(potenciais)).toBeGreaterThan(Number(hospitalistas));
    });

    it('variações do símbolo de ordinal: °, o e º quebrado pelo Latin-1', () => {
      const t = texto('borda-variacoes-ordinal.xls');
      expect(t).toContain('Posto 1 - 2° PAV');
      expect(t).toContain('Posto 2 - 2o PAV');
      expect(t).toContain('Posto 3 - 4Âº PAV');
    });
  });
});
