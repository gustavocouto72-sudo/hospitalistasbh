import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const raiz = new URL('../', import.meta.url);
const pacote = JSON.parse(readFileSync(new URL('package.json', raiz), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe('T-01.2 — ferramentas de qualidade', () => {
  it('tem os scripts typecheck, lint, test e format', () => {
    expect(pacote.scripts.typecheck).toBe('tsc -p tsconfig.json --noEmit');
    expect(pacote.scripts.lint).toBe('eslint . && prettier --check .');
    expect(pacote.scripts.test).toBe('vitest run');
    expect(pacote.scripts.format).toBe('prettier --write .');
  });

  it('fixa versões exatas de Vitest, ESLint e Prettier', () => {
    for (const nome of ['vitest', 'eslint', 'prettier', 'eslint-config-prettier']) {
      expect(pacote.devDependencies[nome]).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  // Os configs são .js puros, sem tipos: o import por URL evita a checagem de declaração.
  const carregar = async (arquivo: string) =>
    ((await import(new URL(arquivo, raiz).href)) as { default: unknown }).default;

  it('configura o Prettier com o estilo do código', async () => {
    const prettier = await carregar('prettier.config.js');
    expect(prettier).toMatchObject({ singleQuote: true, semi: true, trailingComma: 'all' });
    expect(existsSync(new URL('.prettierignore', raiz))).toBe(true);
  });

  it('desliga no ESLint as regras de formatação que conflitam com o Prettier', async () => {
    const configuracaoEslint = (await carregar('eslint.config.js')) as { name?: string }[];
    const ultima = configuracaoEslint.at(-1);
    expect(ultima?.name).toBe('eslint-config-prettier');
  });

  it('o Vitest acha os testes de src/ e test/', async () => {
    const { default: vitest } = await import('../vitest.config');
    expect(vitest.test?.include).toEqual(['src/**/*.test.ts', 'test/**/*.test.ts']);
  });
});
