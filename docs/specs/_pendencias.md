# Pendências para o dono decidir

## T-01.1 — `next start` com `output: 'export'`

O aceite pede `next start -p 3010` no `package.json`, e o script está lá. Só que o Next 16 recusa
`next start` quando `output: 'export'` está ligado ("next start does not work with output: export").
Para ver o `out/` localmente seria preciso servir a pasta estática (por exemplo, um script `preview`
com um servidor estático na 3010), o que pede uma dependência a mais. Fica como está até decidir.

## Node local

O projeto fixa Node 24.22.1 (`engines` e `.nvmrc`, como no OncoWay), mas a máquina roda Node 26,
então o pnpm avisa "Unsupported engine". O build e o dev funcionam assim mesmo.

## T-01.1 — `lint` e `test` antecipados da T-01.2

A verificação do loop roda `pnpm lint` e `pnpm test` em toda task, então a T-01.1 já traz o ESLint
(recomendado do JS e do typescript-eslint, versões do OncoWay), o Vitest e o teste-sentinela em
`src/calculo/`. A T-01.2 fica com o Prettier e o que mais faltar do padrão do OncoWay.

## T-01.1 (rodada 2)

- `next start -p 3010` não funciona com `output: 'export'` no Next 16 (script presente como pede o aceite; registrado em _pendencias.md) (package.json)
- Node local 26 diverge do fixado 24.22.1 e o pnpm avisa 'Unsupported engine' (.nvmrc)
- AGENTS.md gerado automaticamente pelo next dev entrou no diff (AGENTS.md)
