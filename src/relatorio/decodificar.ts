/**
 * Decodificação e detecção de formato do relatório 9998 (SPEC-02).
 *
 * O formato vem do conteúdo, nunca da extensão: o TASY salva texto tabulado como `.xls`.
 * - xlsx: assinatura ZIP (`PK\x03\x04`). Os bytes seguem intactos para a leitura sob demanda.
 * - Texto: Latin-1 por padrão; UTF-8 com BOM, ou sem BOM se o conteúdo for UTF-8 válido com acentos.
 *   Com tab no cabeçalho é tabulado; senão, CSV com `;` ou `,`, o que aparecer mais fora de aspas.
 */

export type Separador = '\t' | ';' | ',';

export type Formato =
  { formato: 'xlsx' } | { formato: 'vazio' } | { formato: 'tabulado' | 'csv'; separador: Separador };

export type Decodificado =
  | { formato: 'xlsx'; bytes: Uint8Array }
  | { formato: 'vazio' }
  | { formato: 'tabulado' | 'csv'; separador: Separador; linhas: string[][] };

const ASSINATURA_ZIP = [0x50, 0x4b, 0x03, 0x04];
const BOM_UTF8 = [0xef, 0xbb, 0xbf];

const comecaCom = (bytes: Uint8Array, prefixo: readonly number[]) =>
  bytes.length >= prefixo.length && prefixo.every((byte, i) => bytes[i] === byte);

const utf8Estrito = new TextDecoder('utf-8', { fatal: true });
const latin1 = new TextDecoder('latin1');

function tentarUtf8(bytes: Uint8Array): string | undefined {
  try {
    return utf8Estrito.decode(bytes);
  } catch {
    return undefined;
  }
}

/**
 * Latin-1 por padrão; UTF-8 quando há BOM, ou quando o conteúdo tem bytes acima de 0x7F e todos formam
 * UTF-8 válido (CSV salvo por planilha). Um Latin-1 com acentos quase nunca é UTF-8 válido.
 * O BOM nunca chega ao texto.
 */
export function decodificarTexto(bytes: Uint8Array): string {
  const temBom = comecaCom(bytes, BOM_UTF8);
  const corpo = temBom ? bytes.subarray(BOM_UTF8.length) : bytes;
  const naoAscii = corpo.some((byte) => byte > 0x7f);
  if (temBom || naoAscii) {
    const texto = tentarUtf8(corpo);
    if (texto !== undefined) return texto;
  }
  return latin1.decode(corpo);
}

/** Conta as ocorrências de `caractere` fora de aspas duplas. */
function contarForaDeAspas(linha: string, caractere: string): number {
  let dentro = false;
  let total = 0;
  for (const c of linha) {
    if (c === '"') dentro = !dentro;
    else if (!dentro && c === caractere) total++;
  }
  return total;
}

function primeiraLinhaComConteudo(texto: string): string | undefined {
  return texto.split(/\r\n|\r|\n/).find((linha) => linha.trim() !== '');
}

function formatoDoTexto(texto: string): Formato {
  const cabecalho = primeiraLinhaComConteudo(texto);
  if (cabecalho === undefined) return { formato: 'vazio' };
  if (cabecalho.includes('\t')) return { formato: 'tabulado', separador: '\t' };
  const pontoEVirgula = contarForaDeAspas(cabecalho, ';');
  const virgula = contarForaDeAspas(cabecalho, ',');
  if (pontoEVirgula === 0 && virgula === 0) return { formato: 'tabulado', separador: '\t' };
  return { formato: 'csv', separador: pontoEVirgula >= virgula ? ';' : ',' };
}

export function detectarFormato(bytes: Uint8Array): Formato {
  if (comecaCom(bytes, ASSINATURA_ZIP)) return { formato: 'xlsx' };
  return formatoDoTexto(decodificarTexto(bytes));
}

/**
 * Divide o texto em linhas e células. Aspas duplas delimitam células (com `""` como aspas literais)
 * só no CSV; as pontas de cada célula perdem os espaços e linhas sem conteúdo são descartadas.
 */
export function dividirLinhas(texto: string, separador: Separador): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = '';
  let dentro = false;
  // Aspas só delimitam células no CSV; no tabulado do TASY são texto comum.
  const usaAspas = separador !== '\t';

  const fecharCelula = () => {
    linha.push(celula.trim());
    celula = '';
  };
  const fecharLinha = () => {
    fecharCelula();
    if (linha.some((c) => c !== '')) linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) {
      if (c === '"' && texto[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') dentro = false;
      else celula += c;
    } else if (c === '"' && usaAspas) dentro = true;
    else if (c === separador) fecharCelula();
    else if (c === '\r' || c === '\n') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fecharLinha();
    } else celula += c;
  }
  if (celula !== '' || linha.length > 0) fecharLinha();
  return linhas;
}

/** Identifica o formato pelo conteúdo e entrega as linhas do texto, ou os bytes do xlsx. */
export function decodificarRelatorio(arquivo: ArrayBuffer, nome: string): Decodificado {
  void nome; // a extensão não decide o formato
  const bytes = new Uint8Array(arquivo);
  if (comecaCom(bytes, ASSINATURA_ZIP)) return { formato: 'xlsx', bytes };
  const texto = decodificarTexto(bytes);
  const formato = formatoDoTexto(texto);
  if (formato.formato !== 'tabulado' && formato.formato !== 'csv') return { formato: 'vazio' };
  return { ...formato, linhas: dividirLinhas(texto, formato.separador) };
}
