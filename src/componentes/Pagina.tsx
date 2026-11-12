'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { chaveDoDia, dataDaChave, tipoDiaPadrao } from '@/calculo/tipo-dia';
import type { TipoDia } from '@/calculo/tipos';
import { textos } from '@/textos';
import {
  ENTRADA_INICIAL,
  concluirLeitura,
  descartarContagens,
  iniciarLeitura,
  lerArquivo,
  postosDaFonte,
  preencherAMao,
} from './entrada';
import {
  ESTADO_INICIAL,
  ajustarContagem,
  ajustarMedicos,
  escolherTipoDia,
  quadroDoDia,
  tipoDiaAtual,
} from './estado-dia';
import {
  APOIOS_INICIAL,
  aceitarApoio,
  adicionarApoio,
  apoiosAceitos,
  editarLeitos,
  escolherVista,
  listaDeApoios,
  painelDaVista,
  removerApoio,
  sugestaoDoDia,
  trocarApoiador,
} from './apoios-dia';
import { BotaoImprimir } from './BotaoImprimir';
import { FolhaImpressao } from './FolhaImpressao';
import { ListaApoios } from './ListaApoios';
import { painelDoDia } from './painel-dia';
import { QuadroPadrao } from './QuadroPadrao';
import { QuadroSetores } from './QuadroSetores';
import { ResumoDia } from './ResumoDia';
import { SubirRelatorio } from './SubirRelatorio';
import { Topo } from './Topo';

// O site é estático: o dia de hoje só existe no aparelho. No HTML gerado no build ele é `null`, e o React
// troca pelo dia local logo ao abrir a página, sem erro de hidratação. O dia fica fixo enquanto a página está
// aberta, para o quadro não mudar sozinho à meia-noite.
const semAssinatura = () => () => undefined;
const chaveDeHoje = () => chaveDoDia(new Date());
const semDia = () => null;
// Endereço do site para o rodapé da folha impressa; vazio no HTML do build.
const enderecoDoSite = () => window.location.host;
const semEndereco = () => '';

