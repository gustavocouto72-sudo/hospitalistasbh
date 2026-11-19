'use client';

import { useId, useState } from 'react';
import type { Apoio, Painel } from '@/calculo/tipos';
import { textos } from '@/textos';
import {
  apoiadoresPossiveis,
  apoiadosPossiveis,
  apoiosEmVigor,
  erroDoNovoApoio,
  nomeDoSetor,
  novoApoioPadrao,
  type ItemDaLista,
} from './apoios-dia';
import {
  BOTAO_ICONE,
  BOTAO_PRINCIPAL,
  BOTAO_SECUNDARIO,
  IconeAviso,
  IconeErro,
  IconeFechar,
  IconeMais,
  IconeMenos,
  SELECT,
} from './ui';

const t = textos.apoio.lista;
const r = textos.recomendacao;

export type PropsRecomendacao = {
  /** Painel sem apoio: é contra ele que os apoios são conferidos. */
  readonly painel: Painel;
  readonly lista: readonly ItemDaLista[];
  readonly temDados: boolean;
  /** `completo` e `aviso` da sugestão do dia. */
  readonly completo: boolean;
  readonly aviso: string | null;
  readonly aoEditarLeitos: (apoio: Apoio, leitos: number) => void;
  readonly aoTrocarApoiador: (apoio: Apoio, de: string) => void;
  readonly aoRemover: (apoio: Apoio) => void;
  readonly aoAdicionar: (apoio: Apoio) => void;
};

/**
 * Recomendação de apoio, enxuta, embaixo da planilha. Cada apoio é uma frase editável no lugar
 * ("4.5 apoia 2 leitos do 4.2"), e todos já valem nas colunas "Com a recomendação".
 */
export function Recomendacao(props: PropsRecomendacao) {
  const { painel, lista, temDados, completo, aviso } = props;
  const titulo = useId();

  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={titulo} className="text-corpo font-semibold">
          {r.titulo}
        </h2>
        {temDados && lista.length > 0 ? <p className="text-nota text-tinta-suave">{r.nota}</p> : null}
      </div>

      {temDados && !completo && aviso && painel.media !== null ? (
        <p role="status" className="flex items-start gap-2 text-rotulo">
          <span className="mt-0.5 text-semaforo-amarelo-traco">
            <IconeAviso />
          </span>
          <span>
            <strong className="font-semibold">{aviso}</strong> <span className="text-tinta-suave">{t.incompleto}</span>
          </span>
        </p>
      ) : null}

      {!temDados ? (
        <p className="text-rotulo text-tinta-suave">{r.semDados}</p>
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          {lista.length === 0 ? (
            <p className="py-1.5 text-rotulo text-tinta-suave">{painel.media === null ? r.semMedia : r.nenhuma}</p>
          ) : (
            <ul className="contents">
              {lista.map((item) => (
                <ItemApoio key={`${item.apoio.de}→${item.apoio.para}`} item={item} {...props} />
              ))}
            </ul>
          )}
          <Adicionar {...props} />
        </div>
      )}
    </section>
  );
}

const CAIXA = 'flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-cartao border bg-papel py-1.5 pr-1.5 pl-2.5';

function ItemApoio({
  item,
  painel,
  aoEditarLeitos,
  aoTrocarApoiador,
  aoRemover,
}: PropsRecomendacao & { readonly item: ItemDaLista }) {
  const { apoio, erro } = item;
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
      aria-label={frase}
      aria-describedby={erro ? idErro : undefined}
      className="flex flex-col gap-1"
    >
      <div className={`${CAIXA} ${erro ? 'border-semaforo-vermelho-traco' : 'border-linha-forte'}`}>
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
        <span className="text-rotulo">{t.apoia}</span>
        <Leitos
          rotuloMenos={t.menosLeito(frase)}
          rotuloMais={t.maisLeito(frase)}
          leitos={apoio.leitos}
          aoMudar={(leitos) => aoEditarLeitos(apoio, leitos)}
        />
        <span className="text-rotulo">
          {t.palavraLeitos(apoio.leitos)} {t.do}{' '}
          <strong className="font-semibold">{nomeDoSetor(painel, apoio.para)}</strong>
        </span>
        <button
          type="button"
          aria-label={t.removerRotulo(frase)}
          title={t.remover}
          onClick={() => aoRemover(apoio)}
          className={`${BOTAO_ICONE} ml-1 border-transparent text-tinta-suave hover:text-tinta`}
        >
          <IconeFechar />
        </button>
      </div>
      {erro ? (
        <p id={idErro} role="alert" className="flex max-w-80 items-start gap-1.5 text-nota">
          <span className="mt-px shrink-0 text-semaforo-vermelho-traco">
            <IconeErro tamanho={14} />
          </span>
          <span>{erro}</span>
        </p>
      ) : null}
    </li>
  );
}

