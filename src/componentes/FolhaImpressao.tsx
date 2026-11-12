import { useId } from 'react';
import type { Cor, Painel, TipoDia } from '@/calculo/tipos';
import { CORES_DO_SEMAFORO } from '@/calculo/semaforo';
import { textos } from '@/textos';
import type { ItemDaLista } from './apoios-dia';
import { folhaDoDia } from './folha-impressao';
import type { VisualDoSetor } from './painel-dia';

const t = textos.folha;

/** Casa cheia da régua, por cor, escrita por extenso para o Tailwind achar. */
const CASA_CHEIA: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo border-semaforo-azul-escuro-traco',
  azulClaro: 'bg-semaforo-azul-claro-fundo border-semaforo-azul-claro-traco',
  verde: 'bg-semaforo-verde-fundo border-semaforo-verde-traco',
  amarelo: 'bg-semaforo-amarelo-fundo border-semaforo-amarelo-traco',
  vermelho: 'bg-semaforo-vermelho-fundo border-semaforo-vermelho-traco',
};

type PropsFolha = {
  /** Painel sem apoio; a folha aplica os apoios aceitos da lista. */
  readonly painel: Painel;
  readonly lista: readonly ItemDaLista[];
  readonly tipoDia: TipoDia;
  readonly geradaEm: Date;
  /** Endereço do site, para o rodapé. */
  readonly endereco: string;
};

const CELULA = 'border-b border-linha px-2 py-1.5 text-left align-middle';
const NUMERO = `${CELULA} text-right`;

/**
 * Folha de impressão (SPEC-06): cabeçalho, tabela por setor com o antes e o depois, apoios aceitos em frases e
 * rodapé com a média e os totais. Não aparece na tela; na impressão, ocupa o lugar da página interativa.
 */
export function FolhaImpressao({ painel, lista, tipoDia, geradaEm, endereco }: PropsFolha) {
  const titulo = useId();
  const folha = folhaDoDia(painel, lista);
  const c = t.colunas;

  return (
    <section
      data-folha=""
      aria-labelledby={titulo}
      className="hidden bg-papel text-tinta print:flex print:flex-col print:gap-5"
    >
      <header className="flex items-end justify-between gap-6 border-b-2 border-tinta pb-2">
        <h1 id={titulo} className="text-titulo font-semibold">
          {t.titulo}
        </h1>
        <p className="text-right text-rotulo">
          <span className="font-semibold">{textos.topo.tipoDia[tipoDia]}</span>
          <span className="text-tinta-suave"> · {t.geradaEm(geradaEm)}</span>
        </p>
      </header>

      <table className="w-full border-collapse text-rotulo">
        <caption className="sr-only">{t.tabela}</caption>
        <thead>
          <tr className="text-nota text-tinta-suave">
            <th scope="col" className={`${CELULA} border-linha-forte font-semibold`}>
              {c.setor}
            </th>
            <th scope="col" className={`${CELULA} border-linha-forte font-semibold`}>
              {c.postos}
            </th>
            <th scope="col" className={`${NUMERO} border-linha-forte font-semibold`}>
              {c.medicos}
            </th>
            <th scope="col" className={`${NUMERO} border-linha-forte font-semibold`}>
              {c.pacientes}
            </th>
            <th scope="col" className={`${NUMERO} border-linha-forte font-semibold`}>
              {c.antes}
            </th>
            <th scope="col" className={`${NUMERO} border-linha-forte font-semibold`}>
              {c.depois}
            </th>
            <th scope="col" className={`${CELULA} border-linha-forte font-semibold`}>
              {c.cor}
            </th>
          </tr>
        </thead>
        <tbody>
          {folha.linhas.map((linha) => (
            <tr key={linha.id} data-setor={linha.id} className="break-inside-avoid">
              <th scope="row" className={`${CELULA} font-semibold`}>
                {linha.nome}
              </th>
              <td className={`${CELULA} text-tinta-suave`}>{linha.postos}</td>
              <td className={NUMERO}>{linha.medicos}</td>
              <td className={NUMERO}>{linha.pacientes}</td>
              <td className={NUMERO}>{linha.antes}</td>
              <td className={`${NUMERO} font-bold`}>{linha.depois}</td>
              <td className={CELULA}>
                <Cor visual={linha.visual} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-1.5 break-inside-avoid">
        <h2 className="text-rotulo font-semibold">{t.apoios}</h2>
        {folha.apoios.length > 0 ? (
          <ul className="flex flex-col gap-0.5 text-rotulo">
            {folha.apoios.map((frase) => (
              <li key={frase}>{frase}</li>
            ))}
          </ul>
        ) : (
          <p className="text-rotulo text-tinta-suave">{t.semApoios}</p>
        )}
      </div>

      <footer className="flex flex-col gap-1.5 border-t border-linha-forte pt-2 break-inside-avoid">
        <dl className="flex gap-6 text-rotulo">
          <Total rotulo={t.media} valor={folha.media} />
          <Total rotulo={t.medicos} valor={folha.medicos} />
          <Total rotulo={t.pacientes} valor={folha.pacientes} />
        </dl>
        <p className="text-nota text-tinta-suave">{t.gerado(endereco)}</p>
      </footer>
    </section>
  );
}

/**
 * Cor do setor: a régua de cinco casas, com a do setor cheia, e o rótulo escrito ao lado. Em preto e branco,
 * a posição da casa e o rótulo bastam.
 */
function Cor({ visual }: { readonly visual: VisualDoSetor }) {
  if (visual.tipo !== 'semaforo') return <span className="text-tinta-suave">{visual.rotulo}</span>;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className="inline-flex gap-px [print-color-adjust:exact]">
        {CORES_DO_SEMAFORO.map((cor, casa) => (
          <span
            key={cor}
            className={`size-2.5 rounded-[1px] border ${casa === visual.casa ? CASA_CHEIA[cor] : 'border-linha-forte'}`}
          />
        ))}
      </span>
      <span className="font-semibold">{visual.rotulo}</span>
    </span>
  );
}

function Total({ rotulo, valor }: { readonly rotulo: string; readonly valor: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-tinta-suave">{rotulo}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  );
}
