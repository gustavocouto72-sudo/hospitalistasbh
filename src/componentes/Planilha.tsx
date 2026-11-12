'use client';

import { useId, useState } from 'react';
import type { Ajustes, Apoio, ContagemDoPosto, Contagens, Painel, SetorNoPainel } from '@/calculo/tipos';
import { textos } from '@/textos';
import { nomeDoSetor } from './apoios-dia';
import { contagensDosPostos, lerContagem, notasDoSetor, visualDoSetor } from './painel-dia';
import { AMOSTRA_COR, BOTAO_ICONE, CELULA_COR, IconeMais, IconeMenos } from './ui';

const t = textos.planilha;
const c = textos.cartao;
const CAMPOS = ['hospitalistas', 'cardioGeriatria', 'potenciaisAdmissoes'] as const;
type Campo = (typeof CAMPOS)[number];

export type PropsPlanilha = {
  /** Painel sem apoio. */
  readonly painel: Painel;
  /** O mesmo painel com a recomendação aplicada. */
  readonly comApoio: Painel;
  readonly apoios: readonly Apoio[];
  /** `false` antes do relatório: a planilha mostra só o quadro de médicos. */
  readonly temDados: boolean;
  /** Campos de contagem por posto abertos para edição. */
  readonly editando: boolean;
  readonly fonte: 'relatorio' | 'manual' | 'nenhuma';
  readonly postos: readonly ContagemDoPosto[];
  readonly ajustes: Ajustes;
  readonly aoAjustarMedicos: (setor: string, semAjuste: number, sentido: 1 | -1) => void;
  readonly aoAjustarContagem: (posto: string, campo: keyof Contagens, valor: number) => void;
};

const TH = 'px-3 py-2 text-left text-nota font-semibold tracking-wide text-tinta-suave uppercase';
const TD = 'px-3 py-1 align-middle';
const NUM = 'text-right tabular-nums';
/** Colunas que somem no celular, para a situação aparecer sem rolar tanto. */
const SECUNDARIA = 'hidden md:table-cell';

/**
 * A planilha do dia: uma linha por setor, com médicos, contagens, carga por médico, diferença para a média e a
 * situação no semáforo, sem apoio e com a recomendação. Tudo numa tela, para bater o olho.
 */
