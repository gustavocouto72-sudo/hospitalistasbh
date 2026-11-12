/**
 * Conteúdo da folha de impressão (SPEC-06). Puro: a folha mostra o antes e o depois dos apoios em vigor,
 * os mesmos da coluna "Com apoio" da planilha.
 */
import { aplicarApoios } from '@/calculo/aplicar-apoios';
import type { Painel, SetorNoPainel } from '@/calculo/tipos';
import { textos } from '@/textos';
import { apoiosEmVigor, nomeDoSetor, type ItemDaLista } from './apoios-dia';
import { visualDoSetor, type VisualDoSetor } from './painel-dia';

export type LinhaDaFolha = {
  readonly id: string;
  readonly nome: string;
  readonly postos: string;
  readonly medicos: string;
  readonly pacientes: string;
  /** Pacientes por médico sem apoio e com os apoios em vigor. */
  readonly antes: string;
  readonly depois: string;
  /** Cor e rótulo do setor com os apoios em vigor. */
  readonly visual: VisualDoSetor;
};

export type FolhaDoDia = {
  readonly linhas: readonly LinhaDaFolha[];
  /** Apoios em vigor, em frases ("4.5 apoia 3 leitos do 4.3."). */
  readonly apoios: readonly string[];
  readonly media: string;
  readonly medicos: string;
  readonly pacientes: string;
};

const numero = textos.cartao.numero;

function porMedico(setor: Pick<SetorNoPainel, 'estado' | 'cargaPorMedico'>): string {
  if (setor.estado === 'semMedico') return textos.semaforo.semMedico;
  if (setor.cargaPorMedico === null) return textos.folha.semConta;
  return numero(setor.cargaPorMedico);
}

export function folhaDoDia(painel: Painel, lista: readonly ItemDaLista[]): FolhaDoDia {
  const emVigor = apoiosEmVigor(lista);
  const depois = aplicarApoios(painel, emVigor);
  const linhas = depois.setores.map((setor): LinhaDaFolha => ({
    id: setor.id,
    nome: setor.nome,
    postos: textos.quadroPadrao.juntarPostos(setor.postos),
    medicos: setor.estado === 'escalaPropria' ? textos.folha.semConta : numero(setor.medicos),
    pacientes: numero(setor.antes.carga),
    antes: porMedico(setor.antes),
    depois: porMedico(setor),
    visual: visualDoSetor(setor),
  }));
  const apoios = emVigor.map(
    (apoio) =>
      `${textos.apoio.lista.frase({ de: nomeDoSetor(painel, apoio.de), para: nomeDoSetor(painel, apoio.para), leitos: apoio.leitos })}.`,
  );
  return {
    linhas,
    apoios,
    media: painel.media === null ? textos.folha.semConta : numero(painel.media),
    medicos: numero(painel.medicosTotal),
    pacientes: numero(painel.cargaTotal),
  };
}
