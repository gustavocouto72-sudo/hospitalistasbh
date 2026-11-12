/**
 * Leitura do relatório 9998 em contagens por posto (SPEC-02, "Saída", "Regras e invariantes" e
 * "Casos de borda").
 *
 * Erros impedem que a linha (ou o arquivo inteiro, no caso de coluna ausente) entre nos postos; avisos
 * não bloqueiam nada. As linhas são numeradas a partir de 1 no cabeçalho, contando só as linhas com
 * conteúdo, que são as que `dividirLinhas` entrega.
 */
import { z } from 'zod';
import { textos } from '../textos';
import { COLUNAS, NOME_NO_RELATORIO, mapearColunas, normalizarNome, type Coluna } from './cabecalho';
import { decodificarRelatorio } from './decodificar';
import { lerContagem } from './numeros';
import { extrairCodigoPosto } from './posto';

const contagem = z.number().int().nonnegative();

export const ContagemPostoSchema = z.strictObject({
  codigo: z.string().min(1),
  nomeOriginal: z.string().min(1),
  hospitalistas: contagem,
  cardioGeriatria: contagem,
  potenciaisAdmissoes: contagem,
});

export type ContagemPosto = z.infer<typeof ContagemPostoSchema>;

const linha = z.number().int().positive();
const mensagem = z.string().min(1);

export const AvisoSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('posto-fora-do-padrao'), linha, posto: z.string(), mensagem }),
  z.strictObject({
    tipo: z.literal('potenciais-maior'),
    linha,
    codigo: z.string(),
    potenciaisAdmissoes: contagem,
    hospitalistas: contagem,
    mensagem,
  }),
]);

export type Aviso = z.infer<typeof AvisoSchema>;

export const ErroSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('sem-postos'), mensagem }),
  z.strictObject({ tipo: z.literal('coluna-ausente'), coluna: z.string(), mensagem }),
  z.strictObject({
    tipo: z.literal('numero-invalido'),
    linha,
    posto: z.string(),
    coluna: z.string(),
    valor: z.string(),
    motivo: z.enum(['vazio', 'texto', 'negativo', 'decimal']),
    mensagem,
  }),
  z.strictObject({ tipo: z.literal('posto-duplicado'), linha, codigo: z.string(), primeiraLinha: linha, mensagem }),
  z.strictObject({ tipo: z.literal('posto-sem-nome'), linha, mensagem }),
  z.strictObject({ tipo: z.literal('xlsx-sob-demanda'), mensagem }),
]);

export type Erro = z.infer<typeof ErroSchema>;

export const ResultadoLeituraSchema = z.strictObject({
  postos: z.array(ContagemPostoSchema),
  avisos: z.array(AvisoSchema),
  erros: z.array(ErroSchema),
});

export type ResultadoLeitura = z.infer<typeof ResultadoLeituraSchema>;

const CONTAGENS = COLUNAS.filter((c): c is Exclude<Coluna, 'posto'> => c !== 'posto');

const ehTotal = (nome: string) => normalizarNome(nome) === 'total';

