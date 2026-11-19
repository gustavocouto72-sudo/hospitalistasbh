import { MARGEM_DO_AMARELO, MARGEM_DO_VERDE } from '../calculo/semaforo';
import type { MotivoContagemInvalida } from '../relatorio/numeros';

const DATA_POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const COM_SINAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

/** Número com uma casa decimal, no máximo: "6,7", "18", "2,5". */
const numero = (valor: number) => NUMERO.format(valor);
/** Limites das faixas do semáforo, como aparecem na legenda: "1,5" e "2,5". */
const MARGENS = { verde: numero(MARGEM_DO_VERDE), amarelo: numero(MARGEM_DO_AMARELO) };

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
  topo: {
    /** "Quinta-feira, 12 de novembro de 2026". */
    data: (data: Date) => {
      const texto = DATA_POR_EXTENSO.format(data);
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },
    tipoDia: {
      legenda: 'Tipo de dia',
      semana: 'Dia de semana',
      fimDeSemana: 'Fim de semana',
    },
  },
  quadroPadrao: {
    titulo: 'Médicos por setor',
    setor: 'Setor',
    postos: 'Postos',
    medicos: 'Médicos',
    escalaPropria: 'Escala própria',
    totalMedicos: 'Total de médicos',
    juntarPostos: (postos: readonly string[]) => postos.join(' + '),
    numero: (valor: number) => NUMERO.format(valor),
  },
  semaforo: {
    azulEscuro: 'Muito abaixo da média',
    azulClaro: 'Abaixo da média',
    verde: 'Na média',
    amarelo: 'Acima da média',
    vermelho: 'Sobrecarregado',
    semMedico: 'Sem médico',
    vazio: 'Sem pacientes',
    escalaPropria: 'Escala própria',
  },
  cartao: {
    titulo: 'Setores',
    numero,
    /** "+1,8", "−0,4" ou "0,0", com o sinal de menos tipográfico. */
    diferenca: (valor: number) => COM_SINAL.format(valor).replace('-', '−'),
    porMedico: 'pacientes por médico',
    daMedia: 'da média',
    semMedico: (pacientes: number) => `${pacientes === 1 ? 'paciente' : 'pacientes'} sem médico`,
    pacientes: (pacientes: number) => (pacientes === 1 ? 'paciente' : 'pacientes'),
    medicos: 'Médicos',
    menosMedico: (setor: string) => `Tirar meio médico do ${setor}`,
    maisMedico: (setor: string) => `Pôr meio médico no ${setor}`,
    posto: 'Posto',
    linhas: {
      hospitalistas: 'Hospitalistas',
      cardioGeriatria: 'Cardio e geriatria',
      potenciaisAdmissoes: 'Potenciais admissões',
    },
    campo: {
      hospitalistas: (posto: string) => `Pacientes dos hospitalistas no posto ${posto}`,
      cardioGeriatria: (posto: string) => `Pacientes da cardiologia e da geriatria no posto ${posto}`,
      potenciaisAdmissoes: (posto: string) => `Potenciais admissões no posto ${posto}`,
    },
    campoInvalido: 'Digite um número inteiro, de 0 para cima.',
    escalaPropriaNota: 'Fora da média do dia e do semáforo.',
    postoAusente: (posto: string) => `O posto ${posto} não veio no relatório.`,
    foraDoQuadro: 'Posto fora do quadro, entrou como setor sem médico.',
    ocultos: {
      resumo: (n: number) => (n === 1 ? '1 posto oculto, zerado' : `${n} postos ocultos, zerados`),
      explicacao: 'Postos fora do quadro que vieram sem pacientes.',
      lista: (postos: readonly string[]) => postos.join(', '),
    },
  },
  planilha: {
    titulo: 'Carga por setor',
    colunas: {
      setor: 'Setor',
      medicos: 'Médicos',
      residente: 'Residente',
      pacientes: 'Pacientes',
      cardioGeriatria: 'Cardio/geri',
      potenciaisAdmissoes: 'Pot. admissões',
      porMedico: 'Por médico',
      diferenca: 'vs. média',
      situacao: 'Situação',
      comApoio: 'Com apoio',
    },
    grupoSemApoio: 'Sem apoio',
    grupoComApoio: 'Com a recomendação',
    total: 'Total',
    media: (valor: string) => `média ${valor}`,
    semDados: 'Suba o relatório 9998 ou preencha à mão para ver a carga de cada setor.',
    editar: 'Editar cardio/geri e admissões',
    noRelatorio: (valor: number) => `relatório: ${valor}`,
    somaDoSetor: (valor: string) => `soma ${valor}`,
    pronto: 'Pronto',
    escalaPropria: 'Escala própria',
    residenteNo: (setor: string) => `Residente no ${setor}`,
    apoia: (setor: string, leitos: number) => `apoia ${setor} (${leitos})`,
    apoiado: (setor: string, leitos: number) => `apoio do ${setor} (${leitos})`,
  },
  legenda: {
    titulo: 'Legenda do semáforo',
    faixa: {
      azulEscuro: `(< −${MARGENS.amarelo})`,
      azulClaro: `(−${MARGENS.amarelo} a −${MARGENS.verde})`,
      verde: `(±${MARGENS.verde})`,
      amarelo: `(+${MARGENS.verde} a +${MARGENS.amarelo})`,
      vermelho: `(> +${MARGENS.amarelo})`,
    },
  },
  recomendacao: {
    titulo: 'Recomendação de apoio',
    nenhuma: 'Nenhum apoio necessário: todos os setores estão na média.',
    semMedia: 'Sem média do dia, não há recomendação.',
    semDados: 'A recomendação aparece depois do relatório.',
    nota: 'Já aplicada na coluna “Com apoio”. Edite os leitos, troque quem apoia ou remova.',
  },
  resumo: {
    titulo: 'Resumo do dia',
    media: 'Média por médico',
    medicos: 'Médicos',
    residentes: 'Residentes',
    pacientes: 'Pacientes',
    cores: 'Setores por cor',
    setores: (n: number) => (n === 1 ? '1 setor' : `${n} setores`),
  },
  subir: {
    titulo: 'Relatório do dia',
    instrucao: 'Arraste o relatório 9998 do TASY até aqui',
    soltar: 'Solte para ler o relatório',
    ou: 'ou',
    escolher: 'Escolher arquivo',
    trocar: 'Escolher outro arquivo',
    formatos: 'Aceita .xls, .csv e .xlsx.',
    arrastar: 'Também dá para arrastar o arquivo (.xls, .csv ou .xlsx) para qualquer lugar da página.',
    privacidade: 'O arquivo é lido só neste aparelho. Nada é enviado nem guardado.',
    semRelatorio: 'Sem o relatório?',
    preencherAMao: 'Preencher à mão',
    resumo: {
      lido: (d: { nome: string; postos: number }) =>
        `${d.nome}: ${d.postos} ${d.postos === 1 ? 'posto lido' : 'postos lidos'}.`,
      nenhumPosto: (nome: string) => `${nome}: nenhum posto pôde ser lido. Veja os erros abaixo.`,
      manual: 'Preenchimento à mão: a planilha começa zerada; digite as contagens de cada posto.',
      lendo: (nome: string) => `Lendo ${nome}…`,
    },
    erros: {
      extensao: (nome: string) =>
        `O arquivo "${nome}" não é .xls, .csv nem .xlsx. Escolha o relatório 9998 exportado pelo TASY.`,
      ilegivel: 'Não foi possível abrir o arquivo neste aparelho. Tente escolher de novo.',
    },
    mensagens: {
      erros: (n: number) => (n === 1 ? '1 erro' : `${n} erros`),
      avisos: (n: number) => (n === 1 ? '1 aviso' : `${n} avisos`),
      ajudaErros: 'As linhas com erro ficaram de fora. Corrija o arquivo e suba de novo, ou digite as contagens.',
      ajudaAvisos: 'Os avisos não impedem a leitura. Confira os números antes de seguir.',
    },
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
  painel: {
    avisos: {
      mediaIndefinida:
        'Nenhum setor tem médicos, então não há média do dia. Informe os médicos de cada setor para calcular a carga.',
    },
  },
  imprimir: {
    botao: 'Imprimir ou gerar PDF',
    nota: 'Sai a folha do dia com a recomendação. Para o PDF, escolha “Salvar como PDF” no navegador.',
  },
  folha: {
    titulo: 'Divisão dos hospitalistas',
    /** "Gerada em 12/11/2026 às 09:05". */
    geradaEm: (data: Date) => `Gerada em ${DATA_CURTA.format(data)} às ${HORA.format(data)}`,
    tipoDia: 'Tipo de dia',
    tabela: 'Carga por setor',
    colunas: {
      setor: 'Setor',
      postos: 'Postos',
      medicos: 'Médicos',
      pacientes: 'Pacientes',
      antes: 'Por médico antes',
      depois: 'Por médico depois',
      cor: 'Semáforo',
    },
    semConta: '—',
    comResidente: (medicos: string) => `${medicos} + residente`,
    apoios: 'Apoios',
    semApoios: 'Nenhum apoio.',
    media: 'Média do dia',
    medicos: 'Médicos',
    pacientes: 'Pacientes',
    gerado: (endereco: string) => `Gerado em ${endereco}. Nenhum dado foi guardado.`,
  },
  apoio: {
    erros: {
      leitosInvalidos: (d: { de: string; para: string; leitos: number }) =>
        `Apoio do ${d.de} ao ${d.para}: ${d.leitos} leitos não é um número inteiro maior que zero.`,
      mesmoSetor: (setor: string) => `O setor ${setor} não pode apoiar a si mesmo.`,
      setorInexistente: (setor: string) => `O setor ${setor} não está no quadro do dia.`,
      escalaPropria: (setor: string) => `O setor ${setor} tem escala própria e não entra em apoios.`,
      apoiadorSemMedico: (setor: string) => `O setor ${setor} está sem médico e não pode apoiar outro setor.`,
      apoiadorEApoiado: (setor: string) => `O setor ${setor} não pode apoiar e ser apoiado ao mesmo tempo.`,
      cedeDemais: (d: { setor: string; cedidos: number; carga: number }) =>
        `O setor ${d.setor} cederia ${d.cedidos} leitos, mas tem só ${d.carga} pacientes.`,
    },
    avisos: {
      nemTodosNoVerde: 'Nem todos os setores cabem no verde hoje.',
    },
    lista: {
      titulo: 'Apoio entre setores',
      leitos: (n: number) => (n === 1 ? '1 leito' : `${n} leitos`),
      palavraLeitos: (n: number) => (n === 1 ? 'leito' : 'leitos'),
      apoia: 'apoia',
      do: 'do',
      /** "4.5 apoia 3 leitos do 4.3", para leitores de tela e rótulos. */
      frase: (d: { de: string; para: string; leitos: number }) =>
        `${d.de} apoia ${d.leitos === 1 ? '1 leito' : `${d.leitos} leitos`} do ${d.para}`,
      sugerido: 'Sugestão',
      aceito: 'Aceito',
      aceitar: 'Aceitar',
      aceitarRotulo: (frase: string) => `Aceitar: ${frase}`,
      leitosRotulo: 'Leitos',
      menosLeito: (frase: string) => `Tirar um leito: ${frase}`,
      maisLeito: (frase: string) => `Pôr um leito: ${frase}`,
      apoiador: 'Quem apoia',
      trocarRotulo: (para: string) => `Setor que apoia o ${para}`,
      remover: 'Remover',
      removerRotulo: (frase: string) => `Remover: ${frase}`,
      vazio: 'Nenhum apoio sugerido: todos os setores já estão no verde.',
      semMedia: 'Sem média do dia, não há sugestão de apoio.',
      incompleto: 'A sugestão é a que chega mais perto do verde. Ajuste os médicos ou os apoios se precisar.',
      vista: {
        legenda: 'Carga nos cartões',
        antes: 'Antes',
        depois: 'Depois',
        notaAntes: 'Os cartões mostram a carga sem apoio.',
        notaDepois: (n: number) =>
          n === 0
            ? 'Nenhum apoio aceito ainda: os cartões mostram a carga sem apoio.'
            : `Os cartões mostram a carga com ${n === 1 ? 'o apoio aceito' : `os ${n} apoios aceitos`}.`,
      },
      adicionar: {
        abrir: 'Adicionar apoio',
        titulo: 'Novo apoio',
        apoiador: 'Setor que apoia',
        apoiado: 'Setor apoiado',
        leitos: 'Leitos',
        confirmar: 'Adicionar',
        cancelar: 'Cancelar',
        semSetores: 'Não há setores que possam apoiar ou receber apoio no quadro de hoje.',
      },
      notaCartao: {
        apoia: (d: { para: string; leitos: number }) =>
          `Apoia ${d.leitos === 1 ? '1 leito' : `${d.leitos} leitos`} do ${d.para}.`,
        apoiado: (d: { de: string; leitos: number }) =>
          `${d.leitos === 1 ? '1 leito apoiado' : `${d.leitos} leitos apoiados`} pelo ${d.de}.`,
      },
    },
  },
} as const;
