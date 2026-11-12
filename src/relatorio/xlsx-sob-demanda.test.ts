/**
 * T-02.5 — o SheetJS só é carregado quando o arquivo é xlsx, e nenhum módulo o importa de forma
 * estática, para que ele fique fora do bundle inicial.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { lerRelatorio } from './ler';

const carregamentos = vi.hoisted(() => ({ total: 0 }));

vi.mock('xlsx', async (importOriginal) => {
  carregamentos.total++;
  return importOriginal();
});

const pasta = new URL('../../test/fixtures/', import.meta.url);
const ler = (nome: string): ArrayBuffer => {
  const bytes = readFileSync(new URL(nome, pasta));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const raiz = fileURLToPath(new URL('../', import.meta.url));
const fontes = (pasta: string): string[] =>
  readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return fontes(caminho);
    return /\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });

describe('T-02.5 — SheetJS sob demanda', () => {
  it('texto tabulado e CSV não carregam o SheetJS', async () => {
    for (const nome of ['relatorio-9998-latin1.xls', 'relatorio-9998-ponto-e-virgula.csv', 'borda-vazio.xls']) {
      await lerRelatorio(ler(nome), nome);
    }
    expect(carregamentos.total).toBe(0);
  });

  it('o xlsx carrega o SheetJS uma única vez, mesmo lido várias vezes', async () => {
    const primeira = await lerRelatorio(ler('relatorio-9998.xlsx'), 'relatorio-9998.xlsx');
    const segunda = await lerRelatorio(ler('relatorio-9998.xlsx'), 'outro-nome.bin');
    expect(primeira.postos).toHaveLength(12);
    expect(segunda).toEqual(primeira);
    expect(carregamentos.total).toBe(1);
  });

  it('nenhum módulo de src/ importa o SheetJS de forma estática', () => {
    const estatico =
      /(?:^|\n)\s*(?:import|export)\b[^;]*?\bfrom\s*['"]xlsx(?:\/[^'"]*)?['"]|(?:^|\n)\s*import\s*['"]xlsx['"]|require\(\s*['"]xlsx/;
    const comImportEstatico = fontes(raiz).filter((arquivo) => estatico.test(readFileSync(arquivo, 'utf8')));
    expect(comImportEstatico).toEqual([]);
  });

  it('a leitura usa import() dinâmico do SheetJS', () => {
    const codigo = readFileSync(new URL('./ler.ts', import.meta.url), 'utf8');
    expect(codigo).toMatch(/await import\(\s*['"]xlsx['"]\s*\)/);
  });
});
