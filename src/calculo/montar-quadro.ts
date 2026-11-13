/**
 * Monta o quadro do dia: junta os postos do relatório nos setores do quadro padrão, aplica os ajustes e
 * separa os postos fora do quadro (SPEC-03, "Comportamento esperado" e "Casos de borda"; PRD §6.2).
 *
 * Puro e determinístico: não altera a entrada nem o quadro padrão.
 */
import { QUADROS_PADRAO } from '../config/quadros';
import { textos } from '../textos';
import { PESO_DO_RESIDENTE } from './residente';
import type {
  Ajustes,
  AvisoQuadro,
  ContagemDoPosto,
  Contagens,
  QuadroMontado,
  Setor,
  SetorMontado,
  TipoDia,
} from './tipos';

const ZERO: Contagens = { hospitalistas: 0, cardioGeriatria: 0, potenciaisAdmissoes: 0 };
const CAMPOS = ['hospitalistas', 'cardioGeriatria', 'potenciaisAdmissoes'] as const;

const somar = (a: Contagens, b: Contagens): Contagens => ({
  hospitalistas: a.hospitalistas + b.hospitalistas,
  cardioGeriatria: a.cardioGeriatria + b.cardioGeriatria,
  potenciaisAdmissoes: a.potenciaisAdmissoes + b.potenciaisAdmissoes,
});

const zerado = (c: Contagens) => CAMPOS.every((campo) => c[campo] === 0);

function validarMedicos(setor: string, medicos: number): number {
  if (!Number.isFinite(medicos) || medicos < 0 || !Number.isInteger(medicos * 2)) {
    throw new RangeError(`Médicos do setor ${setor}: ${medicos} não é ≥ 0 em passos de 0,5.`);
  }
  return medicos;
}

function validarContagem(posto: string, campo: string, valor: number): number {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new RangeError(`Contagem "${campo}" do posto ${posto}: ${valor} não é um inteiro ≥ 0.`);
  }
  return valor;
}

/**
 * Contagens por posto, na ordem do relatório e depois na dos ajustes. Se o mesmo posto vier repetido,
 * vale a primeira linha, como na leitura (SPEC-02).
 */
export function contagensPorPosto(postos: readonly ContagemDoPosto[], ajustes: Ajustes): Map<string, Contagens> {
  const porPosto = new Map<string, Contagens>();
  for (const { codigo, hospitalistas, cardioGeriatria, potenciaisAdmissoes } of postos) {
    if (!porPosto.has(codigo)) porPosto.set(codigo, { hospitalistas, cardioGeriatria, potenciaisAdmissoes });
  }
  for (const [codigo, ajuste] of Object.entries(ajustes.contagens ?? {})) {
    const corrigido = { ...(porPosto.get(codigo) ?? ZERO) };
    for (const campo of CAMPOS) {
      const valor = ajuste[campo];
      if (valor !== undefined) corrigido[campo] = validarContagem(codigo, campo, valor);
    }
    porPosto.set(codigo, corrigido);
  }
  return porPosto;
}

export function montarQuadro(
  postos: readonly ContagemDoPosto[],
  tipoDia: TipoDia,
  ajustes: Ajustes = {},
): QuadroMontado {
  const porPosto = contagensPorPosto(postos, ajustes);
  const medicosAjustados = ajustes.medicos ?? {};
  const medicosDe = (id: string, padrao: number) =>
    Object.hasOwn(medicosAjustados, id) ? validarMedicos(id, medicosAjustados[id] as number) : padrao;
  const residentes = ajustes.residentes ?? {};
  /** Médicos da escala, residente e médicos na conta. O residente não entra na escala própria. */
  const equipe = (id: string, padrao: number, modo: Setor['modo']) => {
    const medicosDaEscala = medicosDe(id, padrao);
    const residente = modo === 'calculado' && residentes[id] === true;
    return { medicosDaEscala, residente, medicos: medicosDaEscala + (residente ? PESO_DO_RESIDENTE : 0) };
  };

  const avisos: AvisoQuadro[] = [];
  const noQuadro = new Set<string>();

  const setores: SetorMontado[] = QUADROS_PADRAO[tipoDia].setores.map((setor) => {
    let contagens = ZERO;
    const postosAusentes: string[] = [];
    for (const codigo of setor.postos) {
      noQuadro.add(codigo);
      const doPosto = porPosto.get(codigo);
      if (doPosto) {
        contagens = somar(contagens, doPosto);
      } else {
        postosAusentes.push(codigo);
        avisos.push({
          tipo: 'posto-ausente',
          posto: codigo,
          setor: setor.id,
          mensagem: textos.quadro.avisos.postoAusente({ posto: codigo, setor: setor.nome }),
        });
      }
    }
    return { ...setor, ...equipe(setor.id, setor.medicos, setor.modo), contagens, postosAusentes };
  });

  const postosOcultos: string[] = [];
  for (const [codigo, contagens] of porPosto) {
    if (noQuadro.has(codigo)) continue;
    if (zerado(contagens)) {
      postosOcultos.push(codigo);
      continue;
    }
    setores.push({
      id: codigo,
      nome: codigo,
      postos: [codigo],
      ...equipe(codigo, 0, 'calculado'),
      modo: 'calculado',
      contagens,
      postosAusentes: [],
    });
    avisos.push({
      tipo: 'posto-fora-do-quadro',
      posto: codigo,
      mensagem: textos.quadro.avisos.postoForaDoQuadro(codigo),
    });
  }

  return { tipoDia, setores, postosOcultos, avisos };
}
