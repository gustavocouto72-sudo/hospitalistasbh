/**
 * Gera as fixtures sintéticas do relatório 9998 do TASY (SPEC-02).
 *
 * Os números são inventados: respeitam o formato e os totais da amostra de 12/11/2026 (12 postos,
 * 2.3 e 4.1 zerados, 180 pacientes dos hospitalistas e 35 da cardiologia e geriatria) e os fatores
 * que o relatório entregou (PRD, Anexo A). Nenhum nome de pessoa entra aqui.
 *
 * Para regravar os arquivos: `node test/fixtures/gerar.ts`. O teste `test/fixtures.test.ts` falha se
 * os arquivos em disco divergirem do que este script gera.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

export type PostoDaAmostra = {
  codigo: string;
  nomeOriginal: string;
  hospitalistas: number;
  cardioGeriatria: number;
  potenciaisAdmissoes: number;
  fatorSemana: number;
  fatorFimDeSemana: number;
};

export const CABECALHO = [
  'Ds posto',
  'Qt hospitalistas',
  'Qt cardio geriatria',
  'Qt potenciais admissoes',
  'Qt pac medico semana',
  'Qt pac medico fim semana',
  'Fator dia semana',
  'Fator fim semana',
];

const nomeDoPosto = (andar: number, numero: number) => `Unidade de Internação Posto ${numero} - ${andar}º PAV`;

// [andar, posto, hospitalistas, cardio e geriatria, potenciais admissões, fator semana, fator fim de semana]
const LINHAS: [number, number, number, number, number, number, number][] = [
  [2, 1, 18, 3, 2, 1.5, 0.5],
  [2, 2, 16, 4, 1, 1.5, 0.5],
  [2, 3, 0, 0, 0, 1, 0.5],
  [3, 1, 12, 2, 3, 0, 0.5],
  [4, 1, 0, 0, 0, 2.5, 1],
  [4, 2, 24, 5, 2, 2.5, 1],
  [4, 3, 19, 3, 1, 2, 1],
  [4, 4, 20, 4, 0, 2, 1],
  [4, 5, 21, 3, 2, 2, 1],
  [6, 1, 14, 2, 1, 2, 1],
  [6, 2, 18, 5, 2, 2, 1],
  [6, 3, 18, 4, 1, 2, 1],
];

export const AMOSTRA: PostoDaAmostra[] = LINHAS.map(([andar, numero, hosp, cardio, pot, fs, ffs]) => ({
  codigo: `${andar}.${numero}`,
  nomeOriginal: nomeDoPosto(andar, numero),
  hospitalistas: hosp,
  cardioGeriatria: cardio,
  potenciaisAdmissoes: pot,
  fatorSemana: fs,
  fatorFimDeSemana: ffs,
}));

type Celula = string | number;
type Linha = Celula[];

const porMedico = (pacientes: number, fator: number) => (fator === 0 ? 0 : Math.round((pacientes / fator) * 100) / 100);

const linhaDoPosto = (p: PostoDaAmostra): Linha => [
  p.nomeOriginal,
  p.hospitalistas,
  p.cardioGeriatria,
  p.potenciaisAdmissoes,
  porMedico(p.hospitalistas, p.fatorSemana),
  porMedico(p.hospitalistas, p.fatorFimDeSemana),
  p.fatorSemana,
  p.fatorFimDeSemana,
];

const soma = (campo: keyof PostoDaAmostra) => AMOSTRA.reduce((t, p) => t + Number(p[campo]), 0);

const linhaTotal = (): Linha => {
  const hosp = soma('hospitalistas');
  const fs = soma('fatorSemana');
  const ffs = soma('fatorFimDeSemana');
  return [
    'Total',
    hosp,
    soma('cardioGeriatria'),
    soma('potenciaisAdmissoes'),
    porMedico(hosp, fs),
    porMedico(hosp, ffs),
    fs,
    ffs,
  ];
};

const TABELA: Linha[] = [CABECALHO, ...AMOSTRA.map(linhaDoPosto), linhaTotal()];

/** Número no estilo do TASY: vírgula decimal e sem o zero à esquerda (`,5`). */
const numeroTasy = (n: number) => String(n).replace('.', ',').replace(/^0,/, ',');

const texto = (linhas: Linha[], separador: string, aspas = false) =>
  linhas
    .map((linha) =>
      linha
        .map((c) => {
          const valor = typeof c === 'number' ? numeroTasy(c) : c;
          return aspas && valor.includes(separador) ? `"${valor}"` : valor;
        })
        .join(separador),
    )
    .join('\r\n') + '\r\n';

const emLatin1 = (s: string) => {
  for (const ch of s) {
    if (ch.codePointAt(0)! > 0xff) throw new Error(`Caractere fora do Latin-1: ${ch}`);
  }
  return new Uint8Array(Buffer.from(s, 'latin1'));
};
const emUtf8 = (s: string) => new Uint8Array(Buffer.from(s, 'utf8'));
const comBom = (s: string) => new Uint8Array([0xef, 0xbb, 0xbf, ...emUtf8(s)]);

// ---------- xlsx mínimo (zip sem compressão, OOXML com inline strings) ----------

const escaparXml = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const colunaExcel = (i: number) => String.fromCharCode(65 + i);

