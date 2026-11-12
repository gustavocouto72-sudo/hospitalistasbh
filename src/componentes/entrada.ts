/**
 * De onde vêm as contagens do dia (SPEC-05, "Subir relatório"): do relatório subido ou do preenchimento à
 * mão. Fica só na memória da página. O arquivo é lido no navegador com `arrayBuffer()`, sem `fetch`.
 */
import { lerRelatorio, type ContagemPosto, type ResultadoLeitura } from '@/relatorio/ler';
import { textos } from '@/textos';
import type { EstadoDia } from './estado-dia';

export type Fonte =
  | { readonly tipo: 'nenhuma' }
  | { readonly tipo: 'relatorio'; readonly nome: string; readonly leitura: ResultadoLeitura }
  | { readonly tipo: 'manual' };

/** Leitura em andamento ou a última que falhou. Uma falha não apaga a fonte anterior. */
export type Envio =
  | null
  | { readonly tipo: 'lendo'; readonly nome: string }
  | { readonly tipo: 'falha'; readonly nome: string; readonly mensagem: string };

export type EstadoEntrada = { readonly fonte: Fonte; readonly envio: Envio };

export type Falha = Extract<Envio, { tipo: 'falha' }>;

export const ENTRADA_INICIAL: EstadoEntrada = { fonte: { tipo: 'nenhuma' }, envio: null };

/** Extensões que o seletor de arquivo oferece e que a área de soltar aceita. */
export const EXTENSOES = ['.xls', '.csv', '.xlsx'] as const;

export function extensaoAceita(nome: string): boolean {
  const minusculo = nome.toLowerCase();
  return EXTENSOES.some((extensao) => minusculo.endsWith(extensao) && minusculo.length > extensao.length);
}

/** O primeiro arquivo de uma lista (do seletor ou do arrastar). O relatório do dia é um arquivo só. */
export function primeiroArquivo<T>(arquivos: ArrayLike<T> | null): T | null {
  return arquivos?.[0] ?? null;
}

type ArquivoLegivel = { readonly name: string; arrayBuffer(): Promise<ArrayBuffer> };

/** Lê o arquivo escolhido. Erros e avisos da leitura vêm dentro do relatório; a falha é o que nem chegou a ler. */
export async function lerArquivo(arquivo: ArquivoLegivel): Promise<Extract<Fonte, { tipo: 'relatorio' }> | Falha> {
  const nome = arquivo.name;
  if (!extensaoAceita(nome)) return { tipo: 'falha', nome, mensagem: textos.subir.erros.extensao(nome) };
  try {
    const leitura = await lerRelatorio(await arquivo.arrayBuffer(), nome);
    return { tipo: 'relatorio', nome, leitura };
  } catch {
    return { tipo: 'falha', nome, mensagem: textos.subir.erros.ilegivel };
  }
}

export function iniciarLeitura(estado: EstadoEntrada, nome: string): EstadoEntrada {
  return { fonte: estado.fonte, envio: { tipo: 'lendo', nome } };
}

export function concluirLeitura(estado: EstadoEntrada, resultado: Fonte | Falha): EstadoEntrada {
  if (resultado.tipo === 'falha') return { fonte: estado.fonte, envio: resultado };
  return { fonte: resultado, envio: null };
}

/** O preenchimento à mão troca qualquer fonte anterior pelo quadro zerado. */
export function preencherAMao(): EstadoEntrada {
  return { fonte: { tipo: 'manual' }, envio: null };
}

/** Postos que entram no quadro. O preenchimento à mão começa zerado. */
export function postosDaFonte(fonte: Fonte): readonly ContagemPosto[] {
  return fonte.tipo === 'relatorio' ? fonte.leitura.postos : [];
}

/**
 * Uma fonte nova vale para o dia inteiro: as contagens digitadas sobre a anterior são descartadas. Médicos
 * e tipo de dia ficam como estão.
 */
export function descartarContagens(estado: EstadoDia): EstadoDia {
  if (estado.ajustes.contagens === undefined) return estado;
  const { medicos } = estado.ajustes;
  return { ...estado, ajustes: medicos ? { medicos } : {} };
}

export function resumoDaFonte(fonte: Fonte): string | null {
  switch (fonte.tipo) {
    case 'nenhuma':
      return null;
    case 'manual':
      return textos.subir.resumo.manual;
    case 'relatorio': {
      const postos = fonte.leitura.postos.length;
      return postos === 0
        ? textos.subir.resumo.nenhumPosto(fonte.nome)
        : textos.subir.resumo.lido({ nome: fonte.nome, postos });
    }
  }
}
