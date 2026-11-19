/**
 * Sugere apoios entre setores para deixar todos no verde com o mínimo de apoios (SPEC-04; PRD §6.4).
 *
 * Objetivo, em ordem lexicográfica:
 * 1. menos setores fora do verde (azuis, amarelos, vermelhos e `semMedico` com leitos);
 * 2. menos apoios (pares);
 * 3. menos leitos de apoio no total;
 * 4. menor carga ponderada por médico máxima entre os setores com médico;
 * 5. a ordem dos setores no quadro: os apoios ordenados por (apoiado, apoiador) e comparados como sequência
 *    de (índice do apoiado, índice do apoiador, leitos).
 *
 * Restrições: leitos inteiros ≥ 1; um par (apoiador, apoiado) aparece no máximo uma vez; o apoiador tem médico
 * e termina no verde (diferença ≤ `MARGEM_DO_VERDE`); nenhum setor apoia e é apoiado; `escalaPropria` não participa; ninguém cede
 * mais leitos do que tem.
 *
 * Algoritmo: uma busca gulosa (o setor mais sobrecarregado recebe apoio do setor com mais folga, com o mínimo
 * de leitos que o leva ao verde) e depois uma melhoria local por descida mais íngreme, que remove, funde, troca
 * o apoiador, ajusta os leitos e cria apoios enquanto o custo cair. A melhoria parte do guloso, da solução
 * vazia e do guloso a partir de cada apoio único possível, e vence a melhor. Tudo é percorrido em ordem fixa e
 * só aceita melhoras estritas, então a mesma entrada dá sempre a mesma sugestão.
 *
 * Puro: não muda o painel de entrada.
 */
import { textos } from '../textos';
import { aplicarApoios } from './aplicar-apoios';
import { MARGEM_DO_VERDE, corDoSemaforo, corDoSetor } from './semaforo';
import { PESO_DO_APOIO, type Apoio, type Painel, type PainelComApoios } from './tipos';

export type OpcoesSugestao = {
  /** Máximo de apoios (pares) na sugestão. Sem limite por padrão. */
  readonly maxApoios?: number;
};

export type SugestaoDeApoio = {
  /** Apoios na ordem do quadro: apoiado, depois apoiador. */
  readonly apoios: Apoio[];
  readonly painelDepois: PainelComApoios;
  /** `true` quando todos os setores terminam no verde. */
  readonly completo: boolean;
  /** "Nem todos os setores cabem no verde hoje" quando `completo` é `false`; senão `null`. */
  readonly aviso: string | null;
};

/** Apoio por índice de setor no quadro. */
type Par = { readonly de: number; readonly para: number };
type Item = Par & { readonly leitos: number };

type Custo = {
  readonly foraDoVerde: number;
  readonly apoios: number;
  readonly leitos: number;
  readonly maiorCargaPorMedico: number;
  readonly chave: readonly number[];
};

function compararCustos(a: Custo, b: Custo): number {
  const campos = ['foraDoVerde', 'apoios', 'leitos', 'maiorCargaPorMedico'] as const;
  for (const campo of campos) {
    if (a[campo] !== b[campo]) return a[campo] < b[campo] ? -1 : 1;
  }
  const n = Math.min(a.chave.length, b.chave.length);
  for (let i = 0; i < n; i++) {
    const x = a.chave[i] as number;
    const y = b.chave[i] as number;
    if (x !== y) return x - y;
  }
  return a.chave.length - b.chave.length;
}

const ordenar = (itens: readonly Item[]): Item[] => [...itens].sort((x, y) => x.para - y.para || x.de - y.de);

/** Soma os leitos num par já existente ou cria o par. */
function somar(itens: readonly Item[], de: number, para: number, leitos: number): Item[] {
  const k = itens.findIndex((it) => it.de === de && it.para === para);
  if (k < 0) return ordenar([...itens, { de, para, leitos }]);
  return itens.map((it, j) => (j === k ? { ...it, leitos: it.leitos + leitos } : it));
}

