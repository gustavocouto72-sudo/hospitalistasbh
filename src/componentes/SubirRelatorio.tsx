'use client';

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import type { Aviso, Erro } from '@/relatorio/ler';
import { textos } from '@/textos';
import { EXTENSOES, primeiroArquivo, resumoDaFonte, type EstadoEntrada } from './entrada';

const t = textos.subir;

type PropsSubir = {
  readonly entrada: EstadoEntrada;
  readonly aoEscolherArquivo: (arquivo: File) => void;
  readonly aoPreencherAMao: () => void;
};

const temArquivos = (evento: { dataTransfer: DataTransfer | null }) =>
  evento.dataTransfer?.types.includes('Files') ?? false;

/**
 * Subir relatório (SPEC-05, item 2): área de arrastar e soltar, botão "Escolher arquivo", a frase de
 * privacidade, o botão "Preencher à mão" e o resultado da leitura com os erros e avisos da SPEC-02.
 */
export function SubirRelatorio({ entrada, aoEscolherArquivo, aoPreencherAMao }: PropsSubir) {
  const titulo = useId();
  const seletor = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const { fonte, envio } = entrada;
  const lendo = envio?.tipo === 'lendo';

  // Um arquivo solto fora da área faria o navegador abrir o arquivo e sair da página, perdendo o dia.
  useEffect(() => {
    const segurar = (evento: globalThis.DragEvent) => {
      if (temArquivos(evento)) evento.preventDefault();
    };
    window.addEventListener('dragover', segurar);
    window.addEventListener('drop', segurar);
    return () => {
      window.removeEventListener('dragover', segurar);
      window.removeEventListener('drop', segurar);
    };
  }, []);

  const escolher = (arquivos: FileList | null) => {
    const arquivo = primeiroArquivo(arquivos);
    if (arquivo) aoEscolherArquivo(arquivo);
  };

  const sobre = (evento: DragEvent<HTMLDivElement>) => {
    if (!temArquivos(evento)) return;
    evento.preventDefault();
    evento.dataTransfer.dropEffect = 'copy';
    setArrastando(true);
  };

  const saiu = (evento: DragEvent<HTMLDivElement>) => {
    if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setArrastando(false);
  };

  const soltou = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastando(false);
    escolher(evento.dataTransfer.files);
  };

  const resumo = envio?.tipo === 'lendo' ? t.resumo.lendo(envio.nome) : resumoDaFonte(fonte);
  const leitura = fonte.tipo === 'relatorio' ? fonte.leitura : null;

  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-3">
      <h2 id={titulo} className="text-titulo font-semibold">
        {t.titulo}
      </h2>

      <div
        onDragEnter={sobre}
        onDragOver={sobre}
        onDragLeave={saiu}
        onDrop={soltou}
        aria-busy={lendo}
        className={`flex flex-col items-center gap-3 rounded-cartao border-2 border-dashed px-4 py-6 text-center transition-colors duration-150 ease-out motion-reduce:transition-none sm:py-8 ${
          arrastando ? 'border-tinta bg-pagina' : 'border-linha-forte bg-papel'
        }`}
      >
        <IconeArquivo />
        <p className="text-corpo font-semibold text-balance pointer-coarse:hidden">
          {arrastando ? t.soltar : t.instrucao}
        </p>
        <p className="text-rotulo text-tinta-suave pointer-coarse:hidden" aria-hidden="true">
          {t.ou}
        </p>
        <button
          type="button"
          onClick={() => seletor.current?.click()}
          disabled={lendo}
          className="min-h-11 rounded-controle bg-acao px-5 text-rotulo font-semibold text-acao-texto transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        >
          {fonte.tipo === 'relatorio' ? t.trocar : t.escolher}
        </button>
        <input
          ref={seletor}
          type="file"
          accept={EXTENSOES.join(',')}
          tabIndex={-1}
          hidden
          onChange={(evento) => {
            escolher(evento.currentTarget.files);
            // Permite escolher o mesmo arquivo de novo depois de corrigi-lo.
            evento.currentTarget.value = '';
          }}
        />
        <p className="text-nota text-tinta-suave">{t.formatos}</p>
      </div>

      <p className="flex items-start gap-2 text-rotulo text-tinta-suave">
        <IconeCadeado />
        <span>{t.privacidade}</span>
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-rotulo text-tinta-suave">{t.semRelatorio}</span>
        <button
          type="button"
          onClick={aoPreencherAMao}
          className="min-h-11 rounded-controle border border-linha-forte bg-papel px-4 text-rotulo font-semibold transition-colors duration-150 ease-out hover:bg-pagina motion-reduce:transition-none"
        >
          {t.preencherAMao}
        </button>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {resumo ? <p className="text-corpo font-semibold">{resumo}</p> : null}
        {leitura && !lendo ? <Mensagens erros={leitura.erros} avisos={leitura.avisos} /> : null}
      </div>
      {envio?.tipo === 'falha' ? (
        <Bloco tom="erro" titulo={t.mensagens.erros(1)} papel="alert">
          <li>{envio.mensagem}</li>
        </Bloco>
      ) : null}
    </section>
  );
}

function Mensagens({ erros, avisos }: { readonly erros: readonly Erro[]; readonly avisos: readonly Aviso[] }) {
  return (
    <>
      {erros.length > 0 ? (
        <Bloco tom="erro" titulo={t.mensagens.erros(erros.length)} ajuda={t.mensagens.ajudaErros}>
          {erros.map((erro, i) => (
            <li key={i}>{erro.mensagem}</li>
          ))}
        </Bloco>
      ) : null}
      {avisos.length > 0 ? (
        <Bloco tom="aviso" titulo={t.mensagens.avisos(avisos.length)} ajuda={t.mensagens.ajudaAvisos}>
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

/** Aviso ou erro: fio superior de 2 px no traço do semáforo, ícone e texto em tinta (DESIGN.md). */
function Bloco({ tom, titulo, ajuda, papel, children }: PropsBloco) {
  const fio = tom === 'erro' ? 'border-semaforo-vermelho-traco' : 'border-semaforo-amarelo-traco';
  const icone = tom === 'erro' ? 'text-semaforo-vermelho-traco' : 'text-semaforo-amarelo-traco';
  return (
    <div role={papel} className={`flex gap-3 rounded-cartao border-t-2 bg-papel px-4 py-3 ${fio}`}>
      <span className={`mt-0.5 shrink-0 ${icone}`}>{tom === 'erro' ? <IconeErro /> : <IconeAviso />}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-rotulo font-semibold">{titulo}</p>
        <ul className="flex flex-col gap-1 text-rotulo break-words">{children}</ul>
        {ajuda ? <p className="text-nota text-tinta-suave">{ajuda}</p> : null}
      </div>
    </div>
  );
}

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconeArquivo() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" className="text-tinta-suave" {...traco}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 17v-6M9.5 13.5 12 11l2.5 2.5" />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="mt-0.5 shrink-0" {...traco}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconeErro() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...traco}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

function IconeAviso() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...traco}>
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  );
}
