import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const raiz = new URL('../', import.meta.url);
const pacote = JSON.parse(readFileSync(new URL('package.json', raiz), 'utf8')) as {
  devDependencies: Record<string, string>;
};

describe('T-01.3 — Tailwind e estrutura de pastas', () => {
  it('instala Tailwind e o plugin do PostCSS com versões exatas', () => {
    for (const nome of ['tailwindcss', '@tailwindcss/postcss', 'postcss']) {
      expect(pacote.devDependencies[nome]).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('liga o Tailwind no PostCSS e no CSS global importado pelo layout', async () => {
    const { default: postcss } = (await import(new URL('postcss.config.mjs', raiz).href)) as {
      default: { plugins: Record<string, unknown> };
    };
    expect(postcss.plugins).toHaveProperty('@tailwindcss/postcss');
    expect(readFileSync(new URL('src/app/globals.css', raiz), 'utf8')).toMatch(/@import ['"]tailwindcss['"]/);
    expect(readFileSync(new URL('src/app/layout.tsx', raiz), 'utf8')).toContain("import './globals.css'");
  });

  it('cria as pastas da estrutura', () => {
    for (const pasta of [
      'src/calculo',
      'src/relatorio',
      'src/componentes',
      'src/textos',
      'src/config',
      'test/fixtures',
    ]) {
      expect(existsSync(new URL(`${pasta}/`, raiz)), pasta).toBe(true);
    }
  });

  describe('calculo/ e relatorio/ não importam React', () => {
    const eslint = new ESLint({ cwd: fileURLToPath(raiz) });
    const lintar = async (codigo: string, arquivo: string) => {
      const [resultado] = await eslint.lintText(codigo, { filePath: arquivo });
      return (resultado?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports');
    };

    for (const pasta of ['calculo', 'relatorio']) {
      for (const modulo of ['react', 'react-dom/client', 'next/link', 'react/jsx-runtime']) {
        it(`bloqueia ${modulo} em ${pasta}/`, async () => {
          const erros = await lintar(`import x from '${modulo}';\nexport const y = x;\n`, `src/${pasta}/exemplo.ts`);
          expect(erros).toHaveLength(1);
        });
      }

      it(`bloqueia import de componentes/ em ${pasta}/`, async () => {
        const erros = await lintar(
          `import x from '@/componentes/Tela';\nexport const y = x;\n`,
          `src/${pasta}/exemplo.ts`,
        );
        expect(erros).toHaveLength(1);
      });
    }

    it('permite React em componentes/', async () => {
      const erros = await lintar(
        `import { useState } from 'react';\nexport const y = useState;\n`,
        'src/componentes/exemplo.tsx',
      );
      expect(erros).toHaveLength(0);
    });
  });
});
