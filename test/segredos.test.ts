import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = new URL('../', import.meta.url);
const pacote = JSON.parse(readFileSync(new URL('package.json', raiz), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('T-01.5 — porta e segredos', () => {
  const mapaDePortas = `${homedir()}/Antigravity/PORTS.md`;

  it.skipIf(!existsSync(mapaDePortas))('registra a porta 3010 em ~/Antigravity/PORTS.md', () => {
    expect(readFileSync(mapaDePortas, 'utf8')).toMatch(/^\| 3010 \| Hospitalistas divisao \|/m);
  });

  it('roda o gitleaks no pre-commit versionado', () => {
    const gancho = new URL('.githooks/pre-commit', raiz);
    expect(existsSync(gancho)).toBe(true);
    expect(statSync(gancho).mode & 0o111).not.toBe(0);
    expect(readFileSync(gancho, 'utf8')).toContain('gitleaks git --pre-commit --staged');
    expect(readFileSync(new URL('.gitleaks.toml', raiz), 'utf8')).toMatch(/useDefault = true/);
    expect(pacote.scripts.prepare).toBe('git config core.hooksPath .githooks || true');
  });

  it('o .gitignore barra build, dependências e relatórios fora de test/fixtures/', () => {
    const ignorados = (caminhos: string[]) =>
      execFileSync('git', ['check-ignore', '--no-index', ...caminhos], {
        cwd: fileURLToPath(raiz),
        encoding: 'utf8',
      })
        .trim()
        .split('\n');
    const devemSerIgnorados = [
      'out/index.html',
      '.next/cache/x',
      'node_modules/x/index.js',
      'relatorio.xls',
      'docs/relatorio.xlsx',
      'src/relatorio.csv',
    ];
    expect(ignorados(devemSerIgnorados)).toEqual(devemSerIgnorados);

    const fixtures = ['test/fixtures/sintetico.xls', 'test/fixtures/sub/sintetico.csv'];
    const resultado = execFileSync('git', ['check-ignore', '--no-index', '-v', '-n', ...fixtures], {
      cwd: fileURLToPath(raiz),
      encoding: 'utf8',
    });
    // Com -n, os não ignorados aparecem com a fonte vazia ou casados por uma regra de negação (!).
    for (const linha of resultado.trim().split('\n')) {
      expect(linha).toMatch(/^(::|\S+:\d+:!)/);
    }
  });
});
