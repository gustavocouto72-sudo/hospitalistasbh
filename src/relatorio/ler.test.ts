import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { textos } from '../textos';
import { ContagemPostoSchema, ResultadoLeituraSchema, lerLinhas, lerRelatorio } from './ler';

const pasta = new URL('../../test/fixtures/', import.meta.url);
const ler = (nome: string): ArrayBuffer => {
  const bytes = readFileSync(new URL(nome, pasta));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};
const lerFixture = (nome: string) => lerRelatorio(ler(nome), nome);

const CABECALHO = ['Ds posto', 'Qt hospitalistas', 'Qt cardio geriatria', 'Qt potenciais admissoes'];
const nome = (andar: number, numero: number) => `Unidade de Internação Posto ${numero} - ${andar}º PAV`;

describe('T-02.4 — schema Zod de ContagemPosto', () => {
  const valido = {
    codigo: '4.2',
    nomeOriginal: nome(4, 2),
    hospitalistas: 24,
    cardioGeriatria: 5,
    potenciaisAdmissoes: 2,
  };

  it('aceita uma contagem válida', () => {
    expect(ContagemPostoSchema.parse(valido)).toEqual(valido);
  });

  it.each([
    ['hospitalistas', -1],
    ['cardioGeriatria', 1.5],
    ['potenciaisAdmissoes', Number.NaN],
    ['codigo', ''],
    ['nomeOriginal', ''],
  ])('rejeita %s = %j', (campo, valor) => {
    expect(ContagemPostoSchema.safeParse({ ...valido, [campo]: valor }).success).toBe(false);
  });

  it('rejeita campos a mais', () => {
    expect(ContagemPostoSchema.safeParse({ ...valido, fator: 2 }).success).toBe(false);
  });
});

