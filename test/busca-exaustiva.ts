/**
 * Busca exaustiva de referência para a sugestão de apoio (SPEC-04, "Algoritmo sugerido", passo 5; T-04.2).
 *
 * Só para testes: fica em `test/`, fora do bundle, e serve para conferir a otimalidade de `sugerirApoios`
 * em painéis pequenos. Percorre todas as soluções com até `maxApoios` apoios (3 por padrão) que respeitam as
 * restrições da spec e devolve a melhor pelos critérios lexicográficos:
 *
 * 1. menos setores fora do verde (azuis, amarelos, vermelhos e `semMedico` com leitos);
 * 2. menos apoios (pares);
 * 3. menos leitos de apoio no total;
 * 4. menor carga ponderada por médico máxima entre os setores com médico;
 * 5. a ordem dos setores no quadro: os apoios ordenados por (apoiado, apoiador) e comparados como sequência
 *    de (índice do apoiado, índice do apoiador, leitos).
 *
 * Restrições: leitos inteiros ≥ 1; um par (apoiador, apoiado) aparece no máximo uma vez; o apoiador tem médico
 * e termina com diferença ≤ +1; nenhum setor apoia e é apoiado; `escalaPropria` não participa; ninguém cede
 * mais leitos do que tem.
 *
 * A avaliação da busca é feita por números, sem montar o painel a cada candidato; a solução final passa por
 * `aplicarApoios` e `corDoSetor`, e a contagem é conferida contra a deles.
 */
import { aplicarApoios } from '../src/calculo/aplicar-apoios';
import { corDoSemaforo, corDoSetor } from '../src/calculo/semaforo';
import { PESO_DO_APOIO, type Apoio, type Painel, type PainelComApoios } from '../src/calculo/tipos';

export type Custo = {
  readonly foraDoVerde: number;
  readonly apoios: number;
  readonly leitos: number;
  readonly maiorCargaPorMedico: number;
  /** Desempate pela ordem do quadro: (apoiado, apoiador, leitos) de cada apoio, já ordenados. */
  readonly chave: readonly number[];
};

export type ResultadoBusca = {
  readonly apoios: Apoio[];
  readonly painelDepois: PainelComApoios;
  /** `true` quando todos os setores terminam no verde. */
  readonly completo: boolean;
  readonly custo: Custo;
};

export type OpcoesBusca = { readonly maxApoios?: number };

/** Setores fora do verde num painel: com cor diferente de verde (inclui `semMedico`, que é vermelho). */
export function foraDoVerde(painel: Painel): number {
  return painel.setores.filter((s) => {
    const cor = corDoSetor(s);
    return cor !== null && cor !== 'verde';
  }).length;
}

/** Custo de uma solução já aplicada. `ordem` são os ids dos setores na ordem do quadro. */
export function custoDe(depois: Painel, apoios: readonly Apoio[], ordem: readonly string[]): Custo {
  const indice = (id: string) => ordem.indexOf(id);
  const chave = apoios
    .map((a) => [indice(a.para), indice(a.de), a.leitos] as const)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1])
    .flat();
  let maior = Number.NEGATIVE_INFINITY;
  for (const s of depois.setores) {
    if (s.estado === 'calculado' && s.cargaPorMedico !== null) maior = Math.max(maior, s.cargaPorMedico);
  }
  return {
    foraDoVerde: foraDoVerde(depois),
    apoios: apoios.length,
    leitos: apoios.reduce((t, a) => t + a.leitos, 0),
    maiorCargaPorMedico: maior,
    chave,
  };
}

