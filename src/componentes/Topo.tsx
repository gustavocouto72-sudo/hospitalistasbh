import { useId } from 'react';
import type { TipoDia } from '@/calculo/tipos';
import { chaveDoDia } from '@/calculo/tipo-dia';
import { textos } from '@/textos';

const TIPOS: readonly TipoDia[] = ['semana', 'fimDeSemana'];

type PropsTopo = {
  /** Dia de hoje no aparelho. `null` no HTML estático, antes de a página abrir no navegador. */
  readonly hoje: Date | null;
  /** Tipo de dia em vigor. `null` enquanto o dia ainda não é conhecido. */
  readonly tipoDia: TipoDia | null;
  readonly aoEscolher: (tipoDia: TipoDia) => void;
};

/** Topo da página (SPEC-05, item 1): título, data de hoje e o seletor Dia de semana / Fim de semana. */
export function Topo({ hoje, tipoDia, aoEscolher }: PropsTopo) {
  const nome = useId();
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-titulo font-semibold text-balance">{textos.app.titulo}</h1>
        <p className="text-rotulo text-tinta-suave min-h-5">
          {hoje ? <time dateTime={chaveDoDia(hoje)}>{textos.topo.data(hoje)}</time> : null}
        </p>
      </div>
      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="text-rotulo font-semibold text-tinta-suave mb-1">{textos.topo.tipoDia.legenda}</legend>
        <div className="grid grid-cols-2 rounded-controle border border-linha-forte bg-papel p-0.5 sm:inline-grid">
          {TIPOS.map((tipo) => (
            <label
              key={tipo}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-[calc(var(--radius-controle)-2px)] px-4 text-rotulo font-semibold whitespace-nowrap transition-colors duration-150 ease-out select-none hover:bg-pagina has-checked:bg-tinta has-checked:text-papel has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foco motion-reduce:transition-none"
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
    </header>
  );
}