export function sugerirApoios(painel: Painel, opcoes: OpcoesSugestao = {}): SugestaoDeApoio {
  const maxApoios = opcoes.maxApoios ?? Number.POSITIVE_INFINITY;
  const setores = painel.setores;
  const n = setores.length;
  const { media } = painel;

  const carga = setores.map((s) => s.carga);
  const medicos = setores.map((s) => s.medicos);
  const participa = setores.map((s) => s.estado === 'calculado' || s.estado === 'semMedico');
  const podeApoiar = setores.map((s) => s.estado === 'calculado' && s.medicos > 0);
  const podeSerApoiado = setores.map((s, i) => participa[i] === true && s.carga > 0);

  /** Mesma conta de `aplicarApoios`, para a diferença sair idêntica. */
  const diferenca = (i: number, cedidos: number, recebidos: number) =>
    ((carga[i] as number) - cedidos + PESO_DO_APOIO * recebidos) / (medicos[i] as number) - (media as number);

  const totais = (itens: readonly Item[]) => {
    const cedidos = new Array<number>(n).fill(0);
    const recebidos = new Array<number>(n).fill(0);
    for (const it of itens) {
      cedidos[it.para] = (cedidos[it.para] as number) + it.leitos;
      recebidos[it.de] = (recebidos[it.de] as number) + it.leitos;
    }
    return { cedidos, recebidos };
  };

  /** Custo de uma solução, ou `null` se ela fere alguma restrição. `itens` já vêm ordenados. */
  const avaliar = (itens: readonly Item[]): Custo | null => {
    if (itens.length > maxApoios) return null;
    let anterior: Item | undefined;
    for (const it of itens) {
      if (!Number.isInteger(it.leitos) || it.leitos < 1) return null;
      if (it.de === it.para || !podeApoiar[it.de] || !podeSerApoiado[it.para]) return null;
      // Ordenados por (apoiado, apoiador), um par repetido fica lado a lado.
      if (anterior && anterior.de === it.de && anterior.para === it.para) return null;
      anterior = it;
    }
    const { cedidos, recebidos } = totais(itens);
    let fora = 0;
    let maior = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const ced = cedidos[i] as number;
      const rec = recebidos[i] as number;
      if (ced > 0 && rec > 0) return null;
      if (ced > (carga[i] as number)) return null;
      if (!participa[i]) continue;
      if ((medicos[i] as number) > 0) {
        const d = diferenca(i, ced, rec);
        if (rec > 0 && d > MARGEM_DO_VERDE) return null;
        if (corDoSemaforo(d) !== 'verde') fora++;
        const cargaPorMedico = ((carga[i] as number) - ced + PESO_DO_APOIO * rec) / (medicos[i] as number);
        if (cargaPorMedico > maior) maior = cargaPorMedico;
      } else if ((carga[i] as number) - ced > 0) {
        fora++;
      }
    }
    const chave: number[] = [];
    let leitos = 0;
    for (const it of itens) {
      chave.push(it.para, it.de, it.leitos);
      leitos += it.leitos;
    }
    return { foraDoVerde: fora, apoios: itens.length, leitos, maiorCargaPorMedico: maior, chave };
  };

  /** Quantos leitos o apoiador `de` ainda aguenta sem sair do verde. */
  const folga = (de: number, recebidos: number) => {
    let l = 0;
    while (diferenca(de, 0, recebidos + l + 1) <= MARGEM_DO_VERDE) l++;
    return l;
  };

  /** Máximo de leitos que `de` pode somar ao apoio a `para` sobre `base`: 0 se o par for inviável. */
  const maxLeitos = (base: readonly Item[], de: number, para: number) => maxLeitosDe(totais(base), de, para);
  const maxLeitosDe = (t: ReturnType<typeof totais>, de: number, para: number) => {
    if (de === para || !podeApoiar[de] || !podeSerApoiado[para]) return 0;
    if ((t.cedidos[de] as number) > 0 || (t.recebidos[para] as number) > 0) return 0;
    const resta = (carga[para] as number) - (t.cedidos[para] as number);
    return Math.max(0, Math.min(resta, folga(de, t.recebidos[de] as number)));
  };

  /**
   * Leitos que vale tentar ao somar um apoio de `de` a `para` sobre `base`. Com os mesmos pares, o número de
   * setores fora do verde só muda quando o apoiado ou o apoiador muda de faixa; dentro de cada trecho em que ele
   * fica igual, o menor número de leitos é o melhor (critério 3). Bastam, então, o 1 e o primeiro leito de cada
   * trecho.
   */
  const candidatos = (base: readonly Item[], de: number, para: number): number[] => {
    const t = totais(base);
    const max = maxLeitosDe(t, de, para);
    if (max === 0) return [];
    const { cedidos, recebidos } = t;
    const ced = cedidos[para] as number;
    const rec = recebidos[de] as number;
    const estado = (l: number) => {
      const apoiado =
        (medicos[para] as number) > 0
          ? corDoSemaforo(diferenca(para, ced + l, 0))
          : (carga[para] as number) - ced - l > 0;
      return `${apoiado}|${corDoSemaforo(diferenca(de, 0, rec + l))}`;
    };
    const lista = [1];
    let anterior = estado(1);
    for (let l = 2; l <= max; l++) {
      const atual = estado(l);
      if (atual !== anterior) lista.push(l);
      anterior = atual;
    }
    return lista;
  };

  /** Passos 1 a 3 do algoritmo da spec. */
  const guloso = (inicio: readonly Item[] = []): Item[] => {
    let itens: Item[] = [...inicio];
    const desistidos = new Set<number>();
    for (;;) {
      const { cedidos, recebidos } = totais(itens);
      const cargaPorMedico = (i: number) =>
        (medicos[i] as number) > 0
          ? ((carga[i] as number) - (cedidos[i] as number) + PESO_DO_APOIO * (recebidos[i] as number)) /
            (medicos[i] as number)
          : Number.POSITIVE_INFINITY;

      let apoiado = -1;
      for (let i = 0; i < n; i++) {
        if (!podeSerApoiado[i] || desistidos.has(i) || (recebidos[i] as number) > 0) continue;
        const resta = (carga[i] as number) - (cedidos[i] as number);
        if (resta <= 0) continue;
        if ((medicos[i] as number) > 0 && diferenca(i, cedidos[i] as number, 0) <= MARGEM_DO_VERDE) continue;
        if (apoiado < 0 || cargaPorMedico(i) > cargaPorMedico(apoiado)) apoiado = i;
      }
      if (apoiado < 0) return itens;

      const resta = (carga[apoiado] as number) - (cedidos[apoiado] as number);
      let precisa = resta;
      if ((medicos[apoiado] as number) > 0) {
        precisa = 1;
        while (precisa < resta && diferenca(apoiado, (cedidos[apoiado] as number) + precisa, 0) > MARGEM_DO_VERDE)
          precisa++;
      }

      let apoiador = -1;
      let capacidade = 0;
      for (let i = 0; i < n; i++) {
        if (i === apoiado || !podeApoiar[i] || (cedidos[i] as number) > 0) continue;
        const cap = folga(i, recebidos[i] as number);
        if (cap === 0) continue;
        if (apoiador < 0 || cargaPorMedico(i) < cargaPorMedico(apoiador)) {
          apoiador = i;
          capacidade = cap;
        }
      }
      if (apoiador < 0) {
        desistidos.add(apoiado);
        continue;
      }
      itens = somar(itens, apoiador, apoiado, Math.min(precisa, capacidade));
    }
  };

  /** Passo 4: descida mais íngreme sobre remoções, fusões, trocas de apoiador, ajustes de leitos e criações. */
  const visitados = new Set<string>();
  const melhorar = (inicio: readonly Item[]): { itens: Item[]; custo: Custo } | null => {
    const custoInicial = avaliar(inicio);
    if (!custoInicial) return null;
    let atual = { itens: [...inicio], custo: custoInicial };

    for (;;) {
      // A descida é determinística: um estado já visitado leva ao mesmo ótimo local, que já foi considerado.
      const chave = atual.custo.chave.join(',');
      if (visitados.has(chave)) return null;
      visitados.add(chave);
      let melhor = atual;
      const tentar = (itens: readonly Item[]) => {
        const custo = avaliar(itens);
        if (custo && compararCustos(custo, melhor.custo) < 0) melhor = { itens: [...itens], custo };
        return custo !== null;
      };
      /** Soma `l` leitos de `de` para `para` em `base`, para cada `l` em `candidatos`. */
      const variarLeitos = (base: readonly Item[], de: number, para: number) => {
        for (const l of candidatos(base, de, para)) tentar(somar(base, de, para, l));
      };
      /** O mesmo com dois apoios: todos os leitos do primeiro e, para cada um, os candidatos do segundo. */
      const variarDois = (base: readonly Item[], a: Par, b: Par) => {
        for (let l1 = 1; l1 <= maxLeitos(base, a.de, a.para); l1++) {
          const comA = somar(base, a.de, a.para, l1);
          for (const l2 of candidatos(comA, b.de, b.para)) tentar(somar(comA, b.de, b.para, l2));
        }
      };

      const itens = atual.itens;
      for (let k = 0; k < itens.length; k++) {
        const it = itens[k] as Item;
        const sem = itens.filter((_, j) => j !== k);
        // Remover o apoio.
        tentar(sem);
        // Mudar os leitos, o apoiador, o apoiado ou os dois (fundindo com um par que já exista).
        for (let para = 0; para < n; para++) {
          if (!podeSerApoiado[para]) continue;
          for (let de = 0; de < n; de++) if (de !== para && podeApoiar[de]) variarLeitos(sem, de, para);
        }
        for (let j = k + 1; j < itens.length; j++) {
          const outro = itens[j] as Item;
          const semOsDois = itens.filter((_, m) => m !== k && m !== j);
          // Redistribuir os leitos entre os dois apoios.
          variarDois(semOsDois, it, outro);
          // Trocar os apoiadores dos dois apoios entre si.
          if (outro.de !== it.de) {
            variarDois(semOsDois, { de: outro.de, para: it.para }, { de: it.de, para: outro.para });
          }
          // Fundir dois apoios ao mesmo apoiado num só, com qualquer apoiador.
          if (outro.para !== it.para) continue;
          for (let de = 0; de < n; de++) if (de !== it.para && podeApoiar[de]) variarLeitos(semOsDois, de, it.para);
        }
      }
      // Criar um apoio novo.
      for (let para = 0; para < n; para++) {
        if (!podeSerApoiado[para]) continue;
        for (let de = 0; de < n; de++) {
          if (de === para || !podeApoiar[de] || itens.some((x) => x.de === de && x.para === para)) continue;
          variarLeitos(itens, de, para);
        }
      }
      // Trocar um apoiador por outro em todos os apoios dele, com os mesmos leitos.
      for (const antigo of new Set(itens.map((x) => x.de))) {
        for (let novo = 0; novo < n; novo++) {
          if (novo === antigo || !podeApoiar[novo]) continue;
          let trocados = itens.filter((x) => x.de !== antigo);
          for (const x of itens) if (x.de === antigo) trocados = somar(trocados, novo, x.para, x.leitos);
          tentar(trocados);
        }
      }

      if (melhor === atual) return atual;
      atual = melhor;
    }
  };

  let escolhida: Item[] = [];
  if (media !== null) {
    // Partidas: o guloso puro, a solução vazia e o guloso a partir de cada apoio único possível, com os
    // leitos que deixam esse apoio sozinho no melhor custo.
    const partidas: Item[][] = [guloso(), []];
    for (let para = 0; para < n; para++) {
      if (!podeSerApoiado[para]) continue;
      for (let de = 0; de < n; de++) {
        if (de === para || !podeApoiar[de]) continue;
        let semente: { itens: Item[]; custo: Custo } | null = null;
        for (const l of candidatos([], de, para)) {
          const itens = [{ de, para, leitos: l }];
          const custo = avaliar(itens);
          if (custo && (!semente || compararCustos(custo, semente.custo) < 0)) semente = { itens, custo };
        }
        if (semente) partidas.push(guloso(semente.itens));
      }
    }
    let melhor: { itens: Item[]; custo: Custo } | null = null;
    for (const partida of partidas) {
      const candidata = melhorar(partida);
      if (candidata && (!melhor || compararCustos(candidata.custo, melhor.custo) < 0)) melhor = candidata;
    }
    escolhida = melhor?.itens ?? [];
  }

  const apoios = ordenar(escolhida).map((it) => ({
    de: setores[it.de]?.id as string,
    para: setores[it.para]?.id as string,
    leitos: it.leitos,
  }));
  const painelDepois = aplicarApoios(painel, apoios);
  const completo = painelDepois.setores.every((s) => {
    const cor = corDoSetor(s);
    return cor === null || cor === 'verde';
  });
  return { apoios, painelDepois, completo, aviso: completo ? null : textos.apoio.avisos.nemTodosNoVerde };
}
