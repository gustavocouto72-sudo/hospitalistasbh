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

## T-01.2 — Prettier "no padrão do OncoWay"

O OncoWay não usa Prettier (não há config nem dependência), então não havia padrão a copiar. Ficou
o Prettier 3.9.10 com o estilo que o código já segue (aspas simples, ponto e vírgula, vírgula final,
linha de 120), o `eslint-config-prettier` por último no ESLint, `pnpm lint` rodando também
`prettier --check .` e `pnpm format` para corrigir. Markdown e `docs/` ficam fora do Prettier para não
reescrever as specs. Ajustar se o dono preferir outro estilo.

## T-01.2 (rodada 1)

- Teste de qualidade compara as strings exatas dos scripts; qualquer ajuste neles vai quebrar o teste (test/qualidade.test.ts)
- Prettier 'no padrão do OncoWay' não tinha referência a seguir; o estilo escolhido foi registrado em _pendencias.md para o dono validar (docs/specs/_pendencias.md)
- Markdown e docs/ fora do Prettier (intencional) (.prettierignore)

## T-01.4 (rodada 1)

- NOTICE cita os caminhos skill/reference/ios.md e android.md, mas na cópia eles ficam em impeccable/reference/ (.claude/skills/NOTICE-impeccable.md)
- Não foi possível comparar a cópia com a fonte do OncoWay, que não foi localizada nesta máquina (.claude/skills/impeccable)
- Status da task ainda em [~]; quem muda o status é o enxuto.mjs (docs/specs/SPEC-01-fundacao/tasks.md)

## T-01.5 (rodada 1)

- Teste da porta é pulado quando ~/Antigravity/PORTS.md não existe (ex.: CI) (test/segredos.test.ts)
- Pre-commit falha de propósito sem gitleaks instalado; pode atrapalhar contribuidores do repositório público (.githooks/pre-commit)
- Regra de CPF só pega o formato com pontuação (.gitleaks.toml)

## T-02.1 — Números por posto da amostra de 12/11/2026

A amostra original não está no repositório nem nesta máquina, e só os totais aparecem no PRD e na
spec. As fixtures em `test/fixtures/` usam números **sintéticos** que mantêm o que se conhece: o
cabeçalho, 12 postos (2.3 e 4.1 zerados), 180 pacientes dos hospitalistas, 35 da cardiologia e geriatria
e os fatores entregues (21 médicos na semana, 10 no fim de semana; 2.3 = 1 e 4.1 = 2,5; 6.x = 2 e 1).
O total de potenciais admissões (15) e a divisão por posto foram inventados. Se o dono quiser os
números exatos de cada posto, basta trocar a tabela `LINHAS` em `test/fixtures/gerar.ts` e rodar
`node test/fixtures/gerar.ts`; os nomes dos postos não identificam ninguém.

## T-02.1 (rodada 1)

- Números por posto e total de potenciais admissões (15) são inventados porque a amostra real não está disponível; está registrado em _pendencias.md e os totais conhecidos foram mantidos (test/fixtures/gerar.ts)

## T-02.2 — UTF-8 sem BOM

A spec manda decodificar em Latin-1 e usar UTF-8 só com BOM, mas a fixture
`relatorio-9998-virgula.csv` da T-02.1 é UTF-8 sem BOM, como sai de muitas planilhas. Lida como
Latin-1, ela teria os acentos quebrados ("InternaÃ§Ã£o"). A decodificação continua em Latin-1 por
padrão e usa UTF-8 com BOM. Sem BOM, também usa UTF-8 quando há bytes acima de 0x7F e todos formam
UTF-8 válido, o que um Latin-1 acentuado praticamente nunca faz. Se o dono preferir a regra estrita,
basta tirar esse ramo e trocar a fixture por Latin-1.

## T-02.2 (rodada 1)

- Heurística extra de UTF-8 sem BOM vai além da spec (documentada em _pendencias.md) (src/relatorio/decodificar.ts)
- Parâmetro `nome` de decodificarRelatorio não é usado (src/relatorio/decodificar.ts)
