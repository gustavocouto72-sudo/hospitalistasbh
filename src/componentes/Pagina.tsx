'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { chaveDoDia, dataDaChave, tipoDiaPadrao } from '@/calculo/tipo-dia';
import type { TipoDia } from '@/calculo/tipos';
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
  marcarResidente,
  tipoDiaAtual,
} from './estado-dia';
import {
  APOIOS_INICIAL,
  adicionarApoio,
  apoiosEmVigor,
  editarLeitos,
  listaDeApoios,
  painelComApoio,
  removerApoio,
  sugestaoDoDia,
  trocarApoiador,
} from './apoios-dia';
import { Cabecalho } from './Cabecalho';
import { FolhaImpressao } from './FolhaImpressao';
import { painelDoDia } from './painel-dia';
import { Planilha } from './Planilha';
import { Recomendacao } from './Recomendacao';

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

  // A fonte das contagens: o relatório subido ou o preenchimento à mão.
  const [entrada, setEntrada] = useState(ENTRADA_INICIAL);
  // Apoios editados, trocados, removidos e adicionados. Valem para o quadro e a fonte em uso.
  const [apoios, setApoios] = useState(APOIOS_INICIAL);
  // Campos de cardio/geri e potenciais admissões abertos na planilha; no preenchimento à mão, abrem sozinhos.
  // Os pacientes dos hospitalistas ficam sempre editáveis, com relatório ou à mão.
  const [editando, setEditando] = useState(false);
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
      setEditando(false);
    }
  }

  function abrirAMao() {
    ultimaLeitura.current++;
    setEntrada(preencherAMao());
    setEstado(descartarContagens);
    setApoios(APOIOS_INICIAL);
    setEditando(true);
  }

  function trocarTipoDia(tipo: TipoDia) {
    if (tipo === tipoDia) return;
    setEstado((atual) => escolherTipoDia(atual, tipo, padrao));
    // Os apoios ligam setores do quadro anterior, que muda com o tipo de dia.
    setApoios(APOIOS_INICIAL);
  }

  // Os números se refazem a cada edição, sem botão "calcular". Antes do relatório, a planilha mostra o quadro
  // de médicos com as contagens vazias.
  const { fonte } = entrada;
  const { ajustes } = estado;
  const temDados = fonte.tipo !== 'nenhuma';
  const postos = postosDaFonte(fonte);
  const painel = useMemo(
    () => (tipoDia ? painelDoDia(postosDaFonte(fonte), tipoDia, ajustes) : null),
    [fonte, tipoDia, ajustes],
  );
  const sugestao = useMemo(() => (painel && temDados ? sugestaoDoDia(painel) : null), [painel, temDados]);
  const lista = painel && sugestao ? listaDeApoios(painel, sugestao.apoios, apoios) : [];
  const comApoio = painel ? painelComApoio(painel, lista) : null;
  const emVigor = apoiosEmVigor(lista);

  const imprimivel = painel && tipoDia && geradaEm && temDados;

  return (
    <>
      <main
        className={`mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 pt-5 pb-10 sm:px-6 lg:px-8 ${imprimivel ? 'print:hidden' : ''}`}
      >
        <Cabecalho
          hoje={hoje}
          tipoDia={tipoDia}
          entrada={entrada}
          painel={temDados ? painel : null}
          editando={editando}
          podeImprimir={Boolean(imprimivel)}
          aoEscolherTipoDia={trocarTipoDia}
          aoEscolherArquivo={escolherArquivo}
          aoPreencherAMao={abrirAMao}
          aoAlternarEdicao={() => setEditando((atual) => !atual)}
        />
        {painel && comApoio ? (
          <>
            <Planilha
              painel={painel}
              comApoio={comApoio}
              apoios={emVigor}
              temDados={temDados}
              editando={editando && temDados}
              fonte={fonte.tipo}
              postos={postos}
              ajustes={ajustes}
              aoAjustarMedicos={(setor, semAjuste, sentido) =>
                setEstado((atual) => ajustarMedicos(atual, setor, semAjuste, sentido))
              }
              aoMarcarResidente={(setor, residente) => setEstado((atual) => marcarResidente(atual, setor, residente))}
              aoAjustarContagem={(posto, campo, valor) =>
                setEstado((atual) => ajustarContagem(atual, posto, campo, valor))
              }
            />
            <Recomendacao
              painel={painel}
              lista={lista}
              temDados={temDados}
              completo={sugestao?.completo ?? true}
              aviso={sugestao?.aviso ?? null}
              aoEditarLeitos={(apoio, leitos) => setApoios((atual) => editarLeitos(atual, apoio, leitos))}
              aoTrocarApoiador={(apoio, de) => setApoios((atual) => trocarApoiador(atual, apoio, de))}
              aoRemover={(apoio) => setApoios((atual) => removerApoio(atual, apoio))}
              aoAdicionar={(apoio) => setApoios((atual) => adicionarApoio(atual, apoio))}
            />
          </>
        ) : null}
      </main>
      {imprimivel ? (
        <FolhaImpressao painel={painel} lista={lista} tipoDia={tipoDia} geradaEm={geradaEm} endereco={endereco} />
      ) : null}
    </>
  );
}
