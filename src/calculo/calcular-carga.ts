/**
 * Calcula a carga do dia: carga e carga por médico de cada setor, média do dia e diferença para a média
 * (SPEC-03, `calcularCarga`; PRD §6.3).
 *
 * Puro e determinístico. As contas usam números exatos; o arredondamento é só na exibição.
 */
import { textos } from '../textos';
import type { AvisoPainel, EstadoSetor, Painel, QuadroMontado, SetorMontado } from './tipos';

function estadoDe(setor: SetorMontado, carga: number): EstadoSetor {
  if (setor.modo === 'escalaPropria') return 'escalaPropria';
  if (setor.medicos > 0) return 'calculado';
  return carga > 0 ? 'semMedico' : 'vazio';
}

function cargaPorMedicoDe(estado: EstadoSetor, carga: number, medicos: number): number | null {
  if (estado === 'calculado') return carga / medicos;
  if (estado === 'semMedico') return Number.POSITIVE_INFINITY;
  return null;
}

export function calcularCarga(quadro: QuadroMontado): Painel {
  const comCarga = quadro.setores.map((setor) => {
    const carga = setor.contagens.hospitalistas;
    const estado = estadoDe(setor, carga);
    return { ...setor, estado, carga, cargaPorMedico: cargaPorMedicoDe(estado, carga, setor.medicos) };
  });

  let cargaTotal = 0;
  let medicosTotal = 0;
  for (const setor of comCarga) {
    if (setor.modo !== 'calculado') continue;
    cargaTotal += setor.carga;
    medicosTotal += setor.medicos;
  }
  const media = medicosTotal > 0 ? cargaTotal / medicosTotal : null;

  const setores = comCarga.map((setor) => ({
    ...setor,
    diferenca: setor.cargaPorMedico === null || media === null ? null : setor.cargaPorMedico - media,
  }));

  const avisos: AvisoPainel[] = [...quadro.avisos];
  if (media === null) avisos.push({ tipo: 'media-indefinida', mensagem: textos.painel.avisos.mediaIndefinida });

  return {
    tipoDia: quadro.tipoDia,
    setores,
    postosOcultos: quadro.postosOcultos,
    cargaTotal,
    medicosTotal,
    media,
    avisos,
  };
}
