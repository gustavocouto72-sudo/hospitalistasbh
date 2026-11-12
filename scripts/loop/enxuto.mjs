#!/usr/bin/env node
/**
 * Apoio do loop construir-enxuto do Compozy: uma task por geração, na ordem das specs.
 * Adaptado do OncoWay (ADR-0026), sem o ContextDevKit: o estado das tasks vive nos tasks.md de docs/specs.
 *
 *   node scripts/loop/enxuto.mjs proxima      escolhe a próxima task elegível e a marca [~]; sai 1 se não houver
 *   node scripts/loop/enxuto.mjs tarefa       imprime o brief da task da vez (spec, aceite, achados anteriores)
 *   node scripts/loop/enxuto.mjs registrar --revisao '<json>'
 *                                             aprovada: [x] e commit na main; reprovada: guarda os achados
 *                                             e, na terceira rodada, marca [!] e guarda o parcial em refs/enxuto/
 *   node scripts/loop/enxuto.mjs terminado    sai 0 quando não há mais task elegível
 *   node scripts/loop/enxuto.mjs listar       mostra o status de todas as tasks
 *
 * Status no tasks.md: [ ] a fazer · [~] em andamento · [x] feita · [!] bloqueada.
 * O estado da rodada fica em .git/enxuto/estado.json.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const TETO = 3;
const MARCA = { ' ': 'backlog', '~': 'working', x: 'done', '!': 'blocked' };
const SIMBOLO = { backlog: ' ', working: '~', done: 'x', blocked: '!' };
const RAIZ = process.cwd();
const SPECS = join(RAIZ, 'docs', 'specs');

/** Lê um tasks.md e devolve as tasks com status, dependências e critérios de aceite. */
export function lerTasks(texto, arquivo = '') {
  const linhas = texto.split('\n');
  const tasks = [];
  let atual = null;
  let emAceite = false;
  for (const linha of linhas) {
    const t = /^- \[( |~|x|!)\] \*\*(T-\d+\.\d+) — (.+?)\*\*\s*$/.exec(linha);
    if (t) {
      atual = { id: t[2], titulo: t[3], status: MARCA[t[1]], dependsOn: [], aceite: [], notas: [], arquivo };
      tasks.push(atual);
      emAceite = false;
      continue;
    }
    if (!atual) continue;
    const dep = /^ {2}- Depende de: (.+)$/.exec(linha);
    if (dep) { atual.dependsOn = dep[1].split(',').map((s) => s.trim()).filter((s) => /^T-\d+\.\d+$/.test(s)); emAceite = false; continue; }
    if (/^ {2}- Aceite:/.test(linha)) { emAceite = true; continue; }
    const item = /^ {4}- (.+)$/.exec(linha);
    if (item && emAceite) { atual.aceite.push(item[1]); continue; }
    const nota = /^ {2}- (.+)$/.exec(linha);
    if (nota) { atual.notas.push(nota[1]); emAceite = false; }
  }
  return tasks;
}

const chave = (id) => id.slice(2).split('.').map(Number);
export const ordenar = (tasks) => [...tasks].sort((a, b) => { const [x1, y1] = chave(a.id); const [x2, y2] = chave(b.id); return x1 - x2 || y1 - y2; });

/** A task em andamento, ou a primeira a fazer com todas as dependências feitas. */
export function escolher(tasks) {
  const status = new Map(tasks.map((t) => [t.id, t.status]));
  const viva = tasks.find((t) => t.status === 'working');
  if (viva) return viva;
  return ordenar(tasks).find((t) => t.status === 'backlog' && t.dependsOn.every((d) => status.get(d) === 'done')) ?? null;
}

/** Troca o status de uma task no texto do tasks.md. */
export function marcar(texto, id, status, nota) {
  const re = new RegExp(`^- \\[( |~|x|!)\\] (\\*\\*${id.replace('.', '\\.')} — .+\\*\\*)$`, 'm');
  if (!re.test(texto)) throw new Error(`task ${id} não encontrada`);
  let novo = texto.replace(re, `- [${SIMBOLO[status]}] $2`);
  if (nota) novo = novo.replace(new RegExp(`(^- \\[.\\] \\*\\*${id.replace('.', '\\.')} — .+\\*\\*$)`, 'm'), `$1\n  - ${nota}`);
  return novo;
}

