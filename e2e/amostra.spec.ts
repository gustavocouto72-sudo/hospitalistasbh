/**
 * Ponta a ponta da SPEC-05 com a fixture sintética da amostra: subir o relatório, ver cartões, resumo e
 * sugestão, editar médicos, aceitar um apoio e alternar Antes/Depois, sem rolagem horizontal e sem nada
 * guardado depois de recarregar.
 */
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { textos } from '../src/textos';

const FIXTURE = resolve(process.cwd(), 'test/fixtures/relatorio-9998-latin1.xls');
const t = textos.apoio.lista;

test.beforeEach(async ({ page }) => {
  // Quinta-feira, 12/11/2026: o padrão é dia de semana.
  await page.clock.setFixedTime(new Date('2026-11-12T09:00:00-03:00'));
});

async function subir(page: Page) {
  await page.goto('/');
  const seletor = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: textos.subir.escolher }).click();
  await (await seletor).setFiles(FIXTURE);
  await expect(page.getByText(/postos lidos\./)).toBeVisible();
}

const cartao = (page: Page, setor: string) => page.locator(`article[data-setor="${setor}"]`);
const porMedico = (page: Page, setor: string) =>
  cartao(page, setor).getByText(textos.cartao.porMedico).locator('xpath=preceding-sibling::span[1]');

async function semRolagemHorizontal(page: Page) {
  const larguras = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth,
  }));
  expect(larguras.pagina).toBeLessThanOrEqual(larguras.janela);
}

test('da amostra subida até a sugestão de apoio, editando e aceitando', async ({ page }) => {
  const inicio = Date.now();
  await subir(page);

  await expect(page.getByRole('heading', { name: textos.resumo.titulo })).toBeVisible();
  await expect(page.getByRole('heading', { name: t.titulo })).toBeVisible();
  const apoios = page.locator('li[data-apoio]');
  await expect(apoios.first()).toBeVisible();
  expect(Date.now() - inicio).toBeLessThan(60_000);
  await semRolagemHorizontal(page);

  // Editar médicos recalcula na hora.
  await expect(porMedico(page, '4.3')).toHaveText('11,5');
  await cartao(page, '4.3')
    .getByRole('button', { name: textos.cartao.maisMedico('4.3') })
    .click();
  await expect(porMedico(page, '4.3')).toHaveText('9,2');
  await cartao(page, '4.3')
    .getByRole('button', { name: textos.cartao.menosMedico('4.3') })
    .click();
  await expect(porMedico(page, '4.3')).toHaveText('11,5');

  // Aceitar o primeiro apoio e ver o Depois.
  const primeiro = apoios.first();
  const [de, para] = ((await primeiro.getAttribute('data-apoio')) ?? '').split('→') as [string, string];
  const antes = await porMedico(page, para).textContent();
  await primeiro.getByRole('button', { name: /^Aceitar: / }).click();
  await expect(page.locator(`li[data-apoio="${de}→${para}"]`).getByText(t.aceito, { exact: true })).toBeVisible();

  await page.getByText(t.vista.depois, { exact: true }).click();
  await expect(porMedico(page, para)).not.toHaveText(antes ?? '');
  await page.getByText(t.vista.antes, { exact: true }).click();
  await expect(porMedico(page, para)).toHaveText(antes ?? '');
  await semRolagemHorizontal(page);

  // Recarregar zera tudo: nada das contagens fica no aparelho.
  await page.reload();
  await expect(page.getByText(/postos lidos\./)).toHaveCount(0);
  await expect(page.locator('article[data-setor]')).toHaveCount(0);
  const guardado = await page.evaluate(() => localStorage.length + sessionStorage.length);
  expect(guardado).toBe(0);
});

test('nada sai do navegador ao ler a amostra', async ({ page }) => {
  const externos: string[] = [];
  const posts: string[] = [];
  page.on('request', (pedido) => {
    if (!pedido.url().startsWith('http://127.0.0.1:3010/')) externos.push(pedido.url());
    if (pedido.method() !== 'GET') posts.push(pedido.url());
  });
  await subir(page);
  await expect(page.locator('li[data-apoio]').first()).toBeVisible();
  expect(externos).toEqual([]);
  expect(posts).toEqual([]);
});

test('o teclado alcança os botões − e + com rótulo', async ({ page }) => {
  await subir(page);
  const mais = cartao(page, '4.3').getByRole('button', { name: textos.cartao.maisMedico('4.3') });
  await mais.focus();
  await page.keyboard.press('Enter');
  await expect(porMedico(page, '4.3')).toHaveText('9,2');
});
