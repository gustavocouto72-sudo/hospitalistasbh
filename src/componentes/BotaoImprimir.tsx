import { textos } from '@/textos';

const t = textos.imprimir;

/**
 * Botão "Imprimir ou gerar PDF" (SPEC-06): chama `window.print()`. O próprio navegador oferece "Salvar como
 * PDF", no celular e no desktop, sem biblioteca de PDF nem servidor. Some na impressão, junto com o `main`.
 */
export function BotaoImprimir() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-controle bg-acao px-5 text-rotulo font-semibold text-acao-texto transition-opacity duration-150 ease-out hover:opacity-90 motion-reduce:transition-none"
      >
        <IconeImpressora />
        {t.botao}
      </button>
      <p className="max-w-prose text-rotulo text-tinta-suave">{t.nota}</p>
    </div>
  );
}

function IconeImpressora() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      className="shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  );
}