// ---------------------------------------------------------------------------------------------------------------
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, cwd: RAIZ, ...opts });
const git = (...a) => sh('git', a).trim();
const ESTADO = () => join(git('rev-parse', '--path-format=absolute', '--git-dir'), 'enxuto', 'estado.json');
const lerEstado = () => (existsSync(ESTADO()) ? JSON.parse(readFileSync(ESTADO(), 'utf8')) : null);
const gravarEstado = (e) => { mkdirSync(dirname(ESTADO()), { recursive: true }); writeFileSync(ESTADO(), `${JSON.stringify(e, null, 2)}\n`); };
const opcao = (argv, nome) => { const i = argv.indexOf(`--${nome}`); return i >= 0 ? argv[i + 1] : undefined; };

function todas() {
  return readdirSync(SPECS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('SPEC-'))
    .flatMap((d) => { const f = join(SPECS, d.name, 'tasks.md'); return existsSync(f) ? lerTasks(readFileSync(f, 'utf8'), f) : []; });
}
function mudar(t, status, nota) { writeFileSync(t.arquivo, marcar(readFileSync(t.arquivo, 'utf8'), t.id, status, nota)); }
const pastaDaSpec = (t) => dirname(t.arquivo);

function proxima() {
  const tasks = todas();
  const t = escolher(tasks);
  if (!t) { console.log(JSON.stringify({ tarefa: null, motivo: motivoSemTarefa(tasks) })); return 1; }
  if (t.status === 'backlog') mudar(t, 'working');
  const e = lerEstado();
  if (e?.tarefa !== t.id) gravarEstado({ tarefa: t.id, rodada: 1, achados: [] });
  console.log(JSON.stringify({ tarefa: t.id, titulo: t.titulo, rodada: lerEstado().rodada }));
  return 0;
}

function motivoSemTarefa(tasks) {
  const abertas = tasks.filter((t) => t.status !== 'done');
  if (!abertas.length) return 'todas as tasks estão feitas';
  return `sem task elegível; abertas: ${abertas.map((t) => `${t.id} (${t.status})`).join(', ')}`;
}

function tarefa() {
  const e = lerEstado();
  if (!e) { console.log('Nenhuma task em execução.'); return 1; }
  const t = todas().find((x) => x.id === e.tarefa);
  const pasta = pastaDaSpec(t);
  const linhas = [
    `# ${t.id}: ${t.titulo}`, '',
    `Rodada ${e.rodada} de ${TETO}.`,
    `Spec: ${join(pasta, 'spec.md')} (leia inteira). Lista de tasks: ${t.arquivo}. PRD: docs/prd.md. Regras: CLAUDE.md.`,
    `Depende de: ${t.dependsOn.join(', ') || '—'} (já feitas).`, '',
    '## Critérios de aceite', '', ...t.aceite.map((a, i) => `${i + 1}. ${a}`), '',
    ...(t.notas.length ? ['## Notas', '', ...t.notas.map((n) => `- ${n}`), ''] : []),
    ...(e.achados.length ? ['## Achados da revisão anterior, a corrigir', '', ...e.achados.map((a) => `- ${a.titulo}${a.arquivo ? ` (${a.arquivo})` : ''}: ${a.detalhe ?? ''}`), ''] : []),
  ];
  console.log(linhas.join('\n'));
  return 0;
}

/** Verificações que o registrar roda antes de aceitar a task. As de pnpm só valem depois que o app existe. */
export function verificacoes(pkg) {
  const lista = ['git add -A && gitleaks git --pre-commit --staged --redact --no-banner'];
  const scripts = pkg?.scripts ?? {};
  for (const s of ['typecheck', 'lint', 'test']) if (scripts[s]) lista.push(`pnpm -s ${s}`);
  return lista;
}

function rodar(cmd) {
  try { sh('sh', ['-c', cmd], { stdio: 'pipe', timeout: 600_000 }); return null; } catch (e) { return `${String(e.stdout ?? '').slice(-1500)}${String(e.stderr ?? '').slice(-500)}`; }
}

