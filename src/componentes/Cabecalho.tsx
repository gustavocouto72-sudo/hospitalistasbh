'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CORES_DO_SEMAFORO } from '@/calculo/semaforo';
import { chaveDoDia } from '@/calculo/tipo-dia';
import type { Painel, TipoDia } from '@/calculo/tipos';
import type { Aviso, Erro } from '@/relatorio/ler';
import { textos } from '@/textos';
import { EXTENSOES, primeiroArquivo, resumoDaFonte, type EstadoEntrada } from './entrada';
import { medicosDaEscala, residentes } from './painel-dia';
import {
  AMOSTRA_COR,
  BOTAO_PRINCIPAL,
  BOTAO_SECUNDARIO,
  IconeAviso,
  IconeCadeado,
  IconeErro,
  IconeImpressora,
  IconeLapis,
  IconeSubir,
} from './ui';

const s = textos.subir;
const TIPOS: readonly TipoDia[] = ['semana', 'fimDeSemana'];

type PropsCabecalho = {
  /** Dia de hoje no aparelho. `null` no HTML estático, antes de a página abrir no navegador. */
  readonly hoje: Date | null;
  readonly tipoDia: TipoDia | null;
  readonly entrada: EstadoEntrada;
  /** Painel sem apoio, para a linha da média; `null` antes do relatório. */
  readonly painel: Painel | null;
  readonly editando: boolean;
  readonly podeImprimir: boolean;
  readonly aoEscolherTipoDia: (tipoDia: TipoDia) => void;
  readonly aoEscolherArquivo: (arquivo: File) => void;
  readonly aoPreencherAMao: () => void;
  readonly aoAlternarEdicao: () => void;
};

const temArquivos = (evento: { dataTransfer: DataTransfer | null }) =>
  evento.dataTransfer?.types.includes('Files') ?? false;

/**
 * Topo da tela: título e data, tipo de dia, subir relatório (botão ou arrastar para qualquer lugar da página),
 * preencher à mão, editar cardio/geri e admissões (colunas que só existem na tela larga) e imprimir; embaixo, a frase de privacidade, o resultado da leitura, a
 * média do dia e a legenda do semáforo.
 */
export function Cabecalho(props: PropsCabecalho) {
  const { hoje, tipoDia, entrada, painel, editando, podeImprimir } = props;
  const seletor = useRef<HTMLInputElement>(null);
  const arrastando = useArrastar(props.aoEscolherArquivo);
  const { fonte, envio } = entrada;
  const lendo = envio?.tipo === 'lendo';
  const resumo = lendo ? s.resumo.lendo(envio.nome) : resumoDaFonte(fonte);
  const leitura = fonte.tipo === 'relatorio' ? fonte.leitura : null;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="text-titulo font-semibold text-balance">{textos.app.titulo}</h1>
          <p className="min-h-5 text-rotulo text-tinta-suave">
            {hoje ? <time dateTime={chaveDoDia(hoje)}>{textos.topo.data(hoje)}</time> : null}
          </p>
        </div>
        <SeletorTipoDia tipoDia={tipoDia} aoEscolher={props.aoEscolherTipoDia} />
      </div>

      <div aria-busy={lendo} className="flex flex-wrap items-center gap-2 border-y border-linha py-2.5">
        <button type="button" onClick={() => seletor.current?.click()} disabled={lendo} className={BOTAO_PRINCIPAL}>
          <IconeSubir />
          {fonte.tipo === 'relatorio' ? s.trocar : s.escolher}
        </button>
        <input
          ref={seletor}
          type="file"
          accept={EXTENSOES.join(',')}
          tabIndex={-1}
          hidden
          onChange={(evento) => {
            const arquivo = primeiroArquivo(evento.currentTarget.files);
            if (arquivo) props.aoEscolherArquivo(arquivo);
            // Permite escolher o mesmo arquivo de novo depois de corrigi-lo.
            evento.currentTarget.value = '';
          }}
        />
        <button type="button" onClick={props.aoPreencherAMao} className={BOTAO_SECUNDARIO}>
          {s.preencherAMao}
        </button>
        <p aria-live="polite" className="min-w-0 px-1 text-rotulo font-semibold empty:hidden">
          {arrastando ? s.soltar : resumo}
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          {fonte.tipo !== 'nenhuma' ? (
            <button
              type="button"
              aria-pressed={editando}
              onClick={props.aoAlternarEdicao}
              className={`${BOTAO_SECUNDARIO} max-md:hidden aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-papel aria-pressed:hover:bg-tinta`}
            >
              <IconeLapis />
              {editando ? textos.planilha.pronto : textos.planilha.editar}
            </button>
          ) : null}
          {podeImprimir ? (
            <button
              type="button"
              onClick={() => window.print()}
              title={textos.imprimir.nota}
              className={BOTAO_SECUNDARIO}
            >
              <IconeImpressora />
              {textos.imprimir.botao}
            </button>
          ) : null}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-nota text-tinta-suave">
        <IconeCadeado />
        <span>
          {s.privacidade} <span className="pointer-coarse:hidden">{s.arrastar}</span>
        </span>
      </p>

      {leitura && !lendo ? <Mensagens erros={leitura.erros} avisos={leitura.avisos} /> : null}
      {envio?.tipo === 'falha' ? (
        <Bloco tom="erro" titulo={s.mensagens.erros(1)} papel="alert">
          <li>{envio.mensagem}</li>
        </Bloco>
      ) : null}

      <Media painel={painel} />

      {arrastando ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center rounded-cartao border-2 border-dashed border-tinta bg-papel/90 text-titulo font-semibold"
        >
          {s.soltar}
        </div>
      ) : null}
    </header>
  );
}