/** Negativo quando `a` é melhor que `b`, zero quando empatam e positivo quando é pior. */
export function compararCustos(a: Custo, b: Custo): number {
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

type Par = { readonly de: number; readonly para: number };

export function buscaExaustiva(painel: Painel, opcoes: OpcoesBusca = {}): ResultadoBusca {
  const maxApoios = opcoes.maxApoios ?? 3;
  const setores = painel.setores;
  const ordem = setores.map((s) => s.id);
  const n = setores.length;
  const { media } = painel;

  const carga = setores.map((s) => s.carga);
  const medicos = setores.map((s) => s.medicos);
  const participa = setores.map((s) => s.estado === 'calculado' || s.estado === 'semMedico');
  const podeApoiar = setores.map((s) => s.estado === 'calculado' && s.medicos > 0);
  const podeSerApoiado = setores.map((s, i) => participa[i] === true && s.carga > 0);

  // Pares candidatos na ordem do desempate: apoiado, depois apoiador.
  const pares: Par[] = [];
  if (media !== null) {
    for (let para = 0; para < n; para++) {
      if (!podeSerApoiado[para]) continue;
      for (let de = 0; de < n; de++) if (de !== para && podeApoiar[de]) pares.push({ de, para });
    }
  }

  const cedidos = new Array<number>(n).fill(0);
  const recebidos = new Array<number>(n).fill(0);

  // O apoiador não cede leitos; a conta é a mesma de `aplicarApoios`.
  const diferencaDoApoiador = (i: number, recebe: number) =>
    ((carga[i] as number) + PESO_DO_APOIO * recebe) / (medicos[i] as number) - (media as number);

  /** Mesma conta de `aplicarApoios`, para a diferença sair idêntica. */
  const diferencaDepois = (i: number) =>
    ((carga[i] as number) - (cedidos[i] as number) + PESO_DO_APOIO * (recebidos[i] as number)) /
      (medicos[i] as number) -
    (media as number);

  const avaliar = (escolhidos: readonly Par[], leitos: readonly number[]): Custo => {
    let fora = 0;
    let maior = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      if (!participa[i]) continue;
      const depois = (carga[i] as number) - (cedidos[i] as number) + PESO_DO_APOIO * (recebidos[i] as number);
      if ((medicos[i] as number) > 0) {
        const cargaPorMedico = depois / (medicos[i] as number);
        if (media !== null && corDoSemaforo(diferencaDepois(i)) !== 'verde') fora++;
        if (cargaPorMedico > maior) maior = cargaPorMedico;
      } else if (depois > 0) {
        fora++;
      }
    }
    const chave: number[] = [];
    let total = 0;
    escolhidos.forEach((p, k) => {
      chave.push(p.para, p.de, leitos[k] as number);
      total += leitos[k] as number;
    });
    return { foraDoVerde: fora, apoios: escolhidos.length, leitos: total, maiorCargaPorMedico: maior, chave };
  };

  const solucao = (escolhidos: readonly Par[], leitos: readonly number[]): Apoio[] =>
    escolhidos.map((p, k) => ({
      de: ordem[p.de] as string,
      para: ordem[p.para] as string,
      leitos: leitos[k] as number,
    }));

  let melhorCusto = avaliar([], []);
  let melhor: Apoio[] = [];

  // Leitos de cada par escolhido, um por vez, com as podas de capacidade.
  const distribuir = (escolhidos: readonly Par[], k: number, leitos: number[]) => {
    if (k === escolhidos.length) {
      const custo = avaliar(escolhidos, leitos);
      if (compararCustos(custo, melhorCusto) < 0) {
        melhorCusto = custo;
        melhor = solucao(escolhidos, leitos);
      }
      return;
    }
    const { de, para } = escolhidos[k] as Par;
    for (let l = 1; ; l++) {
      if ((cedidos[para] as number) + l > (carga[para] as number)) break;
      if (diferencaDoApoiador(de, (recebidos[de] as number) + l) > 1) break;
      cedidos[para] = (cedidos[para] as number) + l;
      recebidos[de] = (recebidos[de] as number) + l;
      leitos.push(l);
      distribuir(escolhidos, k + 1, leitos);
      leitos.pop();
      cedidos[para] = (cedidos[para] as number) - l;
      recebidos[de] = (recebidos[de] as number) - l;
    }
  };

  const apoiadores = new Set<number>();
  const apoiados = new Set<number>();
  const escolher = (inicio: number, escolhidos: Par[]) => {
    if (escolhidos.length > 0) distribuir(escolhidos, 0, []);
    if (escolhidos.length === maxApoios) return;
    for (let i = inicio; i < pares.length; i++) {
      const par = pares[i] as Par;
      if (apoiados.has(par.de) || apoiadores.has(par.para)) continue;
      const novoApoiador = !apoiadores.has(par.de);
      const novoApoiado = !apoiados.has(par.para);
      apoiadores.add(par.de);
      apoiados.add(par.para);
      escolhidos.push(par);
      escolher(i + 1, escolhidos);
      escolhidos.pop();
      if (novoApoiador) apoiadores.delete(par.de);
      if (novoApoiado) apoiados.delete(par.para);
    }
  };
  escolher(0, []);

  const painelDepois = aplicarApoios(painel, melhor);
  const custo = custoDe(painelDepois, melhor, ordem);
  if (compararCustos(custo, melhorCusto) !== 0) {
    throw new Error('busca exaustiva: a avaliação rápida divergiu de aplicarApoios');
  }
  return { apoios: melhor, painelDepois, completo: custo.foraDoVerde === 0, custo };
}