type PropsLeitos = {
  readonly rotuloMenos: string;
  readonly rotuloMais: string;
  readonly leitos: number;
  readonly aoMudar: (leitos: number) => void;
};

function Leitos({ rotuloMenos, rotuloMais, leitos, aoMudar }: PropsLeitos) {
  return (
    <span role="group" aria-label={t.leitosRotulo} className="inline-flex items-center gap-0.5">
      <button
        type="button"
        disabled={leitos <= 1}
        aria-label={rotuloMenos}
        onClick={() => aoMudar(leitos - 1)}
        className={BOTAO_ICONE}
      >
        <IconeMenos />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-corpo font-bold tabular-nums">
        {leitos}
      </output>
      <button type="button" aria-label={rotuloMais} onClick={() => aoMudar(leitos + 1)} className={BOTAO_ICONE}>
        <IconeMais />
      </button>
    </span>
  );
}

/**
 * "Adicionar apoio": abre a mesma frase editável, no lugar. O apoio só entra se valer com os que já estão na
 * lista; senão o botão fica desligado e a mensagem do cálculo aparece.
 */
function Adicionar({ painel, lista, aoAdicionar }: PropsRecomendacao) {
  const [novo, setNovo] = useState<Apoio | null>(null);
  const idErro = useId();
  const padrao = novoApoioPadrao(painel);

  if (!novo) {
    return (
      <button
        type="button"
        disabled={!padrao}
        title={padrao ? undefined : t.adicionar.semSetores}
        onClick={() => setNovo(padrao)}
        className={`${BOTAO_SECUNDARIO} h-10 border-dashed`}
      >
        <IconeMais />
        {t.adicionar.abrir}
      </button>
    );
  }

  const apoiados = apoiadosPossiveis(painel);
  const apoiadores = apoiadoresPossiveis(painel, novo.para);
  const erro = erroDoNovoApoio(painel, apoiosEmVigor(lista), novo);
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
      className="flex flex-col gap-1"
    >
      <div className={`${CAIXA} border-dashed border-tinta`}>
        <select
          aria-label={t.adicionar.apoiador}
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
        <span className="text-rotulo">{t.apoia}</span>
        <Leitos
          rotuloMenos={t.menosLeito(frase)}
          rotuloMais={t.maisLeito(frase)}
          leitos={novo.leitos}
          aoMudar={(leitos) => setNovo((atual) => (atual ? { ...atual, leitos: Math.max(1, leitos) } : atual))}
        />
        <span className="text-rotulo">
          {t.palavraLeitos(novo.leitos)} {t.do}
        </span>
        <select
          aria-label={t.adicionar.apoiado}
          value={novo.para}
          onChange={(e) => trocarApoiado(e.currentTarget.value)}
          className={SELECT}
        >
          {apoiados.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={erro !== null}
          aria-describedby={erro ? idErro : undefined}
          className={`${BOTAO_PRINCIPAL} ml-1 h-7 px-2.5 disabled:cursor-not-allowed`}
        >
          {t.adicionar.confirmar}
        </button>
        <button
          type="button"
          aria-label={t.adicionar.cancelar}
          title={t.adicionar.cancelar}
          onClick={() => setNovo(null)}
          className={`${BOTAO_ICONE} border-transparent text-tinta-suave hover:text-tinta`}
        >
          <IconeFechar />
        </button>
      </div>
      {erro ? (
        <p id={idErro} role="alert" className="flex max-w-96 items-start gap-1.5 text-nota">
          <span className="mt-px shrink-0 text-semaforo-vermelho-traco">
            <IconeErro tamanho={14} />
          </span>
          <span>{erro}</span>
        </p>
      ) : null}
    </form>
  );
}

function fraseDe(painel: Painel, apoio: Apoio) {
  return t.frase({ de: nomeDoSetor(painel, apoio.de), para: nomeDoSetor(painel, apoio.para), leitos: apoio.leitos });
}
