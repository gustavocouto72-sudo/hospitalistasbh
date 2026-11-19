/**
 * Estado da lista de apoios na página (SPEC-05, item 5; SPEC-04, "Edição pela equipe"; PRD §6.4). Puro.
 *
 * A lista junta duas fontes:
 * - os apoios **decididos** pela equipe (aceitos, com leitos editados, com apoiador trocado ou adicionados);
 * - os apoios **sugeridos**, que saem de novo de `sugerirApoios` a cada edição do quadro.
 *
 * Uma sugestão some da lista quando a equipe já decidiu aquele par, quando a removeu ou quando ela não combina
 * mais com os apoios decididos. Os decididos ficam até a equipe mexer neles; se uma edição do quadro os torna
 * inválidos, eles continuam na lista com a mensagem do cálculo e ficam fora do Depois.
 *
 * A coluna "Com apoio" da planilha e a folha aplicam todos os apoios válidos da lista, sugeridos ou decididos:
 * a recomendação já vale, e a equipe só edita ou remove. Fica tudo na memória: recarregar a página zera.
 */
import { aplicarApoios } from '@/calculo/aplicar-apoios';
import { sugerirApoios, type SugestaoDeApoio } from '@/calculo/sugerir-apoios';
import type { Apoio, Painel, PainelComApoios, SetorNoPainel } from '@/calculo/tipos';
import { textos } from '@/textos';

export type EstadoApoios = {
  /** Apoios que a equipe aceitou, editou ou adicionou. Um por par (apoiador, apoiado). */
  readonly decididos: readonly Apoio[];
  /** Pares da sugestão que a equipe removeu ou trocou, para não voltarem. Chave de `chaveDoPar`. */
  readonly descartados: readonly string[];
};

export const APOIOS_INICIAL: EstadoApoios = { decididos: [], descartados: [] };

export type ItemDaLista = {
  readonly apoio: Apoio;
  /** `sugerido`: saiu da sugestão do dia. `aceito`: decidido pela equipe (editado, trocado ou adicionado). */
  readonly origem: 'sugerido' | 'aceito';
  /** Mensagem do cálculo quando o apoio aceito não vale com o quadro atual; senão `null`. */
  readonly erro: string | null;
};

const chaveDoPar = (apoio: Pick<Apoio, 'de' | 'para'>) => `${apoio.de}→${apoio.para}`;
const mesmoPar = (a: Pick<Apoio, 'de' | 'para'>, b: Pick<Apoio, 'de' | 'para'>) => a.de === b.de && a.para === b.para;

/** A sugestão do dia para o painel sem apoio. */
export function sugestaoDoDia(painel: Painel): SugestaoDeApoio {
  return sugerirApoios(painel);
}

/** Mensagem do cálculo se `novo` não vale junto de `aceitos`; `null` se vale. */
export function erroDoNovoApoio(painel: Painel, aceitos: readonly Apoio[], novo: Apoio): string | null {
  try {
    aplicarApoios(painel, [...aceitos, novo]);
    return null;
  } catch (erro) {
    if (erro instanceof RangeError) return erro.message;
    throw erro;
  }
}

function ordenarPeloQuadro(painel: Painel, itens: ItemDaLista[]): ItemDaLista[] {
  const indice = new Map(painel.setores.map((s, i) => [s.id, i]));
  const pos = (id: string) => indice.get(id) ?? Number.MAX_SAFE_INTEGER;
  return itens.sort((a, b) => pos(a.apoio.para) - pos(b.apoio.para) || pos(a.apoio.de) - pos(b.apoio.de));
}

export function listaDeApoios(painel: Painel, sugeridos: readonly Apoio[], estado: EstadoApoios): ItemDaLista[] {
  const itens: ItemDaLista[] = [];
  const validos: Apoio[] = [];

  for (const apoio of estado.decididos) {
    const erro = erroDoNovoApoio(painel, validos, apoio);
    if (erro === null) validos.push(apoio);
    itens.push({ apoio, origem: 'aceito', erro });
  }

  // As sugestões pendentes precisam combinar com os aceitos e entre si, para que aceitar qualquer uma delas
  // continue valendo.
  const combinadas = [...validos];
  for (const apoio of sugeridos) {
    if (estado.descartados.includes(chaveDoPar(apoio))) continue;
    if (estado.decididos.some((d) => mesmoPar(d, apoio))) continue;
    if (erroDoNovoApoio(painel, combinadas, apoio) !== null) continue;
    combinadas.push(apoio);
    itens.push({ apoio, origem: 'sugerido', erro: null });
  }

  return ordenarPeloQuadro(painel, itens);
}

