import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { textos } from '@/textos';
import {
  ENTRADA_INICIAL,
  descartarContagens,
  concluirLeitura,
  extensaoAceita,
  iniciarLeitura,
  lerArquivo,
  postosDaFonte,
  preencherAMao,
  primeiroArquivo,
  resumoDaFonte,
  type Fonte,
} from './entrada';
import { ESTADO_INICIAL } from './estado-dia';

const fixture = (nome: string) => {
  const bytes = readFileSync(new URL(`../../test/fixtures/${nome}`, import.meta.url));
  return new File([bytes], nome);
};

describe('extensões aceitas', () => {
  it('aceita .xls, .csv e .xlsx, sem ligar para a caixa', () => {
    for (const nome of ['relatorio.xls', 'RELATORIO.XLS', 'a.csv', 'b.xlsx', 'c.Xlsx']) {
      expect(extensaoAceita(nome), nome).toBe(true);
    }
  });

  it('recusa outras extensões e nomes sem extensão', () => {
    for (const nome of ['foto.pdf', 'relatorio', 'planilha.ods', 'xls', 'a.xls.txt']) {
      expect(extensaoAceita(nome), nome).toBe(false);
    }
  });
});

describe('primeiroArquivo', () => {
  it('pega só o primeiro arquivo da lista', () => {
    const a = new File(['x'], 'a.xls');
    const b = new File(['y'], 'b.xls');
    expect(primeiroArquivo([a, b])).toBe(a);
    expect(primeiroArquivo([a])).toBe(a);
    expect(primeiroArquivo([])).toBeNull();
    expect(primeiroArquivo(null)).toBeNull();
  });
});

describe('lerArquivo', () => {
  it('lê a fixture tabulada em Latin-1 com os 12 postos', async () => {
    const entrada = await lerArquivo(fixture('relatorio-9998-latin1.xls'));
    expect(entrada.tipo).toBe('relatorio');
    if (entrada.tipo !== 'relatorio') return;
    expect(entrada.nome).toBe('relatorio-9998-latin1.xls');
    expect(entrada.leitura.postos).toHaveLength(12);
    expect(entrada.leitura.erros).toEqual([]);
    expect(postosDaFonte(entrada)).toHaveLength(12);
  });

  it('lê o .xlsx e o .csv da amostra', async () => {
    for (const nome of ['relatorio-9998.xlsx', 'relatorio-9998-ponto-e-virgula.csv']) {
      const entrada = await lerArquivo(fixture(nome));
      expect(entrada.tipo === 'relatorio' && entrada.leitura.postos.length, nome).toBe(12);
    }
  });

  it('traz os erros da leitura com a linha afetada', async () => {
    const entrada = await lerArquivo(fixture('borda-numero-invalido.xls'));
    expect(entrada.tipo).toBe('relatorio');
    if (entrada.tipo !== 'relatorio') return;
    expect(entrada.leitura.erros.length).toBeGreaterThan(0);
    expect(entrada.leitura.erros[0]?.mensagem).toMatch(/^Linha \d+/);
  });

  it('recusa extensão fora da lista sem ler o conteúdo', async () => {
    const entrada = await lerArquivo(new File(['qualquer'], 'laudo.pdf'));
    expect(entrada).toEqual({ tipo: 'falha', nome: 'laudo.pdf', mensagem: textos.subir.erros.extensao('laudo.pdf') });
  });

  it('vira falha legível quando o navegador não consegue ler o arquivo', async () => {
    const quebrado = { name: 'relatorio.xls', arrayBuffer: () => Promise.reject(new Error('NotReadableError')) };
    const entrada = await lerArquivo(quebrado);
    expect(entrada).toEqual({ tipo: 'falha', nome: 'relatorio.xls', mensagem: textos.subir.erros.ilegivel });
  });
});

