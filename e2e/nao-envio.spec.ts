/**
 * T-07.2 (SPEC-07): nada do relatório sai do navegador. A vigia registra, no contexto inteiro (página, workers
 * e janelas novas), toda requisição para outra origem, todo pedido que não seja GET, todo WebSocket e toda
 * violação da CSP, que é onde o navegador barra um envio antes de ele chegar à rede. Requisições para outra
 * origem são também abortadas, para que nada saia mesmo se a CSP faltar. Os dois últimos testes provam que a
 * vigia pega um envio de verdade, com e sem a CSP.
 */
import { resolve } from 'node:path';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { textos } from '../src/textos';

const ORIGEM = 'http://127.0.0.1:3010';
const FIXTURES = ['relatorio-9998-latin1.xls', 'relatorio-9998-utf8-bom.xls', 'relatorio-9998-ponto-e-virgula.csv'];
const EXTERNO = 'https://exemplo.invalid/coleta';

const daPropriaOrigem = (url: string) =>
  url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === ORIGEM;

async function vigiarSaidas(context: BrowserContext, page: Page) {
  const saidas: string[] = [];
  await context.route(
    (url) => !daPropriaOrigem(url.href),
    (rota) => {
      saidas.push(`rota ${rota.request().method()} ${rota.request().url()}`);
      return rota.abort('blockedbyclient');
    },
  );
  context.on('request', (pedido) => {
    if (!daPropriaOrigem(pedido.url())) saidas.push(`requisição ${pedido.method()} ${pedido.url()}`);
    else if (pedido.method() !== 'GET') saidas.push(`envio ${pedido.method()} ${pedido.url()}`);
  });
  page.on('websocket', (ws) => saidas.push(`websocket ${ws.url()}`));
  await page.exposeFunction('registrarSaidaBarrada', (v: string) => saidas.push(`csp ${v}`));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { registrarSaidaBarrada: (v: string) => void }).registrarSaidaBarrada(
        `${e.violatedDirective} ${e.blockedURI}`,
      );
    });
  });
  return saidas;
}

async function subir(page: Page, fixture: string) {
  await page.goto('/');
  const seletor = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: textos.subir.escolher }).click();
  await (await seletor).setFiles(resolve(process.cwd(), 'test/fixtures', fixture));
  await expect(page.getByText(/postos lidos\./)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // Quinta-feira, 12/11/2026: o padrão é dia de semana.
  await page.clock.setFixedTime(new Date('2026-11-12T09:00:00-03:00'));
});

for (const fixture of FIXTURES) {
  test(`nenhuma requisição para outra origem depois de subir ${fixture}`, async ({ context, page }) => {
    const saidas = await vigiarSaidas(context, page);
    await page.addInitScript(() => {
      window.print = () => undefined;
    });
    await subir(page, fixture);

    // Todo o uso depois da subida: editar médicos, aceitar apoios, alternar a vista e imprimir.
    const cartao = page.locator('article[data-setor="4.3"]');
    await cartao.getByRole('button', { name: textos.cartao.maisMedico('4.3') }).click();
    await cartao.getByRole('button', { name: textos.cartao.menosMedico('4.3') }).click();
    const aceitar = page.getByRole('button', { name: /^Aceitar: / });
    while ((await aceitar.count()) > 0) await aceitar.first().click();
    await page.getByText(textos.apoio.lista.vista.depois, { exact: true }).click();
    await page.getByRole('button', { name: textos.imprimir.botao }).click();
    await page.waitForLoadState('networkidle');

    expect(saidas).toEqual([]);
  });
}

test('a vigia pega um envio para outra origem que a CSP barra', async ({ context, page }) => {
  const saidas = await vigiarSaidas(context, page);
  await subir(page, FIXTURES[0]!);
  await page.evaluate((url) => {
    void fetch(url, { method: 'POST', body: 'x' }).catch(() => undefined);
    navigator.sendBeacon(url, 'x');
    new Image().src = url;
  }, EXTERNO);
  await expect.poll(() => saidas.filter((s) => s.startsWith('csp ')).length).toBe(3);
  expect(saidas).toContain(`csp connect-src ${EXTERNO}`);
  expect(saidas).toContain(`csp img-src ${EXTERNO}`);
  expect(saidas.every((s) => s.endsWith(EXTERNO))).toBe(true);
});

test.describe('sem a CSP', () => {
  test.use({ bypassCSP: true });

  test('a vigia pega e aborta o envio para outra origem', async ({ context, page }) => {
    const saidas = await vigiarSaidas(context, page);
    await subir(page, FIXTURES[0]!);
    const chegou = await page.evaluate(
      (url) =>
        fetch(url, { method: 'POST', body: 'x' }).then(
          () => true,
          () => false,
        ),
      EXTERNO,
    );
    expect(chegou).toBe(false);
    expect(saidas).toContain(`rota POST ${EXTERNO}`);
    expect(saidas).toContain(`requisição POST ${EXTERNO}`);
  });
});
