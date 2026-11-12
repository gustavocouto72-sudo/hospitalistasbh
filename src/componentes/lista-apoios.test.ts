import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Apoio, ContagemDoPosto, Painel } from '@/calculo/tipos';
import { textos } from '@/textos';
import {
  APOIOS_INICIAL,
  aceitarApoio,
  adicionarApoio,
  listaDeApoios,
  novoApoioPadrao,
  sugestaoDoDia,
  type EstadoApoios,
} from './apoios-dia';
import { ListaApoios } from './ListaApoios';
import { painelDoDia } from './painel-dia';

const t = textos.apoio.lista;
const nada = () => undefined;
const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

const POSTOS = [
  posto('2.1', 10),
  posto('2.2', 8),
  posto('4.1', 5),
  posto('4.2', 9),
  posto('4.3', 30),
  posto('4.4', 14),
  posto('4.5', 6),
  posto('6.1', 9),
  posto('6.2', 15),
  posto('6.3', 14),
];

function lista(painel: Painel, estado: EstadoApoios = APOIOS_INICIAL) {
  const sugestao = sugestaoDoDia(painel);
  return renderToStaticMarkup(
    createElement(ListaApoios, {
      painel,
      lista: listaDeApoios(painel, sugestao.apoios, estado),
      completo: sugestao.completo,
      aviso: sugestao.aviso,
      vista: estado.vista,
      aoAceitar: nada,
      aoEditarLeitos: nada,
      aoTrocarApoiador: nada,
      aoRemover: nada,
      aoAdicionar: nada,
      aoEscolherVista: nada,
    }),
  );
}

const painel = painelDoDia(POSTOS, 'semana', {});
const sugestao = sugestaoDoDia(painel);
const [primeiro] = sugestao.apoios as [Apoio];
const nome = (id: string) => painel.setores.find((s) => s.id === id)!.nome;
const frase = (a: Apoio) => t.frase({ de: nome(a.de), para: nome(a.para), leitos: a.leitos });

describe('ListaApoios', () => {
  it('mostra cada sugestão como frase, com os botões de aceitar, leitos, trocar e remover', () => {
    const html = lista(painel);
    expect(html).toContain(t.titulo);
    expect(html).toContain(`<strong>${t.leitos(primeiro.leitos)}</strong>`);
    expect(html).toContain(`aria-label="${t.aceitarRotulo(frase(primeiro))}"`);
    expect(html).toContain(`aria-label="${t.menosLeito(frase(primeiro))}"`);
    expect(html).toContain(`aria-label="${t.maisLeito(frase(primeiro))}"`);
    expect(html).toContain(`aria-label="${t.trocarRotulo(nome(primeiro.para))}"`);
    expect(html).toContain(`aria-label="${t.removerRotulo(frase(primeiro))}"`);
    expect(html).toContain(t.sugerido);
    expect(html).toContain(t.adicionar.abrir);
  });

  it('o apoio aceito perde o botão de aceitar e ganha o selo "Aceito"', () => {
    const html = lista(painel, aceitarApoio(APOIOS_INICIAL, primeiro));
    expect(html).not.toContain(`aria-label="${t.aceitarRotulo(frase(primeiro))}"`);
    expect(html).toContain(t.aceito);
  });

  it('o seletor de troca lista só quem pode apoiar, com o apoiador atual marcado', () => {
    const html = lista(painel);
    const inicio = html.indexOf(`aria-label="${t.trocarRotulo(nome(primeiro.para))}"`);
    const select = html.slice(inicio, html.indexOf('</select>', inicio));
    expect(select).toContain(`value="${primeiro.de}" selected=""`);
    expect(select).not.toContain(`value="${primeiro.para}"`);
    expect(select).not.toContain('value="3.1"');
  });

  it('mostra o erro de um apoio aceito que não vale mais', () => {
    const html = lista(painel, adicionarApoio(APOIOS_INICIAL, { de: '4.5', para: '6.1', leitos: 50 }));
    expect(html).toContain(textos.apoio.erros.cedeDemais({ setor: '6.1', cedidos: 50, carga: 9 }));
  });

  it('o seletor Antes/Depois marca a vista e explica o que os cartões mostram', () => {
    const antes = lista(painel);
    expect(antes).toContain(t.vista.legenda);
    expect(antes).toMatch(/checked="" value="antes"/);
    expect(antes).toContain(t.vista.notaAntes);
    const depois = lista(painel, { ...aceitarApoio(APOIOS_INICIAL, primeiro), vista: 'depois' });
    expect(depois).toMatch(/checked="" value="depois"/);
    expect(depois).toContain(t.vista.notaDepois(1));
  });

  it('avisa quando nem todos os setores cabem no verde', () => {
    const p = painelDoDia([posto('4.3', 30), posto('4.4', 10), posto('4.5', 10)], 'semana', {
      medicos: { '2': 0, '4.2': 0, '6.1': 0, '6.2': 0, '6.3': 0, '4.3': 1, '4.4': 2, '4.5': 2 },
    });
    const html = lista(p);
    expect(html).toContain(textos.apoio.avisos.nemTodosNoVerde);
    expect(html).toContain(t.incompleto);
    expect(lista(painel)).not.toContain(textos.apoio.avisos.nemTodosNoVerde);
  });

  it('sem apoio a sugerir, diz que todos já estão no verde', () => {
    // Nenhum setor com médico: não há média, e o texto é outro.
    const semMedicos = Object.fromEntries(painel.setores.map((s) => [s.id, 0]));
    expect(lista(painelDoDia(POSTOS, 'semana', { medicos: semMedicos }))).toContain(t.semMedia);
    const verde = painelDoDia(
      [
        posto('2.1', 30),
        posto('4.2', 25),
        posto('4.3', 20),
        posto('4.4', 20),
        posto('4.5', 20),
        posto('6.1', 15),
        posto('6.2', 25),
        posto('6.3', 25),
      ],
      'semana',
      {},
    );
    expect(sugestaoDoDia(verde).apoios).toEqual([]);
    expect(lista(verde)).toContain(t.vazio);
  });
});

describe('novoApoioPadrao', () => {
  it('propõe o primeiro apoiado possível e o primeiro apoiador diferente dele, com 1 leito', () => {
    const novo = novoApoioPadrao(painel);
    expect(novo).toEqual({ de: '4.2', para: '2', leitos: 1 });
  });
});
