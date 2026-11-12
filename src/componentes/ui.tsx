/**
 * Peças visuais repetidas na tela: classes de botão e de campo, as cores do semáforo por extenso (para o
 * Tailwind achar) e os ícones de traço único.
 */
import type { Cor } from '@/calculo/tipos';

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco';
const TRANSICAO = 'transition-colors duration-150 ease-out motion-reduce:transition-none';

export const BOTAO_PRINCIPAL = `inline-flex h-9 items-center justify-center gap-2 rounded-controle bg-acao px-3.5 text-rotulo font-semibold whitespace-nowrap text-acao-texto hover:opacity-90 disabled:cursor-wait disabled:opacity-60 pointer-coarse:h-11 ${FOCO} transition-opacity duration-150 ease-out motion-reduce:transition-none`;

export const BOTAO_SECUNDARIO = `inline-flex h-9 items-center justify-center gap-2 rounded-controle border border-linha-forte bg-papel px-3.5 text-rotulo font-semibold whitespace-nowrap hover:bg-pagina disabled:cursor-not-allowed disabled:text-tinta-suave disabled:hover:bg-papel pointer-coarse:h-11 ${FOCO} ${TRANSICAO}`;

/** Botão só com ícone (− e +, remover). */
export const BOTAO_ICONE = `flex size-7 shrink-0 items-center justify-center rounded-controle border border-linha-forte bg-papel hover:bg-pagina disabled:cursor-not-allowed disabled:border-linha disabled:text-linha-forte disabled:hover:bg-papel pointer-coarse:size-10 ${FOCO} ${TRANSICAO}`;

export const SELECT = `h-7 min-w-0 rounded-controle border border-linha-forte bg-papel px-1.5 text-rotulo font-semibold text-tinta pointer-coarse:h-10 ${FOCO}`;

/** Célula cheia do semáforo: fundo da faixa e texto com contraste AA. */
export const CELULA_COR: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo text-semaforo-azul-escuro-texto',
  azulClaro: 'bg-semaforo-azul-claro-fundo text-semaforo-azul-claro-texto',
  verde: 'bg-semaforo-verde-fundo text-semaforo-verde-texto',
  amarelo: 'bg-semaforo-amarelo-fundo text-semaforo-amarelo-texto',
  vermelho: 'bg-semaforo-vermelho-fundo text-semaforo-vermelho-texto',
};

/** Amostra pequena da cor (legenda), com borda no traço para os tons claros não sumirem no papel. */
export const AMOSTRA_COR: Record<Cor, string> = {
  azulEscuro: 'bg-semaforo-azul-escuro-fundo border-semaforo-azul-escuro-traco',
  azulClaro: 'bg-semaforo-azul-claro-fundo border-semaforo-azul-claro-traco',
  verde: 'bg-semaforo-verde-fundo border-semaforo-verde-traco',
  amarelo: 'bg-semaforo-amarelo-fundo border-semaforo-amarelo-traco',
  vermelho: 'bg-semaforo-vermelho-fundo border-semaforo-vermelho-traco',
};

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

type PropsIcone = { readonly tamanho?: number; readonly className?: string };

export function IconeMenos({ tamanho = 14 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco} strokeWidth={2.25}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconeMais({ tamanho = 14 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco} strokeWidth={2.25}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeFechar({ tamanho = 14 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconeSubir({ tamanho = 16 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0" {...traco}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconeImpressora({ tamanho = 16 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0" {...traco}>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  );
}

export function IconeLapis({ tamanho = 16 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0" {...traco}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconeCadeado({ tamanho = 14 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0" {...traco}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconeErro({ tamanho = 16 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

export function IconeAviso({ tamanho = 16 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" {...traco}>
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  );
}

export function IconeSeta({ tamanho = 14 }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0" {...traco}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
