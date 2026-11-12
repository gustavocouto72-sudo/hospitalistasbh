/**
 * T-07.1 (SPEC-07): o site roda sob a CSP do vercel.json, que o servidor estático do teste aplica igual à
 * Vercel. Subir a fixture e calcular não pode disparar nenhuma violação da política.
 */
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { textos } from '../src/textos';

const FIXTURE = resolve(process.cwd(), 'test/fixtures/relatorio-9998-latin1.xls');

test('a CSP de produção chega ao navegador e não bloqueia o site', async ({ page }) => {
  const violacoes: string[] = [];
  await page.exposeFunction('registrarViolacao', (v: string) => violacoes.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { registrarViolacao: (v: string) => void }).registrarViolacao(
        `${e.violatedDirective} ${e.blockedURI}`,
      );
    });
  });

  const resposta = await page.goto('/');
  expect(resposta?.headers()['content-security-policy']).toContain("connect-src 'self'");

  const seletor = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: textos.subir.escolher }).click();
  await (await seletor).setFiles(FIXTURE);
  await expect(page.getByText(/postos lidos\./)).toBeVisible();
  await expect(page.locator('article[data-setor]').first()).toBeVisible();

  expect(violacoes).toEqual([]);
});