describe('T-02.4 — amostra sintética', () => {
  for (const arquivo of [
    'relatorio-9998-latin1.xls',
    'relatorio-9998-utf8-bom.xls',
    'relatorio-9998-ponto-e-virgula.csv',
    'relatorio-9998-virgula.csv',
    'borda-linhas-em-branco-no-fim.xls',
    'relatorio-9998.xlsx',
  ]) {
    it(`${arquivo}: 12 postos, Total ignorado, 180 e 35 recalculados, sem avisos nem erros`, async () => {
      const resultado = await lerFixture(arquivo);
      expect(resultado.erros).toEqual([]);
      expect(resultado.avisos).toEqual([]);
      expect(resultado.postos).toHaveLength(12);
      expect(resultado.postos.some((p) => p.nomeOriginal === 'Total')).toBe(false);
      expect(resultado.postos.reduce((t, p) => t + p.hospitalistas, 0)).toBe(180);
      expect(resultado.postos.reduce((t, p) => t + p.cardioGeriatria, 0)).toBe(35);
      expect(resultado.postos.map((p) => p.codigo)).toEqual([
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
      expect(resultado.postos[5]).toEqual({
        codigo: '4.2',
        nomeOriginal: 'Unidade de Internação Posto 2 - 4º PAV',
        hospitalistas: 28,
        cardioGeriatria: 5,
        potenciaisAdmissoes: 2,
      });
      expect(() => ResultadoLeituraSchema.parse(resultado)).not.toThrow();
    });
  }

  it('a linha "Total" é ignorada em qualquer caixa e com espaços', () => {
    const resultado = lerLinhas([CABECALHO, [nome(4, 2), '24', '5', '2'], ['  TOTAL ', '24', '5', '2']]);
    expect(resultado.postos.map((p) => p.codigo)).toEqual(['4.2']);
    expect(resultado.erros).toEqual([]);
  });
});

describe('T-02.4 — casos de borda', () => {
  it('arquivo vazio → erro "relatório sem postos"', async () => {
    expect(await lerFixture('borda-vazio.xls')).toEqual({
      postos: [],
      avisos: [],
      erros: [{ tipo: 'sem-postos', mensagem: textos.leitura.erros.semPostos }],
    });
  });

  it('só cabeçalho → erro "relatório sem postos"', async () => {
    const resultado = await lerFixture('borda-so-cabecalho.xls');
    expect(resultado.postos).toEqual([]);
    expect(resultado.erros).toEqual([{ tipo: 'sem-postos', mensagem: textos.leitura.erros.semPostos }]);
  });

  it('só a linha Total também é relatório sem postos', () => {
    expect(lerLinhas([CABECALHO, ['Total', '0', '0', '0']]).erros.map((e) => e.tipo)).toEqual(['sem-postos']);
  });

  it('a mensagem "relatório sem postos" diz isso', () => {
    expect(textos.leitura.erros.semPostos.toLowerCase()).toContain('relatório sem postos');
  });

  it('coluna obrigatória ausente → erro que diz qual coluna falta, e nenhum posto', async () => {
    const resultado = await lerFixture('borda-coluna-ausente.xls');
    expect(resultado.postos).toEqual([]);
    // A fixture tira a coluna única de cardiologia e geriatria; o erro pede as colunas do formato atual.
    expect(resultado.erros).toEqual(
      ['Qt cardiologia', 'Qt geriatria'].map((coluna) => ({
        tipo: 'coluna-ausente',
        coluna,
        mensagem: textos.leitura.erros.colunaAusente(coluna),
      })),
    );
    expect(resultado.erros[0]?.mensagem).toContain('Qt cardiologia');
  });

  it('várias colunas ausentes geram um erro para cada uma', () => {
    const resultado = lerLinhas([
      ['Ds posto', 'Qt hospitalistas'],
      [nome(4, 2), '24'],
    ]);
    expect(resultado.erros.map((e) => (e.tipo === 'coluna-ausente' ? e.coluna : e.tipo))).toEqual([
      'Qt cardiologia',
      'Qt geriatria',
      'Qt potenciais admissoes',
    ]);
  });

  it('posto fora do padrão → aviso, e entra com o nome original como código', async () => {
    const resultado = await lerFixture('borda-posto-fora-do-padrao.xls');
    expect(resultado.erros).toEqual([]);
    expect(resultado.postos).toEqual([
      {
        codigo: '4.2',
        nomeOriginal: nome(4, 2),
        hospitalistas: 24,
        cardioGeriatria: 5,
        potenciaisAdmissoes: 2,
      },
      {
        codigo: 'UTI Adulto',
        nomeOriginal: 'UTI Adulto',
        hospitalistas: 10,
        cardioGeriatria: 1,
        potenciaisAdmissoes: 0,
      },
    ]);
    expect(resultado.avisos).toEqual([
      {
        tipo: 'posto-fora-do-padrao',
        linha: 3,
        posto: 'UTI Adulto',
        mensagem: textos.leitura.avisos.postoForaDoPadrao('UTI Adulto'),
      },
    ]);
  });

  it('número inválido (texto, negativo ou decimal) → erro na linha, e as outras linhas continuam', async () => {
    const resultado = await lerFixture('borda-numero-invalido.xls');
    expect(resultado.postos.map((p) => p.codigo)).toEqual(['4.5']);
    expect(resultado.erros).toEqual([
      {
        tipo: 'numero-invalido',
        linha: 2,
        posto: nome(4, 2),
        coluna: 'Qt hospitalistas',
        valor: 'doze',
        motivo: 'texto',
        mensagem: textos.leitura.erros.numeroInvalido({
          linha: 2,
          posto: nome(4, 2),
          coluna: 'Qt hospitalistas',
          valor: 'doze',
          motivo: 'texto',
        }),
      },
      expect.objectContaining({ tipo: 'numero-invalido', linha: 3, coluna: 'Qt cardio geriatria', motivo: 'negativo' }),
      expect.objectContaining({ tipo: 'numero-invalido', linha: 4, coluna: 'Qt hospitalistas', motivo: 'decimal' }),
    ]);
  });

  it('célula de contagem vazia ou ausente é número inválido', () => {
    const resultado = lerLinhas([CABECALHO, [nome(4, 2), '24', '', '2'], [nome(4, 3), '19']]);
    expect(resultado.postos).toEqual([]);
    expect(
      resultado.erros.map((e) => (e.tipo === 'numero-invalido' ? `${e.linha}:${e.coluna}:${e.motivo}` : e.tipo)),
    ).toEqual([
      '2:Qt cardio geriatria:vazio',
      '3:Qt cardio geriatria:vazio',
      '3:Qt potenciais admissoes:vazio',
      'sem-postos',
    ]);
  });

  it('a mensagem de número inválido cita a linha, a coluna e o valor', () => {
    const mensagem = textos.leitura.erros.numeroInvalido({
      linha: 7,
      posto: nome(4, 3),
      coluna: 'Qt cardio geriatria',
      valor: '-3',
      motivo: 'negativo',
    });
    expect(mensagem).toContain('7');
    expect(mensagem).toContain('Qt cardio geriatria');
    expect(mensagem).toContain('-3');
  });

  it('linhas em branco no fim são ignoradas', async () => {
    const resultado = await lerFixture('borda-linhas-em-branco-no-fim.xls');
    expect(resultado.postos).toHaveLength(12);
    expect(resultado.erros).toEqual([]);
  });

  it('código de posto repetido → erro, e vale só a primeira ocorrência', async () => {
    const resultado = await lerFixture('borda-posto-duplicado.xls');
    expect(resultado.postos.map((p) => [p.codigo, p.hospitalistas])).toEqual([
      ['4.2', 24],
      ['4.3', 19],
    ]);
    expect(resultado.erros).toEqual([
      {
        tipo: 'posto-duplicado',
        linha: 4,
        codigo: '4.2',
        primeiraLinha: 2,
        mensagem: textos.leitura.erros.postoDuplicado({ codigo: '4.2', linha: 4, primeiraLinha: 2 }),
      },
    ]);
  });

  it('potenciais admissões maior que hospitalistas → aviso, sem bloquear a leitura', async () => {
    const resultado = await lerFixture('borda-potenciais-maior.xls');
    expect(resultado.erros).toEqual([]);
    expect(resultado.postos.map((p) => [p.codigo, p.hospitalistas, p.potenciaisAdmissoes])).toEqual([
      ['4.2', 24, 2],
      ['4.3', 3, 5],
    ]);
    expect(resultado.avisos).toEqual([
      {
        tipo: 'potenciais-maior',
        linha: 3,
        codigo: '4.3',
        potenciaisAdmissoes: 5,
        hospitalistas: 3,
        mensagem: textos.leitura.avisos.potenciaisMaior({ codigo: '4.3', potenciaisAdmissoes: 5, hospitalistas: 3 }),
      },
    ]);
  });

  it('variações do ordinal geram os códigos certos, sem avisos', async () => {
    const resultado = await lerFixture('borda-variacoes-ordinal.xls');
    expect(resultado.avisos).toEqual([]);
    expect(resultado.postos.map((p) => p.codigo)).toEqual(['2.1', '2.2', '4.3']);
  });

  it('linha sem nome do posto → erro na linha, e as outras continuam', () => {
    const resultado = lerLinhas([CABECALHO, ['', '5', '1', '0'], [nome(4, 2), '24', '5', '2']]);
    expect(resultado.postos.map((p) => p.codigo)).toEqual(['4.2']);
    expect(resultado.erros).toEqual([
      { tipo: 'posto-sem-nome', linha: 2, mensagem: textos.leitura.erros.postoSemNome(2) },
    ]);
  });

  it('xlsx corrompido (assinatura ZIP sem planilha válida) → erro claro, sem quebrar', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xde, 0xad, 0xbe, 0xef, 0x00, 0x01]);
    const resultado = await lerRelatorio(bytes.buffer, 'quebrado.xlsx');
    expect(resultado).toEqual({
      postos: [],
      avisos: [],
      erros: [{ tipo: 'xlsx-ilegivel', mensagem: textos.leitura.erros.xlsxIlegivel }],
    });
  });

  it('toda mensagem é texto não vazio vindo de textos/', async () => {
    for (const arquivo of [
      'borda-vazio.xls',
      'borda-coluna-ausente.xls',
      'borda-numero-invalido.xls',
      'borda-posto-duplicado.xls',
      'borda-posto-fora-do-padrao.xls',
      'borda-potenciais-maior.xls',
    ]) {
      const resultado = await lerFixture(arquivo);
      for (const item of [...resultado.avisos, ...resultado.erros]) expect(item.mensagem.length).toBeGreaterThan(0);
      expect(() => ResultadoLeituraSchema.parse(resultado)).not.toThrow();
    }
  });
});

