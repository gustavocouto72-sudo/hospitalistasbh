import type { Quadro } from '@/calculo/tipos';
import { textos } from '@/textos';

const t = textos.quadroPadrao;

/**
 * Quadro de médicos por setor do tipo de dia em vigor. Mostra que o seletor troca o quadro; os cartões de
 * setor com contagens e semáforo chegam na T-05.4.
 */
export function QuadroPadrao({ quadro }: { readonly quadro: Quadro }) {
  const total = quadro.setores.reduce((soma, setor) => soma + (setor.modo === 'calculado' ? setor.medicos : 0), 0);
  return (
    <section aria-labelledby="titulo-quadro-padrao" className="flex flex-col gap-3">
      <h2 id="titulo-quadro-padrao" className="text-titulo font-semibold">
        {t.titulo}
      </h2>
      <div className="overflow-hidden rounded-cartao border border-linha bg-papel">
        <table className="w-full border-collapse text-corpo">
          <thead>
            <tr className="border-b border-linha text-left text-rotulo text-tinta-suave">
              <th scope="col" className="px-4 py-2 font-semibold">
                {t.setor}
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                {t.postos}
              </th>
              <th scope="col" className="px-4 py-2 text-right font-semibold">
                {t.medicos}
              </th>
            </tr>
          </thead>
          <tbody>
            {quadro.setores.map((setor) => (
              <tr key={setor.id} className="border-b border-linha last:border-b-0">
                <th scope="row" className="px-4 py-2 text-left font-semibold">
                  {setor.nome}
                </th>
                <td className="px-4 py-2 text-rotulo text-tinta-suave">{t.juntarPostos(setor.postos)}</td>
                <td className="px-4 py-2 text-right">
                  {setor.modo === 'escalaPropria' ? (
                    <span className="text-rotulo text-tinta-suave">{t.escalaPropria}</span>
                  ) : (
                    t.numero(setor.medicos)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-tinta">
              <th scope="row" colSpan={2} className="px-4 py-2 text-left font-semibold">
                {t.totalMedicos}
              </th>
              <td className="px-4 py-2 text-right text-numero font-bold">{t.numero(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
