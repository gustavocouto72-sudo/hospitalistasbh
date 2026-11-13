import { describe, expect, it } from 'vitest';
import { calcularCarga } from './calcular-carga';
import { montarQuadro } from './montar-quadro';
import { PESO_DO_RESIDENTE } from './residente';
import type { ContagemDoPosto } from './tipos';

const posto = (codigo: string, hospitalistas: number): ContagemDoPosto => ({
  codigo,
  hospitalistas,
  cardioGeriatria: 0,
  potenciaisAdmissoes: 0,
});

const POSTOS = ['2.1', '2.2', '3.1', '4.2', '4.3', '4.4', '4.5', '6.1', '6.2', '6.3'].map((c) => posto(c, 10));

describe('residente', () => {
  it('conta como meio médico', () => {
    expect(PESO_DO_RESIDENTE).toBe(0.5);
  });

  it('marcado, soma meio médico ao setor e guarda os médicos da escala à parte', () => {
    const quadro = montarQuadro(POSTOS, 'fimDeSemana', { residentes: { '4.3': true } });
    const s43 = quadro.setores.find((s) => s.id === '4.3')!;
    expect(s43.residente).toBe(true);
    expect(s43.medicosDaEscala).toBe(1);
    expect(s43.medicos).toBe(1.5);
    const s44 = quadro.setores.find((s) => s.id === '4.4')!;
    expect(s44.residente).toBe(false);
    expect(s44.medicos).toBe(1);
    expect(s44.medicosDaEscala).toBe(1);
  });

  it('soma por cima dos médicos ajustados', () => {
    const quadro = montarQuadro(POSTOS, 'semana', { medicos: { '4.3': 3 }, residentes: { '4.3': true } });
    const s43 = quadro.setores.find((s) => s.id === '4.3')!;
    expect(s43.medicosDaEscala).toBe(3);
    expect(s43.medicos).toBe(3.5);
  });

  it('desmarcado ou ausente, não muda nada', () => {
    const sem = montarQuadro(POSTOS, 'fimDeSemana', {});
    const desmarcado = montarQuadro(POSTOS, 'fimDeSemana', { residentes: { '4.3': false } });
    expect(desmarcado.setores).toEqual(sem.setores);
  });

  it('é ignorado na escala própria', () => {
    const quadro = montarQuadro(POSTOS, 'semana', { residentes: { '3.1': true } });
    const s31 = quadro.setores.find((s) => s.id === '3.1')!;
    expect(s31.residente).toBe(false);
    expect(s31.medicos).toBe(0);
  });

  it('entra na carga por médico e na média do dia', () => {
    // Fim de semana: 8 setores com 1 médico; 180 pacientes nos postos acima viram 100 de hospitalistas.
    const sem = calcularCarga(montarQuadro(POSTOS, 'fimDeSemana', {}));
    const com = calcularCarga(montarQuadro(POSTOS, 'fimDeSemana', { residentes: { '4.3': true } }));
    expect(com.medicosTotal).toBe(sem.medicosTotal + 0.5);
    expect(com.media).toBeCloseTo(com.cargaTotal / com.medicosTotal);
    expect(com.setores.find((s) => s.id === '4.3')!.cargaPorMedico).toBeCloseTo(10 / 1.5);
  });

  it('um setor sem médico da escala e com residente passa a ter carga por médico', () => {
    const quadro = montarQuadro(POSTOS, 'fimDeSemana', { medicos: { '4.3': 0 }, residentes: { '4.3': true } });
    const s43 = calcularCarga(quadro).setores.find((s) => s.id === '4.3')!;
    expect(s43.estado).toBe('calculado');
    expect(s43.cargaPorMedico).toBe(20);
  });
});
