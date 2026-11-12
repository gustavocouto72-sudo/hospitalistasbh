/**
 * Folha de impressão da SPEC-06 com a fixture sintética da amostra: em `@media print` os controles somem, a
 * folha mostra cabeçalho, tabela, apoios da recomendação e rodapé, e o PDF em A4 sai com uma página só.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { textos } from '../src/textos';

const FIXTURE = resolve(process.cwd(), 'test/fixtures/relatorio-9998-latin1.xls');
const t = textos.folha;

test.beforeEach(async ({ page }) => {
  // Quinta-feira, 12/11/2026: o padrão é dia de semana.
  await page.clock.setFixedTime(new Date('2026-11-12T09:00:00-03:00'));
});

async function subirRelatorio(page: Page) {
  await page.goto('/');
  const seletor = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: textos.subir.escolher }).click();
  await (await seletor).setFiles(FIXTURE);
  await expect(page.getByText(/postos lidos\./)).toBeVisible();
  // A recomendação já vale e vai inteira para a folha.
  await expect(page.locator('li[data-apoio]').first()).toBeVisible();
}

/** Páginas de um PDF do Chromium: os objetos `/Type /Page`, sem contar o `/Pages` da árvore. */
const paginas = (pdf: Buffer) => pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-z])/g)?.length ?? 0;

test('na impressão, só a folha aparece, sem controles', async ({ page }) => {
  await subirRelatorio(page);
  const folha = page.locator('section[data-folha]');
  await expect(folha).toBeHidden();

  await page.emulateMedia({ media: 'print' });
  await expect(folha).toBeVisible();
  await expect(page.locator('main')).toBeHidden();
  // Botões, upload e controles de edição não aparecem.
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(folha.getByRole('heading', { name: t.titulo })).toBeVisible();
  await expect(folha.getByText(textos.topo.tipoDia.semana)).toBeVisible();
  await expect(folha.getByRole('columnheader', { name: t.colunas.depois })).toBeVisible();
  await expect(folha.getByRole('heading', { name: t.apoios })).toBeVisible();
  await expect(folha.getByText(/ apoia \d+ leitos? do /).first()).toBeVisible();
  await expect(folha.getByText(t.gerado('127.0.0.1:3010'))).toBeVisible();
});

test('o botão "Imprimir ou gerar PDF" chama window.print()', async ({ page }) => {
  await page.addInitScript(() => {
    const contagem = { vezes: 0 };
    Object.assign(window, { __impressoes: contagem });
    window.print = () => {
      contagem.vezes++;
    };
  });
  await subirRelatorio(page);
  await page.getByRole('button', { name: textos.imprimir.botao }).click();
  expect(await page.evaluate(() => (window as unknown as { __impressoes: { vezes: number } }).__impressoes.vezes)).toBe(
    1,
  );
});

test('com a amostra, o PDF em A4 tem 1 página e os textos-chave', async ({ page }, info) => {
  await subirRelatorio(page);
  await page.emulateMedia({ media: 'print' });
  const folha = page.locator('section[data-folha]');
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
  writeFileSync(info.outputPath('folha.pdf'), pdf);
  expect(paginas(pdf)).toBe(1);
  // O texto do PDF do Chromium vem comprimido; os textos-chave são conferidos no mesmo DOM que gerou o PDF.
  const texto = await folha.innerText();
  for (const chave of [
    t.titulo,
    textos.topo.tipoDia.semana,
    t.colunas.antes,
    t.colunas.depois,
    t.apoios,
    t.media,
    t.gerado('127.0.0.1:3010'),
  ])
    expect(texto).toContain(chave);
  expect(texto).toMatch(/ apoia \d+ leitos? do /);
  expect(texto).not.toContain(textos.imprimir.botao);
});
