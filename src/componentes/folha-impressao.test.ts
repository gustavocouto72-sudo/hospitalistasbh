/**
 * Folha de impressão (SPEC-06; T-06.1): o que a folha mostra sai de `folhaDoDia`, puro, e o componente só
 * desenha. Aqui ficam as linhas da tabela, os apoios em frases, o rodapé e um snapshot da folha.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContagemDoPosto } from '@/calculo/tipos';
import { textos } from '@/textos';
import { APOIOS_INICIAL, aceitarApoio, listaDeApoios, sugestaoDoDia, type EstadoApoios } from './apoios-dia';
import { FolhaImpressao } from './FolhaImpressao';
import { folhaDoDia } from './folha-impressao';
import { painelDoDia } from './painel-dia';

const t = textos.folha;
const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

// Contagens sintéticas: o 4.3 fica sobrecarregado e recebe apoio.
const POSTOS = [
  posto('2.1', 10),
  posto('2.2', 8),
  posto('3.1', 7),
  posto('4.1', 5),
  posto('4.2', 9),
  posto('4.3', 30),
  posto('4.4', 14),
  posto('4.5', 6),
  posto('6.1', 9),
  posto('6.2', 15),
  posto('6.3', 14),
];

const GERADA_EM = new Date(2026, 10, 12, 9, 5);
const ENDERECO = 'exemplo.vercel.app';

function montar(estado: EstadoApoios = APOIOS_INICIAL) {
  const painel = painelDoDia(POSTOS, 'semana', {});
  const sugestao = sugestaoDoDia(painel);
  const lista = listaDeApoios(painel, sugestao.apoios, estado);
  return { painel, sugestao, lista };
}

function comApoioAceito() {
  const { sugestao } = montar();
  const [primeiro] = sugestao.apoios;
  if (!primeiro) throw new Error('a amostra sintética precisa de um apoio sugerido');
  return { apoio: primeiro, ...montar(aceitarApoio(APOIOS_INICIAL, primeiro)) };
}

describe('folhaDoDia', () => {
  it('traz uma linha por setor, na ordem do quadro, com postos, médicos e pacientes', () => {
    const { painel, lista } = montar();
    const folha = folhaDoDia(painel, lista);
    expect(folha.linhas.map((l) => l.id)).toEqual(painel.setores.map((s) => s.id));
    const s42 = folha.linhas.find((l) => l.id === '4.2')!;
    expect(s42.postos).toBe('4.2 + 4.1');
    expect(s42.medicos).toBe('2,5');
    expect(s42.pacientes).toBe('14');
  });

  it('sem apoio aceito, antes e depois são iguais', () => {
    const { painel, lista } = montar();
    const folha = folhaDoDia(painel, lista);
    const s43 = folha.linhas.find((l) => l.id === '4.3')!;
    expect(s43.antes).toBe('15');
    expect(s43.depois).toBe('15');
    expect(s43.visual).toMatchObject({ tipo: 'semaforo', cor: 'vermelho' });
    expect(folha.apoios).toEqual([]);
  });

  it('imprime só os apoios aceitos, em frases, e a cor do depois', () => {
    const { painel, lista } = montar();
    // Sem aceitar nada, as sugestões não vão para a folha.
    expect(lista.length).toBeGreaterThan(0);
    expect(folhaDoDia(painel, lista).apoios).toEqual([]);

    const aceito = comApoioAceito();
    const folha = folhaDoDia(aceito.painel, aceito.lista);
    const nome = (id: string) => aceito.painel.setores.find((s) => s.id === id)!.nome;
    expect(folha.apoios).toEqual([
      `${textos.apoio.lista.frase({ de: nome(aceito.apoio.de), para: nome(aceito.apoio.para), leitos: aceito.apoio.leitos })}.`,
    ]);
    const apoiado = folha.linhas.find((l) => l.id === aceito.apoio.para)!;
    expect(apoiado.depois).not.toBe(apoiado.antes);
  });

  it('escala própria e setor sem médico têm o rótulo no lugar da conta', () => {
    const painel = painelDoDia(POSTOS, 'semana', { medicos: { '6.1': 0 } });
    const folha = folhaDoDia(painel, []);
    const s31 = folha.linhas.find((l) => l.id === '3.1')!;
    expect(s31.medicos).toBe('—');
    expect(s31.antes).toBe('—');
    expect(s31.visual).toEqual({ tipo: 'escalaPropria', rotulo: textos.semaforo.escalaPropria });
    const s61 = folha.linhas.find((l) => l.id === '6.1')!;
    expect(s61.antes).toBe(textos.semaforo.semMedico);
    expect(s61.visual).toMatchObject({ tipo: 'semaforo', cor: 'vermelho', rotulo: textos.semaforo.semMedico });
  });

  it('o rodapé traz a média e os totais do dia', () => {
    const { painel, lista } = montar();
    const folha = folhaDoDia(painel, lista);
    expect(folha.media).toBe(textos.cartao.numero(painel.media!));
    expect(folha.medicos).toBe(textos.cartao.numero(painel.medicosTotal));
    expect(folha.pacientes).toBe(textos.cartao.numero(painel.cargaTotal));
  });
});

describe('FolhaImpressao', () => {
  const html = (dados: Pick<ReturnType<typeof montar>, 'painel' | 'lista'> = comApoioAceito()) =>
    renderToStaticMarkup(
      createElement(FolhaImpressao, {
        painel: dados.painel,
        lista: dados.lista,
        tipoDia: 'semana',
        geradaEm: GERADA_EM,
        endereco: ENDERECO,
      }),
    );

  it('só aparece na impressão', () => {
    expect(html()).toMatch(/^<section[^>]*class="[^"]*\bhidden\b[^"]*\bprint:flex\b/);
  });

  it('tem cabeçalho, tabela, apoios aceitos e rodapé da spec', () => {
    const saida = html();
    expect(saida).toContain(t.titulo);
    expect(saida).toContain(t.geradaEm(GERADA_EM));
    expect(saida).toContain(textos.topo.tipoDia.semana);
    for (const coluna of Object.values(t.colunas)) expect(saida).toContain(coluna);
    expect(saida).toContain(t.apoios);
    expect(saida).toContain(t.gerado(ENDERECO));
    expect(saida).toContain(t.media);
    // Cor com rótulo: toda amostra de cor vem com o texto ao lado.
    expect(saida).toContain(textos.semaforo.escalaPropria);
    expect(saida).not.toContain('<button');
    expect(saida).not.toContain('<input');
  });

  it('sem apoio aceito, diz que não houve apoio', () => {
    expect(html(montar())).toContain(t.semApoios);
  });

  it('snapshot', () => {
    expect(html()).toMatchSnapshot();
  });
});
