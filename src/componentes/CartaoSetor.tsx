'use client';

import { useId, useState } from 'react';
import type { Ajustes, ContagemDoPosto, Contagens, Cor, SetorNoPainel } from '@/calculo/tipos';
import { CORES_DO_SEMAFORO } from '@/calculo/semaforo';
import { textos } from '@/textos';
import { contagensDosPostos, lerContagem, type VisualDoSetor } from './painel-dia';

const t = textos.cartao;

/** Classes fixas por cor, escritas por extenso para o Tailwind achar (DESIGN.md, "Semáforo"). */
const FAIXA: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo text-semaforo-azul-escuro-texto border-semaforo-azul-escuro-traco',
  azulClaro: 'bg-semaforo-azul-claro-fundo text-semaforo-azul-claro-texto border-semaforo-azul-claro-traco',
  verde: 'bg-semaforo-verde-fundo text-semaforo-verde-texto border-semaforo-verde-traco',
  amarelo: 'bg-semaforo-amarelo-fundo text-semaforo-amarelo-texto border-semaforo-amarelo-traco',
  vermelho: 'bg-semaforo-vermelho-fundo text-semaforo-vermelho-texto border-semaforo-vermelho-traco',
};

const CASA_CHEIA: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo border-semaforo-azul-escuro-traco',
  azulClaro: 'bg-semaforo-azul-claro-fundo border-semaforo-azul-claro-traco',
  verde: 'bg-semaforo-verde-fundo border-semaforo-verde-traco',
  amarelo: 'bg-semaforo-amarelo-fundo border-semaforo-amarelo-traco',
  vermelho: 'bg-semaforo-vermelho-fundo border-semaforo-vermelho-traco',
};

const CASA_VAZIA: Record<Cor, string> = {
  azulEscuro: 'border-semaforo-azul-escuro-traco',
  azulClaro: 'border-semaforo-azul-claro-traco',
  verde: 'border-semaforo-verde-traco',
  amarelo: 'border-semaforo-amarelo-traco',
  vermelho: 'border-semaforo-vermelho-traco',
};

const CAMPOS = ['hospitalistas', 'cardioGeriatria', 'potenciaisAdmissoes'] as const;

export type PropsCartao = {
  readonly setor: SetorNoPainel;
  readonly visual: VisualDoSetor;
  readonly notas: readonly string[];
  /** Postos lidos (ou nenhum, no preenchimento à mão) e ajustes do dia, para os campos por posto. */
  readonly postos: readonly ContagemDoPosto[];
  readonly ajustes: Ajustes;
  readonly aoAjustarMedicos: (setor: string, semAjuste: number, sentido: 1 | -1) => void;
  readonly aoAjustarContagem: (posto: string, campo: keyof Contagens, valor: number) => void;
};

/**
 * Cartão de um setor (SPEC-05, item 3): faixa do semáforo com nome e rótulo, pacientes por médico em destaque,
 * diferença para a média, régua de cinco casas, médicos com − e + e as contagens de cada posto.
 */
export function CartaoSetor(props: PropsCartao) {
  const { setor, visual, notas } = props;
  const titulo = useId();

  if (visual.tipo === 'escalaPropria') {
    return (
      <article
        data-setor={setor.id}
        aria-labelledby={titulo}
        className="flex flex-col gap-3 rounded-cartao border border-dashed border-linha-forte bg-papel p-4"
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id={titulo} className="text-titulo font-semibold">
            {setor.nome}
          </h3>
          <p className="text-rotulo font-semibold text-tinta-suave">{visual.rotulo}</p>
        </header>
        <p className="text-rotulo text-tinta-suave">
          {textos.quadroPadrao.juntarPostos(setor.postos)} · {t.escalaPropriaNota}
        </p>
        <p className="text-corpo">
          <span className="font-semibold">{t.numero(setor.carga)}</span> {t.pacientes(setor.carga)}
        </p>
        <Contagens {...props} />
        <Notas notas={notas} />
      </article>
    );
  }

  const faixa = visual.tipo === 'semaforo' ? FAIXA[visual.cor] : 'bg-pagina text-tinta border-linha-forte';

  return (
    <article
      data-setor={setor.id}
      aria-labelledby={titulo}
      className="flex flex-col rounded-cartao border border-linha bg-papel"
    >
      <header
        className={`-mx-px -mt-px flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-t-cartao border px-4 py-2 print:[print-color-adjust:exact] ${faixa}`}
      >
        <h3 id={titulo} className="text-titulo font-semibold">
          {setor.nome}
        </h3>
        <p className="text-rotulo font-semibold">{visual.rotulo}</p>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <p className="text-rotulo text-tinta-suave">{textos.quadroPadrao.juntarPostos(setor.postos)}</p>
        <Numeros setor={setor} />
        {visual.tipo === 'semaforo' ? <Regua cor={visual.cor} /> : null}
        <Medicos {...props} />
        <Contagens {...props} />
        <Notas notas={notas} />
      </div>
    </article>
  );
}

