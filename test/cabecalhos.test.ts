import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// T-07.1 (SPEC-07): os cabeçalhos de segurança da Vercel. A CSP é a garantia, no próprio navegador, de que
// nenhum dado do relatório sai dele: só a própria origem pode receber conexões.
type Cabecalho = { key: string; value: string };
type Regra = { source: string; headers: Cabecalho[] };

const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  headers?: Regra[];
};

function cabecalhosDoSite(): Map<string, string> {
  const regra = vercel.headers?.find((r) => r.source === '/(.*)');
  expect(regra, 'regra de cabeçalhos para todas as rotas').toBeDefined();
  return new Map(regra!.headers.map((c) => [c.key.toLowerCase(), c.value]));
}

function diretivas(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((partes) => partes[0])
      .map(([nome, ...valores]) => [nome!, valores]),
  );
}

describe('T-07.1 — cabeçalhos e CSP', () => {
  const cabecalhos = cabecalhosDoSite();
  const csp = diretivas(cabecalhos.get('content-security-policy') ?? '');

  it('bloqueia qualquer conexão fora da própria origem', () => {
    expect(csp.get('connect-src')).toEqual(["'self'"]);
    expect(csp.get('default-src')).toEqual(["'self'"]);
  });

  it('não libera domínio de terceiros, curinga nem esquema remoto em nenhuma diretiva', () => {
    expect(csp.size).toBeGreaterThan(0);
    for (const [nome, valores] of csp) {
      for (const valor of valores) {
        expect(valor, `${nome} ${valor}`).toMatch(/^('[a-z-]+'|data:|blob:)$/);
      }
    }
  });

  it('fecha formulários, base, objetos e molduras', () => {
    expect(csp.get('form-action')).toEqual(["'none'"]);
    expect(csp.get('base-uri')).toEqual(["'none'"]);
    expect(csp.get('object-src')).toEqual(["'none'"]);
    expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
    expect(csp.get('script-src')).not.toContain("'unsafe-eval'");
  });

  it('traz os demais cabeçalhos da spec', () => {
    expect(cabecalhos.get('referrer-policy')).toBe('no-referrer');
    expect(cabecalhos.get('x-content-type-options')).toBe('nosniff');
    expect(cabecalhos.get('x-frame-options')).toBe('DENY');
    expect(cabecalhos.get('strict-transport-security')).toMatch(/max-age=\d{8,}/);
  });

  it('a Permissions-Policy desliga os recursos sensíveis do aparelho', () => {
    const politica = cabecalhos.get('permissions-policy') ?? '';
    for (const recurso of ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'browsing-topics']) {
      expect(politica).toMatch(new RegExp(`(^|, )${recurso}=\\(\\)(,|$)`));
    }
  });
});
