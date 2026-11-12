'use client';

import { useId, useState } from 'react';
import type { Apoio, Painel } from '@/calculo/tipos';
import { textos } from '@/textos';
import {
  apoiadoresPossiveis,
  apoiadosPossiveis,
  apoiosAceitos,
  erroDoNovoApoio,
  nomeDoSetor,
  novoApoioPadrao,
  type ItemDaLista,
  type Vista,
} from './apoios-dia';

const t = textos.apoio.lista;
const VISTAS: readonly Vista[] = ['antes', 'depois'];

export type PropsLista = {
  /** Painel sem apoio: é contra ele que os apoios são conferidos. */
  readonly painel: Painel;
  readonly lista: readonly ItemDaLista[];
  /** `completo` e `aviso` da sugestão do dia. */
  readonly completo: boolean;
  readonly aviso: string | null;
  readonly vista: Vista;
  readonly aoAceitar: (apoio: Apoio) => void;
  readonly aoEditarLeitos: (apoio: Apoio, leitos: number) => void;
  readonly aoTrocarApoiador: (apoio: Apoio, de: string) => void;
  readonly aoRemover: (apoio: Apoio) => void;
  readonly aoAdicionar: (apoio: Apoio) => void;
  readonly aoEscolherVista: (vista: Vista) => void;
};

const BOTAO_SECUNDARIO =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-controle border border-linha-forte bg-papel px-4 text-rotulo font-semibold transition-colors duration-150 ease-out hover:bg-pagina focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:border-linha-forte/60 disabled:text-tinta-suave disabled:hover:bg-papel motion-reduce:transition-none';
const BOTAO_PRINCIPAL =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-controle bg-acao px-4 text-rotulo font-semibold text-acao-texto transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const BOTAO_QUADRADO =
  'flex size-11 shrink-0 items-center justify-center rounded-controle border border-linha-forte bg-papel transition-colors duration-150 ease-out hover:bg-pagina focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:border-linha-forte/60 disabled:text-tinta-suave disabled:hover:bg-papel motion-reduce:transition-none';
const SELECT =
  'min-h-11 min-w-0 rounded-controle border border-linha-forte bg-papel px-3 text-rotulo font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco';

/**
 * Sugestão de apoio (SPEC-05, item 5): frases "4.5 apoia 3 leitos do 4.3" com aceitar, editar leitos, trocar
 * apoiador e remover; o "Adicionar apoio"; o seletor Antes/Depois dos cartões; e o aviso quando nem todos os
 * setores cabem no verde.
 */