const planilhaXml = (linhas: Linha[]) => {
  const corpo = linhas
    .map((linha, l) => {
      const celulas = linha
        .map((c, i) => {
          const ref = `${colunaExcel(i)}${l + 1}`;
          return typeof c === 'number'
            ? `<c r="${ref}"><v>${c}</v></c>`
            : `<c r="${ref}" t="inlineStr"><is><t>${escaparXml(c)}</t></is></c>`;
        })
        .join('');
      return `<row r="${l + 1}">${celulas}</row>`;
    })
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${corpo}</sheetData></worksheet>`
  );
};

const PARTES_XLSX = (linhas: Linha[]): [string, string][] => [
  [
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>',
  ],
  [
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
  ],
  [
    'xl/workbook.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Relatorio" sheetId="1" r:id="rId1"/></sheets></workbook>',
  ],
  [
    'xl/_rels/workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>',
  ],
  ['xl/worksheets/sheet1.xml', planilhaXml(linhas)],
];

/** Zip com método "stored" e data fixa, para que o arquivo saia igual byte a byte a cada geração. */
const zip = (arquivos: [string, string][]) => {
  const horaDos = 0;
  const dataDos = ((2026 - 1980) << 9) | (11 << 5) | 12;
  const locais: Buffer[] = [];
  const centrais: Buffer[] = [];
  let deslocamento = 0;
  for (const [nome, conteudo] of arquivos) {
    const nomeBytes = Buffer.from(nome, 'utf8');
    const dados = Buffer.from(conteudo, 'utf8');
    const crc = crc32(dados);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(horaDos, 10);
    local.writeUInt16LE(dataDos, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dados.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nomeBytes.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(horaDos, 12);
    central.writeUInt16LE(dataDos, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dados.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nomeBytes.length, 28);
    central.writeUInt32LE(deslocamento, 42);
    locais.push(local, nomeBytes, dados);
    centrais.push(central, nomeBytes);
    deslocamento += local.length + nomeBytes.length + dados.length;
  }
  const diretorio = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(diretorio.length, 12);
  fim.writeUInt32LE(deslocamento, 16);
  return new Uint8Array(Buffer.concat([...locais, diretorio, fim]));
};

// ---------- casos de borda ----------

const linha = (nome: string, hosp: Celula, cardio: Celula, pot: Celula): Linha => [nome, hosp, cardio, pot, 0, 0, 1, 1];

const BORDAS: Record<string, string> = {
  'borda-so-cabecalho.xls': texto([CABECALHO], '\t'),
  'borda-coluna-ausente.xls': texto(
    TABELA.slice(0, 4).map((l) => l.filter((_, i) => i !== 2)),
    '\t',
  ),
  'borda-posto-fora-do-padrao.xls': texto(
    [CABECALHO, linha(nomeDoPosto(4, 2), 24, 5, 2), linha('UTI Adulto', 10, 1, 0)],
    '\t',
  ),
  'borda-numero-invalido.xls': texto(
    [
      CABECALHO,
      linha(nomeDoPosto(4, 2), 'doze', 5, 2),
      linha(nomeDoPosto(4, 3), 19, -3, 1),
      [nomeDoPosto(4, 4), '12,5', 4, 0, 0, 0, 1, 1],
      linha(nomeDoPosto(4, 5), 21, 3, 2),
    ],
    '\t',
  ),
  'borda-linhas-em-branco-no-fim.xls': texto(TABELA, '\t') + '\t\t\t\t\t\t\t\r\n\r\n\r\n',
  'borda-posto-duplicado.xls': texto(
    [
      CABECALHO,
      linha(nomeDoPosto(4, 2), 24, 5, 2),
      linha(nomeDoPosto(4, 3), 19, 3, 1),
      linha(nomeDoPosto(4, 2), 7, 1, 0),
    ],
    '\t',
  ),
  'borda-potenciais-maior.xls': texto(
    [CABECALHO, linha(nomeDoPosto(4, 2), 24, 5, 2), linha(nomeDoPosto(4, 3), 3, 1, 5)],
    '\t',
  ),
  'borda-variacoes-ordinal.xls': texto(
    [
      CABECALHO,
      linha('Unidade de Internação Posto 1 - 2° PAV', 18, 3, 2),
      linha('Unidade de Internação Posto 2 - 2o PAV', 16, 4, 1),
      // "º" gravado em UTF-8 e lido como Latin-1 vira "Âº".
      linha('Unidade de Internação Posto 3 - 4Âº PAV', 19, 3, 1),
    ],
    '\t',
  ),
};

export function gerarFixtures(): Record<string, Uint8Array> {
  const tabulado = texto(TABELA, '\t');
  return {
    'relatorio-9998-latin1.xls': emLatin1(tabulado),
    'relatorio-9998-utf8-bom.xls': comBom(tabulado),
    'relatorio-9998-ponto-e-virgula.csv': emLatin1(texto(TABELA, ';')),
    'relatorio-9998-virgula.csv': emUtf8(texto(TABELA, ',', true)),
    'relatorio-9998.xlsx': zip(PARTES_XLSX(TABELA)),
    'borda-vazio.xls': new Uint8Array(),
    ...Object.fromEntries(Object.entries(BORDAS).map(([nome, conteudo]) => [nome, emLatin1(conteudo)])),
  };
}

export const NOMES_DOS_ARQUIVOS = Object.keys(gerarFixtures());

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [nome, bytes] of Object.entries(gerarFixtures())) {
    writeFileSync(new URL(nome, import.meta.url), bytes);
  }
  console.log(`Fixtures gravadas: ${NOMES_DOS_ARQUIVOS.length}`);
}
