/**
 * Teste de aceitação da SPEC-03 (T-03.5): da fixture sintética da amostra de 12/11/2026 até o painel,
 * passando pela leitura (SPEC-02), por `montarQuadro`, `calcularCarga` e `corDoSetor`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { calcularCarga } from '../src/calculo/calcular-carga';
import { montarQuadro } from '../src/calculo/montar-quadro';
import { corDoSetor } from '../src/calculo/semaforo';
import type { Cor, Painel, TipoDia } from '../src/calculo/tipos';
import { lerRelatorio } from '../src/relatorio/ler';

const pasta = new URL('./fixtures/', import.meta.url);

const FIXTURES = [
  'relatorio-9998-latin1.xls',
  'relatorio-9998-utf8-bom.xls',
  'relatorio-9998-ponto-e-virgula.csv',
  'relatorio-9998-virgula.csv',
  'relatorio-9998.xlsx',
];

async function painelDaFixture(arquivo: string, tipoDia: TipoDia): Promise<Painel> {
  const bytes = readFileSync(new URL(arquivo, pasta));
  const leitura = await lerRelatorio(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    arquivo,
  );
  expect(leitura.erros).toEqual([]);
  return calcularCarga(montarQuadro(leitura.postos, tipoDia));
}

type Linha = { setor: string; carga: number; medicos: number; porMedico: number; cor: Cor };

/** Linhas do painel com a carga por médico arredondada a uma casa, como na exibição. */
const linhasDoPainel = (painel: Painel) =>
  painel.setores
    .filter((s) => s.estado === 'calculado')
    .map((s) => ({
      setor: s.nome,
      carga: s.carga,
      medicos: s.medicos,
      porMedico: Math.round((s.cargaPorMedico as number) * 10) / 10,
      cor: corDoSetor(s),
    }))
    .sort((a, b) => b.porMedico - a.porMedico || a.setor.localeCompare(b.setor));

/** Tabela de "Critérios de aceite" da SPEC-03, na ordem da spec. */
const SEMANA: Linha[] = [
  { setor: '4.3', carga: 23, medicos: 2, porMedico: 11.5, cor: 'amarelo' },
  { setor: '4.2', carga: 28, medicos: 2.5, porMedico: 11.2, cor: 'amarelo' },
  { setor: '6.2', carga: 26, medicos: 2.5, porMedico: 10.4, cor: 'verde' },
  { setor: '4.4', carga: 20, medicos: 2, porMedico: 10, cor: 'verde' },
  { setor: '2º andar', carga: 27, medicos: 3, porMedico: 9, cor: 'verde' },
  { setor: '6.3', carga: 22, medicos: 2.5, porMedico: 8.8, cor: 'verde' },
  { setor: '4.5', carga: 16, medicos: 2, porMedico: 8, cor: 'azulClaro' },
  { setor: '6.1', carga: 12, medicos: 1.5, porMedico: 8, cor: 'azulClaro' },
];

/**
 * Fim de semana: 180 ÷ 8 = 22,5 de média, com a carga do 3.1 + 6.1 = 18 (SPEC-03, "Testes esperados").
 * As cores saem da regra da spec aplicada à diferença exata.
 */
const FIM_DE_SEMANA: Linha[] = [
  { setor: '4.2', carga: 28, medicos: 1, porMedico: 28, cor: 'vermelho' },
  { setor: '2º andar', carga: 27, medicos: 1, porMedico: 27, cor: 'vermelho' },
  { setor: '6.2', carga: 26, medicos: 1, porMedico: 26, cor: 'vermelho' },
  { setor: '4.3', carga: 23, medicos: 1, porMedico: 23, cor: 'verde' },
  { setor: '6.3', carga: 22, medicos: 1, porMedico: 22, cor: 'verde' },
  { setor: '4.4', carga: 20, medicos: 1, porMedico: 20, cor: 'azulEscuro' },
  { setor: '3.1 + 6.1', carga: 18, medicos: 1, porMedico: 18, cor: 'azulEscuro' },
  { setor: '4.5', carga: 16, medicos: 1, porMedico: 16, cor: 'azulEscuro' },
];

describe.each(FIXTURES)('T-03.5 — aceitação com a amostra (%s)', (arquivo) => {
  it('semana: a tabela da spec bate, com média 174 ÷ 18', async () => {
    const painel = await painelDaFixture(arquivo, 'semana');
    expect(linhasDoPainel(painel)).toEqual(SEMANA);
    expect(painel.cargaTotal).toBe(174);
    expect(painel.medicosTotal).toBe(18);
    expect(painel.media).toBeCloseTo(174 / 18, 10);
    expect(Math.round((painel.media as number) * 100) / 100).toBe(9.67);
  });

  it('semana: o 3.1 aparece como escala própria, com as contagens e sem cor', async () => {
    const painel = await painelDaFixture(arquivo, 'semana');
    const setor31 = painel.setores.find((s) => s.id === '3.1');
    expect(setor31).toMatchObject({ estado: 'escalaPropria', carga: 6, cargaPorMedico: null, diferenca: null });
    expect(corDoSetor(setor31!)).toBeNull();
  });

  it('semana e fim de semana: o 2.3 zerado fica oculto e não há avisos', async () => {
    for (const tipoDia of ['semana', 'fimDeSemana'] as const) {
      const painel = await painelDaFixture(arquivo, tipoDia);
      expect(painel.postosOcultos).toEqual(['2.3']);
      expect(painel.avisos).toEqual([]);
      expect(painel.setores.some((s) => s.estado === 'semMedico' || s.estado === 'vazio')).toBe(false);
    }
  });

  it('fim de semana: 3.1 + 6.1 = 18 e média 180 ÷ 8', async () => {
    const painel = await painelDaFixture(arquivo, 'fimDeSemana');
    expect(linhasDoPainel(painel)).toEqual(FIM_DE_SEMANA);
    expect(painel.cargaTotal).toBe(180);
    expect(painel.medicosTotal).toBe(8);
    expect(painel.media).toBe(22.5);
  });
});
