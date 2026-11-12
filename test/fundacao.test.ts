import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import configuracao from '../next.config';

const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  packageManager: string;
  engines: { node: string };
  scripts: Record<string, string>;
};

describe('T-01.1 — repositório e app', () => {
  it('gera site estático', () => {
    expect(configuracao.output).toBe('export');
  });

  it('usa pnpm e Node fixado igual ao OncoWay', () => {
    expect(pacote.packageManager).toMatch(/^pnpm@/);
    expect(pacote.engines.node).toBe('24.22.1');
    expect(readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim()).toBe('24');
  });

  it('fixa a porta 3010 no dev e no start', () => {
    expect(pacote.scripts.dev).toBe('next dev -p 3010');
    expect(pacote.scripts.start).toBe('next start -p 3010');
  });

  it('tem os scripts de qualidade', () => {
    expect(pacote.scripts).toHaveProperty('typecheck');
    expect(pacote.scripts).toHaveProperty('lint');
    expect(pacote.scripts).toHaveProperty('test');
  });
});
