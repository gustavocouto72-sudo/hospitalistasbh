import type { MotivoContagemInvalida } from '../relatorio/numeros';

const MOTIVO: Record<MotivoContagemInvalida, string> = {
  vazio: 'está vazio',
  texto: 'não é um número',
  negativo: 'é negativo',
  decimal: 'tem casas decimais, e a contagem precisa ser um número inteiro',
};

export const textos = {
  app: {
    titulo: 'Divisão de carga dos hospitalistas',
  },
  leitura: {
    erros: {
      semPostos: 'Relatório sem postos: o arquivo não traz nenhuma linha de posto para ler.',
      colunaAusente: (coluna: string) => `Falta a coluna "${coluna}" no cabeçalho do relatório.`,
      numeroInvalido: (d: {
        linha: number;
        posto: string;
        coluna: string;
        valor: string;
        motivo: MotivoContagemInvalida;
      }) =>
        `Linha ${d.linha} (${d.posto}): o valor ${d.valor === '' ? 'da coluna' : `"${d.valor}" da coluna`} "${d.coluna}" ${MOTIVO[d.motivo]}.`,
      postoDuplicado: (d: { codigo: string; linha: number; primeiraLinha: number }) =>
        `Linha ${d.linha}: o posto ${d.codigo} já apareceu na linha ${d.primeiraLinha}. Vale só a primeira.`,
      postoSemNome: (linha: number) => `Linha ${linha}: falta o nome do posto.`,
      xlsxIlegivel:
        'Não foi possível ler a planilha .xlsx. Confira se o arquivo abre no Excel ou envie o relatório exportado pelo TASY.',
    },
    avisos: {
      postoForaDoPadrao: (posto: string) =>
        `O nome "${posto}" não segue o padrão "Posto N - Aº PAV". O posto entrou com o nome original como código, que pode ser editado.`,
      potenciaisMaior: (d: { codigo: string; potenciaisAdmissoes: number; hospitalistas: number }) =>
        `Posto ${d.codigo}: ${d.potenciaisAdmissoes} potenciais admissões, mais que os ${d.hospitalistas} pacientes dos hospitalistas.`,
    },
  },
  quadro: {
    avisos: {
      postoAusente: (d: { posto: string; setor: string }) =>
        `O posto ${d.posto} não veio no relatório. O setor ${d.setor} ficou sem as contagens dele; digite-as se precisar.`,
      postoForaDoQuadro: (posto: string) =>
        `O posto ${posto} está fora do quadro e veio com pacientes. Ele entrou como setor sem médico.`,
    },
  },
} as const;
