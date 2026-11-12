/**
 * Quadros padrão de setores e médicos (SPEC-03, "Quadros padrão"; PRD §6.2).
 *
 * O 4.1 é atendido junto do 4.2, e o 2.3 está fechado, por isso fica fora dos dois quadros.
 */
import type { Quadro, TipoDia } from '../calculo/tipos';

const semana: Quadro = {
  tipoDia: 'semana',
  setores: [
    { id: '2', nome: '2º andar', postos: ['2.1', '2.2'], medicos: 3, modo: 'calculado' },
    { id: '3.1', nome: '3.1', postos: ['3.1'], medicos: 0, modo: 'escalaPropria' },
    { id: '4.2', nome: '4.2', postos: ['4.2', '4.1'], medicos: 2.5, modo: 'calculado' },
    { id: '4.3', nome: '4.3', postos: ['4.3'], medicos: 2, modo: 'calculado' },
    { id: '4.4', nome: '4.4', postos: ['4.4'], medicos: 2, modo: 'calculado' },
    { id: '4.5', nome: '4.5', postos: ['4.5'], medicos: 2, modo: 'calculado' },
    { id: '6.1', nome: '6.1', postos: ['6.1'], medicos: 1.5, modo: 'calculado' },
    { id: '6.2', nome: '6.2', postos: ['6.2'], medicos: 2.5, modo: 'calculado' },
    { id: '6.3', nome: '6.3', postos: ['6.3'], medicos: 2.5, modo: 'calculado' },
  ],
};

const fimDeSemana: Quadro = {
  tipoDia: 'fimDeSemana',
  setores: [
    { id: '2', nome: '2º andar', postos: ['2.1', '2.2'], medicos: 1, modo: 'calculado' },
    { id: '3.1+6.1', nome: '3.1 + 6.1', postos: ['3.1', '6.1'], medicos: 1, modo: 'calculado' },
    { id: '4.2', nome: '4.2', postos: ['4.2', '4.1'], medicos: 1, modo: 'calculado' },
    { id: '4.3', nome: '4.3', postos: ['4.3'], medicos: 1, modo: 'calculado' },
    { id: '4.4', nome: '4.4', postos: ['4.4'], medicos: 1, modo: 'calculado' },
    { id: '4.5', nome: '4.5', postos: ['4.5'], medicos: 1, modo: 'calculado' },
    { id: '6.2', nome: '6.2', postos: ['6.2'], medicos: 1, modo: 'calculado' },
    { id: '6.3', nome: '6.3', postos: ['6.3'], medicos: 1, modo: 'calculado' },
  ],
};

export const QUADROS_PADRAO: Readonly<Record<TipoDia, Quadro>> = { semana, fimDeSemana };
