import { describe, expect, it } from 'vitest';
import type { Apoio, ContagemDoPosto } from '@/calculo/tipos';
import { textos } from '@/textos';
import {
  APOIOS_INICIAL,
  aceitarApoio,
  adicionarApoio,
  apoiadoresPossiveis,
  apoiadosPossiveis,
  apoiosEmVigor,
  editarLeitos,
  erroDoNovoApoio,
  listaDeApoios,
  notasDeApoio,
  painelComApoio,
  removerApoio,
  sugestaoDoDia,
  trocarApoiador,
} from './apoios-dia';
import { painelDoDia } from './painel-dia';

const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

// Semana: 4.3 sobrecarregado (30 pacientes para 2 médicos) e 4.5 com folga.
const POSTOS: readonly ContagemDoPosto[] = [
  posto('2.1', 10),
  posto('2.2', 8),
  posto('3.1', 12),
  posto('4.1', 5),
  posto('4.2', 9),
  posto('4.3', 30),
  posto('4.4', 14),
  posto('4.5', 6),
  posto('6.1', 9),
  posto('6.2', 15),
  posto('6.3', 14),
];

const painel = painelDoDia(POSTOS, 'semana', {});
const sugestao = sugestaoDoDia(painel);
const apoio = (de: string, para: string, leitos: number): Apoio => ({ de, para, leitos });

describe('listaDeApoios', () => {
  it('começa com a sugestão do dia, toda pendente', () => {
    expect(sugestao.apoios.length).toBeGreaterThan(0);
    const lista = listaDeApoios(painel, sugestao.apoios, APOIOS_INICIAL);
    expect(lista.map((i) => i.apoio)).toEqual(sugestao.apoios);
    expect(lista.every((i) => i.origem === 'sugerido' && i.erro === null)).toBe(true);
    expect(apoiosEmVigor(lista)).toEqual(sugestao.apoios);
  });

  it('aceitar põe o apoio entre os aceitos, sem repetir na lista', () => {
    const [primeiro] = sugestao.apoios as [Apoio];
    const estado = aceitarApoio(APOIOS_INICIAL, primeiro);
    const lista = listaDeApoios(painel, sugestao.apoios, estado);
    expect(lista).toHaveLength(sugestao.apoios.length);
    expect(lista.find((i) => i.apoio.de === primeiro.de && i.apoio.para === primeiro.para)?.origem).toBe('aceito');
    expect(apoiosEmVigor(lista)).toContainEqual(primeiro);
  });

  it('editar os leitos de uma sugestão aceita o apoio com os leitos novos', () => {
    const [primeiro] = sugestao.apoios as [Apoio];
    const estado = editarLeitos(APOIOS_INICIAL, primeiro, primeiro.leitos + 1);
    const lista = listaDeApoios(painel, sugestao.apoios, estado);
    expect(apoiosEmVigor(lista)).toContainEqual({ ...primeiro, leitos: primeiro.leitos + 1 });
    expect(apoiosEmVigor(lista)).not.toContainEqual(primeiro);
    expect(lista).toHaveLength(sugestao.apoios.length);
  });

  it('não deixa os leitos abaixo de 1', () => {
    const estado = editarLeitos(APOIOS_INICIAL, apoio('4.5', '4.3', 1), 0);
    expect(estado.decididos).toEqual([apoio('4.5', '4.3', 1)]);
  });

  it('remover tira o apoio da lista, mesmo sendo uma sugestão', () => {
    const [primeiro] = sugestao.apoios as [Apoio];
    const aceito = aceitarApoio(APOIOS_INICIAL, primeiro);
    for (const estado of [removerApoio(APOIOS_INICIAL, primeiro), removerApoio(aceito, primeiro)]) {
      const lista = listaDeApoios(painel, sugestao.apoios, estado);
      expect(lista.some((i) => i.apoio.de === primeiro.de && i.apoio.para === primeiro.para)).toBe(false);
    }
  });

  it('trocar o apoiador aceita o apoio com o setor novo e some com o antigo', () => {
    const [primeiro] = sugestao.apoios as [Apoio];
    const outro = apoiadoresPossiveis(painel, primeiro.para).find((s) => s.id !== primeiro.de);
    expect(outro).toBeDefined();
    const estado = trocarApoiador(APOIOS_INICIAL, primeiro, outro!.id);
    const lista = listaDeApoios(painel, sugestao.apoios, estado);
    expect(lista.some((i) => i.apoio.de === primeiro.de && i.apoio.para === primeiro.para)).toBe(false);
    expect(apoiosEmVigor(lista)).toContainEqual({ ...primeiro, de: outro!.id });
  });

  it('adicionar um apoio novo entra aceito; no mesmo par, soma os leitos', () => {
    const um = adicionarApoio(APOIOS_INICIAL, apoio('6.1', '4.3', 2));
    const dois = adicionarApoio(um, apoio('6.1', '4.3', 1));
    expect(dois.decididos).toEqual([apoio('6.1', '4.3', 3)]);
    const lista = listaDeApoios(painel, sugestao.apoios, dois);
    expect(apoiosEmVigor(lista)).toContainEqual(apoio('6.1', '4.3', 3));
  });

  it('marca o apoio decidido que ficou inválido, com a mensagem, e o deixa fora da conta', () => {
    const estado = adicionarApoio(APOIOS_INICIAL, apoio('4.5', '6.1', 50));
    const lista = listaDeApoios(painel, sugestao.apoios, estado);
    const item = lista.find((i) => i.apoio.para === '6.1' && i.apoio.de === '4.5');
    expect(item?.erro).toBe(textos.apoio.erros.cedeDemais({ setor: '6.1', cedidos: 50, carga: 9 }));
    expect(apoiosEmVigor(lista)).not.toContainEqual(apoio('4.5', '6.1', 50));
  });

  it('esconde a sugestão que não combina com os apoios aceitos', () => {
    // Se o apoiado da sugestão passa a apoiar outro setor, a sugestão não cabe mais.
    const [primeiro] = sugestao.apoios as [Apoio];
    const destino = apoiadosPossiveis(painel).find((s) => s.id !== primeiro.para && s.id !== primeiro.de);
    const estado = adicionarApoio(APOIOS_INICIAL, apoio(primeiro.para, destino!.id, 1));
    const lista = listaDeApoios(painel, sugestao.apoios, estado);
    expect(lista.some((i) => i.origem === 'sugerido' && i.apoio.para === primeiro.para)).toBe(false);
  });

  it('segue a ordem do quadro: apoiado, depois apoiador', () => {
    const estado = adicionarApoio(adicionarApoio(APOIOS_INICIAL, apoio('6.1', '6.3', 1)), apoio('4.5', '2', 1));
    const ids = painel.setores.map((s) => s.id);
    const lista = listaDeApoios(painel, [], estado);
    const ordem = lista.map((i) => [ids.indexOf(i.apoio.para), ids.indexOf(i.apoio.de)]);
    expect(ordem).toEqual([...ordem].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!));
  });
});

