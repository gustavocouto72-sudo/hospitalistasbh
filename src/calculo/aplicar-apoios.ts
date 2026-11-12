/**
 * Aplica apoios entre setores e recalcula a carga depois do apoio (SPEC-04, "Edição pela equipe"; PRD §6.4).
 *
 * - No apoiado: carga − leitos cedidos.
 * - No apoiador: carga + 1,25 × leitos recebidos.
 * - A diferença e a cor usam a média de antes do apoio, que não muda.
 *
 * Serve tanto à sugestão quanto à edição manual. Puro e determinístico; recusa apoios inválidos com
 * `RangeError`.
 */
import { textos } from '../textos';
import {
  PESO_DO_APOIO,
  type Apoio,
  type EstadoSetor,
  type Painel,
  type PainelComApoios,
  type SetorComApoio,
  type SetorNoPainel,
} from './tipos';

const erros = textos.apoio.erros;

function setorDoApoio(porId: ReadonlyMap<string, SetorNoPainel>, id: string): SetorNoPainel {
  const setor = porId.get(id);
  if (!setor) throw new RangeError(erros.setorInexistente(id));
  if (setor.estado === 'escalaPropria') throw new RangeError(erros.escalaPropria(id));
  return setor;
}

function validar(painel: Painel, apoios: readonly Apoio[]) {
  const porId = new Map(painel.setores.map((s) => [s.id, s]));
  const cedidos = new Map<string, number>();
  const recebidos = new Map<string, number>();

  for (const apoio of apoios) {
    if (!Number.isInteger(apoio.leitos) || apoio.leitos < 1) throw new RangeError(erros.leitosInvalidos(apoio));
    if (apoio.de === apoio.para) throw new RangeError(erros.mesmoSetor(apoio.de));
    const apoiador = setorDoApoio(porId, apoio.de);
    setorDoApoio(porId, apoio.para);
    if (apoiador.medicos <= 0) throw new RangeError(erros.apoiadorSemMedico(apoio.de));
    cedidos.set(apoio.para, (cedidos.get(apoio.para) ?? 0) + apoio.leitos);
    recebidos.set(apoio.de, (recebidos.get(apoio.de) ?? 0) + apoio.leitos);
  }

  for (const [id, total] of cedidos) {
    if (recebidos.has(id)) throw new RangeError(erros.apoiadorEApoiado(id));
    const carga = (porId.get(id) as SetorNoPainel).carga;
    if (total > carga) throw new RangeError(erros.cedeDemais({ setor: id, cedidos: total, carga }));
  }

  return { cedidos, recebidos };
}

function estadoDepois(setor: SetorNoPainel, carga: number): EstadoSetor {
  if (setor.estado === 'escalaPropria') return 'escalaPropria';
  if (setor.medicos > 0) return 'calculado';
  return carga > 0 ? 'semMedico' : 'vazio';
}

export function aplicarApoios(painel: Painel, apoios: readonly Apoio[]): PainelComApoios {
  const { cedidos, recebidos } = validar(painel, apoios);
  const { media } = painel;

  const setores = painel.setores.map((setor): SetorComApoio => {
    const leitosCedidos = cedidos.get(setor.id) ?? 0;
    const leitosRecebidos = recebidos.get(setor.id) ?? 0;
    const antes = {
      estado: setor.estado,
      carga: setor.carga,
      cargaPorMedico: setor.cargaPorMedico,
      diferenca: setor.diferenca,
    };
    if (leitosCedidos === 0 && leitosRecebidos === 0) {
      return { ...setor, antes, leitosCedidos, leitosRecebidos, pacientes: setor.carga };
    }

    const carga = setor.carga - leitosCedidos + PESO_DO_APOIO * leitosRecebidos;
    const estado = estadoDepois(setor, carga);
    const cargaPorMedico =
      estado === 'calculado' ? carga / setor.medicos : estado === 'semMedico' ? Number.POSITIVE_INFINITY : null;
    return {
      ...setor,
      estado,
      carga,
      cargaPorMedico,
      diferenca: cargaPorMedico === null || media === null ? null : cargaPorMedico - media,
      antes,
      leitosCedidos,
      leitosRecebidos,
      pacientes: setor.carga - leitosCedidos + leitosRecebidos,
    };
  });

  return { ...painel, setores, apoios: apoios.map((a) => ({ ...a })) };
}
