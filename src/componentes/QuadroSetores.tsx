import { useId } from 'react';
import type { Ajustes, ContagemDoPosto, Contagens, Painel } from '@/calculo/tipos';
import { textos } from '@/textos';
import { CartaoSetor } from './CartaoSetor';
import { notasDoSetor, visualDoSetor } from './painel-dia';

const t = textos.cartao;

type PropsQuadro = {
  readonly painel: Painel;
  readonly postos: readonly ContagemDoPosto[];
  readonly ajustes: Ajustes;
  readonly fonte: 'relatorio' | 'manual';
  readonly aoAjustarMedicos: (setor: string, semAjuste: number, sentido: 1 | -1) => void;
  readonly aoAjustarContagem: (posto: string, campo: keyof Contagens, valor: number) => void;
};

/**
 * Quadro de setores (SPEC-05, item 3): um cartão por setor, na ordem fixa do quadro, e os postos ocultos numa
 * linha recolhível. Uma coluna no celular, grade no desktop.
 */
export function QuadroSetores({ painel, postos, ajustes, fonte, aoAjustarMedicos, aoAjustarContagem }: PropsQuadro) {
  const titulo = useId();
  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-3">
      <h2 id={titulo} className="text-titulo font-semibold">
        {t.titulo}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]">
        {painel.setores.map((setor) => (
          <CartaoSetor
            key={setor.id}
            setor={setor}
            visual={visualDoSetor(setor)}
            notas={notasDoSetor(painel, setor, fonte)}
            postos={postos}
            ajustes={ajustes}
            aoAjustarMedicos={aoAjustarMedicos}
            aoAjustarContagem={aoAjustarContagem}
          />
        ))}
      </div>
      {painel.postosOcultos.length > 0 ? (
        <details className="group rounded-cartao border border-linha bg-papel">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-rotulo font-semibold text-tinta-suave select-none hover:bg-pagina focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco [&::-webkit-details-marker]:hidden">
            <IconeSeta />
            {t.ocultos.resumo(painel.postosOcultos.length)}
          </summary>
          <div className="flex flex-col gap-1 border-t border-linha px-4 py-3">
            <p className="text-nota text-tinta-suave">{t.ocultos.explicacao}</p>
            <p className="text-corpo">{t.ocultos.lista(painel.postosOcultos)}</p>
          </div>
        </details>
      ) : null}
    </section>
  );
}

function IconeSeta() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-150 ease-out group-open:rotate-90 motion-reduce:transition-none"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