/** Arrastar um arquivo para qualquer lugar da página. Soltar fora não deixa o navegador abrir o arquivo. */
function useArrastar(aoEscolherArquivo: (arquivo: File) => void): boolean {
  const [arrastando, setArrastando] = useState(false);
  const callback = useRef(aoEscolherArquivo);
  useEffect(() => {
    callback.current = aoEscolherArquivo;
  });
  useEffect(() => {
    let profundidade = 0;
    const entrou = (evento: DragEvent) => {
      if (!temArquivos(evento)) return;
      profundidade++;
      setArrastando(true);
    };
    const sobre = (evento: DragEvent) => {
      if (!temArquivos(evento)) return;
      evento.preventDefault();
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'copy';
    };
    const saiu = (evento: DragEvent) => {
      if (!temArquivos(evento)) return;
      profundidade = Math.max(0, profundidade - 1);
      if (profundidade === 0) setArrastando(false);
    };
    const soltou = (evento: DragEvent) => {
      if (!temArquivos(evento)) return;
      evento.preventDefault();
      profundidade = 0;
      setArrastando(false);
      const arquivo = primeiroArquivo(evento.dataTransfer?.files ?? null);
      if (arquivo) callback.current(arquivo);
    };
    window.addEventListener('dragenter', entrou);
    window.addEventListener('dragover', sobre);
    window.addEventListener('dragleave', saiu);
    window.addEventListener('drop', soltou);
    return () => {
      window.removeEventListener('dragenter', entrou);
      window.removeEventListener('dragover', sobre);
      window.removeEventListener('dragleave', saiu);
      window.removeEventListener('drop', soltou);
    };
  }, []);
  return arrastando;
}

