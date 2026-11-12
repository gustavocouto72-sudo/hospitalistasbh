/**
 * Ponta a ponta com a fixture sintética da amostra: subir o relatório, ler a planilha e a recomendação,
 * editar médicos, mexer num apoio e ver a coluna "Com apoio" mudar, sem rolagem horizontal da página e sem
 * nada guardado depois de recarregar.
 */
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { textos } from '../src/textos';

const FIXTURE = resolve(process.cwd(), 'test/fixtures/relatorio-9998-latin1.xls');

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

const linha = (page: Page, setor: string) => page.locator(`main tr[data-setor="${setor}"]`);
const porMedico = (page: Page, setor: string) => linha(page, setor).locator('[data-coluna="por-medico"]');
const comApoio = (page: Page, setor: string) => linha(page, setor).locator('[data-coluna="com-apoio"] [data-valor]');

async function semRolagemHorizontal(page: Page) {
  const larguras = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth,
  }));
  expect(larguras.pagina).toBeLessThanOrEqual(larguras.janela);
}

test('da amostra subida até a recomendação de apoio, editando', async ({ page }) => {
  const inicio = Date.now();
  await subir(page);

  await expect(page.getByRole('heading', { name: textos.recomendacao.titulo })).toBeVisible();
  const apoios = page.locator('li[data-apoio]');
  await expect(apoios.first()).toBeVisible();
  expect(Date.now() - inicio).toBeLessThan(60_000);
  await semRolagemHorizontal(page);

  // Editar médicos recalcula na hora.
  await expect(porMedico(page, '4.3')).toHaveText('11,5');
  await expect(linha(page, '4.3').locator('[data-coluna="situacao"]')).toHaveText(textos.semaforo.amarelo);
  await linha(page, '4.3')
    .getByRole('button', { name: textos.cartao.maisMedico('4.3') })
    .click();
  await expect(porMedico(page, '4.3')).toHaveText('9,2');
  await linha(page, '4.3')
    .getByRole('button', { name: textos.cartao.menosMedico('4.3') })
    .click();
  await expect(porMedico(page, '4.3')).toHaveText('11,5');

  // A recomendação já vale na coluna "Com apoio"; remover o apoio devolve a carga sem apoio.
  const primeiro = apoios.first();
  const [de, para] = ((await primeiro.getAttribute('data-apoio')) ?? '').split('→') as [string, string];
  const semApoio = (await porMedico(page, para).textContent()) ?? '';
  await expect(comApoio(page, para)).not.toHaveText(semApoio);
  await primeiro.getByRole('button', { name: /^Remover: / }).click();
  await expect(page.locator(`li[data-apoio="${de}→${para}"]`)).toHaveCount(0);
  await expect(comApoio(page, para)).toHaveText(semApoio);
  await semRolagemHorizontal(page);

  // Recarregar zera tudo: nada das contagens fica no aparelho.
  await page.reload();
  await expect(page.getByText(/postos lidos\./)).toHaveCount(0);
  await expect(page.locator('li[data-apoio]')).toHaveCount(0);
  await expect(porMedico(page, '4.3')).toHaveText('—');
  const guardado = await page.evaluate(() => localStorage.length + sessionStorage.length);
  expect(guardado).toBe(0);
});

// O não-envio fica em nao-envio.spec.ts (T-07.2).

test('o teclado alcança os botões − e + com rótulo', async ({ page }) => {
  await subir(page);
  const mais = linha(page, '4.3').getByRole('button', { name: textos.cartao.maisMedico('4.3') });
  await mais.focus();
  await page.keyboard.press('Enter');
  await expect(porMedico(page, '4.3')).toHaveText('9,2');
});