function commitar(mensagem) {
  git('add', '-A');
  const corpo = `${mensagem}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  try { sh('git', ['commit', '-q', '--no-verify', '-m', corpo], { stdio: 'pipe' }); } catch (e) { return `commit recusado: ${String(e.stdout ?? '')}${String(e.stderr ?? '')}`.slice(0, 1500); }
  return null;
}

function registrar(argv) {
  const e = lerEstado();
  if (!e) { console.log('sem task em execução'); return 1; }
  let rev;
  try { rev = JSON.parse(opcao(argv, 'revisao') ?? ''); } catch { rev = { aprovado: false, bloqueantes: [{ titulo: 'revisão ilegível' }] }; }
  const bloqueantes = [...(rev.bloqueantes ?? [])];
  const pkgPath = join(RAIZ, 'package.json');
  const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : null;
  for (const c of verificacoes(pkg)) { const f = rodar(c); if (f !== null) bloqueantes.push({ titulo: `falhou: ${c}`, detalhe: f }); }
  for (const v of rev.verificacoes ?? []) if (v.ok === false) bloqueantes.push({ titulo: `verificação falhou: ${v.comando}`, detalhe: v.saida ?? '' });
  const t = todas().find((x) => x.id === e.tarefa);

  if (rev.aprovado === true && !bloqueantes.length) {
    if (rev.baixos?.length) appendFileSync(join(SPECS, '_pendencias.md'), `\n## ${t.id} (rodada ${e.rodada})\n\n${rev.baixos.map((b) => `- ${b.titulo}${b.arquivo ? ` (${b.arquivo})` : ''}`).join('\n')}\n`);
    mudar(t, 'done');
    rmSync(ESTADO(), { force: true });
    const erro = commitar(`feat: ${t.id} ${t.titulo}`);
    if (erro) { console.log(erro); return 1; }
    console.log(JSON.stringify({ feita: t.id, commit: git('rev-parse', '--short', 'HEAD') }));
    return 0;
  }
  if (e.rodada < TETO) {
    gravarEstado({ ...e, rodada: e.rodada + 1, achados: bloqueantes });
    console.log(JSON.stringify({ reprovada: t.id, rodada: e.rodada, proxima: e.rodada + 1, achados: bloqueantes.length }));
    return 0;
  }
  // Esgotada: guarda o parcial num ref, limpa a árvore e marca a task como bloqueada.
  const temHead = (() => { try { git('rev-parse', 'HEAD'); return true; } catch { return false; } })();
  let parcial = 'sem-commit';
  if (temHead) {
    const indice = join(mkdtempSync(join(tmpdir(), 'enxuto-')), 'index');
    const env = { ...process.env, GIT_INDEX_FILE: indice };
    sh('git', ['read-tree', 'HEAD'], { env }); sh('git', ['add', '-A'], { env });
    const arvore = sh('git', ['write-tree'], { env }).trim();
    parcial = sh('git', ['commit-tree', arvore, '-p', 'HEAD', '-m', `parcial de ${t.id}`]).trim();
    git('update-ref', `refs/enxuto/${t.id}`, parcial);
    git('reset', '-q', '--hard', 'HEAD'); git('clean', '-fdq', '-e', 'node_modules');
  }
  const resumo = bloqueantes.map((b) => b.titulo).join('; ').slice(0, 400);
  mudar(t, 'blocked', `Bloqueada pelo loop: ${TETO} revisões sem aprovação; parcial em refs/enxuto/${t.id}; falta: ${resumo}`);
  rmSync(ESTADO(), { force: true });
  const erro = commitar(`chore: ${t.id} bloqueada depois de ${TETO} revisões`);
  if (erro) { console.log(erro); return 1; }
  console.log(JSON.stringify({ bloqueada: t.id, parcial }));
  return 0;
}

function terminado() {
  const tasks = todas();
  const t = escolher(tasks);
  console.log(JSON.stringify({ terminado: !t, motivo: t ? `próxima: ${t.id}` : motivoSemTarefa(tasks) }));
  return t ? 1 : 0;
}

function listar() {
  for (const t of ordenar(todas())) console.log(`${SIMBOLO[t.status] === ' ' ? '·' : SIMBOLO[t.status]} ${t.id} ${t.titulo}`);
  return 0;
}

const COMANDOS = { proxima, tarefa, registrar, terminado, listar };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...resto] = process.argv.slice(2);
  if (!COMANDOS[cmd]) { console.error(`Uso: enxuto.mjs <${Object.keys(COMANDOS).join('|')}>`); process.exit(2); }
  process.exitCode = COMANDOS[cmd](resto);
}