function Numeros({ setor }: { readonly setor: SetorNoPainel }) {
  if (setor.estado !== 'calculado' || setor.cargaPorMedico === null) {
    const legenda = setor.estado === 'semMedico' ? t.semMedico(setor.carga) : t.pacientes(setor.carga);
    return (
      <p className="flex flex-col">
        <span className="text-carga font-bold">{t.numero(setor.carga)}</span>
        <span className="text-rotulo text-tinta-suave">{legenda}</span>
      </p>
    );
  }
  return (
    <div className="flex items-end justify-between gap-3">
      <p className="flex flex-col">
        <span className="text-carga font-bold">{t.numero(setor.cargaPorMedico)}</span>
        <span className="text-rotulo text-tinta-suave">{t.porMedico}</span>
      </p>
      {setor.diferenca === null ? null : (
        <p className="flex flex-col items-end text-right">
          <span className="text-numero font-semibold">{t.diferenca(setor.diferenca)}</span>
          <span className="text-rotulo text-tinta-suave">{t.daMedia}</span>
        </p>
      )}
    </div>
  );
}

/** Régua de cinco casas: a posição diz o nível sem depender da cor (DESIGN.md, "Gesto próprio"). */
function Regua({ cor }: { readonly cor: Cor }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-5 gap-1 print:[print-color-adjust:exact]">
      {CORES_DO_SEMAFORO.map((casa) => (
        <span
          key={casa}
          className={`h-2.5 rounded-xs border ${casa === cor ? CASA_CHEIA[casa] : `bg-papel ${CASA_VAZIA[casa]}`}`}
        />
      ))}
    </div>
  );
}

function Medicos({ setor, aoAjustarMedicos }: PropsCartao) {
  const rotulo = useId();
  const botao =
    'flex size-11 shrink-0 items-center justify-center rounded-controle border border-linha-forte bg-papel transition-colors duration-150 ease-out hover:bg-pagina focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:border-linha-forte/60 disabled:text-tinta-suave disabled:hover:bg-papel motion-reduce:transition-none';
  return (
    <div className="flex items-center justify-between gap-3 border-t border-linha pt-3">
      <span id={rotulo} className="text-rotulo font-semibold">
        {t.medicos}
      </span>
      <div role="group" aria-labelledby={rotulo} className="flex items-center gap-1">
        <button
          type="button"
          disabled={setor.medicos <= 0}
          aria-label={t.menosMedico(setor.nome)}
          onClick={() => aoAjustarMedicos(setor.id, setor.medicos, -1)}
          className={botao}
        >
          <IconeMenos />
        </button>
        <output aria-live="polite" className="min-w-12 text-center text-numero font-semibold">
          {t.numero(setor.medicos)}
        </output>
        <button
          type="button"
          aria-label={t.maisMedico(setor.nome)}
          onClick={() => aoAjustarMedicos(setor.id, setor.medicos, 1)}
          className={botao}
        >
          <IconeMais />
        </button>
      </div>
    </div>
  );
}

function Contagens({ setor, postos, ajustes, aoAjustarContagem }: PropsCartao) {
  const porPosto = contagensDosPostos(postos, ajustes, setor.postos);
  return (
    <table className="w-full border-collapse text-rotulo">
      <thead>
        <tr className="border-b border-linha text-tinta-suave">
          <th scope="col" className="py-1 pr-2 text-left font-semibold">
            {t.posto}
          </th>
          {porPosto.map((p) => (
            <th key={p.codigo} scope="col" className="py-1 pl-2 text-right font-semibold">
              {p.codigo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CAMPOS.map((campo) => {
          const destaque = campo === 'potenciaisAdmissoes';
          return (
            <tr key={campo} className="border-b border-linha last:border-b-0">
              <th
                scope="row"
                className={`py-1 pr-2 text-left font-semibold ${destaque ? 'text-admissao' : 'text-tinta'}`}
              >
                {t.linhas[campo]}
              </th>
              {porPosto.map((p) => (
                <td key={p.codigo} className="py-1 pl-2 text-right">
                  <CampoContagem
                    valor={p[campo]}
                    rotulo={t.campo[campo](p.codigo)}
                    destaque={destaque}
                    aoMudar={(valor) => aoAjustarContagem(p.codigo, campo, valor)}
                  />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type PropsCampo = {
  readonly valor: number;
  readonly rotulo: string;
  readonly destaque: boolean;
  readonly aoMudar: (valor: number) => void;
};

/**
 * Campo de contagem. Enquanto a pessoa digita, o texto fica num rascunho: um valor válido entra na hora no
 * cálculo; um inválido marca o campo e não muda nada. Ao sair do campo, volta ao número em vigor.
 */
function CampoContagem({ valor, rotulo, destaque, aoMudar }: PropsCampo) {
  const [rascunho, setRascunho] = useState<string | null>(null);
  const erro = useId();
  const invalido = rascunho !== null && lerContagem(rascunho) === null;
  const cor = invalido
    ? 'border-semaforo-vermelho-traco bg-papel text-tinta'
    : destaque
      ? 'border-admissao bg-admissao-fundo text-admissao'
      : 'border-linha-forte bg-papel text-tinta';
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
        className={`h-11 w-14 rounded-controle border px-2 text-right text-corpo font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco ${cor}`}
      />
      {invalido ? (
        <span id={erro} role="alert" className="sr-only">
          {t.campoInvalido}
        </span>
      ) : null}
    </>
  );
}

function Notas({ notas }: { readonly notas: readonly string[] }) {
  if (notas.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-nota text-tinta-suave">
      {notas.map((nota) => (
        <li key={nota}>{nota}</li>
      ))}
    </ul>
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