describe('Zod sob a CSP (T-07.1)', () => {
  it('roda sem JIT, para não sondar Function() e violar a CSP sem unsafe-eval', () => {
    expect(z.config().jitless).toBe(true);
  });
});

describe('formato novo do relatório (13/11/2026)', () => {
  it('lê o arquivo novo com os mesmos postos do antigo, somando cardiologia e geriatria', async () => {
    const antigo = await lerFixture('relatorio-9998-latin1.xls');
    const novo = await lerFixture('relatorio-9998-v2-latin1.xls');
    expect(novo.erros).toEqual([]);
    expect(novo.avisos).toEqual([]);
    expect(novo.postos).toEqual(antigo.postos);
  });

  it('cardiologia e geriatria somam em cardioGeriatria', () => {
    const r = lerLinhas([
      ['Ds posto', 'Qt total setor', 'Qt cardiologia', 'Qt geriatria', 'Qt hospitalistas', 'Qt potenciais admissoes'],
      [nome(4, 3), '20,', '1,', '2,', '17,', '3,'],
    ]);
    expect(r.erros).toEqual([]);
    expect(r.postos).toEqual([
      { codigo: '4.3', nomeOriginal: nome(4, 3), hospitalistas: 17, cardioGeriatria: 3, potenciaisAdmissoes: 3 },
    ]);
  });

  it('número inválido na geriatria cita a coluna da geriatria', () => {
    const r = lerLinhas([
      ['Ds posto', 'Qt cardiologia', 'Qt geriatria', 'Qt hospitalistas', 'Qt potenciais admissoes'],
      [nome(4, 3), '1,', 'x', '17,', '3,'],
    ]);
    expect(r.postos).toEqual([]);
    expect(r.erros[0]).toMatchObject({ tipo: 'numero-invalido', coluna: 'Qt geriatria', valor: 'x' });
  });

  it('sem cardiologia nem geriatria, o erro diz quais colunas faltam', () => {
    const r = lerLinhas([
      ['Ds posto', 'Qt hospitalistas', 'Qt potenciais admissoes'],
      [nome(4, 3), '17,', '3,'],
    ]);
    expect(r.erros.map((e) => e.mensagem)).toEqual([
      textos.leitura.erros.colunaAusente('Qt cardiologia'),
      textos.leitura.erros.colunaAusente('Qt geriatria'),
    ]);
  });
});
