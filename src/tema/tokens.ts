/**
 * Tokens do tema (T-05.1). A direção e o porquê de cada valor ficam no `DESIGN.md` da raiz. Os mesmos valores
 * estão em `src/app/globals.css` (`@theme`), e `tema.test.ts` confere que os dois não divergem e que a paleta
 * passa nos testes de contraste e de daltonismo.
 */
import type { Cor } from '@/calculo/tipos';

/** Papéis neutros e de interface. */
export const cores = {
  /** Fundo da página: a mesa sob a tabela plastificada. */
  pagina: '#eef0f2',
  /** Superfície dos cartões e da folha impressa. */
  papel: '#ffffff',
  /** Texto principal, números e o botão principal. */
  tinta: '#14181f',
  /** Texto secundário: postos, rótulos de campo, notas. */
  tintaSuave: '#4a5361',
  /** Fios divisórios dentro do cartão. */
  linha: '#d5d9df',
  /** Borda de campo e de controle (3:1 sobre o papel). */
  linhaForte: '#8a93a0',
  /** Botão principal: preto, para não competir com as cores do semáforo. */
  acao: '#14181f',
  acaoTexto: '#ffffff',
  /** Anel de foco, sempre com 2 px de folga do controle. */
  foco: '#14181f',
  /** Potenciais admissões: violeta, fora da família do semáforo. */
  admissao: '#6b2fa3',
  admissaoFundo: '#f1e8fa',
} as const;

/** Uma cor do semáforo em três papéis: faixa cheia, texto sobre a faixa e traço sobre o papel. */
export interface CorDoSemaforo {
  /** Faixa cheia do cabeçalho do cartão. */
  fundo: string;
  /** Texto sobre o `fundo` (AA). */
  texto: string;
  /** Rótulo, ícone ou borda sobre o papel e a página (AA). */
  traco: string;
}

/** As cinco cores do semáforo (PRD §6.3), na ordem de `CORES_DO_SEMAFORO`. */
export const semaforo: Record<Cor, CorDoSemaforo> = {
  azulEscuro: { fundo: '#1d3f8f', texto: '#ffffff', traco: '#1d3f8f' },
  azulClaro: { fundo: '#9ccbf2', texto: '#0b1d33', traco: '#1f5f99' },
  verde: { fundo: '#3daa6e', texto: '#0e2a12', traco: '#1e6b3f' },
  amarelo: { fundo: '#ffd84a', texto: '#2b2100', traco: '#7a5a00' },
  vermelho: { fundo: '#a51c1c', texto: '#ffffff', traco: '#a51c1c' },
};

/** Tipografia: uma família de sistema, escala fixa em rem (razão perto de 1,2) e números tabulares. */
export const tipografia = {
  familia:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  tamanhos: {
    nota: '0.75rem',
    rotulo: '0.875rem',
    corpo: '1rem',
    titulo: '1.25rem',
    numero: '1.5rem',
    carga: '2.25rem',
  },
} as const;

/** `tintaSuave` → `tinta-suave`; `semaforo-azulEscuro-fundo` → `semaforo-azul-escuro-fundo`. */
export function nomeDoToken(nome: string): string {
  return nome.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
}
