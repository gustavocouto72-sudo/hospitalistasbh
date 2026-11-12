// Serve a pasta out/ (o site estático do `next build`) na porta 3010, só em 127.0.0.1, para o teste ponta a
// ponta. Sem dependência: o Next 16 não aceita `next start` com `output: 'export'`.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const PORTA = 3010;
// Os mesmos cabeçalhos da Vercel (T-07.1), para o ponta a ponta rodar sob a CSP de produção.
const CABECALHOS = Object.fromEntries(
  JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'))
    .headers.filter((regra) => regra.source === '/(.*)')
    .flatMap((regra) => regra.headers.map(({ key, value }) => [key, value])),
);
const RAIZ = join(process.cwd(), 'out');
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function arquivoDe(url) {
  const caminho = normalize(decodeURIComponent(new URL(url, 'http://local').pathname));
  const alvo = join(RAIZ, caminho);
  if (alvo !== RAIZ && !alvo.startsWith(RAIZ + sep)) return null;
  for (const candidato of [alvo, join(alvo, 'index.html'), `${alvo}.html`]) {
    if (existsSync(candidato) && statSync(candidato).isFile()) return candidato;
  }
  return null;
}

createServer((pedido, resposta) => {
  const arquivo = arquivoDe(pedido.url ?? '/');
  if (!arquivo) {
    resposta.writeHead(404, { ...CABECALHOS, 'content-type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    return;
  }
  resposta.writeHead(200, { ...CABECALHOS, 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' });
  createReadStream(arquivo).pipe(resposta);
}).listen(PORTA, '127.0.0.1', () => process.stdout.write(`out/ em http://127.0.0.1:${PORTA}\n`));