/** Transforma as linhas já divididas (cabeçalho primeiro) em contagens por posto, com avisos e erros. */
export function lerLinhas(linhas: readonly (readonly string[])[]): ResultadoLeitura {
  const postos: ContagemPosto[] = [];
  const avisos: Aviso[] = [];
  const erros: Erro[] = [];
  const [cabecalho = [], ...corpo] = linhas;

  const { indices, faltando } = mapearColunas(cabecalho);
  if (faltando.length > 0) {
    for (const coluna of faltando) {
      const nome = NOME_NO_RELATORIO[coluna];
      erros.push({ tipo: 'coluna-ausente', coluna: nome, mensagem: textos.leitura.erros.colunaAusente(nome) });
    }
    return ResultadoLeituraSchema.parse({ postos, avisos, erros });
  }

  const linhaDoCodigo = new Map<string, number>();
  const celula = (valores: readonly string[], coluna: Coluna) => valores[indices[coluna] as number] ?? '';

  corpo.forEach((valores, i) => {
    const numeroDaLinha = i + 2;
    const nomeOriginal = celula(valores, 'posto');
    if (ehTotal(nomeOriginal)) return;
    if (nomeOriginal === '') {
      erros.push({
        tipo: 'posto-sem-nome',
        linha: numeroDaLinha,
        mensagem: textos.leitura.erros.postoSemNome(numeroDaLinha),
      });
      return;
    }

    const numeros: Partial<Record<Exclude<Coluna, 'posto'>, number>> = {};
    let valida = true;
    for (const coluna of CONTAGENS) {
      const valor = celula(valores, coluna);
      const lido = lerContagem(valor);
      if (lido.ok) {
        numeros[coluna] = lido.valor;
        continue;
      }
      valida = false;
      const detalhe = {
        linha: numeroDaLinha,
        posto: nomeOriginal,
        coluna: NOME_NO_RELATORIO[coluna],
        valor,
        motivo: lido.motivo,
      };
      erros.push({ tipo: 'numero-invalido', ...detalhe, mensagem: textos.leitura.erros.numeroInvalido(detalhe) });
    }
    if (!valida) return;

    const extraido = extrairCodigoPosto(nomeOriginal);
    const codigo = extraido ?? nomeOriginal;

    const primeiraLinha = linhaDoCodigo.get(codigo);
    if (primeiraLinha !== undefined) {
      const detalhe = { codigo, linha: numeroDaLinha, primeiraLinha };
      erros.push({ tipo: 'posto-duplicado', ...detalhe, mensagem: textos.leitura.erros.postoDuplicado(detalhe) });
      return;
    }
    linhaDoCodigo.set(codigo, numeroDaLinha);

    if (extraido === undefined) {
      avisos.push({
        tipo: 'posto-fora-do-padrao',
        linha: numeroDaLinha,
        posto: nomeOriginal,
        mensagem: textos.leitura.avisos.postoForaDoPadrao(nomeOriginal),
      });
    }

    const posto: ContagemPosto = {
      codigo,
      nomeOriginal,
      hospitalistas: numeros.hospitalistas as number,
      cardioGeriatria: numeros.cardioGeriatria as number,
      potenciaisAdmissoes: numeros.potenciaisAdmissoes as number,
    };
    if (posto.potenciaisAdmissoes > posto.hospitalistas) {
      const detalhe = {
        codigo,
        potenciaisAdmissoes: posto.potenciaisAdmissoes,
        hospitalistas: posto.hospitalistas,
      };
      avisos.push({
        tipo: 'potenciais-maior',
        linha: numeroDaLinha,
        ...detalhe,
        mensagem: textos.leitura.avisos.potenciaisMaior(detalhe),
      });
    }
    postos.push(posto);
  });

  if (postos.length === 0) erros.push({ tipo: 'sem-postos', mensagem: textos.leitura.erros.semPostos });
  return ResultadoLeituraSchema.parse({ postos, avisos, erros });
}

/**
 * Lê o relatório inteiro a partir dos bytes. O formato vem do conteúdo. O xlsx precisa da leitura sob
 * demanda (T-02.5) e, por enquanto, volta com um erro.
 */
export function lerRelatorio(arquivo: ArrayBuffer, nome: string): ResultadoLeitura {
  const decodificado = decodificarRelatorio(arquivo, nome);
  if (decodificado.formato === 'vazio') {
    return ResultadoLeituraSchema.parse({
      postos: [],
      avisos: [],
      erros: [{ tipo: 'sem-postos', mensagem: textos.leitura.erros.semPostos }],
    });
  }
  if (decodificado.formato === 'xlsx') {
    return ResultadoLeituraSchema.parse({
      postos: [],
      avisos: [],
      erros: [{ tipo: 'xlsx-sob-demanda', mensagem: textos.leitura.erros.xlsxSobDemanda }],
    });
  }
  return lerLinhas(decodificado.linhas);
}