function SeletorTipoDia({
  tipoDia,
  aoEscolher,
}: {
  readonly tipoDia: TipoDia | null;
  readonly aoEscolher: (tipoDia: TipoDia) => void;
}) {
  const nome = useId();
  return (
    <fieldset className="flex min-w-0 items-center gap-2">
      <legend className="sr-only">{textos.topo.tipoDia.legenda}</legend>
      <div className="grid grid-cols-2 rounded-controle border border-linha-forte bg-papel p-0.5">
        {TIPOS.map((tipo) => (
          <label
            key={tipo}
            className="flex h-8 cursor-pointer items-center justify-center rounded-[calc(var(--radius-controle)-2px)] px-3.5 text-rotulo font-semibold whitespace-nowrap transition-colors duration-150 ease-out select-none hover:bg-pagina has-checked:bg-tinta has-checked:text-papel has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foco pointer-coarse:h-10 motion-reduce:transition-none"
          >
            <input
              type="radio"
              name={nome}
              value={tipo}
              checked={tipoDia === tipo}
              onChange={() => aoEscolher(tipo)}
              className="sr-only"
            />
            {textos.topo.tipoDia[tipo]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A média do dia e a legenda das cinco cores, numa linha. */
function Media({ painel }: { readonly painel: Painel | null }) {
  const n = textos.cartao.numero;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-rotulo text-tinta-suave">{textos.resumo.media}</dt>
          <dd className="text-numero font-bold tabular-nums">
            {painel && painel.media !== null ? n(painel.media) : '—'}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-rotulo text-tinta-suave">{textos.resumo.medicos}</dt>
          <dd className="text-corpo font-semibold tabular-nums">{painel ? n(medicosDaEscala(painel)) : '—'}</dd>
        </div>
        {painel && residentes(painel) > 0 ? (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-rotulo text-tinta-suave">{textos.resumo.residentes}</dt>
            <dd className="text-corpo font-semibold tabular-nums">{residentes(painel)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline gap-1.5">
          <dt className="text-rotulo text-tinta-suave">{textos.resumo.pacientes}</dt>
          <dd className="text-corpo font-semibold tabular-nums">{painel ? n(painel.cargaTotal) : '—'}</dd>
        </div>
      </dl>
      <ul aria-label={textos.legenda.titulo} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-nota">
        {CORES_DO_SEMAFORO.map((cor) => (
          <li key={cor} className="flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden="true" className={`size-3 rounded-[2px] border ${AMOSTRA_COR[cor]}`} />
            <span>
              {textos.semaforo[cor]} <span className="text-tinta-suave">{textos.legenda.faixa[cor]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mensagens({ erros, avisos }: { readonly erros: readonly Erro[]; readonly avisos: readonly Aviso[] }) {
  return (
    <>
      {erros.length > 0 ? (
        <Bloco tom="erro" titulo={s.mensagens.erros(erros.length)} ajuda={s.mensagens.ajudaErros}>
          {erros.map((erro, i) => (
            <li key={i}>{erro.mensagem}</li>
          ))}
        </Bloco>
      ) : null}
      {avisos.length > 0 ? (
        <Bloco tom="aviso" titulo={s.mensagens.avisos(avisos.length)} ajuda={s.mensagens.ajudaAvisos}>
          {avisos.map((aviso, i) => (
            <li key={i}>{aviso.mensagem}</li>
          ))}
        </Bloco>
      ) : null}
    </>
  );
}

type PropsBloco = {
  readonly tom: 'erro' | 'aviso';
  readonly titulo: string;
  readonly ajuda?: string;
  readonly papel?: 'alert';
  readonly children: ReactNode;
};

/** Aviso ou erro: fio superior de 2 px no traço do semáforo, ícone e texto em tinta. */
function Bloco({ tom, titulo, ajuda, papel, children }: PropsBloco) {
  const fio = tom === 'erro' ? 'border-semaforo-vermelho-traco' : 'border-semaforo-amarelo-traco';
  const icone = tom === 'erro' ? 'text-semaforo-vermelho-traco' : 'text-semaforo-amarelo-traco';
  return (
    <div role={papel} className={`flex gap-3 rounded-b-cartao border-t-2 bg-papel px-4 py-2.5 ${fio}`}>
      <span className={`mt-0.5 shrink-0 ${icone}`}>{tom === 'erro' ? <IconeErro /> : <IconeAviso />}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-rotulo font-semibold">{titulo}</p>
        <ul className="flex flex-col gap-0.5 text-rotulo break-words">{children}</ul>
        {ajuda ? <p className="text-nota text-tinta-suave">{ajuda}</p> : null}
      </div>
    </div>
  );
}