describe('resumo da fonte', () => {
  it('não diz nada antes de subir ou preencher', () => {
    expect(resumoDaFonte(ENTRADA_INICIAL.fonte)).toBeNull();
  });

  it('diz quantos postos foram lidos e de qual arquivo', async () => {
    const fonte = await lerArquivo(fixture('relatorio-9998-latin1.xls'));
    expect(fonte.tipo).toBe('relatorio');
    if (fonte.tipo !== 'relatorio') return;
    expect(resumoDaFonte(fonte)).toBe(textos.subir.resumo.lido({ nome: 'relatorio-9998-latin1.xls', postos: 12 }));
    expect(textos.subir.resumo.lido({ nome: 'a.xls', postos: 1 })).toContain('1 posto lido');
    expect(textos.subir.resumo.lido({ nome: 'a.xls', postos: 12 })).toContain('12 postos lidos');
  });

  it('avisa quando nenhum posto pôde ser lido', async () => {
    const fonte = await lerArquivo(fixture('borda-coluna-ausente.xls'));
    if (fonte.tipo !== 'relatorio') throw new Error(fonte.tipo);
    expect(resumoDaFonte(fonte)).toBe(textos.subir.resumo.nenhumPosto('borda-coluna-ausente.xls'));
  });

  it('mostra o preenchimento à mão', () => {
    expect(resumoDaFonte({ tipo: 'manual' })).toBe(textos.subir.resumo.manual);
  });
});

describe('estado da entrada', () => {
  const relatorio: Fonte = { tipo: 'relatorio', nome: 'a.xls', leitura: { postos: [], avisos: [], erros: [] } };

  it('marca a leitura em andamento sem perder a fonte anterior', () => {
    const comRelatorio = concluirLeitura(ENTRADA_INICIAL, relatorio);
    const lendo = iniciarLeitura(comRelatorio, 'b.xls');
    expect(lendo).toEqual({ fonte: relatorio, envio: { tipo: 'lendo', nome: 'b.xls' } });
  });

  it('uma leitura que falha mantém o relatório anterior e mostra o erro', () => {
    const comRelatorio = concluirLeitura(ENTRADA_INICIAL, relatorio);
    const falha = { tipo: 'falha', nome: 'laudo.pdf', mensagem: 'x' } as const;
    expect(concluirLeitura(iniciarLeitura(comRelatorio, 'laudo.pdf'), falha)).toEqual({
      fonte: relatorio,
      envio: falha,
    });
  });

  it('uma leitura concluída troca a fonte e limpa o envio', () => {
    const lendo = iniciarLeitura(ENTRADA_INICIAL, 'a.xls');
    expect(concluirLeitura(lendo, relatorio)).toEqual({ fonte: relatorio, envio: null });
  });

  it('preencher à mão troca a fonte pelo quadro zerado', () => {
    expect(preencherAMao()).toEqual({ fonte: { tipo: 'manual' }, envio: null });
    expect(postosDaFonte({ tipo: 'manual' })).toEqual([]);
    expect(postosDaFonte({ tipo: 'nenhuma' })).toEqual([]);
  });
});

describe('descartarContagens no estado do dia', () => {
  it('preencher à mão abre o quadro zerado: sem contagens digitadas, médicos e tipo de dia mantidos', () => {
    const ajustado = {
      escolhaManual: 'semana' as const,
      ajustes: { medicos: { '4.3': 3 }, contagens: { '4.3': { hospitalistas: 20 } } },
    };
    const manual = descartarContagens(ajustado);
    expect(manual.ajustes.contagens).toBeUndefined();
    expect(manual.ajustes.medicos).toEqual({ '4.3': 3 });
    expect(manual.escolhaManual).toBe('semana');
  });

  it('um relatório novo também descarta as contagens digitadas sobre o anterior', () => {
    const ajustado = { escolhaManual: null, ajustes: { contagens: { '4.3': { hospitalistas: 20 } } } };
    expect(descartarContagens(ajustado).ajustes).toEqual({});
  });

  it('sem contagens digitadas, devolve o mesmo estado', () => {
    expect(descartarContagens(ESTADO_INICIAL)).toBe(ESTADO_INICIAL);
  });
});