/** Os apoios que valem: todos os da lista sem erro, sugeridos ou decididos. */
export function apoiosEmVigor(lista: readonly ItemDaLista[]): Apoio[] {
  return lista.filter((i) => i.erro === null).map((i) => i.apoio);
}

/** O painel com os apoios em vigor aplicados. */
export function painelComApoio(painel: Painel, lista: readonly ItemDaLista[]): PainelComApoios {
  return aplicarApoios(painel, apoiosEmVigor(lista));
}

/** Guarda o apoio entre os decididos, trocando o do mesmo par, se houver. */
function decidir(estado: EstadoApoios, apoio: Apoio): EstadoApoios {
  const existe = estado.decididos.some((d) => mesmoPar(d, apoio));
  const decididos = existe
    ? estado.decididos.map((d) => (mesmoPar(d, apoio) ? { ...apoio } : d))
    : [...estado.decididos, { ...apoio }];
  return { ...estado, decididos };
}

function tirar(estado: EstadoApoios, apoio: Apoio): EstadoApoios {
  const chave = chaveDoPar(apoio);
  return {
    ...estado,
    decididos: estado.decididos.filter((d) => !mesmoPar(d, apoio)),
    descartados: estado.descartados.includes(chave) ? estado.descartados : [...estado.descartados, chave],
  };
}

export function aceitarApoio(estado: EstadoApoios, apoio: Apoio): EstadoApoios {
  return decidir(estado, apoio);
}

/** Muda os leitos do apoio (inteiro ≥ 1). Numa sugestão, isso também a aceita. */
export function editarLeitos(estado: EstadoApoios, apoio: Apoio, leitos: number): EstadoApoios {
  return decidir(estado, { ...apoio, leitos: Math.max(1, Math.round(leitos)) });
}

/** Troca o setor que apoia. O par antigo some da lista; o novo entra aceito, somando se já existir. */
export function trocarApoiador(estado: EstadoApoios, apoio: Apoio, de: string): EstadoApoios {
  if (de === apoio.de) return estado;
  return adicionarApoio(tirar(estado, apoio), { ...apoio, de });
}

export function removerApoio(estado: EstadoApoios, apoio: Apoio): EstadoApoios {
  return tirar(estado, apoio);
}

/** Adiciona um apoio aceito. Se o par já foi decidido, soma os leitos. */
export function adicionarApoio(estado: EstadoApoios, apoio: Apoio): EstadoApoios {
  const existente = estado.decididos.find((d) => mesmoPar(d, apoio));
  return decidir(estado, existente ? { ...apoio, leitos: existente.leitos + apoio.leitos } : apoio);
}

/** Setores que podem apoiar `para`: têm médico, não são escala própria e não são o próprio apoiado. */
export function apoiadoresPossiveis(painel: Painel, para: string): SetorNoPainel[] {
  return painel.setores.filter((s) => s.estado !== 'escalaPropria' && s.medicos > 0 && s.id !== para);
}

/** Setores que podem receber apoio: têm pacientes e não são escala própria. */
export function apoiadosPossiveis(painel: Painel): SetorNoPainel[] {
  return painel.setores.filter((s) => s.estado !== 'escalaPropria' && s.carga > 0);
}

/** Nome do setor para as frases; o id, se o setor não estiver no painel. */
export function nomeDoSetor(painel: Painel, id: string): string {
  return painel.setores.find((s) => s.id === id)?.nome ?? id;
}

/** Notas do cartão no Depois: os apoios que o setor dá e os que recebe. */
export function notasDeApoio(painel: Painel, apoios: readonly Apoio[], setor: string): string[] {
  const t = textos.apoio.lista.notaCartao;
  const notas: string[] = [];
  for (const a of apoios) {
    if (a.de === setor) notas.push(t.apoia({ para: nomeDoSetor(painel, a.para), leitos: a.leitos }));
    if (a.para === setor) notas.push(t.apoiado({ de: nomeDoSetor(painel, a.de), leitos: a.leitos }));
  }
  return notas;
}

/** Ponto de partida do "Adicionar apoio": o primeiro apoiado possível, o primeiro apoiador e 1 leito. */
export function novoApoioPadrao(painel: Painel): Apoio | null {
  for (const apoiado of apoiadosPossiveis(painel)) {
    const [apoiador] = apoiadoresPossiveis(painel, apoiado.id);
    if (apoiador) return { de: apoiador.id, para: apoiado.id, leitos: 1 };
  }
  return null;
}