describe('erroDoNovoApoio', () => {
  it('aceita um apoio válido e recusa um inválido com a mensagem do cálculo', () => {
    expect(erroDoNovoApoio(painel, [], apoio('4.5', '4.3', 2))).toBeNull();
    expect(erroDoNovoApoio(painel, [], apoio('4.3', '4.3', 2))).toBe(textos.apoio.erros.mesmoSetor('4.3'));
    expect(erroDoNovoApoio(painel, [apoio('4.5', '4.3', 2)], apoio('4.3', '6.1', 1))).toBe(
      textos.apoio.erros.apoiadorEApoiado('4.3'),
    );
  });
});

describe('candidatos', () => {
  it('apoiador tem médico, não é escala própria nem o próprio apoiado', () => {
    const ids = apoiadoresPossiveis(painel, '4.3').map((s) => s.id);
    expect(ids).not.toContain('4.3');
    expect(ids).not.toContain('3.1');
    expect(ids).toContain('4.5');
  });

  it('apoiado tem pacientes e não é escala própria', () => {
    const vazio = painelDoDia([...POSTOS.filter((p) => p.codigo !== '4.5'), posto('4.5', 0)], 'semana', {});
    const ids = apoiadosPossiveis(vazio).map((s) => s.id);
    expect(ids).not.toContain('3.1');
    expect(ids).not.toContain('4.5');
    expect(ids).toContain('4.3');
  });
});

describe('painelComApoio', () => {
  it('aplica todos os apoios válidos da lista, sugeridos ou decididos', () => {
    const lista = listaDeApoios(painel, sugestao.apoios, APOIOS_INICIAL);
    const com = painelComApoio(painel, lista);
    for (const para of new Set(sugestao.apoios.map((a) => a.para))) {
      const cedidos = sugestao.apoios.filter((a) => a.para === para).reduce((soma, a) => soma + a.leitos, 0);
      const antes = painel.setores.find((s) => s.id === para)!;
      const depois = com.setores.find((s) => s.id === para)!;
      expect(depois.carga).toBe(antes.carga - cedidos);
    }
  });

  it('sem apoios na lista, as cargas não mudam', () => {
    const removidos = sugestao.apoios.reduce((estado, a) => removerApoio(estado, a), APOIOS_INICIAL);
    const com = painelComApoio(painel, listaDeApoios(painel, sugestao.apoios, removidos));
    expect(com.setores.map((s) => s.carga)).toEqual(painel.setores.map((s) => s.carga));
  });
});

describe('sugestaoDoDia', () => {
  it('avisa quando nem todos os setores cabem no verde', () => {
    // Média 10: o 4.3 precisa ceder 19 leitos, e o 4.4 e o 4.5 aguentam só 9 cada um.
    const p = painelDoDia([posto('4.3', 30), posto('4.4', 10), posto('4.5', 10)], 'semana', {
      medicos: { '2': 0, '4.2': 0, '6.1': 0, '6.2': 0, '6.3': 0, '4.3': 1, '4.4': 2, '4.5': 2 },
    });
    const s = sugestaoDoDia(p);
    expect(s.completo).toBe(false);
    expect(s.aviso).toBe(textos.apoio.avisos.nemTodosNoVerde);
  });
});

describe('notasDeApoio', () => {
  it('diz no cartão quem apoia quem, com os nomes dos setores', () => {
    const apoios = [apoio('4.5', '2', 2), apoio('4.5', '4.3', 3)];
    expect(notasDeApoio(painel, apoios, '4.5')).toEqual([
      textos.apoio.lista.notaCartao.apoia({ para: '2º andar', leitos: 2 }),
      textos.apoio.lista.notaCartao.apoia({ para: '4.3', leitos: 3 }),
    ]);
    expect(notasDeApoio(painel, apoios, '2')).toEqual([
      textos.apoio.lista.notaCartao.apoiado({ de: '4.5', leitos: 2 }),
    ]);
    expect(notasDeApoio(painel, apoios, '6.1')).toEqual([]);
  });
});
