import { useId } from 'react';
import type { Cor, Painel } from '@/calculo/tipos';
import { CORES_DO_SEMAFORO } from '@/calculo/semaforo';
import { textos } from '@/textos';
import { resumoDoDia } from './painel-dia';

const t = textos.resumo;

/** Amostra da faixa de cada cor, com a borda no traço (DESIGN.md: a faixa sempre leva borda de 1 px). */
const AMOSTRA: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo border-semaforo-azul-escuro-traco',
  azulClaro: 'bg-semaforo-azul-claro-fundo border-semaforo-azul-claro-traco',
  verde: 'bg-semaforo-verde-fundo border-semaforo-verde-traco',
  amarelo: 'bg-semaforo-amarelo-fundo border-semaforo-amarelo-traco',
  vermelho: 'bg-semaforo-vermelho-fundo border-semaforo-vermelho-traco',
};

/**
 * Resumo do dia (SPEC-05, item 4): média de pacientes por médico, total de médicos, total de pacientes e
 * quantos setores estão em cada cor.
 */
export function ResumoDia({ painel }: { readonly painel: Painel }) {
  const titulo = useId();
  const resumo = resumoDoDia(painel);
  const numero = textos.cartao.numero;
  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-3">
      <h2 id={titulo} className="text-titulo font-semibold">
        {t.titulo}
      </h2>
      <div className="flex flex-col gap-4 rounded-cartao border border-linha bg-papel p-4 sm:flex-row sm:items-start sm:gap-8">
        <dl className="grid grid-cols-3 gap-3 sm:flex sm:gap-8">
          <Numero rotulo={t.media} valor={resumo.media === null ? '—' : numero(resumo.media)} />
          <Numero rotulo={t.medicos} valor={numero(resumo.medicos)} />
          <Numero rotulo={t.pacientes} valor={numero(resumo.pacientes)} />
        </dl>
        <div className="flex min-w-0 flex-col gap-2 border-t border-linha pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
          <h3 className="text-rotulo font-semibold text-tinta-suave">{t.cores}</h3>
          <ul className="flex flex-col gap-1">
            {CORES_DO_SEMAFORO.map((cor) => (
              <li key={cor} className="flex items-center gap-2 text-rotulo">
                <span
                  aria-hidden="true"
                  className={`size-3.5 shrink-0 rounded-xs border print:[print-color-adjust:exact] ${AMOSTRA[cor]}`}
                />
                <span className="min-w-0 flex-1">{textos.semaforo[cor]}</span>
                <span className="font-semibold">
                  <span aria-hidden="true">{resumo.porCor[cor]}</span>
                  <span className="sr-only">{t.setores(resumo.porCor[cor])}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {resumo.media === null ? (
        <p role="status" className="text-rotulo text-tinta-suave">
          {textos.painel.avisos.mediaIndefinida}
        </p>
      ) : null}
    </section>
  );
}

function Numero({ rotulo, valor }: { readonly rotulo: string; readonly valor: string }) {
  return (
    <div className="flex min-w-0 flex-col justify-between">
      <dt className="text-rotulo text-tinta-suave">{rotulo}</dt>
      <dd className="text-numero font-semibold">{valor}</dd>
    </div>
  );
}