export function ListaApoios(props: PropsLista) {
  const { painel, lista, completo, aviso, vista, aoEscolherVista } = props;
  const titulo = useId();
  const aceitos = apoiosAceitos(lista).length;

  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <h2 id={titulo} className="text-titulo font-semibold">
          {t.titulo}
        </h2>
        <SeletorVista vista={vista} aoEscolher={aoEscolherVista} />
      </div>
      <p aria-live="polite" className="text-rotulo text-tinta-suave">
        {vista === 'antes' ? t.vista.notaAntes : t.vista.notaDepois(aceitos)}
      </p>

      {!completo && aviso && painel.media !== null ? <AvisoIncompleto aviso={aviso} /> : null}

      <div className="flex flex-col rounded-cartao border border-linha bg-papel">
        {lista.length > 0 ? (
          <ul className="flex flex-col">
            {lista.map((item) => (
              <ItemApoio key={`${item.apoio.de}→${item.apoio.para}`} item={item} {...props} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-corpo text-tinta-suave">{painel.media === null ? t.semMedia : t.vazio}</p>
        )}
        <Adicionar {...props} />
      </div>
    </section>
  );
}

function SeletorVista({ vista, aoEscolher }: { readonly vista: Vista; readonly aoEscolher: (v: Vista) => void }) {
  const nome = useId();
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 text-rotulo font-semibold text-tinta-suave">{t.vista.legenda}</legend>
      <div className="grid grid-cols-2 rounded-controle border border-linha-forte bg-papel p-0.5 sm:inline-grid">
        {VISTAS.map((opcao) => (
          <label
            key={opcao}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-[calc(var(--radius-controle)-2px)] px-5 text-rotulo font-semibold whitespace-nowrap transition-colors duration-150 ease-out select-none hover:bg-pagina has-checked:bg-tinta has-checked:text-papel has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foco motion-reduce:transition-none"
          >
            <input
              type="radio"
              name={nome}
              value={opcao}
              checked={vista === opcao}
              onChange={() => aoEscolher(opcao)}
              className="sr-only"
            />
            {t.vista[opcao]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AvisoIncompleto({ aviso }: { readonly aviso: string }) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-b-cartao border-t-2 border-semaforo-amarelo-traco bg-papel px-4 py-3"
    >
      <span className="mt-0.5 shrink-0 text-semaforo-amarelo-traco">
        <IconeAviso />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-rotulo font-semibold">{aviso}</p>
        <p className="text-nota text-tinta-suave">{t.incompleto}</p>
      </div>
    </div>
  );
}

function Frase({ painel, apoio }: { readonly painel: Painel; readonly apoio: Apoio }) {
  return (
    <p className="text-corpo">
      <strong>{nomeDoSetor(painel, apoio.de)}</strong> {t.apoia} <strong>{t.leitos(apoio.leitos)}</strong> {t.do}{' '}
      <strong>{nomeDoSetor(painel, apoio.para)}</strong>
    </p>
  );
}

function fraseDe(painel: Painel, apoio: Apoio) {
  return t.frase({ de: nomeDoSetor(painel, apoio.de), para: nomeDoSetor(painel, apoio.para), leitos: apoio.leitos });
}

function ItemApoio({
  item,
  painel,
  aoAceitar,
  aoEditarLeitos,
  aoTrocarApoiador,
  aoRemover,
}: PropsLista & {
  readonly item: ItemDaLista;
}) {
  const { apoio, origem, erro } = item;
  const frase = fraseDe(painel, apoio);
  const idErro = useId();
  const apoiadores = apoiadoresPossiveis(painel, apoio.para);
  // O apoiador atual fica na lista mesmo se deixou de valer, para o seletor mostrar o que está escrito.
  const opcoes = apoiadores.some((s) => s.id === apoio.de)
    ? apoiadores
    : [{ id: apoio.de, nome: nomeDoSetor(painel, apoio.de) }, ...apoiadores];

  return (
    <li
      data-apoio={`${apoio.de}→${apoio.para}`}
      aria-describedby={erro ? idErro : undefined}
      className="flex flex-col gap-3 border-b border-linha px-4 py-3 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-3">
        <Frase painel={painel} apoio={apoio} />
        <Selo origem={origem} />
      </div>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <Leitos
          rotuloMenos={t.menosLeito(frase)}
          rotuloMais={t.maisLeito(frase)}
          leitos={apoio.leitos}
          aoMudar={(leitos) => aoEditarLeitos(apoio, leitos)}
        />
        <label className="flex min-w-0 flex-1 basis-36 flex-col gap-1 sm:max-w-56">
          <span className="text-nota font-semibold text-tinta-suave">{t.apoiador}</span>
          <select
            aria-label={t.trocarRotulo(nomeDoSetor(painel, apoio.para))}
            value={apoio.de}
            onChange={(evento) => aoTrocarApoiador(apoio, evento.currentTarget.value)}
            className={SELECT}
          >
            {opcoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          {origem === 'sugerido' ? (
            <button
              type="button"
              aria-label={t.aceitarRotulo(frase)}
              onClick={() => aoAceitar(apoio)}
              className={BOTAO_PRINCIPAL}
            >
              <IconeCheck />
              {t.aceitar}
            </button>
          ) : null}
          <button
            type="button"
            aria-label={t.removerRotulo(frase)}
            onClick={() => aoRemover(apoio)}
            className={BOTAO_SECUNDARIO}
          >
            {t.remover}
          </button>
        </div>
      </div>

      {erro ? (
        <p id={idErro} role="alert" className="flex items-start gap-2 text-rotulo">
          <span className="mt-0.5 shrink-0 text-semaforo-vermelho-traco">
            <IconeErro />
          </span>
          <span>{erro}</span>
        </p>
      ) : null}
    </li>
  );
}

/** Selo do item: a diferença entre sugerido e aceito está no texto, no ícone e no traço, não na cor. */
function Selo({ origem }: { readonly origem: ItemDaLista['origem'] }) {
  if (origem === 'aceito') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-controle border border-tinta px-2 py-0.5 text-nota font-semibold">
        <IconeCheck tamanho={14} />
        {t.aceito}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-controle border border-dashed border-linha-forte px-2 py-0.5 text-nota font-semibold text-tinta-suave">
      {t.sugerido}
    </span>
  );
}

type PropsLeitos = {
  readonly rotuloMenos: string;
  readonly rotuloMais: string;
  readonly leitos: number;
  readonly aoMudar: (leitos: number) => void;
};

function Leitos({ rotuloMenos, rotuloMais, leitos, aoMudar }: PropsLeitos) {
  const rotulo = useId();
  return (
    <div className="flex flex-col gap-1">
      <span id={rotulo} className="text-nota font-semibold text-tinta-suave">
        {t.leitosRotulo}
      </span>
      <div role="group" aria-labelledby={rotulo} className="flex items-center gap-1">
        <button
          type="button"
          disabled={leitos <= 1}
          aria-label={rotuloMenos}
          onClick={() => aoMudar(leitos - 1)}
          className={BOTAO_QUADRADO}
        >
          <IconeMenos />
        </button>
        <output aria-live="polite" className="min-w-10 text-center text-numero font-semibold">
          {leitos}
        </output>
        <button type="button" aria-label={rotuloMais} onClick={() => aoMudar(leitos + 1)} className={BOTAO_QUADRADO}>
          <IconeMais />
        </button>
      </div>
    </div>
  );
}

/**
 * "Adicionar apoio": abre um formulário no próprio quadro, sem janela por cima. O apoio só entra se valer com
 * os aceitos; senão o botão fica desligado e a mensagem do cálculo aparece.
 */
function Adicionar({ painel, lista, aoAdicionar }: PropsLista) {
  const [novo, setNovo] = useState<Apoio | null>(null);
  const idErro = useId();
  const padrao = novoApoioPadrao(painel);

  if (!novo) {
    return (
      <div className="flex flex-col gap-2 border-t border-linha px-4 py-3">
        <button
          type="button"
          disabled={!padrao}
          onClick={() => setNovo(padrao)}
          className={`${BOTAO_SECUNDARIO} self-start`}
        >
          <IconeMais />
          {t.adicionar.abrir}
        </button>
        {padrao ? null : <p className="text-nota text-tinta-suave">{t.adicionar.semSetores}</p>}
      </div>
    );
  }

  const apoiados = apoiadosPossiveis(painel);
  const apoiadores = apoiadoresPossiveis(painel, novo.para);
  const erro = erroDoNovoApoio(painel, apoiosAceitos(lista), novo);
  const frase = fraseDe(painel, novo);

  function trocarApoiado(para: string) {
    setNovo((atual) => {
      if (!atual) return atual;
      const possiveis = apoiadoresPossiveis(painel, para);
      const de = possiveis.some((s) => s.id === atual.de) ? atual.de : (possiveis[0]?.id ?? atual.de);
      return { ...atual, para, de };
    });
  }

  return (
    <form
      aria-label={t.adicionar.titulo}
      onSubmit={(evento) => {
        evento.preventDefault();
        if (erro !== null) return;
        aoAdicionar(novo);
        setNovo(null);
      }}
      className="flex flex-col gap-3 border-t border-linha px-4 py-3"
    >
      <h3 className="text-rotulo font-semibold">{t.adicionar.titulo}</h3>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <label className="flex min-w-0 flex-1 basis-36 flex-col gap-1 sm:max-w-56">
          <span className="text-nota font-semibold text-tinta-suave">{t.adicionar.apoiado}</span>
          <select value={novo.para} onChange={(e) => trocarApoiado(e.currentTarget.value)} className={SELECT}>
            {apoiados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 basis-36 flex-col gap-1 sm:max-w-56">
          <span className="text-nota font-semibold text-tinta-suave">{t.adicionar.apoiador}</span>
          <select
            value={novo.de}
            onChange={(e) => {
              const de = e.currentTarget.value;
              setNovo((atual) => (atual ? { ...atual, de } : atual));
            }}
            className={SELECT}
          >
            {apoiadores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <Leitos
          rotuloMenos={t.menosLeito(frase)}
          rotuloMais={t.maisLeito(frase)}
          leitos={novo.leitos}
          aoMudar={(leitos) => setNovo((atual) => (atual ? { ...atual, leitos: Math.max(1, leitos) } : atual))}
        />
      </div>
      <Frase painel={painel} apoio={novo} />
      {erro ? (
        <p id={idErro} role="alert" className="flex items-start gap-2 text-rotulo">
          <span className="mt-0.5 shrink-0 text-semaforo-vermelho-traco">
            <IconeErro />
          </span>
          <span>{erro}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={erro !== null}
          aria-describedby={erro ? idErro : undefined}
          className={BOTAO_PRINCIPAL}
        >
          {t.adicionar.confirmar}
        </button>
        <button type="button" onClick={() => setNovo(null)} className={BOTAO_SECUNDARIO}>
          {t.adicionar.cancelar}
        </button>
      </div>
    </form>
  );
}

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconeMenos() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...traco}>
      <path d="M5 12h14" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...traco}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconeCheck({ tamanho = 18 }: { readonly tamanho?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
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