export function Planilha(props: PropsPlanilha) {
  const { painel, comApoio, temDados } = props;
  const titulo = useId();
  const media = temDados && painel.media !== null ? c.numero(painel.media) : '—';

  return (
    <section aria-labelledby={titulo} className="flex flex-col">
      <h2 id={titulo} className="sr-only">
        {t.titulo}
      </h2>
      <div className="overflow-x-auto rounded-cartao border border-linha bg-papel [scrollbar-color:var(--color-linha-forte)_transparent]">
        <table className="w-full border-collapse text-rotulo md:min-w-[60rem]">
          <thead>
            <tr className="hidden border-b border-linha md:table-row">
              <th colSpan={5} className="px-3 pt-2.5" aria-hidden="true" />
              <th
                colSpan={3}
                scope="colgroup"
                className="border-l border-linha px-3 pt-2.5 text-left text-nota font-semibold text-tinta"
              >
                {t.grupoSemApoio}
              </th>
              <th
                colSpan={2}
                scope="colgroup"
                className="border-l-2 border-tinta px-3 pt-2.5 text-left text-nota font-semibold text-tinta"
              >
                {t.grupoComApoio}
              </th>
            </tr>
            <tr className="border-b border-linha-forte">
              <th scope="col" className={`${TH} sticky left-0 z-10 bg-papel`}>
                {t.colunas.setor}
              </th>
              <th scope="col" className={`${TH} text-center`}>
                {t.colunas.medicos}
              </th>
              <th scope="col" className={`${TH} ${NUM}`}>
                {t.colunas.pacientes}
              </th>
              <th scope="col" className={`${TH} ${NUM} ${SECUNDARIA}`}>
                {t.colunas.cardioGeriatria}
              </th>
              <th scope="col" className={`${TH} ${NUM} ${SECUNDARIA} text-admissao`}>
                {t.colunas.potenciaisAdmissoes}
              </th>
              <th scope="col" className={`${TH} ${NUM} border-l border-linha`}>
                {t.colunas.porMedico}
              </th>
              <th scope="col" className={`${TH} ${NUM} ${SECUNDARIA}`}>
                {t.colunas.diferenca}
              </th>
              <th scope="col" className={TH}>
                {t.colunas.situacao}
              </th>
              <th scope="col" className={`${TH} ${NUM} border-l-2 border-tinta`}>
                {t.colunas.comApoio}
              </th>
              <th scope="col" className={TH}>
                {t.colunas.situacao}
              </th>
            </tr>
          </thead>
          <tbody>
            {painel.setores.map((setor) => {
              const depois = comApoio.setores.find((s) => s.id === setor.id) ?? setor;
              return <Linha key={setor.id} {...props} setor={setor} depois={depois} />;
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-tinta font-semibold">
              <th scope="row" className={`${TD} sticky left-0 z-10 bg-papel text-left`}>
                {t.total}
              </th>
              <td className={`${TD} text-center ${NUM}`}>{c.numero(painel.medicosTotal)}</td>
              <td className={`${TD} ${NUM}`}>{temDados ? c.numero(totalDe(painel, 'hospitalistas')) : '—'}</td>
              <td className={`${TD} ${NUM} ${SECUNDARIA} text-tinta-suave`}>
                {temDados ? c.numero(totalDe(painel, 'cardioGeriatria')) : '—'}
              </td>
              <td className={`${TD} ${NUM} ${SECUNDARIA} text-admissao`}>
                {temDados ? c.numero(totalDe(painel, 'potenciaisAdmissoes')) : '—'}
              </td>
              <td className={`${TD} ${NUM} border-l border-linha`}>{t.media(media)}</td>
              <td className={`${TD} ${SECUNDARIA}`} />
              <td className={TD} />
              <td className={`${TD} ${NUM} border-l-2 border-tinta`}>{t.media(media)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </div>
      {temDados ? <Ocultos postos={painel.postosOcultos} /> : null}
    </section>
  );
}

function totalDe(painel: Painel, campo: Campo): number {
  return painel.setores.reduce((soma, s) => soma + s.contagens[campo], 0);
}

function Linha(props: PropsPlanilha & { readonly setor: SetorNoPainel; readonly depois: SetorNoPainel }) {
  const { setor, depois, painel, temDados, editando, fonte, apoios, postos, ajustes, aoAjustarContagem } = props;
  const propria = setor.estado === 'escalaPropria';
  const notas = temDados && fonte !== 'nenhuma' ? notasDoSetor(painel, setor, fonte) : [];
  const notasApoio = temDados ? notasCurtas(painel, apoios, setor.id) : [];
  const porPosto = contagensDosPostos(postos, ajustes, setor.postos);

  return (
    <tr data-setor={setor.id} className="border-b border-linha last:border-b-0 hover:bg-pagina/60">
      <th scope="row" className={`${TD} sticky left-0 z-10 bg-papel text-left font-normal`}>
        <span className="flex items-center gap-1.5 text-corpo font-semibold whitespace-nowrap">
          <MarcaCelular setor={depois} temDados={temDados} />
          {setor.nome}
        </span>
        {setor.postos.length > 1 || setor.postos[0] !== setor.nome ? (
          <span className="block text-nota text-tinta-suave">{textos.quadroPadrao.juntarPostos(setor.postos)}</span>
        ) : null}
        {notas.map((nota) => (
          <span key={nota} className="block max-w-48 text-nota text-semaforo-amarelo-traco">
            {nota}
          </span>
        ))}
      </th>
      <td className={`${TD} text-center`}>
        {propria ? <span className="text-tinta-suave">{t.escalaPropria}</span> : <Medicos {...props} setor={setor} />}
      </td>
      {CAMPOS.map((campo) => (
        <td
          key={campo}
          className={`${TD} ${NUM} ${campo === 'hospitalistas' ? 'text-corpo font-semibold' : ''} ${
            campo === 'cardioGeriatria' ? 'text-tinta-suave' : ''
          } ${campo === 'potenciaisAdmissoes' ? 'text-admissao' : ''} ${campo === 'hospitalistas' ? '' : SECUNDARIA}`}
        >
          {editando ? (
            <div className="flex flex-col items-end gap-1">
              {porPosto.map((p) => (
                <label key={p.codigo} className="flex items-center gap-1.5">
                  {porPosto.length > 1 ? <span className="text-nota text-tinta-suave">{p.codigo}</span> : null}
                  <CampoContagem
                    valor={p[campo]}
                    rotulo={c.campo[campo](p.codigo)}
                    aoMudar={(valor) => aoAjustarContagem(p.codigo, campo, valor)}
                  />
                </label>
              ))}
            </div>
          ) : temDados ? (
            c.numero(setor.contagens[campo])
          ) : (
            '—'
          )}
        </td>
      ))}
      <td data-coluna="por-medico" className={`${TD} ${NUM} border-l border-linha text-corpo font-bold`}>
        {porMedicoDe(setor, temDados)}
      </td>
      <td className={`${TD} ${NUM} ${SECUNDARIA} text-tinta-suave`}>
        {temDados && setor.diferenca !== null ? c.diferenca(setor.diferenca) : ''}
      </td>
      <Situacao coluna="situacao" setor={setor} temDados={temDados} />
      <td data-coluna="com-apoio" className={`${TD} ${NUM} border-l-2 border-tinta`}>
        <span className="flex items-baseline justify-end gap-2">
          {notasApoio.length > 0 ? (
            <span className="text-nota whitespace-nowrap text-tinta-suave">{notasApoio.join(' · ')}</span>
          ) : null}
          <span data-valor="" className="text-corpo font-bold">
            {porMedicoDe(depois, temDados)}
          </span>
        </span>
      </td>
      <Situacao coluna="situacao-com-apoio" setor={depois} temDados={temDados} />
    </tr>
  );
}

/** "apoia 4.2 (2)" e "apoio do 4.5 (2)", para caber na linha. */
function notasCurtas(painel: Painel, apoios: readonly Apoio[], setor: string): string[] {
  const notas: string[] = [];
  for (const a of apoios) {
    if (a.de === setor) notas.push(t.apoia(nomeDoSetor(painel, a.para), a.leitos));
    if (a.para === setor) notas.push(t.apoiado(nomeDoSetor(painel, a.de), a.leitos));
  }
  return notas;
}

function porMedicoDe(setor: Pick<SetorNoPainel, 'estado' | 'cargaPorMedico'>, temDados: boolean): string {
  if (!temDados || setor.estado === 'escalaPropria') return '—';
  if (setor.estado === 'semMedico') return textos.semaforo.semMedico;
  return setor.cargaPorMedico === null ? '—' : c.numero(setor.cargaPorMedico);
}

/**
 * No celular, a situação fica à direita da rolagem; um quadradinho da cor, junto ao nome do setor (que não
 * rola), dá a pista sem rolar. O rótulo continua na coluna Situação.
 */
function MarcaCelular({ setor, temDados }: { readonly setor: SetorNoPainel; readonly temDados: boolean }) {
  if (!temDados) return null;
  const visual = visualDoSetor(setor);
  if (visual.tipo !== 'semaforo') return null;
  return (
    <span aria-hidden="true" className={`size-3 shrink-0 rounded-[2px] border md:hidden ${AMOSTRA_COR[visual.cor]}`} />
  );
}

/** Célula da situação: cheia na cor do semáforo, sempre com o rótulo escrito. */
function Situacao({
  coluna,
  setor,
  temDados,
}: {
  readonly coluna: string;
  readonly setor: SetorNoPainel;
  readonly temDados: boolean;
}) {
  if (!temDados)
    return (
      <td data-coluna={coluna} className={`${TD} text-tinta-suave`}>
        —
      </td>
    );
  const visual = visualDoSetor(setor);
  if (visual.tipo !== 'semaforo')
    return (
      <td data-coluna={coluna} className={`${TD} text-tinta-suave`}>
        {visual.rotulo}
      </td>
    );
  return (
    <td data-coluna={coluna} className="px-1 py-0.5 align-middle">
      <span
        data-cor={visual.cor}
        className={`flex h-full min-h-8 items-center rounded-controle px-2.5 font-semibold whitespace-nowrap print:[print-color-adjust:exact] ${CELULA_COR[visual.cor]}`}
      >
        {visual.rotulo}
      </span>
    </td>
  );
}

function Medicos({ setor, aoAjustarMedicos }: PropsPlanilha & { readonly setor: SetorNoPainel }) {
  return (
    <div role="group" aria-label={`${c.medicos} do ${setor.nome}`} className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={setor.medicos <= 0}
        aria-label={c.menosMedico(setor.nome)}
        onClick={() => aoAjustarMedicos(setor.id, setor.medicos, -1)}
        className={BOTAO_ICONE}
      >
        <IconeMenos />
      </button>
      <output aria-live="polite" className="min-w-9 text-center text-corpo font-semibold tabular-nums">
        {c.numero(setor.medicos)}
      </output>
      <button
        type="button"
        aria-label={c.maisMedico(setor.nome)}
        onClick={() => aoAjustarMedicos(setor.id, setor.medicos, 1)}
        className={BOTAO_ICONE}
      >
        <IconeMais />
      </button>
    </div>
  );
}

/**
 * Campo de contagem. Enquanto a pessoa digita, o texto fica num rascunho: um valor válido entra na hora no
 * cálculo; um inválido marca o campo e não muda nada. Ao sair do campo, volta ao número em vigor.
 */
function CampoContagem({
  valor,
  rotulo,
  aoMudar,
}: {
  readonly valor: number;
  readonly rotulo: string;
  readonly aoMudar: (valor: number) => void;
}) {
  const [rascunho, setRascunho] = useState<string | null>(null);
  const erro = useId();
  const invalido = rascunho !== null && lerContagem(rascunho) === null;
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={rotulo}
        aria-invalid={invalido || undefined}
        aria-describedby={invalido ? erro : undefined}
        value={rascunho ?? String(valor)}
        onFocus={(evento) => evento.currentTarget.select()}
        onChange={(evento) => {
          const texto = evento.currentTarget.value;
          setRascunho(texto);
          const lido = lerContagem(texto);
          if (lido !== null && lido !== valor) aoMudar(lido);
        }}
        onBlur={() => setRascunho(null)}
        className={`h-7 w-12 rounded-controle border bg-papel px-1.5 text-right text-rotulo font-semibold text-tinta tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco pointer-coarse:h-10 ${
          invalido ? 'border-semaforo-vermelho-traco' : 'border-linha-forte'
        }`}
      />
      {invalido ? (
        <span id={erro} role="alert" className="sr-only">
          {c.campoInvalido}
        </span>
      ) : null}
    </>
  );
}

function Ocultos({ postos }: { readonly postos: readonly string[] }) {
  if (postos.length === 0) return null;
  return (
    <p className="mt-2 text-nota text-tinta-suave">
      {c.ocultos.resumo(postos.length)}: {c.ocultos.lista(postos)}. {c.ocultos.explicacao}
    </p>
  );
}