export function Pagina() {
  const chave = useSyncExternalStore(semAssinatura, chaveDeHoje, semDia);
  const hoje = chave ? dataDaChave(chave) : null;
  const padrao = hoje ? tipoDiaPadrao(hoje) : null;

  const endereco = useSyncExternalStore(semAssinatura, enderecoDoSite, semEndereco);
  // Hora em que a folha foi gerada: a da abertura da página, renovada a cada impressão.
  const [geradaEm, setGeradaEm] = useState<Date | null>(null);
  useEffect(() => {
    const renovar = () => flushSync(() => setGeradaEm(new Date()));
    // Na montagem, sem flushSync: o React já está renderizando e reclamaria.
    setGeradaEm(new Date());
    window.addEventListener('beforeprint', renovar);
    return () => window.removeEventListener('beforeprint', renovar);
  }, []);

  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const tipoDia = tipoDiaAtual(estado, padrao);
  const quadro = quadroDoDia(tipoDia);

  // A fonte das contagens: o relatório subido ou o preenchimento à mão.
  const [entrada, setEntrada] = useState(ENTRADA_INICIAL);
  // Apoios aceitos, editados e adicionados, e a vista Antes/Depois. Valem para o quadro e a fonte em uso.
  const [apoios, setApoios] = useState(APOIOS_INICIAL);
  // Só a última leitura pedida vale: um arquivo lento não sobrescreve outro escolhido depois.
  const ultimaLeitura = useRef(0);

  async function escolherArquivo(arquivo: File) {
    const vez = ++ultimaLeitura.current;
    setEntrada((atual) => iniciarLeitura(atual, arquivo.name));
    const resultado = await lerArquivo(arquivo);
    if (vez !== ultimaLeitura.current) return;
    setEntrada((atual) => concluirLeitura(atual, resultado));
    if (resultado.tipo === 'relatorio') {
      setEstado(descartarContagens);
      setApoios(APOIOS_INICIAL);
    }
  }

  function abrirAMao() {
    ultimaLeitura.current++;
    setEntrada(preencherAMao());
    setEstado(descartarContagens);
    setApoios(APOIOS_INICIAL);
  }

  function trocarTipoDia(tipo: TipoDia) {
    if (tipo === tipoDia) return;
    setEstado((atual) => escolherTipoDia(atual, tipo, padrao));
    // Os apoios ligam setores do quadro anterior, que muda com o tipo de dia.
    setApoios(APOIOS_INICIAL);
  }

  // Os números se refazem a cada edição, sem botão "calcular".
  const { fonte } = entrada;
  const { ajustes } = estado;
  const painel = useMemo(
    () => (tipoDia && fonte.tipo !== 'nenhuma' ? painelDoDia(postosDaFonte(fonte), tipoDia, ajustes) : null),
    [fonte, tipoDia, ajustes],
  );
  const sugestao = useMemo(() => (painel ? sugestaoDoDia(painel) : null), [painel]);
  const postos = postosDaFonte(fonte);
  const lista = painel && sugestao ? listaDeApoios(painel, sugestao.apoios, apoios) : [];
  const vistaPainel = painel ? painelDaVista(painel, lista, apoios.vista) : null;
  const aplicados = apoios.vista === 'depois' ? apoiosAceitos(lista) : [];

  const imprimivel = painel && tipoDia && geradaEm && fonte.tipo !== 'nenhuma';

  return (
    <>
      <main
        className={`mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-8 ${imprimivel ? 'print:hidden' : ''}`}
      >
        <Topo hoje={hoje} tipoDia={tipoDia} aoEscolher={trocarTipoDia} />
        <SubirRelatorio entrada={entrada} aoEscolherArquivo={escolherArquivo} aoPreencherAMao={abrirAMao} />
        {painel && sugestao && vistaPainel && fonte.tipo !== 'nenhuma' ? (
          <>
            <ResumoDia painel={vistaPainel} />
            <ListaApoios
              painel={painel}
              lista={lista}
              completo={sugestao.completo}
              aviso={sugestao.aviso}
              vista={apoios.vista}
              aoAceitar={(apoio) => setApoios((atual) => aceitarApoio(atual, apoio))}
              aoEditarLeitos={(apoio, leitos) => setApoios((atual) => editarLeitos(atual, apoio, leitos))}
              aoTrocarApoiador={(apoio, de) => setApoios((atual) => trocarApoiador(atual, apoio, de))}
              aoRemover={(apoio) => setApoios((atual) => removerApoio(atual, apoio))}
              aoAdicionar={(apoio) => setApoios((atual) => adicionarApoio(atual, apoio))}
              aoEscolherVista={(vista) => setApoios((atual) => escolherVista(atual, vista))}
            />
            {imprimivel ? <BotaoImprimir /> : null}
            <QuadroSetores
              painel={vistaPainel}
              postos={postos}
              ajustes={ajustes}
              fonte={fonte.tipo}
              apoios={aplicados}
              legenda={
                apoios.vista === 'antes'
                  ? textos.apoio.lista.vista.notaAntes
                  : textos.apoio.lista.vista.notaDepois(aplicados.length)
              }
              aoAjustarMedicos={(setor, semAjuste, sentido) =>
                setEstado((atual) => ajustarMedicos(atual, setor, semAjuste, sentido))
              }
              aoAjustarContagem={(posto, campo, valor) =>
                setEstado((atual) => ajustarContagem(atual, posto, campo, valor))
              }
            />
          </>
        ) : quadro ? (
          <QuadroPadrao quadro={quadro} />
        ) : null}
      </main>
      {imprimivel ? (
        <FolhaImpressao painel={painel} lista={lista} tipoDia={tipoDia} geradaEm={geradaEm} endereco={endereco} />
      ) : null}
    </>
  );
}
